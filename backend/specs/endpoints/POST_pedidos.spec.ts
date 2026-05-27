import type { EndpointSpec } from '../types';

export const postPedidosSpec = {
  name: 'POST_pedidos',
  method: 'POST',
  path: '/pedidos',
  description:
    'Cria novo pedido com validação de estoque por variação. ' +
    'Calcula total com desconto de 5% para pagamento via PIX. ' +
    'Decrementa estoque atomicamente em transação.',
  auth: 'usuario',

  preconditions: [
    'Usuário autenticado como consumidor',
    'Todos os produtos existem e estão disponíveis',
    'Estoque suficiente (por variação se produto tem variações)',
    'Loja existe',
    'enderecoEntregaId pertence ao usuário autenticado',
  ],

  input: {
    lojaId: { type: 'string', required: true, constraints: ['uuid', 'loja deve existir'] },
    enderecoEntregaId: { type: 'string', required: true, constraints: ['uuid', 'pertence ao usuário'] },
    metodoPagamento: { type: 'enum', required: true, constraints: ["'pix' | 'cartao'"] },
    obs: { type: 'string', required: false, constraints: ['observações opcionais'] },
    itens: {
      type: 'array',
      required: true,
      constraints: ['min 1 item'],
      items: {
        produtoId: 'string (uuid, obrigatório)',
        quantidade: 'number (int, min 1)',
        variacaoId: 'string? (uuid, obrigatório se produto tem variações)',
      },
    },
  },

  output: {
    pedido: {
      id: 'uuid',
      status: "string ('aguardando')",
      subtotal: 'number (R$)',
      taxaEntrega: 'number (R$)',
      desconto: 'number (R$ — 5% se PIX)',
      total: 'number (R$)',
      metodoPagamento: "'pix' | 'cartao'",
      codigoEntrega: 'string (4 dígitos — últimos 4 do telefone ou aleatório)',
      criadoEm: 'ISO datetime',
      itens: [
        {
          id: 'uuid',
          produtoId: 'uuid',
          nomeSnapshot: 'string',
          precoUnitario: 'number',
          quantidade: 'number',
          variacaoId: 'uuid | null',
          variacaoNome: 'string | null',
        },
      ],
      loja: { id: 'uuid', nome: 'string' },
    },
  },

  examples: [
    {
      description: 'Pedido com 2 produtos: 1 com variação (camiseta M) e 1 sem variação, pagamento PIX',
      input: {
        lojaId: 'loja_xyz789',
        enderecoEntregaId: 'end_abc123',
        metodoPagamento: 'pix',
        itens: [
          { produtoId: 'prod_camiseta', variacaoId: 'var_tam_M', quantidade: 1 },
          { produtoId: 'prod_tenis', quantidade: 1 },
        ],
      },
      output: {
        pedido: {
          id: 'ped_abc123',
          status: 'aguardando',
          subtotal: 189.8,
          taxaEntrega: 5.0,
          desconto: 9.49,
          total: 185.31,
          metodoPagamento: 'pix',
          codigoEntrega: '8888',
          criadoEm: '2026-05-27T14:30:00Z',
          itens: [
            { id: 'item_1', produtoId: 'prod_camiseta', nomeSnapshot: 'Camiseta Básica', precoUnitario: 39.9, quantidade: 1, variacaoId: 'var_tam_M', variacaoNome: 'M' },
            { id: 'item_2', produtoId: 'prod_tenis', nomeSnapshot: 'Tênis Running', precoUnitario: 149.9, quantidade: 1, variacaoId: null, variacaoNome: null },
          ],
          loja: { id: 'loja_xyz789', nome: 'SportCenter Aracaju' },
        },
      },
    },
    {
      description: 'Produto sem estoque — pedido rejeitado',
      input: {
        lojaId: 'loja_xyz789',
        enderecoEntregaId: 'end_abc123',
        metodoPagamento: 'cartao',
        itens: [{ produtoId: 'prod_esgotado', quantidade: 2 }],
      },
      output: {
        error: 'Estoque insuficiente',
        produtos: [{ id: 'prod_esgotado', nome: 'Produto Esgotado', variacaoNome: undefined, estoqueDisponivel: 0 }],
      },
    },
    {
      description: 'Pedido de salgados com pagamento em cartão — sem desconto PIX',
      input: {
        lojaId: 'loja_salgados',
        enderecoEntregaId: 'end_def456',
        metodoPagamento: 'cartao',
        obs: 'Sem pimenta, por favor',
        itens: [{ produtoId: 'prod_coxinha', quantidade: 6 }],
      },
      output: {
        pedido: {
          id: 'ped_def456',
          status: 'aguardando',
          subtotal: 24.0,
          taxaEntrega: 4.0,
          desconto: 0,
          total: 28.0,
          metodoPagamento: 'cartao',
          codigoEntrega: '7777',
          criadoEm: '2026-05-27T15:00:00Z',
          itens: [
            { id: 'item_3', produtoId: 'prod_coxinha', nomeSnapshot: 'Coxinha Catupiry (6 unid)', precoUnitario: 4.0, quantidade: 6, variacaoId: null, variacaoNome: null },
          ],
          loja: { id: 'loja_salgados', nome: 'Salgaderia do Zé' },
        },
      },
    },
  ],

  errors: [
    { code: 'UNAUTHORIZED', statusCode: 401, message: 'Usuário não autenticado' },
    { code: 'PRODUTO_NAO_ENCONTRADO', statusCode: 400, message: 'Um ou mais produtos não encontrados' },
    { code: 'PRODUTO_INDISPONIVEL', statusCode: 400, message: 'Produto marcado como indisponível' },
    { code: 'ESTOQUE_INSUFICIENTE', statusCode: 400, message: 'Estoque insuficiente para o item solicitado' },
    { code: 'LOJA_NAO_ENCONTRADA', statusCode: 404, message: 'Loja não encontrada' },
    { code: 'VALIDATION_ERROR', statusCode: 400, message: 'Dados inválidos (Zod)' },
    { code: 'SERVER_ERROR', statusCode: 500, message: 'Erro ao criar pedido' },
  ],

  sideEffects: [
    'Cria registro em Pedido com status "aguardando"',
    'Cria registros em ItemPedido para cada item',
    'Cria registro em Pagamento com status "pendente"',
    'Cria registro em HistoricoPedido com status "aguardando"',
    'Decrementa VariacaoProduto.estoque para cada item com variacaoId',
    'Recalcula e atualiza Produto.estoque como soma das variações',
    'Se estoque zera, marca Produto.disponivel = false',
    'Emite WebSocket pedido:novo para sala loja:{lojaId}',
    'Dispara push notification para o lojista (assíncrono)',
  ],
} satisfies EndpointSpec;
