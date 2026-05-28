import { Router } from 'express';
import { z } from 'zod';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { prisma } from '../utils/prisma';
import { emitChatMensagem } from '../utils/socket';
import { notificarChatMensagem } from '../lib/pushNotifications';

const router = Router();

router.use(authMiddleware);

const enviarMensagemSchema = z.object({
  conteudo: z.string().min(1).max(1000),
  destinatarioType: z.enum(['CONSUMER', 'LOJISTA', 'ENTREGADOR']),
});

async function resolverParticipante(req: AuthRequest): Promise<{
  tipo: 'CONSUMER' | 'LOJISTA' | 'ENTREGADOR';
  id: string;
  roomId: string;
} | null> {
  const { tipo, id } = req.user!;
  if (tipo === 'usuario') return { tipo: 'CONSUMER', id, roomId: id };
  if (tipo === 'entregador') return { tipo: 'ENTREGADOR', id, roomId: id };
  if (tipo === 'lojista') {
    const loja = await prisma.loja.findFirst({ where: { lojistaId: id }, select: { id: true } });
    if (!loja) return null;
    return { tipo: 'LOJISTA', id: loja.id, roomId: loja.id };
  }
  return null;
}

function verificarPermissaoPar(
  remetenteType: string,
  destinatarioType: string,
  hasEntregador: boolean,
): boolean {
  const pares = [
    ['CONSUMER', 'LOJISTA'],
    ['LOJISTA', 'CONSUMER'],
  ];
  if (hasEntregador) {
    pares.push(
      ['CONSUMER', 'ENTREGADOR'],
      ['ENTREGADOR', 'CONSUMER'],
      ['LOJISTA', 'ENTREGADOR'],
      ['ENTREGADOR', 'LOJISTA'],
    );
  }
  return pares.some(([r, d]) => r === remetenteType && d === destinatarioType);
}

const chatInclude = {
  mensagens: { orderBy: { criadoEm: 'asc' as const } },
  pedido: {
    select: {
      id: true,
      status: true,
      consumidorId: true,
      lojaId: true,
      entregadorId: true,
      loja: { select: { nome: true, logoUrl: true } },
      consumidor: { select: { nome: true } },
      entregador: { select: { id: true, nome: true } },
    },
  },
} as const;

async function garantirChat(pedidoId: string) {
  await prisma.chatPedido.upsert({
    where: { pedidoId },
    create: { pedidoId },
    update: {},
  });
  return prisma.chatPedido.findUnique({ where: { pedidoId }, include: chatInclude });
}

// GET /v1/pedido-chat/pedido/:pedidoId
router.get('/pedido/:pedidoId', async (req: AuthRequest, res) => {
  try {
    const participante = await resolverParticipante(req);
    if (!participante) return res.status(403).json({ error: 'Acesso negado' });

    let chat = await prisma.chatPedido.findUnique({
      where: { pedidoId: req.params.pedidoId },
      include: chatInclude,
    });

    if (!chat) {
      const pedido = await prisma.pedido.findUnique({
        where: { id: req.params.pedidoId },
        select: { consumidorId: true, lojaId: true, entregadorId: true },
      });
      if (!pedido) return res.status(404).json({ error: 'Pedido não encontrado' });

      const autorizado =
        (participante.tipo === 'CONSUMER' && pedido.consumidorId === participante.id) ||
        (participante.tipo === 'LOJISTA' && pedido.lojaId === participante.id) ||
        (participante.tipo === 'ENTREGADOR' && pedido.entregadorId === participante.id);
      if (!autorizado) return res.status(403).json({ error: 'Acesso negado' });

      chat = await garantirChat(req.params.pedidoId);
      if (!chat) return res.status(500).json({ error: 'Erro ao criar chat' });
    }

    const { pedido } = chat;
    const autorizado =
      (participante.tipo === 'CONSUMER' && pedido.consumidorId === participante.id) ||
      (participante.tipo === 'LOJISTA' && pedido.lojaId === participante.id) ||
      (participante.tipo === 'ENTREGADOR' && pedido.entregadorId === participante.id);

    if (!autorizado) return res.status(403).json({ error: 'Acesso negado' });

    const participantes: string[] = ['CONSUMER', 'LOJISTA'];
    if (pedido.entregadorId) participantes.push('ENTREGADOR');

    // Enriquecer mensagens com nomes
    const mensagensEnriquecidas = await Promise.all(
      chat.mensagens.map(async (m) => {
        let remetenteNome = 'Usuário';
        if (m.remetenteType === 'CONSUMER') remetenteNome = pedido.consumidor?.nome ?? 'Cliente';
        else if (m.remetenteType === 'LOJISTA') remetenteNome = pedido.loja?.nome ?? 'Lojista';
        else if (m.remetenteType === 'ENTREGADOR')
          remetenteNome = pedido.entregador?.nome ?? 'Entregador';
        return { ...m, remetenteNome, criadoEm: m.criadoEm.toISOString() };
      }),
    );

    res.json({
      chat: {
        id: chat.id,
        pedidoId: chat.pedidoId,
        status: chat.status,
        participantes,
        mensagens: mensagensEnriquecidas,
        lojaNome: pedido.loja?.nome,
        lojaLogo: pedido.loja?.logoUrl,
        consumidorNome: pedido.consumidor?.nome,
        entregadorNome: pedido.entregador?.nome,
      },
    });
  } catch {
    res.status(500).json({ error: 'Erro ao buscar chat' });
  }
});

