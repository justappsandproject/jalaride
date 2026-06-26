import AsyncStorage from '@react-native-async-storage/async-storage';

const TOKEN_KEY = 'jala_ride_rider_token';

export async function persistRiderToken(token: string | null) {
  if (token) await AsyncStorage.setItem(TOKEN_KEY, token);
  else await AsyncStorage.removeItem(TOKEN_KEY);
}

export async function loadRiderToken(): Promise<string | null> {
  return AsyncStorage.getItem(TOKEN_KEY);
}
