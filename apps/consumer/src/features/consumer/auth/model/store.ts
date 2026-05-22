import { create } from 'zustand';

const API_URL = (process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000').replace(/\/$/, '') + '/';

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
  avatarUrl: string | null;
  codigoVerificado: boolean;

  login: (cpf: string, senha: string) => Promise<void>;
  registrar: (dados: DadosRegistro) => Promise<void>;
  enviarCodigo: (telefone: string) => Promise<void>;
  verificarCodigo: (codigo: string) => Promise<boolean>;
  registrarNome: (nome: string) => void;
  setAvatarUrl: (url: string | null) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  isLoggedIn: false,
  token: null,
  telefone: null,
  email: null,
  nome: null,
  userId: null,
  avatarUrl: null,
  codigoVerificado: false,

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

    const { token, usuario } = await res.json();
    set({
      isLoggedIn: true,
      token,
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
        errorMsg = data.error.map((e: { message?: string }) => e.message ?? String(e)).join('. ');
      }
      throw new Error(errorMsg);
    }

    const { token, usuario } = await res.json();
    set({
      isLoggedIn: true,
      token,
      userId: usuario.id,
      nome: usuario.nome,
      telefone: usuario.telefone,
      email: usuario.email,
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

  setAvatarUrl: (url: string | null) => {
    set({ avatarUrl: url });
  },

  logout: () => {
    set({
      isLoggedIn: false,
      token: null,
      telefone: null,
      email: null,
      nome: null,
      userId: null,
      avatarUrl: null,
      codigoVerificado: false,
    });
  },
}));
