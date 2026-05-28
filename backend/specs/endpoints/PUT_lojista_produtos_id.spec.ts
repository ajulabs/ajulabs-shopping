import type { EndpointSpec } from '../types';

export const putLojistaProdutoSpec = {
  name: 'PUT_lojista_produtos_id',
  method: 'PUT',
  path: '/lojista/produtos/:id',
  description: 'Atualiza produto do lojista incluindo imagens (multipart) e variações. Faz upload das novas imagens para o storage e remove as que não estão na lista de imagensExistentes.',
  auth: 'lojista',

  preconditions: [
    'Lojista autenticado',
    'Produto pertence a uma loja do lojista',
  ],

  input: {
    id: { type: 'string', required: true, constraints: ['uuid — path param'] },
    nome: { type: 'string', required: false, constraints: ['form-data field'] },
    descricao: { type: 'string', required: false, constraints: ['form-data field'] },
    preco: { type: 'string', required: false, constraints: ['form-data field — número em formato string'] },
    estoque: { type: 'string', required: false, constraints: ['form-data field — inteiro em formato string'] },
    categoria: { type: 'string', required: false, constraints: ['form-data field'] },
    disponivel: { type: 'string', required: false, constraints: ["'true' | 'false'"] },
    imagensExistentes: { type: 'string', required: false, constraints: ['JSON stringified string[] — URLs das imagens a manter'] },
    variacoes: { type: 'string', required: false, constraints: ['JSON stringified [{nome, estoque}][] — substitui todas as variações'] },
    imagens: { type: 'file[]', required: false, constraints: ['multipart/form-data', 'max 4 arquivos', 'max 10MB cada'] },
  },

  output: {
    produto: {
      id: 'uuid',
      nome: 'string',
      preco: 'number',
      estoque: 'number',
      disponivel: 'boolean',
      imagemUrl: 'string',
      imagensAdicionais: 'string[]',
      variacoes: [{ id: 'uuid', nome: 'string', estoque: 'number' }],
    },
  },

  examples: [
    {
      description: 'Atualiza camiseta: novo preço e adiciona variação GG',
      input: {
        id: 'prod_camiseta',
        preco: '44.9',
        variacoes: '[{"nome":"P","estoque":5},{"nome":"M","estoque":5},{"nome":"G","estoque":5},{"nome":"GG","estoque":3}]',
      },
      output: {
        produto: {
          id: 'prod_camiseta',
          nome: 'Camiseta Básica',
          preco: 44.9,
          estoque: 18,
          disponivel: true,
          imagemUrl: 'https://storage.ajulabs.com/produtos/camiseta.jpg',
          imagensAdicionais: [],
          variacoes: [
            { id: 'var_P', nome: 'P', estoque: 5 },
            { id: 'var_M', nome: 'M', estoque: 5 },
            { id: 'var_G', nome: 'G', estoque: 5 },
            { id: 'var_GG', nome: 'GG', estoque: 3 },
          ],
        },
      },
    },
    {
      description: 'Marca produto como indisponível',
      input: { id: 'prod_camiseta', disponivel: 'false' },
      output: {
        produto: { id: 'prod_camiseta', nome: 'Camiseta Básica', preco: 44.9, estoque: 18, disponivel: false, imagemUrl: 'https://...', imagensAdicionais: [], variacoes: [] },
      },
    },
  ],

  errors: [
    { code: 'UNAUTHORIZED', statusCode: 401, message: 'Lojista não autenticado' },
    { code: 'FORBIDDEN', statusCode: 403, message: 'Produto não pertence ao lojista' },
    { code: 'FILE_TOO_LARGE', statusCode: 400, message: 'Arquivo maior que 10MB' },
    { code: 'SERVER_ERROR', statusCode: 500, message: 'Erro ao atualizar produto' },
  ],

  sideEffects: [
    'Faz upload das novas imagens para Supabase Storage',
    'Remove do Storage as imagens que não estão em imagensExistentes',
    'Substitui todas as variações (delete + create)',
    'Recalcula Produto.estoque como soma das variações',
    'Emite WebSocket produto:variacoes para sala loja:{lojaId}',
  ],
} satisfies EndpointSpec;
