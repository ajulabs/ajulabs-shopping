import { NivelEstoque } from '@ajulabs/types';

/**
 * Classifica o nível de estoque de um produto.
 * Quando há mínimo definido, usa-o como referência (crítico abaixo do mínimo,
 * atenção até o dobro do mínimo); sem mínimo, cai em faixas fixas (10/20).
 */
export function calcNivel(estoque: number, estoqueMinimo = 0): NivelEstoque {
  if (estoque <= 0) return 'zerado';
  if (estoqueMinimo > 0) {
    if (estoque < estoqueMinimo) return 'critico';
    if (estoque < estoqueMinimo * 2) return 'atencao';
    return 'saudavel';
  }
  if (estoque < 10) return 'critico';
  if (estoque < 20) return 'atencao';
  return 'saudavel';
}
