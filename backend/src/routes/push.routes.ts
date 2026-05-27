import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../utils/prisma';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { isExpoPushToken } from '../lib/pushSender';
import { logger } from '../lib/logger';
import { specValidatorMiddleware } from '../lib/spec-validator';

const router = Router();

const pushRegisterSpec = {
  name: 'POST_push_register',
  input: {
    expoToken: { required: true, type: 'string' },
    plataforma: { required: false, type: 'enum', constraints: ["'ios' | 'android' | 'web'"] },
    appTipo: {
      required: false,
      type: 'enum',
      constraints: ["'consumer' | 'lojista' | 'entregador'"],
    },
  },
} as const;

const pushUnregisterSpec = {
  name: 'POST_push_unregister',
  input: {
    expoToken: { required: true, type: 'string' },
  },
} as const;

const registerSchema = z.object({
  expoToken: z.string().min(1).refine(isExpoPushToken, { message: 'Token Expo inválido' }),
  plataforma: z.enum(['ios', 'android', 'web']).optional(),
  appTipo: z.enum(['consumer', 'lojista', 'entregador']).optional(),
});

/**
 * Mapeia o tipo do token JWT para o campo correto da tabela dispositivos_push.
 * Garante que o dono do dispositivo é exatamente quem está autenticado.
 */
function ownerFieldsFor(req: AuthRequest) {
  const user = req.user!;
  switch (user.tipo) {
    case 'usuario':
      return { consumidorId: user.id, lojistaId: null, entregadorId: null, appTipo: 'consumer' };
    case 'lojista':
      return { consumidorId: null, lojistaId: user.id, entregadorId: null, appTipo: 'lojista' };
    case 'entregador':
      return { consumidorId: null, lojistaId: null, entregadorId: user.id, appTipo: 'entregador' };
    default:
      throw new Error(`tipo de usuário desconhecido: ${user.tipo}`);
  }
}

/**
 * POST /v1/push/register
 * Registra (ou reativa) um device token Expo para o autenticado.
 * O dono é determinado pelo JWT (consumidor/lojista/entregador), não pelo body —
 * isso evita que um cliente malicioso registre token em nome de outro tipo.
 * Idempotente: se o token já existir, atualiza dono/ativo/plataforma.
 */
router.post(
  '/register',
  authMiddleware,
  specValidatorMiddleware(pushRegisterSpec),
  async (req: AuthRequest, res) => {
    const data = registerSchema.parse(req.body);
    const fields = ownerFieldsFor(req);

    const dispositivo = await prisma.dispositivoPush.upsert({
      where: { expoToken: data.expoToken },
      create: {
        ...fields,
        expoToken: data.expoToken,
        plataforma: data.plataforma,
        ativo: true,
      },
      update: {
        ...fields,
        plataforma: data.plataforma,
        ativo: true,
      },
      select: { id: true, expoToken: true, ativo: true },
    });

    logger.info(
      { tipo: req.user!.tipo, donoId: req.user!.id, dispositivoId: dispositivo.id },
      'push token registrado',
    );
    res.json(dispositivo);
  },
);

const unregisterSchema = z.object({
  expoToken: z.string().min(1),
});

/**
 * POST /v1/push/unregister
 * Marca o token como inativo. Usado no logout.
 */
router.post(
  '/unregister',
  authMiddleware,
  specValidatorMiddleware(pushUnregisterSpec),
  async (req: AuthRequest, res) => {
    const { expoToken } = unregisterSchema.parse(req.body);
    await prisma.dispositivoPush.updateMany({
      where: { expoToken },
      data: { ativo: false },
    });
    res.json({ ok: true });
  },
);

export default router;
