import { STATUS_META, type Order } from '../lib';

// OrderDetail é derivada do `order` recebido (a lista é a fonte da verdade
// em usePedidos). Este hook concentra os valores calculados da tela.
export function useOrderDetail(order: Order) {
  const baseMeta = STATUS_META[order.status];
  const isEntregadorAcaminho = order.status === 'pronto' && !!order.entregadorId;
  const meta = isEntregadorAcaminho
    ? { ...baseMeta, label: 'Entregador a caminho', color: '#0369A1', bg: '#E0F2FE' }
    : baseMeta;

  const initials = order.cliente
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2);

  const statusIcon: Record<string, any> = {
    novo: 'time-outline',
    preparando: 'time-outline',
    pronto: isEntregadorAcaminho ? 'bicycle' : 'checkmark',
    despachado: 'bicycle',
  };

  const statusSubtitle: Record<string, string> = {
    novo: 'Aceite pra começar a preparar',
    preparando: 'Marque como pronto quando terminar',
    pronto: isEntregadorAcaminho
      ? `${order.entregadorNome ? order.entregadorNome + ' · a' : 'A'} caminho do cliente`
      : 'Chame um motoboy pra despachar',
    despachado: `Com ${order.motoboy || 'motoboy'} · a caminho do cliente`,
  };

  return { meta, initials, statusIcon, statusSubtitle };
}
