import * as SecureStore from 'expo-secure-store'
import { Platform } from 'react-native'

// SecureStore is not available on web — Clerk falls back to localStorage automatically
export const tokenCache =
  Platform.OS !== 'web'
    ? {
        getToken: (key: string) => SecureStore.getItemAsync(key),
        saveToken: (key: string, token: string) => SecureStore.setItemAsync(key, token),
        clearToken: (key: string) => SecureStore.deleteItemAsync(key),
      }
    : undefined
