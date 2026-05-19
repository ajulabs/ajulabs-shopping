import OpenAI from 'openai';
import { prisma } from './prisma';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

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
  };
}

export async function buscarProdutosRAG(mensagem: string, limit = 8): Promise<ProdutoRAG[]> {
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: mensagem,
  });

  const vetor = `[${response.data[0].embedding.join(',')}]`;

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
       l.avaliacao
     FROM "produtos" p
     JOIN "lojas" l ON l.id = p.loja_id
     WHERE p.disponivel = true
       AND l.aberta     = true
       AND p.embedding  IS NOT NULL
     ORDER BY p.embedding <=> $1::vector
     LIMIT $2`,
    vetor,
    limit,
  );

  return rows.map(mapRow);
}

// Fallback por keyword quando o índice vetorial está vazio (sem embeddings ainda)
export async function buscarProdutosFallback(texto: string, limit = 3): Promise<ProdutoRAG[]> {
  const palavras = texto.trim().split(/\s+/).filter(p => p.length > 2);
  if (palavras.length === 0) return [];

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
       l.avaliacao
     FROM "produtos" p
     JOIN "lojas" l ON l.id = p.loja_id
     WHERE p.disponivel = true
       AND l.aberta = true
       AND (
         ${palavras.map((_, i) => `p.nome ILIKE $${i + 1} OR p.categoria ILIKE $${i + 1} OR p.descricao ILIKE $${i + 1}`).join(' OR ')}
       )
     LIMIT $${palavras.length + 1}`,
    ...palavras.map(p => `%${p}%`),
    limit,
  );

  return rows.map(mapRow);
}
