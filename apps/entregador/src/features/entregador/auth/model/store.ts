import { Platform } from 'react-native';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { disconnectSocket } from '@ajulabs/realtime';

const secureStorage =
  Platform.OS === 'web'
    ? {
        getItem: AsyncStorage.getItem,
        setItem: AsyncStorage.setItem,
        removeItem: AsyncStorage.removeItem,
      }
    : {
        getItem: SecureStore.getItemAsync,
        setItem: SecureStore.setItemAsync,
        removeItem: SecureStore.deleteItemAsync,
      };

const API_URL =
  (process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000').replace(/\/$/, '') + '/v1/';

interface DadosRegistro {
  nome: string;
  cpf: string;
  telefone: string;
  email: string;
  senha: string;
  tipoTransporte: 'bike' | 'moto' | 'carro';
}

interface AuthEntregadorState {
  isLoggedIn: boolean;
  needsOnboarding: boolean;
  token: string | null;
  refreshToken: string | null;
  cpf: string | null;
  nome: string | null;
  email: string | null;
  entregadorId: string | null;
  fotoUrl: string | null;
  /**
   * True quando o estado já foi carregado do AsyncStorage. Usado pelo
   * RootLayout pra evitar piscar a tela de login enquanto o storage
   * ainda está sendo lido.
   */
  hasHydrated: boolean;
  setHasHydrated: (v: boolean) => void;

  login: (cpf: string, senha: string) => Promise<void>;
  registrar: (dados: DadosRegistro) => Promise<void>;
  logout: () => void;
  setFotoUrl: (url: string) => void;
  refreshAccessToken: () => Promise<boolean>;
}

export const useAuthEntregadorStore = create<AuthEntregadorState>()(
  persist(
    (set, get) => ({
      isLoggedIn: false,
      needsOnboarding: false,
      token: null,
      refreshToken: null,
      cpf: null,
      nome: null,
      email: null,
      entregadorId: null,
      fotoUrl: null,
      hasHydrated: false,
      setHasHydrated: (v: boolean) => set({ hasHydrated: v }),

      login: async (cpf, senha) => {
        const resp = await fetch(`${API_URL}auth/entregador/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ cpf, senha }),
        });
        const data = await resp.json();
        if (!resp.ok) {
          throw new Error(typeof data.error === 'string' ? data.error : 'CPF ou senha inválidos');
        }
        set({
          isLoggedIn: true,
          needsOnboarding: false,
          token: data.token,
          refreshToken: data.refreshToken ?? null,
          entregadorId: data.entregador.id,
          nome: data.entregador.nome,
          fotoUrl: data.entregador.fotoUrl ?? null,
          cpf,
        });
      },

      registrar: async (dados) => {
        const resp = await fetch(`${API_URL}auth/entregador/registrar`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(dados),
        });
        const data = await resp.json();
        if (!resp.ok) {
          const errorMsg = typeof data.error === 'string' ? data.error : 'Erro ao cadastrar';
          const err = new Error(errorMsg);
          if (typeof data.field === 'string') (err as any).field = data.field;
          throw err;
        }
        set({
          isLoggedIn: true,
          needsOnboarding: false,
          token: data.token,
          refreshToken: data.refreshToken ?? null,
          entregadorId: data.entregador.id,
          nome: data.entregador.nome,
          cpf: dados.cpf,
          email: dados.email,
        });
      },

      logout: () => {
        disconnectSocket();
        secureStorage.removeItem('ajulabs-entregador-auth').catch(() => {});
        set({
          isLoggedIn: false,
          needsOnboarding: false,
          token: null,
          refreshToken: null,
          cpf: null,
          nome: null,
          email: null,
          entregadorId: null,
          fotoUrl: null,
        });
      },

      setFotoUrl: (url: string) => {
        set({ fotoUrl: url });
      },

      refreshAccessToken: async () => {
        const { refreshToken } = get();
        if (!refreshToken) {
          get().logout();
          return false;
        }
        try {
          const res = await fetch(`${API_URL}auth/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken }),
          });
          if (res.status === 401) {
            get().logout();
            return false;
          }
          if (!res.ok) {
            // Erro de servidor (5xx) ou rede — mantém sessão, tenta de novo depois
            return false;
          }
          const { token: newToken, refreshToken: newRefreshToken } = await res.json();
          set({ token: newToken, refreshToken: newRefreshToken ?? null });
          return true;
        } catch {
          // Sem conexão — mantém sessão
          return false;
        }
      },
    }),
    {
      name: 'ajulabs-entregador-auth',
      storage: createJSONStorage(() => secureStorage),
      partialize: (state) => ({
        isLoggedIn: state.isLoggedIn,
        token: state.token,
        refreshToken: state.refreshToken,
        cpf: state.cpf,
        nome: state.nome,
        email: state.email,
        entregadorId: state.entregadorId,
        fotoUrl: state.fotoUrl,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    },
  ),
);
