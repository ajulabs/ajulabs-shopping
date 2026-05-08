import { Router } from 'express';
import { z } from 'zod';
import { authMiddleware, authUsuario, AuthRequest } from '../middleware/auth';
import { prisma } from '../utils/prisma';

const router = Router();

const enderecoSchema = z.object({
  apelido: z.string().min(1),
  rua: z.string().min(1),
  numero: z.string().min(1),
  bairro: z.string().min(1),
  cep: z.string().length(8),
  cidade: z.string().min(1),
  complemento: z.string().optional(),
});

// GET /enderecos - Listar endereços do usuário
router.get('/', authMiddleware, authUsuario, async (req: AuthRequest, res) => {
  try {
    const enderecos = await prisma.enderecoUsuario.findMany({
      where: { usuarioId: req.user!.id },
      orderBy: [{ padrao: 'desc' }, { criadoEm: 'asc' }],
    });

    res.json({ enderecos });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar endereços' });
  }
});

// POST /enderecos - Criar endereço
router.post('/', authMiddleware, authUsuario, async (req: AuthRequest, res) => {
  try {
    const dados = enderecoSchema.parse(req.body);

    // Se for o primeiro endereço, define como padrão
    const total = await prisma.enderecoUsuario.count({
      where: { usuarioId: req.user!.id },
    });

    const endereco = await prisma.enderecoUsuario.create({
      data: {
        ...dados,
        usuarioId: req.user!.id,
        padrao: total === 0,
      },
    });

    res.status(201).json({ endereco });
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: error.errors });
    res.status(500).json({ error: 'Erro ao criar endereço' });
  }
});

// PUT /enderecos/:id - Atualizar endereço
router.put('/:id', authMiddleware, authUsuario, async (req: AuthRequest, res) => {
  try {
    const dados = enderecoSchema.partial().parse(req.body);

    const endereco = await prisma.enderecoUsuario.findUnique({
      where: { id: req.params.id },
    });

    if (!endereco || endereco.usuarioId !== req.user!.id) {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    const atualizado = await prisma.enderecoUsuario.update({
      where: { id: req.params.id },
      data: dados,
    });

    res.json({ endereco: atualizado });
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: error.errors });
    res.status(500).json({ error: 'Erro ao atualizar endereço' });
  }
});

// DELETE /enderecos/:id - Remover endereço
router.delete('/:id', authMiddleware, authUsuario, async (req: AuthRequest, res) => {
  try {
    const endereco = await prisma.enderecoUsuario.findUnique({
      where: { id: req.params.id },
    });

    if (!endereco || endereco.usuarioId !== req.user!.id) {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    if (endereco.padrao) {
      return res.status(400).json({ error: 'Não é possível remover o endereço padrão' });
    }

    await prisma.enderecoUsuario.delete({ where: { id: req.params.id } });

    res.json({ message: 'Endereço removido com sucesso' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao remover endereço' });
  }
});

// PATCH /enderecos/:id/padrao - Definir como padrão
router.patch('/:id/padrao', authMiddleware, authUsuario, async (req: AuthRequest, res) => {
  try {
    const endereco = await prisma.enderecoUsuario.findUnique({
      where: { id: req.params.id },
    });

    if (!endereco || endereco.usuarioId !== req.user!.id) {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    // Remove padrão de todos e define no escolhido
    await prisma.enderecoUsuario.updateMany({
      where: { usuarioId: req.user!.id },
      data: { padrao: false },
    });

    const atualizado = await prisma.enderecoUsuario.update({
      where: { id: req.params.id },
      data: { padrao: true },
    });

    res.json({ endereco: atualizado });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao definir endereço padrão' });
  }
});

export default router;
