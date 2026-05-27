import type { EndpointSpec } from '../types';

export const postTicketMensagemSpec = {
  name: 'POST_tickets_id_mensagens',
  method: 'POST',
  path: '/tickets/:id/mensagens',
  description: 'Consumidor envia follow-up em ticket existente. Emite WebSocket para o lojista.',
  auth: 'usuario',

  preconditions: [
    'Usuário autenticado como consumidor',
    'Ticket pertence ao consumidor autenticado',
    'Status do ticket não é "cancelado" nem "resolvido"',
  ],

  input: {
    id: { type: 'string', required: true, constraints: ['uuid — path param'] },
    texto: { type: 'string', required: true, constraints: ['min 1 caractere (trim)'] },
  },

  output: {
    mensagem: {
      id: 'uuid',
      ticketId: 'uuid',
      remetente: "'consumidor'",
      texto: 'string',
      criadoEm: 'ISO datetime',
    },
  },

  examples: [
    {
      description: 'Consumidor envia follow-up com nova informação',
      input: { id: 'tkt_abc123', texto: 'Tenho a foto do produto danificado, como envio?' },
      output: {
        mensagem: {
          id: 'msg_abc456',
          ticketId: 'tkt_abc123',
          remetente: 'consumidor',
          texto: 'Tenho a foto do produto danificado, como envio?',
          criadoEm: '2026-05-27T11:00:00Z',
        },
      },
    },
    {
      description: 'Tentativa de envio em ticket já resolvido',
      input: { id: 'tkt_resolvido', texto: 'Mais uma dúvida' },
      output: { error: 'Não é possível enviar mensagem em ticket finalizado' },
    },
    {
      description: 'Texto vazio',
      input: { id: 'tkt_abc123', texto: '   ' },
      output: { error: 'Texto obrigatório' },
    },
  ],

  errors: [
    { code: 'UNAUTHORIZED', statusCode: 401, message: 'Usuário não autenticado' },
    { code: 'NOT_FOUND', statusCode: 404, message: 'Ticket não encontrado' },
    { code: 'TICKET_FINALIZADO', statusCode: 400, message: 'Não é possível enviar mensagem em ticket finalizado' },
    { code: 'TEXTO_VAZIO', statusCode: 400, message: 'Texto obrigatório' },
    { code: 'SERVER_ERROR', statusCode: 500, message: 'Erro ao enviar mensagem' },
  ],

  sideEffects: [
    'Cria registro em TicketMensagem com remetente "consumidor"',
    'Emite WebSocket ticket:mensagem para sala loja:{lojaId}',
  ],
} satisfies EndpointSpec;
