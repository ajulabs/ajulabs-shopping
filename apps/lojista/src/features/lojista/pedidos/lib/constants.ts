import type { Order, OrderStatus } from './types';

export const ORDER_STATUS_MAP: Record<string, OrderStatus> = {
  aguardando: 'novo',
  confirmado: 'preparando',
  preparando: 'preparando',
  pronto: 'pronto',
  saiu_entrega: 'despachado',
  entregue: 'entregue',
  cancelado: 'cancelado',
};

export const STATUS_META: Record<
  OrderStatus,
  { label: string; color: string; bg: string; next: string | null }
> = {
  novo: { label: 'Novo', color: '#DE6708', bg: '#FFF0E6', next: 'Aceitar e preparar' },
  preparando: { label: 'Preparando', color: '#0B6FAE', bg: '#E6F4FC', next: 'Marcar como pronto' },
  pronto: { label: 'Aguardando motoboy', color: '#7C3AED', bg: '#EDE9FE', next: null },
  despachado: { label: 'Despachado', color: '#0369A1', bg: '#E0F2FE', next: null },
  entregue: { label: 'Entrega concluída', color: '#046C2E', bg: '#E6F7ED', next: null },
  cancelado: { label: 'Cancelado', color: '#9B1C1C', bg: '#FCEBEB', next: null },
};

// Variante escura: no dark o fundo pastel "estoura" sobre a superfície escura e o
// texto saturado perde contraste. Trocamos por um tint translúcido da própria cor
// (deixa o badge integrado ao card) e por um texto/ícone mais claro e legível.
const STATUS_DARK: Record<OrderStatus, { color: string; bg: string }> = {
  novo: { color: '#FDBA74', bg: 'rgba(222,103,8,0.20)' },
  preparando: { color: '#7DD3FC', bg: 'rgba(11,111,174,0.22)' },
  pronto: { color: '#C4B5FD', bg: 'rgba(124,58,237,0.24)' },
  despachado: { color: '#67E8F9', bg: 'rgba(3,105,161,0.22)' },
  entregue: { color: '#6EE7B7', bg: 'rgba(4,108,46,0.26)' },
  cancelado: { color: '#FCA5A5', bg: 'rgba(155,28,28,0.26)' },
};

// Realce "A caminho" (pedido pronto com entregador já designado) — cor própria,
// distinta do roxo de "Aguardando motoboy".
const CAMINHO_META = {
  light: { color: '#0369A1', bg: '#E0F2FE' },
  dark: { color: '#67E8F9', bg: 'rgba(3,105,161,0.22)' },
};

/** Cores do status sensíveis ao tema (label/next não mudam). */
export function statusMeta(status: OrderStatus, isDark: boolean) {
  const base = STATUS_META[status];
  return isDark ? { ...base, ...STATUS_DARK[status] } : base;
}

/** Cores do realce "A caminho" sensíveis ao tema. */
export function caminhoMeta(isDark: boolean) {
  return isDark ? CAMINHO_META.dark : CAMINHO_META.light;
}

export const FLOW: OrderStatus[] = ['novo', 'preparando', 'pronto', 'despachado', 'entregue'];

export const PEDIDOS_MOCK: Order[] = [];

export const MOTIVOS_CANCELAMENTO = [
  { value: 'item_esgotado', label: 'Item esgotado' },
  { value: 'problema_cozinha', label: 'Problema com estoque/produtos' },
  { value: 'horario_encerramento', label: 'Horário de encerramento' },
  { value: 'outro', label: 'Outro motivo' },
] as const;
