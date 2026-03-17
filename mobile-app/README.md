# Officer Radio App

A React Native mobile application that provides law enforcement officers with a voice-activated AI dispatcher interface.

## Features

- Push-to-talk voice interface with radio sound effects
- Real-time bidirectional audio streaming via WebSocket
- OpenAI Realtime API integration for natural language processing
- Database search capabilities (person and vehicle lookups)
- Visual display of search results with history
- Secure authentication and session management
- Cross-platform support (iOS and Android)

## Prerequisites

- Node.js >= 18
- React Native development environment set up
- For iOS: Xcode 14+ and CocoaPods
- For Android: Android Studio and JDK 17

## Installation

```bash
# Install dependencies
npm install

# iOS only: Install CocoaPods dependencies
cd ios && pod install && cd ..
```

## Running the App

### iOS

```bash
npm run ios
```

### Android

```bash
npm run android
```

## Development

### Project Structure

```
mobile-app/
├── src/
│   ├── components/     # Reusable UI components
│   ├── screens/        # Screen components
│   ├── services/       # Business logic and API services
│   ├── contexts/       # React Context providers
│   ├── types/          # TypeScript type definitions
│   ├── utils/          # Utility functions
│   └── assets/         # Static assets (images, sounds)
├── android/            # Android native code
├── ios/                # iOS native code
└── __tests__/          # Test files
```

### Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm test -- --coverage

# Run linter
npm run lint
```

## Configuration

The app connects to the backend WebSocket endpoint at `/ws/officer-radio`. Update the backend URL in the configuration file before running.

## Platform Requirements

- **iOS**: Version 13.0 and above
- **Android**: Version 8.0 (API level 26) and above

## License

Proprietary - Law Enforcement Use Only
