import { VariacaoProduto } from '@ajulabs/types';

export interface Eixo {
  label: string;
  valores: string[];
}

const TAMANHOS_SET = new Set(['PP', 'P', 'M', 'G', 'GG', 'GGG', 'XS', 'S', 'L', 'XL', 'XXL']);
const CORES_SET = new Set([
  'Preto',
  'Branco',
  'Azul',
  'Vermelho',
  'Verde',
  'Rosa',
  'Amarelo',
  'Cinza',
  'Marrom',
  'Roxo',
  'Laranja',
  'Bege',
  'Nude',
  'Prata',
  'Dourado',
  'Marinho',
  'Coral',
  'Creme',
  'Vinho',
  'Khaki',
  'Inox',
]);

function inferirLabel(valores: string[]): string {
  if (valores.some((v) => TAMANHOS_SET.has(v) || /^\d{2,3}(GB|TB|ml|L)?$/.test(v)))
    return 'Tamanho';
  if (valores.some((v) => CORES_SET.has(v))) return 'Cor';
  return 'Opção';
}

export function extrairEixos(variacoes: VariacaoProduto[]): Eixo[] {
  if (variacoes.length === 0) return [];
  const partes = variacoes.map((v) => v.nome.split(' · '));
  const numEixos = Math.max(...partes.map((p) => p.length));
  const eixos: Eixo[] = [];
  for (let i = 0; i < numEixos; i++) {
    const valores = [...new Set(partes.map((p) => p[i]).filter(Boolean))];
    if (valores.length > 0) eixos.push({ label: inferirLabel(valores), valores });
  }
  return eixos;
}

export function encontrarVariacao(
  variacoes: VariacaoProduto[],
  selecao: (string | null)[],
): VariacaoProduto | null {
  if (selecao.some((v) => v === null)) return null;
  const nomeAlvo = selecao.join(' · ');
  return variacoes.find((v) => v.nome === nomeAlvo) ?? null;
}
