import { prisma } from '../utils/prisma';
import { buscarProdutosRAG, buscarProdutosFallback, ProdutoRAG } from '../utils/ragSearch';

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

export async function executarBuscarProdutos(query: string): Promise<ToolResult> {
  const produtos = await buscarProdutosRAG(query);
  if (produtos.length === 0) {
    return { tipo: 'produtos', dados: await buscarProdutosFallback(query) };
  }
  return { tipo: 'produtos', dados: produtos };
}

export async function executarListarPedidos(usuarioId: string): Promise<ToolResult> {
  const pedidos = await prisma.pedido.findMany({
    where: { consumidorId: usuarioId },
    orderBy: { criadoEm: 'desc' },
    take: 5,
    include: {
      loja: { select: { nome: true } },
      itens: { select: { nomeSnapshot: true, quantidade: true } },
    },
  });

  const dados: PedidoResumo[] = pedidos.map(p => ({
    id: p.id,
    loja: p.loja.nome,
    status: p.status,
    total: Number(p.total),
    itens: p.itens.map(i => `${i.nomeSnapshot} x${i.quantidade}`),
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

  console.log(
    `[ticket] ${protocolo} | usuário: ${usuarioId} | motivo: ${motivo}` +
    (pedidoId ? ` | pedido: ${pedidoId}` : ''),
  );

  notificarSlack({ protocolo, motivo, usuarioId, pedidoId }).catch(err =>
    console.error('[ticket] erro no Slack:', err),
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
  ].filter(Boolean).join('\n');

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
      return executarBuscarProdutos(args.query ?? '');
    case 'listar_pedidos':
      return executarListarPedidos(usuarioId);
    case 'criar_ticket':
      return executarCriarTicket(args.motivo ?? '', usuarioId, args.pedidoId);
    default:
      return { tipo: 'vazio', dados: null };
  }
}
