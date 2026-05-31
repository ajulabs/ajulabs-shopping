/**
 * Agregação do dashboard de avaliações (lojista/entregador).
 *
 * Calcula média, total, distribuição por nota e top tags positivas/negativas
 * em uma única query para ser exibido no app.
 */

import {
  TAGS_AVALIACAO_LOJA,
  TAGS_AVALIACAO_ENTREGADOR,
  type TagAvaliacao,
  type TagAgregada,
  type DashboardAvaliacoes,
  type AvaliacaoDetalhada,
} from '@ajulabs/types';
import { prisma } from '../utils/prisma';

/**
 * Threshold mínimo de ocorrências para uma tag negativa aparecer como
 * "ponto a melhorar". Evita expor críticas isoladas (ex.: 1 cliente
 * irritado) como tendência, o que seria injusto e desmotivador.
 */
const MIN_OCORRENCIAS_TAG_NEGATIVA = 3;

const MAX_TAGS_EXIBIDAS = 3;
const LIMITE_AVALIACOES_RECENTES = 50;

interface AvaliacaoRaw {
  id: string;
  nota: number;
  comentario: string | null;
  tags: string[];
  criadoEm: Date;
  usuario: { id: string; nome: string; avatarUrl: string | null };
}

/**
 * Agrega contagem por tag, separando por sentimento e aplicando o
 * threshold de ocorrências às negativas. Retorna top N de cada lado.
 */
function agregarTags(
  avaliacoes: { tags: string[] }[],
  catalogo: TagAvaliacao[],
): { pontosFortes: TagAgregada[]; pontosAMelhorar: TagAgregada[] } {
  const contagem = new Map<string, number>();
  for (const av of avaliacoes) {
    for (const t of av.tags) {
      contagem.set(t, (contagem.get(t) ?? 0) + 1);
    }
  }

  const positivas: TagAgregada[] = [];
  const negativas: TagAgregada[] = [];
  for (const tag of catalogo) {
    const count = contagem.get(tag.id) ?? 0;
    if (count === 0) continue;
    if (tag.sentimento === 'positiva') {
      positivas.push({ tag, count });
    } else if (count >= MIN_OCORRENCIAS_TAG_NEGATIVA) {
      negativas.push({ tag, count });
    }
  }

  positivas.sort((a, b) => b.count - a.count);
  negativas.sort((a, b) => b.count - a.count);

  return {
    pontosFortes: positivas.slice(0, MAX_TAGS_EXIBIDAS),
    pontosAMelhorar: negativas.slice(0, MAX_TAGS_EXIBIDAS),
  };
}

function calcularDistribuicao(
  avaliacoes: { nota: number }[],
): Record<'1' | '2' | '3' | '4' | '5', number> {
  const dist: Record<'1' | '2' | '3' | '4' | '5', number> = {
    '1': 0,
    '2': 0,
    '3': 0,
    '4': 0,
    '5': 0,
  };
  for (const av of avaliacoes) {
    const k = String(av.nota) as '1' | '2' | '3' | '4' | '5';
    if (k in dist) dist[k] += 1;
  }
  return dist;
}

function formatAvaliacao(raw: AvaliacaoRaw): AvaliacaoDetalhada {
  return {
    id: raw.id,
    nota: raw.nota,
    comentario: raw.comentario,
    tags: raw.tags,
    criadoEm: raw.criadoEm.toISOString(),
    usuario: {
      id: raw.usuario.id,
      nome: raw.usuario.nome,
      avatarUrl: raw.usuario.avatarUrl,
    },
  };
}

export async function dashboardAvaliacoesLojista(lojaId: string): Promise<DashboardAvaliacoes> {
  // Busca duas vezes: agregação usa TODAS, listagem só as últimas N.
  // Em escala grande dá pra otimizar com query SQL bruta + GROUP BY,
  // mas no volume atual isso é overkill.
  const [todas, recentes] = await Promise.all([
    prisma.avaliacaoLoja.findMany({
      where: { lojaId },
      select: { tags: true, nota: true },
    }),
    prisma.avaliacaoLoja.findMany({
      where: { lojaId },
      orderBy: { criadoEm: 'desc' },
      take: LIMITE_AVALIACOES_RECENTES,
      include: {
        usuario: { select: { id: true, nome: true, avatarUrl: true } },
      },
    }),
  ]);

  const total = todas.length;
  const somaNotas = todas.reduce((s, av) => s + av.nota, 0);
  const media = total > 0 ? Math.round((somaNotas / total) * 10) / 10 : 0;

  return {
    media,
    total,
    distribuicao: calcularDistribuicao(todas),
    ...agregarTags(todas, TAGS_AVALIACAO_LOJA),
    avaliacoes: recentes.map(formatAvaliacao),
  };
}

export async function dashboardAvaliacoesEntregador(
  entregadorId: string,
): Promise<DashboardAvaliacoes> {
  const [todas, recentes] = await Promise.all([
    prisma.avaliacaoEntregador.findMany({
      where: { entregadorId },
      select: { tags: true, nota: true },
    }),
    prisma.avaliacaoEntregador.findMany({
      where: { entregadorId },
      orderBy: { criadoEm: 'desc' },
      take: LIMITE_AVALIACOES_RECENTES,
      include: {
        usuario: { select: { id: true, nome: true, avatarUrl: true } },
      },
    }),
  ]);

  const total = todas.length;
  const somaNotas = todas.reduce((s, av) => s + av.nota, 0);
  const media = total > 0 ? Math.round((somaNotas / total) * 10) / 10 : 0;

  return {
    media,
    total,
    distribuicao: calcularDistribuicao(todas),
    ...agregarTags(todas, TAGS_AVALIACAO_ENTREGADOR),
    avaliacoes: recentes.map(formatAvaliacao),
  };
}
