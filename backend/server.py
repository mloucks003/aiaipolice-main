from fastapi import FastAPI, APIRouter, HTTPException, Depends, status, Form, Request, Response, WebSocket, WebSocketDisconnect
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.responses import FileResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta
from passlib.context import CryptContext
from jose import JWTError, jwt
from openai import AsyncOpenAI
from twilio.rest import Client
from twilio.twiml.voice_response import VoiceResponse, Gather, Say, Record, Play, Connect, Stream
import json
from fine_codes import get_fine_amount
from elevenlabs_helper import generate_voice_audio_sync
import hashlib
from realtime_dispatcher import RealtimeDispatcher

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Audio cache directory
AUDIO_CACHE_DIR = ROOT_DIR / "audio_cache"
AUDIO_CACHE_DIR.mkdir(exist_ok=True)

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Security
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()
SECRET_KEY = os.environ.get('JWT_SECRET', 'rms-secret-key-change-in-production')
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 480

# AI & Twilio Configuration
OPENAI_API_KEY = os.environ.get('OPENAI_API_KEY')
TWILIO_ACCOUNT_SID = os.environ.get('TWILIO_ACCOUNT_SID')
TWILIO_AUTH_TOKEN = os.environ.get('TWILIO_AUTH_TOKEN')
TWILIO_PHONE_NUMBER = os.environ.get('TWILIO_PHONE_NUMBER')
ELEVENLABS_API_KEY = os.environ.get('ELEVENLABS_API_KEY')

# Initialize clients
openai_client = AsyncOpenAI(api_key=OPENAI_API_KEY) if OPENAI_API_KEY else None
twilio_client = Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN) if TWILIO_ACCOUNT_SID else None

# Create the main app
app = FastAPI()
api_router = APIRouter(prefix="/api")

# Models (keeping all existing models)
class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    badge_number: str
    username: str
    full_name: str
    role: str
    department: str
    rank: str
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    active: bool = True

class UserCreate(BaseModel):
    badge_number: str
    username: str
    password: str
    full_name: str
    role: str = 'officer'
    department: str
    rank: str

class UserLogin(BaseModel):
    username: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str
    user: User

