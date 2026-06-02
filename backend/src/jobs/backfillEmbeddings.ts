import { prisma } from '../utils/prisma';
import { embedirProduto } from '../utils/embeddings';
import { logger } from '../lib/logger';

export async function backfillEmbeddings(): Promise<void> {
  const sem_embedding = await prisma.$queryRaw<{ id: string }[]>`
    SELECT id FROM "produtos" WHERE embedding IS NULL AND disponivel = true
  `;

  if (sem_embedding.length === 0) {
    logger.info('[backfill] todos os produtos já têm embedding');
    return;
  }

  logger.info(`[backfill] ${sem_embedding.length} produto(s) sem embedding — iniciando...`);

  for (const { id } of sem_embedding) {
    try {
      await embedirProduto(id);
      logger.info(`[backfill] ✓ ${id}`);
    } catch (err) {
      logger.error({ err }, `[backfill] ✗ ${id}`);
    }
  }

  logger.info('[backfill] concluído');
}
