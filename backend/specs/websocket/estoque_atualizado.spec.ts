import type { WebSocketSpec } from '../types';

export const estoqueAtualizadoWsSpec = {
  name: 'ws_estoque_atualizado',
  event: 'estoque:atualizado',
  direction: 'server→client',
  description:
    'Emitido quando o estoque de um produto muda (venda, ajuste manual, devolução). ' +
    'Atualiza a vitrine do lojista e a tela do produto em tempo real.',
  room: 'loja:{lojaId} e produto:{produtoId}',

  payload: {
    produtoId: 'uuid',
    produtoNome: 'string',
    estoque: 'number',
    estoqueMinimo: 'number',
  },

  examples: [
    {
      description: 'Estoque do tênis caiu para 3 após uma venda',
      payload: { produtoId: 'prod_tenis', produtoNome: 'Tênis Running', estoque: 3, estoqueMinimo: 5 },
    },
    {
      description: 'Produto esgotou (estoque 0)',
      payload: { produtoId: 'prod_camiseta', produtoNome: 'Camiseta Básica', estoque: 0, estoqueMinimo: 2 },
    },
  ],

  preconditions: [
    'Cliente conectado na sala loja:{lojaId} (lojista) ou produto:{produtoId} (vitrine/detalhe)',
    'Houve alteração de estoque do produto',
  ],

  sideEffects: [],
} satisfies WebSocketSpec;
