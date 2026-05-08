import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../utils/prisma';
import { authMiddleware, authUsuario, AuthRequest } from '../middleware/auth';

const router = Router();

const criarAvaliacaoSchema = z.object({
  pedidoId: z.string().uuid(),
  nota: z.number().int().min(1).max(5),
  comentario: z.string().max(500).optional(),
});

router.post('/', authMiddleware, authUsuario, async (req: AuthRequest, res) => {
  try {
    const dados = criarAvaliacaoSchema.parse(req.body);
    const usuarioId = req.user!.id;

    const pedido = await prisma.pedido.findUnique({
      where: { id: dados.pedidoId },
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

    const avaliacaoExistente = await prisma.avaliacaoLoja.findUnique({
      where: { pedidoId: dados.pedidoId },
    });

    if (avaliacaoExistente) {
      return res.status(409).json({ error: 'Este pedido já foi avaliado' });
    }

    const loja = await prisma.loja.findUnique({
      where: { id: pedido.lojaId },
      select: { avaliacao: true, totalAvaliacoes: true },
    });

    if (!loja) {
      return res.status(404).json({ error: 'Loja não encontrada' });
    }

    const novoTotal = loja.totalAvaliacoes + 1;
    const novaMedia = Math.round(
      ((Number(loja.avaliacao) * loja.totalAvaliacoes + dados.nota) / novoTotal) * 10
    ) / 10;

    const [avaliacao] = await prisma.$transaction([
      prisma.avaliacaoLoja.create({
        data: {
          lojaId: pedido.lojaId,
          usuarioId,
          pedidoId: dados.pedidoId,
          nota: dados.nota,
          comentario: dados.comentario,
        },
        include: {
          usuario: { select: { id: true, nome: true, avatarUrl: true } },
          loja: { select: { id: true, nome: true } },
        },
      }),
      prisma.loja.update({
        where: { id: pedido.lojaId },
        data: { avaliacao: novaMedia, totalAvaliacoes: novoTotal },
      }),
    ]);

    res.status(201).json({ avaliacao });
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: error.errors });
    console.error(error);
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
    console.error(error);
    res.status(500).json({ error: 'Erro ao buscar avaliações' });
  }
});

export default router;