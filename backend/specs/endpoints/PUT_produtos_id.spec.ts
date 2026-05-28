import type { EndpointSpec } from '../types';

export const putProdutoByIdSpec = {
  name: 'PUT_produtos_id',
  method: 'PUT',
  path: '/produtos/:id',
  description: 'Atualiza dados de um produto. Para atualizar com imagens e variações, usar PUT /lojista/produtos/:id.',
  auth: 'lojista',

  preconditions: [
    'Lojista autenticado',
    'Produto pertence a uma loja do lojista autenticado',
  ],

  input: {
    id: { type: 'string', required: true, constraints: ['uuid — path param'] },
    nome: { type: 'string', required: false },
    descricao: { type: 'string', required: false },
    preco: { type: 'number', required: false, constraints: ['positivo'] },
    estoque: { type: 'number', required: false, constraints: ['int, nonnegative'] },
    disponivel: { type: 'boolean', required: false },
    destaque: { type: 'boolean', required: false },
    categoria: { type: 'string', required: false },
    tags: { type: 'array', required: false },
  },

  output: {
    produto: {
      id: 'uuid',
      nome: 'string',
      preco: 'number',
      estoque: 'number',
      disponivel: 'boolean',
      atualizadoEm: 'ISO datetime',
    },
  },

  examples: [
    {
      description: 'Atualiza preço e disponibilidade de produto',
      input: { id: 'prod_camiseta', preco: 44.9, disponivel: true },
      output: {
        produto: { id: 'prod_camiseta', nome: 'Camiseta Básica', preco: 44.9, estoque: 15, disponivel: true, atualizadoEm: '2026-05-27T11:00:00Z' },
      },
    },
    {
      description: 'Produto de outro lojista — acesso negado',
      input: { id: 'prod_de_outro', preco: 100 },
      output: { error: 'Acesso negado' },
    },
  ],

  errors: [
    { code: 'UNAUTHORIZED', statusCode: 401, message: 'Lojista não autenticado' },
    { code: 'FORBIDDEN', statusCode: 403, message: 'Acesso negado — produto não pertence ao lojista' },
    { code: 'SERVER_ERROR', statusCode: 500, message: 'Erro ao atualizar produto' },
  ],

  sideEffects: [
    'Atualiza campos do Produto no banco',
  ],
} satisfies EndpointSpec;
