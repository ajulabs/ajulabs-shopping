import { ORDER_STATUS_MAP } from './constants';
import type { Order, OrderStatus } from './types';

export const brl = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export function mapPedidoToOrder(raw: any): Order {
  const status: OrderStatus = ORDER_STATUS_MAP[raw.status as string] ?? 'preparando';
  const entregadorId: string | undefined = raw.entregadorId ?? raw.entregador?.id ?? undefined;
  const entregadorNome: string | undefined = raw.entregador?.nome ?? undefined;
  const total = Number(raw.total ?? 0);
  const hora = raw.criadoEm
    ? new Date(raw.criadoEm).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    : '--:--';
  return {
    id: `#${raw.id.slice(-6).toUpperCase()}`,
    _id: raw.id,
    status,
    cliente: raw.consumidor?.nome ?? 'Cliente',
    endereco: raw.enderecoEntrega
      ? `${raw.enderecoEntrega.rua}, ${raw.enderecoEntrega.numero}\n${raw.enderecoEntrega.bairro}, ${raw.enderecoEntrega.cidade}`
      : '',
    distancia: '–',
    hora,
    total,
    itens: (raw.itens ?? []).map((it: any) => ({
      nome: it.nomeSnapshot ?? it.nome ?? '',
      qtd: it.quantidade ?? 1,
      preco: Number(it.precoUnitario ?? 0),
    })),
    entregadorId,
    entregadorNome,
  };
}
