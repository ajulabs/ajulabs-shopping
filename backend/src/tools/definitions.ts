import OpenAI from 'openai';

export const TOOL_DEFINITIONS: OpenAI.Chat.ChatCompletionTool[] = [
  {
    type: 'function',
    function: {
      name: 'buscar_produtos',
      description:
        'Busca produtos no marketplace por relevância semântica. Use quando o usuário quer comprar algo, ver opções, pedir recomendações ou mencionar qualquer categoria de produto.',
      parameters: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'Termos de busca refinados baseados na intenção real do usuário',
          },
        },
        required: ['query'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'listar_pedidos',
      description:
        'Lista os pedidos recentes do usuário com status atual. Use quando o usuário perguntar sobre seus pedidos, entrega, rastreamento ou status de compra.',
      parameters: {
        type: 'object',
        properties: {},
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'criar_ticket',
      description:
        'Registra uma reclamação ou problema para atendimento humano. Use quando o usuário expressar insatisfação, reclamar de produto, entrega ou atendimento.',
      parameters: {
        type: 'object',
        properties: {
          motivo: {
            type: 'string',
            description: 'Descrição detalhada do problema relatado pelo usuário',
          },
          pedidoId: {
            type: 'string',
            description: 'ID do pedido relacionado, se mencionado pelo usuário',
          },
        },
        required: ['motivo'],
      },
    },
  },
];
