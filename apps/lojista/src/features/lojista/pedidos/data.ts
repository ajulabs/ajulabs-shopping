export type OrderStatus = 'novo' | 'preparando' | 'pronto' | 'despachado';

export interface OrderItem {
  nome: string;
  qtd: number;
  preco: number;
}

export interface Order {
  id: string;
  status: OrderStatus;
  cliente: string;
  endereco: string;
  distancia: string;
  hora: string;
  itens: OrderItem[];
  obs?: string;
  total: number;
  motoboy?: string;
}

export const STATUS_META: Record<OrderStatus, { label: string; color: string; bg: string; next: string | null }> = {
  novo:       { label: 'Novo',        color: '#DE6708', bg: '#FFF0E6', next: 'Aceitar e preparar' },
  preparando: { label: 'Preparando',  color: '#0B6FAE', bg: '#E6F4FC', next: 'Marcar como pronto' },
  pronto:     { label: 'Pronto',      color: '#17258E', bg: '#EAECF9', next: 'Despachar motoboy' },
  despachado: { label: 'Despachado',  color: '#046C2E', bg: '#E6F7ED', next: null },
};

export const FLOW: OrderStatus[] = ['novo', 'preparando', 'pronto', 'despachado'];

export const PEDIDOS_MOCK: Order[] = [
  {
    id: '#SD-8841', status: 'novo', cliente: 'Mariana S.', distancia: '2,1 km',
    endereco: 'R. Laranjeiras, 412 · Apto 302\nAtalaia, Aracaju · deixar na portaria',
    hora: '14:32', total: 229.70,
    obs: 'Embrulhar para presente, por favor 🎁',
    itens: [
      { nome: 'Tênis Runner Preto — 41', qtd: 1, preco: 189.90 },
      { nome: 'Meia cano alto', qtd: 2, preco: 19.90 },
    ],
  },
  {
    id: '#SD-8840', status: 'preparando', cliente: 'João P.', distancia: '4,8 km',
    endereco: 'Av. Beira Mar, 1280\nCoroa do Meio, Aracaju',
    hora: '14:18', total: 219.00,
    itens: [{ nome: 'Chuteira Society — 42', qtd: 1, preco: 219.00 }],
  },
  {
    id: '#SD-8839', status: 'pronto', cliente: 'Carla M.', distancia: '3,2 km',
    endereco: 'R. Laranjeiras, 412 · Apto 302\nAtalaia, Aracaju · deixar na portaria',
    hora: '14:04', total: 159.90,
    itens: [{ nome: 'Tênis Casual Branco — 38', qtd: 1, preco: 159.90 }],
  },
  {
    id: '#SD-8838', status: 'despachado', cliente: 'Rafael T.', distancia: '5,1 km',
    endereco: 'Cond. Vista do Mar, Atalaia',
    hora: '13:50', total: 79.90,
    motoboy: 'Edson (placa ABC-1234)',
    itens: [{ nome: 'Sandália Papete — 42', qtd: 1, preco: 79.90 }],
  },
];