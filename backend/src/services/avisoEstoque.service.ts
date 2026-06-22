import { prisma } from '../utils/prisma';
import { enviarPushParaConsumidor } from '../lib/pushSender';
import { logger } from '../lib/logger';

export async function inscreverAvisoEstoque(
  produtoId: string,
  consumidorId: string,
): Promise<void> {
  await prisma.produtoAvisoEstoque.upsert({
    where: { produtoId_consumidorId: { produtoId, consumidorId } },
    create: { produtoId, consumidorId },
    update: {},
  });
}

export async function cancelarAvisoEstoque(produtoId: string, consumidorId: string): Promise<void> {
  await prisma.produtoAvisoEstoque.deleteMany({
    where: { produtoId, consumidorId },
  });
}

export async function temAvisoEstoque(produtoId: string, consumidorId: string): Promise<boolean> {
  const existente = await prisma.produtoAvisoEstoque.findUnique({
    where: { produtoId_consumidorId: { produtoId, consumidorId } },
    select: { id: true },
  });
  return existente !== null;
}

export async function dispararAvisosRestock(produtoId: string): Promise<void> {
  const produto = await prisma.produto.findUnique({
    where: { id: produtoId },
    select: { nome: true, loja: { select: { nome: true } } },
  });
  if (!produto) return;

  const inscritos = await prisma.produtoAvisoEstoque.findMany({
    where: { produtoId },
    select: { consumidorId: true },
  });
  if (inscritos.length === 0) return;

  await prisma.produtoAvisoEstoque.deleteMany({ where: { produtoId } });

  const lojaNome = produto.loja?.nome ?? 'a loja';
  logger.info({ produtoId, total: inscritos.length }, '[restock] disparando avisos para inscritos');

  await Promise.all(
    inscritos.map((i) =>
      enviarPushParaConsumidor(i.consumidorId, {
        title: 'Voltou ao estoque 🎉',
        body: `${produto.nome} já está disponível em ${lojaNome}. Corra e garanta!`,
        data: { type: 'produto:restock', produtoId },
        categoria: 'produto_restock',
      }).catch((err) =>
        logger.warn(
          { err, consumidorId: i.consumidorId, produtoId },
          '[restock] falha ao notificar consumidor',
        ),
      ),
    ),
  );
}
