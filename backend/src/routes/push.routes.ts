import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../utils/prisma';
import { authMiddleware, authUsuario, AuthRequest } from '../middleware/auth';
import { isExpoPushToken } from '../lib/pushSender';
import { logger } from '../lib/logger';

const router = Router();

const registerSchema = z.object({
  expoToken: z
    .string()
    .min(1)
    .refine(isExpoPushToken, { message: 'Token Expo inválido' }),
  plataforma: z.enum(['ios', 'android', 'web']).optional(),
  appTipo: z.enum(['consumer', 'lojista', 'entregador']).optional(),
});

/**
 * POST /v1/push/register
 * Registra (ou reativa) um device token Expo para o usuário autenticado.
 * Idempotente: se o token já existir, atualiza usuario/ativo/plataforma.
 */
router.post('/register', authMiddleware, authUsuario, async (req: AuthRequest, res) => {
  const data = registerSchema.parse(req.body);
  const usuarioId = req.user!.id;

  const dispositivo = await prisma.dispositivoPush.upsert({
    where: { expoToken: data.expoToken },
    create: {
      usuarioId,
      expoToken: data.expoToken,
      plataforma: data.plataforma,
      appTipo: data.appTipo ?? 'consumer',
      ativo: true,
    },
    update: {
      usuarioId,
      plataforma: data.plataforma,
      appTipo: data.appTipo ?? 'consumer',
      ativo: true,
    },
    select: { id: true, expoToken: true, ativo: true },
  });

  logger.info({ usuarioId, dispositivoId: dispositivo.id }, 'push token registrado');
  res.json(dispositivo);
});

const unregisterSchema = z.object({
  expoToken: z.string().min(1),
});

/**
 * POST /v1/push/unregister
 * Marca o token como inativo. Usado no logout.
 * Não exige que o token pertença ao usuário (logout pode acontecer com sessão expirada).
 */
router.post('/unregister', authMiddleware, async (req: AuthRequest, res) => {
  const { expoToken } = unregisterSchema.parse(req.body);
  await prisma.dispositivoPush.updateMany({
    where: { expoToken },
    data: { ativo: false },
  });
  res.json({ ok: true });
});

export default router;