// POST /v1/pedido-chat/pedido/:pedidoId/mensagem
router.post('/pedido/:pedidoId/mensagem', async (req: AuthRequest, res) => {
  try {
    const participante = await resolverParticipante(req);
    if (!participante) return res.status(403).json({ error: 'Acesso negado' });

    const { conteudo, destinatarioType } = enviarMensagemSchema.parse(req.body);

    let chat = await prisma.chatPedido.findUnique({
      where: { pedidoId: req.params.pedidoId },
      include: {
        pedido: {
          select: {
            consumidorId: true,
            lojaId: true,
            entregadorId: true,
            status: true,
            consumidor: { select: { nome: true } },
            loja: { select: { nome: true } },
            entregador: { select: { id: true, nome: true } },
          },
        },
      },
    });

    if (!chat) {
      const pedido = await prisma.pedido.findUnique({
        where: { id: req.params.pedidoId },
        select: { consumidorId: true, lojaId: true, entregadorId: true },
      });
      if (!pedido) return res.status(404).json({ error: 'Pedido não encontrado' });

      const autorizado =
        (participante.tipo === 'CONSUMER' && pedido.consumidorId === participante.id) ||
        (participante.tipo === 'LOJISTA' && pedido.lojaId === participante.id) ||
        (participante.tipo === 'ENTREGADOR' && pedido.entregadorId === participante.id);
      if (!autorizado) return res.status(403).json({ error: 'Acesso negado' });

      await prisma.chatPedido.upsert({
        where: { pedidoId: req.params.pedidoId },
        create: { pedidoId: req.params.pedidoId },
        update: {},
      });

      chat = await prisma.chatPedido.findUnique({
        where: { pedidoId: req.params.pedidoId },
        include: {
          pedido: {
            select: {
              consumidorId: true,
              lojaId: true,
              entregadorId: true,
              status: true,
              consumidor: { select: { nome: true } },
              loja: { select: { nome: true } },
              entregador: { select: { id: true, nome: true } },
            },
          },
        },
      });
      if (!chat) return res.status(500).json({ error: 'Erro ao criar chat' });
    }

    if (chat.status === 'encerrado') return res.status(400).json({ error: 'Chat encerrado' });

    const { pedido } = chat;

    const autorizado =
      (participante.tipo === 'CONSUMER' && pedido.consumidorId === participante.id) ||
      (participante.tipo === 'LOJISTA' && pedido.lojaId === participante.id) ||
      (participante.tipo === 'ENTREGADOR' && pedido.entregadorId === participante.id);

    if (!autorizado) return res.status(403).json({ error: 'Acesso negado' });

    const hasEntregador = !!pedido.entregadorId;
    if (!verificarPermissaoPar(participante.tipo, destinatarioType, hasEntregador)) {
      return res.status(400).json({ error: 'Par de participantes não permitido' });
    }

    // Resolver ID do destinatário
    let destinatarioId: string;
    if (destinatarioType === 'CONSUMER') destinatarioId = pedido.consumidorId;
    else if (destinatarioType === 'LOJISTA') destinatarioId = pedido.lojaId;
    else if (destinatarioType === 'ENTREGADOR') {
      if (!pedido.entregadorId) return res.status(400).json({ error: 'Sem entregador' });
      destinatarioId = pedido.entregadorId;
    } else return res.status(400).json({ error: 'Destinatário inválido' });

    let remetenteNome = '';
    if (participante.tipo === 'CONSUMER') remetenteNome = pedido.consumidor?.nome ?? 'Cliente';
    else if (participante.tipo === 'LOJISTA') remetenteNome = pedido.loja?.nome ?? 'Lojista';
    else remetenteNome = pedido.entregador?.nome ?? 'Entregador';

    const mensagem = await prisma.chatMensagemPedido.create({
      data: {
        chatId: chat.id,
        conteudo,
        remetenteType: participante.tipo,
        remetenteId: participante.id,
        destinatarioType,
        destinatarioId,
      },
    });

    const payload = {
      chatId: chat.id,
      pedidoId: chat.pedidoId,
      mensagem: {
        ...mensagem,
        remetenteNome,
        criadoEm: mensagem.criadoEm.toISOString(),
      },
    };

    emitChatMensagem(destinatarioType, destinatarioId, payload);

    // Push notification — best-effort, em paralelo. Não bloqueia a resposta.
    // O app do destinatário descarta a notificação se o chat alvo já estiver
    // aberto, pra não duplicar com a entrega em tempo real via socket.
    void notificarChatMensagem({
      destinatarioType,
      destinatarioId,
      remetenteNome,
      conteudo,
      pedidoId: chat.pedidoId,
      chatId: chat.id,
    });

    res.status(201).json({ mensagem: payload.mensagem });
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: err.errors });
    res.status(500).json({ error: 'Erro ao enviar mensagem' });
  }
});

