import { Router } from 'express';
import { z } from 'zod';
import { authMiddleware, authLojista, AuthRequest } from '../middleware/auth';
import { prisma } from '../utils/prisma';
import { specValidatorMiddleware } from '../lib/spec-validator';

const router = Router();

const criarProdutoSchema = z.object({
  lojaId: z.string().uuid(),
  nome: z.string().min(2),
  descricao: z.string(),
  preco: z.number().positive(),
  estoque: z.number().int().nonnegative(),
  imagemUrl: z.string().url(),
  categoria: z.string(),
  tags: z.array(z.string()).default([]),
  destaque: z.boolean().default(false),
});

// Campos editáveis de um produto. Exclui de propósito lojaId (não troca de loja),
// avaliacao/totalAvaliacoes/embedding (controlados pelo servidor) — evita mass assignment.
const atualizarProdutoSchema = z
  .object({
    nome: z.string().min(2),
    descricao: z.string(),
    preco: z.number().positive(),
    estoque: z.number().int().nonnegative(),
    estoqueMinimo: z.number().int().nonnegative(),
    imagemUrl: z.string().url(),
    imagens: z.array(z.string().url()),
    categoria: z.string(),
    tags: z.array(z.string()),
    disponivel: z.boolean(),
    destaque: z.boolean(),
  })
  .partial();

const criarProdutoSpec = {
  name: 'POST_produtos',
  input: {
    lojaId: { required: true, type: 'string', constraints: ['uuid'] },
    nome: { required: true, type: 'string', constraints: ['min 2 caracteres'] },
    descricao: { required: true, type: 'string' },
    preco: { required: true, type: 'number', constraints: ['positivo'] },
    estoque: { required: true, type: 'number', constraints: ['int, nonnegative'] },
    imagemUrl: { required: true, type: 'string', constraints: ['URL válida'] },
    categoria: { required: true, type: 'string' },
    tags: { required: false, type: 'array' },
    destaque: { required: false, type: 'boolean' },
  },
} as const;

// POST /produtos - Criar produto (lojista autenticado)
router.post(
  '/',
  authMiddleware,
  authLojista,
  specValidatorMiddleware(criarProdutoSpec),
  async (req: AuthRequest, res) => {
    try {
      const dados = criarProdutoSchema.parse(req.body);

      const loja = await prisma.loja.findUnique({ where: { id: dados.lojaId } });

      if (!loja || loja.lojistaId !== req.user!.id) {
        return res.status(403).json({ error: 'Acesso negado a esta loja' });
      }

      const produto = await prisma.produto.create({ data: dados });

      res.status(201).json({ produto });
    } catch (error) {
      if (error instanceof z.ZodError) return res.status(400).json({ error: error.errors });
      res.status(500).json({ error: 'Erro ao criar produto' });
    }
  },
);

// GET /produtos/:id - Detalhes do produto (público)
router.get('/:id', async (req, res) => {
  try {
    const produto = await prisma.produto.findUnique({
      where: { id: req.params.id },
      include: { variacoes: true },
    });

    if (!produto) return res.status(404).json({ error: 'Produto não encontrado' });

    res.json({ produto });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar produto' });
  }
});

// PUT /produtos/:id - Atualizar produto (lojista autenticado)
router.put('/:id', authMiddleware, authLojista, async (req: AuthRequest, res) => {
  try {
    const produto = await prisma.produto.findUnique({
      where: { id: req.params.id },
      include: { loja: true },
    });

    if (!produto || produto.loja.lojistaId !== req.user!.id) {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    const dados = atualizarProdutoSchema.parse(req.body);
    const atualizado = await prisma.produto.update({
      where: { id: req.params.id },
      data: dados,
    });

    res.json({ produto: atualizado });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao atualizar produto' });
  }
});

// DELETE /produtos/:id - Remover produto (lojista autenticado)
router.delete('/:id', authMiddleware, authLojista, async (req: AuthRequest, res) => {
  try {
    const produto = await prisma.produto.findUnique({
      where: { id: req.params.id },
      include: { loja: true },
    });

    if (!produto || produto.loja.lojistaId !== req.user!.id) {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    await prisma.produto.delete({ where: { id: req.params.id } });

    res.json({ message: 'Produto removido com sucesso' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao remover produto' });
  }
});

export default router;
