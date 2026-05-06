import { create } from 'zustand';

interface AuthEntregadorState {
  isLoggedIn: boolean;
  cpf: string | null;
  nome: string | null;
  entregadorId: string | null;
  login: (cpf: string) => void;
  logout: () => void;
}

export const useAuthEntregadorStore = create<AuthEntregadorState>((set) => ({
  isLoggedIn: false,
  cpf: null,
  nome: null,
  entregadorId: null,

  login: (cpf: string) => {
    set({ isLoggedIn: true, entregadorId: 'entregador-001', cpf, nome: 'Entregador' });
  },

  logout: () => {
    set({ isLoggedIn: false, cpf: null, nome: null, entregadorId: null });
  },
}));
