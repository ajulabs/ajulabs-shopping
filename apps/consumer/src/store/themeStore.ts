import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';

const THEME_KEY = 'consumer-theme-dark';

interface ThemeState {
  isDark: boolean;
  toggleDark: () => void;
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  isDark: false,
  toggleDark: () => {
    const next = !get().isDark;
    set({ isDark: next });
    SecureStore.setItemAsync(THEME_KEY, next ? '1' : '0').catch(() => {});
  },
}));

SecureStore.getItemAsync(THEME_KEY)
  .then(val => { if (val === '1') useThemeStore.setState({ isDark: true }); })
  .catch(() => {});
