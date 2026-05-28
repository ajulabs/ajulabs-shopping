import type { WebSocketSpec } from '../types';

export const entregadorJoinWsSpec = {
  name: 'ws_entregador_join',
  event: 'entregador:join',
  direction: 'client→server',
  description: 'Entregador entra nas salas entregador:{id} e "entregadores" para receber ofertas de corrida e mensagens.',
  room: 'entregador:{entregadorId} + entregadores',

  payload: {
    entregadorId: 'string — ID do entregador autenticado',
  },

  examples: [
    {
      description: 'Entregador Pedro conecta ao iniciar o app',
      payload: 'ent_abc123',
    },
  ],

  preconditions: [
    'Socket conectado',
    'Entregador autenticado no app',
  ],

  sideEffects: [
    'Socket entra em sala entregador:{entregadorId}',
    'Socket entra em sala "entregadores" (broadcast de ofertas)',
  ],
} satisfies WebSocketSpec;

export const usuarioJoinWsSpec = {
  name: 'ws_usuario_join',
  event: 'usuario:join',
  direction: 'client→server',
  description: 'Consumidor entra na sala usuario:{id} para receber atualizações de pedidos e mensagens.',
  room: 'usuario:{usuarioId}',

  payload: {
    usuarioId: 'string — ID do consumidor autenticado',
  },

  examples: [
    {
      description: 'Consumidor Maria conecta ao abrir o app',
      payload: 'usr_abc123',
    },
  ],

  preconditions: [
    'Socket conectado',
    'Usuário autenticado no app',
  ],

  sideEffects: [
    'Socket entra em sala usuario:{usuarioId}',
  ],
} satisfies WebSocketSpec;

export const lojistaJoinWsSpec = {
  name: 'ws_lojista_join',
  event: 'lojista:join',
  direction: 'client→server',
  description: 'Lojista entra na sala loja:{id} para receber novos pedidos, mensagens e atualizações.',
  room: 'loja:{lojaId}',

  payload: {
    lojaId: 'string — ID da loja do lojista autenticado',
  },

  examples: [
    {
      description: 'Lojista Carlos conecta ao painel',
      payload: 'loja_xyz789',
    },
  ],

  preconditions: [
    'Socket conectado',
    'Lojista autenticado',
  ],

  sideEffects: [
    'Socket entra em sala loja:{lojaId}',
  ],
} satisfies WebSocketSpec;
