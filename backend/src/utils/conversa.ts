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
export async function obterHistorico(usuarioId: string): Promise<{
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

/**
 * Retorna o lojaId mais recente encontrado nas mensagens do usuário nesta conversa.
 * O [lojaId:UUID] é embutido pelo app quando o usuário clica em "Conversar com a Aju
 * sobre essa loja" e fica salvo no conteúdo raw da mensagem no banco.
 */
export async function obterLojaContexto(conversaId: string): Promise<string | null> {
  const mensagens = await prisma.mensagemChat.findMany({
    where: { conversaId, remetente: 'usuario' },
    orderBy: { criadaEm: 'desc' },
    take: 30,
    select: { conteudo: true },
  });
  for (const m of mensagens) {
    const match = m.conteudo.match(/\[lojaId:([0-9a-f-]{36})\]/i);
    if (match) return match[1];
  }
  return null;
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
  // Preserva o lojaContexto que pode estar no estado atual — ele é armazenado junto
  // ao estado do fluxo e não deve ser apagado quando o passo muda ou é zerado.
  const atual = await prisma.conversaChat.findUnique({
    where: { id: conversaId },
    select: { estado: true },
  });
  const lojaContexto =
    typeof (atual?.estado as Record<string, unknown> | null)?.lojaContexto === 'string'
      ? (atual!.estado as Record<string, unknown>).lojaContexto
      : undefined;

  const estadoFinal =
    novoEstado === null
      ? lojaContexto
        ? ({ lojaContexto } as Prisma.JsonObject)
        : Prisma.DbNull
      : ({
          ...(novoEstado as Prisma.JsonObject),
          ...(lojaContexto ? { lojaContexto } : {}),
        } as Prisma.JsonObject);

  await prisma.conversaChat.update({
    where: { id: conversaId },
    data: { estado: estadoFinal },
  });
}

export async function obterEstado(conversaId: string): Promise<EstadoConversa> {
  const conversa = await prisma.conversaChat.findUnique({
    where: { id: conversaId },
    select: { estado: true },
  });
  return (conversa?.estado ?? null) as EstadoConversa;
}
