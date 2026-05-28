import type { WebSocketSpec } from '../types';

export const produtoVariacoesWsSpec = {
  name: 'ws_produto_variacoes',
  event: 'produto:variacoes',
  direction: 'server→client',
  description: 'Emitido para o lojista quando as variações de um produto são atualizadas (após PUT /lojista/produtos/:id).',
  room: 'loja:{lojaId}',

  payload: {
    produtoId: 'uuid',
    variacoes: [
      { id: 'uuid', nome: 'string', estoque: 'number' },
    ],
  },

  examples: [
    {
      description: 'Variações da camiseta atualizadas — nova variação GG adicionada',
      payload: {
        produtoId: 'prod_camiseta',
        variacoes: [
          { id: 'var_P', nome: 'P', estoque: 5 },
          { id: 'var_M', nome: 'M', estoque: 5 },
          { id: 'var_G', nome: 'G', estoque: 5 },
          { id: 'var_GG', nome: 'GG', estoque: 3 },
        ],
      },
    },
    {
      description: 'Tênis com numeração atualizada',
      payload: {
        produtoId: 'prod_tenis',
        variacoes: [
          { id: 'var_38', nome: '38', estoque: 2 },
          { id: 'var_40', nome: '40', estoque: 4 },
          { id: 'var_42', nome: '42', estoque: 3 },
          { id: 'var_44', nome: '44', estoque: 1 },
        ],
      },
    },
  ],

  preconditions: [
    'Lojista conectado via socket na sala loja:{lojaId}',
    'PUT /lojista/produtos/:id executado com lista de variacoes',
  ],

  sideEffects: [],
} satisfies WebSocketSpec;
