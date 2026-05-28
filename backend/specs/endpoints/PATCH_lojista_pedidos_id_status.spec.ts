import type { EndpointSpec } from '../types';

export const patchLojistasPedidoStatusSpec = {
  name: 'PATCH_lojista_pedidos_id_status',
  method: 'PATCH',
  path: '/lojista/pedidos/:id/status',
  description: 'Avança o status do pedido para o próximo estado na sequência. Emite WebSocket pedido:atualizado e oferta de corrida para entregadores.',
  auth: 'lojista',

  preconditions: [
    'Lojista autenticado',
    'Pedido pertence a uma loja do lojista autenticado',
    'Pedido não está em status terminal (entregue ou cancelado)',
  ],

  input: {
    id: { type: 'string', required: true, constraints: ['uuid — path param'] },
  },

  output: {
    pedido: {
      id: 'uuid',
      status: "enum: 'confirmado' | 'em_preparo' | 'pronto' | 'saiu_entrega' | 'entregue' | 'cancelado'",
      atualizadoEm: 'ISO datetime',
    },
  },

  examples: [
    {
      description: 'Lojista confirma pedido aguardando → confirmado',
      input: { id: 'ped_abc123' },
      output: { pedido: { id: 'ped_abc123', status: 'confirmado', atualizadoEm: '2026-05-27T14:35:00Z' } },
    },
    {
      description: 'Lojista avança para em_preparo → pronto (dispara oferta de corrida)',
      input: { id: 'ped_abc123' },
      output: { pedido: { id: 'ped_abc123', status: 'pronto', atualizadoEm: '2026-05-27T14:50:00Z' } },
    },
    {
      description: 'Pedido já entregue — não pode avançar',
      input: { id: 'ped_entregue' },
      output: { error: 'Pedido já está em status terminal' },
    },
  ],

  errors: [
    { code: 'UNAUTHORIZED', statusCode: 401, message: 'Lojista não autenticado' },
    { code: 'FORBIDDEN', statusCode: 403, message: 'Pedido não pertence ao lojista' },
    { code: 'STATUS_TERMINAL', statusCode: 400, message: 'Pedido já está em status terminal' },
    { code: 'SERVER_ERROR', statusCode: 500, message: 'Erro ao atualizar status' },
  ],

  sideEffects: [
    'Atualiza Pedido.status',
    'Cria registro em HistoricoPedido',
    'Emite WebSocket pedido:atualizado para consumidor e loja',
    'Se status = "pronto": emite corrida:oferta para todos os entregadores disponíveis',
  ],
} satisfies EndpointSpec;
