"""
OpenAI Realtime API Integration for Officer Radio App
Voice-to-voice conversation with function calling for person and vehicle searches
"""
import asyncio
import json
import os
import websockets
import base64
import subprocess
import tempfile
import struct
import io
from fastapi import WebSocket
from datetime import datetime, timezone
import logging

logger = logging.getLogger(__name__)

OPENAI_API_KEY = os.environ.get('OPENAI_API_KEY')
OPENAI_REALTIME_URL = "wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-12-17"

# Function definitions for OpenAI Realtime API
OFFICER_RADIO_FUNCTIONS = [
    {
        "type": "function",
        "name": "search_person",
        "description": "Search for a person by name or driver's license",
        "parameters": {
            "type": "object",
            "properties": {
                "first_name": {"type": "string", "description": "Person's first name"},
                "last_name": {"type": "string", "description": "Person's last name"},
                "drivers_license": {"type": "string", "description": "Driver's license number"},
                "dob": {"type": "string", "description": "Date of birth in YYYY-MM-DD format"}
            }
        }
    },
    {
        "type": "function",
        "name": "search_vehicle",
        "description": "Search for a vehicle by license plate",
        "parameters": {
            "type": "object",
            "properties": {
                "plate_number": {"type": "string", "description": "License plate number"},
                "state": {"type": "string", "description": "State abbreviation (e.g., CA, NY)"}
            },
            "required": ["plate_number"]
        }
    }
]


