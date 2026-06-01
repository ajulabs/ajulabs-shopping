import { prisma } from '../utils/prisma';
import {
  atualizarEstado,
  obterEstado,
  PedidoCardData,
  EstadoConfirmando,
  EstadoSelecionandoPedido,
} from '../utils/conversa';
import { executarCriarTicket } from './executors';
import { emitTicketNovo } from '../utils/socket';
import { notificarTicketNovo } from '../lib/pushNotifications';

// ─── Tipos de retorno ─────────────────────────────────────────────────────────

export type RespostaSelecionarPedido = {
  tipo: 'selecionarPedido';
  pedidos: PedidoCardData[];
  texto: string;
};

export type RespostaConfirmarPedido = {
  tipo: 'confirmarPedido';
  pedido: PedidoCardData;
  texto: string;
};

export type RespostaFluxo =
  | RespostaSelecionarPedido
  | RespostaConfirmarPedido
  | { tipo: 'resposta'; texto: string; sugestoes: string[] };

// ─── Passo 1: inicia o fluxo de queixa ───────────────────────────────────────

export async function iniciarFluxoQueixa(
  conversaId: string,
  usuarioId: string,
  motivoQueixa: string,
): Promise<RespostaSelecionarPedido> {
  const pedidosRaw = await prisma.pedido.findMany({
    where: { consumidorId: usuarioId, status: 'entregue' },
    orderBy: { criadoEm: 'desc' },
    take: 5,
    include: {
      loja: { select: { nome: true } },
      itens: { select: { nomeSnapshot: true, quantidade: true } },
    },
  });

  if (pedidosRaw.length === 0) {
    await atualizarEstado(conversaId, null);
    return {
      tipo: 'selecionarPedido',
      pedidos: [],
      texto:
        'Não encontrei pedidos entregues na sua conta. A reclamação precisa ser sobre um pedido que você já recebeu. Posso te ajudar com outra coisa?',
    };
  }

  const pedidos: PedidoCardData[] = pedidosRaw.map((p, idx) => ({
    numero: idx + 1,
    id: p.id,
    loja: p.loja.nome,
    total: Number(p.total),
    data: p.criadoEm.toISOString().split('T')[0],
    itens: p.itens.map((i) =>
      i.quantidade > 1 ? `${i.nomeSnapshot} x${i.quantidade}` : i.nomeSnapshot,
    ),
    status: p.status,
  }));

  await atualizarEstado(conversaId, {
    passo: 'selecionando_pedido',
    motivo: motivoQueixa,
    pedidos,
  } satisfies EstadoSelecionandoPedido);

  return {
    tipo: 'selecionarPedido',
    pedidos,
    texto: 'Qual desses pedidos está com problema?',
  };
}

// ─── Atalho: inicia queixa já com pedido pré-selecionado ─────────────────────

export async function iniciarFluxoQueixaComPedido(
  conversaId: string,
  usuarioId: string,
  motivo: string,
  pedidoId: string,
): Promise<RespostaFluxo> {
  const ticketExistente = await prisma.supportTicket.findFirst({
    where: {
      consumidorId: usuarioId,
      pedidoId,
      status: { in: ['aberto', 'em_andamento'] },
    },
    select: { protocolo: true },
  });

  if (ticketExistente) {
    return {
      tipo: 'resposta',
      texto: `Você já tem uma reclamação aberta para este pedido com o protocolo *${ticketExistente.protocolo}*. Acompanhe o andamento na tela de tickets — a loja já está ciente do problema.`,
      sugestoes: ['Ver meus tickets', 'Buscar produtos'],
    };
  }

  const pedidoRaw = await prisma.pedido.findFirst({
    where: { id: pedidoId, consumidorId: usuarioId },
    include: {
      loja: { select: { nome: true } },
      itens: { select: { nomeSnapshot: true, quantidade: true } },
    },
  });

  if (!pedidoRaw) return iniciarFluxoQueixa(conversaId, usuarioId, motivo);

  const pedido: PedidoCardData = {
    numero: 1,
    id: pedidoRaw.id,
    loja: pedidoRaw.loja.nome,
    total: Number(pedidoRaw.total),
    data: pedidoRaw.criadoEm.toISOString().split('T')[0],
    itens: pedidoRaw.itens.map((i) =>
      i.quantidade > 1 ? `${i.nomeSnapshot} x${i.quantidade}` : i.nomeSnapshot,
    ),
    status: pedidoRaw.status,
  };

  await atualizarEstado(conversaId, {
    passo: 'confirmando',
    motivo,
    pedidoId: pedido.id,
    pedido,
    pedidos: [pedido],
  } satisfies EstadoConfirmando);

  return {
    tipo: 'confirmarPedido',
    pedido,
    texto: `Confirma que o problema é com o pedido da ${pedido.loja}? (${pedido.data})`,
  };
}

// ─── Passo 2: processa seleção de pedido ─────────────────────────────────────

