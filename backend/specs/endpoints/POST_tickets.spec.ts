import type { EndpointSpec } from '../types';

export const postTicketsSpec = {
  name: 'POST_tickets',
  method: 'GET',
  path: '/tickets',
  description: 'Lista todos os tickets de suporte do consumidor autenticado. Filtro opcional por status.',
  auth: 'usuario',

  preconditions: [
    'Usuário autenticado como consumidor',
  ],

  input: {
    status: { type: 'string', required: false, constraints: ["query param — 'aberto' | 'em_andamento' | 'resolvido' | 'cancelado'"] },
  },

  output: {
    tickets: [
      {
        id: 'uuid',
        status: "enum: 'aberto' | 'em_andamento' | 'resolvido' | 'cancelado'",
        urgente: 'boolean',
        criadoEm: 'ISO datetime',
        loja: { nome: 'string' },
        pedido: { id: 'uuid', total: 'number', criadoEm: 'ISO datetime', itens: [{ nomeSnapshot: 'string', quantidade: 'number' }] },
        mensagens: [{ id: 'uuid', remetente: "'consumidor' | 'lojista'", texto: 'string', criadoEm: 'ISO datetime' }],
      },
    ],
  },

  examples: [
    {
      description: 'Consumidor com 1 ticket aberto',
      input: {},
      output: {
        tickets: [
          {
            id: 'tkt_abc123',
            status: 'aberto',
            urgente: false,
            criadoEm: '2026-05-27T10:00:00Z',
            loja: { nome: 'SportCenter Aracaju' },
            pedido: { id: 'ped_abc123', total: 185.31, criadoEm: '2026-05-25T14:00:00Z', itens: [{ nomeSnapshot: 'Camiseta Básica', quantidade: 1 }] },
            mensagens: [{ id: 'msg_1', remetente: 'consumidor', texto: 'Produto chegou errado', criadoEm: '2026-05-27T10:00:00Z' }],
          },
        ],
      },
    },
    {
      description: 'Filtro por status resolvido',
      input: { status: 'resolvido' },
      output: { tickets: [] },
    },
  ],

  errors: [
    { code: 'UNAUTHORIZED', statusCode: 401, message: 'Usuário não autenticado' },
    { code: 'SERVER_ERROR', statusCode: 500, message: 'Erro ao buscar tickets' },
  ],

  sideEffects: [],
} satisfies EndpointSpec;
