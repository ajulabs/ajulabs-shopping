import type { Order, OrderStatus } from './types';

export const ORDER_STATUS_MAP: Record<string, OrderStatus> = {
  aguardando: 'novo',
  confirmado: 'preparando',
  preparando: 'preparando',
  pronto: 'pronto',
  saiu_entrega: 'despachado',
  entregue: 'despachado',
  cancelado: 'despachado',
};

export const STATUS_META: Record<
  OrderStatus,
  { label: string; color: string; bg: string; next: string | null }
> = {
  novo: { label: 'Novo', color: '#DE6708', bg: '#FFF0E6', next: 'Aceitar e preparar' },
  preparando: { label: 'Preparando', color: '#0B6FAE', bg: '#E6F4FC', next: 'Marcar como pronto' },
  pronto: { label: 'Aguardando motoboy', color: '#7C3AED', bg: '#EDE9FE', next: null },
  despachado: { label: 'Despachado', color: '#046C2E', bg: '#E6F7ED', next: null },
};

export const FLOW: OrderStatus[] = ['novo', 'preparando', 'pronto', 'despachado'];

export const PEDIDOS_MOCK: Order[] = [];

export const MOTIVOS_CANCELAMENTO = [
  { value: 'item_esgotado', label: 'Item esgotado' },
  { value: 'problema_cozinha', label: 'Problema com estoque/produtos' },
  { value: 'horario_encerramento', label: 'Horário de encerramento' },
  { value: 'outro', label: 'Outro motivo' },
] as const;
