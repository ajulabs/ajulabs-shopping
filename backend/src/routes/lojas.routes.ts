import { Router } from 'express';
import { z } from 'zod';
import { authMiddleware, authLojista, AuthRequest } from '../middleware/auth';
import { prisma } from '../utils/prisma';
import { specValidatorMiddleware } from '../lib/spec-validator';

const router = Router();

const criarLojaSpec = {
  name: 'POST_lojas',
  input: {
    nome: { required: true, type: 'string' },
    descricao: { required: true, type: 'string' },
    categoria: { required: true, type: 'string' },
    telefone: { required: true, type: 'string' },
    tempoEntregaMin: { required: true, type: 'number' },
    tempoEntregaMax: { required: true, type: 'number' },
    taxaEntrega: { required: true, type: 'number' },
    endereco: { required: true, type: 'object' },
  },
} as const;

// GET /lojas - Listar todas (público)
router.get('/', async (req, res) => {
  try {
    const { categoria } = req.query;

    const lojas = await prisma.loja.findMany({
      where: categoria ? { categoria: categoria as string } : undefined,
      include: {
        endereco: true,
        _count: { select: { produtos: true } },
      },
      orderBy: { avaliacao: 'desc' },
    });

    res.json({ lojas });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar lojas' });
  }
});

// GET /lojas/:id - Detalhes (público)
router.get('/:id', async (req, res) => {
  try {
    const loja = await prisma.loja.findUnique({
      where: { id: req.params.id },
      include: {
        endereco: true,
        horarios: true,
        produtos: {
          where: { disponivel: true },
          orderBy: [{ destaque: 'desc' }, { nome: 'asc' }],
        },
      },
    });

    if (!loja) return res.status(404).json({ error: 'Loja não encontrada' });

    res.json({ loja });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar loja' });
  }
});

// GET /lojas/:id/produtos - Produtos da loja com paginação e filtros (público)
router.get('/:id/produtos', async (req, res) => {
  try {
    const lojaId = req.params.id;

    const loja = await prisma.loja.findUnique({ where: { id: lojaId } });
    if (!loja) return res.status(404).json({ error: 'Loja não encontrada' });

    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const offset = parseInt(req.query.offset as string) || 0;
    const categoria = req.query.categoria as string | undefined;
    const apenasDisponiveis = req.query.disponivel !== 'false';

    const where = {
      lojaId,
      ...(apenasDisponiveis && { disponivel: true }),
      ...(categoria && { categoria }),
    };

    const [produtos, total] = await Promise.all([
      prisma.produto.findMany({
        where,
        include: { variacoes: true },
        orderBy: [{ destaque: 'desc' }, { nome: 'asc' }],
        take: limit,
        skip: offset,
      }),
      prisma.produto.count({ where }),
    ]);

    res.json({ produtos, total, limit, offset });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar produtos' });
  }
});

// POST /lojas - Criar loja (lojista autenticado)
const criarLojaSchema = z.object({
  nome: z.string().min(2),
  descricao: z.string(),
  categoria: z.string(),
  telefone: z.string(),
  tempoEntregaMin: z.number().positive(),
  tempoEntregaMax: z.number().positive(),
  taxaEntrega: z.number().nonnegative(),
  endereco: z.object({
    rua: z.string(),
    numero: z.string(),
    bairro: z.string(),
    cep: z.string(),
    cidade: z.string(),
    complemento: z.string().optional(),
  }),
});

// Campos que o lojista pode editar. Exclui de propósito lojistaId, flags de
// verificação, saldo e qualquer campo controlado pelo servidor (evita mass assignment).
const atualizarLojaSchema = z
  .object({
    nome: z.string().min(2),
    descricao: z.string(),
    categoria: z.string(),
    telefone: z.string(),
    whatsapp: z.string().nullable(),
    tempoEntregaMin: z.number().positive(),
    tempoEntregaMax: z.number().positive(),
    taxaEntrega: z.number().nonnegative(),
    logoUrl: z.string().url().nullable(),
    bannerUrl: z.string().url().nullable(),
    aberta: z.boolean(),
  })
  .partial();

router.post(
  '/',
  authMiddleware,
  authLojista,
  specValidatorMiddleware(criarLojaSpec),
  async (req: AuthRequest, res) => {
    try {
      const dados = criarLojaSchema.parse(req.body);

      const loja = await prisma.loja.create({
        data: {
          lojistaId: req.user!.id,
          nome: dados.nome,
          descricao: dados.descricao,
          categoria: dados.categoria,
          telefone: dados.telefone,
          tempoEntregaMin: dados.tempoEntregaMin,
          tempoEntregaMax: dados.tempoEntregaMax,
          taxaEntrega: dados.taxaEntrega,
          endereco: { create: dados.endereco },
        },
        include: { endereco: true },
      });

      res.status(201).json({ loja });
    } catch (error) {
      if (error instanceof z.ZodError) return res.status(400).json({ error: error.errors });
      res.status(500).json({ error: 'Erro ao criar loja' });
    }
  },
);

// PUT /lojas/:id - Atualizar loja (lojista autenticado)
router.put('/:id', authMiddleware, authLojista, async (req: AuthRequest, res) => {
  try {
    const loja = await prisma.loja.findUnique({ where: { id: req.params.id } });

    if (!loja || loja.lojistaId !== req.user!.id) {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    const dados = atualizarLojaSchema.parse(req.body);
    const atualizada = await prisma.loja.update({
      where: { id: req.params.id },
      data: dados,
    });

    res.json({ loja: atualizada });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao atualizar loja' });
  }
});

export default router;
