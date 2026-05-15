import OpenAI from 'openai';
import { prisma } from './prisma';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function embedirProduto(produtoId: string): Promise<void> {
  const produto = await prisma.produto.findUnique({
    where: { id: produtoId },
    select: { nome: true, descricao: true, categoria: true, tags: true },
  });

  if (!produto) return;

  const texto = [produto.nome, produto.descricao, produto.categoria, ...produto.tags]
    .filter(Boolean)
    .join(' ');

  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: texto,
  });

  const vetor = `[${response.data[0].embedding.join(',')}]`;

  await prisma.$executeRawUnsafe(
    `UPDATE "produtos" SET embedding = $1::vector WHERE id::text = $2`,
    vetor,
    produtoId,
  );
}
