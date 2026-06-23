import type { EndpointSpec } from '../types';

export const postLojistaProdutosAnalisarSpec = {
  name: 'POST_lojista_produtos_analisar',
  method: 'POST',
  path: '/lojista/produtos/analisar',
  description:
    'Pré-análise da imagem antes do cadastro (multipart/form-data). Verifica bloqueio do ' +
    'lojista, valida o formato e modera a imagem; em seguida usa visão (GPT-4o) para extrair ' +
    'uma sugestão de cadastro (nome, categoria, descrição, preço, estoque, tags e atributos). ' +
    'Se a imagem não mostrar um produto vendável, rejeita e aplica strike — é o passo que ' +
    '"avisa antes de bloquear".',
  auth: 'lojista',

  preconditions: [
    'Lojista autenticado',
    'Lojista não está bloqueado de cadastrar produtos',
    'Imagem enviada em formato válido',
  ],

  input: {
    imagem: { type: 'file', required: true, constraints: ['multipart/form-data', 'JPEG/PNG/GIF/WebP', 'moderada automaticamente'] },
  },

  output: {
    nome: 'string (sugestão, máx 60 caracteres)',
    categoria: 'string (categoria do catálogo)',
    descricao: 'string (1-2 frases, máx 150 caracteres)',
    tags: 'string[]',
    preco: 'string (ex: "49,90")',
    estoque: 'string (ex: "10")',
    cor: 'string[] (opcional)',
    tipo: 'string (opcional)',
    armazenamento: 'string[] (opcional, eletrônicos)',
    material: 'string[] (opcional, joias/acessórios)',
    volume: 'string[] (opcional, perfumes/cosméticos)',
  },

  examples: [
    {
      description: 'Foto de tênis — análise extrai sugestão de cadastro',
      input: { imagem: '<foto de tênis>' },
      output: {
        nome: 'Tênis Esportivo Running',
        categoria: 'Esporte - Academia / Fitness',
        descricao: 'Tênis leve e respirável, ideal para corrida e treino.',
        tags: ['tênis', 'corrida', 'esporte'],
        preco: '149,90',
        estoque: '10',
        cor: ['Preto', 'Branco'],
      },
    },
    {
      description: 'Selfie (sem produto) — rejeitada e strike aplicado',
      input: { imagem: '<selfie>' },
      output: {
        error:
          'A imagem não mostra um produto vendável. Envie uma foto clara do item que você quer cadastrar. Aviso: 1/3 tentativas inadequadas registradas. Faltam 2 antes da conta ser bloqueada por 24h.',
      },
    },
  ],

  errors: [
    { code: 'UNAUTHORIZED', statusCode: 401, message: 'Lojista não autenticado' },
    { code: 'IMAGEM_AUSENTE', statusCode: 400, message: 'Imagem ausente' },
    { code: 'IMAGEM_FORMATO_INVALIDO', statusCode: 400, message: 'Formato de imagem inválido. Aceitos: JPEG, PNG, GIF, WebP.' },
    { code: 'IMAGEM_REPROVADA', statusCode: 400, message: 'Esta imagem não pode ser usada para cadastro de produto. Envie outra foto. (acompanha aviso de strikes)' },
    { code: 'SEM_PRODUTO', statusCode: 400, message: 'A imagem não mostra um produto vendável. (acompanha aviso de strikes)' },
    { code: 'LOJISTA_BLOQUEADO', statusCode: 423, message: 'Cadastro de produtos temporariamente bloqueado por uploads inadequados. Tente novamente em ~N min.' },
  ],

  sideEffects: [
    'Modera a imagem via OpenAI; se reprovada, aplica strike e lança erro',
    'Aplica strike também quando a visão classifica a imagem como "sem_produto"',
    'Ao atingir 3 strikes: bloqueia o lojista por 24h',
    'Não cria produto — apenas retorna a sugestão de preenchimento',
  ],
} satisfies EndpointSpec;
