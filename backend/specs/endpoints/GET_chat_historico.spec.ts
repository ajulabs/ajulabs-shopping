import type { EndpointSpec } from '../types';

export const getChatHistoricoSpec = {
  name: 'GET_chat_historico',
  method: 'GET',
  path: '/chat/historico',
  description:
    'Retorna as últimas 50 mensagens da conversa mais recente do usuário com a Aju. ' +
    'Usado para reidratar o chat quando o histórico local não está disponível ' +
    '(troca de aparelho, acesso pela web, dados do app limpos).',
  auth: 'usuario',

  preconditions: [
    'Usuário autenticado como consumidor',
  ],

  input: {},

  output: {
    conversaId: {
      type: 'string',
      required: false,
      description: 'UUID da conversa mais recente. Ausente se o usuário nunca conversou com a Aju.',
    },
    mensagens: {
      type: 'array',
      required: true,
      description: 'Últimas 50 mensagens em ordem cronológica. Array vazio se não houver histórico.',
      items: {
        id: 'uuid',
        remetente: "enum: 'usuario' | 'aju'",
        conteudo: 'string — texto da mensagem (inclui [lojaId:UUID] quando aplicável)',
        criadaEm: 'ISO datetime',
      },
    },
  },

  examples: [
    {
      description: 'Usuário com histórico de conversa',
      input: {},
      output: {
        conversaId: 'conv_abc123',
        mensagens: [
          { id: 'msg_1', remetente: 'usuario', conteudo: 'Quero ver produtos da loja Nike [lojaId:uuid-loja]', criadaEm: '2026-05-27T10:00:00Z' },
          { id: 'msg_2', remetente: 'aju', conteudo: 'Encontrei um modelo de tênis na Nike. Confira:', criadaEm: '2026-05-27T10:00:02Z' },
        ],
      },
    },
    {
      description: 'Usuário sem histórico',
      input: {},
      output: { mensagens: [] },
    },
  ],

  errors: [
    { code: 'UNAUTHORIZED', statusCode: 401, message: 'Usuário não autenticado' },
    { code: 'DB_ERROR', statusCode: 500, message: 'Erro ao carregar histórico' },
  ],

  sideEffects: [
    'Nenhum efeito colateral — operação somente de leitura',
    'Retorna apenas texto (cards de produtos/pedidos não são persistidos no banco)',
  ],
} satisfies EndpointSpec;
