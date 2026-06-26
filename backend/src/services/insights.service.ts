import { prisma } from '../utils/prisma';
import type { Insight, InsightSeveridade } from '@ajulabs/types';

/**
 * Motor de insights do lojista — 100% determinístico (sem IA / sem custo).
 * Agrega dados reais que já existem no banco (pedidos, itens, produtos,
 * avaliações) e deriva insights acionáveis. O resultado é cacheado em memória
 * por alguns minutos, porque é o mesmo para todas as aberturas do dashboard
 * dentro da janela — não precisa recomputar a cada request.
 */

const TTL_MS = 10 * 60 * 1000; // 10 min
const cache = new Map<string, { ts: number; data: Insight[] }>();

// Ordem de prioridade na hora de exibir (mais grave primeiro).
const ORDEM: Record<InsightSeveridade, number> = {
  critico: 0,
  atencao: 1,
  positivo: 2,
  info: 3,
};

function brl(n: number): string {
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function pctStr(frac: number): string {
  const p = Math.round(frac * 100);
  return `${p > 0 ? '+' : ''}${p}%`;
}

export async function gerarInsights(lojaId: string): Promise<Insight[]> {
  const hit = cache.get(lojaId);
  if (hit && Date.now() - hit.ts < TTL_MS) return hit.data;

  const agora = new Date();
  const DIA = 24 * 60 * 60 * 1000;
  const ini7 = new Date(agora.getTime() - 7 * DIA);
  const ini14 = new Date(agora.getTime() - 14 * DIA);
  const ini30 = new Date(agora.getTime() - 30 * DIA);

  const [fat7, fatPrev7, top30, totalMes, canceladosMes, motivoTop, aval, vendidos30] =
    await Promise.all([
      // faturamento últimos 7 dias
      prisma.pedido.findMany({
        where: { lojaId, status: { not: 'cancelado' }, criadoEm: { gte: ini7 } },
        select: { total: true },
      }),
      // faturamento dos 7 dias anteriores (para comparar tendência)
      prisma.pedido.findMany({
        where: { lojaId, status: { not: 'cancelado' }, criadoEm: { gte: ini14, lt: ini7 } },
        select: { total: true },
      }),
      // produtos mais vendidos em 30 dias
      prisma.itemPedido.groupBy({
        by: ['produtoId', 'nomeSnapshot'],
        where: { pedido: { lojaId, status: { not: 'cancelado' }, criadoEm: { gte: ini30 } } },
        _sum: { quantidade: true },
        orderBy: { _sum: { quantidade: 'desc' } },
        take: 5,
      }),
      // total e cancelados em 30 dias (taxa de cancelamento)
      prisma.pedido.count({ where: { lojaId, criadoEm: { gte: ini30 } } }),
      prisma.pedido.count({
        where: { lojaId, status: 'cancelado', criadoEm: { gte: ini30 } },
      }),
      // motivo de cancelamento mais comum
      prisma.pedido.groupBy({
        by: ['motivoCancelamento'],
        where: {
          lojaId,
          status: 'cancelado',
          criadoEm: { gte: ini30 },
          motivoCancelamento: { not: null },
        },
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 1,
      }),
      // avaliações em 30 dias
      prisma.avaliacaoLoja.findMany({
        where: { lojaId, criadoEm: { gte: ini30 } },
        select: { nota: true },
      }),
      // ids de produtos que tiveram alguma venda em 30 dias (para achar encalhe)
      prisma.itemPedido.findMany({
        where: { pedido: { lojaId, status: { not: 'cancelado' }, criadoEm: { gte: ini30 } } },
        select: { produtoId: true },
        distinct: ['produtoId'],
      }),
    ]);

  const insights: Insight[] = [];

  const somarTotais = (rows: { total: unknown }[]) =>
    rows.reduce((acc, r) => acc + Number(r.total), 0);

  // ── 1) Tendência de faturamento (7d vs 7d anteriores) ──
  const f7 = somarTotais(fat7);
  const fp = somarTotais(fatPrev7);
  if (fp > 0) {
    const delta = (f7 - fp) / fp;
    if (delta <= -0.15) {
      insights.push({
        id: 'fat-queda',
        tipo: 'faturamento',
        severidade: 'atencao',
        titulo: 'Faturamento em queda',
        detalhe: `Você faturou ${brl(f7)} nos últimos 7 dias — ${pctStr(delta)} em relação à semana anterior.`,
        valor: pctStr(delta),
      });
    } else if (delta >= 0.15) {
      insights.push({
        id: 'fat-alta',
        tipo: 'faturamento',
        severidade: 'positivo',
        titulo: 'Faturamento em alta',
        detalhe: `Você faturou ${brl(f7)} nos últimos 7 dias — ${pctStr(delta)} em relação à semana anterior.`,
        valor: pctStr(delta),
      });
    }
  }

  // ── 2) Risco de ruptura: produto muito vendido com estoque baixo ──
  if (top30.length) {
    const ids = top30.map((t) => t.produtoId);
    const produtos = await prisma.produto.findMany({
      where: { id: { in: ids } },
      select: { id: true, nome: true, estoque: true, estoqueMinimo: true },
    });
    const byId = new Map(produtos.map((p) => [p.id, p]));
    top30.forEach((t, idx) => {
      const p = byId.get(t.produtoId);
      if (!p) return;
      const limiar = Math.max(p.estoqueMinimo, 5);
      if (p.estoque <= limiar) {
        insights.push({
          id: `ruptura-${p.id}`,
          tipo: 'ruptura',
          severidade: p.estoque <= 0 ? 'critico' : 'atencao',
          titulo: p.estoque <= 0 ? `${p.nome} esgotou` : `Risco de ruptura: ${p.nome}`,
          detalhe: `${p.nome} é seu ${idx + 1}º produto mais vendido (30 dias) e restam ${p.estoque} un. em estoque.`,
          valor: `${p.estoque} un.`,
        });
      }
    });
  }

  // ── 3) Taxa de cancelamento ──
  if (totalMes >= 5) {
    const taxa = canceladosMes / totalMes;
    if (taxa >= 0.15) {
      const motivo = motivoTop[0]?.motivoCancelamento ?? null;
      insights.push({
        id: 'cancelamento',
        tipo: 'cancelamento',
        severidade: taxa >= 0.3 ? 'critico' : 'atencao',
        titulo: 'Taxa de cancelamento alta',
        detalhe: `${Math.round(taxa * 100)}% dos pedidos dos últimos 30 dias foram cancelados${
          motivo ? ` — motivo mais comum: "${motivo}".` : '.'
        }`,
        valor: `${Math.round(taxa * 100)}%`,
      });
    }
  }

  // ── 4) Avaliação média ──
  const totalAval = aval.length;
  const notaMedia = totalAval ? aval.reduce((a, r) => a + Number(r.nota), 0) / totalAval : null;
  if (totalAval >= 3 && notaMedia != null) {
    if (notaMedia < 4) {
      insights.push({
        id: 'aval-baixa',
        tipo: 'avaliacao',
        severidade: 'atencao',
        titulo: 'Avaliação abaixo do ideal',
        detalhe: `Sua nota média nos últimos 30 dias é ${notaMedia.toFixed(1)} (${totalAval} avaliações).`,
        valor: notaMedia.toFixed(1),
      });
    } else if (notaMedia >= 4.7) {
      insights.push({
        id: 'aval-alta',
        tipo: 'avaliacao',
        severidade: 'positivo',
        titulo: 'Clientes satisfeitos',
        detalhe: `Sua nota média nos últimos 30 dias é ${notaMedia.toFixed(1)} (${totalAval} avaliações). Continue assim!`,
        valor: notaMedia.toFixed(1),
      });
    }
  }

  // ── 5) Produto encalhado: estoque alto e zero vendas em 30 dias ──
  const vendidosIds = vendidos30.map((v) => v.produtoId);
  const encalhados = await prisma.produto.findMany({
    where: { lojaId, disponivel: true, estoque: { gte: 20 }, id: { notIn: vendidosIds } },
    select: { id: true, nome: true, estoque: true },
    orderBy: { estoque: 'desc' },
    take: 1,
  });
  if (encalhados.length) {
    const p = encalhados[0];
    insights.push({
      id: `encalhe-${p.id}`,
      tipo: 'encalhe',
      severidade: 'info',
      titulo: 'Estoque parado',
      detalhe: `${p.nome} tem ${p.estoque} un. em estoque e nenhuma venda nos últimos 30 dias. Que tal uma promoção?`,
      valor: `${p.estoque} un.`,
    });
  }

  // ordena por severidade (mais grave primeiro) e limita a 5
  insights.sort((a, b) => ORDEM[a.severidade] - ORDEM[b.severidade]);
  let resultado = insights.slice(0, 5);

  // fallback honesto quando ainda não há dados suficientes
  if (resultado.length === 0) {
    resultado = [
      {
        id: 'sem-dados',
        tipo: 'faturamento',
        severidade: 'info',
        titulo: 'Ainda sem insights',
        detalhe:
          'Conforme você recebe pedidos e avaliações, os insights da sua loja aparecem aqui.',
      },
    ];
  }

  cache.set(lojaId, { ts: Date.now(), data: resultado });
  return resultado;
}
