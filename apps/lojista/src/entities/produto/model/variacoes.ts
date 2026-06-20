/** Estoque (e preço opcional) de uma combinação de variação de um produto. */
export interface VariacaoEstoque {
  nome: string;
  estoque: number;
  preco?: number;
}

/**
 * Reconcilia a lista de variações geradas (por nome) com os valores de
 * estoque/preço já preenchidos, preservando o que o lojista informou para as
 * combinações que continuam existindo.
 */
export function syncVariacoes(
  novosTipos: string[],
  anterior: VariacaoEstoque[],
): VariacaoEstoque[] {
  const mapa = Object.fromEntries(
    anterior.map((v) => [v.nome, { estoque: v.estoque, preco: v.preco }]),
  );
  return novosTipos.map((nome) => ({
    nome,
    estoque: mapa[nome]?.estoque ?? 0,
    preco: mapa[nome]?.preco,
  }));
}
