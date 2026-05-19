import { Prisma } from '@prisma/client';
import { prisma } from './prisma';
import { ProdutoRAG } from './ragSearch';

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

export type EstadoConversa = null | EstadoSelecionandoPedido | EstadoConfirmando;

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
    data: produtos.slice(0, 3).map(p => ({ mensagemId, produtoId: p.id })),
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
      estado: novoEstado === null
        ? Prisma.DbNull
        : (novoEstado as Prisma.JsonObject),
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
