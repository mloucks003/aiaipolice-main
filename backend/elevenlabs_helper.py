from elevenlabs.client import ElevenLabs
from elevenlabs import VoiceSettings
import hashlib
import os
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables
load_dotenv(Path(__file__).parent / '.env')

ELEVENLABS_API_KEY = os.environ.get('ELEVENLABS_API_KEY')
AUDIO_CACHE_DIR = Path(__file__).parent / "audio_cache"
AUDIO_CACHE_DIR.mkdir(exist_ok=True)
BACKEND_URL = os.environ.get('BACKEND_URL', 'http://localhost:8000')

elevenlabs_client = ElevenLabs(api_key=ELEVENLABS_API_KEY) if ELEVENLABS_API_KEY else None

def generate_voice_audio_sync(text: str) -> str:
    """Generate ultra-realistic voice audio using ElevenLabs and return URL."""
    if not elevenlabs_client:
        print("ElevenLabs client not initialized")
        return None
    
    try:
        text_hash = hashlib.md5(text.encode()).hexdigest()
        audio_file = AUDIO_CACHE_DIR / f"{text_hash}.mp3"
        
        # Check cache
        if audio_file.exists():
            print(f"Using cached audio: {text_hash}.mp3")
            return f"{BACKEND_URL}/api/audio/{text_hash}.mp3"
        
        print(f"Generating ElevenLabs audio for: {text[:50]}...")
        
        # Generate audio with PROFESSIONAL DISPATCHER voice - calm, clear, empathetic
        # Using Sarah voice (EXAVITQu4vr4xnSDxMaL) - professional dispatcher
        audio_generator = elevenlabs_client.text_to_speech.convert(
            text=text,
            voice_id="EXAVITQu4vr4xnSDxMaL",  # Sarah - professional dispatcher voice
            model_id="eleven_multilingual_v2",  # Higher quality, more natural
            voice_settings=VoiceSettings(
                stability=0.55,  # More natural variation - not robotic
                similarity_boost=0.80,  # High quality
                style=0.50,  # Moderate style - professional but warm
                use_speaker_boost=True  # Enhanced clarity
            )
        )
        
        # Save to file - collect all chunks
        audio_data = b''
        for chunk in audio_generator:
            if chunk:
                audio_data += chunk
        
        with open(audio_file, 'wb') as f:
            f.write(audio_data)
        
        print(f"Generated audio file: {audio_file} ({len(audio_data)} bytes)")
        return f"{BACKEND_URL}/api/audio/{text_hash}.mp3"
    
    except Exception as e:
        print(f"ElevenLabs error: {e}")
        import traceback
        traceback.print_exc()
        return None
