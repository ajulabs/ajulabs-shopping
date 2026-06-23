import type { EndpointSpec } from '../types';

export const getProdutoAvisoEstoqueSpec = {
  name: 'GET_produtos_id_aviso_estoque',
  method: 'GET',
  path: '/produtos/:id/aviso-estoque',
  description:
    'Indica se o consumidor autenticado está inscrito para ser avisado quando o produto ' +
    'voltar ao estoque (restock alert).',
  auth: 'usuario',

  preconditions: ['Usuário autenticado como consumidor'],

  input: {
    id: { type: 'string', required: true, constraints: ['uuid', 'path param'] },
  },

  output: {
    inscrito: 'boolean',
  },

  examples: [
    {
      description: 'Consumidor já inscrito no aviso de reposição',
      input: { id: 'prod_esgotado' },
      output: { inscrito: true },
    },
    {
      description: 'Consumidor não inscrito',
      input: { id: 'prod_disponivel' },
      output: { inscrito: false },
    },
  ],

  errors: [
    { code: 'UNAUTHORIZED', statusCode: 401, message: 'Usuário não autenticado' },
    { code: 'SERVER_ERROR', statusCode: 500, message: 'Erro ao consultar aviso de estoque' },
  ],

  sideEffects: [],
} satisfies EndpointSpec;
