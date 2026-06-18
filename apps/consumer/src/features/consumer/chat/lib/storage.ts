import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

export const ONBOARDING_KEY = 'aju_onboarding_v1';
export const chatKey = (userId: string) => `aju_chat_${userId}`;
export const sugestoesKey = (userId: string) => `aju_sugestoes_v1_${userId}`;

// expo-secure-store não funciona na web — fallback para localStorage
export const storage = {
  getItem: (key: string) =>
    Platform.OS === 'web'
      ? Promise.resolve(typeof localStorage !== 'undefined' ? localStorage.getItem(key) : null)
      : SecureStore.getItemAsync(key),
  setItem: (key: string, value: string) => {
    if (Platform.OS === 'web') {
      if (typeof localStorage !== 'undefined') localStorage.setItem(key, value);
      return Promise.resolve();
    }
    return SecureStore.setItemAsync(key, value);
  },
  removeItem: (key: string) => {
    if (Platform.OS === 'web') {
      if (typeof localStorage !== 'undefined') localStorage.removeItem(key);
      return Promise.resolve();
    }
    return SecureStore.deleteItemAsync(key);
  },
};
