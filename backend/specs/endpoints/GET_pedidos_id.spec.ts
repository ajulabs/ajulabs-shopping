import type { EndpointSpec } from '../types';

export const getPedidoByIdSpec = {
  name: 'GET_pedidos_id',
  method: 'GET',
  path: '/pedidos/:id',
  description: 'Retorna detalhes completos de um pedido específico do consumidor autenticado.',
  auth: 'usuario',

  preconditions: [
    'Usuário autenticado como consumidor',
    'Pedido pertence ao consumidor autenticado',
  ],

  input: {
    id: { type: 'string', required: true, constraints: ['uuid — path param'] },
  },

  output: {
    pedido: {
      id: 'uuid',
      status: 'string',
      subtotal: 'number',
      taxaEntrega: 'number',
      desconto: 'number',
      total: 'number',
      metodoPagamento: "'pix' | 'cartao'",
      obs: 'string | null',
      codigoEntrega: 'string (4 dígitos)',
      estimativaEntrega: 'ISO datetime | null',
      criadoEm: 'ISO datetime',
      loja: { id: 'uuid', nome: 'string', telefone: 'string', logoUrl: 'string | null' },
      itens: [{ id: 'uuid', nomeSnapshot: 'string', quantidade: 'number', precoUnitario: 'number', variacaoNome: 'string | null', produto: 'object' }],
      historico: [{ id: 'uuid', status: 'string', criadoEm: 'ISO datetime' }],
      enderecoEntrega: { rua: 'string', numero: 'string', bairro: 'string', cidade: 'string', cep: 'string' },
      entregador: 'null | { id: uuid, nome: string, fotoUrl: string | null, tipoTransporte: string }',
    },
  },

  examples: [
    {
      description: 'Pedido em trânsito com entregador designado',
      input: { id: 'ped_abc123' },
      output: {
        pedido: {
          id: 'ped_abc123',
          status: 'saiu_entrega',
          subtotal: 189.8,
          taxaEntrega: 5.0,
          desconto: 9.49,
          total: 185.31,
          metodoPagamento: 'pix',
          obs: null,
          codigoEntrega: '8888',
          estimativaEntrega: '2026-05-27T15:00:00Z',
          criadoEm: '2026-05-27T14:30:00Z',
          loja: { id: 'loja_xyz', nome: 'SportCenter Aracaju', telefone: '+5579988887777', logoUrl: null },
          itens: [{ id: 'item_1', nomeSnapshot: 'Camiseta Básica', quantidade: 1, precoUnitario: 39.9, variacaoNome: 'M', produto: { id: 'prod_camiseta', imagemUrl: 'https://...' } }],
          historico: [{ id: 'hist_1', status: 'aguardando', criadoEm: '2026-05-27T14:30:00Z' }],
          enderecoEntrega: { rua: 'Rua das Flores', numero: '100', bairro: 'Salgado', cidade: 'Aracaju', cep: '49000010' },
          entregador: { id: 'ent_abc', nome: 'Pedro Lima', fotoUrl: null, tipoTransporte: 'moto' },
        },
      },
    },
    {
      description: 'Pedido pertence a outro consumidor',
      input: { id: 'ped_de_outro' },
      output: { error: 'Acesso negado' },
    },
    {
      description: 'Pedido não encontrado',
      input: { id: 'ped_inexistente' },
      output: { error: 'Pedido não encontrado' },
    },
  ],

  errors: [
    { code: 'UNAUTHORIZED', statusCode: 401, message: 'Usuário não autenticado' },
    { code: 'NOT_FOUND', statusCode: 404, message: 'Pedido não encontrado' },
    { code: 'FORBIDDEN', statusCode: 403, message: 'Acesso negado — pedido pertence a outro usuário' },
    { code: 'SERVER_ERROR', statusCode: 500, message: 'Erro ao buscar pedido' },
  ],

  sideEffects: [],
} satisfies EndpointSpec;
