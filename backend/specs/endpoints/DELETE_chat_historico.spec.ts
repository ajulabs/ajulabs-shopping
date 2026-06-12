import type { EndpointSpec } from '../types';

export const deleteChatHistoricoSpec = {
  name: 'DELETE_chat_historico',
  method: 'DELETE',
  path: '/chat/historico',
  description:
    'Apaga todas as conversas do usuário com a Aju (mensagens e estado em cascata). ' +
    'Chamado quando o usuário toca no botão de lixeira no chat. ' +
    'Garante que o histórico não reaparece ao recarregar a página ou trocar de aparelho.',
  auth: 'usuario',

  preconditions: [
    'Usuário autenticado como consumidor',
  ],

  input: {},

  output: {
    ok: {
      type: 'boolean',
      required: true,
      description: 'Sempre true em caso de sucesso',
    },
  },

  examples: [
    {
      description: 'Histórico apagado com sucesso',
      input: {},
      output: { ok: true },
    },
  ],

  errors: [
    { code: 'UNAUTHORIZED', statusCode: 401, message: 'Usuário não autenticado' },
    { code: 'DB_ERROR', statusCode: 500, message: 'Erro ao limpar histórico' },
  ],

  sideEffects: [
    'Deleta todos os registros ConversaChat do usuário (cascade: MensagemChat, SugestaoProdutoChat)',
    'O estado do fluxo (queixa/rastreio em andamento) também é apagado',
    'Operação irreversível',
  ],
} satisfies EndpointSpec;
