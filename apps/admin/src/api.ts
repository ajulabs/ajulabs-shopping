// Camada de API do painel admin. Fala com o mesmo backend dos apps.
// A URL vem de VITE_API_URL; em dev cai no localhost padrão do backend.
const API_URL = (import.meta.env.VITE_API_URL as string) || 'http://localhost:3000/v1';

const TOKEN_KEY = 'ajulabs_admin_token';

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}
export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}
export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });
  if (res.status === 401) {
    clearToken();
    throw new Error('Sessão expirada. Entre novamente.');
  }
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(typeof body.error === 'string' ? body.error : 'Erro na requisição.');
  }
  return res.json() as Promise<T>;
}

export interface FotoPendente {
  id: string;
  nome: string;
  fotoPendenteUrl: string;
  enviadaEm: string;
}

export const api = {
  // Login do admin de plataforma
  login: async (email: string, senha: string): Promise<{ token: string; nome: string }> => {
    const res = await fetch(`${API_URL}/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, senha }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(typeof body.error === 'string' ? body.error : 'Não foi possível entrar.');
    }
    const data = await res.json();
    return { token: data.token, nome: data.admin?.nome ?? 'Admin' };
  },

  listarFotosPendentes: () => request<{ fotos: FotoPendente[] }>('/admin/fotos/pendentes'),

  aprovarFoto: (id: string) =>
    request<{ ok: true }>(`/admin/fotos/${id}/aprovar`, { method: 'POST' }),

  rejeitarFoto: (id: string) =>
    request<{ ok: true }>(`/admin/fotos/${id}/rejeitar`, { method: 'POST' }),
};
