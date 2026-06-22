import type { WebSocketSpec } from '../types';

export const estoqueAlertaWsSpec = {
  name: 'ws_estoque_alerta',
  event: 'estoque:alerta',
  direction: 'server→client',
  description:
    'Emitido ao lojista quando o estoque de um produto entra em nível de atenção ' +
    '(diferente de "saudável") após uma alteração — base do alerta de reposição.',
  room: 'loja:{lojaId}',

  payload: {
    produtoId: 'uuid',
    produtoNome: 'string',
    estoque: 'number',
    estoqueMinimo: 'number',
    nivel: "string ('baixo' | 'critico' | 'esgotado')",
  },

  examples: [
    {
      description: 'Estoque abaixo do mínimo — nível baixo',
      payload: { produtoId: 'prod_tenis', produtoNome: 'Tênis Running', estoque: 3, estoqueMinimo: 5, nivel: 'baixo' },
    },
    {
      description: 'Produto esgotado',
      payload: { produtoId: 'prod_camiseta', produtoNome: 'Camiseta Básica', estoque: 0, estoqueMinimo: 2, nivel: 'esgotado' },
    },
  ],

  preconditions: [
    'Lojista conectado na sala loja:{lojaId}',
    'Estoque do produto passou para um nível diferente de "saudável"',
  ],

  sideEffects: [],
} satisfies WebSocketSpec;
