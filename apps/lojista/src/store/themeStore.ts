import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';

const THEME_KEY = 'lojista-theme-dark';

interface ThemeState {
  isDark: boolean;
  toggleDark: () => void;
  setDark: (v: boolean) => void;
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  isDark: false,
  toggleDark: () => {
    const next = !get().isDark;
    set({ isDark: next });
    SecureStore.setItemAsync(THEME_KEY, next ? '1' : '0').catch(() => {});
  },
  setDark: (v: boolean) => {
    set({ isDark: v });
    SecureStore.setItemAsync(THEME_KEY, v ? '1' : '0').catch(() => {});
  },
}));

// Reidrata a preferência salva no boot.
SecureStore.getItemAsync(THEME_KEY)
  .then((val) => {
    if (val === '1') useThemeStore.setState({ isDark: true });
  })
  .catch(() => {});
