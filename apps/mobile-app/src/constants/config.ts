import { Platform } from 'react-native';

// Standard base URL pointing to the NIGELEC Core Express API.
// In React Native:
// - Android Emulator uses 10.0.2.2 to access localhost on host machine.
// - iOS Simulator / web uses localhost (or 127.0.0.1).
export const API_URL = Platform.select({
  android: 'http://10.0.2.2:3000',
  default: 'http://localhost:3000'
});

export const CONFIG = {
  API_URL,
  TIMEOUT_MS: 5000,
  DEFAULT_METER_ID: '541-234-567',
};
