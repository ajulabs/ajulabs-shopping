import type { ToolSpec } from '../types';

export const rastrearPedidoSpec = {
  name: 'rastrear_pedido',
  description:
    'Inicia o fluxo de rastreamento de um pedido específico. ' +
    'Usar quando o usuário quer saber onde está sua entrega, acompanhar o status de um pedido ' +
    'ou ver informações do entregador. NÃO usar para ver a lista geral de pedidos.',

  preconditions: [
    'Usuário autenticado (consumidorId disponível no contexto do chat)',
    'Usuário deve ter ao menos um pedido não entregue e não cancelado',
  ],

  input: {},

  output: {
    tipo: {
      type: 'literal',
      value: 'selecionarPedido',
      required: true,
      description: 'O backend intercepta esta tool e inicia o rastreioFlow — retorna cards para seleção',
    },
    pedidos: {
      type: 'PedidoCardData[]',
      required: true,
      description: 'Pedidos em andamento (status NOT IN entregue/cancelado), até 5',
      items: {
        numero: 'number — posição na lista (1-based)',
        id: 'uuid',
        loja: 'string — nome da loja',
        total: 'number (R$)',
        data: 'string — YYYY-MM-DD',
        itens: 'string[] — ex: ["Tênis x1", "Meia x2"]',
        status: "enum: 'aguardando' | 'confirmado' | 'preparando' | 'pronto' | 'saiu_entrega'",
      },
    },
    texto: {
      type: 'string',
      required: true,
      description: 'Mensagem pedindo ao usuário para selecionar o pedido',
    },
    rastreio: {
      type: 'object',
      required: false,
      description: 'Presente após seleção quando status = saiu_entrega',
      items: {
        pedidoId: 'uuid',
        destinoLat: 'number | null',
        destinoLng: 'number | null',
      },
    },
  },

  examples: [
    {
      description: 'Usuário com 2 pedidos em andamento — retorna lista para seleção',
      input: {},
      output: {
        tipo: 'selecionarPedido',
        pedidos: [
          {
            numero: 1,
            id: 'ped_abc123',
            loja: 'SportCenter Aracaju',
            total: 185.31,
            data: '2026-05-27',
            itens: ['Tênis Running Pro x1'],
            status: 'saiu_entrega',
          },
          {
            numero: 2,
            id: 'ped_def456',
            loja: 'Salgaderia do Zé',
            total: 48.0,
            data: '2026-05-27',
            itens: ['Coxinha Catupiry x2'],
            status: 'preparando',
          },
        ],
        texto: 'Qual pedido você quer rastrear?',
      },
    },
    {
      description: 'Usuário sem pedidos em andamento',
      input: {},
      output: {
        tipo: 'selecionarPedido',
        pedidos: [],
        texto: 'Não encontrei nenhum pedido em andamento para rastrear. Quer buscar produtos?',
      },
    },
  ],

  errors: [
    { code: 'DB_ERROR', statusCode: 500, message: 'Erro ao consultar pedidos do usuário' },
  ],

  sideEffects: [
    'Persiste estado selecionando_pedido_rastreio no ConversaChat.estado (JSON)',
    'Após seleção: persiste estado rastreio_concluido se pedido é reclamável (saiu_entrega ou entregue)',
  ],
} satisfies ToolSpec;
