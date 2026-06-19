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
              'UUID da loja específica para filtrar produtos. Use quando o usuário pedir produtos de uma loja específica e você tiver o UUID.',
          },
          lojaNome: {
            type: 'string',
            description:
              'Nome da loja mencionada pelo usuário. Use quando o usuário citar o nome da loja mas você não tiver o UUID (ex: "produtos da Loja X", "o que tem na Sapataria Y").',
          },
          precoMax: {
            type: 'number',
            description:
              'Preço máximo em reais. Preencha quando o usuário citar um orçamento ou limite (ex: "até R$200", "no máximo 150 reais", "algo barato até 50").',
          },
          precoMin: {
            type: 'number',
            description:
              'Preço mínimo em reais. Preencha quando o usuário citar um piso de preço (ex: "acima de R$100", "a partir de 200").',
          },
        },
        required: ['query'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'buscar_conjunto',
      description:
        'Busca um CONJUNTO de produtos que combinam entre si. Use SOMENTE quando o usuário pedir 2 ou mais TIPOS de produtos diferentes na mesma mensagem com intenção de combinar/montar um look (ex: "uma camisa e um tênis pra academia", "vestido e sandália pra festa", "calça e blusa de frio"). Também use quando o usuário pedir um "look completo" ou "conjunto" sem listar as peças — nesse caso, INFIRA de 2 a 3 peças coerentes com a ocasião e o gênero (ex: "look de academia masculino" → ["camiseta", "shorts", "tênis"]). Quando o usuário pedir para TROCAR uma peça de um conjunto já mostrado (ex: "troca o tênis por uma sandália"), chame de novo com a lista de itens atualizada. Para um único tipo de produto, use buscar_produtos.',
      parameters: {
        type: 'object',
        properties: {
          itens: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                tipo: {
                  type: 'string',
                  description:
                    'O tipo de produto, sem atributos compartilhados (ex: "camisa", "tênis"). Ocasião, gênero, cor e preço vão nos campos próprios.',
                },
                quantidade: {
                  type: 'number',
                  description:
                    'Quantas unidades desse item o usuário quer, quando mencionar (ex: "2 camisas e 3 tênis" → quantidade 2 na camisa e 3 no tênis). Omita ou use 1 se não citar.',
                },
              },
              required: ['tipo'],
            },
            description: 'As peças do conjunto (ex: [{"tipo":"camisa"},{"tipo":"tênis"}]).',
          },
          ocasiao: {
            type: 'string',
            description:
              'Ocasião ou estilo compartilhado pelo conjunto, quando mencionado (ex: "academia", "fitness", "festa", "trabalho", "praia", "casual"). Aplica-se a todos os itens.',
          },
          genero: {
            type: 'string',
            description:
              'Gênero do conjunto, quando mencionado: "masculino", "feminino", "infantil" ou "unissex". Aplica-se a todos os itens.',
          },
          cor: {
            type: 'string',
            description:
              'Cor ou família de cor desejada para o conjunto combinar, quando mencionada (ex: "preto", "azul", "tons neutros", "cores frias"). Aplica-se a todos os itens.',
          },
          precoMax: {
            type: 'number',
            description:
              'Preço máximo em reais POR PEÇA, quando o usuário citar um teto (ex: "cada peça até R$150"). Aplica-se a cada item do conjunto.',
          },
          precoMin: {
            type: 'number',
            description: 'Preço mínimo em reais por peça, quando o usuário citar um piso.',
          },
          lojaNome: {
            type: 'string',
            description:
              'Nome da loja, quando o usuário pedir o conjunto de uma loja específica (ex: "uma camisa e um tênis da Centauro").',
          },
        },
        required: ['itens'],
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
        properties: {
          lojaNome: {
            type: 'string',
            description:
              'Filtra pedidos de uma loja específica pelo nome, quando o usuário mencionar uma loja (ex: "meus pedidos da Loja X").',
          },
        },
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
      name: 'buscar_info_loja',
      description:
        'Retorna informações de uma loja: horários de funcionamento, endereço, telefone, WhatsApp, taxa de entrega e tempo estimado. Use quando o usuário perguntar sobre horário, endereço, telefone, se a loja está aberta, tempo de entrega ou qualquer dado da loja em si.',
      parameters: {
        type: 'object',
        properties: {
          lojaId: {
            type: 'string',
            description: 'UUID da loja. Use quando disponível na conversa (ex: [lojaId:UUID]).',
          },
          lojaNome: {
            type: 'string',
            description: 'Nome da loja quando não há UUID disponível.',
          },
        },
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'criar_ticket',
      description:
        'Registra uma reclamação para atendimento humano. Use IMEDIATAMENTE quando o usuário DESCREVER qualquer problema pós-compra: produto danificado, quebrado, defeituoso, errado, não chegou, entrega atrasada, cobrança errada ou qualquer insatisfação com pedido já realizado. Use mesmo que já exista um ticket criado nessa conversa — cada relato novo gera um ticket novo. NÃO peça mais informações antes de chamar esta função.',
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
  {
    type: 'function',
    function: {
      name: 'consultar_tickets',
      description:
        'Lista as reclamações (tickets) abertas ou recentes do usuário. Use SOMENTE quando o usuário perguntar explicitamente sobre o status de tickets existentes, protocolo de atendimento ou se alguém respondeu. NÃO use quando o usuário estiver descrevendo um problema novo — nesses casos use criar_ticket.',
      parameters: {
        type: 'object',
        properties: {},
        required: [],
      },
    },
  },
];
