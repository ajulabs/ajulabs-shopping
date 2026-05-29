import { Router } from 'express';
import { z } from 'zod';
import { TipoMovimentacao } from '@prisma/client';
import { authMiddleware, authLojista, AuthRequest } from '../middleware/auth';
import { prisma } from '../utils/prisma';
import { logger } from '../lib/logger';
import {
  ajustarEstoqueManual,
  getDashboard,
  getMovimentacoes,
  getAlertas,
} from '../services/estoque.service';

const router = Router();

router.get('/dashboard', authMiddleware, authLojista, async (req: AuthRequest, res) => {
  try {
    const lojaId = req.query.lojaId as string;
    if (!lojaId) return res.status(400).json({ error: 'lojaId obrigatório' });

    const loja = await prisma.loja.findFirst({
      where: { id: lojaId, lojistaId: req.user!.id },
    });
    if (!loja) return res.status(403).json({ error: 'Acesso negado' });

    const dashboard = await getDashboard(lojaId);
    res.json({ dashboard });
  } catch (err) {
    logger.error({ err }, '[estoque] erro ao buscar dashboard');
    res.status(500).json({ error: 'Erro ao buscar dashboard de estoque' });
  }
});

router.get('/movimentacoes', authMiddleware, authLojista, async (req: AuthRequest, res) => {
  try {
    const lojaId = req.query.lojaId as string;
    if (!lojaId) return res.status(400).json({ error: 'lojaId obrigatório' });

    const loja = await prisma.loja.findFirst({
      where: { id: lojaId, lojistaId: req.user!.id },
    });
    if (!loja) return res.status(403).json({ error: 'Acesso negado' });

    const page = Number(req.query.page ?? 1);
    const limit = Math.min(Number(req.query.limit ?? 30), 100);
    const produtoId = req.query.produtoId as string | undefined;
    const tipo = req.query.tipo as TipoMovimentacao | undefined;

    const result = await getMovimentacoes(lojaId, { produtoId, tipo, page, limit });
    res.json(result);
  } catch (err) {
    logger.error({ err }, '[estoque] erro ao buscar movimentações');
    res.status(500).json({ error: 'Erro ao buscar movimentações' });
  }
});

router.get('/alertas', authMiddleware, authLojista, async (req: AuthRequest, res) => {
  try {
    const lojaId = req.query.lojaId as string;
    if (!lojaId) return res.status(400).json({ error: 'lojaId obrigatório' });

    const loja = await prisma.loja.findFirst({
      where: { id: lojaId, lojistaId: req.user!.id },
    });
    if (!loja) return res.status(403).json({ error: 'Acesso negado' });

    const alertas = await getAlertas(lojaId);
    res.json({ alertas });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar alertas' });
  }
});

const movimentacaoSchema = z.object({
  produtoId: z.string().min(1),
  lojaId: z.string().min(1),
  tipo: z.enum(['entrada_manual', 'saida_manual', 'ajuste_inventario', 'devolucao']),
  quantidade: z.number().int().positive(),
  motivo: z.string().optional(),
});

router.post('/movimentacao', authMiddleware, authLojista, async (req: AuthRequest, res) => {
  try {
    const body = movimentacaoSchema.parse(req.body);

    const loja = await prisma.loja.findFirst({
      where: { id: body.lojaId, lojistaId: req.user!.id },
    });
    if (!loja) return res.status(403).json({ error: 'Acesso negado' });

    const produto = await ajustarEstoqueManual(
      body.produtoId,
      body.lojaId,
      req.user!.id,
      body.tipo,
      body.quantidade,
      body.motivo,
    );

    res.json({ produto });
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: err.errors });
    logger.error({ err }, '[estoque] erro ao registrar movimentação');
    res.status(500).json({ error: 'Erro ao registrar movimentação' });
  }
});

router.put('/produtos/:id/minimo', authMiddleware, authLojista, async (req: AuthRequest, res) => {
  try {
    const { estoqueMinimo } = z.object({ estoqueMinimo: z.number().int().min(0) }).parse(req.body);

    const produto = await prisma.produto.findUnique({
      where: { id: req.params.id },
      include: { loja: { select: { lojistaId: true } } },
    });
    if (!produto || produto.loja.lojistaId !== req.user!.id) {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    const atualizado = await prisma.produto.update({
      where: { id: req.params.id },
      data: { estoqueMinimo },
      select: { id: true, nome: true, estoque: true, estoqueMinimo: true },
    });

    res.json({ produto: atualizado });
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: err.errors });
    res.status(500).json({ error: 'Erro ao atualizar estoque mínimo' });
  }
});

export default router;
