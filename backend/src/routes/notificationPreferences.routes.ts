import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../utils/prisma';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { logger } from '../lib/logger';
import {
  CATEGORIA_META,
  categoriasPara,
  NotifCategoria,
} from '../lib/notificationCategories';

const router = Router();

type TipoDono = 'consumidor' | 'lojista' | 'entregador';

/**
 * Mapeia req.user.tipo (JWT) para o tipo do dono nas tabelas.
 * 'usuario' = consumidor (mesma convenção do PR #91 / push.routes).
 */
function tipoDono(req: AuthRequest): TipoDono {
  switch (req.user!.tipo) {
    case 'usuario':
      return 'consumidor';
    case 'lojista':
      return 'lojista';
    case 'entregador':
      return 'entregador';
    default:
      throw new Error(`tipo de usuário desconhecido: ${req.user!.tipo}`);
  }
}

function ownerWhereFields(tipo: TipoDono, id: string) {
  switch (tipo) {
    case 'consumidor':
      return { consumidorId: id };
    case 'lojista':
      return { lojistaId: id };
    case 'entregador':
      return { entregadorId: id };
  }
}

/**
 * GET /v1/notification-preferences
 *
 * Retorna a lista de categorias suportadas para o tipo do dono autenticado,
 * cada uma com `ativo: boolean` (true = recebe push, false = opt-out).
 *
 * Default é ativo: true para qualquer categoria sem linha na tabela.
 */
router.get('/', authMiddleware, async (req: AuthRequest, res) => {
  const tipo = tipoDono(req);
  const id = req.user!.id;
  const categorias = categoriasPara(tipo);

  const where = ownerWhereFields(tipo, id);
  const optOuts = await prisma.preferenciaNotificacaoOptOut.findMany({
    where,
    select: { categoria: true },
  });
  const desativadas = new Set(optOuts.map((o: { categoria: string }) => o.categoria));

  const lista = categorias.map((c) => ({
    categoria: c,
    label: CATEGORIA_META[c].label,
    descricao: CATEGORIA_META[c].descricao,
    ativo: !desativadas.has(c),
  }));

  res.json({ preferencias: lista });
});

const putSchema = z.object({
  categoria: z.string().min(1),
  ativo: z.boolean(),
});

/**
 * PUT /v1/notification-preferences
 *
 * Body: { categoria: 'pedido_status', ativo: false }
 *
 * - ativo=true → remove linha de opt-out (volta ao default = recebe)
 * - ativo=false → cria linha de opt-out (deixa de receber)
 *
 * Valida que a categoria pertence ao tipo do dono autenticado, evitando
 * que um consumidor desligue "corrida_oferta" e vice-versa.
 */
router.put('/', authMiddleware, async (req: AuthRequest, res) => {
  const { categoria, ativo } = putSchema.parse(req.body);
  const tipo = tipoDono(req);
  const id = req.user!.id;

  const validas = categoriasPara(tipo);
  if (!validas.includes(categoria as NotifCategoria)) {
    return res.status(400).json({
      error: 'Categoria não suportada para este tipo de usuário',
      categoriasValidas: validas,
    });
  }

  const where = ownerWhereFields(tipo, id);

  if (ativo) {
    // Apaga opt-out — volta a receber
    await prisma.preferenciaNotificacaoOptOut.deleteMany({
      where: { ...where, categoria },
    });
  } else {
    // Cria opt-out (idempotente — se já existe, mantém)
    const existente = await prisma.preferenciaNotificacaoOptOut.findFirst({
      where: { ...where, categoria },
      select: { id: true },
    });
    if (!existente) {
      await prisma.preferenciaNotificacaoOptOut.create({
        data: { ...where, categoria },
      });
    }
  }

  logger.info({ tipo, donoId: id, categoria, ativo }, 'preferencia de notificacao atualizada');
  res.json({ ok: true, categoria, ativo });
});

export default router;
