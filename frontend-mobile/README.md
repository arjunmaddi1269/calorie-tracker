# Calorie Tracker - Mobile App (React Native)

React Native mobile application for iOS and Android using Expo.

## Features

- User authentication (login/register)
- Multi-step onboarding flow
- Daily calorie and macro tracking
- AI-powered food recognition from photos
- Food logging history
- User profile management
- Bottom tab navigation

## Prerequisites

- Node.js 18+ and npm
- Expo CLI
- iOS Simulator (Mac only) or Android Emulator
- Expo Go app on your physical device (optional)

## Setup

### 1. Install Dependencies

```bash
cd frontend-mobile
npm install
```

### 2. Configure Environment

Create a `.env` file in the `frontend-mobile` directory:

```env
# API Configuration
EXPO_PUBLIC_API_URL=http://localhost:8000/api/v1

# For physical device testing, use your computer's IP:
# EXPO_PUBLIC_API_URL=http://192.168.1.x:8000/api/v1
```

### 3. Start Development Server

```bash
npm start
```

This will open the Expo Developer Tools in your browser.

### 4. Run on Device/Simulator

**iOS Simulator (Mac only):**
```bash
npm run ios
```

**Android Emulator:**
```bash
npm run android
```

**Physical Device:**
1. Install Expo Go app from App Store or Google Play
2. Scan the QR code shown in terminal/browser
3. Make sure your device is on the same network as your computer

## Project Structure

```
frontend-mobile/
├── src/
│   ├── api/              # API client and endpoints
│   ├── components/       # Reusable UI components
│   ├── constants/        # App constants and config
│   ├── navigation/       # Navigation setup
│   ├── screens/          # App screens
│   ├── store/            # Zustand state management
│   └── types/            # TypeScript types
├── assets/               # Images, icons, fonts
├── App.tsx               # App entry point
├── app.json              # Expo configuration
└── package.json          # Dependencies
```

## Screens

### Authentication
- **LoginScreen**: Email/password login
- **RegisterScreen**: New user registration

### Main App (Bottom Tabs)
- **DashboardScreen**: Daily nutrition overview, calorie tracking
- **LogFoodScreen**: Camera integration for food photos, AI analysis
- **HistoryScreen**: View past food logs
- **ProfileScreen**: User profile and settings

### Other
- **OnboardingScreen**: Multi-step profile setup (age, weight, goals, activity level)

## Key Libraries

- **React Navigation**: Navigation and routing
- **React Query**: Server state management
- **Zustand**: Global state management
- **Expo Camera**: Camera access for food photos
- **Expo Image Picker**: Gallery access
- **React Native Paper**: UI components
- **Axios**: HTTP client
- **date-fns**: Date formatting

## API Integration

The app connects to the FastAPI backend. Make sure the backend is running:

```bash
cd ../backend
poetry run uvicorn app.main:app --reload
```

## Testing on Physical Device

When testing on a physical device, you need to:

1. Find your computer's local IP address:
   - Mac/Linux: `ifconfig | grep inet`
   - Windows: `ipconfig`

2. Update the API URL in `.env`:
   ```env
   EXPO_PUBLIC_API_URL=http://YOUR_IP_ADDRESS:8000/api/v1
   ```

3. Make sure your phone and computer are on the same WiFi network

## Building for Production

### iOS (requires Mac and Apple Developer account)

```bash
expo build:ios
```

### Android

```bash
expo build:android
```

Or use EAS Build (recommended):

```bash
npm install -g eas-cli
eas login
eas build --platform android
```

## Troubleshooting

### "Network request failed"

- Ensure backend is running
- Check API URL in `.env`
- On physical device, use your computer's IP address, not localhost
- Disable any VPN or firewall blocking local connections

### "Unable to resolve module"

```bash
rm -rf node_modules
npm install
npm start --reset-cache
```

### Camera not working

- Grant camera permissions when prompted
- On iOS simulator, camera is not available (use image picker instead)
- Check Info.plist has camera usage description (handled by expo-camera)

## Next Steps

- Add Google OAuth for mobile
- Implement push notifications for meal reminders
- Add offline support with local storage
- Barcode scanner for packaged foods
- Apple Health / Google Fit integration

## Resources

- [Expo Documentation](https://docs.expo.dev/)
- [React Navigation](https://reactnavigation.org/)
- [React Native Paper](https://callstack.github.io/react-native-paper/)
