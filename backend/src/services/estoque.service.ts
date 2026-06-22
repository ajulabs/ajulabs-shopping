import { TipoMovimentacao } from '@prisma/client';
import { prisma } from '../utils/prisma';
import { emitEstoqueAtualizado, emitEstoqueAlerta, emitProdutoVariacoes } from '../utils/socket';
import { dispararAvisosRestock } from './avisoEstoque.service';

export type NivelEstoque = 'saudavel' | 'atencao' | 'critico' | 'zerado';

const LIMITE_CRITICO = 10;
const LIMITE_ATENCAO = 20;

/**
 * Classifica o nível de estoque de um produto.
 * Se `estoqueMinimo > 0`, usa o mínimo do produto como threshold de crítico
 * e o dobro dele como threshold de atenção.
 * Quando `estoqueMinimo` não está definido, usa os limites globais (10 / 20).
 */
export function nivelEstoque(estoque: number, estoqueMinimo = 0): NivelEstoque {
  if (estoque <= 0) return 'zerado';
  if (estoqueMinimo > 0) {
    if (estoque < estoqueMinimo) return 'critico';
    if (estoque < estoqueMinimo * 2) return 'atencao';
    return 'saudavel';
  }
  if (estoque < LIMITE_CRITICO) return 'critico';
  if (estoque < LIMITE_ATENCAO) return 'atencao';
  return 'saudavel';
}

interface RegistrarMovimentacaoParams {
  produtoId: string;
  lojaId: string;
  lojistaId?: string;
  tipo: TipoMovimentacao;
  quantidade: number;
  estoqueAntes: number;
  estoqueDepois: number;
  motivo?: string;
  pedidoId?: string;
}

export async function registrarMovimentacao(
  params: RegistrarMovimentacaoParams,
  tx?: Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
) {
  const db = tx ?? prisma;
  return (db as typeof prisma).movimentacaoEstoque.create({ data: params });
}

type TipoAjusteManual = 'entrada_manual' | 'saida_manual' | 'ajuste_inventario' | 'devolucao';

/** Aplica o tipo de ajuste sobre um estoque base. Lança erro se a saída excede o disponível. */
function aplicarAjuste(tipo: TipoAjusteManual, atual: number, quantidade: number): number {
  if (tipo === 'ajuste_inventario') return quantidade;
  if (tipo === 'saida_manual') {
    if (quantidade > atual) {
      throw Object.assign(new Error(`Estoque insuficiente. Disponível: ${atual} un.`), {
        statusCode: 409,
      });
    }
    return atual - quantidade;
  }
  return atual + quantidade;
}

/** Notifica clientes via socket sobre a mudança de estoque (e alerta se aplicável). */
function notificarEstoque(
  lojaId: string,
  produtoId: string,
  produtoNome: string,
  estoque: number,
  estoqueMinimo: number,
) {
  emitEstoqueAtualizado(lojaId, { produtoId, produtoNome, estoque, estoqueMinimo });
  const nivel = nivelEstoque(estoque, estoqueMinimo);
  if (nivel !== 'saudavel') {
    emitEstoqueAlerta(lojaId, { produtoId, produtoNome, estoque, estoqueMinimo, nivel });
  }
}

export async function ajustarEstoqueManual(
  produtoId: string,
  lojaId: string,
  lojistaId: string,
  tipo: TipoAjusteManual,
  quantidade: number,
  motivo?: string,
  variacaoId?: string,
) {
  if (variacaoId) {
    return ajustarEstoqueVariacao(
      produtoId,
      lojaId,
      lojistaId,
      tipo,
      quantidade,
      variacaoId,
      motivo,
    );
  }

  const produto = await prisma.produto.findUniqueOrThrow({
    where: { id: produtoId, lojaId },
    select: { estoque: true, estoqueMinimo: true, nome: true, disponivel: true },
  });

  const novoEstoque = aplicarAjuste(tipo, produto.estoque, quantidade);

  const saiuDoEsgotado = produto.estoque === 0 && novoEstoque > 0;
  const [produtoAtualizado] = await prisma.$transaction([
    prisma.produto.update({
      where: { id: produtoId },
      data: {
        estoque: novoEstoque,
        disponivel: saiuDoEsgotado ? true : novoEstoque > 0 ? produto.disponivel : false,
      },
      include: { variacoes: true },
    }),
    prisma.movimentacaoEstoque.create({
      data: {
        produtoId,
        lojaId,
        lojistaId,
        tipo,
        quantidade: Math.abs(novoEstoque - produto.estoque),
        estoqueAntes: produto.estoque,
        estoqueDepois: novoEstoque,
        motivo,
      },
    }),
  ]);

  notificarEstoque(lojaId, produtoId, produto.nome, novoEstoque, produto.estoqueMinimo);
  if (produto.estoque === 0 && novoEstoque > 0) {
    void dispararAvisosRestock(produtoId);
  }
  return produtoAtualizado;
}

