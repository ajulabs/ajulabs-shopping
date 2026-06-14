import { Prisma, StatusPedido } from '@prisma/client';
import { prisma } from './prisma';
import { ProdutoRAG } from './ragSearch';

// ─── Regras de negócio ────────────────────────────────────────────────────────

/**
 * Status em que um pedido pode receber reclamação.
 * Inclui todos os status ativos (não cancelados) — o usuário pode ter problemas
 * em qualquer fase: atraso na confirmação, preparo demorado, entrega errada, etc.
 */
export const STATUS_RECLAMAVEL: StatusPedido[] = [
  'aguardando',
  'confirmado',
  'preparando',
  'pronto',
  'saiu_entrega',
  'entregue',
];

// ─── Estado da conversa (queixa flow) ────────────────────────────────────────

export type PedidoCardData = {
  numero: number;
  id: string;
  loja: string;
  lojaImagem?: string | null;
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

export type ProdutoHistorico = {
  id: string;
  nome: string;
  preco: number;
  imagemUrl: string;
  lojaId: string;
  loja: string;
};

/**
 * Retorna a conversa mais recente do usuário com até 100 mensagens (ordem cronológica),
 * incluindo produtos sugeridos em cada mensagem para reidratar os cards no app.
 */
export async function obterHistorico(usuarioId: string): Promise<{
  conversaId?: string;
  mensagens: {
    id: string;
    remetente: string;
    conteudo: string;
    criadaEm: string;
    produtos?: ProdutoHistorico[];
  }[];
}> {
  const conversa = await prisma.conversaChat.findFirst({
    where: { usuarioId },
    orderBy: { atualizadoEm: 'desc' },
    include: {
      mensagens: {
        orderBy: { criadaEm: 'desc' },
        take: 100,
        include: {
          sugestoes: {
            include: {
              produto: {
                select: {
                  id: true,
                  nome: true,
                  preco: true,
                  imagemUrl: true,
                  lojaId: true,
                  loja: { select: { nome: true } },
                },
              },
            },
          },
        },
      },
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
      ...(m.sugestoes.length > 0 && {
        produtos: m.sugestoes.map((s) => ({
          id: s.produto.id,
          nome: s.produto.nome,
          preco: Number(s.produto.preco),
          imagemUrl: s.produto.imagemUrl,
          lojaId: s.produto.lojaId,
          loja: s.produto.loja.nome,
        })),
      }),
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

/**
 * Retorna as últimas N mensagens da conversa para compor o contexto do AI.
 * Usa o conteúdo salvo no banco (que inclui detalhes de produtos) em vez do
 * histórico enviado pelo frontend, que só tem o texto de display.
 */
export async function obterHistoricoParaIA(
  conversaId: string,
  limite = 20,
): Promise<{ remetente: string; conteudo: string }[]> {
  const msgs = await prisma.mensagemChat.findMany({
    where: { conversaId },
    orderBy: { criadaEm: 'desc' },
    take: limite,
    select: { remetente: true, conteudo: true },
  });
  return msgs.reverse();
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