// GET /v1/pedido-chat/historico
router.get('/historico', async (req: AuthRequest, res) => {
  try {
    const participante = await resolverParticipante(req);
    if (!participante) return res.status(403).json({ error: 'Acesso negado' });

    let pedidoWhere: Record<string, unknown> = {};
    if (participante.tipo === 'CONSUMER') pedidoWhere = { consumidorId: participante.id };
    else if (participante.tipo === 'LOJISTA') pedidoWhere = { lojaId: participante.id };
    else pedidoWhere = { entregadorId: participante.id };

    const chats = await prisma.chatPedido.findMany({
      where: { pedido: pedidoWhere },
      include: {
        pedido: {
          select: {
            id: true,
            status: true,
            consumidor: { select: { nome: true } },
            loja: { select: { nome: true, logoUrl: true } },
            entregador: { select: { nome: true } },
          },
        },
        mensagens: {
          orderBy: { criadoEm: 'desc' },
          take: 1,
        },
      },
      orderBy: { criadoEm: 'desc' },
    });

    const historicoComContagem = await Promise.all(
      chats.map(async (chat) => {
        const naoLidas = await prisma.chatMensagemPedido.count({
          where: {
            chatId: chat.id,
            destinatarioType: participante.tipo,
            destinatarioId: participante.id,
            lido: false,
          },
        });

        const ultimaMensagem = chat.mensagens[0]
          ? { ...chat.mensagens[0], criadoEm: chat.mensagens[0].criadoEm.toISOString() }
          : undefined;

        return {
          id: chat.id,
          pedidoId: chat.pedidoId,
          status: chat.status,
          lojaNome: chat.pedido.loja?.nome,
          lojaLogo: chat.pedido.loja?.logoUrl,
          consumidorNome: chat.pedido.consumidor?.nome,
          entregadorNome: chat.pedido.entregador?.nome,
          ultimaMensagem,
          naoLidas,
        };
      }),
    );

    res.json({ chats: historicoComContagem });
  } catch {
    res.status(500).json({ error: 'Erro ao buscar histórico' });
  }
});

// PUT /v1/pedido-chat/mensagem/:id/lido
router.put('/mensagem/:id/lido', async (req: AuthRequest, res) => {
  try {
    const participante = await resolverParticipante(req);
    if (!participante) return res.status(403).json({ error: 'Acesso negado' });

    await prisma.chatMensagemPedido.updateMany({
      where: {
        id: req.params.id,
        destinatarioType: participante.tipo,
        destinatarioId: participante.id,
      },
      data: { lido: true },
    });

    res.json({ ok: true });
  } catch {
    res.status(500).json({ error: 'Erro ao marcar mensagem como lida' });
  }
});

// PUT /v1/pedido-chat/pedido/:pedidoId/lido — marca todas as mensagens do chat como lidas
router.put('/pedido/:pedidoId/lido', async (req: AuthRequest, res) => {
  try {
    const participante = await resolverParticipante(req);
    if (!participante) return res.status(403).json({ error: 'Acesso negado' });

    let chat = await prisma.chatPedido.findUnique({
      where: { pedidoId: req.params.pedidoId },
      select: { id: true },
    });
    if (!chat) {
      const pedido = await prisma.pedido.findUnique({
        where: { id: req.params.pedidoId },
        select: { consumidorId: true, lojaId: true, entregadorId: true },
      });
      if (!pedido) return res.json({ ok: true });
      const autorizado =
        (participante.tipo === 'CONSUMER' && pedido.consumidorId === participante.id) ||
        (participante.tipo === 'LOJISTA' && pedido.lojaId === participante.id) ||
        (participante.tipo === 'ENTREGADOR' && pedido.entregadorId === participante.id);
      if (!autorizado) return res.json({ ok: true });
      await prisma.chatPedido.upsert({
        where: { pedidoId: req.params.pedidoId },
        create: { pedidoId: req.params.pedidoId },
        update: {},
      });
      chat = await prisma.chatPedido.findUnique({
        where: { pedidoId: req.params.pedidoId },
        select: { id: true },
      });
      if (!chat) return res.json({ ok: true });
    }

    await prisma.chatMensagemPedido.updateMany({
      where: {
        chatId: chat.id,
        destinatarioType: participante.tipo,
        destinatarioId: participante.id,
        lido: false,
      },
      data: { lido: true },
    });

    res.json({ ok: true });
  } catch {
    res.status(500).json({ error: 'Erro ao marcar mensagens como lidas' });
  }
});

export default router;
