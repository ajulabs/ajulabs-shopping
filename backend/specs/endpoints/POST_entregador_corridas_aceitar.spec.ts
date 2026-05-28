import type { EndpointSpec } from '../types';

export const postEntregadorCorridaAceitarSpec = {
  name: 'POST_entregador_corridas_pedidoId_aceitar',
  method: 'POST',
  path: '/entregador/corridas/:pedidoId/aceitar',
  description: 'Entregador aceita uma oferta de corrida. Associa o entregador ao pedido e notifica consumidor e lojista.',
  auth: 'entregador',

  preconditions: [
    'Entregador autenticado',
    'Entregador está online',
    'Pedido em status "pronto" (aguardando entregador)',
    'Entregador não possui outra corrida ativa',
  ],

  input: {
    pedidoId: { type: 'string', required: true, constraints: ['uuid — path param'] },
  },

  output: {
    pedido: {
      id: 'uuid',
      status: 'string',
      codigoEntrega: 'string (4 dígitos)',
      loja: { nome: 'string', endereco: 'object', telefone: 'string' },
      enderecoEntrega: { rua: 'string', numero: 'string', bairro: 'string', cidade: 'string' },
      consumidor: { nome: 'string', telefone: 'string' },
    },
  },

  examples: [
    {
      description: 'Entregador aceita corrida de motoboy',
      input: { pedidoId: 'ped_abc123' },
      output: {
        pedido: {
          id: 'ped_abc123',
          status: 'saiu_entrega',
          codigoEntrega: '8888',
          loja: { nome: 'SportCenter Aracaju', endereco: { rua: 'Av. Beira Mar', numero: '500', bairro: 'Atalaia' }, telefone: '+5579988887777' },
          enderecoEntrega: { rua: 'Rua das Flores', numero: '100', bairro: 'Salgado', cidade: 'Aracaju' },
          consumidor: { nome: 'Maria Silva', telefone: '+5579999998888' },
        },
      },
    },
    {
      description: 'Pedido já aceito por outro entregador',
      input: { pedidoId: 'ped_ja_aceito' },
      output: { error: 'Corrida não disponível' },
    },
  ],

  errors: [
    { code: 'UNAUTHORIZED', statusCode: 401, message: 'Entregador não autenticado' },
    { code: 'CORRIDA_INDISPONIVEL', statusCode: 400, message: 'Corrida não disponível ou já aceita' },
    { code: 'ENTREGADOR_OFFLINE', statusCode: 400, message: 'Entregador precisa estar online' },
    { code: 'SERVER_ERROR', statusCode: 500, message: 'Erro ao aceitar corrida' },
  ],

  sideEffects: [
    'Associa entregadorId ao Pedido',
    'Atualiza Pedido.status para "saiu_entrega"',
    'Cria registro em HistoricoPedido',
    'Emite WebSocket pedido:atualizado para consumidor e loja',
    'Inicializa entrada na cache _localizacoes para o pedido',
  ],
} satisfies EndpointSpec;