/**
 * Ajuste manual de uma variação específica. Mantém o total do produto coerente
 * (= soma das variações), igual ao decremento de venda em pedidos.routes.ts.
 */
async function ajustarEstoqueVariacao(
  produtoId: string,
  lojaId: string,
  lojistaId: string,
  tipo: TipoAjusteManual,
  quantidade: number,
  variacaoId: string,
  motivo?: string,
) {
  const variacao = await prisma.variacaoProduto.findFirst({
    where: { id: variacaoId, produtoId },
    select: { id: true, nome: true, estoque: true },
  });
  if (!variacao) {
    throw Object.assign(new Error('Variação não encontrada'), { statusCode: 404 });
  }

  const produto = await prisma.produto.findUniqueOrThrow({
    where: { id: produtoId, lojaId },
    select: { estoqueMinimo: true, nome: true, disponivel: true },
  });

  const novoEstoqueVar = aplicarAjuste(tipo, variacao.estoque, quantidade);
  const delta = novoEstoqueVar - variacao.estoque;

  const produtoAtualizado = await prisma.$transaction(async (tx) => {
    await tx.variacaoProduto.update({
      where: { id: variacao.id },
      data: { estoque: novoEstoqueVar },
    });

    const todasVars = await tx.variacaoProduto.findMany({
      where: { produtoId },
      select: { estoque: true },
    });
    const totalDepois = todasVars.reduce((s, v) => s + v.estoque, 0);
    const totalAntes = totalDepois - delta;

    const saiuDoEsgotado = totalAntes === 0 && totalDepois > 0;
    const atualizado = await tx.produto.update({
      where: { id: produtoId },
      data: {
        estoque: totalDepois,
        disponivel: saiuDoEsgotado ? true : totalDepois > 0 ? produto.disponivel : false,
      },
      include: { variacoes: true },
    });

    await tx.movimentacaoEstoque.create({
      data: {
        produtoId,
        lojaId,
        lojistaId,
        tipo,
        quantidade: Math.abs(delta),
        estoqueAntes: totalAntes,
        estoqueDepois: totalDepois,
        motivo,
        variacaoId: variacao.id,
        variacaoNome: variacao.nome,
      },
    });

    return atualizado;
  });

  notificarEstoque(
    lojaId,
    produtoId,
    produto.nome,
    produtoAtualizado.estoque,
    produto.estoqueMinimo,
  );
  // Atualiza o estoque por variação na PDP do consumidor em tempo real.
  emitProdutoVariacoes(lojaId, produtoId, produtoAtualizado.variacoes);
  const estoqueAntes = produtoAtualizado.estoque - delta;
  if (estoqueAntes === 0 && produtoAtualizado.estoque > 0) {
    void dispararAvisosRestock(produtoId);
  }
  return produtoAtualizado;
}

export async function getDashboard(lojaId: string) {
  const [produtos, movimentacoesRecentes] = await Promise.all([
    prisma.produto.findMany({
      where: { lojaId },
      select: {
        id: true,
        nome: true,
        estoque: true,
        estoqueMinimo: true,
        preco: true,
        disponivel: true,
        imagemUrl: true,
      },
    }),
    prisma.movimentacaoEstoque.findMany({
      where: { lojaId },
      orderBy: { criadoEm: 'desc' },
      take: 20,
      select: {
        id: true,
        tipo: true,
        quantidade: true,
        estoqueAntes: true,
        estoqueDepois: true,
        motivo: true,
        variacaoNome: true,
        criadoEm: true,
        produto: { select: { id: true, nome: true, imagemUrl: true } },
      },
    }),
  ]);

  const produtosComNivel = produtos.map((p) => ({
    ...p,
    nivel: nivelEstoque(p.estoque, p.estoqueMinimo),
  }));

  const semEstoque = produtosComNivel.filter((p) => p.nivel === 'zerado');
  const criticos = produtosComNivel.filter((p) => p.nivel === 'critico');
  const atencao = produtosComNivel.filter((p) => p.nivel === 'atencao');

  const valorTotalEstoque = produtos.reduce((acc, p) => acc + Number(p.preco) * p.estoque, 0);

  const alertas = [...semEstoque, ...criticos, ...atencao];

  return {
    totalProdutos: produtos.length,
    produtosAtivos: produtos.filter((p) => p.disponivel).length,
    produtosSemEstoque: semEstoque.length,
    produtosBaixoEstoque: criticos.length,
    produtosAtencao: atencao.length,
    valorTotalEstoque,
    alertas,
    movimentacoesRecentes,
  };
}

