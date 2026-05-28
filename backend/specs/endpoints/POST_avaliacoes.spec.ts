import type { EndpointSpec } from '../types';

export const postAvaliacoesSpec = {
  name: 'POST_avaliacoes',
  method: 'POST',
  path: '/avaliacoes',
  description: 'Consumidor avalia a loja após pedido entregue. Atualiza a média de avaliação da loja atomicamente.',
  auth: 'usuario',

  preconditions: [
    'Usuário autenticado como consumidor',
    'Pedido com status "entregue"',
    'Pedido pertence ao consumidor autenticado',
    'Pedido ainda não foi avaliado',
  ],

  input: {
    pedidoId: { type: 'string', required: true, constraints: ['uuid', 'pedido entregue e não avaliado'] },
    nota: { type: 'number', required: true, constraints: ['int', 'min 1', 'max 5'] },
    comentario: { type: 'string', required: false, constraints: ['max 500 caracteres'] },
  },

  output: {
    avaliacao: {
      id: 'uuid',
      lojaId: 'uuid',
      usuarioId: 'uuid',
      pedidoId: 'uuid',
      nota: 'number (1-5)',
      comentario: 'string | null',
      criadoEm: 'ISO datetime',
      usuario: { id: 'uuid', nome: 'string', avatarUrl: 'string | null' },
      loja: { id: 'uuid', nome: 'string' },
    },
  },

  examples: [
    {
      description: 'Consumidor avalia 5 estrelas após entrega rápida',
      input: {
        pedidoId: 'ped_abc123',
        nota: 5,
        comentario: 'Entrega super rápida e produto excelente!',
      },
      output: {
        avaliacao: {
          id: 'aval_abc123',
          lojaId: 'loja_xyz789',
          usuarioId: 'usr_abc123',
          pedidoId: 'ped_abc123',
          nota: 5,
          comentario: 'Entrega super rápida e produto excelente!',
          criadoEm: '2026-05-27T16:00:00Z',
          usuario: { id: 'usr_abc123', nome: 'Maria Silva', avatarUrl: null },
          loja: { id: 'loja_xyz789', nome: 'SportCenter Aracaju' },
        },
      },
    },
    {
      description: 'Avaliação sem comentário',
      input: { pedidoId: 'ped_def456', nota: 4 },
      output: {
        avaliacao: {
          id: 'aval_def456',
          lojaId: 'loja_salgados',
          usuarioId: 'usr_abc123',
          pedidoId: 'ped_def456',
          nota: 4,
          comentario: null,
          criadoEm: '2026-05-27T16:05:00Z',
          usuario: { id: 'usr_abc123', nome: 'Maria Silva', avatarUrl: null },
          loja: { id: 'loja_salgados', nome: 'Salgaderia do Zé' },
        },
      },
    },
    {
      description: 'Pedido já avaliado — conflito',
      input: { pedidoId: 'ped_ja_avaliado', nota: 3 },
      output: { error: 'Este pedido já foi avaliado' },
    },
  ],

  errors: [
    { code: 'UNAUTHORIZED', statusCode: 401, message: 'Usuário não autenticado' },
    { code: 'NOT_FOUND_PEDIDO', statusCode: 404, message: 'Pedido não encontrado' },
    { code: 'FORBIDDEN', statusCode: 403, message: 'Acesso negado: pedido pertence a outro usuário' },
    { code: 'PEDIDO_NAO_ENTREGUE', statusCode: 400, message: 'Só é possível avaliar pedidos com status entregue' },
    { code: 'ALREADY_RATED', statusCode: 409, message: 'Este pedido já foi avaliado' },
    { code: 'NOT_FOUND_LOJA', statusCode: 404, message: 'Loja não encontrada' },
    { code: 'INVALID_NOTA', statusCode: 400, message: 'Nota deve ser inteira entre 1 e 5' },
    { code: 'SERVER_ERROR', statusCode: 500, message: 'Erro ao criar avaliação' },
  ],

  sideEffects: [
    'Cria registro em AvaliacaoLoja',
    'Atualiza Loja.avaliacao (nova média ponderada) e Loja.totalAvaliacoes em transação atômica',
  ],
} satisfies EndpointSpec;
