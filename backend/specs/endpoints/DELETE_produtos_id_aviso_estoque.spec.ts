import type { EndpointSpec } from '../types';

export const deleteProdutoAvisoEstoqueSpec = {
  name: 'DELETE_produtos_id_aviso_estoque',
  method: 'DELETE',
  path: '/produtos/:id/aviso-estoque',
  description:
    'Cancela a inscrição do consumidor autenticado no aviso de reposição do produto. ' +
    'Idempotente: cancelar sem inscrição existente não gera erro.',
  auth: 'usuario',

  preconditions: ['Usuário autenticado como consumidor'],

  input: {
    id: { type: 'string', required: true, constraints: ['uuid', 'path param'] },
  },

  output: {
    inscrito: 'boolean (false)',
  },

  examples: [
    {
      description: 'Cancela inscrição existente',
      input: { id: 'prod_esgotado' },
      output: { inscrito: false },
    },
  ],

  errors: [
    { code: 'UNAUTHORIZED', statusCode: 401, message: 'Usuário não autenticado' },
    { code: 'SERVER_ERROR', statusCode: 500, message: 'Erro ao cancelar aviso de estoque' },
  ],

  sideEffects: ['Remove o registro em ProdutoAvisoEstoque (produtoId + consumidorId), se existir'],
} satisfies EndpointSpec;