class PersonRecord(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    first_name: str
    last_name: str
    middle_name: Optional[str] = None
    dob: str
    ssn: Optional[str] = None
    drivers_license: Optional[str] = None
    dl_state: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    zip_code: Optional[str] = None
    phone: Optional[str] = None
    race: Optional[str] = None
    sex: Optional[str] = None
    height: Optional[str] = None
    weight: Optional[str] = None
    eye_color: Optional[str] = None
    hair_color: Optional[str] = None
    warrants: List[Dict] = []
    priors: List[Dict] = []
    citations: List[str] = []  # Citation IDs
    notes: Optional[str] = None
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    updated_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class VehicleRecord(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    plate_number: str
    state: str
    vin: Optional[str] = None
    make: Optional[str] = None
    model: Optional[str] = None
    year: Optional[int] = None
    color: Optional[str] = None
    registered_owner: Optional[str] = None
    owner_address: Optional[str] = None
    insurance_status: Optional[str] = None
    registration_status: Optional[str] = None
    flags: List[str] = []
    notes: Optional[str] = None
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class ActiveCall(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    call_sid: str
    caller_phone: str
    incident_type: Optional[str] = None
    location: Optional[str] = None
    description: Optional[str] = None
    priority: int = 3  # 1=Critical, 5=Low
    status: str = "Active"  # Active, Dispatched, Closed
    assigned_officer: Optional[str] = None
    transcription: Optional[str] = None
    recording_url: Optional[str] = None  # Twilio recording URL
    recording_duration: Optional[int] = None  # Duration in seconds
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    updated_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class Citation(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: f"CT-{datetime.now(timezone.utc).strftime('%Y%m%d')}-{str(uuid.uuid4())[:6].upper()}")
    citation_type: str
    violation_code: str
    violation_description: str
    offender_name: str
    offender_dl: Optional[str] = None
    offender_dob: Optional[str] = None
    offender_address: Optional[str] = None
    person_id: Optional[str] = None  # Linked person record
    vehicle_plate: Optional[str] = None
    vehicle_info: Optional[str] = None
    location: str
    date_time: str
    fine_amount: float = 0.00  # Auto-generated
    court_date: Optional[str] = None
    officer_badge: str
    officer_name: str
    notes: Optional[str] = None
    status: str = 'Active'
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class IncidentReport(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: f"RPT-{datetime.now(timezone.utc).strftime('%Y%m%d')}-{str(uuid.uuid4())[:6].upper()}")
    incident_type: str
    incident_date: str
    incident_time: str
    location: str
    narrative: str
    reporting_officer: str
    badge_number: str
    involved_persons: List[Dict] = []
    involved_vehicles: List[Dict] = []
    evidence: List[Dict] = []
    witnesses: List[Dict] = []
    status: str = 'Draft'
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    updated_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

# Helper functions
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        token = credentials.credentials
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid authentication")
        user = await db.users.find_one({"id": user_id}, {"_id": 0})
        if user is None or not user.get('active', False):
            raise HTTPException(status_code=401, detail="User not found or inactive")
        return User(**{k: v for k, v in user.items() if k != 'password_hash'})
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid authentication")

async def find_or_create_person(citation_data: dict) -> str:
    """Find existing person or create new one from citation data."""
    # Try to find by driver's license first
    person = None
    if citation_data.get('offender_dl'):
        person = await db.persons.find_one({"drivers_license": citation_data['offender_dl']}, {"_id": 0})
    
    # Try to find by name and DOB
    if not person and citation_data.get('offender_name') and citation_data.get('offender_dob'):
        names = citation_data['offender_name'].split(',')
        last_name = names[0].strip() if names else ""
        first_name = names[1].strip() if len(names) > 1 else ""
        
        person = await db.persons.find_one({
            "last_name": {"$regex": f"^{last_name}$", "$options": "i"},
            "first_name": {"$regex": f"^{first_name}$", "$options": "i"},
            "dob": citation_data['offender_dob']
        }, {"_id": 0})
    
    if person:
        return person['id']
    
    # Create new person record
    names = citation_data['offender_name'].split(',')
    last_name = names[0].strip() if names else citation_data['offender_name']
    first_name = names[1].strip() if len(names) > 1 else ""
    
    new_person = PersonRecord(
        first_name=first_name,
        last_name=last_name,
        dob=citation_data.get('offender_dob', ''),
        drivers_license=citation_data.get('offender_dl'),
        address=citation_data.get('offender_address'),
        citations=[]
    )
    
    await db.persons.insert_one(new_person.model_dump())
    return new_person.id

# Auth routes
@api_router.post("/auth/login", response_model=Token)
async def login(credentials: UserLogin):
    user = await db.users.find_one({"username": credentials.username}, {"_id": 0})
    if not user or not verify_password(credentials.password, user['password_hash']):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if not user.get('active', False):
        raise HTTPException(status_code=401, detail="Account is inactive")
    
    user_obj = User(**{k: v for k, v in user.items() if k != 'password_hash'})
    access_token = create_access_token(data={"sub": user_obj.id})
    
    return Token(access_token=access_token, token_type="bearer", user=user_obj)

# Admin routes
@api_router.post("/admin/users", response_model=User)
async def create_user(user_data: UserCreate, current_user: User = Depends(get_current_user)):
    if current_user.role != 'admin':
        raise HTTPException(status_code=403, detail="Admin access required")
    
    existing = await db.users.find_one({"username": user_data.username}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Username already exists")
    
    existing_badge = await db.users.find_one({"badge_number": user_data.badge_number}, {"_id": 0})
    if existing_badge:
        raise HTTPException(status_code=400, detail="Badge number already exists")
    
    hashed_password = get_password_hash(user_data.password)
    user = User(
        badge_number=user_data.badge_number,
        username=user_data.username,
        full_name=user_data.full_name,
        role=user_data.role,
        department=user_data.department,
        rank=user_data.rank
    )
    
    user_doc = user.model_dump()
    user_doc['password_hash'] = hashed_password
    await db.users.insert_one(user_doc)
    
    return user

@api_router.get("/admin/users", response_model=List[User])
async def get_users(current_user: User = Depends(get_current_user)):
    if current_user.role != 'admin':
        raise HTTPException(status_code=403, detail="Admin access required")
    
    users = await db.users.find({}, {"_id": 0, "password_hash": 0}).to_list(1000)
    return users

@api_router.patch("/admin/users/{user_id}")
async def update_user(user_id: str, active: bool, current_user: User = Depends(get_current_user)):
    if current_user.role != 'admin':
        raise HTTPException(status_code=403, detail="Admin access required")
    
    await db.users.update_one({"id": user_id}, {"$set": {"active": active}})
    return {"message": "User updated"}

# Twilio Webhook Endpoints (under /api prefix for Kubernetes routing)
@api_router.post("/webhooks/voice")
async def handle_incoming_call(
    request: Request,
    From: str = Form(...),
    CallSid: str = Form(...),
    To: str = Form(...)
):
    """OpenAI Realtime API with fallback to ElevenLabs"""
    # Create active call record
    active_call = ActiveCall(
        call_sid=CallSid,
        caller_phone=From,
        status="Processing"
    )
    await db.active_calls.insert_one(active_call.model_dump())
    
    response = VoiceResponse()
    
    # Try to use OpenAI Realtime API if available
    if OPENAI_API_KEY:
        try:
            # Get the host from the request
            host = request.headers.get('host', 'law-enforcement-rms-b2749bfd89b0.herokuapp.com')
            
            # Use wss:// for WebSocket Secure
            ws_url = f"wss://{host}/ws/media"
            
            logger.info(f"Initiating Realtime API for call {CallSid} with WebSocket URL: {ws_url}")
            
            # Start recording using Twilio's recording API (not TwiML Record verb)
            # This will record the call in the background
            if twilio_client:
                try:
                    # Start recording via Twilio API
                    twilio_client.calls(CallSid).recordings.create(
                        recording_status_callback=f"https://{host}/api/webhooks/recording-status",
                        recording_status_callback_method='POST'
                    )
                    logger.info(f"Started recording for call {CallSid}")
                except Exception as rec_error:
                    logger.error(f"Failed to start recording for call {CallSid}: {rec_error}")
            
            # Return TwiML with Connect and Stream for Realtime API
            connect = Connect()
            stream = Stream(url=ws_url)
            connect.append(stream)
            response.append(connect)
            
            logger.info(f"Returning TwiML with Media Streams for call {CallSid}")
            return Response(content=str(response), media_type="application/xml")
            
        except Exception as e:
            logger.error(f"Failed to initiate Realtime API for call {CallSid}: {e}")
            # Fall through to ElevenLabs fallback
    
    # Fallback to ElevenLabs system
    logger.info(f"Using ElevenLabs fallback for call {CallSid}")
    
    # Use Gather with optimized settings
    gather = Gather(
        input='speech',
        timeout=4,
        speech_timeout=2,
        action='/api/webhooks/process-speech',
        method='POST',
        language='en-US',
        hints='police, fire, medical, emergency, accident, robbery, assault, shooting, heart attack, unconscious, help, bleeding',
        profanity_filter=False,
        speech_model='phone_call'
    )
    
    # Use CACHED ElevenLabs audio for instant playback
    greeting = "911, what's your emergency?"
    audio_url = generate_voice_audio_sync(greeting)
    if audio_url:
        gather.play(audio_url)
    else:
        gather.say(greeting, voice='Polly.Joanna')
    
    response.append(gather)
    
    # Fallback
    fallback = "I'm sorry, I didn't catch that. What's happening?"
    fallback_url = generate_voice_audio_sync(fallback)
    if fallback_url:
        response.play(fallback_url)
    else:
        response.say(fallback, voice='Polly.Joanna')
    
    response.redirect('/api/webhooks/voice', method='POST')
    
    return Response(content=str(response), media_type="application/xml")

@api_router.post("/webhooks/process-speech")
async def process_speech(
    CallSid: str = Form(...),
    SpeechResult: str = Form(None),
    Confidence: float = Form(None)
):
    """HYBRID: ElevenLabs for realism + smart caching for speed."""
    response = VoiceResponse()
    
    if not SpeechResult:
        # Use cached ElevenLabs
        audio_url = generate_voice_audio_sync("I didn't catch that. What's your emergency?")
        if audio_url:
            response.play(audio_url)
        else:
            response.say("I didn't catch that. What's your emergency?", voice='Polly.Joanna')
        response.redirect('/api/webhooks/voice', method='POST')
        return Response(content=str(response), media_type="application/xml")
    
    try:
        # Get current call data
        call = await db.active_calls.find_one({"call_sid": CallSid}, {"_id": 0})
        conversation_history = call.get('transcription', '') if call else ''
        question_count = conversation_history.count('\n') if conversation_history else 0
        
        # SMART AI PROMPT - Efficient dispatcher with natural responses
        ai_prompt = f'''You are a professional 911 dispatcher. Analyze this call:

CALLER: "{SpeechResult}"
PREVIOUS: "{conversation_history}"
QUESTIONS ASKED: {question_count}

CRITICAL RULES:
1. After 2-3 questions, you MUST dispatch (set is_complete=true)
2. Only ask about MISSING critical info: location, incident type, immediate danger
3. Be reassuring and natural: "Okay", "I understand", "Alright", "Got it"
4. Keep responses conversational and under 20 words
5. Sound like a real human dispatcher - use natural speech patterns

Return JSON:
{{
  "incident_type": "Medical"|"Fire"|"Police"|"Traffic"|"Other",
  "location": "extracted address or 'unknown'",
  "priority": 1-5,
  "dispatcher_response": "natural, reassuring response with question if needed",
  "is_complete": true/false (TRUE after 2-3 exchanges OR if you have location + incident type)
}}

Example responses:
- "Okay, what's your location?"
- "Alright, I understand. Where are you right now?"
- "Got it. Is anyone injured?"
- "Okay, help is on the way. Stay with me."'''
        
        ai_response_obj = await openai_client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You are a calm, professional 911 dispatcher. Speak naturally like a real human."},
                {"role": "user", "content": ai_prompt}
            ],
            temperature=0.5,  # More natural variation
            max_tokens=150
        )
        ai_response = ai_response_obj.choices[0].message.content
        
        try:
            clean = ai_response.strip().replace('```json', '').replace('```', '').strip()
            details = json.loads(clean)
        except:
            details = {
                "incident_type": "Other",
                "location": "unknown",
                "priority": 3,
                "dispatcher_response": "Okay, help is on the way. Stay on the line.",
                "is_complete": question_count >= 2
            }
        
        # Force completion after 3 questions
        if question_count >= 2:
            details["is_complete"] = True
        
        # Update call
        updated_transcript = f"{conversation_history}\nCaller: {SpeechResult}" if conversation_history else f"Caller: {SpeechResult}"
        
        await db.active_calls.update_one(
            {"call_sid": CallSid},
            {"$set": {
                "incident_type": details.get("incident_type", "Other"),
                "location": details.get("location", "unknown"),
                "description": updated_transcript,
                "priority": details.get("priority", 3),
                "transcription": updated_transcript,
                "status": "Active" if details.get("is_complete") else "Processing",
                "updated_at": datetime.now(timezone.utc).isoformat()
            }}
        )
        
        # DISPATCH or CONTINUE with ElevenLabs
        if details.get("is_complete", False):
            # Use ElevenLabs for natural dispatch message
            dispatch_msg = "Okay, help is on the way. Stay on the line."
            audio_url = generate_voice_audio_sync(dispatch_msg)
            if audio_url:
                response.play(audio_url)
            else:
                response.say(dispatch_msg, voice='Polly.Joanna')
            response.redirect('/api/webhooks/hold-caller', method='POST')
        else:
            # Continue with ElevenLabs for realistic conversation
            gather = Gather(
                input='speech',
                timeout=4,
                speech_timeout=2,
                action='/api/webhooks/process-speech',
                method='POST',
                language='en-US',
                speech_model='phone_call'
            )
            
            dispatcher_response = details.get("dispatcher_response", "What's your location?")
            # Generate with ElevenLabs (will be cached if repeated)
            audio_url = generate_voice_audio_sync(dispatcher_response)
            if audio_url:
                gather.play(audio_url)
            else:
                gather.say(dispatcher_response, voice='Polly.Joanna')
            
            response.append(gather)
            
            # Fallback
            fallback_msg = "Are you there?"
            fallback_url = generate_voice_audio_sync(fallback_msg)
            if fallback_url:
                response.play(fallback_url)
            else:
                response.say(fallback_msg, voice='Polly.Joanna')
            response.redirect('/api/webhooks/process-speech', method='POST')
        
    except Exception as e:
        logger.error(f"Speech processing error: {e}")
        # Fallback with ElevenLabs
        error_msg = "I have your information. Help is on the way."
        audio_url = generate_voice_audio_sync(error_msg)
        if audio_url:
            response.play(audio_url)
        else:
            response.say(error_msg, voice='Polly.Joanna')
        response.redirect('/api/webhooks/hold-caller', method='POST')
    
    return Response(content=str(response), media_type="application/xml")

@api_router.post("/webhooks/recording-status")
async def recording_status_callback(
    CallSid: str = Form(...),
    RecordingUrl: str = Form(...),
    RecordingDuration: str = Form(None),
    RecordingSid: str = Form(None)
):
    """Callback from Twilio when call recording is complete"""
    try:
        logger.info(f"Recording completed for call {CallSid}: {RecordingUrl}")
        
        # Update the call record with recording URL
        await db.active_calls.update_one(
            {"call_sid": CallSid},
            {"$set": {
                "recording_url": RecordingUrl,
                "recording_duration": int(RecordingDuration) if RecordingDuration else None,
                "recording_sid": RecordingSid,
                "updated_at": datetime.now(timezone.utc).isoformat()
            }}
        )
        
        logger.info(f"Updated call {CallSid} with recording URL")
        return {"status": "success"}
    except Exception as e:
        logger.error(f"Error updating recording for call {CallSid}: {e}")
        return {"status": "error", "message": str(e)}

@api_router.post("/webhooks/get-location")
async def get_location(CallSid: str = Form(...), SpeechResult: str = Form(None)):
    """Get location details."""
    if SpeechResult:
        await db.active_calls.update_one(
            {"call_sid": CallSid},
            {"$set": {"location": SpeechResult, "updated_at": datetime.now(timezone.utc).isoformat()}}
        )
    
    response = VoiceResponse()
    response.redirect('/api/webhooks/followup-questions')
    return Response(content=str(response), media_type="application/xml")

@api_router.post("/webhooks/followup-questions")
async def followup_questions(CallSid: str = Form(...)):
    """Ask detailed follow-up questions based on incident type."""
    response = VoiceResponse()
    
    call = await db.active_calls.find_one({"call_sid": CallSid}, {"_id": 0})
    if not call:
        audio_url = generate_voice_audio_sync("Officers have been notified. Stay on the line.")
        response.play(audio_url)
        response.redirect('/api/webhooks/hold-caller', method='POST')
        return Response(content=str(response), media_type="application/xml")
    
    incident_type = call.get('incident_type', 'Other')
    
    # Ask multiple specific questions with ElevenLabs ONLY
    gather = Gather(input='speech', timeout=5, speech_timeout=2, speech_model='phone_call', action='/api/webhooks/question-2', method='POST', language='en-US')
    
    question = ""
    if incident_type in ['Medical', 'Fire']:
        question = "Is anyone injured or unconscious?"
    elif incident_type == 'Police':
        question = "Can you describe the suspect? Height, race, clothing?"
    elif incident_type == 'Traffic Accident':
        question = "How many vehicles? Any injuries?"
    else:
        question = "Tell me more details."
    
    audio_url = generate_voice_audio_sync(question)
    gather.play(audio_url)
    
    response.append(gather)
    response.redirect('/api/webhooks/question-2')
    return Response(content=str(response), media_type="application/xml")

@api_router.post("/webhooks/question-2")
async def question_2(CallSid: str = Form(...), SpeechResult: str = Form(None)):
    """Second follow-up question."""
    if SpeechResult:
        call = await db.active_calls.find_one({"call_sid": CallSid}, {"_id": 0})
        if call:
            current_desc = call.get('description', '')
            await db.active_calls.update_one(
                {"call_sid": CallSid},
                {"$set": {"description": f"{current_desc} | {SpeechResult}", "updated_at": datetime.now(timezone.utc).isoformat()}}
            )
    
    response = VoiceResponse()
    call = await db.active_calls.find_one({"call_sid": CallSid}, {"_id": 0})
    incident_type = call.get('incident_type', 'Other') if call else 'Other'
    
    gather = Gather(input='speech', timeout=5, speech_timeout=2, speech_model='phone_call', action='/api/webhooks/question-3', method='POST', language='en-US')
    
    question = ""
    if incident_type in ['Medical']:
        question = "Is the person breathing? Are they responsive?"
    elif incident_type == 'Fire':
        question = "Is anyone trapped inside? Can you see flames?"
    elif incident_type == 'Police':
        question = "Are they armed? Are they still on scene?"
    elif incident_type == 'Traffic Accident':
        question = "Is anyone trapped in a vehicle? Is traffic blocked?"
    else:
        question = "Anything else I should know?"
    
    audio_url = generate_voice_audio_sync(question)
    gather.play(audio_url)
    
    response.append(gather)
    response.redirect('/api/webhooks/question-3')
    return Response(content=str(response), media_type="application/xml")

@api_router.post("/webhooks/question-3")
async def question_3(CallSid: str = Form(...), SpeechResult: str = Form(None)):
    """Third follow-up and call completion."""
    if SpeechResult:
        call = await db.active_calls.find_one({"call_sid": CallSid}, {"_id": 0})
        if call:
            current_desc = call.get('description', '')
            await db.active_calls.update_one(
                {"call_sid": CallSid},
                {"$set": {"description": f"{current_desc} | {SpeechResult}", "updated_at": datetime.now(timezone.utc).isoformat()}}
            )
    
    # Mark call as Active NOW and generate radio dispatch announcement
    # Get call details for dispatch message
    call = await db.active_calls.find_one({"call_sid": CallSid}, {"_id": 0})
    incident_type = call.get('incident_type', 'Unknown incident') if call else 'Unknown incident'
    location = call.get('location', 'Unknown location') if call else 'Unknown location'
    description = call.get('description', '') if call else ''
    
    # Create RADIO-STYLE dispatch broadcast (more professional, concise)
    # Radio beep sound effect, then message
    dispatch_msg = f"Attention all units. Incoming call. {incident_type} reported at {location}. Respond when available."
    
    # Generate dispatch audio
    dispatch_audio_url = generate_voice_audio_sync(dispatch_msg)
    
    print(f"Generated dispatch message: {dispatch_msg}")
    print(f"Dispatch audio URL: {dispatch_audio_url}")
    
    await db.active_calls.update_one(
        {"call_sid": CallSid},
        {"$set": {
            "status": "Active", 
            "updated_at": datetime.now(timezone.utc).isoformat(),
            "conversation_history": ["Dispatcher: Thank you for that information. I've got officers heading to you right now."],
            "dispatch_audio_url": dispatch_audio_url  # Store for radio playback
        }}
    )
    
    response = VoiceResponse()
    
    # More natural, conversational transition to holding
    final_msg = "Okay, I've got officers heading to you right now. I'm going to stay on the line with you until they get there. How are you doing? Are you somewhere safe?"
    audio_url = generate_voice_audio_sync(final_msg)
    
    # Use Gather to start the conversation
    gather = Gather(
        input='speech',
        timeout=6,
        speech_timeout='auto',
        action='/api/webhooks/hold-caller',
        method='POST',
        language='en-US',
        speech_model='phone_call'
    )
    
    if audio_url:
        gather.play(audio_url)
    
    response.append(gather)
    
    # Fallback if no response
    response.redirect('/api/webhooks/hold-caller', method='POST')
    
    return Response(content=str(response), media_type="application/xml")

@api_router.post("/webhooks/hold-caller")
async def hold_caller(CallSid: str = Form(...), SpeechResult: str = Form(None)):
    """Keep caller engaged with real AI conversation - empathetic, human, dynamic."""
    response = VoiceResponse()
    
    # Get call details for context
    call = await db.active_calls.find_one({"call_sid": CallSid}, {"_id": 0})
    
    # Check if officer is on scene - only then hang up
    if call and call.get('officer_on_scene'):
        msg = "The officer has arrived on scene. You're in good hands now. Take care."
        audio_url = generate_voice_audio_sync(msg)
        if audio_url:
            response.play(audio_url)
        response.hangup()
        return Response(content=str(response), media_type="application/xml")
    
    # Check if officer just attached and needs to be announced
    if call and call.get('assigned_officer') and call.get('officer_notified'):
        officer_name = call.get('assigned_officer_name', 'an officer')
        badge_number = call.get('assigned_officer', '')
        msg = f"Great news! Officer {officer_name}, badge number {badge_number}, is responding to your call right now. They're on their way to you. I'm going to stay on the line until they arrive."
        
        # Clear the notification flag so we don't repeat this message
        await db.active_calls.update_one(
            {"call_sid": CallSid},
            {"$unset": {"officer_notified": ""}}
        )
        
        audio_url = generate_voice_audio_sync(msg)
        
        # Continue conversation after announcement
        gather = Gather(
            input='speech',
            timeout=7,
            speech_timeout='auto',
            action='/api/webhooks/hold-caller',
            method='POST',
            language='en-US',
            speech_model='phone_call'
        )
        
        if audio_url:
            gather.play(audio_url)
        
        response.append(gather)
        response.redirect('/api/webhooks/hold-caller', method='POST')
        return Response(content=str(response), media_type="application/xml")
    
    # Build context for AI with what we ALREADY KNOW
    incident_type = call.get('incident_type', 'Unknown') if call else 'Unknown'
    location = call.get('location', 'Unknown') if call else 'Unknown'
    description = call.get('description', '') if call else ''
    conversation_history = call.get('conversation_history', []) if call else []
    
    # Add caller's response to history if they said something
    if SpeechResult:
        conversation_history.append(f"Caller: {SpeechResult}")
    
    # Build "what we know" summary for AI context
    known_info = []
    if location and location != 'Unknown':
        known_info.append(f"Location: {location}")
    if incident_type and incident_type not in ['Unknown', 'Other', 'Non-Emergency']:
        known_info.append(f"Type: {incident_type}")
    if description:
        known_info.append(f"Details: {description}")
    
    known_summary = " | ".join(known_info) if known_info else "Nothing confirmed yet"
    
    # Create INTELLIGENT, CONVERSATIONAL dispatcher - understands context naturally
    system_prompt = f"""You are a professional dispatcher having a real conversation. You UNDERSTAND what people say and respond naturally.

WHAT YOU KNOW SO FAR:
{known_summary}

CONVERSATION:
{chr(10).join(conversation_history[-8:])}

YOUR STYLE - BE HUMAN:

1. ACTUALLY LISTEN AND UNDERSTAND:
   - If someone says "my neighbor is playing loud music", you UNDERSTAND it's a noise complaint
   - If they say "there's a car blocking my driveway", you UNDERSTAND the problem
   - Don't ask "what's your report?" - they just told you!

2. RESPOND NATURALLY:
   - Acknowledge what they said: "Got it, loud music complaint"
   - Show understanding: "Understood, vehicle blocking your driveway"
   - Be conversational: "Okay, so your neighbor's music is too loud"

3. ASK SMART FOLLOW-UPS:
   - Only ask what you DON'T know
   - If they mentioned location, DON'T ask for it again
   - If you have everything, wrap up immediately

4. KEEP IT SHORT:
   - 8-15 words per response
   - One thought at a time
   - Natural conversation pace

WHAT YOU NEED (in priority order):
1. Type of issue (usually they tell you first)
2. Location/address
3. That's it - then wrap up

CONVERSATION EXAMPLES:

BAD (robotic):
Caller: "My neighbor's dog won't stop barking"
You: "What's your report?" ← NO! They just told you!

GOOD (natural):
Caller: "My neighbor's dog won't stop barking"
You: "Copy. What's the address?" ← Understood, ask for missing info

BAD (robotic):
Caller: "Someone's music is really loud at 456 Oak Street"
You: "What's your location?" ← NO! They just told you!

GOOD (natural):
Caller: "Someone's music is really loud at 456 Oak Street"
You: "Got it. Report filed. Officer will follow up." ← Done!

BAD (asking obvious):
Caller: "There's loud music"
You: "What kind of noise is it?" ← NO! They said music!

GOOD (relevant):
Caller: "There's loud music"
You: "Address?"

Generate your NEXT response (8-15 words). Be natural, show you understood them."""

    try:
        # CONVERSATIONAL AI - natural responses
        ai_response_obj = await openai_client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": "Respond naturally (8-15 words):"}
            ],
            temperature=0.7,
            max_tokens=50
        )
        ai_response = ai_response_obj.choices[0].message.content
        
        # Clean up
        ai_response = ai_response.strip().replace('"', '').replace('*', '').replace('\n', ' ')
        
        # Force short responses
        words = ai_response.split()
        if len(words) > 18:
            ai_response = ' '.join(words[:16])
        
        # Check if we have enough info to wrap up and dispatch
        has_location = location and location not in ['Unknown', 'Unknown location']
        has_incident = incident_type and incident_type not in ['Unknown', 'Other', 'Non-Emergency']
        
        # If we have location and incident type, wrap up and create dispatch
        if has_location and has_incident:
            # Generate dispatch audio
            dispatch_msg = f"Attention all units, {incident_type.lower()} at {location}. {description[:80] if description else 'No additional details'}. Unit available to respond?"
            dispatch_audio_url = generate_voice_audio_sync(dispatch_msg)
            
            # Mark as Active with dispatch audio
            await db.active_calls.update_one(
                {"call_sid": CallSid},
                {"$set": {
                    "status": "Active",
                    "dispatch_audio_url": dispatch_audio_url,
                    "updated_at": datetime.now(timezone.utc).isoformat()
                }}
            )
            
            # Say goodbye and hang up
            goodbye_msg = "Copy. Report filed. Officer will follow up."
            audio_url = generate_voice_audio_sync(goodbye_msg)
            if audio_url:
                response.play(audio_url)
            response.hangup()
            return Response(content=str(response), media_type="application/xml")
        
        # Otherwise continue conversation
        # Save to conversation
        conversation_history.append(f"Dispatcher: {ai_response}")
        
        await db.active_calls.update_one(
            {"call_sid": CallSid},
            {"$set": {"conversation_history": conversation_history}}
        )
        
        # Generate audio
        audio_url = generate_voice_audio_sync(ai_response)
        
        # Gather with tight timeouts
        gather = Gather(
            input='speech',
            timeout=5,
            speech_timeout='auto',
            action='/api/webhooks/hold-caller',
            method='POST',
            language='en-US',
            speech_model='phone_call',
            profanity_filter=False
        )
        
        if audio_url:
            gather.play(audio_url)
        
        response.append(gather)
        response.redirect('/api/webhooks/hold-caller', method='POST')
        
    except Exception as e:
        logger.error(f"AI conversation error: {e}")
        import traceback
        traceback.print_exc()
        # Quick fallback
        msg = "Say again?"
        audio_url = generate_voice_audio_sync(msg)
        if audio_url:
            response.play(audio_url)
        response.pause(length=2)
        response.redirect('/api/webhooks/hold-caller', method='POST')
    
    return Response(content=str(response), media_type="application/xml")

