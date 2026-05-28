import type { WebSocketSpec } from '../types';

export const ticketStatusWsSpec = {
  name: 'ws_ticket_status',
  event: 'ticket:status',
  direction: 'server→client',
  description: 'Emitido para o consumidor quando o status do ticket muda (ex: lojista resolve ou cancela).',
  room: 'usuario:{consumidorId}',

  payload: {
    ticketId: 'uuid',
    status: "enum: 'aberto' | 'em_andamento' | 'resolvido' | 'cancelado'",
  },

  examples: [
    {
      description: 'Lojista marcou ticket como resolvido',
      payload: { ticketId: 'tkt_abc123', status: 'resolvido' },
    },
    {
      description: 'Lojista colocou ticket em andamento',
      payload: { ticketId: 'tkt_abc123', status: 'em_andamento' },
    },
    {
      description: 'Consumidor cancelou o próprio ticket',
      payload: { ticketId: 'tkt_abc123', status: 'cancelado' },
    },
  ],

  preconditions: [
    'Consumidor conectado via socket na sala usuario:{consumidorId}',
    'Disparado por: PATCH /lojista/tickets/:id/status ou DELETE /tickets/:id',
  ],

  sideEffects: [],
} satisfies WebSocketSpec;
