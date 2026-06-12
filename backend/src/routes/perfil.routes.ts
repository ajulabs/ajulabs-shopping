import { Router } from 'express';
import { z } from 'zod';
import multer from 'multer';
import { imageFileFilter } from '../utils/fileFilters';
import { prisma } from '../utils/prisma';
import { authMiddleware, authUsuario, AuthRequest } from '../middleware/auth';
import { uploadImagemConsumidor } from '../utils/supabase';
import { logger } from '../lib/logger';

const router = Router();
const uploadImagem = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: imageFileFilter,
});

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
    logger.error({ error }, '[perfil] erro');
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
    logger.error({ error }, '[perfil] erro');
    res.status(500).json({ error: 'Erro ao atualizar perfil' });
  }
});

// PATCH /perfil/avatar - Upload de foto de perfil
router.patch(
  '/avatar',
  authMiddleware,
  authUsuario,
  uploadImagem.single('avatar'),
  async (req: AuthRequest, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'Nenhuma imagem enviada' });
      }

      const avatarUrl = await uploadImagemConsumidor(req.file.buffer, req.file.mimetype);

      const usuario = await prisma.usuario.update({
        where: { id: req.user!.id },
        data: { avatarUrl },
        select: { avatarUrl: true },
      });

      res.json({ avatarUrl: usuario.avatarUrl });
    } catch (error) {
      logger.error({ error }, '[perfil] erro');
      res.status(500).json({ error: 'Erro ao atualizar foto de perfil' });
    }
  },
);

export default router;
