export type OrderStatus = 'novo' | 'preparando' | 'pronto' | 'despachado';

export interface OrderItem {
  nome: string;
  qtd: number;
  preco: number;
}

export interface Order {
  id: string;
  _id?: string;
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

export const ORDER_STATUS_MAP: Record<string, OrderStatus> = {
  aguardando:   'novo',
  confirmado:   'preparando',
  preparando:   'preparando',
  pronto:       'pronto',
  saiu_entrega: 'despachado',
  entregue:     'despachado',
  cancelado:    'despachado',
};

export const STATUS_META: Record<OrderStatus, { label: string; color: string; bg: string; next: string | null }> = {
  novo:       { label: 'Novo',               color: '#DE6708', bg: '#FFF0E6', next: 'Aceitar e preparar' },
  preparando: { label: 'Preparando',         color: '#0B6FAE', bg: '#E6F4FC', next: 'Marcar como pronto' },
  pronto:     { label: 'Aguardando motoboy', color: '#7C3AED', bg: '#EDE9FE', next: null },
  despachado: { label: 'Despachado',         color: '#046C2E', bg: '#E6F7ED', next: null },
};

export const FLOW: OrderStatus[] = ['novo', 'preparando', 'pronto', 'despachado'];

export const PEDIDOS_MOCK: Order[] = [];
