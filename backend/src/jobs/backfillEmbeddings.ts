import { prisma } from '../utils/prisma';
import { embedirProduto } from '../utils/embeddings';

export async function backfillEmbeddings(): Promise<void> {
  const sem_embedding = await prisma.$queryRaw<{ id: string }[]>`
    SELECT id FROM "produtos" WHERE embedding IS NULL AND disponivel = true
  `;

  if (sem_embedding.length === 0) {
    console.log('[backfill] todos os produtos já têm embedding');
    return;
  }

  console.log(`[backfill] ${sem_embedding.length} produto(s) sem embedding — iniciando...`);

  for (const { id } of sem_embedding) {
    try {
      await embedirProduto(id);
      console.log(`[backfill] ✓ ${id}`);
    } catch (err) {
      console.error(`[backfill] ✗ ${id}:`, err);
    }
  }

  console.log('[backfill] concluído');
}
