"""
Test script for Officer Radio WebSocket endpoint authentication
Tests Requirements 8.1 and 8.2
"""
import asyncio
import websockets
import aiohttp
import json
import sys
from jose import jwt
from datetime import datetime, timezone, timedelta
import os
from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

SECRET_KEY = os.environ.get('JWT_SECRET', 'rms-secret-key-change-in-production')
ALGORITHM = "HS256"

def create_test_token(user_id: str, expire_minutes: int = 30):
    """Create a test JWT token"""
    to_encode = {"sub": user_id}
    expire = datetime.now(timezone.utc) + timedelta(minutes=expire_minutes)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def test_valid_authentication():
    """Test WebSocket connection with valid token"""
    print("\n=== Test 1: Valid Authentication ===")
    
    # First, login to get a valid token
    import aiohttp
    
    try:
        async with aiohttp.ClientSession() as session:
            # Login with admin credentials
            login_url = "http://localhost:8000/api/auth/login"
            login_data = {
                "username": "admin",
                "password": "admin123"
            }
            
            async with session.post(login_url, json=login_data) as response:
                if response.status != 200:
                    print(f"✗ Failed to login: {response.status}")
                    print(f"  Response: {await response.text()}")
                    return False
                
                auth_response = await response.json()
                token = auth_response.get("access_token")
                
                if not token:
                    print("✗ No token in login response")
                    return False
                
                print(f"✓ Successfully logged in and obtained token")
    
    except Exception as e:
        print(f"✗ Login failed: {e}")
        return False
    
    # Now test WebSocket connection with the valid token
    ws_url = f"ws://localhost:8000/ws/officer-radio?token={token}"
    
    try:
        async with websockets.connect(ws_url) as websocket:
            print("✓ Connection accepted with valid token")
            
            # Send a test message
            test_message = json.dumps({"type": "test", "message": "Hello from officer"})
            await websocket.send(test_message)
            print("✓ Message sent successfully")
            
            # Wait a moment to ensure message is processed
            await asyncio.sleep(0.5)
            
            # Close connection
            await websocket.close()
            print("✓ Connection closed gracefully")
            return True
            
    except websockets.exceptions.InvalidStatusCode as e:
        if e.status_code == 1008:
            print(f"✗ Connection rejected with code 1008: {e}")
            return False
        raise
    except Exception as e:
        print(f"✗ Unexpected error: {e}")
        return False

async def test_invalid_token():
    """Test WebSocket connection with invalid token"""
    print("\n=== Test 2: Invalid Token ===")
    
    # Use an invalid token
    invalid_token = "invalid.token.here"
    ws_url = f"ws://localhost:8000/ws/officer-radio?token={invalid_token}"
    
    try:
        async with websockets.connect(ws_url) as websocket:
            # Connection will be accepted, then closed with 1008
            # Try to receive a message, which should fail with connection closed
            try:
                await asyncio.wait_for(websocket.recv(), timeout=2.0)
                print("✗ Connection should have been closed but stayed open")
                return False
            except websockets.exceptions.ConnectionClosedError as e:
                if e.code == 1008:
                    print(f"✓ Connection correctly closed with code 1008: {e.reason}")
                    return True
                print(f"✗ Wrong close code: {e.code}")
                return False
            
    except websockets.exceptions.ConnectionClosedError as e:
        if e.code == 1008:
            print(f"✓ Connection correctly closed with code 1008: {e.reason}")
            return True
        print(f"✗ Wrong close code: {e.code}")
        return False
    except Exception as e:
        print(f"✗ Unexpected error: {e}")
        return False

async def test_missing_token():
    """Test WebSocket connection without token"""
    print("\n=== Test 3: Missing Token ===")
    
    ws_url = "ws://localhost:8000/ws/officer-radio"
    
    try:
        async with websockets.connect(ws_url) as websocket:
            print("✗ Connection should have been rejected but was accepted")
            await websocket.close()
            return False
            
    except Exception as e:
        # FastAPI will return an error for missing required query parameter
        print(f"✓ Connection correctly rejected: {type(e).__name__}")
        return True

async def test_expired_token():
    """Test WebSocket connection with expired token"""
    print("\n=== Test 4: Expired Token ===")
    
    # Create an expired token (expired 1 minute ago)
    test_user_id = "admin-001"  # Use admin user ID
    token = create_test_token(test_user_id, expire_minutes=-1)
    
    ws_url = f"ws://localhost:8000/ws/officer-radio?token={token}"
    
    try:
        async with websockets.connect(ws_url) as websocket:
            # Connection will be accepted, then closed with 1008
            try:
                await asyncio.wait_for(websocket.recv(), timeout=2.0)
                print("✗ Connection should have been closed but stayed open")
                return False
            except websockets.exceptions.ConnectionClosedError as e:
                if e.code == 1008:
                    print(f"✓ Connection correctly closed with code 1008: {e.reason}")
                    return True
                print(f"✗ Wrong close code: {e.code}")
                return False
            
    except websockets.exceptions.ConnectionClosedError as e:
        if e.code == 1008:
            print(f"✓ Connection correctly closed with code 1008: {e.reason}")
            return True
        print(f"✗ Wrong close code: {e.code}")
        return False
    except Exception as e:
        print(f"✗ Unexpected error: {e}")
        return False

async def main():
    """Run all tests"""
    print("=" * 60)
    print("Officer Radio WebSocket Authentication Tests")
    print("=" * 60)
    print("\nMake sure the backend server is running on localhost:8000")
    print("Press Enter to continue or Ctrl+C to cancel...")
    input()
    
    results = []
    
    # Run tests
    results.append(("Valid Authentication", await test_valid_authentication()))
    results.append(("Invalid Token", await test_invalid_token()))
    results.append(("Missing Token", await test_missing_token()))
    results.append(("Expired Token", await test_expired_token()))
    
    # Print summary
    print("\n" + "=" * 60)
    print("Test Summary")
    print("=" * 60)
    
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for test_name, result in results:
        status = "✓ PASS" if result else "✗ FAIL"
        print(f"{status}: {test_name}")
    
    print(f"\nTotal: {passed}/{total} tests passed")
    
    if passed == total:
        print("\n🎉 All tests passed!")
        sys.exit(0)
    else:
        print(f"\n❌ {total - passed} test(s) failed")
        sys.exit(1)

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n\nTests cancelled by user")
        sys.exit(1)
