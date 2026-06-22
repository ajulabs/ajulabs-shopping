import type { WebSocketSpec } from '../types';

export const vitrineAtualizadaWsSpec = {
  name: 'ws_vitrine_atualizada',
  event: 'vitrine:atualizada',
  direction: 'server→client',
  description:
    'Avisa os consumidores que estão vendo a vitrine de uma loja que o catálogo mudou ' +
    '(produto criado, editado ou removido). O app recarrega a lista de produtos da loja.',
  room: 'vitrine:{lojaId}',

  payload: {
    lojaId: 'uuid',
    produtoId: 'uuid (opcional)',
    acao: "string ('novo' | 'atualizado' | 'removido')",
  },

  examples: [
    {
      description: 'Novo produto publicado na loja',
      payload: { lojaId: 'loja_xyz789', produtoId: 'prod_tenis', acao: 'novo' },
    },
    {
      description: 'Produto removido do catálogo',
      payload: { lojaId: 'loja_xyz789', produtoId: 'prod_antigo', acao: 'removido' },
    },
  ],

  preconditions: [
    'Consumidor conectado na sala vitrine:{lojaId}',
    'Catálogo da loja sofreu alteração (POST/PUT/DELETE de produto)',
  ],

  sideEffects: [],
} satisfies WebSocketSpec;
