import { Produto } from '@ajulabs/types';
import { TIPOS_PRODUTO, TipoProdutoValue, EspecConfig, inferirTipoProduto } from './tipoProdutos';

/**
 * Geração e reconstrução de variações de produto a partir do catálogo de tipos
 * (`tipoProdutos`). Permanece na feature porque depende do catálogo local.
 */

function getMultiSpecs(tipoProduto: TipoProdutoValue | null): EspecConfig[] {
  if (!tipoProduto?.catId || !tipoProduto?.subcatId) return [];
  const cat = TIPOS_PRODUTO.find((c) => c.id === tipoProduto.catId);
  const subcat = cat?.subcats.find((s) => s.id === tipoProduto.subcatId);
  const tipoSelecionado = tipoProduto.specs['tipo']?.[0];
  return (subcat?.specs ?? []).filter(
    (s) =>
      s.multiplo &&
      (!s.hideForTipos || !tipoSelecionado || !s.hideForTipos.includes(tipoSelecionado)),
  );
}

export function gerarCombinacoes(tipoProduto: TipoProdutoValue | null): string[] {
  const multiSpecs = getMultiSpecs(tipoProduto);
  if (!tipoProduto) return [];
  const eixos = multiSpecs
    .map((s) => tipoProduto.specs[s.id] ?? [])
    .filter((vals) => vals.length > 0);
  if (eixos.length === 0) return [];
  let combos: string[][] = [[]];
  for (const vals of eixos) {
    combos = combos.flatMap((combo) => vals.map((v) => [...combo, v]));
  }
  // Só há variações reais com mais de uma combinação. Com um único valor por
  // eixo (ex: 1 cor + 1 tamanho) o produto é único e usa o estoque global.
  if (combos.length <= 1) return [];
  return combos.map((combo) => combo.join(' · '));
}

export function getMissingSpecs(tipoProduto: TipoProdutoValue | null): string[] {
  if (!tipoProduto?.catId || !tipoProduto?.subcatId) return [];
  const cat = TIPOS_PRODUTO.find((c) => c.id === tipoProduto.catId);
  const subcat = cat?.subcats.find((s) => s.id === tipoProduto.subcatId);
  const tipoSelecionado = tipoProduto.specs['tipo']?.[0];
  return (subcat?.specs ?? [])
    .filter((spec) => {
      if (spec.hideForTipos && tipoSelecionado && spec.hideForTipos.includes(tipoSelecionado))
        return false;
      return (tipoProduto.specs[spec.id] ?? []).length === 0;
    })
    .map((spec) => spec.id);
}

/**
 * Infers the product type and reconstructs the selected spec values
 * (sizes, colors, etc.) by parsing the existing variation names.
 * Variation names use ' · ' as separator between spec axes, e.g. "P · Preto".
 */
export function reconstruirTipoProduto(produto: Produto): TipoProdutoValue | null {
  const base = inferirTipoProduto({ categoria: produto.categoria });
  if (!base) return null;

  const cat = TIPOS_PRODUTO.find((c) => c.id === base.catId);
  const subcat = cat?.subcats.find((s) => s.id === base.subcatId);
  const specs: Record<string, string[]> = { ...base.specs };

  // 1) Specs multiplo (tamanho, cor): reconstruídos pelos nomes das variações,
  // que usam ' · ' como separador entre eixos (ex.: "P · Preto").
  const variacoes = produto.variacoes ?? [];
  const multiSpecs = (subcat?.specs ?? []).filter((s) => s.multiplo);
  if (variacoes.length && multiSpecs.length) {
    const specsMap: Record<string, Set<string>> = {};
    for (const v of variacoes) {
      v.nome.split(' · ').forEach((parte, idx) => {
        const spec = multiSpecs[idx];
        if (!spec) return;
        if (!specsMap[spec.id]) specsMap[spec.id] = new Set();
        specsMap[spec.id].add(parte);
      });
    }
    for (const [id, vals] of Object.entries(specsMap)) {
      if (vals.size > 0) specs[id] = Array.from(vals);
    }
  }

  // 2) Specs single-select (ex.: "tipo" de peça) não viram variação e só existem
  // na string de categoria. Quando não vieram de lá (dados legados ou categoria
  // da IA em outro formato), tenta inferir pelo NOME do produto como reforço —
  // ex.: "Camisa Polo Azul" → tipo "Camisa". O \b evita casar "Camisa" dentro de
  // "Camiseta" e "Calça" dentro de "Calçado".
  const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  const nomeNorm = norm(produto.nome ?? '');
  if (nomeNorm) {
    for (const spec of (subcat?.specs ?? []).filter((s) => !s.multiplo)) {
      if (specs[spec.id]?.length) continue; // já resolvido pela categoria
      const match = spec.opcoes.find(
        (opt) => opt !== 'Outro' && new RegExp(`\\b${norm(opt)}\\b`).test(nomeNorm),
      );
      if (match) specs[spec.id] = [match];
    }
  }

  return { ...base, specs };
}