class OfficerRadioDispatcher:
    """Handles real-time voice conversation between officer and OpenAI with database search functions"""
    
    def __init__(self, officer_id: str, db, websocket: WebSocket):
        self.officer_id = officer_id
        self.db = db
        self.mobile_ws = websocket
        self.openai_ws = None
    
    def convert_audio_to_pcm16(self, base64_audio: str) -> str:
        """Convert incoming audio to PCM16 24kHz mono base64 for OpenAI.
        
        Handles:
        1. WAV files (from iOS LinearPCM recording) - strips header, resamples if needed
        2. M4A/other formats - uses ffmpeg if available
        """
        try:
            audio_bytes = base64.b64decode(base64_audio)
            logger.info(f"Received audio: {len(audio_bytes)} bytes")
            
            # Check if it's a WAV file (starts with RIFF header)
            if len(audio_bytes) > 44 and audio_bytes[:4] == b'RIFF' and audio_bytes[8:12] == b'WAVE':
                return self._convert_wav_to_pcm16(audio_bytes)
            
            # Not WAV - try ffmpeg for M4A/other formats
            return self._convert_with_ffmpeg(audio_bytes)
            
        except Exception as e:
            logger.error(f"Error converting audio: {e}")
            raise
    
    def _convert_wav_to_pcm16(self, audio_bytes: bytes) -> str:
        """Extract PCM16 data from WAV file. If already 24kHz/16bit/mono, just strip header.
        Otherwise use ffmpeg to resample."""
        try:
            # Parse WAV header
            channels = struct.unpack_from('<H', audio_bytes, 22)[0]
            sample_rate = struct.unpack_from('<I', audio_bytes, 24)[0]
            bits_per_sample = struct.unpack_from('<H', audio_bytes, 34)[0]
            
            logger.info(f"WAV: {sample_rate}Hz, {channels}ch, {bits_per_sample}bit")
            
            # Find the data chunk
            data_offset = 44  # Standard WAV header size
            # Some WAV files have extra chunks, search for 'data'
            pos = 12
            while pos < len(audio_bytes) - 8:
                chunk_id = audio_bytes[pos:pos+4]
                chunk_size = struct.unpack_from('<I', audio_bytes, pos + 4)[0]
                if chunk_id == b'data':
                    data_offset = pos + 8
                    break
                pos += 8 + chunk_size
            
            pcm_data = audio_bytes[data_offset:]
            
            # If already in the right format, send directly
            if sample_rate == 24000 and channels == 1 and bits_per_sample == 16:
                logger.info(f"WAV already in correct format, sending {len(pcm_data)} bytes PCM16")
                return base64.b64encode(pcm_data).decode('utf-8')
            
            # Need to resample - use ffmpeg
            logger.info(f"WAV needs resampling from {sample_rate}Hz/{channels}ch/{bits_per_sample}bit")
            return self._convert_with_ffmpeg(audio_bytes)
            
        except Exception as e:
            logger.error(f"WAV parsing failed, trying ffmpeg: {e}")
            return self._convert_with_ffmpeg(audio_bytes)
    
    def _convert_with_ffmpeg(self, audio_bytes: bytes) -> str:
        """Convert any audio format to PCM16 24kHz mono using ffmpeg."""
        # Check if ffmpeg is available
        try:
            subprocess.run(['ffmpeg', '-version'], capture_output=True, check=True, timeout=5)
        except (FileNotFoundError, subprocess.CalledProcessError, subprocess.TimeoutExpired):
            logger.error("ffmpeg not available and audio is not PCM16 WAV - cannot convert")
            raise Exception("Audio conversion not possible: ffmpeg not available and audio format is not compatible")
        
        # Detect input format from magic bytes
        suffix = '.wav'
        if len(audio_bytes) > 4:
            if audio_bytes[4:8] == b'ftyp':
                suffix = '.m4a'
            elif audio_bytes[:3] == b'ID3' or audio_bytes[:2] == b'\xff\xfb':
                suffix = '.mp3'
        
        with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as input_file:
            input_path = input_file.name
            input_file.write(audio_bytes)
        
        with tempfile.NamedTemporaryFile(suffix='.pcm', delete=False) as output_file:
            output_path = output_file.name
        
        try:
            result = subprocess.run([
                'ffmpeg',
                '-i', input_path,
                '-f', 's16le',
                '-acodec', 'pcm_s16le',
                '-ar', '24000',
                '-ac', '1',
                '-y',
                output_path
            ], 
            capture_output=True, 
            check=True,
            timeout=10
            )
            
            with open(output_path, 'rb') as f:
                pcm_bytes = f.read()
            
            pcm_base64 = base64.b64encode(pcm_bytes).decode('utf-8')
            logger.info(f"ffmpeg converted: {len(audio_bytes)} bytes -> {len(pcm_bytes)} bytes PCM16")
            return pcm_base64
            
        finally:
            try:
                os.unlink(input_path)
                os.unlink(output_path)
            except:
                pass
        
    async def connect_to_openai(self):
        """Connect to OpenAI Realtime API"""
        try:
            logger.info(f"Connecting to OpenAI Realtime API for officer {self.officer_id}")
            
            # Connect to OpenAI Realtime API
            self.openai_ws = await websockets.connect(
                OPENAI_REALTIME_URL,
                additional_headers={
                    "Authorization": f"Bearer {OPENAI_API_KEY}",
                    "OpenAI-Beta": "realtime=v1"
                },
                ping_interval=20,
                ping_timeout=10
            )
            
            logger.info(f"WebSocket connected for officer {self.officer_id}")
            
            # Configure the session with function definitions
            session_config = {
                "type": "session.update",
                "session": {
                    "modalities": ["text", "audio"],
                    "instructions": """You are a professional AI dispatcher assistant for law enforcement officers. Your role:

PERSONALITY:
- Professional, efficient, and clear
- Speak naturally and conversationally
- Acknowledge requests promptly
- Provide concise, relevant information

YOUR CAPABILITIES:
You can search for:
1. Person records (by name, driver's license, or date of birth)
2. Vehicle records (by license plate number and state)

CONVERSATION FLOW:
1. Listen to the officer's request
2. Extract the relevant search parameters
3. Call the appropriate search function
4. Relay the results clearly and professionally
5. Ask for clarification if needed

RESPONSE STYLE:
- Keep responses brief and to the point (10-20 words typically)
- For search results, state key information: name, DOB, warrants, vehicle details
- If no results found, say so clearly
- If you need more information, ask specific questions

EXAMPLES:
Officer: "Run a plate for California ABC123"
You: "Running California plate ABC-1-2-3" [call search_vehicle]
Then: "2020 Toyota Camry, registered to John Doe, no flags"

Officer: "Search for John Smith, DOB 1985-03-15"
You: "Searching for John Smith" [call search_person]
Then: "John Smith, DOB March 15, 1985, one active warrant for failure to appear"

Officer: "Check license DL12345678"
You: "Checking driver's license" [call search_person]
Then: "Jane Doe, DOB June 10, 1990, no warrants, two priors"

Keep it professional and efficient.""",
                    "voice": "alloy",
                    "input_audio_format": "pcm16",
                    "output_audio_format": "pcm16",
                    "input_audio_transcription": {
                        "model": "whisper-1"
                    },
                    "turn_detection": {
                        "type": "server_vad",
                        "threshold": 0.5,
                        "prefix_padding_ms": 300,
                        "silence_duration_ms": 700
                    },
                    "tools": OFFICER_RADIO_FUNCTIONS,
                    "tool_choice": "auto",
                    "temperature": 0.7,
                    "max_response_output_tokens": 150
                }
            }
            
            await self.openai_ws.send(json.dumps(session_config))
            logger.info(f"Session config sent for officer {self.officer_id}")
            
        except Exception as e:
            logger.error(f"Failed to connect to OpenAI for officer {self.officer_id}: {e}")
            raise
    
    async def handle_mobile_audio(self):
        """Handle incoming audio from mobile app and forward to OpenAI"""
        try:
            while True:
                message = await self.mobile_ws.receive_text()
                data = json.loads(message)
                
                message_type = data.get('type')
                
                if message_type == 'audio_stream':
                    # Convert audio to PCM16 before sending to OpenAI
                    try:
                        pcm16_audio = self.convert_audio_to_pcm16(data['audio'])
                        
                        # Forward converted audio to OpenAI
                        audio_append = {
                            "type": "input_audio_buffer.append",
                            "audio": pcm16_audio
                        }
                        if self.openai_ws:
                            await self.openai_ws.send(json.dumps(audio_append))
                    except Exception as e:
                        logger.error(f"Error converting/sending audio: {e}")
                        # Send error to mobile
                        error_msg = {
                            "type": "error",
                            "error": f"Audio conversion failed: {str(e)}"
                        }
                        await self.mobile_ws.send_text(json.dumps(error_msg))
                    
                elif message_type == 'end_transmission':
                    logger.info(f"Officer {self.officer_id} ended transmission")
                    # Optionally commit the audio buffer
                    # await self.openai_ws.send(json.dumps({"type": "input_audio_buffer.commit"}))
                    
                elif message_type == 'start_transmission':
                    logger.info(f"Officer {self.officer_id} started transmission")
                    
        except Exception as e:
            logger.error(f"Error handling mobile audio for officer {self.officer_id}: {e}")
            
    async def handle_openai_responses(self):
        """Handle responses from OpenAI and send to mobile app"""
        try:
            async for message in self.openai_ws:
                data = json.loads(message)
                event_type = data.get('type')
                
                logger.info(f"Officer {self.officer_id} - OpenAI event: {event_type}")
                
                if event_type == 'session.created':
                    logger.info(f"OpenAI session created for officer {self.officer_id}")
                    
                elif event_type == 'session.updated':
                    logger.info(f"OpenAI session updated for officer {self.officer_id}")
                
                elif event_type == 'response.audio.delta':
                    # Stream audio back to mobile app
                    audio_data = data.get('delta')
                    if audio_data:
                        logger.debug(f"Officer {self.officer_id} - Sending audio chunk to mobile (length: {len(audio_data)})")
                        mobile_message = {
                            "type": "audio_response",
                            "audio": audio_data,
                            "format": "pcm16",
                            "timestamp": datetime.now(timezone.utc).timestamp()
                        }
                        await self.mobile_ws.send_text(json.dumps(mobile_message))
                
                elif event_type == 'response.audio.done':
                    # All audio chunks sent - tell mobile app to play buffered audio
                    logger.info(f"Officer {self.officer_id} - Audio response complete")
                    done_message = {
                        "type": "audio_done",
                        "timestamp": datetime.now(timezone.utc).timestamp()
                    }
                    await self.mobile_ws.send_text(json.dumps(done_message))
                
                elif event_type == 'response.audio_transcript.delta':
                    # Log what the AI is saying
                    transcript_delta = data.get('delta', '')
                    if transcript_delta:
                        logger.info(f"Officer {self.officer_id} - AI speaking: {transcript_delta}")
                
                elif event_type == 'response.audio_transcript.done':
                    # Full transcript of what AI said
                    transcript = data.get('transcript', '')
                    if transcript:
                        logger.info(f"Officer {self.officer_id} - AI said: {transcript}")
                        # Send transcript to mobile app
                        transcript_message = {
                            "type": "transcript",
                            "speaker": "dispatcher",
                            "text": transcript,
                            "timestamp": datetime.now(timezone.utc).timestamp()
                        }
                        await self.mobile_ws.send_text(json.dumps(transcript_message))
                        
                elif event_type == 'conversation.item.input_audio_transcription.completed':
                    # Log what officer said
                    transcript = data.get('transcript', '')
                    if transcript:
                        logger.info(f"Officer {self.officer_id} - Officer said: {transcript}")
                        # Send transcript to mobile app
                        transcript_message = {
                            "type": "transcript",
                            "speaker": "officer",
                            "text": transcript,
                            "timestamp": datetime.now(timezone.utc).timestamp()
                        }
                        await self.mobile_ws.send_text(json.dumps(transcript_message))
                
                elif event_type == 'response.function_call_arguments.done':
                    # Function call completed, execute it
                    call_id = data.get('call_id')
                    function_name = data.get('name')
                    arguments_str = data.get('arguments', '{}')
                    
                    logger.info(f"Officer {self.officer_id} - Function call: {function_name} with args: {arguments_str}")
                    
                    try:
                        arguments = json.loads(arguments_str)
                        result = await self.execute_function(function_name, arguments)
                        
                        # Send function result back to OpenAI
                        function_output = {
                            "type": "conversation.item.create",
                            "item": {
                                "type": "function_call_output",
                                "call_id": call_id,
                                "output": json.dumps(result)
                            }
                        }
                        await self.openai_ws.send(json.dumps(function_output))
                        
                        # Trigger response generation
                        await self.openai_ws.send(json.dumps({"type": "response.create"}))
                        
                        # Send function result to mobile app for display
                        function_result_message = {
                            "type": "function_result",
                            "function": function_name,
                            "query": arguments,
                            "result": result,
                            "timestamp": datetime.now(timezone.utc).timestamp()
                        }
                        await self.mobile_ws.send_text(json.dumps(function_result_message))
                        
                    except Exception as e:
                        logger.error(f"Error executing function {function_name}: {e}")
                        # Send error back to OpenAI
                        error_output = {
                            "type": "conversation.item.create",
                            "item": {
                                "type": "function_call_output",
                                "call_id": call_id,
                                "output": json.dumps({"error": str(e)})
                            }
                        }
                        await self.openai_ws.send(json.dumps(error_output))
                        await self.openai_ws.send(json.dumps({"type": "response.create"}))
                
                elif event_type == 'error':
                    error_msg = data.get('error', {})
                    logger.error(f"OpenAI error for officer {self.officer_id}: {error_msg}")
                    # Send error to mobile app
                    error_message = {
                        "type": "error",
                        "code": "OPENAI_ERROR",
                        "message": str(error_msg),
                        "timestamp": datetime.now(timezone.utc).timestamp()
                    }
                    await self.mobile_ws.send_text(json.dumps(error_message))
                    
        except websockets.exceptions.ConnectionClosed:
            logger.warning(f"OpenAI connection closed for officer {self.officer_id}")
        except Exception as e:
            logger.error(f"Error handling OpenAI responses for officer {self.officer_id}: {e}")
            import traceback
            traceback.print_exc()
    
    async def execute_function(self, function_name: str, arguments: dict):
        """Execute database search functions"""
        try:
            if function_name == "search_person":
                return await self.search_person(arguments)
            elif function_name == "search_vehicle":
                return await self.search_vehicle(arguments)
            else:
                return {"error": f"Unknown function: {function_name}"}
        except Exception as e:
            logger.error(f"Error in execute_function: {e}")
            return {"error": str(e)}
    
    async def search_person(self, params: dict):
        """Search for a person in the database"""
        try:
            query = {}
            
            if params.get('first_name'):
                query["first_name"] = {"$regex": params['first_name'], "$options": "i"}
            if params.get('last_name'):
                query["last_name"] = {"$regex": params['last_name'], "$options": "i"}
            if params.get('dob'):
                query["dob"] = params['dob']
            if params.get('drivers_license'):
                query["drivers_license"] = params['drivers_license']
            
            if not query:
                return {"error": "No search parameters provided"}
            
            results = await self.db.persons.find(query, {"_id": 0}).to_list(10)
            
            if not results:
                return {"found": False, "message": "No records found"}
            
            return {"found": True, "results": results, "count": len(results)}
            
        except Exception as e:
            logger.error(f"Error in search_person: {e}")
            return {"error": f"Database query failed: {str(e)}"}
    
    async def search_vehicle(self, params: dict):
        """Search for a vehicle in the database"""
        try:
            query = {}
            
            if params.get('plate_number'):
                query["plate_number"] = {"$regex": params['plate_number'], "$options": "i"}
            if params.get('state'):
                query["state"] = {"$regex": params['state'], "$options": "i"}
            
            if not query:
                return {"error": "No search parameters provided"}
            
            results = await self.db.vehicles.find(query, {"_id": 0}).to_list(10)
            
            if not results:
                return {"found": False, "message": "No records found"}
            
            return {"found": True, "results": results, "count": len(results)}
            
        except Exception as e:
            logger.error(f"Error in search_vehicle: {e}")
            return {"error": f"Database query failed: {str(e)}"}
    
    async def run(self):
        """Main loop - bidirectional audio streaming"""
        try:
            await self.connect_to_openai()
            
            # Run both handlers concurrently
            await asyncio.gather(
                self.handle_mobile_audio(),
                self.handle_openai_responses()
            )
            
        except Exception as e:
            logger.error(f"Error in officer radio dispatcher for officer {self.officer_id}: {e}")
            import traceback
            traceback.print_exc()
        finally:
            if self.openai_ws:
                try:
                    await self.openai_ws.close()
                    logger.info(f"OpenAI WebSocket closed for officer {self.officer_id}")
                except:
                    pass
