import type { EndpointSpec } from '../types';

export const getLojaProdutosSpec = {
  name: 'GET_lojas_id_produtos',
  method: 'GET',
  path: '/lojas/:id/produtos',
  description: 'Lista produtos de uma loja com paginação e filtros por categoria. Inclui variações. Rota pública.',
  auth: 'none',

  preconditions: [],

  input: {
    id: { type: 'string', required: true, constraints: ['uuid — path param'] },
    limit: { type: 'number', required: false, constraints: ['int, default 20, max 100 — query param'] },
    offset: { type: 'number', required: false, constraints: ['int, default 0 — query param'] },
    categoria: { type: 'string', required: false, constraints: ['query param — filtra categoria'] },
    disponivel: { type: 'string', required: false, constraints: ["'false' desativa filtro de disponibilidade, default true"] },
  },

  output: {
    produtos: [
      {
        id: 'uuid',
        nome: 'string',
        descricao: 'string',
        preco: 'number',
        estoque: 'number',
        imagemUrl: 'string',
        categoria: 'string',
        destaque: 'boolean',
        disponivel: 'boolean',
        variacoes: [{ id: 'uuid', nome: 'string', estoque: 'number' }],
      },
    ],
    total: 'number — total de registros (sem paginação)',
    limit: 'number',
    offset: 'number',
  },

  examples: [
    {
      description: 'Página 1 de produtos de loja de esportes',
      input: { id: 'loja_xyz789', limit: 20, offset: 0 },
      output: {
        produtos: [
          { id: 'prod_tenis', nome: 'Tênis Running Pro', descricao: '...', preco: 149.9, estoque: 10, imagemUrl: 'https://...', categoria: 'calcados', destaque: true, disponivel: true, variacoes: [{ id: 'var_38', nome: '38', estoque: 3 }, { id: 'var_42', nome: '42', estoque: 7 }] },
        ],
        total: 45,
        limit: 20,
        offset: 0,
      },
    },
    {
      description: 'Filtro por categoria "vestuario"',
      input: { id: 'loja_xyz789', categoria: 'vestuario' },
      output: {
        produtos: [
          { id: 'prod_camiseta', nome: 'Camiseta Básica', descricao: '...', preco: 39.9, estoque: 15, imagemUrl: 'https://...', categoria: 'vestuario', destaque: false, disponivel: true, variacoes: [] },
        ],
        total: 8,
        limit: 20,
        offset: 0,
      },
    },
  ],

  errors: [
    { code: 'NOT_FOUND', statusCode: 404, message: 'Loja não encontrada' },
    { code: 'SERVER_ERROR', statusCode: 500, message: 'Erro ao buscar produtos' },
  ],

  sideEffects: [],
} satisfies EndpointSpec;
