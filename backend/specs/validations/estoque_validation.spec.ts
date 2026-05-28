import type { ValidationSpec } from '../types';

export const estoqueValidationSpec = {
  name: 'estoque_validation',
  description: 'Validações de estoque durante o checkout e gerenciamento de produtos. Inclui lógica de estoque por variação.',

  rules: [
    { field: 'produto.estoque', type: 'number int', required: true, constraints: ['>= 0', 'Para produtos COM variações: calculado como soma de VariacaoProduto.estoque', 'Para produtos SEM variações: estoque direto no Produto'] },
    { field: 'variacaoProduto.estoque', type: 'number int', required: true, constraints: ['>= 0', 'Decrementado atomicamente na transação do pedido', 'Se zerar: Produto.disponivel = false'] },
    { field: 'checkout.quantidade', type: 'number int', required: true, constraints: ['Positivo (>0)', 'Se variacaoId: variacao.estoque >= quantidade', 'Se sem variacaoId: produto.estoque >= quantidade'] },
  ],

  examples: [
    {
      description: 'Válido: produto sem variação com estoque suficiente',
      valid: { produto: { estoque: 10 }, item: { quantidade: 3 } },
    },
    {
      description: 'Válido: produto COM variação, estoque na variação suficiente',
      valid: {
        produto: { id: 'prod_camiseta', estoque: 15 },
        variacao: { id: 'var_M', nome: 'M', estoque: 5 },
        item: { produtoId: 'prod_camiseta', variacaoId: 'var_M', quantidade: 2 },
      },
    },
    {
      description: 'Inválido: estoque da variação insuficiente',
      invalid: {
        produto: { id: 'prod_camiseta', estoque: 15 },
        variacao: { id: 'var_P', nome: 'P', estoque: 1 },
        item: { produtoId: 'prod_camiseta', variacaoId: 'var_P', quantidade: 3 },
      },
      error: 'Estoque insuficiente para variação P (disponível: 1, solicitado: 3)',
    },
    {
      description: 'Efeito pós-compra: estoque da variação M zerou → produto indisponível',
      valid: {
        antes: { produto: { estoque: 5, disponivel: true }, variacoes: [{ nome: 'M', estoque: 5 }] },
        comprou: [{ variacaoId: 'var_M', quantidade: 5 }],
        depois: { produto: { estoque: 0, disponivel: false }, variacoes: [{ nome: 'M', estoque: 0 }] },
      },
    },
    {
      description: 'Efeito pós-compra: produto COM múltiplas variações — apenas uma zerou',
      valid: {
        antes: { produto: { estoque: 10, disponivel: true }, variacoes: [{ nome: 'P', estoque: 5 }, { nome: 'M', estoque: 5 }] },
        comprou: [{ variacaoId: 'var_P', quantidade: 5 }],
        depois: { produto: { estoque: 5, disponivel: true }, variacoes: [{ nome: 'P', estoque: 0 }, { nome: 'M', estoque: 5 }] },
      },
    },
  ],
} satisfies ValidationSpec;
