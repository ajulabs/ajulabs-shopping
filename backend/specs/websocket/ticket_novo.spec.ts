import type { WebSocketSpec } from '../types';

export const ticketNovoWsSpec = {
  name: 'ws_ticket_novo',
  event: 'ticket:novo',
  direction: 'server→client',
  description: 'Emitido para o lojista quando um novo ticket de suporte é aberto por um consumidor.',
  room: 'loja:{lojaId}',

  payload: {
    id: 'uuid',
    status: "'aberto'",
    urgente: 'boolean',
    motivo: 'string',
    consumidorId: 'uuid',
    pedidoId: 'uuid | null',
    criadoEm: 'ISO datetime',
  },

  examples: [
    {
      description: 'Consumidor abriu ticket por produto danificado',
      payload: {
        id: 'tkt_abc123',
        status: 'aberto',
        urgente: false,
        motivo: 'Produto chegou amassado e com embalagem rasgada',
        consumidorId: 'usr_abc123',
        pedidoId: 'ped_abc123',
        criadoEm: '2026-05-27T10:00:00Z',
      },
    },
    {
      description: 'Ticket sem pedido associado',
      payload: {
        id: 'tkt_def456',
        status: 'aberto',
        urgente: false,
        motivo: 'Cobrança duplicada no cartão',
        consumidorId: 'usr_def456',
        pedidoId: null,
        criadoEm: '2026-05-27T10:05:00Z',
      },
    },
  ],

  preconditions: [
    'Lojista conectado via socket na sala loja:{lojaId}',
    'Ticket criado via tool criar_ticket ou endpoint POST /tickets (se existir)',
  ],

  sideEffects: [],
} satisfies WebSocketSpec;
