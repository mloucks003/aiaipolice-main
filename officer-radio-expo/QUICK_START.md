# Officer Radio App - Quick Start with Expo

## Setup (One Time)

1. **Install Expo Go on your phone:**
   - iOS: https://apps.apple.com/app/expo-go/id982107779
   - Android: https://play.google.com/store/apps/details?id=host.exp.exponent

2. **Install dependencies:**
   ```bash
   cd officer-radio-expo
   npm install
   ```

## Run the App

```bash
cd officer-radio-expo
npx expo start
```

Scan the QR code with your phone's camera (iOS) or Expo Go app (Android).

## Connecting to the Server

The app shows a connection screen on launch:

- **Heroku (default):** Just tap "Connect" - it's pre-configured for the deployed backend
- **Local development:** Change the server address to your computer's IP (e.g., `192.168.1.122:8000`) and turn off SSL

## How to Use

1. Wait for green "Connected" indicator
2. Press and hold the blue "PUSH TO TALK" button
3. Say: "Search for John Doe" or "Run plate ABC123"
4. Release button
5. Wait for the AI dispatcher to respond with voice + results
6. View search results in the "Results" tab

## Troubleshooting

### Can't connect to Heroku backend
- Make sure you have internet access
- The backend URL should be: `law-enforcement-rms-b2749bfd89b0.herokuapp.com`
- SSL should be ON for Heroku

### Can't connect to local backend
- Make sure phone and computer are on the same WiFi
- Backend must be running: `cd backend && python -m uvicorn server:app --host 0.0.0.0 --port 8000`
- Use your computer's WiFi IP, not `localhost`
- SSL should be OFF for local dev

### No audio response from dispatcher
- Check backend logs for OpenAI API errors
- Make sure OPENAI_API_KEY is set in backend/.env
- ffmpeg must be installed for audio conversion (on Heroku, add the apt buildpack + Aptfile)

### App crashes on record
- Grant microphone permissions when prompted
- On iOS, make sure the app has microphone access in Settings
