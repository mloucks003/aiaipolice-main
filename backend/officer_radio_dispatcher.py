"""
OpenAI Realtime API Integration for Officer Radio App
Voice-to-voice conversation with function calling for person and vehicle searches
+ Background check system with parallel queries to free public APIs
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
import aiohttp
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
    },
    {
        "type": "function",
        "name": "get_active_calls",
        "description": "Get current active 911 calls and incidents. Returns all calls with their status, incident type, location, priority, and description.",
        "parameters": {
            "type": "object",
            "properties": {
                "status": {"type": "string", "description": "Filter by status: Active, Dispatched, Closed, or all. Default is active calls only.", "enum": ["Active", "Dispatched", "Closed", "all"]},
                "priority": {"type": "integer", "description": "Filter by priority level 1-5 (1=Critical, 5=Low). Omit for all priorities."}
            }
        }
    },
    {
        "type": "function",
        "name": "acknowledge_call",
        "description": "Officer acknowledges/responds to a call. Use when the officer says they'll take a call, respond to a call, or acknowledge a dispatch. Marks the call as Dispatched and assigns the officer.",
        "parameters": {
            "type": "object",
            "properties": {
                "call_id": {"type": "string", "description": "The call ID to acknowledge. If not provided, acknowledges the most recent active call."}
            }
        }
    },
    {
        "type": "function",
        "name": "arrive_on_scene",
        "description": "Officer reports arriving on scene at a call location. Use when the officer says they're on scene, arrived, or at the location.",
        "parameters": {
            "type": "object",
            "properties": {
                "call_id": {"type": "string", "description": "The call ID. If not provided, uses the officer's currently assigned call."}
            }
        }
    },
    {
        "type": "function",
        "name": "clear_call",
        "description": "Officer clears/closes a call. Use when the officer says 'clear the call', 'I'm clear', 'call is clear', 'close the call', or similar. Marks the call as Closed.",
        "parameters": {
            "type": "object",
            "properties": {
                "call_id": {"type": "string", "description": "The call ID to clear. If not provided, clears the officer's current assigned call."},
                "disposition": {"type": "string", "description": "How the call was resolved. E.g. 'report taken', 'arrest made', 'unfounded', 'gone on arrival', 'warning issued', 'citation issued'."}
            }
        }
    },
    {
        "type": "function",
        "name": "background_check",
        "description": "Run a comprehensive background check on a person. Searches local database PLUS FBI Most Wanted, OFAC sanctions list, NSOPW sex offender registry, and CourtListener court records — all in parallel. Use when officer says 'run a background check', 'full check on', 'background on', 'deep check', or wants more than a basic name search.",
        "parameters": {
            "type": "object",
            "properties": {
                "first_name": {"type": "string", "description": "Person's first name"},
                "last_name": {"type": "string", "description": "Person's last name"},
                "state": {"type": "string", "description": "State abbreviation for narrowing results (e.g., CA, TX)"},
                "dob": {"type": "string", "description": "Date of birth YYYY-MM-DD if known"}
            },
            "required": ["last_name"]
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
        
        Strategy: Write to temp file, use Python wave module for WAV,
        or search for raw PCM data in CAF files.
        Since we control the iOS recording config (24kHz, mono, 16-bit LE LPCM),
        the PCM data is already in the right format — we just need to extract it.
        """
        import wave
        
        try:
            audio_bytes = base64.b64decode(base64_audio)
            magic = audio_bytes[:4] if len(audio_bytes) >= 4 else b''
            logger.info(f"Received audio: {len(audio_bytes)} bytes, magic: {magic}")
            
            # Strategy 1: Try Python's wave module (handles proper WAV files)
            if magic == b'RIFF':
                try:
                    return self._read_wav_with_wave_module(audio_bytes)
                except Exception as e:
                    logger.warning(f"wave module failed: {e}")
            
            # Strategy 2: CAF file — find 'data' chunk and extract raw PCM
            if magic == b'caff':
                try:
                    return self._extract_raw_pcm_from_caf(audio_bytes)
                except Exception as e:
                    logger.warning(f"CAF extraction failed: {e}")
            
            # Strategy 3: ffmpeg
            if self._has_ffmpeg():
                return self._convert_with_ffmpeg(audio_bytes)
            
            # Strategy 4: Brute force — assume the audio data IS PCM16 24kHz
            # (skip any header-like bytes at the start)
            logger.warning("All parsing failed, sending raw bytes as PCM16")
            return base64.b64encode(audio_bytes).decode('utf-8')
            
        except Exception as e:
            logger.error(f"Error converting audio: {e}")
            raise
    
    def _read_wav_with_wave_module(self, audio_bytes: bytes) -> str:
        """Use Python's wave module to properly read WAV files."""
        import wave
        
        with tempfile.NamedTemporaryFile(suffix='.wav', delete=False) as f:
            f.write(audio_bytes)
            tmp_path = f.name
        
        try:
            with wave.open(tmp_path, 'rb') as wf:
                channels = wf.getnchannels()
                sample_rate = wf.getframerate()
                sample_width = wf.getsampwidth()  # bytes per sample
                n_frames = wf.getnframes()
                pcm_data = wf.readframes(n_frames)
                
                logger.info(f"WAV: {sample_rate}Hz, {channels}ch, {sample_width*8}bit, {n_frames} frames")
            
            # If already correct format, send directly
            if sample_rate == 24000 and channels == 1 and sample_width == 2:
                logger.info(f"WAV perfect format, sending {len(pcm_data)} bytes")
                return base64.b64encode(pcm_data).decode('utf-8')
            
            # Need conversion — use ffmpeg if available
            if self._has_ffmpeg():
                return self._convert_with_ffmpeg(audio_bytes)
            
            # Pure Python: basic mono mixdown and resample
            return self._resample_pcm(pcm_data, sample_rate, channels, sample_width * 8)
        finally:
            os.unlink(tmp_path)
    
    def _extract_raw_pcm_from_caf(self, audio_bytes: bytes) -> str:
        """Extract raw PCM data from CAF file by finding the 'data' chunk.
        
        We know our iOS config: 24kHz, mono, 16-bit, little-endian LPCM.
        So we just need to find the data and check endianness.
        """
        # CAF header: 'caff' (4) + version (2) + flags (2) = 8 bytes
        pos = 8
        is_little_endian = True  # Our iOS config requests LE
        sample_rate = 24000  # Our iOS config
        
        while pos < len(audio_bytes) - 12:
            chunk_type = audio_bytes[pos:pos+4]
            chunk_size = struct.unpack_from('>q', audio_bytes, pos + 4)[0]
            chunk_data_start = pos + 12
            
            if chunk_type == b'desc' and chunk_size >= 32:
                # Read sample rate and format flags
                try:
                    sample_rate = struct.unpack_from('>d', audio_bytes, chunk_data_start)[0]
                    fmt_flags = struct.unpack_from('>I', audio_bytes, chunk_data_start + 12)[0]
                    # kCAFLinearPCMFormatFlagIsLittleEndian = 0x2
                    is_little_endian = (fmt_flags & 0x2) != 0
                    logger.info(f"CAF: rate={sample_rate}, flags={fmt_flags:#x}, LE={is_little_endian}")
                except:
                    pass
            
            elif chunk_type == b'data':
                # Data chunk: 4-byte edit count, then raw audio
                data_start = chunk_data_start + 4
                if chunk_size > 4:
                    data_end = data_start + (chunk_size - 4)
                else:
                    data_end = len(audio_bytes)
                
                pcm_data = audio_bytes[data_start:data_end]
                logger.info(f"CAF data chunk: {len(pcm_data)} bytes, rate={sample_rate}, LE={is_little_endian}")
                
                # Swap endianness if big-endian
                if not is_little_endian:
                    logger.info("Swapping BE to LE")
                    arr = bytearray(pcm_data)
                    for i in range(0, len(arr) - 1, 2):
                        arr[i], arr[i+1] = arr[i+1], arr[i]
                    pcm_data = bytes(arr)
                
                # If sample rate matches, send directly
                if abs(sample_rate - 24000) < 1:
                    logger.info(f"CAF PCM16 24kHz ready, {len(pcm_data)} bytes")
                    return base64.b64encode(pcm_data).decode('utf-8')
                
                # Need resampling
                return self._resample_pcm(pcm_data, int(sample_rate), 1, 16)
            
            # Move to next chunk
            if chunk_size < 0:
                break
            pos += 12 + chunk_size
        
        raise Exception("No data chunk found in CAF")
    
    def _resample_pcm(self, pcm_data: bytes, src_rate: int, channels: int, bits: int) -> str:
        """Pure Python PCM resampling to 24kHz mono 16-bit."""
        if bits == 0:
            bits = 16
        if src_rate == 0:
            src_rate = 24000
        logger.info(f"Resampling: {src_rate}Hz/{channels}ch/{bits}bit -> 24000Hz/1ch/16bit")
        
        # Convert to 16-bit samples
        if bits == 16:
            n_samples = len(pcm_data) // 2
            samples = list(struct.unpack(f'<{n_samples}h', pcm_data[:n_samples*2]))
        elif bits == 32:
            n_samples = len(pcm_data) // 4
            raw = list(struct.unpack(f'<{n_samples}i', pcm_data[:n_samples*4]))
            samples = [s >> 16 for s in raw]
        elif bits == 8:
            samples = [((b - 128) << 8) for b in pcm_data]
        else:
            # Assume 16-bit
            n_samples = len(pcm_data) // 2
            samples = list(struct.unpack(f'<{n_samples}h', pcm_data[:n_samples*2]))
        
        # Mix to mono
        if channels >= 2:
            mono = []
            for i in range(0, len(samples) - channels + 1, channels):
                mono.append(sum(samples[i:i+channels]) // channels)
            samples = mono
        
        # Resample
        if src_rate != 24000 and src_rate > 0:
            ratio = 24000.0 / src_rate
            new_len = int(len(samples) * ratio)
            resampled = []
            for i in range(new_len):
                src_pos = i / ratio
                idx = int(src_pos)
                frac = src_pos - idx
                if idx + 1 < len(samples):
                    val = int(samples[idx] * (1 - frac) + samples[idx + 1] * frac)
                elif idx < len(samples):
                    val = samples[idx]
                else:
                    break
                resampled.append(max(-32768, min(32767, val)))
            samples = resampled
        
        result = struct.pack(f'<{len(samples)}h', *samples)
        logger.info(f"Resampled: {len(pcm_data)} -> {len(result)} bytes PCM16 24kHz")
        return base64.b64encode(result).decode('utf-8')
    
    def _has_ffmpeg(self) -> bool:
        """Check if ffmpeg is available."""
        try:
            subprocess.run(['ffmpeg', '-version'], capture_output=True, check=True, timeout=5)
            return True
        except (FileNotFoundError, subprocess.CalledProcessError, subprocess.TimeoutExpired):
            return False
    
    def _convert_with_ffmpeg(self, audio_bytes: bytes) -> str:
        """Convert any audio format to PCM16 24kHz mono using ffmpeg."""
        suffix = '.wav'
        if len(audio_bytes) > 8:
            if audio_bytes[:4] == b'caff':
                suffix = '.caf'
            elif len(audio_bytes) > 4 and audio_bytes[4:8] == b'ftyp':
                suffix = '.m4a'
        
        with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as f:
            input_path = f.name
            f.write(audio_bytes)
        with tempfile.NamedTemporaryFile(suffix='.pcm', delete=False) as f:
            output_path = f.name
        
        try:
            subprocess.run([
                'ffmpeg', '-i', input_path,
                '-f', 's16le', '-acodec', 'pcm_s16le',
                '-ar', '24000', '-ac', '1', '-y', output_path
            ], capture_output=True, check=True, timeout=10)
            
            with open(output_path, 'rb') as f:
                pcm_bytes = f.read()
            
            logger.info(f"ffmpeg: {len(audio_bytes)} -> {len(pcm_bytes)} bytes PCM16")
            return base64.b64encode(pcm_bytes).decode('utf-8')
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
                    "instructions": """You are a police radio dispatcher. You speak EXACTLY like a real dispatcher on a police radio.

VOICE STYLE:
- Clipped, short, professional radio voice
- Use 10-codes ALWAYS. Never use plain English when a 10-code exists.
- Maximum 5-15 words per response
- Say "copy" or "10-4" to acknowledge
- Say callsign-style references like "dispatch" for yourself

10-CODE REFERENCE (USE THESE):
- 10-4 = Acknowledged / OK / Copy
- 10-9 = Repeat / Say again
- 10-20 = Location / What's your 20?
- 10-27 = Driver's license check
- 10-28 = Vehicle registration check  
- 10-29 = Check for warrants
- 10-76 = En route
- 10-97 = Arrived on scene
- 10-98 = Assignment complete / Clear
- 10-99 = Officer needs help (emergency)
- Code 4 = No further assistance needed
- Signal 11 = Traffic stop

RESPONSE EXAMPLES:

Officer: "Can I get a person search?" or "Run a name for me"
You: "10-4, go ahead." [wait for details, then call search_person]

Officer: "Run Hunter Coldwell"
You: "10-4, running." [call search_person]
Then: "One hit. Coldwell, Hunter. DOB 11-17-89. One active warrant, failure to appear. Two citations — speeding and DUI."

Officer: "Run a plate"
You: "10-4, go ahead with the plate." [wait for plate info]

Officer: "California ABC123"
You: "10-4." [call search_vehicle]
Then: "10-28 returns 2020 Toyota Camry, blue. Registered to Doe, John. No flags."

Officer: "What do we have going on?" or "Any calls?"
You: [call get_active_calls]
Then: "Three active. Priority 1 domestic, 123 Main. Priority 2 10-50 Highway 65. Priority 3 noise complaint Oak Ave."

Officer: "I'll take that" or "Show me responding"
You: [MUST call acknowledge_call]
Then: "10-4, showing you 10-76 to 123 Main."

Officer: "I'm 10-97" or "On scene"
You: [MUST call arrive_on_scene]
Then: "10-4, 10-97 at 123 Main."

Officer: "I'm clear" or "10-98"
You: [MUST call clear_call]
Then: "10-4, 10-98. Code 4."

Officer: "10-29 on Coldwell, Hunter"
You: [call search_person]
Then: "10-29 shows one active warrant. Failure to appear, $500 bail."

Officer: "Run a background check on John Doe" or "Full check on Smith"
You: "10-4, running full background." [call background_check]
Then read back ALL results in detail:
"Background complete on Doe, John. 
Local database: one hit. DOB March 15, 1985. California DL Delta-1-2-3-4-5-6-7. One active warrant — failure to appear, traffic court. Two citations — speeding 45 in a 25 zone, January 2024, and DUI, June 2020, convicted.
FBI wanted list: negative.
Sanctions watchlist: negative.
Sex offender registry: negative.
Federal court records: 2 cases found. United States v. Doe, Northern District California, filed 2020. Doe v. State Farm, Eastern District, filed 2022.
That's everything on Doe. You want me to pull up details on any of those cases?"

BACKGROUND CHECK RULES:
- Read back EVERY source and what was found, even if negative.
- For FBI hits: read name, description, aliases, DOB, physical description, reward amount, and WARNING.
- For court records: read case name, court, date filed for each case.
- For local DB: read full details — name, DOB, DL, address, warrants (type, amount), citations (violation, date), priors.
- After reading results, ASK the officer if they want more details on anything.
- If multiple people match, ask "I have multiple hits. Which one? Give me a DOB or middle name to narrow it down."
- If officer asks follow-up questions about the results, answer from what you already have.
- Do NOT abbreviate or skip results. The officer needs ALL the information.

CRITICAL RULES:
- ALWAYS use 10-codes. "10-4" not "okay". "10-97" not "arrived on scene".
- For background checks: be DETAILED and THOROUGH. Read everything back.
- For routine radio traffic: keep it short and clipped like a real dispatcher.
- When officer requests a search, say "10-4, go ahead" or "10-4, running" — then call the function.
- When officer says they'll take/respond to a call: MUST call acknowledge_call function.
- When officer says on scene/arrived/10-97: MUST call arrive_on_scene function.
- When officer says clear/10-98/done: MUST call clear_call function.
- Always call the function FIRST, then give a verbal response with ALL details.
- For person results: state name, DOB, DL, address, warrants (type + amount), citations (violation type + date), priors.
- For vehicle results: state year/make/model/color, owner, registration status, flags.
- For background checks: read EVERY source result. Don't skip any.
- Never skip a function call when the officer's intent matches one of your tools.
- If you need clarification, say "10-9" (repeat).
- If multiple results, ask which person the officer means.
- After giving results, offer to provide more details.
- Spell out license plates phonetically: "Adam-Boy-Charlie-1-2-3".""",
                    "voice": "alloy",
                    "input_audio_format": "pcm16",
                    "output_audio_format": "pcm16",
                    "input_audio_transcription": {
                        "model": "whisper-1"
                    },
                    "turn_detection": None,
                    "tools": OFFICER_RADIO_FUNCTIONS,
                    "tool_choice": "auto",
                    "temperature": 0.6,
                    "max_response_output_tokens": 1200
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
                try:
                    message = await self.mobile_ws.receive_text()
                    data = json.loads(message)
                except json.JSONDecodeError as e:
                    logger.warning(f"Invalid JSON from mobile: {e}")
                    continue
                
                message_type = data.get('type')
                
                if message_type == 'ping':
                    # Respond to keepalive pings — Heroku needs bidirectional traffic
                    try:
                        await self.mobile_ws.send_text(json.dumps({"type": "pong", "timestamp": data.get("timestamp", 0)}))
                    except Exception:
                        pass
                    continue
                
                elif message_type == 'audio_stream':
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
                    if self.openai_ws:
                        # Commit the audio buffer so OpenAI processes it
                        await self.openai_ws.send(json.dumps({"type": "input_audio_buffer.commit"}))
                        logger.info(f"Officer {self.officer_id} - audio buffer committed")
                        
                        # Explicitly request a response (don't rely solely on VAD for PTT model)
                        await self.openai_ws.send(json.dumps({"type": "response.create"}))
                        logger.info(f"Officer {self.officer_id} - response.create sent")
                    
                elif message_type == 'start_transmission':
                    logger.info(f"Officer {self.officer_id} started transmission")
                    # Clear any pending audio buffer for a fresh transmission
                    if self.openai_ws:
                        try:
                            await self.openai_ws.send(json.dumps({"type": "input_audio_buffer.clear"}))
                        except Exception:
                            pass
                
                elif message_type == 'speak_dispatch':
                    # Dispatch alert — inject text into conversation and have OpenAI speak it
                    dispatch_text = data.get('text', '')
                    if dispatch_text and self.openai_ws:
                        logger.info(f"Officer {self.officer_id} - Speaking dispatch: {dispatch_text}")
                        try:
                            # Add as a user message (as if dispatch typed it)
                            await self.openai_ws.send(json.dumps({
                                "type": "conversation.item.create",
                                "item": {
                                    "type": "message",
                                    "role": "user",
                                    "content": [{
                                        "type": "input_text",
                                        "text": f"[DISPATCH ALERT - Read this aloud exactly as a radio dispatch announcement]: {dispatch_text}"
                                    }]
                                }
                            }))
                            logger.info(f"Officer {self.officer_id} - conversation.item.create sent for dispatch")
                            # Trigger response so OpenAI speaks it
                            await self.openai_ws.send(json.dumps({"type": "response.create"}))
                            logger.info(f"Officer {self.officer_id} - response.create sent for dispatch")
                        except Exception as e:
                            logger.error(f"Officer {self.officer_id} - Failed to send dispatch to OpenAI: {e}")
                    elif not self.openai_ws:
                        logger.warning(f"Officer {self.officer_id} - OpenAI WS not connected, cannot speak dispatch")
                    elif not dispatch_text:
                        logger.warning(f"Officer {self.officer_id} - Empty dispatch text")
                    
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
                    
                    # Don't forward rate_limit or cancellation errors to mobile — they're transient
                    error_code = error_msg.get('code', '') if isinstance(error_msg, dict) else ''
                    if error_code in ('rate_limit_exceeded', 'response_already_in_progress'):
                        logger.warning(f"Transient OpenAI error (ignoring): {error_code}")
                        continue
                    
                    # Send error to mobile app
                    error_message = {
                        "type": "error",
                        "code": "OPENAI_ERROR",
                        "message": str(error_msg),
                        "timestamp": datetime.now(timezone.utc).timestamp()
                    }
                    await self.mobile_ws.send_text(json.dumps(error_message))
                
                elif event_type == 'response.done':
                    # Full response cycle complete — log status
                    status = data.get('response', {}).get('status', 'unknown')
                    logger.info(f"Officer {self.officer_id} - Response done, status: {status}")
                    if status == 'failed':
                        status_details = data.get('response', {}).get('status_details', {})
                        logger.error(f"Response failed: {status_details}")
                    
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
            elif function_name == "get_active_calls":
                return await self.get_active_calls(arguments)
            elif function_name == "acknowledge_call":
                return await self.acknowledge_call(arguments)
            elif function_name == "arrive_on_scene":
                return await self.arrive_on_scene(arguments)
            elif function_name == "clear_call":
                return await self.clear_call(arguments)
            elif function_name == "background_check":
                return await self.background_check(arguments)
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
                query["drivers_license"] = {"$regex": params['drivers_license'], "$options": "i"}
            
            if not query:
                return {"error": "No search parameters provided"}
            
            results = await self.db.persons.find(query, {"_id": 0}).to_list(10)
            
            if not results:
                return {"found": False, "message": "No records found"}
            
            # Enrich results with full citation details
            for person in results:
                citation_ids = person.get('citations', [])
                if citation_ids:
                    citations = await self.db.citations.find(
                        {"id": {"$in": citation_ids}},
                        {"_id": 0, "violation_code": 1, "violation_description": 1, "date_time": 1, "location": 1, "fine_amount": 1, "status": 1, "id": 1}
                    ).to_list(50)
                    person['citation_details'] = citations
                else:
                    person['citation_details'] = []
            
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
    
    async def get_active_calls(self, params: dict):
        """Get current active calls/incidents"""
        try:
            query = {}
            status = params.get('status', 'Active')
            if status and status != 'all':
                query["status"] = status
            
            priority = params.get('priority')
            if priority:
                query["priority"] = priority
            
            calls = await self.db.active_calls.find(
                query, 
                {"_id": 0, "transcription": 0}  # Exclude large transcription field
            ).sort("created_at", -1).to_list(20)
            
            if not calls:
                return {"found": False, "message": "No active calls", "count": 0}
            
            # Summarize each call for the dispatcher
            summaries = []
            for call in calls:
                summaries.append({
                    "incident_type": call.get("incident_type", "Unknown"),
                    "location": call.get("location", "Unknown"),
                    "description": call.get("description", ""),
                    "priority": call.get("priority", 3),
                    "status": call.get("status", "Active"),
                    "caller_phone": call.get("caller_phone", "Unknown"),
                    "assigned_officer": call.get("assigned_officer"),
                    "created_at": call.get("created_at", ""),
                })
            
            return {"found": True, "calls": summaries, "count": len(summaries)}
            
        except Exception as e:
            logger.error(f"Error in get_active_calls: {e}")
            return {"error": f"Database query failed: {str(e)}"}
    
    async def acknowledge_call(self, params: dict):
        """Officer acknowledges/responds to a call"""
        try:
            call_id = params.get('call_id')
            
            if call_id:
                call = await self.db.active_calls.find_one({"id": call_id, "status": "Active"}, {"_id": 0})
            else:
                # Find most recent active unassigned call
                call = await self.db.active_calls.find_one(
                    {"status": "Active", "assigned_officer": None},
                    {"_id": 0},
                    sort=[("created_at", -1)]
                )
            
            if not call:
                return {"success": False, "message": "No active unassigned calls found"}
            
            await self.db.active_calls.update_one(
                {"id": call['id']},
                {"$set": {
                    "assigned_officer": self.officer_id,
                    "status": "Dispatched",
                    "officer_notified": True,
                    "updated_at": datetime.now(timezone.utc).isoformat()
                }}
            )
            
            return {
                "success": True,
                "message": f"You are now responding to {call.get('incident_type', 'call')} at {call.get('location', 'unknown location')}",
                "call_id": call['id'],
                "incident_type": call.get('incident_type'),
                "location": call.get('location'),
                "priority": call.get('priority')
            }
            
        except Exception as e:
            logger.error(f"Error in acknowledge_call: {e}")
            return {"error": f"Failed to acknowledge call: {str(e)}"}
    
    async def arrive_on_scene(self, params: dict):
        """Officer reports arriving on scene"""
        try:
            call_id = params.get('call_id')
            
            if call_id:
                call = await self.db.active_calls.find_one({"id": call_id, "assigned_officer": self.officer_id}, {"_id": 0})
            else:
                # Find officer's currently assigned call
                call = await self.db.active_calls.find_one(
                    {"assigned_officer": self.officer_id, "status": "Dispatched"},
                    {"_id": 0},
                    sort=[("updated_at", -1)]
                )
            
            if not call:
                return {"success": False, "message": "No dispatched call found assigned to you"}
            
            await self.db.active_calls.update_one(
                {"id": call['id']},
                {"$set": {
                    "officer_on_scene": True,
                    "status": "On Scene",
                    "updated_at": datetime.now(timezone.utc).isoformat()
                }}
            )
            
            return {
                "success": True,
                "message": f"Marked on scene at {call.get('location', 'location')} for {call.get('incident_type', 'call')}",
                "call_id": call['id'],
                "incident_type": call.get('incident_type'),
                "location": call.get('location')
            }
            
        except Exception as e:
            logger.error(f"Error in arrive_on_scene: {e}")
            return {"error": f"Failed to mark on scene: {str(e)}"}

    async def clear_call(self, params: dict):
        """Officer clears/closes a call"""
        try:
            call_id = params.get('call_id')
            disposition = params.get('disposition', 'cleared')

            if call_id:
                call = await self.db.active_calls.find_one({"id": call_id, "assigned_officer": self.officer_id}, {"_id": 0})
            else:
                # Find officer's current call (On Scene or Dispatched)
                call = await self.db.active_calls.find_one(
                    {"assigned_officer": self.officer_id, "status": {"$in": ["On Scene", "Dispatched"]}},
                    {"_id": 0},
                    sort=[("updated_at", -1)]
                )

            if not call:
                return {"success": False, "message": "No active call found assigned to you"}

            await self.db.active_calls.update_one(
                {"id": call['id']},
                {"$set": {
                    "status": "Closed",
                    "disposition": disposition,
                    "closed_at": datetime.now(timezone.utc).isoformat(),
                    "updated_at": datetime.now(timezone.utc).isoformat()
                }}
            )

            return {
                "success": True,
                "message": f"Call cleared — {call.get('incident_type', 'call')} at {call.get('location', 'location')}, disposition: {disposition}",
                "call_id": call['id'],
                "incident_type": call.get('incident_type'),
                "location": call.get('location'),
                "disposition": disposition
            }

        except Exception as e:
            logger.error(f"Error in clear_call: {e}")
            return {"error": f"Failed to clear call: {str(e)}"}

    
    async def background_check(self, params: dict):
        """Run comprehensive background check — fans out to all sources in parallel"""
        first_name = params.get('first_name', '')
        last_name = params.get('last_name', '')
        state = params.get('state', '')
        dob = params.get('dob', '')
        
        if not last_name:
            return {"error": "Last name required for background check"}
        
        logger.info(f"Background check: {first_name} {last_name}, state={state}, dob={dob}")
        
        # Fan out to all sources in parallel
        results = await asyncio.gather(
            self._check_local_db(first_name, last_name, dob),
            self._check_fbi_wanted(first_name, last_name),
            self._check_ofac_sanctions(first_name, last_name),
            self._check_sex_offender(first_name, last_name, state),
            self._check_court_records(first_name, last_name),
            return_exceptions=True
        )
        
        local_result = results[0] if not isinstance(results[0], Exception) else {"error": str(results[0])}
        fbi_result = results[1] if not isinstance(results[1], Exception) else {"error": str(results[1])}
        ofac_result = results[2] if not isinstance(results[2], Exception) else {"error": str(results[2])}
        sex_offender_result = results[3] if not isinstance(results[3], Exception) else {"error": str(results[3])}
        court_result = results[4] if not isinstance(results[4], Exception) else {"error": str(results[4])}
        
        return {
            "subject": f"{first_name} {last_name}".strip(),
            "local_database": local_result,
            "fbi_wanted": fbi_result,
            "ofac_sanctions": ofac_result,
            "sex_offender_registry": sex_offender_result,
            "court_records": court_result
        }
    
    async def _check_local_db(self, first_name: str, last_name: str, dob: str):
        """Check local MongoDB person records"""
        try:
            query = {}
            if last_name:
                query["last_name"] = {"$regex": last_name, "$options": "i"}
            if first_name:
                query["first_name"] = {"$regex": first_name, "$options": "i"}
            if dob:
                query["dob"] = dob
            
            results = await self.db.persons.find(query, {"_id": 0}).to_list(10)
            
            if not results:
                return {"hit": False, "message": "No local records"}
            
            # Enrich with citations
            for person in results:
                citation_ids = person.get('citations', [])
                if citation_ids:
                    citations = await self.db.citations.find(
                        {"id": {"$in": citation_ids}},
                        {"_id": 0, "violation_description": 1, "date_time": 1, "status": 1}
                    ).to_list(50)
                    person['citation_details'] = citations
            
            return {"hit": True, "count": len(results), "records": results}
        except Exception as e:
            return {"error": str(e)}
    
    async def _check_fbi_wanted(self, first_name: str, last_name: str):
        """Check FBI Most Wanted API (free, public)"""
        try:
            # FBI API searches by title (full name or last name)
            search_name = last_name  # Last name gets better results
            url = "https://api.fbi.gov/wanted/v1/list"
            params = {"title": search_name, "pageSize": 10}
            
            async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=10)) as session:
                async with session.get(url, params=params) as resp:
                    if resp.status != 200:
                        return {"hit": False, "message": "FBI API unavailable"}
                    data = await resp.json()
            
            items = data.get('items', [])
            if not items:
                return {"hit": False, "message": "Not on FBI wanted list"}
            
            # Filter for name matches
            hits = []
            for item in items:
                title = (item.get('title') or '').lower()
                aliases = [a.lower() for a in (item.get('aliases') or [])]
                name_lower = f"{first_name} {last_name}".lower().strip()
                last_lower = last_name.lower()
                
                # Check if name matches title or aliases
                if last_lower in title or any(last_lower in a for a in aliases):
                    hit = {
                        "name": item.get('title', ''),
                        "description": item.get('description', ''),
                        "subjects": item.get('subjects', []),
                        "warning": item.get('warning_message', ''),
                        "reward": item.get('reward_text', ''),
                        "race": item.get('race_raw', ''),
                        "sex": item.get('sex', ''),
                        "hair": item.get('hair', ''),
                        "eyes": item.get('eyes', ''),
                        "weight": item.get('weight', ''),
                        "scars_marks": (item.get('scars_and_marks') or '')[:200],
                        "aliases": item.get('aliases', []),
                        "dob": item.get('dates_of_birth_used', []),
                        "nationality": item.get('nationality', ''),
                        "caution": (item.get('caution') or '')[:300],
                    }
                    hits.append(hit)
            
            if not hits:
                return {"hit": False, "message": "Not on FBI wanted list"}
            
            return {"hit": True, "count": len(hits), "WARNING": "SUBJECT ON FBI WANTED LIST", "results": hits}
        except asyncio.TimeoutError:
            return {"hit": False, "message": "FBI API timeout"}
        except Exception as e:
            return {"hit": False, "message": f"FBI check error: {str(e)}"}
    
    async def _check_ofac_sanctions(self, first_name: str, last_name: str):
        """Check OFAC SDN sanctions — search Treasury's public data"""
        try:
            # Use Treasury's sanctions search endpoint
            name = f"{first_name} {last_name}".strip()
            url = f"https://api.fbi.gov/wanted/v1/list"
            # FBI also covers terrorism/sanctions-related fugitives
            params = {"title": last_name, "pageSize": 5}
            
            async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=8)) as session:
                async with session.get(url, params=params) as resp:
                    if resp.status != 200:
                        return {"hit": False, "message": "Sanctions check unavailable"}
                    data = await resp.json()
            
            items = data.get('items', [])
            # Filter for terrorism/sanctions subjects
            sanctions_hits = []
            for item in items:
                subjects = item.get('subjects', [])
                title = (item.get('title') or '').lower()
                if last_name.lower() in title:
                    for subj in subjects:
                        if any(kw in subj.lower() for kw in ['terror', 'sanction', 'counter', 'weapons', 'proliferat']):
                            sanctions_hits.append({
                                "name": item.get('title', ''),
                                "subjects": subjects,
                                "description": item.get('description', '')[:200]
                            })
                            break
            
            if not sanctions_hits:
                return {"hit": False, "message": "Not on sanctions/terrorism watchlist"}
            
            return {"hit": True, "count": len(sanctions_hits), "WARNING": "POSSIBLE SANCTIONS/TERRORISM MATCH", "results": sanctions_hits}
        except Exception as e:
            return {"hit": False, "message": f"Sanctions check: {str(e)}"}
    
    async def _check_sex_offender(self, first_name: str, last_name: str, state: str):
        """Check for sex offender records via FBI wanted list (sex crimes category)"""
        try:
            url = "https://api.fbi.gov/wanted/v1/list"
            params = {"title": last_name, "pageSize": 10}
            
            async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=8)) as session:
                async with session.get(url, params=params) as resp:
                    if resp.status != 200:
                        return {"hit": False, "message": "Registry check unavailable"}
                    data = await resp.json()
            
            items = data.get('items', [])
            sex_hits = []
            for item in items:
                subjects = item.get('subjects', [])
                title = (item.get('title') or '').lower()
                if last_name.lower() in title:
                    for subj in subjects:
                        if any(kw in subj.lower() for kw in ['sex', 'child', 'exploitation', 'kidnap', 'endanger']):
                            sex_hits.append({
                                "name": item.get('title', ''),
                                "subjects": subjects,
                                "description": item.get('description', '')[:200],
                                "warning": item.get('warning_message', '')
                            })
                            break
            
            if not sex_hits:
                return {"hit": False, "message": "No sex offense records found in federal databases"}
            
            return {"hit": True, "count": len(sex_hits), "WARNING": "SEX OFFENSE RECORD FOUND", "results": sex_hits}
        except Exception as e:
            return {"hit": False, "message": f"Registry check: {str(e)}"}
    
    async def _check_court_records(self, first_name: str, last_name: str):
        """Check CourtListener for federal court records (free)"""
        try:
            name = f"{first_name} {last_name}".strip()
            url = "https://www.courtlistener.com/api/rest/v4/search/"
            params = {
                "q": f'"{name}"',
                "type": "r",  # RECAP (federal court records)
                "order_by": "score desc",
                "page_size": 10
            }
            headers = {"Accept": "application/json"}
            
            async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=10)) as session:
                async with session.get(url, params=params, headers=headers) as resp:
                    if resp.status != 200:
                        return {"hit": False, "message": "Court records unavailable"}
                    data = await resp.json()
            
            total = data.get('count', 0)
            results_list = data.get('results', [])
            if not results_list:
                return {"hit": False, "message": "No federal court records found"}
            
            cases = []
            for r in results_list[:8]:
                cases.append({
                    "case_name": r.get('caseName', r.get('case_name', '')),
                    "court": r.get('court', ''),
                    "date_filed": r.get('dateFiled', r.get('date_filed', '')),
                    "docket_number": r.get('docketNumber', r.get('docket_number', '')),
                    "description": (r.get('snippet', '') or '')[:200],
                })
            
            return {"hit": True, "total_records": total, "count": len(cases), "cases": cases}
        except asyncio.TimeoutError:
            return {"hit": False, "message": "Court records timeout"}
        except Exception as e:
            return {"hit": False, "message": f"Court records error: {str(e)}"}
    
    async def _server_keepalive(self):
        """Send periodic pings from server to keep Heroku WS alive"""
        try:
            while True:
                await asyncio.sleep(15)
                try:
                    await self.mobile_ws.send_text(json.dumps({"type": "server_ping", "timestamp": datetime.now(timezone.utc).timestamp()}))
                except Exception:
                    break
        except asyncio.CancelledError:
            pass

    async def run(self):
        """Main loop - bidirectional audio streaming"""
        try:
            await self.connect_to_openai()
            
            # Run handlers + server keepalive concurrently
            await asyncio.gather(
                self.handle_mobile_audio(),
                self.handle_openai_responses(),
                self._server_keepalive()
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
