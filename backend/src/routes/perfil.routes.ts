import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../utils/prisma';
import { authMiddleware, authUsuario, AuthRequest } from '../middleware/auth';

const router = Router();

const atualizarPerfilSchema = z.object({
  nome: z.string().min(2).max(100).optional(),
  email: z.string().email().optional(),
  avatarUrl: z.string().url().nullable().optional(),
});

router.get('/', authMiddleware, authUsuario, async (req: AuthRequest, res) => {
  try {
    const usuarioId = req.user!.id;

    const usuario = await prisma.usuario.findUnique({
      where: { id: usuarioId },
      select: {
        id: true,
        nome: true,
        cpf: true,
        telefone: true,
        email: true,
        avatarUrl: true,
        telefoneVerificado: true,
        criadoEm: true,
        atualizadoEm: true,
        enderecos: true,
      },
    });

    if (!usuario) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    res.json({ usuario });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao buscar perfil' });
  }
});

router.put('/', authMiddleware, authUsuario, async (req: AuthRequest, res) => {
  try {
    const dados = atualizarPerfilSchema.parse(req.body);
    const usuarioId = req.user!.id;

    if (!dados.nome && !dados.email && dados.avatarUrl === undefined) {
      return res.status(400).json({ error: 'Nenhum campo para atualizar' });
    }

    if (dados.email) {
      const emailEmUso = await prisma.usuario.findFirst({
        where: { email: dados.email, id: { not: usuarioId } },
        select: { id: true },
      });
      if (emailEmUso) {
        return res.status(409).json({ error: 'E-mail já está em uso' });
      }
    }

    const usuario = await prisma.usuario.update({
      where: { id: usuarioId },
      data: {
        ...(dados.nome && { nome: dados.nome }),
        ...(dados.email && { email: dados.email }),
        ...(dados.avatarUrl !== undefined && { avatarUrl: dados.avatarUrl }),
      },
      select: {
        id: true,
        nome: true,
        cpf: true,
        telefone: true,
        email: true,
        avatarUrl: true,
        telefoneVerificado: true,
        criadoEm: true,
        atualizadoEm: true,
      },
    });

    res.json({ usuario });
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: error.errors });
    console.error(error);
    res.status(500).json({ error: 'Erro ao atualizar perfil' });
  }
});

export default router;