import type { ToolSpec } from '../types';

export const criarTicketSpec = {
  name: 'criar_ticket',
  description:
    'Registra uma reclamação para atendimento humano. ' +
    'Usar IMEDIATAMENTE quando o usuário mencionar qualquer problema pós-compra: ' +
    'produto danificado, quebrado, defeituoso, errado, não chegou, entrega atrasada, ' +
    'cobrança errada ou qualquer insatisfação com pedido já realizado. ' +
    'NÃO pedir mais informações antes de chamar.',

  preconditions: [
    'Usuário autenticado (consumidorId disponível no contexto do chat)',
  ],

  input: {
    motivo: {
      type: 'string',
      required: true,
      constraints: ['min 1 caractere', 'descrição detalhada do problema relatado pelo usuário'],
      description: 'Ex: "Produto chegou quebrado", "Entrega atrasou 3 dias"',
    },
    pedidoId: {
      type: 'string',
      required: false,
      constraints: ['uuid', 'ID do pedido relacionado se mencionado pelo usuário'],
      description: 'Opcional — informar somente se o usuário citar o pedido',
    },
  },

  output: {
    tipo: {
      type: 'literal',
      value: 'ticket',
      required: true,
    },
    dados: {
      type: 'object',
      required: true,
      items: {
        criado: 'boolean — sempre true em caso de sucesso',
        protocolo: 'string — ex: "TKT-1716806400000" (timestamp)',
      },
    },
  },

  examples: [
    {
      description: 'Produto chegou errado — ticket criado com pedido associado',
      input: {
        motivo: 'Recebi uma camiseta M mas pedi tamanho G. Preciso trocar.',
        pedidoId: 'ped_abc123',
      },
      output: {
        tipo: 'ticket',
        dados: { criado: true, protocolo: 'TKT-1716806400000' },
      },
    },
    {
      description: 'Produto danificado sem referência ao pedido',
      input: {
        motivo: 'O produto chegou completamente amassado e com a embalagem rasgada.',
      },
      output: {
        tipo: 'ticket',
        dados: { criado: true, protocolo: 'TKT-1716810000000' },
      },
    },
    {
      description: 'Cobrança duplicada no cartão',
      input: {
        motivo: 'Meu cartão foi cobrado duas vezes no mesmo pedido.',
        pedidoId: 'ped_def456',
      },
      output: {
        tipo: 'ticket',
        dados: { criado: true, protocolo: 'TKT-1716813600000' },
      },
    },
  ],

  errors: [
    { code: 'MISSING_MOTIVO', statusCode: 400, message: 'Motivo do ticket é obrigatório' },
    { code: 'SLACK_ERROR', statusCode: 500, message: 'Erro ao notificar equipe via Slack (ticket ainda criado)' },
  ],

  sideEffects: [
    'Gera protocolo único no formato TKT-{timestamp}',
    'Registra log estruturado: protocolo, usuárioId, motivo, pedidoId (se informado)',
    'Dispara notificação para webhook do Slack (assíncrono, não bloqueia resposta)',
    'Não persiste no banco de dados (somente log + Slack)',
  ],
} satisfies ToolSpec;
