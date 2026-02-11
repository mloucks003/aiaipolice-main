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
        self.conversation_history = []
        self.question_count = 0
        self.has_location = False
        self.has_incident_type = False
        
    async def connect_to_openai(self):
        """Connect to OpenAI Realtime API"""
        headers = {
            "Authorization": f"Bearer {OPENAI_API_KEY}",
            "OpenAI-Beta": "realtime=v1"
        }
        
        self.openai_ws = await websockets.connect(
            OPENAI_REALTIME_URL,
            extra_headers=headers
        )
        
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
        logger.info(f"Connected to OpenAI Realtime API for call {self.call_sid}")
        
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
                    await self.openai_ws.send(json.dumps(audio_append))
                    
                elif data['event'] == 'start':
                    logger.info(f"Media stream started for call {self.call_sid}")
                    
                elif data['event'] == 'stop':
                    logger.info(f"Media stream stopped for call {self.call_sid}")
                    break
                    
        except Exception as e:
            logger.error(f"Error handling Twilio audio: {e}")
            
    async def handle_openai_responses(self, twilio_ws: WebSocket):
        """Handle responses from OpenAI and send to Twilio"""
        try:
            async for message in self.openai_ws:
                data = json.loads(message)
                event_type = data.get('type')
                
                if event_type == 'response.audio.delta':
                    # Stream audio back to Twilio
                    audio_data = data.get('delta')
                    if audio_data:
                        twilio_message = {
                            "event": "media",
                            "streamSid": self.call_sid,
                            "media": {
                                "payload": audio_data
                            }
                        }
                        await twilio_ws.send_text(json.dumps(twilio_message))
                        
                elif event_type == 'conversation.item.input_audio_transcription.completed':
                    # Log what caller said
                    transcript = data.get('transcript', '')
                    self.conversation_history.append(f"Caller: {transcript}")
                    logger.info(f"Caller said: {transcript}")
                    
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
                    
                    # Extract info from conversation
                    full_transcript = "\n".join(self.conversation_history)
                    
                    # Simple keyword detection for location and incident
                    if any(word in full_transcript.lower() for word in ['street', 'avenue', 'road', 'address', 'at ']):
                        self.has_location = True
                    
                    if any(word in full_transcript.lower() for word in ['fire', 'medical', 'police', 'accident', 'emergency']):
                        self.has_incident_type = True
                    
                    # Dispatch after 3 questions or if we have critical info
                    if self.question_count >= 3 or (self.has_location and self.has_incident_type):
                        # Send dispatch message
                        dispatch_msg = {
                            "type": "response.create",
                            "response": {
                                "modalities": ["audio"],
                                "instructions": "Tell the caller: 'Okay, help is on the way. Stay on the line.' Then end the conversation."
                            }
                        }
                        await self.openai_ws.send(json.dumps(dispatch_msg))
                        
                        # Update call status
                        await self.db.active_calls.update_one(
                            {"call_sid": self.call_sid},
                            {"$set": {
                                "status": "Active",
                                "updated_at": datetime.now(timezone.utc).isoformat()
                            }}
                        )
                        
                elif event_type == 'error':
                    logger.error(f"OpenAI error: {data}")
                    
        except Exception as e:
            logger.error(f"Error handling OpenAI responses: {e}")
            
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
            logger.error(f"Error in realtime dispatcher: {e}")
        finally:
            if self.openai_ws:
                await self.openai_ws.close()
