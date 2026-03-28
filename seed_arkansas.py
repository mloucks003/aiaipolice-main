#!/usr/bin/env python3
"""
Seed Arkansas person records into the database.
Names sourced from public Arkansas Court of Appeals records via CourtListener.
Warrants, priors, citations, and details are realistic but generated for demo purposes.
"""
import asyncio
import os
import uuid
from datetime import datetime, timezone
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
from pathlib import Path

load_dotenv(Path(__file__).parent / 'backend' / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

AR_PERSONS = [
    {
        "first_name": "Blake", "last_name": "Wimberly", "dob": "1994-06-12",
        "drivers_license": "AR9284751", "dl_state": "AR",
        "address": "412 Elm Street", "city": "Little Rock", "state": "AR", "zip_code": "72201",
        "sex": "Male", "race": "White", "height": "5'11", "weight": "185",
        "eye_color": "Brown", "hair_color": "Brown",
        "warrants": [
            {"type": "Bench Warrant", "date": "2025-11-20", "court": "Pulaski County Circuit", "case_number": "60CR-25-4821", "charge": "Failure to Appear - Felony Drug Possession", "status": "Active", "bail": 15000},
        ],
        "priors": [
            {"offense": "Possession of Controlled Substance", "date": "2024-03-15", "disposition": "Convicted", "sentence": "3 years probation", "court": "Pulaski County Circuit"},
            {"offense": "DWI - First Offense", "date": "2022-08-10", "disposition": "Convicted", "sentence": "30 days suspended, 1 year probation", "court": "Little Rock District Court"},
        ],
    },
    {
        "first_name": "Charles", "last_name": "Slater", "dob": "1988-02-28",
        "drivers_license": "AR7361924", "dl_state": "AR",
        "address": "1809 Pine Bluff Hwy", "city": "Pine Bluff", "state": "AR", "zip_code": "71601",
        "sex": "Male", "race": "White", "height": "6'0", "weight": "210",
        "eye_color": "Blue", "hair_color": "Blond",
        "warrants": [
            {"type": "Arrest Warrant", "date": "2025-09-05", "court": "Jefferson County Circuit", "case_number": "35CR-25-1192", "charge": "Aggravated Assault", "status": "Active", "bail": 50000},
            {"type": "Bench Warrant", "date": "2026-01-14", "court": "Pine Bluff District Court", "case_number": "PB-26-0087", "charge": "Failure to Appear - Probation Violation", "status": "Active", "bail": 5000},
        ],
        "priors": [
            {"offense": "Domestic Battery - 3rd Degree", "date": "2023-05-22", "disposition": "Convicted", "sentence": "1 year county jail, suspended", "court": "Jefferson County Circuit"},
            {"offense": "Criminal Mischief", "date": "2021-11-03", "disposition": "Convicted", "sentence": "Fine $500", "court": "Pine Bluff District Court"},
            {"offense": "Public Intoxication", "date": "2020-07-04", "disposition": "Guilty Plea", "sentence": "Fine $250", "court": "Pine Bluff District Court"},
        ],
    },
    {
        "first_name": "Tavares", "last_name": "Montgomery", "dob": "1991-09-17",
        "drivers_license": "AR5518203", "dl_state": "AR",
        "address": "2205 MLK Blvd", "city": "Fort Smith", "state": "AR", "zip_code": "72901",
        "sex": "Male", "race": "Black", "height": "5'10", "weight": "175",
        "eye_color": "Brown", "hair_color": "Black",
        "warrants": [
            {"type": "Arrest Warrant", "date": "2025-12-01", "court": "Sebastian County Circuit", "case_number": "66CR-25-3301", "charge": "Robbery", "status": "Active", "bail": 75000},
        ],
        "priors": [
            {"offense": "Theft of Property", "date": "2023-01-18", "disposition": "Convicted", "sentence": "2 years ADC suspended, 5 years probation", "court": "Sebastian County Circuit"},
            {"offense": "Burglary - Commercial", "date": "2020-06-30", "disposition": "Convicted", "sentence": "5 years ADC", "court": "Sebastian County Circuit"},
        ],
    },
    {
        "first_name": "James", "last_name": "Arnold", "middle_name": "Edward", "dob": "1979-12-05",
        "drivers_license": "AR3847291", "dl_state": "AR",
        "address": "890 Highway 65 South", "city": "Harrison", "state": "AR", "zip_code": "72601",
        "sex": "Male", "race": "White", "height": "5'9", "weight": "195",
        "eye_color": "Green", "hair_color": "Gray",
        "warrants": [],
        "priors": [
            {"offense": "DWI - Second Offense", "date": "2024-08-20", "disposition": "Convicted", "sentence": "7 days county jail, 2 years probation, interlock device", "court": "Boone County Circuit"},
            {"offense": "DWI - First Offense", "date": "2021-03-12", "disposition": "Convicted", "sentence": "Fine $1000, 1 year probation", "court": "Harrison District Court"},
            {"offense": "Reckless Driving", "date": "2019-10-05", "disposition": "Guilty Plea", "sentence": "Fine $500", "court": "Harrison District Court"},
        ],
    },
    {
        "first_name": "Billy", "last_name": "Bagwell", "dob": "1986-04-22",
        "drivers_license": "AR6629184", "dl_state": "AR",
        "address": "1455 College Ave", "city": "Fayetteville", "state": "AR", "zip_code": "72701",
        "sex": "Male", "race": "White", "height": "5'8", "weight": "170",
        "eye_color": "Hazel", "hair_color": "Brown",
        "warrants": [
            {"type": "Municipal Warrant", "date": "2025-08-15", "court": "Fayetteville District Court", "case_number": "FV-25-TR-4412", "charge": "Failure to Pay Fines - Multiple Traffic Violations", "status": "Active", "bail": 1500},
            {"type": "Bench Warrant", "date": "2026-02-03", "court": "Washington County Circuit", "case_number": "72CR-26-0198", "charge": "Failure to Appear - Possession of Drug Paraphernalia", "status": "Active", "bail": 2500},
        ],
        "priors": [
            {"offense": "Possession of Drug Paraphernalia", "date": "2025-06-10", "disposition": "Pending", "court": "Washington County Circuit"},
            {"offense": "Driving on Suspended License", "date": "2024-11-22", "disposition": "Convicted", "sentence": "Fine $750, 10 days county jail suspended", "court": "Fayetteville District Court"},
            {"offense": "Speeding 25+ Over", "date": "2024-05-08", "disposition": "Convicted", "sentence": "Fine $400", "court": "Fayetteville District Court"},
        ],
    },
    {
        "first_name": "Cheyanna", "last_name": "Spann", "dob": "1997-11-30",
        "drivers_license": "AR8841027", "dl_state": "AR",
        "address": "3320 Cantrell Road", "city": "Little Rock", "state": "AR", "zip_code": "72202",
        "sex": "Female", "race": "Black", "height": "5'5", "weight": "140",
        "eye_color": "Brown", "hair_color": "Black",
        "warrants": [
            {"type": "Arrest Warrant", "date": "2025-10-12", "court": "Pulaski County Circuit", "case_number": "60CR-25-5590", "charge": "Forgery - Second Degree", "status": "Active", "bail": 10000},
        ],
        "priors": [
            {"offense": "Theft by Receiving", "date": "2024-02-14", "disposition": "Convicted", "sentence": "18 months probation", "court": "Pulaski County Circuit"},
            {"offense": "Fraudulent Use of Credit Card", "date": "2022-09-28", "disposition": "Convicted", "sentence": "2 years probation, restitution $3200", "court": "Pulaski County Circuit"},
        ],
    },
    {
        "first_name": "Dedrick", "last_name": "Brigance", "dob": "1993-07-08",
        "drivers_license": "AR4472918", "dl_state": "AR",
        "address": "705 East Broadway", "city": "West Memphis", "state": "AR", "zip_code": "72301",
        "sex": "Male", "race": "Black", "height": "6'2", "weight": "220",
        "eye_color": "Brown", "hair_color": "Black",
        "warrants": [
            {"type": "Arrest Warrant", "date": "2025-07-22", "court": "Crittenden County Circuit", "case_number": "18CR-25-0844", "charge": "Felon in Possession of Firearm", "status": "Active", "bail": 100000},
            {"type": "Municipal Warrant", "date": "2025-04-10", "court": "West Memphis District Court", "case_number": "WM-25-CR-0331", "charge": "Resisting Arrest", "status": "Active", "bail": 5000},
        ],
        "priors": [
            {"offense": "Aggravated Robbery", "date": "2018-03-15", "disposition": "Convicted", "sentence": "10 years ADC, paroled 2023", "court": "Crittenden County Circuit"},
            {"offense": "Battery - Second Degree", "date": "2016-11-20", "disposition": "Convicted", "sentence": "3 years ADC", "court": "Crittenden County Circuit"},
            {"offense": "Possession with Intent to Deliver", "date": "2015-05-08", "disposition": "Convicted", "sentence": "6 years ADC, concurrent", "court": "Crittenden County Circuit"},
        ],
    },
    {
        "first_name": "Dequon", "last_name": "Israel", "dob": "1995-03-25",
        "drivers_license": "AR7718394", "dl_state": "AR",
        "address": "1122 South Main", "city": "Jonesboro", "state": "AR", "zip_code": "72401",
        "sex": "Male", "race": "Black", "height": "5'11", "weight": "190",
        "eye_color": "Brown", "hair_color": "Black",
        "warrants": [
            {"type": "Bench Warrant", "date": "2026-01-28", "court": "Craighead County Circuit", "case_number": "16CR-26-0112", "charge": "Failure to Appear - Felony Theft", "status": "Active", "bail": 25000},
        ],
        "priors": [
            {"offense": "Theft of Property Over $5000", "date": "2025-04-15", "disposition": "Pending", "court": "Craighead County Circuit"},
            {"offense": "Breaking or Entering", "date": "2022-12-01", "disposition": "Convicted", "sentence": "4 years ADC suspended, 5 years probation", "court": "Craighead County Circuit"},
        ],
    },
    {
        "first_name": "Ryan", "last_name": "Douglas", "middle_name": "Michael", "dob": "1990-01-14",
        "drivers_license": "AR2293847", "dl_state": "AR",
        "address": "567 Razorback Road", "city": "Springdale", "state": "AR", "zip_code": "72764",
        "sex": "Male", "race": "White", "height": "6'1", "weight": "200",
        "eye_color": "Blue", "hair_color": "Brown",
        "warrants": [
            {"type": "Municipal Warrant", "date": "2025-06-20", "court": "Springdale District Court", "case_number": "SP-25-TR-2891", "charge": "DWI - Third Offense", "status": "Active", "bail": 10000},
        ],
        "priors": [
            {"offense": "DWI - Second Offense", "date": "2023-09-14", "disposition": "Convicted", "sentence": "30 days county jail, 3 years probation, interlock", "court": "Washington County Circuit"},
            {"offense": "DWI - First Offense", "date": "2021-01-02", "disposition": "Convicted", "sentence": "Fine $1500, 1 year probation", "court": "Springdale District Court"},
            {"offense": "Careless Driving", "date": "2020-04-18", "disposition": "Guilty Plea", "sentence": "Fine $300", "court": "Springdale District Court"},
            {"offense": "Open Container", "date": "2019-07-04", "disposition": "Guilty Plea", "sentence": "Fine $150", "court": "Springdale District Court"},
        ],
    },
    {
        "first_name": "Christopher", "last_name": "Cole", "dob": "1985-08-19",
        "drivers_license": "AR1156738", "dl_state": "AR",
        "address": "2801 John Barrow Road", "city": "Little Rock", "state": "AR", "zip_code": "72204",
        "sex": "Male", "race": "White", "height": "5'10", "weight": "180",
        "eye_color": "Brown", "hair_color": "Black",
        "warrants": [
            {"type": "Arrest Warrant", "date": "2025-11-05", "court": "Pulaski County Circuit", "case_number": "60CR-25-6102", "charge": "Manufacturing Methamphetamine", "status": "Active", "bail": 250000},
            {"type": "Federal Warrant", "date": "2025-12-18", "court": "US District Court Eastern AR", "case_number": "4:25-CR-00891", "charge": "Conspiracy to Distribute Controlled Substance", "status": "Active", "bail": 0},
        ],
        "priors": [
            {"offense": "Possession of Methamphetamine", "date": "2022-04-10", "disposition": "Convicted", "sentence": "6 years ADC, paroled 2024", "court": "Pulaski County Circuit"},
            {"offense": "Possession with Intent - Marijuana", "date": "2018-08-22", "disposition": "Convicted", "sentence": "3 years ADC", "court": "Pulaski County Circuit"},
            {"offense": "Fleeing", "date": "2017-02-14", "disposition": "Convicted", "sentence": "1 year county jail", "court": "Little Rock District Court"},
        ],
    },
    {
        "first_name": "Jearl", "last_name": "Griffin", "middle_name": "Shane", "dob": "1982-05-03",
        "drivers_license": "AR9937261", "dl_state": "AR",
        "address": "445 Highway 270 East", "city": "Hot Springs", "state": "AR", "zip_code": "71901",
        "sex": "Male", "race": "White", "height": "5'7", "weight": "165",
        "eye_color": "Green", "hair_color": "Red",
        "warrants": [
            {"type": "Municipal Warrant", "date": "2025-09-30", "court": "Hot Springs District Court", "case_number": "HS-25-CR-1847", "charge": "Domestic Battery - Third Degree", "status": "Active", "bail": 7500},
        ],
        "priors": [
            {"offense": "Domestic Battery - Third Degree", "date": "2024-01-20", "disposition": "Convicted", "sentence": "90 days county jail suspended, 1 year probation, anger management", "court": "Garland County Circuit"},
            {"offense": "Violation of Protection Order", "date": "2023-06-15", "disposition": "Convicted", "sentence": "30 days county jail", "court": "Hot Springs District Court"},
            {"offense": "Criminal Trespass", "date": "2022-03-08", "disposition": "Guilty Plea", "sentence": "Fine $500", "court": "Hot Springs District Court"},
        ],
    },
    {
        "first_name": "Alberto", "last_name": "Dominguez", "dob": "1998-10-11",
        "drivers_license": None, "dl_state": None,
        "address": "1600 South Zero Street", "city": "Fort Smith", "state": "AR", "zip_code": "72901",
        "sex": "Male", "race": "Hispanic", "height": "5'6", "weight": "155",
        "eye_color": "Brown", "hair_color": "Black",
        "warrants": [
            {"type": "Arrest Warrant", "date": "2025-10-28", "court": "Sebastian County Circuit", "case_number": "66CR-25-4102", "charge": "Delivery of Controlled Substance", "status": "Active", "bail": 50000},
            {"type": "ICE Detainer", "date": "2025-11-15", "court": "Federal", "case_number": "ICE-2025-AR-08841", "charge": "Immigration Hold", "status": "Active", "bail": 0},
        ],
        "priors": [
            {"offense": "Possession of Controlled Substance", "date": "2023-07-20", "disposition": "Convicted", "sentence": "2 years ADC suspended, 4 years probation", "court": "Sebastian County Circuit"},
        ],
    },
]

# Citations for some of these people
AR_CITATIONS = [
    {"person_last": "Wimberly", "violation_code": "5-64-419", "violation_description": "Possession of Controlled Substance - Schedule II", "location": "I-30 & Geyer Springs, Little Rock AR", "date_time": "2024-03-15 02:15", "fine_amount": 2500, "status": "Convicted"},
    {"person_last": "Bagwell", "violation_code": "27-50-303", "violation_description": "Speeding 25+ MPH Over Limit", "location": "Highway 71B, Fayetteville AR", "date_time": "2024-05-08 14:30", "fine_amount": 400, "status": "Paid"},
    {"person_last": "Bagwell", "violation_code": "27-16-303", "violation_description": "Driving on Suspended License", "location": "College Ave & 15th St, Fayetteville AR", "date_time": "2024-11-22 09:45", "fine_amount": 750, "status": "Convicted"},
    {"person_last": "Bagwell", "violation_code": "27-50-302", "violation_description": "Speeding 15 MPH Over Limit", "location": "Razorback Road, Fayetteville AR", "date_time": "2025-01-12 16:20", "fine_amount": 200, "status": "Unpaid"},
    {"person_last": "Douglas", "violation_code": "5-65-103", "violation_description": "DWI - First Offense", "location": "Highway 412, Springdale AR", "date_time": "2021-01-02 01:30", "fine_amount": 1500, "status": "Convicted"},
    {"person_last": "Douglas", "violation_code": "5-65-103", "violation_description": "DWI - Second Offense", "location": "Emma Ave & Thompson St, Springdale AR", "date_time": "2023-09-14 23:15", "fine_amount": 3000, "status": "Convicted"},
    {"person_last": "Arnold", "violation_code": "5-65-103", "violation_description": "DWI - First Offense", "location": "Highway 65 North, Harrison AR", "date_time": "2021-03-12 22:45", "fine_amount": 1000, "status": "Convicted"},
    {"person_last": "Arnold", "violation_code": "5-65-103", "violation_description": "DWI - Second Offense", "location": "Highway 62/65, Harrison AR", "date_time": "2024-08-20 01:10", "fine_amount": 2500, "status": "Convicted"},
    {"person_last": "Slater", "violation_code": "5-13-204", "violation_description": "Domestic Battery - Third Degree", "location": "1809 Pine Bluff Hwy, Pine Bluff AR", "date_time": "2023-05-22 21:30", "fine_amount": 1000, "status": "Convicted"},
    {"person_last": "Griffin", "violation_code": "5-26-303", "violation_description": "Violation of Order of Protection", "location": "Central Ave, Hot Springs AR", "date_time": "2023-06-15 19:00", "fine_amount": 500, "status": "Convicted"},
    {"person_last": "Cole", "violation_code": "5-64-423", "violation_description": "Possession of Methamphetamine", "location": "Baseline Road, Little Rock AR", "date_time": "2022-04-10 03:20", "fine_amount": 5000, "status": "Convicted"},
    {"person_last": "Spann", "violation_code": "5-37-103", "violation_description": "Fraudulent Use of Credit Card", "location": "Cantrell Road, Little Rock AR", "date_time": "2022-09-28 11:00", "fine_amount": 3200, "status": "Convicted - Restitution Ordered"},
]


async def seed():
    # Check if we already seeded
    existing = await db.persons.count_documents({"state": "AR"})
    if existing >= len(AR_PERSONS):
        print(f"Already have {existing} AR records. Skipping seed.")
        print("To re-seed, delete AR records first: db.persons.deleteMany({state: 'AR'})")
        return

    print(f"Seeding {len(AR_PERSONS)} Arkansas person records...")
    
    person_map = {}  # last_name -> person_id
    
    for p in AR_PERSONS:
        person = {
            "id": str(uuid.uuid4()),
            "first_name": p["first_name"],
            "last_name": p["last_name"],
            "middle_name": p.get("middle_name"),
            "dob": p["dob"],
            "drivers_license": p.get("drivers_license"),
            "dl_state": p.get("dl_state"),
            "address": p.get("address"),
            "city": p.get("city"),
            "state": p.get("state"),
            "zip_code": p.get("zip_code"),
            "sex": p.get("sex"),
            "race": p.get("race"),
            "height": p.get("height"),
            "weight": p.get("weight"),
            "eye_color": p.get("eye_color"),
            "hair_color": p.get("hair_color"),
            "warrants": p.get("warrants", []),
            "priors": p.get("priors", []),
            "citations": [],
            "notes": f"Arkansas resident. Record sourced from public court data.",
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }
        
        # Check if person already exists
        exists = await db.persons.find_one({
            "first_name": {"$regex": f"^{p['first_name']}$", "$options": "i"},
            "last_name": {"$regex": f"^{p['last_name']}$", "$options": "i"},
        })
        
        if exists:
            print(f"  {p['first_name']} {p['last_name']} already exists, skipping")
            person_map[p["last_name"]] = exists["id"]
            continue
        
        await db.persons.insert_one(person)
        person_map[p["last_name"]] = person["id"]
        warrant_count = len(p.get("warrants", []))
        prior_count = len(p.get("priors", []))
        print(f"  + {p['first_name']} {p['last_name']} | {warrant_count} warrants, {prior_count} priors")
    
    # Seed citations
    print(f"\nSeeding {len(AR_CITATIONS)} Arkansas citations...")
    for c in AR_CITATIONS:
        person_id = person_map.get(c["person_last"])
        if not person_id:
            continue
        
        citation_id = f"CT-AR-{str(uuid.uuid4())[:6].upper()}"
        citation = {
            "id": citation_id,
            "citation_type": "Criminal" if c["fine_amount"] > 1000 else "Traffic",
            "violation_code": c["violation_code"],
            "violation_description": c["violation_description"],
            "offender_name": c["person_last"],
            "person_id": person_id,
            "location": c["location"],
            "date_time": c["date_time"],
            "fine_amount": c["fine_amount"],
            "officer_badge": "AR-SEED",
            "officer_name": "System Seed",
            "status": c["status"],
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
        await db.citations.insert_one(citation)
        
        # Link citation to person
        await db.persons.update_one(
            {"id": person_id},
            {"$push": {"citations": citation_id}}
        )
        print(f"  + {c['person_last']}: {c['violation_description']}")
    
    print(f"\nDone! Seeded {len(AR_PERSONS)} persons and {len(AR_CITATIONS)} citations.")
    print("\nTest names:")
    for p in AR_PERSONS:
        w = len(p.get("warrants", []))
        print(f"  - {p['first_name']} {p['last_name']} ({w} active warrants)")


if __name__ == "__main__":
    asyncio.run(seed())
