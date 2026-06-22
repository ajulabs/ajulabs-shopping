import type { EndpointSpec } from '../types';

export const postPedidoCancelarSpec = {
  name: 'POST_pedidos_id_cancelar',
  method: 'POST',
  path: '/pedidos/:id/cancelar',
  description:
    'Cancela um pedido do próprio consumidor. Só é permitido enquanto o pedido ' +
    'aguarda confirmação da loja (status "aguardando"). O cancelamento é condicional ' +
    '(TOCTOU-safe): se a loja aceitar o pedido entre a leitura e a escrita, o cancelamento ' +
    'é rejeitado com 409 e o estoque não é restaurado indevidamente.',
  auth: 'usuario',

  preconditions: [
    'Usuário autenticado como consumidor',
    'Pedido existe e pertence ao usuário autenticado',
    'Pedido está com status "aguardando"',
  ],

  input: {
    id: { type: 'string', required: true, constraints: ['uuid', 'path param'] },
    motivo: { type: 'string', required: false, constraints: ['motivo opcional do cancelamento'] },
  },

  output: {
    ok: 'boolean (true quando cancelado)',
  },

  examples: [
    {
      description: 'Cancelamento de pedido ainda aguardando confirmação',
      input: { id: 'ped_abc123', motivo: 'Pedi sem querer' },
      output: { ok: true },
    },
    {
      description: 'Pedido já aceito pela loja — cancelamento rejeitado (corrida TOCTOU)',
      input: { id: 'ped_aceito' },
      output: { error: 'O pedido já foi aceito pela loja e não pode mais ser cancelado.' },
    },
  ],

  errors: [
    { code: 'UNAUTHORIZED', statusCode: 401, message: 'Usuário não autenticado' },
    { code: 'ACESSO_NEGADO', statusCode: 403, message: 'Pedido não existe ou não pertence ao usuário' },
    {
      code: 'STATUS_NAO_CANCELAVEL',
      statusCode: 400,
      message:
        'Cancelamento não permitido. Só é possível cancelar enquanto o pedido aguarda confirmação da loja.',
    },
    {
      code: 'JA_ACEITO',
      statusCode: 409,
      message: 'O pedido já foi aceito pela loja e não pode mais ser cancelado.',
    },
    { code: 'SERVER_ERROR', statusCode: 500, message: 'Erro ao cancelar pedido' },
  ],

  sideEffects: [
    'Atualiza Pedido.status para "cancelado" (condicional: só se status ainda for "aguardando")',
    'Grava Pedido.canceladoPor = "consumidor" e Pedido.motivoCancelamento',
    'Cria registro em HistoricoStatusPedido com status "cancelado"',
    'Restaura o estoque dos itens do pedido (restaurarEstoqueNoCancelamento)',
    'Emite WebSocket pedido:atualizado para usuario:{consumidorId} e loja:{lojaId}',
  ],
} satisfies EndpointSpec;
