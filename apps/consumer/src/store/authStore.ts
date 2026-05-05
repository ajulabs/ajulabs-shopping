import { create } from 'zustand';

interface AuthState {
  isLoggedIn: boolean;
  telefone: string | null;
  nome: string | null;
  userId: string | null;

  // Actions
  enviarCodigo: (telefone: string) => Promise<void>;
  verificarCodigo: (codigo: string) => Promise<boolean>;
  registrarNome: (nome: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  isLoggedIn: false,
  telefone: null,
  nome: null,
  userId: null,

  enviarCodigo: async (telefone: string) => {
    // MOCK: simula envio de SMS (delay de 1s)
    // FUTURO: chamar Supabase auth.signInWithOtp({ phone })
    await new Promise(r => setTimeout(r, 1000));
    set({ telefone });
  },

  verificarCodigo: async (codigo: string) => {
    // MOCK: qualquer código de 4 dígitos funciona
    // FUTURO: chamar Supabase auth.verifyOtp({ phone, token })
    await new Promise(r => setTimeout(r, 800));
    if (codigo.length === 4) {
      set({ isLoggedIn: true, userId: 'user-001' });
      return true;
    }
    return false;
  },

  registrarNome: (nome: string) => {
    // MOCK: salva localmente
    // FUTURO: chamar Supabase update user metadata
    set({ nome });
  },

  logout: () => {
    set({ isLoggedIn: false, telefone: null, nome: null, userId: null });
  },
}));