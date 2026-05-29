import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../utils/prisma';
import { authMiddleware, authUsuario, AuthRequest } from '../middleware/auth';
import { logger } from '../lib/logger';

const router = Router();

const avaliacaoPedidoSchema = z.object({
  pedidoId: z.string().uuid(),
  notaLoja: z.number().int().min(1).max(5),
  notaEntregador: z.number().int().min(1).max(5),
  comentarioEntregador: z.string().max(500).optional(),
  avaliacoesProdutos: z
    .array(
      z.object({
        produtoId: z.string().uuid(),
        nota: z.number().int().min(1).max(5),
        comentario: z.string().max(500).optional(),
      }),
    )
    .min(1),
});

router.post('/', authMiddleware, authUsuario, async (req: AuthRequest, res) => {
  try {
    const dados = avaliacaoPedidoSchema.parse(req.body);
    const usuarioId = req.user!.id;

    const pedido = await prisma.pedido.findUnique({
      where: { id: dados.pedidoId },
      include: { itens: { select: { produtoId: true } } },
    });

    if (!pedido) {
      return res.status(404).json({ error: 'Pedido não encontrado' });
    }

    if (pedido.consumidorId !== usuarioId) {
      return res.status(403).json({ error: 'Acesso negado: pedido pertence a outro usuário' });
    }

    if (pedido.status !== 'entregue') {
      return res.status(400).json({ error: 'Só é possível avaliar pedidos com status entregue' });
    }

    if (pedido.avaliado) {
      return res.status(409).json({ error: 'Este pedido já foi avaliado' });
    }

    if (!pedido.entregadorId) {
      return res.status(400).json({ error: 'Pedido sem entregador associado' });
    }

    const produtoIdsNoPedido = new Set(pedido.itens.map((i) => i.produtoId));
    for (const ap of dados.avaliacoesProdutos) {
      if (!produtoIdsNoPedido.has(ap.produtoId)) {
        return res.status(400).json({
          error: `Produto ${ap.produtoId} não pertence a este pedido`,
        });
      }
    }

    const [loja, entregador] = await Promise.all([
      prisma.loja.findUnique({
        where: { id: pedido.lojaId },
        select: { avaliacao: true, totalAvaliacoes: true },
      }),
      prisma.entregador.findUnique({
        where: { id: pedido.entregadorId },
        select: { avaliacao: true, totalAvaliacoes: true },
      }),
    ]);

    if (!loja) return res.status(404).json({ error: 'Loja não encontrada' });
    if (!entregador) return res.status(404).json({ error: 'Entregador não encontrado' });

    const novoTotalLoja = loja.totalAvaliacoes + 1;
    const novaMediaLoja =
      Math.round(
        ((Number(loja.avaliacao) * loja.totalAvaliacoes + dados.notaLoja) / novoTotalLoja) * 10,
      ) / 10;

    const novoTotalEntregador = entregador.totalAvaliacoes + 1;
    const novaMediaEntregador =
      Math.round(
        ((entregador.avaliacao * entregador.totalAvaliacoes + dados.notaEntregador) /
          novoTotalEntregador) *
          10,
      ) / 10;

    const produtosParaAtualizar = await prisma.produto.findMany({
      where: { id: { in: dados.avaliacoesProdutos.map((a) => a.produtoId) } },
      select: { id: true, avaliacao: true, totalAvaliacoes: true },
    });
    const produtoMap = new Map(produtosParaAtualizar.map((p) => [p.id, p]));

    await prisma.$transaction([
      prisma.avaliacaoLoja.create({
        data: {
          lojaId: pedido.lojaId,
          usuarioId,
          pedidoId: dados.pedidoId,
          nota: dados.notaLoja,
        },
      }),
      prisma.loja.update({
        where: { id: pedido.lojaId },
        data: { avaliacao: novaMediaLoja, totalAvaliacoes: novoTotalLoja },
      }),
      prisma.avaliacaoEntregador.create({
        data: {
          entregadorId: pedido.entregadorId,
          usuarioId,
          pedidoId: dados.pedidoId,
          nota: dados.notaEntregador,
          comentario: dados.comentarioEntregador,
        },
      }),
      prisma.entregador.update({
        where: { id: pedido.entregadorId },
        data: { avaliacao: novaMediaEntregador, totalAvaliacoes: novoTotalEntregador },
      }),
      ...dados.avaliacoesProdutos.map((ap) => {
        const prod = produtoMap.get(ap.produtoId)!;
        const novoTotal = prod.totalAvaliacoes + 1;
        const novaMedia =
          Math.round(((prod.avaliacao * prod.totalAvaliacoes + ap.nota) / novoTotal) * 10) / 10;
        return prisma.produto.update({
          where: { id: ap.produtoId },
          data: { avaliacao: novaMedia, totalAvaliacoes: novoTotal },
        });
      }),
      ...dados.avaliacoesProdutos.map((ap) =>
        prisma.avaliacaoProduto.create({
          data: {
            produtoId: ap.produtoId,
            usuarioId,
            pedidoId: dados.pedidoId,
            nota: ap.nota,
            comentario: ap.comentario,
          },
        }),
      ),
      prisma.pedido.update({
        where: { id: dados.pedidoId },
        data: { avaliado: true },
      }),
    ]);

    res.status(201).json({ ok: true });
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: error.errors });
    logger.error({ error }, '[avaliacoes] erro ao criar avaliação');
    res.status(500).json({ error: 'Erro ao criar avaliação' });
  }
});

router.get('/loja/:lojaId', async (req, res) => {
  try {
    const { lojaId } = req.params;

    const loja = await prisma.loja.findUnique({
      where: { id: lojaId },
      select: { id: true, nome: true, avaliacao: true, totalAvaliacoes: true },
    });

    if (!loja) {
      return res.status(404).json({ error: 'Loja não encontrada' });
    }

    const avaliacoes = await prisma.avaliacaoLoja.findMany({
      where: { lojaId },
      orderBy: { criadoEm: 'desc' },
      include: {
        usuario: { select: { id: true, nome: true, avatarUrl: true } },
      },
    });

    res.json({ loja, avaliacoes });
  } catch (error) {
    logger.error({ error }, '[avaliacoes] erro ao buscar avaliações');
    res.status(500).json({ error: 'Erro ao buscar avaliações' });
  }
});

export default router;
