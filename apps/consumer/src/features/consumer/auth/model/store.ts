import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL =
  (process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000').replace(/\/$/, '') + '/v1/';

interface DadosRegistro {
  nome: string;
  cpf: string;
  telefone: string;
  email: string;
  senha: string;
}

interface AuthState {
  isLoggedIn: boolean;
  token: string | null;
  refreshToken: string | null;
  telefone: string | null;
  email: string | null;
  nome: string | null;
  userId: string | null;
  avatarUrl: string | null;
  codigoVerificado: boolean;
  /**
   * True quando o estado já foi carregado do AsyncStorage. Usado pelo
   * RootLayout pra evitar piscar a tela de login enquanto o storage
   * ainda está sendo lido.
   */
  hasHydrated: boolean;
  setHasHydrated: (v: boolean) => void;

  login: (cpf: string, senha: string) => Promise<void>;
  registrar: (dados: DadosRegistro) => Promise<void>;
  enviarCodigo: (telefone: string) => Promise<void>;
  verificarCodigo: (codigo: string) => Promise<boolean>;
  registrarNome: (nome: string) => void;
  setAvatarUrl: (url: string | null) => void;
  logout: () => void;
  refreshAccessToken: () => Promise<boolean>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      isLoggedIn: false,
      token: null,
      refreshToken: null,
      telefone: null,
      email: null,
      nome: null,
      userId: null,
      avatarUrl: null,
      codigoVerificado: false,
      hasHydrated: false,
      setHasHydrated: (v: boolean) => set({ hasHydrated: v }),

      login: async (cpf: string, senha: string) => {
        const res = await fetch(`${API_URL}auth/usuario/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ cpf, senha }),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          let errorMsg = 'CPF ou senha inválidos';
          if (typeof data.error === 'string') {
            errorMsg = data.error;
          }
          throw new Error(errorMsg);
        }

        const { token, refreshToken, usuario } = await res.json();
        set({
          isLoggedIn: true,
          token,
          refreshToken: refreshToken ?? null,
          userId: usuario.id,
          nome: usuario.nome,
          telefone: usuario.telefone,
          email: usuario.email,
        });
      },

      registrar: async (dados: DadosRegistro) => {
        const cpfRaw = dados.cpf.replace(/\D/g, '');
        const telefoneRaw = dados.telefone.replace(/[^\d+]/g, '');

        const res = await fetch(`${API_URL}auth/usuario/registrar`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            nome: dados.nome,
            cpf: cpfRaw,
            telefone: telefoneRaw,
            email: dados.email,
            senha: dados.senha,
          }),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          let errorMsg = 'Erro ao criar conta';
          if (typeof data.error === 'string') {
            errorMsg = data.error;
          } else if (Array.isArray(data.error) && data.error.length > 0) {
            errorMsg = data.error
              .map((e: { message?: string }) => e.message ?? String(e))
              .join('. ');
          }
          throw new Error(errorMsg);
        }

        const { token, refreshToken, usuario } = await res.json();
        set({
          isLoggedIn: true,
          token,
          refreshToken: refreshToken ?? null,
          userId: usuario.id,
          nome: usuario.nome,
          telefone: usuario.telefone,
          email: usuario.email,
        });
      },

      enviarCodigo: async (telefone: string) => {
        await new Promise((r) => setTimeout(r, 1000));
        set({ telefone });
      },

      verificarCodigo: async (codigo: string) => {
        await new Promise((r) => setTimeout(r, 800));
        if (codigo.length === 4) {
          set({ codigoVerificado: true, userId: 'user-001' });
          return true;
        }
        return false;
      },

      registrarNome: (nome: string) => {
        set({ nome, isLoggedIn: true });
      },

      setAvatarUrl: (url: string | null) => {
        set({ avatarUrl: url });
      },

      logout: () => {
        set({
          isLoggedIn: false,
          token: null,
          refreshToken: null,
          telefone: null,
          email: null,
          nome: null,
          userId: null,
          avatarUrl: null,
          codigoVerificado: false,
        });
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
            // Refresh token expirado ou inválido — desloga
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
          // Sem conexão — mantém sessão, app tenta funcionar com token atual
          return false;
        }
      },
    }),
    {
      name: 'ajulabs-consumer-auth',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        isLoggedIn: state.isLoggedIn,
        token: state.token,
        refreshToken: state.refreshToken,
        userId: state.userId,
        nome: state.nome,
        telefone: state.telefone,
        email: state.email,
        avatarUrl: state.avatarUrl,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    },
  ),
);
