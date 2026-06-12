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

export type InfoLoja = {
  nome: string;
  descricao: string;
  categoria: string;
  telefone: string;
  whatsapp: string | null;
  aberta: boolean;
  tempoEntregaMin: number;
  tempoEntregaMax: number;
  taxaEntrega: number;
  endereco: { rua: string; numero: string | null; bairro: string; cidade: string } | null;
  horarios: { diaSemana: number; ativo: boolean; abertura: string; fechamento: string }[];
};

export type ToolResult =
  | { tipo: 'produtos'; dados: ProdutoRAG[]; aproximado?: boolean; foraContextoLoja?: boolean }
  | { tipo: 'pedidos'; dados: PedidoResumo[] }
  | { tipo: 'ticket'; dados: { criado: boolean; protocolo: string } }
  | { tipo: 'infoLoja'; dados: InfoLoja | null }
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

/** Converte argumento de preço (string vinda da tool) em número válido, ou undefined. */
function parsePreco(valor?: string): number | undefined {
  if (valor == null || valor === '') return undefined;
  const n = Number(valor);
  // Rejeita zero, negativo e não-finito — não são orçamentos válidos
  return Number.isFinite(n) && n > 0 ? n : undefined;
}

export async function executarBuscarProdutos(
  query: string,
  opts: { lojaId?: string; lojaNome?: string; precoMax?: number; precoMin?: number } = {},
): Promise<ToolResult> {
  const { lojaNome, precoMax, precoMin } = opts;
  const lojaId = await resolverLojaId(lojaNome, opts.lojaId);

  // Remove palavras de navegação para decidir se há um termo de produto real.
  const queryUtil = query
    .replace(/\b(produtos?|da|de|do|na?|loja|ver|quero|mostrar?|me|todos?|tudo)\b/gi, '')
    .trim();

  // Loja específica sem termo → lista o catálogo sem filtros adicionais.
  if (lojaId && queryUtil.length < 3 && precoMax == null && precoMin == null) {
    return { tipo: 'produtos', dados: await buscarProdutosPorLoja(lojaId) };
  }

  // 1) Busca exata respeitando todos os filtros.
  const exatos = await buscarProdutosRAG(query, { lojaId, precoMax, precoMin });
  if (exatos.length > 0) return { tipo: 'produtos', dados: exatos };

  // 2) Nada dentro do orçamento → relaxa o preço, ainda dentro da loja.
  if ((precoMax != null || precoMin != null) && lojaId) {
    const parecidosNaLoja = await buscarProdutosRAG(query, { lojaId });
    if (parecidosNaLoja.length > 0)
      return { tipo: 'produtos', dados: parecidosNaLoja, aproximado: true };
  }
  if (precoMax != null || precoMin != null) {
    const parecidos = await buscarProdutosRAG(query, { lojaId });
    if (parecidos.length > 0) return { tipo: 'produtos', dados: parecidos, aproximado: true };
  }

  // 3) Ainda nada na loja → busca global e sinaliza que saiu do contexto da loja.
  if (lojaId) {
    const global = await buscarProdutosRAG(query, { precoMax, precoMin });
    if (global.length > 0) return { tipo: 'produtos', dados: global, foraContextoLoja: true };
    const globalFallback = await buscarProdutosFallback(query, { precoMax, precoMin });
    return { tipo: 'produtos', dados: globalFallback, foraContextoLoja: globalFallback.length > 0 };
  }

  // 4) Sem lojaId → fallback por keyword.
  return {
    tipo: 'produtos',
    dados: await buscarProdutosFallback(query, { precoMax, precoMin }),
    aproximado: true,
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

export async function executarBuscarInfoLoja(opts: {
  lojaId?: string;
  lojaNome?: string;
}): Promise<ToolResult> {
  const lojaId = await resolverLojaId(opts.lojaNome, opts.lojaId);
  if (!lojaId) return { tipo: 'infoLoja', dados: null };

  const loja = await prisma.loja.findUnique({
    where: { id: lojaId },
    select: {
      nome: true,
      descricao: true,
      categoria: true,
      telefone: true,
      whatsapp: true,
      aberta: true,
      tempoEntregaMin: true,
      tempoEntregaMax: true,
      taxaEntrega: true,
      endereco: { select: { rua: true, numero: true, bairro: true, cidade: true } },
      horarios: { select: { diaSemana: true, ativo: true, abertura: true, fechamento: true } },
    },
  });

  if (!loja) return { tipo: 'infoLoja', dados: null };

  return {
    tipo: 'infoLoja',
    dados: {
      nome: loja.nome,
      descricao: loja.descricao,
      categoria: loja.categoria,
      telefone: loja.telefone,
      whatsapp: loja.whatsapp,
      aberta: loja.aberta,
      tempoEntregaMin: loja.tempoEntregaMin,
      tempoEntregaMax: loja.tempoEntregaMax,
      taxaEntrega: Number(loja.taxaEntrega),
      endereco: loja.endereco
        ? {
            rua: loja.endereco.rua,
            numero: loja.endereco.numero,
            bairro: loja.endereco.bairro,
            cidade: loja.endereco.cidade,
          }
        : null,
      horarios: loja.horarios.map((h) => ({
        diaSemana: h.diaSemana,
        ativo: h.ativo,
        abertura: h.abertura,
        fechamento: h.fechamento,
      })),
    },
  };
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
    case 'buscar_produtos': {
      const precoMax = parsePreco(args.precoMax);
      const precoMin = parsePreco(args.precoMin);
      return executarBuscarProdutos(args.query ?? '', {
        lojaId: args.lojaId,
        lojaNome: args.lojaNome,
        precoMax,
        precoMin,
      });
    }
    case 'listar_pedidos':
      return executarListarPedidos(usuarioId, args.lojaNome);
    case 'buscar_info_loja':
      return executarBuscarInfoLoja({ lojaId: args.lojaId, lojaNome: args.lojaNome });
    case 'criar_ticket':
      return executarCriarTicket(args.motivo ?? '', usuarioId, args.pedidoId);
    default:
      return { tipo: 'vazio', dados: null };
  }
}