export async function getMovimentacoes(
  lojaId: string,
  opts: {
    produtoId?: string;
    tipo?: TipoMovimentacao;
    page?: number;
    limit?: number;
  } = {},
) {
  const { produtoId, tipo, page = 1, limit = 30 } = opts;
  const skip = (page - 1) * limit;

  const where = {
    lojaId,
    ...(produtoId ? { produtoId } : {}),
    ...(tipo ? { tipo } : {}),
  };

  const [total, items] = await Promise.all([
    prisma.movimentacaoEstoque.count({ where }),
    prisma.movimentacaoEstoque.findMany({
      where,
      orderBy: { criadoEm: 'desc' },
      skip,
      take: limit,
      select: {
        id: true,
        tipo: true,
        quantidade: true,
        estoqueAntes: true,
        estoqueDepois: true,
        motivo: true,
        pedidoId: true,
        variacaoNome: true,
        criadoEm: true,
        produto: { select: { id: true, nome: true, imagemUrl: true } },
      },
    }),
  ]);

  return { total, page, limit, items };
}

export async function getAlertas(lojaId: string) {
  const produtos = await prisma.produto.findMany({
    where: { lojaId },
    select: {
      id: true,
      nome: true,
      estoque: true,
      estoqueMinimo: true,
      imagemUrl: true,
      disponivel: true,
    },
  });

  return produtos
    .map((p) => ({ ...p, nivel: nivelEstoque(p.estoque, p.estoqueMinimo) }))
    .filter((p) => p.nivel !== 'saudavel')
    .sort((a, b) => {
      const order = { zerado: 0, critico: 1, atencao: 2, saudavel: 3 };
      return order[a.nivel] - order[b.nivel];
    });
}

export async function restaurarEstoqueNoCancelamento(
  pedidoId: string,
  lojaId: string,
  tx?: Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
) {
  const db = (tx ?? prisma) as typeof prisma;
  const itens = await db.itemPedido.findMany({
    where: { pedidoId },
    select: {
      produtoId: true,
      quantidade: true,
      variacaoId: true,
      variacaoNome: true,
      produto: { select: { estoque: true } },
    },
  });

  const restockCandidatos = new Set<string>();
  for (const item of itens) {
    if (item.produto.estoque === 0) restockCandidatos.add(item.produtoId);
  }

  for (const item of itens) {
    if (item.variacaoId) {
      // Produto com variação: devolve à variação e recomputa o total do produto
      // como soma das variações — espelha o decremento de venda em pedidos.routes.ts.
      // Sem isso, a numeração/tamanho específico ficava perdida e o total do
      // produto ficava inconsistente (era sobrescrito em qualquer ajuste futuro).
      await db.variacaoProduto.update({
        where: { id: item.variacaoId },
        data: { estoque: { increment: item.quantidade } },
      });
      const todasVars = await db.variacaoProduto.findMany({
        where: { produtoId: item.produtoId },
        select: { estoque: true },
      });
      const estoqueDepois = todasVars.reduce((s, v) => s + v.estoque, 0);
      const estoqueAntes = estoqueDepois - item.quantidade;
      await db.produto.update({
        where: { id: item.produtoId },
        data: { estoque: estoqueDepois, disponivel: true },
      });
      await db.movimentacaoEstoque.create({
        data: {
          produtoId: item.produtoId,
          lojaId,
          tipo: 'cancelamento',
          quantidade: item.quantidade,
          estoqueAntes,
          estoqueDepois,
          motivo: `Cancelamento do pedido ${pedidoId.slice(0, 8)}`,
          pedidoId,
          variacaoId: item.variacaoId,
          variacaoNome: item.variacaoNome ?? null,
        },
      });
    } else {
      const estoqueAntes = item.produto.estoque;
      const estoqueDepois = estoqueAntes + item.quantidade;
      await db.produto.update({
        where: { id: item.produtoId },
        data: { estoque: estoqueDepois, disponivel: true },
      });
      await db.movimentacaoEstoque.create({
        data: {
          produtoId: item.produtoId,
          lojaId,
          tipo: 'cancelamento',
          quantidade: item.quantidade,
          estoqueAntes,
          estoqueDepois,
          motivo: `Cancelamento do pedido ${pedidoId.slice(0, 8)}`,
          pedidoId,
        },
      });
    }
  }

  for (const produtoId of restockCandidatos) {
    void dispararAvisosRestock(produtoId);
  }
}
