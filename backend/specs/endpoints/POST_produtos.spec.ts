import type { EndpointSpec } from '../types';

export const postProdutosSpec = {
  name: 'POST_produtos',
  method: 'POST',
  path: '/produtos',
  description: 'Cria produto simples (sem imagem, sem variações via rota pública). Para criação com imagem e variações, usar POST /lojista/produtos.',
  auth: 'lojista',

  preconditions: [
    'Lojista autenticado',
    'lojaId pertence ao lojista autenticado',
  ],

  input: {
    lojaId: { type: 'string', required: true, constraints: ['uuid', 'loja pertence ao lojista'] },
    nome: { type: 'string', required: true, constraints: ['min 2 caracteres'] },
    descricao: { type: 'string', required: true },
    preco: { type: 'number', required: true, constraints: ['positivo (> 0)'] },
    estoque: { type: 'number', required: true, constraints: ['int', 'nonnegative (>= 0)'] },
    imagemUrl: { type: 'string', required: true, constraints: ['URL válida'] },
    categoria: { type: 'string', required: true },
    tags: { type: 'array', required: false, constraints: ['string[]', 'default []'] },
    destaque: { type: 'boolean', required: false, constraints: ['default false'] },
  },

  output: {
    produto: {
      id: 'uuid',
      lojaId: 'uuid',
      nome: 'string',
      descricao: 'string',
      preco: 'number',
      estoque: 'number',
      imagemUrl: 'string',
      categoria: 'string',
      tags: 'string[]',
      destaque: 'boolean',
      disponivel: 'boolean (default true)',
      criadoEm: 'ISO datetime',
    },
  },

  examples: [
    {
      description: 'Cria produto de vestuário sem variações',
      input: {
        lojaId: 'loja_xyz789',
        nome: 'Camiseta Básica Branca',
        descricao: 'Camiseta 100% algodão, corte regular',
        preco: 39.9,
        estoque: 50,
        imagemUrl: 'https://storage.ajulabs.com/produtos/camiseta-branca.jpg',
        categoria: 'vestuario',
        tags: ['camiseta', 'algodao', 'basica'],
        destaque: false,
      },
      output: {
        produto: {
          id: 'prod_novo123',
          lojaId: 'loja_xyz789',
          nome: 'Camiseta Básica Branca',
          descricao: 'Camiseta 100% algodão, corte regular',
          preco: 39.9,
          estoque: 50,
          imagemUrl: 'https://storage.ajulabs.com/produtos/camiseta-branca.jpg',
          categoria: 'vestuario',
          tags: ['camiseta', 'algodao', 'basica'],
          destaque: false,
          disponivel: true,
          criadoEm: '2026-05-27T10:00:00Z',
        },
      },
    },
    {
      description: 'Lojista tenta criar produto em loja de outro lojista',
      input: { lojaId: 'loja_de_outro', nome: 'Produto X', descricao: '', preco: 10, estoque: 5, imagemUrl: 'https://x.com/img.jpg', categoria: 'geral' },
      output: { error: 'Acesso negado a esta loja' },
    },
  ],

  errors: [
    { code: 'UNAUTHORIZED', statusCode: 401, message: 'Lojista não autenticado' },
    { code: 'FORBIDDEN', statusCode: 403, message: 'Acesso negado a esta loja' },
    { code: 'VALIDATION_ERROR', statusCode: 400, message: 'Dados inválidos (preco deve ser positivo, etc.)' },
    { code: 'SERVER_ERROR', statusCode: 500, message: 'Erro ao criar produto' },
  ],

  sideEffects: [
    'Cria registro em Produto',
  ],
} satisfies EndpointSpec;
