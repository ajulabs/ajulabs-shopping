import type { WebSocketSpec } from '../types';

export const localizacaoUpdateWsSpec = {
  name: 'ws_localizacao_update',
  event: 'localizacao:update',
  direction: 'client→server',
  description: 'Enviado pelo app do entregador durante corrida ativa para atualizar posição GPS em tempo real. Frequência ~5 segundos. O servidor re-emite como localizacao:entregador para consumidor e loja.',
  room: 'N/A — evento enviado pelo cliente para o servidor',

  payload: {
    pedidoId: 'uuid',
    lat: 'number (-90..90)',
    lng: 'number (-180..180)',
    heading: 'number | undefined — direção em graus (0-360)',
    speedKmh: 'number | undefined — velocidade em km/h',
  },

  examples: [
    {
      description: 'Entregador em movimento a 30km/h indo para norte',
      payload: {
        pedidoId: 'ped_abc123',
        lat: -10.9720,
        lng: -37.0480,
        heading: 0,
        speedKmh: 30,
      },
    },
    {
      description: 'Entregador parado (semáforo)',
      payload: {
        pedidoId: 'ped_abc123',
        lat: -10.9700,
        lng: -37.0450,
        heading: 45,
        speedKmh: 0,
      },
    },
  ],

  preconditions: [
    'Entregador conectado via socket na sala entregador:{entregadorId}',
    'Corrida ativa (pedido em status "saiu_entrega")',
    'Primeiro update: busca consumidorId e lojaId do banco para inicializar cache',
  ],

  sideEffects: [
    'Armazena/atualiza posição em cache _localizacoes (Map em memória)',
    'Emite localizacao:entregador para usuario:{consumidorId}',
    'Emite localizacao:entregador para loja:{lojaId} (se lojaId disponível)',
  ],
} satisfies WebSocketSpec;
