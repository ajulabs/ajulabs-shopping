import type { EndpointSpec } from '../types';

export const postPedidoRastrearSpec = {
  name: 'POST_pedidos_id_rastrear',
  method: 'POST',
  path: '/pedidos/:id/rastrear',
  description: 'Retorna dados completos de rastreamento em tempo real de um pedido, incluindo loja, entregador e histórico de status.',
  auth: 'usuario',

  preconditions: [
    'Usuário autenticado como consumidor',
    'Pedido pertence ao consumidor autenticado',
  ],

  input: {
    id: { type: 'string', required: true, constraints: ['uuid — path param'] },
  },

  output: {
    rastreamento: {
      pedidoId: 'uuid',
      status: 'string',
      estimativaEntrega: 'ISO datetime | null',
      historico: [{ status: 'string', criadoEm: 'ISO datetime' }],
      loja: { nome: 'string', telefone: 'string', logoUrl: 'string | null', endereco: 'object' },
      entregador: 'null | { id: uuid, nome: string, telefone: string, fotoUrl: string | null, tipoTransporte: string }',
      enderecoEntrega: { rua: 'string', numero: 'string', bairro: 'string', cidade: 'string', cep: 'string' },
    },
  },

  examples: [
    {
      description: 'Pedido saiu para entrega com entregador rastreável',
      input: { id: 'ped_abc123' },
      output: {
        rastreamento: {
          pedidoId: 'ped_abc123',
          status: 'saiu_entrega',
          estimativaEntrega: '2026-05-27T15:00:00Z',
          historico: [
            { status: 'aguardando', criadoEm: '2026-05-27T14:30:00Z' },
            { status: 'confirmado', criadoEm: '2026-05-27T14:32:00Z' },
            { status: 'saiu_entrega', criadoEm: '2026-05-27T14:50:00Z' },
          ],
          loja: { nome: 'SportCenter Aracaju', telefone: '+5579988887777', logoUrl: null, endereco: { rua: 'Av. Beira Mar', numero: '500', bairro: 'Atalaia' } },
          entregador: { id: 'ent_abc', nome: 'Pedro Lima', telefone: '+5579977775555', fotoUrl: null, tipoTransporte: 'moto' },
          enderecoEntrega: { rua: 'Rua das Flores', numero: '100', bairro: 'Salgado', cidade: 'Aracaju', cep: '49000010' },
        },
      },
    },
  ],

  errors: [
    { code: 'UNAUTHORIZED', statusCode: 401, message: 'Usuário não autenticado' },
    { code: 'NOT_FOUND', statusCode: 404, message: 'Pedido não encontrado' },
    { code: 'FORBIDDEN', statusCode: 403, message: 'Acesso negado' },
    { code: 'SERVER_ERROR', statusCode: 500, message: 'Erro ao buscar rastreamento' },
  ],

  sideEffects: [],
} satisfies EndpointSpec;
