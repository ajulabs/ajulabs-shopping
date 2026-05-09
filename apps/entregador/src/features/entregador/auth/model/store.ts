import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000/';

const TOKEN_KEY   = 'entregador_auth_token';
const SESSION_KEY = 'entregador_auth_session';

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
  hydrated: boolean;
  login: (cpf: string, senha: string) => Promise<void>;
  registrar: (dados: DadosRegistro) => Promise<void>;
  logout: () => void;
  hydrate: () => Promise<void>;
}

async function salvarSessao(token: string, entregador: any) {
  await AsyncStorage.setItem(TOKEN_KEY, token);
  await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(entregador));
}

async function limparSessao() {
  await AsyncStorage.removeItem(TOKEN_KEY).catch(() => {});
  await AsyncStorage.removeItem(SESSION_KEY).catch(() => {});
}

export const useAuthEntregadorStore = create<AuthEntregadorState>((set, get) => ({
  isLoggedIn: false,
  needsOnboarding: false,
  token: null,
  cpf: null,
  nome: null,
  email: null,
  entregadorId: null,
  hydrated: false,

  hydrate: async () => {
    if (get().hydrated) return;
    try {
      const token      = await AsyncStorage.getItem(TOKEN_KEY);
      const sessionRaw = await AsyncStorage.getItem(SESSION_KEY);
      if (token && sessionRaw) {
        const entregador = JSON.parse(sessionRaw);
        set({
          isLoggedIn:   true,
          token,
          entregadorId: entregador.id ?? null,
          nome:         entregador.nome ?? null,
          cpf:          entregador.cpf ?? null,
          email:        entregador.email ?? null,
        });
      }
    } catch {
      // sessão corrompida — começa do zero
    } finally {
      set({ hydrated: true });
    }
  },

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
    await salvarSessao(data.token, { ...data.entregador, cpf });
    set({
      isLoggedIn:   true,
      needsOnboarding: false,
      token:        data.token,
      entregadorId: data.entregador.id,
      nome:         data.entregador.nome,
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
    await salvarSessao(data.token, { ...data.entregador, cpf: dados.cpf, email: dados.email });
    set({
      isLoggedIn:   true,
      needsOnboarding: false,
      token:        data.token,
      entregadorId: data.entregador.id,
      nome:         data.entregador.nome,
      cpf:          dados.cpf,
      email:        dados.email,
    });
  },

  logout: async () => {
    await limparSessao();
    set({
      isLoggedIn: false,
      needsOnboarding: false,
      token: null,
      cpf: null,
      nome: null,
      email: null,
      entregadorId: null,
    });
  },
}));
