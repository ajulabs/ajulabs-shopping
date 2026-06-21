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

// Tamanhos genéricos para fallback quando produto não tem variações cadastradas
const TAMANHOS_POR_CATEGORIA: Record<string, string[]> = {
  roupa: ['PP', 'P', 'M', 'G', 'GG', 'GGG'],
  calcado: ['36', '37', '38', '39', '40', '41', '42', '43'],
  esporte: ['PP', 'P', 'M', 'G', 'GG', 'GGG'],
};

// Dentro de "Esporte" só vestuário usa numeração de roupa. Bola e equipamentos
// (raquete, luva, etc.) vinham herdando PP..GGG porque a categoria salva é uma
// modalidade ("Esporte - Futebol"); decidimos pelo nome do produto.
function esporteUsaTamanhoRoupa(nome: string): boolean {
  const n = nome.toLowerCase();
  if (/\bbolas?\b/.test(n)) return false;
  if (
    /\b(roupa|uniforme|camisa|camiseta|regata|short|bermuda|calca|calça|calcao|calção|meiao|meião|agasalho|moletom|legging|jaqueta|blusa|top)\b/.test(
      n,
    )
  ) {
    return true;
  }
  return false;
}

export function categoriaTamanho(categoria: string, nome = ''): string[] | null {
  const c = categoria.toLowerCase();
  // Calçado é checado ANTES de roupa: "calçados" contém a substring "calça"
  // (usada para detectar calças/pants), então a ordem inversa classificaria
  // todo calçado como roupa e mostraria PP/P/M/G em vez da numeração.
  if (
    c.includes('calçado') ||
    c.includes('tênis') ||
    c.includes('sapato') ||
    c.includes('chinelo') ||
    c.includes('sandália')
  ) {
    return TAMANHOS_POR_CATEGORIA.calcado;
  }
  if (
    c.includes('roupa') ||
    c.includes('camisa') ||
    c.includes('camiseta') ||
    c.includes('calça') ||
    c.includes('blusa') ||
    c.includes('moletom')
  ) {
    return TAMANHOS_POR_CATEGORIA.roupa;
  }
  if (c.includes('esporte') || c.includes('academia') || c.includes('futebol')) {
    return esporteUsaTamanhoRoupa(nome) ? TAMANHOS_POR_CATEGORIA.esporte : null;
  }
  return null;
}
