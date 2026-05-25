import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
  lojistaId: string | null;
  lojaId: string | null;
  lojaNome: string | null;
  nomeResponsavel: string | null;
  email: string | null;
  hasHydrated: boolean;
  setHasHydrated: (v: boolean) => void;

  login: (cnpj: string, senha: string) => Promise<void>;
  registrar: (dados: DadosRegistroLojista) => Promise<void>;
  logout: () => void;
}

export const useAuthLojistaStore = create<AuthLojistaState>()(
  persist(
    (set) => ({
      isLoggedIn: false,
      token: null,
      lojistaId: null,
      lojaId: null,
      lojaNome: null,
      nomeResponsavel: null,
      email: null,
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
          const errorMsg =
            typeof data.error === 'string' ? data.error : 'CNPJ ou senha inválidos';
          throw new Error(errorMsg);
        }

        const { token, lojista } = await res.json();
        set({
          isLoggedIn: true,
          token,
          lojistaId: lojista.id,
          lojaId: lojista.lojaId ?? null,
          lojaNome: lojista.lojaNome ?? null,
          nomeResponsavel: lojista.nomeResponsavel,
          email: lojista.email,
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

        const { token, lojista } = await res.json();
        set({
          isLoggedIn: true,
          token,
          lojistaId: lojista.id,
          lojaId: lojista.lojaId ?? null,
          lojaNome: lojista.lojaNome ?? null,
          nomeResponsavel: lojista.nomeResponsavel,
          email: lojista.email,
        });
      },

      logout: () => {
        set({
          isLoggedIn: false,
          token: null,
          lojistaId: null,
          lojaId: null,
          lojaNome: null,
          nomeResponsavel: null,
          email: null,
        });
      },
    }),
    {
      name: 'ajulabs-lojista-auth',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        isLoggedIn: state.isLoggedIn,
        token: state.token,
        lojistaId: state.lojistaId,
        lojaId: state.lojaId,
        lojaNome: state.lojaNome,
        nomeResponsavel: state.nomeResponsavel,
        email: state.email,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    },
  ),
);
