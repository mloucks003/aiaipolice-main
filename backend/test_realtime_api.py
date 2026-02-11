"""
Test script to verify OpenAI Realtime API access
This will help diagnose if the API key has proper Realtime API permissions
"""
import asyncio
import json
import os
import websockets
from dotenv import load_dotenv

load_dotenv()

OPENAI_API_KEY = os.environ.get('OPENAI_API_KEY')
OPENAI_REALTIME_URL = "wss://api.openai.com/v1/realtime?model=gpt-realtime"

async def test_realtime_api():
    """Test basic connection and response from OpenAI Realtime API"""
    print(f"Testing OpenAI Realtime API...")
    print(f"API Key: {OPENAI_API_KEY[:20]}..." if OPENAI_API_KEY else "No API key found")
    
    try:
        # Connect to OpenAI
        print("\n1. Connecting to OpenAI Realtime API...")
        ws = await websockets.connect(
            OPENAI_REALTIME_URL,
            additional_headers={
                "Authorization": f"Bearer {OPENAI_API_KEY}",
                "OpenAI-Beta": "realtime=v1"
            }
        )
        print("✅ Connected successfully!")
        
        # Configure session
        print("\n2. Configuring session...")
        session_config = {
            "type": "session.update",
            "session": {
                "modalities": ["text", "audio"],
                "instructions": "You are a helpful assistant. Say 'Hello, this is a test.'",
                "voice": "alloy",
                "input_audio_format": "pcm16",
                "output_audio_format": "pcm16",
                "turn_detection": None,  # Disable VAD for manual control
                "temperature": 0.8,
                "max_response_output_tokens": 150
            }
        }
        await ws.send(json.dumps(session_config))
        print("✅ Session config sent")
        
        # Wait for session.created
        print("\n3. Waiting for session confirmation...")
        response = await ws.recv()
        data = json.loads(response)
        print(f"Received: {data.get('type')}")
        
        if data.get('type') == 'session.created':
            print("✅ Session created successfully!")
            print(f"Session details: {json.dumps(data, indent=2)}")
        
        # Wait for session.updated
        response = await ws.recv()
        data = json.loads(response)
        print(f"\nReceived: {data.get('type')}")
        
        if data.get('type') == 'session.updated':
            print("✅ Session updated successfully!")
        
        # Create a simple text conversation item
        print("\n4. Creating conversation item...")
        conversation_item = {
            "type": "conversation.item.create",
            "item": {
                "type": "message",
                "role": "user",
                "content": [
                    {
                        "type": "input_text",
                        "text": "Say hello"
                    }
                ]
            }
        }
        await ws.send(json.dumps(conversation_item))
        print("✅ Conversation item sent")
        
        # Trigger response
        print("\n5. Triggering response...")
        await ws.send(json.dumps({"type": "response.create"}))
        print("✅ Response.create sent")
        
        # Listen for responses
        print("\n6. Listening for OpenAI responses...")
        print("=" * 60)
        
        timeout_count = 0
        max_timeout = 10
        
        while timeout_count < max_timeout:
            try:
                response = await asyncio.wait_for(ws.recv(), timeout=2.0)
                data = json.loads(response)
                event_type = data.get('type')
                
                print(f"\n📨 Event: {event_type}")
                
                if event_type == 'response.created':
                    print(f"Response created:")
                    print(f"  - Status: {data.get('response', {}).get('status')}")
                    print(f"  - Output: {data.get('response', {}).get('output')}")
                    print(f"  - Modalities: {data.get('response', {}).get('modalities')}")
                    
                elif event_type == 'response.output_item.added':
                    print(f"✅ Output item added!")
                    print(f"  - Item: {json.dumps(data.get('item'), indent=2)}")
                    
                elif event_type == 'response.content_part.added':
                    print(f"✅ Content part added!")
                    print(f"  - Part: {json.dumps(data.get('part'), indent=2)}")
                    
                elif event_type == 'response.audio.delta':
                    audio_len = len(data.get('delta', ''))
                    print(f"✅ Audio delta received! Length: {audio_len}")
                    
                elif event_type == 'response.audio_transcript.delta':
                    transcript = data.get('delta', '')
                    print(f"✅ Transcript delta: {transcript}")
                    
                elif event_type == 'response.text.delta':
                    text = data.get('delta', '')
                    print(f"✅ Text delta: {text}")
                    
                elif event_type == 'response.done':
                    print(f"\n🏁 Response done!")
                    print(f"Full response data:")
                    print(json.dumps(data, indent=2))
                    
                    response_obj = data.get('response', {})
                    print(f"\n  - Status: {response_obj.get('status')}")
                    print(f"  - Output: {response_obj.get('output')}")
                    print(f"  - Status details: {response_obj.get('status_details')}")
                    
                    output = response_obj.get('output', [])
                    if len(output) == 0:
                        print("\n❌ ERROR: Response output is EMPTY!")
                        print("This means OpenAI is not generating any content.")
                        print("\nPossible causes:")
                        print("1. API key doesn't have Realtime API access")
                        print("2. Account tier doesn't support audio generation")
                        print("3. Model or configuration issue")
                        print("4. Check status_details above for error message")
                    else:
                        print(f"\n✅ SUCCESS: Response has {len(output)} output items")
                    
                    break
                    
                elif event_type == 'error':
                    print(f"\n❌ ERROR from OpenAI:")
                    print(json.dumps(data, indent=2))
                    break
                    
                else:
                    print(f"  - Data: {json.dumps(data, indent=2)[:200]}")
                    
            except asyncio.TimeoutError:
                timeout_count += 1
                print(f"⏱️  Waiting... ({timeout_count}/{max_timeout})")
                continue
        
        print("\n" + "=" * 60)
        print("\n7. Closing connection...")
        await ws.close()
        print("✅ Test complete!")
        
    except websockets.exceptions.InvalidStatusCode as e:
        print(f"\n❌ Connection failed with status code: {e.status_code}")
        print(f"This usually means:")
        if e.status_code == 401:
            print("  - Invalid API key")
            print("  - API key doesn't have access to Realtime API")
        elif e.status_code == 403:
            print("  - API key doesn't have permission for Realtime API")
            print("  - Account tier doesn't support Realtime API")
        else:
            print(f"  - HTTP error: {e}")
            
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_realtime_api())
