import type { EndpointSpec } from '../types';

export const postLojistaProdutosSpec = {
  name: 'POST_lojista_produtos',
  method: 'POST',
  path: '/lojista/produtos',
  description:
    'Cria um produto com imagem obrigatória (multipart/form-data). A imagem passa por ' +
    'moderação automática: imagens reprovadas (conteúdo impróprio ou que não mostram um ' +
    'produto vendável) são rejeitadas e geram um strike no lojista. Ao atingir 3 strikes, ' +
    'o lojista fica bloqueado de cadastrar produtos por 24h. Fecha o bypass de cadastro ' +
    'sem imagem: a foto é obrigatória para publicar.',
  auth: 'lojista',

  preconditions: [
    'Lojista autenticado',
    'lojaId pertence ao lojista autenticado',
    'Lojista não está bloqueado de cadastrar produtos (produtoBloqueadoAte no passado ou nulo)',
    'Imagem enviada em formato válido (JPEG, PNG, GIF ou WebP)',
  ],

  input: {
    lojaId: { type: 'string', required: true, constraints: ['uuid', 'loja pertence ao lojista'] },
    nome: { type: 'string', required: true, constraints: ['min 2 caracteres'] },
    descricao: { type: 'string', required: true },
    preco: { type: 'number', required: true, constraints: ['positivo (> 0)', 'enviado como string no form'] },
    estoque: { type: 'number', required: true, constraints: ['int', 'nonnegative (>= 0)', 'enviado como string no form'] },
    categoria: { type: 'string', required: true },
    tags: { type: 'array', required: false, constraints: ['string[]', 'JSON serializado no form', 'default []'] },
    variacoes: { type: 'array', required: false, constraints: ['{ nome, estoque }[]', 'JSON serializado no form'] },
    imagem: { type: 'file', required: true, constraints: ['multipart/form-data', 'JPEG/PNG/GIF/WebP', 'moderada automaticamente'] },
  },

  output: {
    produto: {
      id: 'uuid',
      lojaId: 'uuid',
      nome: 'string',
      descricao: 'string',
      preco: 'number',
      estoque: 'number',
      imagemUrl: 'string (URL)',
      categoria: 'string',
      tags: 'string[]',
      disponivel: 'boolean',
    },
  },

  examples: [
    {
      description: 'Cadastro de tênis com imagem aprovada na moderação',
      input: {
        lojaId: 'loja_xyz789',
        nome: 'Tênis Running',
        descricao: 'Tênis leve para corrida',
        preco: 149.9,
        estoque: 10,
        categoria: 'Esporte - Academia / Fitness',
        imagem: '<arquivo binário>',
      },
      output: {
        produto: {
          id: 'prod_tenis',
          lojaId: 'loja_xyz789',
          nome: 'Tênis Running',
          descricao: 'Tênis leve para corrida',
          preco: 149.9,
          estoque: 10,
          imagemUrl: 'https://cdn.ajulabs.com/produtos/prod_tenis.webp',
          categoria: 'Esporte - Academia / Fitness',
          tags: [],
          disponivel: true,
        },
      },
    },
    {
      description: 'Imagem reprovada na moderação — 1º strike, produto não criado',
      input: {
        lojaId: 'loja_xyz789',
        nome: 'Produto qualquer',
        descricao: '...',
        preco: 10,
        estoque: 1,
        categoria: 'Outros',
        imagem: '<imagem imprópria>',
      },
      output: {
        error:
          'Esta imagem não pode ser usada para cadastro de produto. Envie outra foto. Aviso: 1/3 tentativas inadequadas registradas. Faltam 2 antes da conta ser bloqueada por 24h.',
      },
    },
    {
      description: 'Cadastro sem imagem — bloqueado (bypass fechado)',
      input: {
        lojaId: 'loja_xyz789',
        nome: 'Produto sem foto',
        descricao: '...',
        preco: 10,
        estoque: 1,
        categoria: 'Outros',
      },
      output: { error: 'A foto do produto é obrigatória para publicar.' },
    },
  ],

  errors: [
    { code: 'UNAUTHORIZED', statusCode: 401, message: 'Lojista não autenticado' },
    { code: 'ACESSO_NEGADO', statusCode: 403, message: 'Loja não pertence ao lojista autenticado' },
    { code: 'FOTO_OBRIGATORIA', statusCode: 400, message: 'A foto do produto é obrigatória para publicar.' },
    { code: 'IMAGEM_FORMATO_INVALIDO', statusCode: 400, message: 'Formato de imagem inválido. Aceitos: JPEG, PNG, GIF, WebP.' },
    {
      code: 'IMAGEM_REPROVADA',
      statusCode: 400,
      message:
        'Esta imagem não pode ser usada para cadastro de produto. Envie outra foto. (acompanha aviso de strikes 1/3, 2/3...)',
    },
    {
      code: 'LOJISTA_BLOQUEADO',
      statusCode: 423,
      message:
        'Cadastro de produtos temporariamente bloqueado por uploads inadequados. Tente novamente em ~N min.',
    },
    { code: 'VALIDATION_ERROR', statusCode: 422, message: 'Campos obrigatórios ausentes (spec-validator)' },
  ],

  sideEffects: [
    'Valida o formato da imagem (mimeValidator)',
    'Modera a imagem via OpenAI (omni-moderation); se reprovada, incrementa Lojista.produtoStrikesCount e lança erro',
    'Ao atingir 3 strikes: grava Lojista.produtoBloqueadoAte = agora + 24h e zera produtoStrikesCount',
    'Faz upload da imagem aprovada para o storage',
    'Cria registro em Produto (e VariacaoProduto para cada variação enviada)',
    'Emite WebSocket vitrine:atualizada para vitrine:{lojaId} com acao "novo"',
    'Dispara indexação de embedding do produto (assíncrono, para a busca da Aju)',
  ],
} satisfies EndpointSpec;
