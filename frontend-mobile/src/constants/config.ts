/**
 * App configuration constants
 */
import Constants from 'expo-constants';

// API Configuration from environment variables
export const API_BASE_URL =
  Constants.expoConfig?.extra?.apiUrl ||
  process.env.EXPO_PUBLIC_API_URL ||
  'http://localhost:8000/api/v1';

// For iOS simulator use: http://localhost:8000/api/v1
// For Android emulator use: http://10.0.2.2:8000/api/v1
// For physical device use: http://YOUR_COMPUTER_IP:8000/api/v1

export const APP_CONFIG = {
  API_URL: API_BASE_URL,
  APP_NAME: 'CalTracker',
  VERSION: '1.0.0',
};

// Storage keys
export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
  USER: 'user',
};
