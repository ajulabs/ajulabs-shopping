import type { EndpointSpec } from '../types';

export const getPedidosSpec = {
  name: 'GET_pedidos',
  method: 'GET',
  path: '/pedidos',
  description: 'Lista todos os pedidos do consumidor autenticado, do mais recente ao mais antigo.',
  auth: 'usuario',

  preconditions: [
    'Usuário autenticado como consumidor',
  ],

  input: {},

  output: {
    pedidos: {
      type: 'array',
      items: {
        id: 'uuid',
        status: "enum: 'aguardando' | 'confirmado' | 'em_preparo' | 'saiu_entrega' | 'entregue' | 'cancelado'",
        total: 'number (R$)',
        criadoEm: 'ISO datetime',
        loja: { id: 'uuid', nome: 'string', logoUrl: 'string | null' },
        itens: [{ id: 'uuid', nomeSnapshot: 'string', quantidade: 'number', precoUnitario: 'number', variacaoNome: 'string | null' }],
        historico: [{ status: 'string', criadoEm: 'ISO datetime' }],
      },
    },
  },

  examples: [
    {
      description: 'Consumidor com 2 pedidos (1 em andamento, 1 entregue)',
      input: {},
      output: {
        pedidos: [
          { id: 'ped_abc123', status: 'em_preparo', total: 185.31, criadoEm: '2026-05-27T14:30:00Z', loja: { id: 'loja_xyz', nome: 'SportCenter Aracaju', logoUrl: null }, itens: [{ id: 'item_1', nomeSnapshot: 'Camiseta Básica', quantidade: 1, precoUnitario: 39.9, variacaoNome: 'M' }], historico: [{ status: 'aguardando', criadoEm: '2026-05-27T14:30:00Z' }, { status: 'confirmado', criadoEm: '2026-05-27T14:35:00Z' }] },
          { id: 'ped_def456', status: 'entregue', total: 28.0, criadoEm: '2026-05-25T10:00:00Z', loja: { id: 'loja_salgados', nome: 'Salgaderia do Zé', logoUrl: null }, itens: [], historico: [] },
        ],
      },
    },
    {
      description: 'Consumidor sem pedidos',
      input: {},
      output: { pedidos: [] },
    },
  ],

  errors: [
    { code: 'UNAUTHORIZED', statusCode: 401, message: 'Usuário não autenticado' },
    { code: 'SERVER_ERROR', statusCode: 500, message: 'Erro ao buscar pedidos' },
  ],

  sideEffects: [],
} satisfies EndpointSpec;