export async function processarSelecaoPedido(
  conversaId: string,
  textoUser: string,
  pedidoSelecionadoId?: string,
): Promise<RespostaSelecionarPedido | RespostaConfirmarPedido> {
  const estado = (await obterEstado(conversaId)) as EstadoSelecionandoPedido | null;
  if (!estado || estado.passo !== 'selecionando_pedido') {
    throw new Error('Estado inválido para seleção de pedido');
  }

  let pedido: PedidoCardData | undefined;

  if (pedidoSelecionadoId) {
    pedido = estado.pedidos.find((p) => p.id === pedidoSelecionadoId);
  }

  if (!pedido) {
    const match = textoUser.match(/\b([1-5])\b/);
    if (match) {
      pedido = estado.pedidos.find((p) => p.numero === parseInt(match[1]));
    }
  }

  if (!pedido) {
    const lower = textoUser.toLowerCase();
    pedido = estado.pedidos.find((p) => lower.includes(p.loja.toLowerCase().split(' ')[0]));
  }

  if (!pedido) {
    return {
      tipo: 'selecionarPedido',
      pedidos: estado.pedidos,
      texto: 'Não consegui identificar o pedido. Toque em um dos cards acima para selecionar.',
    };
  }

  await atualizarEstado(conversaId, {
    passo: 'confirmando',
    motivo: estado.motivo,
    pedidoId: pedido.id,
    pedido,
    pedidos: estado.pedidos,
  } satisfies EstadoConfirmando);

  return {
    tipo: 'confirmarPedido',
    pedido,
    texto: `Confirma que o problema é com o pedido da ${pedido.loja}? (${pedido.data})`,
  };
}

// ─── Passo 3: processa confirmação ───────────────────────────────────────────

export async function processarConfirmacao(
  conversaId: string,
  usuarioId: string,
  textoUser: string,
): Promise<RespostaFluxo> {
  const estado = (await obterEstado(conversaId)) as EstadoConfirmando | null;
  if (!estado || estado.passo !== 'confirmando') {
    throw new Error('Estado inválido para confirmação');
  }

  const lower = textoUser.toLowerCase();
  const cancelado = /\b(n[aã]o|nao|cancelar|cancela|errado|outro|voltar)\b/.test(lower);
  const confirmado = /\b(sim|confirma|confirmar|ok|isso|correto|exato|certo|s|yes)\b/.test(lower);

  if (cancelado) {
    await atualizarEstado(conversaId, {
      passo: 'selecionando_pedido',
      motivo: estado.motivo,
      pedidos: estado.pedidos,
    } satisfies EstadoSelecionandoPedido);
    return {
      tipo: 'selecionarPedido',
      pedidos: estado.pedidos,
      texto: 'Tudo bem! Qual pedido você quer reportar o problema?',
    };
  }

  if (!confirmado) {
    return {
      tipo: 'resposta',
      texto: `Confirma que o problema é com o pedido da ${estado.pedido.loja}? Responda "sim" para confirmar ou "não" para escolher outro.`,
      sugestoes: ['Sim, confirmar', 'Escolher outro pedido'],
    };
  }

  // Verifica se já existe ticket ativo para este pedido
  if (estado.pedidoId) {
    const ticketExistente = await prisma.supportTicket.findFirst({
      where: {
        consumidorId: usuarioId,
        pedidoId: estado.pedidoId,
        status: { in: ['aberto', 'em_andamento'] },
      },
      select: { protocolo: true },
    });

    if (ticketExistente) {
      await atualizarEstado(conversaId, null);
      return {
        tipo: 'resposta',
        texto: `Você já tem uma reclamação aberta para este pedido com o protocolo *${ticketExistente.protocolo}*. Acompanhe o andamento na tela de tickets — a loja já está ciente do problema.`,
        sugestoes: ['Ver meus tickets', 'Buscar produtos'],
      };
    }
  }

  // Cria ticket com pedidoId real
  const result = await executarCriarTicket(estado.motivo, usuarioId, estado.pedidoId);
  const { protocolo } = result.dados as { criado: boolean; protocolo: string };

  const pedido = estado.pedidoId
    ? await prisma.pedido.findUnique({ where: { id: estado.pedidoId }, select: { lojaId: true } })
    : null;

  const ticket = await prisma.supportTicket.create({
    data: {
      consumidorId: usuarioId,
      pedidoId: estado.pedidoId,
      lojaId: pedido?.lojaId ?? null,
      motivo: estado.motivo,
      protocolo,
    },
  });

  if (pedido?.lojaId) {
    emitTicketNovo(pedido.lojaId, {
      id: ticket.id,
      protocolo,
      motivo: estado.motivo,
      consumidorId: usuarioId,
    });
    void notificarTicketNovo(pedido.lojaId, ticket.id, estado.motivo);
  }

  await atualizarEstado(conversaId, null);

  return {
    tipo: 'resposta',
    texto: `Pronto! Ticket registrado com o protocolo *${protocolo}*. Nossa equipe vai entrar em contato em breve. 🙏`,
    sugestoes: ['Ver meus pedidos', 'Buscar produtos'],
  };
}
