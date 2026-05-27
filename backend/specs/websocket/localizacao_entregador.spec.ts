import type { WebSocketSpec } from '../types';

export const localizacaoEntregadorWsSpec = {
  name: 'ws_localizacao_entregador',
  event: 'localizacao:entregador',
  direction: 'server→client',
  description: 'Emitido para o consumidor (e lojista) com a posição GPS atualizada do entregador durante a entrega.',
  room: 'usuario:{consumidorId} e loja:{lojaId}',

  payload: {
    pedidoId: 'uuid',
    lat: 'number (-90..90)',
    lng: 'number (-180..180)',
    heading: 'number | undefined — direção em graus (0-360)',
    speedKmh: 'number | undefined — velocidade em km/h',
  },

  examples: [
    {
      description: 'Entregador a 200m do endereço de entrega',
      payload: {
        pedidoId: 'ped_abc123',
        lat: -10.9720,
        lng: -37.0480,
        heading: 45,
        speedKmh: 30,
      },
    },
    {
      description: 'Posição sem dados de velocidade/direção (modo básico)',
      payload: {
        pedidoId: 'ped_def456',
        lat: -10.9167,
        lng: -37.0500,
        heading: undefined,
        speedKmh: undefined,
      },
    },
  ],

  preconditions: [
    'Corrida ativa (pedido em status "saiu_entrega")',
    'Entregador enviando localizacao:update via socket ou POST /entregador/corridas/:id/localizacao',
  ],

  sideEffects: [
    'Posição armazenada em cache _localizacoes (Map em memória)',
  ],
} satisfies WebSocketSpec;
