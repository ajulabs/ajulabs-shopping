import type { EndpointSpec } from '../types';

export const getProdutoByIdSpec = {
  name: 'GET_produtos_id',
  method: 'GET',
  path: '/produtos/:id',
  description: 'Retorna detalhes de um produto específico incluindo variações. Rota pública.',
  auth: 'none',

  preconditions: [],

  input: {
    id: { type: 'string', required: true, constraints: ['uuid — path param'] },
  },

  output: {
    produto: {
      id: 'uuid',
      nome: 'string',
      descricao: 'string',
      preco: 'number',
      estoque: 'number',
      imagemUrl: 'string',
      imagensAdicionais: 'string[]',
      categoria: 'string',
      tags: 'string[]',
      destaque: 'boolean',
      disponivel: 'boolean',
      lojaId: 'uuid',
      variacoes: [
        { id: 'uuid', nome: 'string', estoque: 'number', criadoEm: 'ISO datetime' },
      ],
    },
  },

  examples: [
    {
      description: 'Produto com variações de tamanho',
      input: { id: 'prod_camiseta' },
      output: {
        produto: {
          id: 'prod_camiseta',
          nome: 'Camiseta Básica',
          descricao: 'Camiseta 100% algodão',
          preco: 39.9,
          estoque: 15,
          imagemUrl: 'https://storage.ajulabs.com/produtos/camiseta.jpg',
          imagensAdicionais: [],
          categoria: 'vestuario',
          tags: ['camiseta'],
          destaque: true,
          disponivel: true,
          lojaId: 'loja_xyz',
          variacoes: [
            { id: 'var_P', nome: 'P', estoque: 5 },
            { id: 'var_M', nome: 'M', estoque: 5 },
            { id: 'var_G', nome: 'G', estoque: 5 },
          ],
        },
      },
    },
    {
      description: 'Produto não encontrado',
      input: { id: 'prod_inexistente' },
      output: { error: 'Produto não encontrado' },
    },
  ],

  errors: [
    { code: 'NOT_FOUND', statusCode: 404, message: 'Produto não encontrado' },
    { code: 'SERVER_ERROR', statusCode: 500, message: 'Erro ao buscar produto' },
  ],

  sideEffects: [],
} satisfies EndpointSpec;
