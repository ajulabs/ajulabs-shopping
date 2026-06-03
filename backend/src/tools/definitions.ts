import OpenAI from 'openai';

export const TOOL_DEFINITIONS: OpenAI.Chat.ChatCompletionTool[] = [
  {
    type: 'function',
    function: {
      name: 'buscar_produtos',
      description:
        'Busca produtos no marketplace por relevância semântica. Use SOMENTE quando o usuário quer COMPRAR algo novo, ver opções ou pedir recomendações de produtos. NÃO use para reclamações sobre produtos já comprados.',
      parameters: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'Termos de busca refinados baseados na intenção real do usuário',
          },
          lojaId: {
            type: 'string',
            description:
              'UUID da loja específica para filtrar produtos. Use quando o usuário pedir produtos de uma loja específica.',
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
      name: 'rastrear_pedido',
      description:
        'Inicia o rastreamento de um pedido do usuário. Use quando o usuário quer rastrear um pedido específico, acompanhar o status de uma entrega ou saber onde está seu pedido. NÃO use para ver a lista geral de pedidos.',
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
        'Registra uma reclamação para atendimento humano. Use IMEDIATAMENTE quando o usuário mencionar qualquer problema pós-compra: produto danificado, quebrado, defeituoso, errado, não chegou, entrega atrasada, cobrança errada ou qualquer insatisfação com pedido já realizado. NÃO peça mais informações antes de chamar esta função.',
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
