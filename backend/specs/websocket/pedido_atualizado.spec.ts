import type { WebSocketSpec } from '../types';

export const pedidoAtualizadoWsSpec = {
  name: 'ws_pedido_atualizado',
  event: 'pedido:atualizado',
  direction: 'server→client',
  description: 'Emitido para o consumidor (e opcionalmente lojista) quando o status de um pedido muda.',
  room: 'usuario:{consumidorId} e loja:{lojaId} (quando lojaId fornecido)',

  payload: {
    pedidoId: 'uuid',
    status: "enum: 'confirmado' | 'em_preparo' | 'pronto' | 'saiu_entrega' | 'entregue' | 'cancelado'",
  },

  examples: [
    {
      description: 'Pedido confirmado pelo lojista',
      payload: { pedidoId: 'ped_abc123', status: 'confirmado' },
    },
    {
      description: 'Pedido saiu para entrega — entregador aceitou corrida',
      payload: { pedidoId: 'ped_abc123', status: 'saiu_entrega' },
    },
    {
      description: 'Pedido entregue — confirmação do código',
      payload: { pedidoId: 'ped_abc123', status: 'entregue' },
    },
  ],

  preconditions: [
    'Consumidor conectado via socket e na sala usuario:{consumidorId}',
    'Disparado por: PATCH /lojista/pedidos/:id/status ou aceitar/confirmar corrida',
  ],

  sideEffects: [],
} satisfies WebSocketSpec;
