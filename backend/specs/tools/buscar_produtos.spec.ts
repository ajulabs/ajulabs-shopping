import type { ToolSpec } from '../types';

export const buscarProdutosSpec = {
  name: 'buscar_produtos',
  description:
    'Busca produtos no marketplace AjuLabs por relevância semântica (RAG). ' +
    'Usar APENAS quando o usuário quer comprar algo novo, ver opções ou pedir recomendações. ' +
    'NÃO usar para reclamações sobre produtos já comprados.',

  preconditions: [
    'Usuário autenticado no chat (consumidorId disponível)',
    'Ao menos um produto cadastrado no banco com embedding gerado',
  ],

  input: {
    query: {
      type: 'string',
      required: true,
      constraints: ['min 1 caractere', 'termos de busca refinados baseados na intenção real do usuário'],
      description: 'Ex: "camiseta azul masculina", "tênis corrida", "bolo de chocolate Aracaju"',
    },
  },

  output: {
    tipo: {
      type: 'literal',
      value: 'produtos',
      required: true,
    },
    dados: {
      type: 'ProdutoRAG[]',
      required: true,
      description: 'Lista de produtos relevantes com score de similaridade',
      items: {
        id: 'uuid',
        nome: 'string',
        preco: 'number (R$)',
        imagemUrl: 'string (URL)',
        lojaId: 'uuid',
        lojaNome: 'string',
        descricao: 'string',
        disponivel: 'boolean',
        score: 'number (0-1, similaridade semântica)',
      },
    },
  },

  examples: [
    {
      description: 'Busca por tênis de corrida — retorna produtos relevantes com fallback textual',
      input: { query: 'tênis de corrida masculino' },
      output: {
        tipo: 'produtos',
        dados: [
          {
            id: 'prod_abc123',
            nome: 'Tênis Running Pro X',
            preco: 299.9,
            imagemUrl: 'https://storage.ajulabs.com/produtos/tenis-running.jpg',
            lojaId: 'loja_xyz',
            lojaNome: 'SportCenter Aracaju',
            descricao: 'Tênis masculino para corrida, solado antiderrapante',
            disponivel: true,
            score: 0.92,
          },
        ],
      },
    },
    {
      description: 'Busca por produto específico de gastronomia local',
      input: { query: 'coxinha frango catupiry Aracaju' },
      output: {
        tipo: 'produtos',
        dados: [
          {
            id: 'prod_def456',
            nome: 'Coxinha Catupiry (6 unid)',
            preco: 24.0,
            imagemUrl: 'https://storage.ajulabs.com/produtos/coxinha.jpg',
            lojaId: 'loja_aaa',
            lojaNome: 'Salgaderia do Zé',
            descricao: 'Coxinha com recheio de frango desfiado e catupiry',
            disponivel: true,
            score: 0.88,
          },
        ],
      },
    },
    {
      description: 'Busca sem resultados relevantes — fallback textual retorna array vazio',
      input: { query: 'drone profissional 4k' },
      output: { tipo: 'produtos', dados: [] },
    },
  ],

  errors: [
    { code: 'EMPTY_QUERY', statusCode: 400, message: 'Query de busca não pode ser vazia' },
    { code: 'EMBEDDING_ERROR', statusCode: 500, message: 'Erro ao gerar embedding para busca semântica' },
    { code: 'DB_ERROR', statusCode: 500, message: 'Erro ao consultar banco de dados de produtos' },
  ],

  sideEffects: [
    'Nenhum efeito colateral — operação somente de leitura',
    'Geração de embedding via OpenAI para a query (custo de tokens)',
  ],
} satisfies ToolSpec;
