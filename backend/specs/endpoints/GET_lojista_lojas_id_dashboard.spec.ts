import type { EndpointSpec } from '../types';

export const getLojistaDashboardSpec = {
  name: 'GET_lojista_lojas_id_dashboard',
  method: 'GET',
  path: '/lojista/lojas/:id/dashboard',
  description: 'Retorna métricas do dashboard para o painel do lojista: pedidos hoje, faturamento, produtos mais vendidos.',
  auth: 'lojista',

  preconditions: [
    'Lojista autenticado',
    'lojaId pertence ao lojista autenticado',
  ],

  input: {
    id: { type: 'string', required: true, constraints: ['uuid — path param da loja'] },
  },

  output: {
    pedidosHoje: 'number',
    faturamentoHoje: 'number (R$)',
    pedidosSemana: 'number',
    faturamentoSemana: 'number (R$)',
    pedidosMes: 'number',
    faturamentoMes: 'number (R$)',
    pedidosPorStatus: {
      aguardando: 'number',
      confirmado: 'number',
      em_preparo: 'number',
      pronto: 'number',
      saiu_entrega: 'number',
      entregue: 'number',
      cancelado: 'number',
    },
    produtosMaisVendidos: [
      { produtoId: 'uuid', nome: 'string', totalVendas: 'number', totalReceita: 'number (R$)' },
    ],
  },

  examples: [
    {
      description: 'Dashboard de segunda-feira — pedidos do dia e da semana',
      input: { id: 'loja_xyz789' },
      output: {
        pedidosHoje: 12,
        faturamentoHoje: 1480.5,
        pedidosSemana: 68,
        faturamentoSemana: 8220.0,
        pedidosMes: 240,
        faturamentoMes: 29500.0,
        pedidosPorStatus: { aguardando: 2, confirmado: 1, em_preparo: 3, pronto: 0, saiu_entrega: 2, entregue: 4, cancelado: 0 },
        produtosMaisVendidos: [
          { produtoId: 'prod_tenis', nome: 'Tênis Running Pro', totalVendas: 45, totalReceita: 6745.5 },
          { produtoId: 'prod_camiseta', nome: 'Camiseta Básica', totalVendas: 38, totalReceita: 1516.2 },
        ],
      },
    },
  ],

  errors: [
    { code: 'UNAUTHORIZED', statusCode: 401, message: 'Lojista não autenticado' },
    { code: 'FORBIDDEN', statusCode: 403, message: 'Loja não pertence ao lojista' },
    { code: 'SERVER_ERROR', statusCode: 500, message: 'Erro ao buscar dashboard' },
  ],

  sideEffects: [],
} satisfies EndpointSpec;
