import type { Order } from '../lib';

export const STEPS = [
  { id: 'alocado', label: 'Entregador alocado' },
  { id: 'retirada', label: 'Retirada na loja' },
  { id: 'entregando', label: 'Saiu para entrega' },
];

// Deriva em qual etapa o pedido está a partir do estado REAL:
// - sem entregador (status pronto)      → -1 (procurando)
// - entregador alocado (status pronto)  →  0 (aguardando retirada)
// - despachado (saiu para entrega)      →  2
function stepIndexFromOrder(order: Order): number {
  if (order.status === 'entregue') return STEPS.length; // todas as etapas concluídas
  if (order.status === 'despachado') return 2;
  if (order.entregadorId) return 0;
  return -1;
}

export function iniciais(nome?: string): string {
  if (!nome) return '–';
  return nome
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

export function useDeliveryTracking(order?: Order | null) {
  if (!order) {
    return { stepIdx: -1, procurando: true, steps: STEPS };
  }
  const stepIdx = stepIndexFromOrder(order);
  const procurando = stepIdx === -1;
  return { stepIdx, procurando, steps: STEPS };
}
