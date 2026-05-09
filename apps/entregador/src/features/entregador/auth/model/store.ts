import { create } from 'zustand';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000/';

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
  login: (cpf: string, senha: string) => Promise<void>;
  registrar: (dados: DadosRegistro) => Promise<void>;
  logout: () => void;
}

export const useAuthEntregadorStore = create<AuthEntregadorState>((set) => ({
  isLoggedIn: false,
  needsOnboarding: false,
  token: null,
  cpf: null,
  nome: null,
  email: null,
  entregadorId: null,

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
    });
  },
}));
