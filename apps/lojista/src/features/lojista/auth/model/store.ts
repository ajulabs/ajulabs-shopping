import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { PapelColaborador } from '@ajulabs/types';

const API_URL =
  (process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000').replace(/\/$/, '') + '/v1/';

interface DadosRegistroLojista {
  cnpj: string;
  nomeResponsavel: string;
  telefone: string;
  email: string;
  senha: string;
}

interface AuthLojistaState {
  isLoggedIn: boolean;
  token: string | null;
  refreshToken: string | null;
  lojistaId: string | null;
  lojaId: string | null;
  lojaNome: string | null;
  nomeResponsavel: string | null;
  email: string | null;
  // colaborador fields
  colaboradorId: string | null;
  papel: PapelColaborador | null;
  isLojistaDono: boolean;
  hasHydrated: boolean;
  setHasHydrated: (v: boolean) => void;

  login: (cnpj: string, senha: string) => Promise<void>;
  loginColaborador: (email: string, senha: string) => Promise<void>;
  registrar: (dados: DadosRegistroLojista) => Promise<void>;
  logout: () => void;
  refreshAccessToken: () => Promise<boolean>;
}

export const useAuthLojistaStore = create<AuthLojistaState>()(
  persist(
    (set, get) => ({
      isLoggedIn: false,
      token: null,
      refreshToken: null,
      lojistaId: null,
      lojaId: null,
      lojaNome: null,
      nomeResponsavel: null,
      email: null,
      colaboradorId: null,
      papel: null,
      isLojistaDono: false,
      hasHydrated: false,
      setHasHydrated: (v: boolean) => set({ hasHydrated: v }),

      login: async (cnpj: string, senha: string) => {
        const res = await fetch(`${API_URL}auth/lojista/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ cnpj, senha }),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          const errorMsg = typeof data.error === 'string' ? data.error : 'CNPJ ou senha inválidos';
          throw new Error(errorMsg);
        }

        const { token, refreshToken, lojista } = await res.json();
        set({
          isLoggedIn: true,
          token,
          refreshToken: refreshToken ?? null,
          lojistaId: lojista.id,
          lojaId: lojista.lojaId ?? null,
          lojaNome: lojista.lojaNome ?? null,
          nomeResponsavel: lojista.nomeResponsavel,
          email: lojista.email,
          colaboradorId: null,
          papel: null,
          isLojistaDono: true,
        });
      },

      loginColaborador: async (email: string, senha: string) => {
        const res = await fetch(`${API_URL}auth/colaborador/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, senha }),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          const errorMsg = typeof data.error === 'string' ? data.error : 'Email ou senha inválidos';
          throw new Error(errorMsg);
        }

        const { token, refreshToken, colaborador } = await res.json();
        set({
          isLoggedIn: true,
          token,
          refreshToken: refreshToken ?? null,
          lojistaId: null,
          lojaId: colaborador.lojaId,
          lojaNome: colaborador.lojaNome ?? null,
          nomeResponsavel: colaborador.nome,
          email: colaborador.email,
          colaboradorId: colaborador.id,
          papel: colaborador.papel,
          isLojistaDono: false,
        });
      },

      registrar: async (dados: DadosRegistroLojista) => {
        const cnpjRaw = dados.cnpj.replace(/\D/g, '');
        const telefoneRaw = `+55${dados.telefone.replace(/\D/g, '')}`;

        const res = await fetch(`${API_URL}auth/lojista/registrar`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            cnpj: cnpjRaw,
            nomeResponsavel: dados.nomeResponsavel,
            telefone: telefoneRaw,
            email: dados.email,
            senha: dados.senha,
          }),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          const errorMsg = typeof data.error === 'string' ? data.error : 'Erro ao criar conta';
          throw new Error(errorMsg);
        }

        const { token, refreshToken, lojista } = await res.json();
        set({
          isLoggedIn: true,
          token,
          refreshToken: refreshToken ?? null,
          lojistaId: lojista.id,
          lojaId: lojista.lojaId ?? null,
          lojaNome: lojista.lojaNome ?? null,
          nomeResponsavel: lojista.nomeResponsavel,
          email: lojista.email,
          colaboradorId: null,
          papel: null,
          isLojistaDono: true,
        });
      },

      logout: () => {
        set({
          isLoggedIn: false,
          token: null,
          refreshToken: null,
          lojistaId: null,
          lojaId: null,
          lojaNome: null,
          nomeResponsavel: null,
          email: null,
          colaboradorId: null,
          papel: null,
          isLojistaDono: false,
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
          if (!res.ok) {
            get().logout();
            return false;
          }
          const { token: newToken, refreshToken: newRefreshToken } = await res.json();
          set({ token: newToken, refreshToken: newRefreshToken ?? null });
          return true;
        } catch {
          get().logout();
          return false;
        }
      },
    }),
    {
      name: 'ajulabs-lojista-auth',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        isLoggedIn: state.isLoggedIn,
        token: state.token,
        refreshToken: state.refreshToken,
        lojistaId: state.lojistaId,
        lojaId: state.lojaId,
        lojaNome: state.lojaNome,
        nomeResponsavel: state.nomeResponsavel,
        email: state.email,
        colaboradorId: state.colaboradorId,
        papel: state.papel,
        isLojistaDono: state.isLojistaDono,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    },
  ),
);
