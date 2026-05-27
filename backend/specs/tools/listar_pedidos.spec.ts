import type { ToolSpec } from '../types';

export const listarPedidosSpec = {
  name: 'listar_pedidos',
  description:
    'Lista os 5 pedidos mais recentes do usuário autenticado com status atual. ' +
    'Usar quando o usuário perguntar sobre seus pedidos, entrega, rastreamento ou status de compra.',

  preconditions: [
    'Usuário autenticado (consumidorId disponível no contexto do chat)',
  ],

  input: {},

  output: {
    tipo: {
      type: 'literal',
      value: 'pedidos',
      required: true,
    },
    dados: {
      type: 'PedidoResumo[]',
      required: true,
      description: 'Até 5 pedidos mais recentes do usuário',
      items: {
        id: 'uuid — ID do pedido',
        loja: 'string — nome da loja',
        status: "enum: 'aguardando' | 'confirmado' | 'em_preparo' | 'saiu_entrega' | 'entregue' | 'cancelado'",
        total: 'number (R$)',
        itens: 'string[] — ex: ["Camiseta M x1", "Tênis 42 x2"]',
        criadoEm: 'ISO datetime',
      },
    },
  },

  examples: [
    {
      description: 'Usuário pergunta sobre o status do pedido — retorna últimos 5',
      input: {},
      output: {
        tipo: 'pedidos',
        dados: [
          {
            id: 'ped_abc123',
            loja: 'SportCenter Aracaju',
            status: 'em_preparo',
            total: 329.8,
            itens: ['Tênis Running Pro x1', 'Meia Esportiva x2'],
            criadoEm: '2026-05-27T10:00:00Z',
          },
          {
            id: 'ped_def456',
            loja: 'Salgaderia do Zé',
            status: 'entregue',
            total: 48.0,
            itens: ['Coxinha Catupiry (6 unid) x2'],
            criadoEm: '2026-05-25T14:30:00Z',
          },
        ],
      },
    },
    {
      description: 'Usuário sem pedidos cadastrados',
      input: {},
      output: {
        tipo: 'pedidos',
        dados: [],
      },
    },
    {
      description: 'Usuário com 1 pedido aguardando pagamento',
      input: {},
      output: {
        tipo: 'pedidos',
        dados: [
          {
            id: 'ped_ghi789',
            loja: 'Moda Sergipe',
            status: 'aguardando',
            total: 89.9,
            itens: ['Camiseta Regata x1'],
            criadoEm: '2026-05-27T09:00:00Z',
          },
        ],
      },
    },
  ],

  errors: [
    { code: 'DB_ERROR', statusCode: 500, message: 'Erro ao consultar pedidos do usuário' },
  ],

  sideEffects: [
    'Nenhum efeito colateral — operação somente de leitura',
  ],
} satisfies ToolSpec;
