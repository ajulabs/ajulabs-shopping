import type { WebSocketSpec } from '../types';

export const ticketMensagemWsSpec = {
  name: 'ws_ticket_mensagem',
  event: 'ticket:mensagem',
  direction: 'server→client',
  description: 'Emitido quando uma nova mensagem é enviada em um ticket. Consumidor envia → lojista recebe; Lojista envia → consumidor recebe.',
  room: 'loja:{lojaId} (se remetente = consumidor) | usuario:{consumidorId} (se remetente = lojista)',

  payload: {
    id: 'uuid — ID da mensagem',
    ticketId: 'uuid',
    remetente: "'consumidor' | 'lojista'",
    texto: 'string',
    criadoEm: 'ISO datetime',
  },

  examples: [
    {
      description: 'Consumidor enviou follow-up — lojista recebe',
      payload: {
        id: 'msg_abc456',
        ticketId: 'tkt_abc123',
        remetente: 'consumidor',
        texto: 'Tenho a foto do produto danificado, como envio?',
        criadoEm: '2026-05-27T11:00:00Z',
      },
    },
    {
      description: 'Lojista respondeu — consumidor recebe',
      payload: {
        id: 'msg_def789',
        ticketId: 'tkt_abc123',
        remetente: 'lojista',
        texto: 'Olá! Vamos resolver isso. Pode enviar por WhatsApp: +5579988887777',
        criadoEm: '2026-05-27T11:05:00Z',
      },
    },
  ],

  preconditions: [
    'Ticket existe e está em status ativo (não cancelado/resolvido)',
    'Destinatário conectado na sala correspondente',
  ],

  sideEffects: [
    'Nenhum — apenas notificação',
  ],
} satisfies WebSocketSpec;
