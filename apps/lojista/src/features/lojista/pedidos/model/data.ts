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
  saiu_entrega: 'pronto',
  entregue:     'despachado',
  cancelado:    'despachado',
};

export const STATUS_META: Record<OrderStatus, { label: string; color: string; bg: string; next: string | null }> = {
  novo:       { label: 'Novo',        color: '#DE6708', bg: '#FFF0E6', next: 'Aceitar e preparar' },
  preparando: { label: 'Preparando',  color: '#0B6FAE', bg: '#E6F4FC', next: 'Marcar como pronto' },
  pronto:     { label: 'Pronto',      color: '#17258E', bg: '#EAECF9', next: 'Despachar motoboy' },
  despachado: { label: 'Despachado',  color: '#046C2E', bg: '#E6F7ED', next: null },
};

export const FLOW: OrderStatus[] = ['novo', 'preparando', 'pronto', 'despachado'];

export const PEDIDOS_MOCK: Order[] = [];
