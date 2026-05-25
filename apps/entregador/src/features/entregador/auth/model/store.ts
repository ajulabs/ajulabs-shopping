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
  tipoTransporte: 'bike' | 'moto' | 'carro';
}

interface AuthEntregadorState {
  isLoggedIn: boolean;
  needsOnboarding: boolean;
  token: string | null;
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
}

export const useAuthEntregadorStore = create<AuthEntregadorState>()(
  persist(
    (set) => ({
      isLoggedIn: false,
      needsOnboarding: false,
      token: null,
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
          throw new Error(typeof data.error === 'string' ? data.error : 'Erro ao cadastrar');
        }
        set({
          isLoggedIn: true,
          needsOnboarding: false,
          token: data.token,
          entregadorId: data.entregador.id,
          nome: data.entregador.nome,
          cpf: dados.cpf,
          email: dados.email,
        });
      },

      logout: () => {
        set({
          isLoggedIn: false,
          needsOnboarding: false,
          token: null,
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
    }),
    {
      name: 'ajulabs-entregador-auth',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        isLoggedIn: state.isLoggedIn,
        token: state.token,
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