# Active Calls API (under /api prefix)
@api_router.get("/calls/active")
async def get_active_calls(current_user: User = Depends(get_current_user)):
    """Get all active emergency calls."""
    calls = await db.active_calls.find(
        {"status": {"$ne": "Closed"}},
        {"_id": 0}
    ).sort("priority", 1).to_list(100)
    return calls

@api_router.get("/calls/recordings")
async def get_call_recordings(current_user: User = Depends(get_current_user)):
    """Get all calls with recordings."""
    calls = await db.active_calls.find(
        {"recording_url": {"$exists": True, "$ne": None}},
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    return calls

@api_router.get("/calls/{call_id}/recording")
async def get_call_recording(call_id: str, current_user: User = Depends(get_current_user)):
    """Get recording URL for a specific call."""
    call = await db.active_calls.find_one({"id": call_id}, {"_id": 0})
    if not call:
        raise HTTPException(status_code=404, detail="Call not found")
    
    if not call.get('recording_url'):
        raise HTTPException(status_code=404, detail="No recording available for this call")
    
    # Return the recording URL with authentication
    recording_url = call['recording_url']
    
    # If it's a Twilio URL, add authentication
    if 'twilio.com' in recording_url:
        # Add .mp3 extension to get audio format
        if not recording_url.endswith('.mp3'):
            recording_url = recording_url + '.mp3'
    
    return {
        "call_id": call_id,
        "call_sid": call.get('call_sid'),
        "recording_url": recording_url,
        "recording_duration": call.get('recording_duration'),
        "caller_phone": call.get('caller_phone'),
        "incident_type": call.get('incident_type'),
        "location": call.get('location'),
        "created_at": call.get('created_at'),
        "transcription": call.get('transcription')
    }

@api_router.post("/calls/{call_id}/attach")
async def attach_to_call(call_id: str, current_user: User = Depends(get_current_user)):
    """Officer attaches to a call - dispatcher will announce this to caller."""
    # Get officer details
    officer_name = current_user.full_name
    badge_number = current_user.badge_number
    
    result = await db.active_calls.update_one(
        {"id": call_id},
        {"$set": {
            "assigned_officer": current_user.badge_number,
            "assigned_officer_name": officer_name,
            "status": "Dispatched",
            "officer_notified": True,  # Flag to tell dispatcher to announce
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Call not found")
    
    return {"message": f"Officer {badge_number} attached to call"}

@api_router.post("/calls/{call_id}/on-scene")
async def mark_on_scene(call_id: str, current_user: User = Depends(get_current_user)):
    """Officer marks themselves as on scene - only then does call end."""
    result = await db.active_calls.update_one(
        {"id": call_id, "assigned_officer": current_user.badge_number},
        {"$set": {
            "officer_on_scene": True,
            "status": "On Scene",
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Call not found or not assigned to you")
    
    return {"message": "Marked as on scene"}

@api_router.post("/calls/{call_id}/close")
async def close_call(call_id: str, current_user: User = Depends(get_current_user)):
    """Close/complete a call."""
    await db.active_calls.update_one(
        {"id": call_id},
        {"$set": {"status": "Closed", "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    return {"message": "Call closed"}

# Person Search
@api_router.get("/search/person")
async def search_person(
    first_name: Optional[str] = None,
    last_name: Optional[str] = None,
    dob: Optional[str] = None,
    dl: Optional[str] = None,
    current_user: User = Depends(get_current_user)
):
    query = {}
    if first_name:
        query["first_name"] = {"$regex": first_name, "$options": "i"}
    if last_name:
        query["last_name"] = {"$regex": last_name, "$options": "i"}
    if dob:
        query["dob"] = dob
    if dl:
        query["drivers_license"] = dl
    
    results = await db.persons.find(query, {"_id": 0}).to_list(100)
    return results

# Vehicle Search  
@api_router.get("/search/vehicle")
async def search_vehicle(
    plate: Optional[str] = None,
    vin: Optional[str] = None,
    current_user: User = Depends(get_current_user)
):
    query = {}
    if plate:
        query["plate_number"] = {"$regex": plate, "$options": "i"}
    if vin:
        query["vin"] = vin
    
    results = await db.vehicles.find(query, {"_id": 0}).to_list(100)
    return results

# Citations with auto-fine and person linking
@api_router.post("/citations", response_model=Citation)
async def create_citation(citation_data: dict, current_user: User = Depends(get_current_user)):
    # Auto-generate fine amount
    fine_amount = get_fine_amount(citation_data['violation_code'])
    citation_data['fine_amount'] = fine_amount
    
    # Find or create person record
    person_id = await find_or_create_person(citation_data)
    citation_data['person_id'] = person_id
    
    citation = Citation(
        **citation_data,
        officer_badge=current_user.badge_number,
        officer_name=current_user.full_name
    )
    
    # Save citation
    await db.citations.insert_one(citation.model_dump())
    
    # Update person record with citation
    await db.persons.update_one(
        {"id": person_id},
        {"$push": {"citations": citation.id}}
    )
    
    return citation

@api_router.get("/citations")
async def get_citations(current_user: User = Depends(get_current_user)):
    citations = await db.citations.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return citations

# AI endpoints (keeping existing ones)
@api_router.post("/ai/analyze-plate")
async def analyze_plate(plate_data: dict, current_user: User = Depends(get_current_user)):
    try:
        plate_number = plate_data.get('plate_number', '')
        state = plate_data.get('state', '')
        context = plate_data.get('context', '')
        
        vehicle = await db.vehicles.find_one({"plate_number": plate_number}, {"_id": 0})
        
        prompt = f"""Analyze this license plate and provide a detailed law enforcement assessment:

Plate: {plate_number}
State: {state}
Context: {context}
Database Record: {json.dumps(vehicle) if vehicle else 'No record found'}

Provide:
1. Risk assessment (Low/Medium/High)
2. Potential concerns or flags
3. Recommended actions for the officer
4. Any notable patterns or indicators

Format as JSON with keys: risk_level, concerns, recommendations, notes"""
        
        response_obj = await openai_client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You are a law enforcement AI assistant analyzing vehicle information."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.3
        )
        response = response_obj.choices[0].message.content
        
        try:
            analysis = json.loads(response)
        except:
            analysis = {"risk_level": "Unknown", "raw_response": response}
        
        return {"vehicle": vehicle, "analysis": analysis}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI analysis failed: {str(e)}")

@api_router.post("/ai/generate-report")
async def generate_report(report_data: dict, current_user: User = Depends(get_current_user)):
    try:
        prompt = f"""Generate a professional police incident report based on this information:

Incident Type: {report_data.get('incident_type', '')}
Date/Time: {report_data.get('date_time', '')}
Location: {report_data.get('location', '')}
Officer: {current_user.full_name} (Badge #{current_user.badge_number})

Brief Details:
{report_data.get('details', '')}

Generate a complete narrative following standard police report format. Be factual, detailed, and professional."""
        
        narrative_obj = await openai_client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": "You are an expert police report writer. Generate professional, detailed incident reports."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.5
        )
        narrative = narrative_obj.choices[0].message.content
        
        return {"narrative": narrative}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Report generation failed: {str(e)}")

@api_router.post("/ai/match-suspect")
async def match_suspect(suspect_data: dict, current_user: User = Depends(get_current_user)):
    try:
        persons = await db.persons.find({}, {"_id": 0}).to_list(1000)
        
        prompt = f"""Analyze this suspect description and find potential matches from the database:

Suspect Description:
{json.dumps(suspect_data, indent=2)}

Database Records:
{json.dumps(persons[:50], indent=2)}

Identify the top 5 most likely matches based on physical characteristics, age, location, and any other relevant factors. 

Return JSON array with: [{{"person_id": "id", "match_confidence": "percentage", "matching_factors": ["list"], "notes": "details"}}]"""
        
        response_obj = await openai_client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": "You are a law enforcement AI analyzing suspect information to find potential matches."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.3
        )
        response = response_obj.choices[0].message.content
        
        try:
            matches = json.loads(response)
        except:
            matches = []
        
        return {"matches": matches}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Suspect matching failed: {str(e)}")

@api_router.get("/ai/predict-crime")
async def predict_crime(current_user: User = Depends(get_current_user)):
    try:
        reports = await db.reports.find({}, {"_id": 0}).sort("created_at", -1).to_list(100)
        
        prompt = f"""Analyze these recent incident reports and provide predictive crime analysis:

{json.dumps(reports[:50], indent=2)}

Provide:
1. Crime trend analysis (increasing/decreasing patterns)
2. Hot spot locations
3. Time-based patterns (day/time when crimes occur)
4. Crime type predictions for next 7 days
5. Patrol recommendations

Return as JSON with keys: trends, hotspots, time_patterns, predictions, recommendations"""
        
        response_obj = await openai_client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": "You are a crime analyst AI providing predictive insights for law enforcement."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.5
        )
        response = response_obj.choices[0].message.content
        
        try:
            analysis = json.loads(response)
        except:
            analysis = {"raw_response": response}
        
        return analysis
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Predictive analysis failed: {str(e)}")

# Reports
@api_router.post("/reports", response_model=IncidentReport)
async def create_report(report_data: dict, current_user: User = Depends(get_current_user)):
    report = IncidentReport(
        **report_data,
        reporting_officer=current_user.full_name,
        badge_number=current_user.badge_number
    )
    await db.reports.insert_one(report.model_dump())
    return report

@api_router.get("/reports")
async def get_reports(current_user: User = Depends(get_current_user)):
    reports = await db.reports.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return reports

# Seed Data
@api_router.post("/seed/generate")
async def generate_seed_data(current_user: User = Depends(get_current_user)):
    if current_user.role != 'admin':
        raise HTTPException(status_code=403, detail="Admin access required")
    
    persons_data = [
        PersonRecord(
            first_name="John", last_name="Doe", dob="1985-03-15",
            drivers_license="D1234567", dl_state="CA",
            address="123 Main St", city="Los Angeles", state="CA",
            warrants=[{"type": "Traffic", "date": "2024-01-15", "amount": 250}],
            priors=[{"offense": "DUI", "date": "2020-06-10", "disposition": "Convicted"}]
        ).model_dump(),
        PersonRecord(
            first_name="Jane", last_name="Smith", dob="1990-07-22",
            drivers_license="S9876543", dl_state="CA",
            address="456 Oak Ave", city="San Diego", state="CA"
        ).model_dump()
    ]
    
    vehicles_data = [
        VehicleRecord(
            plate_number="ABC123", state="CA", vin="1HGBH41JXMN109186",
            make="Honda", model="Civic", year=2020, color="Blue",
            registered_owner="John Doe", registration_status="Active"
        ).model_dump(),
        VehicleRecord(
            plate_number="XYZ789", state="CA", vin="2T1BURHE0JC123456",
            make="Toyota", model="Camry", year=2018, color="White",
            registered_owner="Jane Smith", registration_status="Active",
            flags=["EXPIRED"]
        ).model_dump()
    ]
    
    existing_persons = await db.persons.count_documents({})
    if existing_persons == 0:
        await db.persons.insert_many(persons_data)
    
    existing_vehicles = await db.vehicles.count_documents({})
    if existing_vehicles == 0:
        await db.vehicles.insert_many(vehicles_data)
    
    return {"message": "Sample data generated", "persons": len(persons_data), "vehicles": len(vehicles_data)}

# Serve audio files for ElevenLabs - moved to /api/audio for ingress routing
@api_router.get("/audio/{filename}")
async def serve_audio(filename: str):
    """Serve generated audio files."""
    audio_file = AUDIO_CACHE_DIR / filename
    if audio_file.exists():
        return FileResponse(audio_file, media_type="audio/mpeg")
    raise HTTPException(status_code=404, detail="Audio file not found")

# Test page for dispatch audio
@app.get("/test-dispatch")
async def test_dispatch():
    """Serve test page for dispatch audio."""
    from fastapi.responses import FileResponse
    return FileResponse("/app/backend/test_dispatch_audio.html")

# Recordings viewer page
@app.get("/recordings")
async def recordings_viewer():
    """Serve recordings viewer page."""
    return FileResponse(ROOT_DIR / "recordings_viewer.html")

# Include router with all routes
app.include_router(api_router)

# WebSocket endpoint for OpenAI Realtime API
@app.websocket("/ws/media")
async def websocket_media_stream(websocket: WebSocket):
    """WebSocket endpoint for Twilio Media Streams + OpenAI Realtime API"""
    await websocket.accept()
    logger.info("WebSocket connection accepted")
    
    call_sid = None
    stream_sid = None
    dispatcher = None
    
    try:
        # Wait for messages from Twilio
        while True:
            message = await websocket.receive_text()
            data = json.loads(message)
            event_type = data.get('event')
            
            logger.info(f"Received WebSocket message: {event_type}")
            
            if event_type == 'start':
                call_sid = data['start']['callSid']
                stream_sid = data['start']['streamSid']
                logger.info(f"Media stream started for call {call_sid}, stream {stream_sid}")
                
                # Create realtime dispatcher with stream_sid
                dispatcher = RealtimeDispatcher(call_sid, db, stream_sid)
                
                # Run the bidirectional audio streaming
                await dispatcher.run(websocket)
                break
                
            elif event_type == 'connected':
                logger.info("Twilio Media Streams connected, waiting for start event")
                continue
            
    except WebSocketDisconnect:
        logger.info(f"WebSocket disconnected for call {call_sid}")
    except Exception as e:
        logger.error(f"WebSocket error for call {call_sid}: {e}")
        import traceback
        traceback.print_exc()
    finally:
        if dispatcher and dispatcher.openai_ws:
            try:
                await dispatcher.openai_ws.close()
                logger.info(f"Cleaned up OpenAI WebSocket for call {call_sid}")
            except:
                pass
                pass


app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
