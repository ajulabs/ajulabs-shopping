import OpenAI from 'openai';
import { prisma } from './prisma';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export type VariacaoRAG = {
  id: string;
  nome: string;
  preco: number | null;
};

export type ProdutoRAG = {
  id: string;
  lojaId: string;
  nome: string;
  preco: number;
  categoria: string;
  imagemUrl: string;
  tags: string[];
  loja: string;
  tempoEntrega: string;
  taxaEntrega: number;
  avaliacao: number;
  variacoes: VariacaoRAG[];
};

type RawRow = {
  id: string;
  loja_id: string;
  nome: string;
  preco: unknown;
  categoria: string;
  imagem_url: string;
  tags: string[];
  loja_nome: string;
  loja_categoria: string;
  tempo_entrega_min: number;
  tempo_entrega_max: number;
  taxa_entrega: unknown;
  avaliacao: unknown;
  variacoes: { id: string; nome: string; preco: string | null }[];
};

function mapRow(r: RawRow): ProdutoRAG {
  return {
    id: r.id,
    lojaId: r.loja_id,
    nome: r.nome,
    preco: Number(r.preco),
    categoria: r.categoria,
    imagemUrl: r.imagem_url ?? '',
    tags: r.tags ?? [],
    loja: `${r.loja_nome}${r.loja_categoria ? ` — ${r.loja_categoria}` : ''}`,
    tempoEntrega: `${r.tempo_entrega_min}–${r.tempo_entrega_max} min`,
    taxaEntrega: Number(r.taxa_entrega),
    avaliacao: Number(r.avaliacao),
    variacoes: Array.isArray(r.variacoes)
      ? r.variacoes.map((v) => ({
          id: v.id,
          nome: v.nome,
          preco: v.preco != null ? Number(v.preco) : null,
        }))
      : [],
  };
}

export type BuscaOpts = {
  limit?: number;
  lojaId?: string;
  precoMax?: number;
  precoMin?: number;
};

/**
 * Remove expressões de preço/orçamento do texto antes de gerar o embedding.
 * "Tênis até R$200" → "Tênis" — o valor dilui o sinal semântico do produto.
 * Fallback para o texto original se a limpeza resultar em string muito curta.
 */
function limparQueryBusca(texto: string): string {
  const limpo = texto
    // "até R$200", "no máximo 150 reais", "por 50 conto"
    .replace(
      /\b(at[ée]|abaixo\s+de|no\s+m[áa]ximo|m[áa]x(?:imo)?|por|menos\s+de|acima\s+de|a\s+partir\s+de)\b\s*r?\$?\s*\d+(?:[.,]\d+)?\s*(?:reais?|conto|pila)?/gi,
      ' ',
    )
    // "R$ 200", "R$200"
    .replace(/r\$\s*\d+(?:[.,]\d+)?/gi, ' ')
    // "200 reais", "50 conto", "100 pila"
    .replace(/\b\d+(?:[.,]\d+)?\s*(?:reais?|conto|pila)\b/gi, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim();

  // Não usa a versão limpa se ficou curta demais (ex: "R$200" sozinho → fallback para original)
  return limpo.length >= 2 ? limpo : texto;
}

export async function buscarProdutosRAG(
  mensagem: string,
  opts: BuscaOpts = {},
): Promise<ProdutoRAG[]> {
  const { limit = 8, lojaId, precoMax, precoMin } = opts;

  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: limparQueryBusca(mensagem),
  });

  const vetor = `[${response.data[0].embedding.join(',')}]`;

  // $1 é sempre o vetor. Filtros opcionais entram a seguir; LIMIT sempre é o último parâmetro.
  const params: unknown[] = [vetor];
  const conds: string[] = [
    'p.disponivel = true',
    'l.aberta = true',
    'p.embedding IS NOT NULL',
    '(p.embedding <=> $1::vector) < 0.75',
  ];

  if (lojaId) {
    params.push(lojaId);
    conds.push(`p.loja_id = $${params.length}`);
  }
  if (precoMax != null && precoMax > 0) {
    params.push(precoMax);
    conds.push(`p.preco <= $${params.length}`);
  }
  if (precoMin != null && precoMin > 0) {
    params.push(precoMin);
    conds.push(`p.preco >= $${params.length}`);
  }

  params.push(limit);
  const limitIdx = params.length;

  const rows = await prisma.$queryRawUnsafe<RawRow[]>(
    `SELECT
       p.id,
       p.loja_id,
       p.nome,
       p.preco,
       p.categoria,
       p.imagem_url,
       p.tags,
       l.nome          AS loja_nome,
       l.categoria     AS loja_categoria,
       l.tempo_entrega_min,
       l.tempo_entrega_max,
       l.taxa_entrega,
       l.avaliacao,
       COALESCE(
         json_agg(json_build_object('id', v.id, 'nome', v.nome, 'preco', v.preco))
         FILTER (WHERE v.id IS NOT NULL),
         '[]'::json
       ) AS variacoes
     FROM "produtos" p
     JOIN "lojas" l ON l.id = p.loja_id
     LEFT JOIN "variacoes_produto" v ON v.produto_id = p.id
     WHERE ${conds.join(' AND ')}
     GROUP BY p.id, l.id
     ORDER BY p.embedding <=> $1::vector
     LIMIT $${limitIdx}`,
    ...params,
  );

  return rows.map(mapRow);
}

