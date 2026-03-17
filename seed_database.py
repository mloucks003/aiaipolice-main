#!/usr/bin/env python3
"""Seed database with sample people and vehicles"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timezone
import uuid

async def seed_database():
    # Connect to production MongoDB
    mongo_url = "mongodb+srv://admin:Admin1234@cluster0.cr10lmh.mongodb.net/?appName=Cluster0"
    client = AsyncIOMotorClient(mongo_url)
    db = client["law_enforcement_rms"]
    
    # Sample people with various backgrounds
    people = [
        {
            "id": str(uuid.uuid4()),
            "first_name": "John",
            "last_name": "Smith",
            "middle_name": "Michael",
            "dob": "1985-03-15",
            "ssn": "123-45-6789",
            "drivers_license": "D1234567",
            "dl_state": "AR",
            "address": "123 Main St",
            "city": "Little Rock",
            "state": "AR",
            "zip_code": "72201",
            "phone": "501-555-0101",
            "race": "White",
            "sex": "Male",
            "height": "6'0\"",
            "weight": "180",
            "eye_color": "Blue",
            "hair_color": "Brown",
            "warrants": [],
            "priors": [],
            "citations": [],
            "notes": "Clean record",
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "first_name": "Sarah",
            "last_name": "Johnson",
            "middle_name": "Elizabeth",
            "dob": "1990-07-22",
            "ssn": "234-56-7890",
            "drivers_license": "J9876543",
            "dl_state": "AR",
            "address": "456 Oak Ave",
            "city": "Fayetteville",
            "state": "AR",
            "zip_code": "72701",
            "phone": "479-555-0202",
            "race": "White",
            "sex": "Female",
            "height": "5'6\"",
            "weight": "135",
            "eye_color": "Green",
            "hair_color": "Blonde",
            "warrants": [],
            "priors": [],
            "citations": [],
            "notes": "No issues",
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "first_name": "Marcus",
            "last_name": "Williams",
            "middle_name": "Andre",
            "dob": "1988-11-30",
            "ssn": "345-67-8901",
            "drivers_license": "W5555555",
            "dl_state": "AR",
            "address": "789 Pine St",
            "city": "Jonesboro",
            "state": "AR",
            "zip_code": "72401",
            "phone": "870-555-0303",
            "race": "Black",
            "sex": "Male",
            "height": "5'10\"",
            "weight": "175",
            "eye_color": "Brown",
            "hair_color": "Black",
            "warrants": [
                {
                    "type": "Traffic",
                    "date": "2024-01-15",
                    "amount": 250,
                    "description": "Failure to appear - speeding ticket"
                }
            ],
            "priors": [
                {
                    "offense": "DUI",
                    "date": "2020-06-10",
                    "disposition": "Convicted",
                    "sentence": "Probation 1 year"
                }
            ],
            "citations": [],
            "notes": "Active warrant for FTA",
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "first_name": "Jennifer",
            "last_name": "Davis",
            "middle_name": "Marie",
            "dob": "1995-04-18",
            "ssn": "456-78-9012",
            "drivers_license": "D7777777",
            "dl_state": "AR",
            "address": "321 Elm Dr",
            "city": "Conway",
            "state": "AR",
            "zip_code": "72032",
            "phone": "501-555-0404",
            "race": "White",
            "sex": "Female",
            "height": "5'4\"",
            "weight": "125",
            "eye_color": "Hazel",
            "hair_color": "Red",
            "warrants": [],
            "priors": [
                {
                    "offense": "Shoplifting",
                    "date": "2019-03-22",
                    "disposition": "Dismissed",
                    "sentence": "N/A"
                }
            ],
            "citations": [],
            "notes": "Prior dismissed",
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "first_name": "Robert",
            "last_name": "Martinez",
            "middle_name": "Carlos",
            "dob": "1982-09-05",
            "ssn": "567-89-0123",
            "drivers_license": "M3333333",
            "dl_state": "AR",
            "address": "555 Maple Ln",
            "city": "Hot Springs",
            "state": "AR",
            "zip_code": "71901",
            "phone": "501-555-0505",
            "race": "Hispanic",
            "sex": "Male",
            "height": "5'8\"",
            "weight": "165",
            "eye_color": "Brown",
            "hair_color": "Black",
            "warrants": [
                {
                    "type": "Felony",
                    "date": "2023-08-20",
                    "amount": 5000,
                    "description": "Possession of controlled substance"
                }
            ],
            "priors": [
                {
                    "offense": "Assault",
                    "date": "2018-12-01",
                    "disposition": "Convicted",
                    "sentence": "6 months jail"
                },
                {
                    "offense": "Drug Possession",
                    "date": "2021-05-15",
                    "disposition": "Convicted",
                    "sentence": "Probation 2 years"
                }
            ],
            "citations": [],
            "notes": "CAUTION: Active felony warrant, history of violence",
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
    ]
    
    # Sample vehicles
    vehicles = [
        {
            "id": str(uuid.uuid4()),
            "plate_number": "ABC123",
            "state": "AR",
            "vin": "1HGBH41JXMN109186",
            "make": "Honda",
            "model": "Civic",
            "year": 2020,
            "color": "Blue",
            "registered_owner": "John Smith",
            "owner_address": "123 Main St, Little Rock, AR 72201",
            "insurance_status": "Active",
            "registration_status": "Active",
            "flags": [],
            "notes": "Clean vehicle",
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "plate_number": "XYZ789",
            "state": "AR",
            "vin": "2T1BURHE0JC123456",
            "make": "Toyota",
            "model": "Camry",
            "year": 2018,
            "color": "White",
            "registered_owner": "Sarah Johnson",
            "owner_address": "456 Oak Ave, Fayetteville, AR 72701",
            "insurance_status": "Active",
            "registration_status": "Expired",
            "flags": ["EXPIRED_REGISTRATION"],
            "notes": "Registration expired 2 months ago",
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "plate_number": "DEF456",
            "state": "AR",
            "vin": "1FTFW1ET5DFC12345",
            "make": "Ford",
            "model": "F-150",
            "year": 2015,
            "color": "Black",
            "registered_owner": "Marcus Williams",
            "owner_address": "789 Pine St, Jonesboro, AR 72401",
            "insurance_status": "Lapsed",
            "registration_status": "Active",
            "flags": ["NO_INSURANCE"],
            "notes": "Insurance lapsed 3 weeks ago",
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "plate_number": "GHI789",
            "state": "AR",
            "vin": "5YJSA1E14HF123456",
            "make": "Tesla",
            "model": "Model S",
            "year": 2022,
            "color": "Red",
            "registered_owner": "Jennifer Davis",
            "owner_address": "321 Elm Dr, Conway, AR 72032",
            "insurance_status": "Active",
            "registration_status": "Active",
            "flags": [],
            "notes": "No issues",
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "plate_number": "JKL012",
            "state": "AR",
            "vin": "1G1ZD5ST8JF123456",
            "make": "Chevrolet",
            "model": "Malibu",
            "year": 2017,
            "color": "Silver",
            "registered_owner": "Robert Martinez",
            "owner_address": "555 Maple Ln, Hot Springs, AR 71901",
            "insurance_status": "Active",
            "registration_status": "Active",
            "flags": ["STOLEN"],
            "notes": "CAUTION: Reported stolen 2024-02-01",
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "plate_number": "MNO345",
            "state": "AR",
            "vin": "3VWDX7AJ9DM123456",
            "make": "Volkswagen",
            "model": "Jetta",
            "year": 2019,
            "color": "Gray",
            "registered_owner": "Unknown",
            "owner_address": "Unknown",
            "insurance_status": "Unknown",
            "registration_status": "Suspended",
            "flags": ["SUSPENDED", "UNPAID_TICKETS"],
            "notes": "Multiple unpaid parking tickets, registration suspended",
            "created_at": datetime.now(timezone.utc).isoformat()
        }
    ]
    
    # Insert people
    existing_people = await db.persons.count_documents({})
    if existing_people == 0:
        await db.persons.insert_many(people)
        print(f"✅ Added {len(people)} people to database")
    else:
        print(f"⚠️  Database already has {existing_people} people, skipping...")
    
    # Insert vehicles
    existing_vehicles = await db.vehicles.count_documents({})
    if existing_vehicles == 0:
        await db.vehicles.insert_many(vehicles)
        print(f"✅ Added {len(vehicles)} vehicles to database")
    else:
        print(f"⚠️  Database already has {existing_vehicles} vehicles, skipping...")
    
    print("\n📋 Sample Data Summary:")
    print("=" * 50)
    print("\nPeople:")
    for p in people:
        flags = []
        if p['warrants']:
            flags.append("⚠️  WARRANT")
        if p['priors']:
            flags.append("📋 PRIORS")
        flag_str = " ".join(flags) if flags else "✅ CLEAN"
        print(f"  {p['first_name']} {p['last_name']} - DL: {p['drivers_license']} {flag_str}")
    
    print("\nVehicles:")
    for v in vehicles:
        flag_str = ", ".join(v['flags']) if v['flags'] else "✅ CLEAN"
        print(f"  {v['plate_number']} - {v['year']} {v['make']} {v['model']} ({v['color']}) - {flag_str}")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(seed_database())
