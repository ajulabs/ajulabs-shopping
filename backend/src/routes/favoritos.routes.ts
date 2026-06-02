import { Router } from 'express';
import { prisma } from '../utils/prisma';
import { authMiddleware, authUsuario, AuthRequest } from '../middleware/auth';
import { logger } from '../lib/logger';

const router = Router();

router.get('/produtos', authMiddleware, authUsuario, async (req: AuthRequest, res) => {
  try {
    const usuarioId = req.user!.id;

    const favoritos = await prisma.favoritoProduto.findMany({
      where: { usuarioId },
      orderBy: { criadoEm: 'desc' },
      include: {
        produto: {
          include: { variacoes: true },
        },
      },
    });

    const produtos = favoritos.map((f) => f.produto);
    res.json({ produtos });
  } catch (error) {
    logger.error({ error }, '[favoritos] erro');
    res.status(500).json({ error: 'Erro ao buscar favoritos' });
  }
});

router.get(
  '/produtos/:produtoId/check',
  authMiddleware,
  authUsuario,
  async (req: AuthRequest, res) => {
    try {
      const usuarioId = req.user!.id;
      const { produtoId } = req.params;

      const favorito = await prisma.favoritoProduto.findUnique({
        where: { usuarioId_produtoId: { usuarioId, produtoId } },
      });

      res.json({ favoritado: !!favorito });
    } catch (error) {
      logger.error({ error }, '[favoritos] erro');
      res.status(500).json({ error: 'Erro ao verificar favorito' });
    }
  },
);

router.post('/produtos/:produtoId', authMiddleware, authUsuario, async (req: AuthRequest, res) => {
  try {
    const usuarioId = req.user!.id;
    const { produtoId } = req.params;

    const produto = await prisma.produto.findUnique({ where: { id: produtoId } });
    if (!produto) {
      return res.status(404).json({ error: 'Produto não encontrado' });
    }

    await prisma.favoritoProduto.upsert({
      where: { usuarioId_produtoId: { usuarioId, produtoId } },
      create: { usuarioId, produtoId },
      update: {},
    });

    res.status(201).json({ favoritado: true });
  } catch (error) {
    logger.error({ error }, '[favoritos] erro');
    res.status(500).json({ error: 'Erro ao favoritar produto' });
  }
});

router.delete(
  '/produtos/:produtoId',
  authMiddleware,
  authUsuario,
  async (req: AuthRequest, res) => {
    try {
      const usuarioId = req.user!.id;
      const { produtoId } = req.params;

      await prisma.favoritoProduto.deleteMany({
        where: { usuarioId, produtoId },
      });

      res.json({ favoritado: false });
    } catch (error) {
      logger.error({ error }, '[favoritos] erro');
      res.status(500).json({ error: 'Erro ao desfavoritar produto' });
    }
  },
);

// ── Favoritos de Loja ────────────────────────────────────────

router.get('/lojas', authMiddleware, authUsuario, async (req: AuthRequest, res) => {
  try {
    const usuarioId = req.user!.id;

    const favoritos = await prisma.favoritoLoja.findMany({
      where: { usuarioId },
      orderBy: { criadoEm: 'desc' },
      include: {
        loja: {
          include: { endereco: true },
        },
      },
    });

    const lojas = favoritos.map((f) => f.loja);
    res.json({ lojas });
  } catch (error) {
    logger.error({ error }, '[favoritos] erro');
    res.status(500).json({ error: 'Erro ao buscar lojas favoritas' });
  }
});

router.get('/lojas/:lojaId/check', authMiddleware, authUsuario, async (req: AuthRequest, res) => {
  try {
    const usuarioId = req.user!.id;
    const { lojaId } = req.params;

    const favorito = await prisma.favoritoLoja.findUnique({
      where: { usuarioId_lojaId: { usuarioId, lojaId } },
    });

    res.json({ favoritado: !!favorito });
  } catch (error) {
    logger.error({ error }, '[favoritos] erro');
    res.status(500).json({ error: 'Erro ao verificar favorito' });
  }
});

router.post('/lojas/:lojaId', authMiddleware, authUsuario, async (req: AuthRequest, res) => {
  try {
    const usuarioId = req.user!.id;
    const { lojaId } = req.params;

    const loja = await prisma.loja.findUnique({ where: { id: lojaId } });
    if (!loja) return res.status(404).json({ error: 'Loja não encontrada' });

    await prisma.favoritoLoja.upsert({
      where: { usuarioId_lojaId: { usuarioId, lojaId } },
      create: { usuarioId, lojaId },
      update: {},
    });

    res.status(201).json({ favoritado: true });
  } catch (error) {
    logger.error({ error }, '[favoritos] erro');
    res.status(500).json({ error: 'Erro ao favoritar loja' });
  }
});

router.delete('/lojas/:lojaId', authMiddleware, authUsuario, async (req: AuthRequest, res) => {
  try {
    const usuarioId = req.user!.id;
    const { lojaId } = req.params;

    await prisma.favoritoLoja.deleteMany({ where: { usuarioId, lojaId } });

    res.json({ favoritado: false });
  } catch (error) {
    logger.error({ error }, '[favoritos] erro');
    res.status(500).json({ error: 'Erro ao desfavoritar loja' });
  }
});

export default router;
