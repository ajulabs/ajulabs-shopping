import type { EndpointSpec } from '../types';

export const postProdutoAvisoEstoqueSpec = {
  name: 'POST_produtos_id_aviso_estoque',
  method: 'POST',
  path: '/produtos/:id/aviso-estoque',
  description:
    'Inscreve o consumidor autenticado para receber um push quando o produto voltar ao ' +
    'estoque. Idempotente: inscrever de novo não cria duplicata (upsert).',
  auth: 'usuario',

  preconditions: ['Usuário autenticado como consumidor', 'Produto existe'],

  input: {
    id: { type: 'string', required: true, constraints: ['uuid', 'path param'] },
  },

  output: {
    inscrito: 'boolean (true)',
  },

  examples: [
    {
      description: 'Inscrição no aviso de reposição de um produto esgotado',
      input: { id: 'prod_esgotado' },
      output: { inscrito: true },
    },
    {
      description: 'Produto inexistente',
      input: { id: 'prod_inexistente' },
      output: { error: 'Produto não encontrado' },
    },
  ],

  errors: [
    { code: 'UNAUTHORIZED', statusCode: 401, message: 'Usuário não autenticado' },
    { code: 'PRODUTO_NAO_ENCONTRADO', statusCode: 404, message: 'Produto não encontrado' },
    { code: 'SERVER_ERROR', statusCode: 500, message: 'Erro ao inscrever no aviso de estoque' },
  ],

  sideEffects: [
    'Upsert em ProdutoAvisoEstoque (produtoId + consumidorId)',
    'Quando o estoque voltar (0 → >0), dispara push "Voltou ao estoque" e remove a inscrição',
  ],
} satisfies EndpointSpec;
