"""
OpenAI Realtime API Integration for 911 Dispatcher
True voice-to-voice conversation with natural interruptions
"""
import asyncio
import base64
import json
import os
import websockets
from fastapi import WebSocket
from datetime import datetime, timezone
import logging

logger = logging.getLogger(__name__)

OPENAI_API_KEY = os.environ.get('OPENAI_API_KEY')
OPENAI_REALTIME_URL = "wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-10-01"

class RealtimeDispatcher:
    """Handles real-time voice conversation between caller and OpenAI"""
    
    def __init__(self, call_sid: str, db):
        self.call_sid = call_sid
        self.db = db
        self.openai_ws = None
        self.stream_sid = None
        self.conversation_history = []
        self.question_count = 0
        self.has_location = False
        self.has_incident_type = False
        self.should_dispatch = False
        
    async def connect_to_openai(self):
        """Connect to OpenAI Realtime API"""
        try:
            logger.info(f"Connecting to OpenAI Realtime API for call {self.call_sid}")
            
            # websockets 15.x uses additional_headers instead of extra_headers
            self.openai_ws = await websockets.connect(
                OPENAI_REALTIME_URL,
                additional_headers={
                    "Authorization": f"Bearer {OPENAI_API_KEY}",
                    "OpenAI-Beta": "realtime=v1"
                },
                ping_interval=20,
                ping_timeout=10
            )
            
            logger.info(f"WebSocket connected for call {self.call_sid}")
            
            # Configure the session
            session_config = {
                "type": "session.update",
                "session": {
                    "modalities": ["text", "audio"],
                    "instructions": """You are a professional 911 emergency dispatcher. Your role:

1. Stay calm and professional at all times
2. Gather critical information efficiently:
   - Location (address, cross streets, landmarks)
   - Nature of emergency (medical, fire, police, traffic)
   - Immediate dangers or injuries
3. Ask 2-3 focused questions maximum
4. Provide reassurance: "Okay", "I understand", "Help is on the way"
5. Speak naturally like a real human dispatcher
6. After gathering location + incident type, dispatch immediately

Keep responses under 20 words. Be conversational and empathetic.""",
                    "voice": "alloy",  # Professional female voice
                    "input_audio_format": "g711_ulaw",  # Twilio format
                    "output_audio_format": "g711_ulaw",
                    "input_audio_transcription": {
                        "model": "whisper-1"
                    },
                    "turn_detection": {
                        "type": "server_vad",  # Voice activity detection
                        "threshold": 0.5,
                        "prefix_padding_ms": 300,
                        "silence_duration_ms": 500
                    },
                    "temperature": 0.7,
                    "max_response_output_tokens": 150
                }
            }
            
            await self.openai_ws.send(json.dumps(session_config))
            logger.info(f"Session config sent for call {self.call_sid}")
            
        except Exception as e:
            logger.error(f"Failed to connect to OpenAI for call {self.call_sid}: {e}")
            raise
        
    async def handle_twilio_audio(self, twilio_ws: WebSocket):
        """Handle incoming audio from Twilio and send to OpenAI"""
        try:
            while True:
                message = await twilio_ws.receive_text()
                data = json.loads(message)
                
                if data['event'] == 'media':
                    # Forward audio to OpenAI
                    audio_append = {
                        "type": "input_audio_buffer.append",
                        "audio": data['media']['payload']  # base64 encoded audio
                    }
                    # Check if WebSocket is still open
                    if self.openai_ws:
                        try:
                            await self.openai_ws.send(json.dumps(audio_append))
                        except:
                            break
                    
                elif data['event'] == 'start':
                    self.stream_sid = data['start']['streamSid']
                    logger.info(f"Media stream started for call {self.call_sid}, stream {self.stream_sid}")
                    
                elif data['event'] == 'stop':
                    logger.info(f"Media stream stopped for call {self.call_sid}")
                    break
                    
        except Exception as e:
            logger.error(f"Error handling Twilio audio for call {self.call_sid}: {e}")
            
    async def handle_openai_responses(self, twilio_ws: WebSocket):
        """Handle responses from OpenAI and send to Twilio"""
        try:
            async for message in self.openai_ws:
                data = json.loads(message)
                event_type = data.get('type')
                
                if event_type == 'session.created':
                    logger.info(f"OpenAI session created for call {self.call_sid}")
                    
                elif event_type == 'session.updated':
                    logger.info(f"OpenAI session updated for call {self.call_sid}")
                
                elif event_type == 'response.audio.delta':
                    # Stream audio back to Twilio
                    audio_data = data.get('delta')
                    if audio_data and self.stream_sid:
                        twilio_message = {
                            "event": "media",
                            "streamSid": self.stream_sid,
                            "media": {
                                "payload": audio_data
                            }
                        }
                        await twilio_ws.send_text(json.dumps(twilio_message))
                        
                elif event_type == 'conversation.item.input_audio_transcription.completed':
                    # Log what caller said
                    transcript = data.get('transcript', '')
                    if transcript:
                        self.conversation_history.append(f"Caller: {transcript}")
                        logger.info(f"Call {self.call_sid} - Caller said: {transcript}")
                        
                        # Extract incident info
                        await self.extract_incident_info(transcript)
                        
                        # Update database
                        await self.db.active_calls.update_one(
                            {"call_sid": self.call_sid},
                            {"$set": {
                                "transcription": "\n".join(self.conversation_history),
                                "updated_at": datetime.now(timezone.utc).isoformat()
                            }}
                        )
                    
                elif event_type == 'response.done':
                    # Check if we should dispatch
                    self.question_count += 1
                    logger.info(f"Call {self.call_sid} - Question count: {self.question_count}")
                    
                    # Check dispatch conditions
                    if await self.check_dispatch_conditions():
                        await self.initiate_dispatch()
                        
                elif event_type == 'error':
                    error_msg = data.get('error', {})
                    logger.error(f"OpenAI error for call {self.call_sid}: {error_msg}")
                    
        except websockets.exceptions.ConnectionClosed:
            logger.warning(f"OpenAI connection closed for call {self.call_sid}")
        except Exception as e:
            logger.error(f"Error handling OpenAI responses for call {self.call_sid}: {e}")
            
    async def extract_incident_info(self, transcript: str):
        """Extract location and incident type from transcript"""
        transcript_lower = transcript.lower()
        
        # Detect location keywords
        location_keywords = ['street', 'avenue', 'road', 'address', 'at ', 'on ', 'near', 'boulevard', 'drive', 'lane']
        if any(word in transcript_lower for word in location_keywords):
            self.has_location = True
            logger.info(f"Call {self.call_sid} - Location detected")
            
            # Update database with location hint
            await self.db.active_calls.update_one(
                {"call_sid": self.call_sid},
                {"$set": {"location": transcript}}
            )
        
        # Detect incident type keywords
        incident_keywords = {
            'fire': 'Fire',
            'medical': 'Medical',
            'police': 'Police',
            'accident': 'Traffic',
            'emergency': 'Other',
            'robbery': 'Police',
            'assault': 'Police',
            'shooting': 'Police',
            'heart attack': 'Medical',
            'unconscious': 'Medical',
            'bleeding': 'Medical'
        }
        
        for keyword, incident_type in incident_keywords.items():
            if keyword in transcript_lower:
                self.has_incident_type = True
                logger.info(f"Call {self.call_sid} - Incident type detected: {incident_type}")
                
                # Update database with incident type
                await self.db.active_calls.update_one(
                    {"call_sid": self.call_sid},
                    {"$set": {"incident_type": incident_type}}
                )
                break
    
    async def check_dispatch_conditions(self) -> bool:
        """Check if we should dispatch"""
        # Dispatch after 3 questions OR if we have location + incident type
        should_dispatch = (self.question_count >= 3) or (self.has_location and self.has_incident_type)
        
        if should_dispatch and not self.should_dispatch:
            self.should_dispatch = True
            return True
        
        return False
    
    async def initiate_dispatch(self):
        """Initiate dispatch sequence"""
        logger.info(f"Call {self.call_sid} - Initiating dispatch")
        
        # Get call details for dispatch message
        call = await self.db.active_calls.find_one({"call_sid": self.call_sid}, {"_id": 0})
        
        if call:
            incident_type = call.get('incident_type', 'Unknown incident')
            location = call.get('location', 'Unknown location')
            
            # Update call status to Active
            await self.db.active_calls.update_one(
                {"call_sid": self.call_sid},
                {"$set": {
                    "status": "Active",
                    "updated_at": datetime.now(timezone.utc).isoformat()
                }}
            )
            
            logger.info(f"Call {self.call_sid} - Dispatch completed: {incident_type} at {location}")
            
    async def run(self, twilio_ws: WebSocket):
        """Main loop - bidirectional audio streaming"""
        try:
            await self.connect_to_openai()
            
            # Run both handlers concurrently
            await asyncio.gather(
                self.handle_twilio_audio(twilio_ws),
                self.handle_openai_responses(twilio_ws)
            )
            
        except Exception as e:
            logger.error(f"Error in realtime dispatcher for call {self.call_sid}: {e}")
            import traceback
            traceback.print_exc()
        finally:
            if self.openai_ws:
                try:
                    await self.openai_ws.close()
                    logger.info(f"OpenAI WebSocket closed for call {self.call_sid}")
                except:
                    pass
