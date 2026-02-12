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
OPENAI_REALTIME_URL = "wss://api.openai.com/v1/realtime?model=gpt-realtime"

class RealtimeDispatcher:
    """Handles real-time voice conversation between caller and OpenAI"""
    
    def __init__(self, call_sid: str, db, stream_sid: str):
        self.call_sid = call_sid
        self.db = db
        self.openai_ws = None
        self.stream_sid = stream_sid  # Set immediately from constructor
        self.conversation_history = []
        self.question_count = 0
        self.has_location = False
        self.has_incident_type = False
        self.should_dispatch = False
        self.last_audio_time = None  # Track when we last received audio
        self.silence_task = None  # Task for detecting silence
        
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
            
            # Configure the session - USE CORRECT FORMAT from Twilio example
            session_config = {
                "type": "session.update",
                "session": {
                    "modalities": ["text", "audio"],
                    "instructions": """You are a compassionate, professional 911 emergency dispatcher. Your role:

IMPORTANT: You are an AI test system built by Patriot CAD Systems for demonstration purposes only.

PERSONALITY:
- Warm, caring, and empathetic - you genuinely care about helping people
- Calm under pressure but show appropriate concern and urgency
- Speak naturally with emotion - vary your tone based on the situation
- Use reassuring phrases: "You're doing great", "I'm here with you", "Help is coming"
- Sound like a real human, not a robot

CONVERSATION FLOW:
1. ALWAYS greet first: "This is an AI test system built by Patriot CAD Systems. 911, what's your emergency?"
2. Listen carefully and respond with empathy
3. Gather information through natural conversation (5-7 exchanges):
   - Exact location (address, cross streets, landmarks)
   - Nature of emergency (medical, fire, police, traffic)
   - Current situation and immediate dangers
   - Injuries or people involved
   - Caller's safety and emotional state
4. Keep caller engaged and calm throughout
5. Only dispatch after you have clear location + incident details

TONE EXAMPLES:
- Medical: "Okay, stay with me. Is the person breathing? You're doing great."
- Fire: "I understand you're scared. Are you in a safe location right now?"
- Police: "I hear you. Help is on the way. Can you describe what's happening?"

Keep responses conversational (15-30 words). Show emotion and empathy.""",
                    "voice": "alloy",
                    "input_audio_format": "g711_ulaw",
                    "output_audio_format": "g711_ulaw",
                    "input_audio_transcription": {
                        "model": "whisper-1"
                    },
                    "turn_detection": None,  # DISABLE server VAD - we'll handle turns manually
                    "temperature": 0.9,
                    "max_response_output_tokens": 150
                }
            }
            
            await self.openai_ws.send(json.dumps(session_config))
            logger.info(f"Session config sent for call {self.call_sid}")
            
        except Exception as e:
            logger.error(f"Failed to connect to OpenAI for call {self.call_sid}: {e}")
            raise
    
    async def trigger_initial_greeting(self):
        """Send initial conversation item to make AI speak first - EXACTLY like Twilio example"""
        try:
            # Send conversation item with greeting prompt
            initial_conversation_item = {
                "type": "conversation.item.create",
                "item": {
                    "type": "message",
                    "role": "user",
                    "content": [
                        {
                            "type": "input_text",
                            "text": "Greet the caller as instructed in your system prompt."
                        }
                    ]
                }
            }
            await self.openai_ws.send(json.dumps(initial_conversation_item))
            logger.info(f"Sent initial conversation item for call {self.call_sid}")
            
            # Immediately trigger response creation
            await self.openai_ws.send(json.dumps({"type": "response.create"}))
            logger.info(f"Triggered response.create for call {self.call_sid}")
        except Exception as e:
            logger.error(f"Failed to trigger initial greeting for call {self.call_sid}: {e}")
        
    async def check_for_silence(self):
        """Monitor for silence and trigger AI response when user stops speaking"""
        import time
        while True:
            await asyncio.sleep(0.5)  # Check every 500ms
            
            if self.last_audio_time:
                silence_duration = time.time() - self.last_audio_time
                
                # If 1.5 seconds of silence, trigger AI response
                if silence_duration >= 1.5:
                    logger.info(f"Call {self.call_sid} - Detected 1.5s silence, triggering AI response")
                    try:
                        # Commit the audio buffer and trigger response
                        await self.openai_ws.send(json.dumps({
                            "type": "input_audio_buffer.commit"
                        }))
                        await self.openai_ws.send(json.dumps({
                            "type": "response.create"
                        }))
                        self.last_audio_time = None  # Reset
                    except Exception as e:
                        logger.error(f"Error triggering response: {e}")
        
    async def handle_twilio_audio(self, twilio_ws: WebSocket):
        """Handle incoming audio from Twilio and send to OpenAI"""
        import time
        try:
            while True:
                message = await twilio_ws.receive_text()
                data = json.loads(message)
                
                if data['event'] == 'media':
                    # Update last audio time
                    self.last_audio_time = time.time()
                    
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
                
                logger.info(f"Call {self.call_sid} - OpenAI event: {event_type}")
                
                if event_type == 'session.created':
                    logger.info(f"OpenAI session created for call {self.call_sid}")
                    
                elif event_type == 'session.updated':
                    logger.info(f"OpenAI session updated for call {self.call_sid}")
                    # Trigger initial greeting so AI speaks first
                    await self.trigger_initial_greeting()
                    logger.info(f"Session ready, triggered initial greeting for call {self.call_sid}")
                
                elif event_type == 'response.created':
                    logger.info(f"Call {self.call_sid} - Response created: {json.dumps(data)[:500]}")
                
                elif event_type == 'response.output_item.added':
                    logger.info(f"Call {self.call_sid} - Output item added: {json.dumps(data)[:500]}")
                
                elif event_type == 'response.content_part.added':
                    logger.info(f"Call {self.call_sid} - Content part added: {json.dumps(data)[:500]}")
                
                elif event_type == 'response.audio_transcript.delta':
                    # Log what the AI is saying
                    transcript_delta = data.get('delta', '')
                    if transcript_delta:
                        logger.info(f"Call {self.call_sid} - AI speaking: {transcript_delta}")
                
                elif event_type == 'response.audio.delta':
                    # Stream audio back to Twilio
                    audio_data = data.get('delta')
                    if audio_data and self.stream_sid:
                        logger.info(f"Call {self.call_sid} - Sending audio chunk to Twilio (length: {len(audio_data)})")
                        twilio_message = {
                            "event": "media",
                            "streamSid": self.stream_sid,
                            "media": {
                                "payload": audio_data
                            }
                        }
                        await twilio_ws.send_text(json.dumps(twilio_message))
                    elif not self.stream_sid:
                        logger.warning(f"Call {self.call_sid} - No stream_sid available, cannot send audio")
                    elif not audio_data:
                        logger.warning(f"Call {self.call_sid} - No audio data in delta event: {json.dumps(data)[:200]}")
                
                elif event_type == 'response.audio_transcript.done':
                    # Full transcript of what AI said
                    transcript = data.get('transcript', '')
                    if transcript:
                        self.conversation_history.append(f"Dispatcher: {transcript}")
                        logger.info(f"Call {self.call_sid} - AI said: {transcript}")
                        
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
                
                else:
                    # Log ALL events to help debug audio issue
                    logger.info(f"Call {self.call_sid} - Unhandled event type: {event_type}, data: {json.dumps(data)[:500]}")
                    
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
        # Dispatch after 6 questions OR if we have location + incident type + at least 4 exchanges
        should_dispatch = (self.question_count >= 6) or (
            self.question_count >= 4 and self.has_location and self.has_incident_type
        )
        
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
            
            # Run all handlers concurrently including silence detection
            await asyncio.gather(
                self.handle_twilio_audio(twilio_ws),
                self.handle_openai_responses(twilio_ws),
                self.check_for_silence()  # Add silence detection
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
