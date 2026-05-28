import type { EndpointSpec } from '../types';

export const postEntregadorHeartbeatSpec = {
  name: 'POST_entregador_heartbeat',
  method: 'POST',
  path: '/entregador/heartbeat',
  description: 'Heartbeat de localização do entregador no modo "online idle" (sem corrida ativa). Atualiza última posição para oferta de corridas próximas. Chamado a cada ~1 minuto pelo app.',
  auth: 'entregador',

  preconditions: [
    'Entregador autenticado',
    'Entregador está online (status online = true)',
  ],

  input: {
    lat: { type: 'number', required: true, constraints: ['float', 'min -90', 'max 90'] },
    lng: { type: 'number', required: true, constraints: ['float', 'min -180', 'max 180'] },
  },

  output: {
    ok: { type: 'boolean', description: 'true em caso de sucesso' },
  },

  examples: [
    {
      description: 'Entregador online em Atalaia, Aracaju',
      input: { lat: -10.9776, lng: -37.0490 },
      output: { ok: true },
    },
    {
      description: 'Coordenadas inválidas',
      input: { lat: 200, lng: -37.0490 },
      output: { error: 'lat deve estar entre -90 e 90' },
    },
  ],

  errors: [
    { code: 'UNAUTHORIZED', statusCode: 401, message: 'Entregador não autenticado' },
    { code: 'INVALID_COORDS', statusCode: 400, message: 'Coordenadas inválidas (lat: -90..90, lng: -180..180)' },
    { code: 'SERVER_ERROR', statusCode: 500, message: 'Erro ao atualizar localização' },
  ],

  sideEffects: [
    'Atualiza Entregador.ultimaLat, ultimaLng, ultimoHeartbeat no banco',
  ],
} satisfies EndpointSpec;
