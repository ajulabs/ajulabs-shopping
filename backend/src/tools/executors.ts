import { prisma } from '../utils/prisma';
import {
  buscarProdutosRAG,
  buscarProdutosFallback,
  buscarProdutosPorLoja,
  ProdutoRAG,
} from '../utils/ragSearch';
import { logger } from '../lib/logger';

// ─── Result types ────────────────────────────────────────────────────────────

export type PedidoResumo = {
  id: string;
  loja: string;
  status: string;
  total: number;
  itens: string[];
  criadoEm: string;
};

export type ToolResult =
  | { tipo: 'produtos'; dados: ProdutoRAG[] }
  | { tipo: 'pedidos'; dados: PedidoResumo[] }
  | { tipo: 'ticket'; dados: { criado: boolean; protocolo: string } }
  | { tipo: 'vazio'; dados: null };

// ─── Executors ────────────────────────────────────────────────────────────────

/** Resolve o UUID de uma loja a partir do nome fornecido pelo usuário (busca parcial/case-insensitive). */
async function resolverLojaId(lojaNome?: string, lojaId?: string): Promise<string | undefined> {
  if (lojaId) return lojaId;
  if (!lojaNome?.trim()) return undefined;
  const loja = await prisma.loja.findFirst({
    where: { nome: { contains: lojaNome.trim(), mode: 'insensitive' } },
    select: { id: true },
  });
  return loja?.id;
}

export async function executarBuscarProdutos(
  query: string,
  opts: { lojaId?: string; lojaNome?: string } = {},
): Promise<ToolResult> {
  const { lojaNome } = opts;
  const lojaId = await resolverLojaId(lojaNome, opts.lojaId);

  // Remove palavras de navegação para decidir se há um termo de produto real.
  const queryUtil = query
    .replace(/\b(produtos?|da|de|do|na?|loja|ver|quero|mostrar?|me|todos?|tudo)\b/gi, '')
    .trim();

  // Loja específica sem termo de produto → lista o catálogo da loja.
  if (lojaId && queryUtil.length < 3) {
    return { tipo: 'produtos', dados: await buscarProdutosPorLoja(lojaId) };
  }

  const produtos = await buscarProdutosRAG(query);
  if (produtos.length === 0) {
    if (lojaId) return { tipo: 'produtos', dados: await buscarProdutosPorLoja(lojaId) };
    return { tipo: 'produtos', dados: await buscarProdutosFallback(query) };
  }
  // Se há lojaId, filtra os resultados da busca semântica para só mostrar dessa loja.
  return {
    tipo: 'produtos',
    dados: lojaId ? produtos.filter((p) => p.lojaId === lojaId) : produtos,
  };
}

export async function executarListarPedidos(
  usuarioId: string,
  lojaNome?: string,
): Promise<ToolResult> {
  const lojaId = lojaNome ? await resolverLojaId(lojaNome) : undefined;

  const pedidos = await prisma.pedido.findMany({
    where: { consumidorId: usuarioId, ...(lojaId ? { lojaId } : {}) },
    orderBy: { criadoEm: 'desc' },
    take: 5,
    include: {
      loja: { select: { nome: true } },
      itens: { select: { nomeSnapshot: true, quantidade: true } },
    },
  });

  const dados: PedidoResumo[] = pedidos.map((p) => ({
    id: p.id,
    loja: p.loja.nome,
    status: p.status,
    total: Number(p.total),
    itens: p.itens.map((i) => `${i.nomeSnapshot} x${i.quantidade}`),
    criadoEm: p.criadoEm.toISOString(),
  }));

  return { tipo: 'pedidos', dados };
}

export async function executarCriarTicket(
  motivo: string,
  usuarioId: string,
  pedidoId?: string,
): Promise<ToolResult> {
  const protocolo = `TKT-${Date.now()}`;

  logger.info(
    `[ticket] ${protocolo} | usuário: ${usuarioId} | motivo: ${motivo}` +
      (pedidoId ? ` | pedido: ${pedidoId}` : ''),
  );

  notificarSlack({ protocolo, motivo, usuarioId, pedidoId }).catch((err) =>
    logger.error({ err }, '[ticket] erro no Slack'),
  );

  return { tipo: 'ticket', dados: { criado: true, protocolo } };
}

async function notificarSlack(dados: {
  protocolo: string;
  motivo: string;
  usuarioId: string;
  pedidoId?: string;
}): Promise<void> {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;
  if (!webhookUrl) return;

  const linhas = [
    `🆘 *Novo Ticket* — \`${dados.protocolo}\``,
    `*Usuário:* ${dados.usuarioId}`,
    dados.pedidoId ? `*Pedido:* \`${dados.pedidoId}\`` : null,
    `*Motivo:* ${dados.motivo}`,
  ]
    .filter(Boolean)
    .join('\n');

  await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: linhas }),
  });
}

// ─── Dispatcher ───────────────────────────────────────────────────────────────

export async function executarTool(
  nome: string,
  args: Record<string, string>,
  usuarioId: string,
): Promise<ToolResult> {
  switch (nome) {
    case 'buscar_produtos':
      return executarBuscarProdutos(args.query ?? '', {
        lojaId: args.lojaId,
        lojaNome: args.lojaNome,
      });
    case 'listar_pedidos':
      return executarListarPedidos(usuarioId, args.lojaNome);
    case 'criar_ticket':
      return executarCriarTicket(args.motivo ?? '', usuarioId, args.pedidoId);
    default:
      return { tipo: 'vazio', dados: null };
  }
}
