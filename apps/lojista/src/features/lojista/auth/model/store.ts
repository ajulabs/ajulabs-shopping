import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000/';

const TOKEN_KEY   = 'lojista_auth_token';
const SESSION_KEY = 'lojista_auth_session';

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
  hydrated: boolean;

  login: (cnpj: string, senha: string) => Promise<void>;
  registrar: (dados: DadosRegistroLojista) => Promise<void>;
  logout: () => void;
  hydrate: () => Promise<void>;
}

async function salvarSessao(token: string, lojista: any) {
  await AsyncStorage.setItem(TOKEN_KEY, token);
  await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(lojista));
}

async function limparSessao() {
  await AsyncStorage.removeItem(TOKEN_KEY).catch(() => {});
  await AsyncStorage.removeItem(SESSION_KEY).catch(() => {});
}

export const useAuthLojistaStore = create<AuthLojistaState>((set, get) => ({
  isLoggedIn: false,
  token: null,
  lojistaId: null,
  lojaId: null,
  lojaNome: null,
  nomeResponsavel: null,
  email: null,
  hydrated: false,

  hydrate: async () => {
    if (get().hydrated) return;
    try {
      const [token, sessionRaw] = await Promise.all([
        AsyncStorage.getItem(TOKEN_KEY),
        AsyncStorage.getItem(SESSION_KEY),
      ]);
      if (token && sessionRaw) {
        const lojista = JSON.parse(sessionRaw);
        set({
          isLoggedIn:      true,
          token,
          lojistaId:       lojista.id ?? null,
          lojaId:          lojista.lojaId ?? null,
          lojaNome:        lojista.lojaNome ?? null,
          nomeResponsavel: lojista.nomeResponsavel ?? null,
          email:           lojista.email ?? null,
        });
      }
    } catch {
      // sessão corrompida — começa do zero
    } finally {
      set({ hydrated: true });
    }
  },

  login: async (cnpj: string, senha: string) => {
    const res = await fetch(`${API_URL}auth/lojista/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cnpj, senha }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(typeof data.error === 'string' ? data.error : 'CNPJ ou senha inválidos');
    }

    const { token, lojista } = await res.json();
    await salvarSessao(token, lojista);
    set({
      isLoggedIn:      true,
      token,
      lojistaId:       lojista.id,
      lojaId:          lojista.lojaId ?? null,
      lojaNome:        lojista.lojaNome ?? null,
      nomeResponsavel: lojista.nomeResponsavel,
      email:           lojista.email,
    });
  },

  registrar: async (dados: DadosRegistroLojista) => {
    const cnpjRaw      = dados.cnpj.replace(/\D/g, '');
    const telefoneRaw  = `+55${dados.telefone.replace(/\D/g, '')}`;

    const res = await fetch(`${API_URL}auth/lojista/registrar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        cnpj:             cnpjRaw,
        nomeResponsavel:  dados.nomeResponsavel,
        telefone:         telefoneRaw,
        email:            dados.email,
        senha:            dados.senha,
      }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(typeof data.error === 'string' ? data.error : 'Erro ao criar conta');
    }

    const { token, lojista } = await res.json();
    await salvarSessao(token, lojista);
    set({
      isLoggedIn:      true,
      token,
      lojistaId:       lojista.id,
      lojaId:          lojista.lojaId ?? null,
      lojaNome:        lojista.lojaNome ?? null,
      nomeResponsavel: lojista.nomeResponsavel,
      email:           lojista.email,
    });
  },

  logout: () => {
    limparSessao().catch(() => {});
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
}));
