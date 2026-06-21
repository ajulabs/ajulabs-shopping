import { useEffect } from 'react';
import { syncVariacoes, VariacaoEstoque } from '../../../../entities/produto';
import { TipoProdutoValue } from './tipoProdutos';
import { gerarCombinacoes } from './variacoesProduto';

/**
 * Re-gera as variações de estoque quando o tipo de produto muda, preservando
 * os valores já preenchidos das combinações que permanecem.
 */
export function useProdutoVariacoes(
  tipoProduto: TipoProdutoValue | null,
  variacoesEstoque: VariacaoEstoque[],
  onChange: (v: VariacaoEstoque[]) => void,
) {
  useEffect(() => {
    const nomes = gerarCombinacoes(tipoProduto);
    if (nomes.length === 0 && variacoesEstoque.length === 0) return;
    const synced = syncVariacoes(nomes, variacoesEstoque);
    // só chama se realmente mudou
    const mudou =
      synced.length !== variacoesEstoque.length ||
      synced.some((v, i) => v.nome !== variacoesEstoque[i]?.nome);
    if (mudou) onChange(synced);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tipoProduto]);
}
