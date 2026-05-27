import type { WebSocketSpec } from '../types';

export const pedidoNovoWsSpec = {
  name: 'ws_pedido_novo',
  event: 'pedido:novo',
  direction: 'server→client',
  description: 'Emitido para o lojista quando um novo pedido é criado pelo consumidor. O lojista deve confirmar ou cancelar.',
  room: 'loja:{lojaId}',

  payload: {
    id: 'uuid — ID do pedido',
    total: 'number (R$)',
    itens: [{ nome: 'string — nomeSnapshot', quantidade: 'number' }],
    criadoEm: 'ISO datetime',
  },

  examples: [
    {
      description: 'Novo pedido de 2 itens chegou para a loja SportCenter',
      payload: {
        id: 'ped_abc123',
        total: 185.31,
        itens: [
          { nome: 'Camiseta Básica', quantidade: 1 },
          { nome: 'Meia Esportiva', quantidade: 2 },
        ],
        criadoEm: '2026-05-27T14:30:00Z',
      },
    },
    {
      description: 'Pedido de salgados — 1 item',
      payload: {
        id: 'ped_def456',
        total: 28.0,
        itens: [{ nome: 'Coxinha Catupiry (6 unid)', quantidade: 1 }],
        criadoEm: '2026-05-27T15:00:00Z',
      },
    },
  ],

  preconditions: [
    'Lojista conectado via socket e na sala loja:{lojaId}',
    'POST /pedidos executado com sucesso',
  ],

  sideEffects: [
    'Nenhum efeito colateral — apenas notificação em tempo real',
    'Push notification disparado em paralelo via notificarPedidoNovo()',
  ],
} satisfies WebSocketSpec;
