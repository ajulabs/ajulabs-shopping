import { Router } from 'express';
import { z } from 'zod';
import { authMiddleware, authUsuario, AuthRequest } from '../middleware/auth';
import { prisma } from '../utils/prisma';
import { emitTicketMensagem, emitTicketNovo } from '../utils/socket';
import { specValidatorMiddleware } from '../lib/spec-validator';
import { executarCriarTicket } from '../tools/executors';
import { notificarTicketNovo } from '../lib/pushNotifications';

const router = Router();

const ticketMensagemSpec = {
  name: 'POST_tickets_id_mensagens',
  input: {
    texto: { required: true, type: 'string' },
  },
} as const;

const ticketAvaliacaoSpec = {
  name: 'POST_tickets_id_avaliacao',
  input: {
    nota: { required: true, type: 'number', constraints: ['int, 1-5'] },
  },
} as const;

const TICKET_INCLUDE = {
  loja: { select: { nome: true } },
  pedido: {
    select: {
      id: true,
      total: true,
      criadoEm: true,
      itens: { select: { nomeSnapshot: true, quantidade: true } },
    },
  },
  mensagens: true,
} as const;

// POST /tickets - Consumidor cria ticket manualmente
router.post('/', authMiddleware, authUsuario, async (req: AuthRequest, res) => {
  try {
    const { motivo, pedidoId } = z
      .object({
        motivo: z.string().min(1, 'Motivo obrigatório'),
        pedidoId: z.string().uuid().optional(),
      })
      .parse(req.body);

    const usuarioId = req.user!.id;

    const result = await executarCriarTicket(motivo.trim(), usuarioId, pedidoId);
    const { protocolo } = result.dados as { criado: boolean; protocolo: string };

    const pedido = pedidoId
      ? await prisma.pedido.findUnique({ where: { id: pedidoId }, select: { lojaId: true } })
      : null;

    const ticket = await prisma.supportTicket.create({
      data: {
        consumidorId: usuarioId,
        pedidoId: pedidoId ?? null,
        lojaId: pedido?.lojaId ?? null,
        motivo: motivo.trim(),
        protocolo,
      },
    });

    if (pedido?.lojaId) {
      emitTicketNovo(pedido.lojaId, {
        id: ticket.id,
        protocolo,
        motivo: motivo.trim(),
        consumidorId: usuarioId,
      });
      void notificarTicketNovo(pedido.lojaId, ticket.id, motivo.trim());
    }

    res.status(201).json({ ticket: { id: ticket.id, protocolo } });
  } catch (error) {
    if (error instanceof z.ZodError)
      return res.status(400).json({ error: error.errors[0]?.message ?? 'Dados inválidos' });
    res.status(500).json({ error: 'Erro ao criar ticket' });
  }
});

// GET /tickets - Listar tickets do consumidor autenticado
router.get('/', authMiddleware, authUsuario, async (req: AuthRequest, res) => {
  try {
    const { status } = req.query;
    const where: Record<string, unknown> = { consumidorId: req.user!.id };
    if (status) where.status = status;

    const tickets = await prisma.supportTicket.findMany({
      where,
      include: TICKET_INCLUDE,
      orderBy: { criadoEm: 'desc' },
    });

    res.json({ tickets });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar tickets' });
  }
});

// GET /tickets/:id - Detalhe de um ticket do consumidor
router.get('/:id', authMiddleware, authUsuario, async (req: AuthRequest, res) => {
  try {
    const ticket = await prisma.supportTicket.findUnique({
      where: { id: req.params.id },
      include: TICKET_INCLUDE,
    });

    if (!ticket || ticket.consumidorId !== req.user!.id) {
      return res.status(404).json({ error: 'Ticket não encontrado' });
    }

    res.json({ ticket });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar ticket' });
  }
});

// POST /tickets/:id/mensagens - Consumidor envia follow-up
router.post(
  '/:id/mensagens',
  authMiddleware,
  authUsuario,
  specValidatorMiddleware(ticketMensagemSpec),
  async (req: AuthRequest, res) => {
    try {
      const { texto } = req.body;
      if (!texto?.trim()) return res.status(400).json({ error: 'Texto obrigatório' });

      const ticket = await prisma.supportTicket.findUnique({ where: { id: req.params.id } });

      if (!ticket || ticket.consumidorId !== req.user!.id) {
        return res.status(404).json({ error: 'Ticket não encontrado' });
      }

      if (ticket.status === 'cancelado' || ticket.status === 'resolvido') {
        return res
          .status(400)
          .json({ error: 'Não é possível enviar mensagem em ticket finalizado' });
      }

      const mensagem = await prisma.ticketMensagem.create({
        data: { ticketId: req.params.id, remetente: 'consumidor', texto: texto.trim() },
      });

      emitTicketMensagem(
        req.user!.id,
        ticket.lojaId,
        { ...mensagem, ticketId: req.params.id },
        'consumidor',
      );
      res.status(201).json({ mensagem });
    } catch (error) {
      res.status(500).json({ error: 'Erro ao enviar mensagem' });
    }
  },
);

// DELETE /tickets/:id - Consumidor cancela ticket (somente se aberto)
router.delete('/:id', authMiddleware, authUsuario, async (req: AuthRequest, res) => {
  try {
    const ticket = await prisma.supportTicket.findUnique({ where: { id: req.params.id } });

    if (!ticket || ticket.consumidorId !== req.user!.id) {
      return res.status(404).json({ error: 'Ticket não encontrado' });
    }

    if (ticket.status !== 'aberto') {
      return res.status(400).json({ error: 'Somente tickets abertos podem ser cancelados' });
    }

    await prisma.supportTicket.update({
      where: { id: req.params.id },
      data: { status: 'cancelado' },
    });

    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao cancelar ticket' });
  }
});

// POST /tickets/:id/avaliacao - Consumidor avalia resolução (1-5)
router.post(
  '/:id/avaliacao',
  authMiddleware,
  authUsuario,
  specValidatorMiddleware(ticketAvaliacaoSpec),
  async (req: AuthRequest, res) => {
    try {
      const { nota } = z.object({ nota: z.number().int().min(1).max(5) }).parse(req.body);

      const ticket = await prisma.supportTicket.findUnique({ where: { id: req.params.id } });

      if (!ticket || ticket.consumidorId !== req.user!.id) {
        return res.status(404).json({ error: 'Ticket não encontrado' });
      }

      if (ticket.status !== 'resolvido') {
        return res.status(400).json({ error: 'Somente tickets resolvidos podem ser avaliados' });
      }

      if (ticket.avaliacaoConsumidor !== null) {
        return res.status(400).json({ error: 'Ticket já avaliado' });
      }

      const atualizado = await prisma.supportTicket.update({
        where: { id: req.params.id },
        data: { avaliacaoConsumidor: nota },
      });

      res.json({ ticket: atualizado });
    } catch (error) {
      if (error instanceof z.ZodError)
        return res.status(400).json({ error: 'Nota deve ser de 1 a 5' });
      res.status(500).json({ error: 'Erro ao registrar avaliação' });
    }
  },
);

export default router;
