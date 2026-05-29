import { TipoMovimentacao } from '@prisma/client';
import { prisma } from '../utils/prisma';
import { emitEstoqueAtualizado, emitEstoqueAlerta } from '../utils/socket';

export type NivelEstoque = 'saudavel' | 'atencao' | 'critico' | 'zerado';

const LIMITE_CRITICO = 10;
const LIMITE_ATENCAO = 20;

export function nivelEstoque(estoque: number): NivelEstoque {
  if (estoque <= 0) return 'zerado';
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

export async function ajustarEstoqueManual(
  produtoId: string,
  lojaId: string,
  lojistaId: string,
  tipo: 'entrada_manual' | 'saida_manual' | 'ajuste_inventario' | 'devolucao',
  quantidade: number,
  motivo?: string,
) {
  const produto = await prisma.produto.findUniqueOrThrow({
    where: { id: produtoId, lojaId },
    select: { estoque: true, estoqueMinimo: true, nome: true, disponivel: true },
  });

  let novoEstoque: number;
  if (tipo === 'ajuste_inventario') {
    novoEstoque = quantidade;
  } else if (tipo === 'saida_manual') {
    novoEstoque = Math.max(0, produto.estoque - quantidade);
  } else {
    novoEstoque = produto.estoque + quantidade;
  }

  const [produtoAtualizado] = await prisma.$transaction([
    prisma.produto.update({
      where: { id: produtoId },
      data: {
        estoque: novoEstoque,
        disponivel: novoEstoque > 0 ? produto.disponivel : false,
      },
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

  emitEstoqueAtualizado(lojaId, {
    produtoId,
    produtoNome: produto.nome,
    estoque: novoEstoque,
    estoqueMinimo: produto.estoqueMinimo,
  });

  const nivel = nivelEstoque(novoEstoque);
  if (nivel !== 'saudavel') {
    emitEstoqueAlerta(lojaId, {
      produtoId,
      produtoNome: produto.nome,
      estoque: novoEstoque,
      estoqueMinimo: produto.estoqueMinimo,
      nivel,
    });
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
        criadoEm: true,
        produto: { select: { id: true, nome: true, imagemUrl: true } },
      },
    }),
  ]);

  const semEstoque = produtos.filter((p) => p.estoque <= 0);
  const criticos = produtos.filter((p) => p.estoque > 0 && p.estoque < LIMITE_CRITICO);
  const atencao = produtos.filter((p) => p.estoque >= LIMITE_CRITICO && p.estoque < LIMITE_ATENCAO);

  const valorTotalEstoque = produtos.reduce((acc, p) => acc + Number(p.preco) * p.estoque, 0);

  const alertas = [
    ...semEstoque.map((p) => ({ ...p, nivel: 'zerado' as NivelEstoque })),
    ...criticos.map((p) => ({ ...p, nivel: 'critico' as NivelEstoque })),
    ...atencao.map((p) => ({ ...p, nivel: 'atencao' as NivelEstoque })),
  ];

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
        criadoEm: true,
        produto: { select: { id: true, nome: true, imagemUrl: true } },
      },
    }),
  ]);

  return { total, page, limit, items };
}

export async function getAlertas(lojaId: string) {
  const produtos = await prisma.produto.findMany({
    where: { lojaId, estoqueMinimo: { gt: 0 } },
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
    .map((p) => ({ ...p, nivel: nivelEstoque(p.estoque) }))
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
    include: { produto: { select: { estoque: true, estoqueMinimo: true, nome: true } } },
  });

  for (const item of itens) {
    const novoEstoque = item.produto.estoque + item.quantidade;
    await db.produto.update({
      where: { id: item.produtoId },
      data: { estoque: novoEstoque, disponivel: true },
    });
    await db.movimentacaoEstoque.create({
      data: {
        produtoId: item.produtoId,
        lojaId,
        tipo: 'cancelamento',
        quantidade: item.quantidade,
        estoqueAntes: item.produto.estoque,
        estoqueDepois: novoEstoque,
        motivo: `Cancelamento do pedido ${pedidoId.slice(0, 8)}`,
        pedidoId,
      },
    });
  }
}
