import type { EndpointSpec } from '../types';

export const postAvaliacoesSpec = {
  name: 'POST_avaliacoes',
  method: 'POST',
  path: '/avaliacoes',
  description:
    'Avaliação unificada do pedido: consumidor avalia loja, entregador e os produtos ' +
    'numa única chamada após a entrega. Atualiza as médias de loja, entregador e produtos ' +
    'atomicamente em uma transação e marca o pedido como avaliado.',
  auth: 'usuario',

  preconditions: [
    'Usuário autenticado como consumidor',
    'Pedido com status "entregue"',
    'Pedido pertence ao consumidor autenticado',
    'Pedido ainda não foi avaliado',
    'Pedido possui entregador associado',
    'Cada produto avaliado pertence ao pedido',
  ],

  input: {
    pedidoId: {
      type: 'string',
      required: true,
      constraints: ['uuid', 'pedido entregue e não avaliado'],
    },
    notaLoja: { type: 'number', required: true, constraints: ['int', 'min 1', 'max 5'] },
    comentarioLoja: { type: 'string', required: false, constraints: ['max 500 caracteres'] },
    tagsLoja: {
      type: 'array',
      required: false,
      constraints: ['máx 10', 'ids do catálogo TAGS_AVALIACAO_LOJA'],
    },
    notaEntregador: { type: 'number', required: true, constraints: ['int', 'min 1', 'max 5'] },
    comentarioEntregador: { type: 'string', required: false, constraints: ['max 500 caracteres'] },
    tagsEntregador: {
      type: 'array',
      required: false,
      constraints: ['máx 10', 'ids do catálogo TAGS_AVALIACAO_ENTREGADOR'],
    },
    avaliacoesProdutos: {
      type: 'array',
      required: true,
      constraints: ['min 1 item', 'cada item: { produtoId: uuid, nota: int 1-5, comentario?: string }'],
    },
  },

  output: {
    ok: 'boolean (true)',
  },

  examples: [
    {
      description: 'Avaliação completa: loja 5★, entregador 5★ e 1 produto 4★',
      input: {
        pedidoId: 'ped_abc123',
        notaLoja: 5,
        comentarioLoja: 'Tudo certo, produto excelente!',
        tagsLoja: ['embalagem_caprichada'],
        notaEntregador: 5,
        comentarioEntregador: 'Entrega super rápida',
        tagsEntregador: ['simpatico'],
        avaliacoesProdutos: [{ produtoId: 'prod_tenis', nota: 4, comentario: 'Bom custo-benefício' }],
      },
      output: { ok: true },
    },
    {
      description: 'Avaliação sem comentários nem tags',
      input: {
        pedidoId: 'ped_def456',
        notaLoja: 4,
        notaEntregador: 5,
        avaliacoesProdutos: [{ produtoId: 'prod_coxinha', nota: 5 }],
      },
      output: { ok: true },
    },
    {
      description: 'Pedido já avaliado — conflito',
      input: {
        pedidoId: 'ped_ja_avaliado',
        notaLoja: 3,
        notaEntregador: 3,
        avaliacoesProdutos: [{ produtoId: 'prod_x', nota: 3 }],
      },
      output: { error: 'Este pedido já foi avaliado' },
    },
  ],

  errors: [
    { code: 'UNAUTHORIZED', statusCode: 401, message: 'Usuário não autenticado' },
    { code: 'VALIDATION_ERROR', statusCode: 422, message: 'Campo obrigatório ausente (spec)' },
    { code: 'NOT_FOUND_PEDIDO', statusCode: 404, message: 'Pedido não encontrado' },
    { code: 'FORBIDDEN', statusCode: 403, message: 'Acesso negado: pedido pertence a outro usuário' },
    { code: 'PEDIDO_NAO_ENTREGUE', statusCode: 400, message: 'Só é possível avaliar pedidos com status entregue' },
    { code: 'ALREADY_RATED', statusCode: 409, message: 'Este pedido já foi avaliado' },
    { code: 'SEM_ENTREGADOR', statusCode: 400, message: 'Pedido sem entregador associado' },
    { code: 'PRODUTO_FORA_DO_PEDIDO', statusCode: 400, message: 'Produto não pertence a este pedido' },
    { code: 'NOT_FOUND_LOJA', statusCode: 404, message: 'Loja não encontrada' },
    { code: 'NOT_FOUND_ENTREGADOR', statusCode: 404, message: 'Entregador não encontrado' },
    { code: 'SERVER_ERROR', statusCode: 500, message: 'Erro ao criar avaliação' },
  ],

  sideEffects: [
    'Cria registro em AvaliacaoLoja (com tags)',
    'Cria registro em AvaliacaoEntregador (com tags)',
    'Cria um registro em AvaliacaoProduto para cada produto avaliado',
    'Atualiza Loja.avaliacao / Loja.totalAvaliacoes (nova média ponderada)',
    'Atualiza Entregador.avaliacao / Entregador.totalAvaliacoes',
    'Atualiza Produto.avaliacao / Produto.totalAvaliacoes de cada produto',
    'Marca Pedido.avaliado = true',
    'Tudo numa única transação atômica',
  ],
} satisfies EndpointSpec;
