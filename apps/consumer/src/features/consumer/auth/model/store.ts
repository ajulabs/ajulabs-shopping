import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000/';

const TOKEN_KEY = 'consumer_auth_token';
const USER_KEY  = 'consumer_auth_user';

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
  telefone: string | null;
  email: string | null;
  nome: string | null;
  userId: string | null;
  codigoVerificado: boolean;
  hydrated: boolean;

  login: (cpf: string, senha: string) => Promise<void>;
  registrar: (dados: DadosRegistro) => Promise<void>;
  enviarCodigo: (telefone: string) => Promise<void>;
  verificarCodigo: (codigo: string) => Promise<boolean>;
  registrarNome: (nome: string) => void;
  logout: () => void;
  hydrate: () => Promise<void>;
}

async function salvarSessao(token: string, usuario: { id: string; nome: string; telefone?: string; email?: string }) {
  await AsyncStorage.setItem(TOKEN_KEY, token);
  await AsyncStorage.setItem(USER_KEY, JSON.stringify(usuario));
}

async function limparSessao() {
  await AsyncStorage.removeItem(TOKEN_KEY).catch(() => {});
  await AsyncStorage.removeItem(USER_KEY).catch(() => {});
}

export const useAuthStore = create<AuthState>((set, get) => ({
  isLoggedIn: false,
  token: null,
  telefone: null,
  email: null,
  nome: null,
  userId: null,
  codigoVerificado: false,
  hydrated: false,

  hydrate: async () => {
    if (get().hydrated) return;
    try {
      const token   = await AsyncStorage.getItem(TOKEN_KEY);
      const userRaw = await AsyncStorage.getItem(USER_KEY);
      if (token && userRaw) {
        const user = JSON.parse(userRaw);
        set({
          isLoggedIn: true,
          token,
          userId:     user.id ?? null,
          nome:       user.nome ?? null,
          telefone:   user.telefone ?? null,
          email:      user.email ?? null,
        });
      }
    } catch {
      // sessão corrompida — começa do zero
    } finally {
      set({ hydrated: true });
    }
  },

  login: async (cpf: string, senha: string) => {
    const res = await fetch(`${API_URL}auth/usuario/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cpf, senha }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(typeof data.error === 'string' ? data.error : 'CPF ou senha inválidos');
    }

    const { token, usuario } = await res.json();
    await salvarSessao(token, usuario);
    set({
      isLoggedIn: true,
      token,
      userId:   usuario.id,
      nome:     usuario.nome,
      telefone: usuario.telefone,
      email:    usuario.email,
    });
  },

  registrar: async (dados: DadosRegistro) => {
    const cpfRaw      = dados.cpf.replace(/\D/g, '');
    const telefoneRaw = `+55${dados.telefone.replace(/\D/g, '')}`;

    const res = await fetch(`${API_URL}auth/usuario/registrar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nome:     dados.nome,
        cpf:      cpfRaw,
        telefone: telefoneRaw,
        email:    dados.email,
        senha:    dados.senha,
      }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(typeof data.error === 'string' ? data.error : 'Erro ao criar conta');
    }

    const { token, usuario } = await res.json();
    await salvarSessao(token, usuario);
    set({
      isLoggedIn: true,
      token,
      userId:   usuario.id,
      nome:     usuario.nome,
      telefone: usuario.telefone,
      email:    usuario.email,
    });
  },

  enviarCodigo: async (telefone: string) => {
    await new Promise(r => setTimeout(r, 1000));
    set({ telefone });
  },

  verificarCodigo: async (codigo: string) => {
    await new Promise(r => setTimeout(r, 800));
    if (codigo.length === 4) {
      set({ codigoVerificado: true, userId: 'user-001' });
      return true;
    }
    return false;
  },

  registrarNome: (nome: string) => {
    set({ nome, isLoggedIn: true });
  },

  logout: async () => {
    await limparSessao();
    set({
      isLoggedIn: false,
      token: null,
      telefone: null,
      email: null,
      nome: null,
      userId: null,
      codigoVerificado: false,
    });
  },
}));