// Fallback por keyword quando o índice vetorial está vazio (sem embeddings ainda)
export async function buscarProdutosFallback(
  texto: string,
  opts: { limit?: number; precoMax?: number; precoMin?: number } = {},
): Promise<ProdutoRAG[]> {
  const { limit = 3, precoMax, precoMin } = opts;

  // Limpa preço do texto antes de extrair palavras-chave
  const palavras = limparQueryBusca(texto)
    .split(/\s+/)
    .filter((p) => p.length > 2);
  if (palavras.length === 0) return [];

  const params: unknown[] = palavras.map((p) => `%${p}%`);
  const likeClause = palavras
    .map(
      (_, i) =>
        `p.nome ILIKE $${i + 1} OR p.categoria ILIKE $${i + 1} OR p.descricao ILIKE $${i + 1}`,
    )
    .join(' OR ');

  const extraConds: string[] = [];
  if (precoMax != null && precoMax > 0) {
    params.push(precoMax);
    extraConds.push(`p.preco <= $${params.length}`);
  }
  if (precoMin != null && precoMin > 0) {
    params.push(precoMin);
    extraConds.push(`p.preco >= $${params.length}`);
  }

  params.push(limit);
  const limitIdx = params.length;

  const rows = await prisma.$queryRawUnsafe<RawRow[]>(
    `SELECT
       p.id,
       p.loja_id,
       p.nome,
       p.preco,
       p.categoria,
       p.imagem_url,
       p.tags,
       l.nome          AS loja_nome,
       l.categoria     AS loja_categoria,
       l.tempo_entrega_min,
       l.tempo_entrega_max,
       l.taxa_entrega,
       l.avaliacao,
       COALESCE(
         json_agg(json_build_object('id', v.id, 'nome', v.nome, 'preco', v.preco))
         FILTER (WHERE v.id IS NOT NULL),
         '[]'::json
       ) AS variacoes
     FROM "produtos" p
     JOIN "lojas" l ON l.id = p.loja_id
     LEFT JOIN "variacoes_produto" v ON v.produto_id = p.id
     WHERE p.disponivel = true
       AND l.aberta = true
       AND (${likeClause})
       ${extraConds.length ? `AND ${extraConds.join(' AND ')}` : ''}
     GROUP BY p.id, l.id
     LIMIT $${limitIdx}`,
    ...params,
  );

  return rows.map(mapRow);
}

/** Direct store product listing — bypasses RAG for precise store-filtered results. */
export async function buscarProdutosPorLoja(lojaId: string, limit = 8): Promise<ProdutoRAG[]> {
  const rows = await prisma.$queryRawUnsafe<RawRow[]>(
    `SELECT
       p.id,
       p.loja_id,
       p.nome,
       p.preco,
       p.categoria,
       p.imagem_url,
       p.tags,
       l.nome          AS loja_nome,
       l.categoria     AS loja_categoria,
       l.tempo_entrega_min,
       l.tempo_entrega_max,
       l.taxa_entrega,
       l.avaliacao,
       COALESCE(
         json_agg(json_build_object('id', v.id, 'nome', v.nome, 'preco', v.preco))
         FILTER (WHERE v.id IS NOT NULL),
         '[]'::json
       ) AS variacoes
     FROM "produtos" p
     JOIN "lojas" l ON l.id = p.loja_id
     LEFT JOIN "variacoes_produto" v ON v.produto_id = p.id
     WHERE p.disponivel = true
       AND l.aberta     = true
       AND p.loja_id    = $1
     GROUP BY p.id, l.id
     ORDER BY p.destaque DESC, p.preco ASC
     LIMIT $2`,
    lojaId,
    limit,
  );

  return rows.map(mapRow);
}
