import { Prisma, StatusPedido } from '@prisma/client';
import { prisma } from './prisma';
import { ProdutoRAG } from './ragSearch';

// ─── Regras de negócio ────────────────────────────────────────────────────────

/**
 * Status em que um pedido pode receber reclamação: só faz sentido reclamar de algo
 * que já saiu para entrega ou foi entregue (atraso, não chegou, veio errado/quebrado).
 * Pedidos ainda em preparo (aguardando/confirmado/preparando/pronto) não são reclamáveis.
 */
export const STATUS_RECLAMAVEL: StatusPedido[] = ['saiu_entrega', 'entregue'];

// ─── Estado da conversa (queixa flow) ────────────────────────────────────────

export type PedidoCardData = {
  numero: number;
  id: string;
  loja: string;
  total: number;
  data: string;
  itens: string[];
  status: string;
};

export type EstadoSelecionandoPedido = {
  passo: 'selecionando_pedido';
  motivo: string;
  pedidos: PedidoCardData[];
};

export type EstadoConfirmando = {
  passo: 'confirmando';
  motivo: string;
  pedidoId: string;
  pedido: PedidoCardData;
  pedidos: PedidoCardData[];
};

export type EstadoSelecionandoPedidoRastreio = {
  passo: 'selecionando_pedido_rastreio';
  pedidos: PedidoCardData[];
};

export type EstadoRastreioConcluido = {
  passo: 'rastreio_concluido';
  pedidoId: string;
};

export type EstadoConversa =
  | null
  | EstadoSelecionandoPedido
  | EstadoConfirmando
  | EstadoSelecionandoPedidoRastreio
  | EstadoRastreioConcluido;

// ─── Conversa ─────────────────────────────────────────────────────────────────

export async function obterOuCriarConversa(usuarioId: string, conversaId?: string) {
  if (conversaId) {
    const existente = await prisma.conversaChat.findFirst({
      where: { id: conversaId, usuarioId },
    });
    if (existente) return existente;
  }
  return prisma.conversaChat.create({ data: { usuarioId } });
}

/**
 * Retorna a conversa mais recente do usuário com até 50 mensagens (ordem cronológica),
 * para reidratar o chat em um novo aparelho / web / após limpeza de dados.
 */
export async function obterHistorico(
  usuarioId: string,
): Promise<{
  conversaId?: string;
  mensagens: { id: string; remetente: string; conteudo: string; criadaEm: string }[];
}> {
  const conversa = await prisma.conversaChat.findFirst({
    where: { usuarioId },
    orderBy: { atualizadoEm: 'desc' },
    include: {
      mensagens: { orderBy: { criadaEm: 'desc' }, take: 50 },
    },
  });

  if (!conversa) return { mensagens: [] };

  const mensagens = conversa.mensagens
    .slice()
    .reverse()
    .map((m) => ({
      id: m.id,
      remetente: m.remetente,
      conteudo: m.conteudo,
      criadaEm: m.criadaEm.toISOString(),
    }));

  return { conversaId: conversa.id, mensagens };
}

/** Apaga todas as conversas do usuário (mensagens e estado caem em cascata). */
export async function limparHistorico(usuarioId: string): Promise<void> {
  await prisma.conversaChat.deleteMany({ where: { usuarioId } });
}

// ─── Mensagens ────────────────────────────────────────────────────────────────

export async function salvarMensagens(
  conversaId: string,
  conteudoUser: string,
  conteudoAssistente: string,
) {
  const [msgUser, msgAju] = await prisma.$transaction([
    prisma.mensagemChat.create({
      data: { conversaId, remetente: 'usuario', conteudo: conteudoUser },
    }),
    prisma.mensagemChat.create({
      data: { conversaId, remetente: 'aju', conteudo: conteudoAssistente },
    }),
  ]);
  return { msgUser, msgAju };
}

// ─── Sugestões de produto ─────────────────────────────────────────────────────

export async function salvarSugestoesChat(mensagemId: string, produtos: ProdutoRAG[]) {
  if (produtos.length === 0) return;
  await prisma.sugestaoProdutoChat.createMany({
    data: produtos.slice(0, 3).map((p) => ({ mensagemId, produtoId: p.id })),
    skipDuplicates: true,
  });
}

export async function registrarClique(sugestaoId: string) {
  await prisma.sugestaoProdutoChat.update({
    where: { id: sugestaoId },
    data: { clicadoEm: new Date() },
  });
}

// ─── Estado do queixa flow ────────────────────────────────────────────────────

export async function atualizarEstado(conversaId: string, novoEstado: EstadoConversa) {
  await prisma.conversaChat.update({
    where: { id: conversaId },
    data: {
      estado: novoEstado === null ? Prisma.DbNull : (novoEstado as Prisma.JsonObject),
    },
  });
}

export async function obterEstado(conversaId: string): Promise<EstadoConversa> {
  const conversa = await prisma.conversaChat.findUnique({
    where: { id: conversaId },
    select: { estado: true },
  });
  return (conversa?.estado ?? null) as EstadoConversa;
}
