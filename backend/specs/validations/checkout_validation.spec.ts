import type { ValidationSpec } from '../types';

export const checkoutValidationSpec = {
  name: 'checkout_validation',
  description:
    'Validações do fluxo de checkout (POST /pedidos): verifica produtos, estoque, variações e calcula total com descontos.',

  rules: [
    { field: 'lojaId', type: 'string (uuid)', required: true, constraints: ['Loja deve existir no banco'] },
    { field: 'enderecoEntregaId', type: 'string (uuid)', required: true, constraints: ['Endereço deve pertencer ao consumidor autenticado'] },
    { field: 'metodoPagamento', type: 'enum', required: true, constraints: ["Deve ser 'pix' ou 'cartao'"] },
    { field: 'itens', type: 'array', required: true, constraints: ['min 1 item', 'todos os produtoIds devem existir', 'todos os produtos devem estar disponivel=true'] },
    { field: 'itens[].produtoId', type: 'string (uuid)', required: true, constraints: ['Produto deve existir'] },
    { field: 'itens[].quantidade', type: 'number int', required: true, constraints: ['Positivo (>0)', 'Menor ou igual ao estoque disponível'] },
    { field: 'itens[].variacaoId', type: 'string (uuid)', required: false, constraints: ['Se produto tem variações, variacaoId deve ser fornecido', 'variacaoId deve pertencer ao produto', 'estoque da variação >= quantidade'] },
  ],

  examples: [
    {
      description: 'Válido: pedido PIX com desconto de 5%',
      valid: {
        lojaId: 'loja_xyz789',
        enderecoEntregaId: 'end_abc123',
        metodoPagamento: 'pix',
        itens: [
          { produtoId: 'prod_camiseta', variacaoId: 'var_M', quantidade: 1 },
        ],
      },
    },
    {
      description: 'Inválido: variacaoId não pertence ao produto',
      invalid: {
        lojaId: 'loja_xyz789',
        enderecoEntregaId: 'end_abc123',
        metodoPagamento: 'cartao',
        itens: [
          { produtoId: 'prod_camiseta', variacaoId: 'var_de_outro_produto', quantidade: 1 },
        ],
      },
      error: 'Variação não encontrada para o produto',
    },
    {
      description: 'Inválido: produto esgotado',
      invalid: {
        itens: [{ produtoId: 'prod_esgotado', quantidade: 5 }],
      },
      error: 'Estoque insuficiente',
    },
    {
      description: 'Inválido: produto indisponível (disponivel=false)',
      invalid: {
        itens: [{ produtoId: 'prod_inativo', quantidade: 1 }],
      },
      error: 'Produtos indisponíveis',
    },
  ],
} satisfies ValidationSpec;

export const checkoutCalculoSpec = {
  name: 'checkout_calculo',
  description: 'Regras de cálculo do total do pedido: subtotal + taxaEntrega - desconto',

  rules: [
    { field: 'subtotal', type: 'number', required: true, constraints: ['soma(produto.preco * quantidade) para todos os itens'] },
    { field: 'taxaEntrega', type: 'number', required: true, constraints: ['loja.taxaEntrega (R$)'] },
    { field: 'desconto', type: 'number', required: true, constraints: ["5% do subtotal se metodoPagamento='pix', senão 0"] },
    { field: 'total', type: 'number', required: true, constraints: ['subtotal + taxaEntrega - desconto'] },
    { field: 'codigoEntrega', type: 'string 4 dígitos', required: true, constraints: ['Últimos 4 dígitos do telefone do consumidor (somente números)', 'Se telefone tiver menos de 4 dígitos: 4 dígitos aleatórios 1000-9999'] },
  ],

  examples: [
    {
      description: 'PIX com desconto: R$100 subtotal + R$5 frete - 5% = R$100',
      valid: { subtotal: 100, taxaEntrega: 5, metodoPagamento: 'pix', desconto: 5, total: 100 },
    },
    {
      description: 'Cartão sem desconto: R$100 subtotal + R$5 frete = R$105',
      valid: { subtotal: 100, taxaEntrega: 5, metodoPagamento: 'cartao', desconto: 0, total: 105 },
    },
  ],
} satisfies ValidationSpec;
