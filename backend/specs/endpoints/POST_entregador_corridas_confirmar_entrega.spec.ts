import type { EndpointSpec } from '../types';

export const postEntregadorConfirmarEntregaSpec = {
  name: 'POST_entregador_corridas_pedidoId_confirmar_entrega',
  method: 'POST',
  path: '/entregador/corridas/:pedidoId/confirmar-entrega',
  description: 'Entregador confirma entrega usando o código de 4 dígitos fornecido pelo consumidor. Conclui a corrida.',
  auth: 'entregador',

  preconditions: [
    'Entregador autenticado',
    'Pedido está em status "saiu_entrega"',
    'Pedido está associado ao entregador autenticado',
  ],

  input: {
    pedidoId: { type: 'string', required: true, constraints: ['uuid — path param'] },
    codigo: { type: 'string', required: true, constraints: ['min 1 caractere', '4 dígitos que correspondem ao codigoEntrega do pedido'] },
  },

  output: {
    ok: { type: 'boolean', description: 'true em caso de sucesso' },
  },

  examples: [
    {
      description: 'Código correto — entrega confirmada',
      input: { pedidoId: 'ped_abc123', codigo: '8888' },
      output: { ok: true },
    },
    {
      description: 'Código incorreto — rejeitado',
      input: { pedidoId: 'ped_abc123', codigo: '1234' },
      output: { error: 'Código de entrega inválido' },
    },
  ],

  errors: [
    { code: 'UNAUTHORIZED', statusCode: 401, message: 'Entregador não autenticado' },
    { code: 'INVALID_CODE', statusCode: 400, message: 'Código de entrega inválido' },
    { code: 'PEDIDO_NAO_ENCONTRADO', statusCode: 404, message: 'Pedido não encontrado' },
    { code: 'SERVER_ERROR', statusCode: 500, message: 'Erro ao confirmar entrega' },
  ],

  sideEffects: [
    'Atualiza Pedido.status para "entregue"',
    'Cria registro em HistoricoPedido',
    'Emite WebSocket pedido:atualizado para consumidor e loja',
    'Registra ganho do entregador',
    'Remove entrada da cache _localizacoes',
  ],
} satisfies EndpointSpec;
