import { PapelColaborador as PrismaRole, StatusSolicitacaoPreco } from '@prisma/client';
import { prisma } from '../utils/prisma';
import { hashSenha, compararSenha } from '../utils/bcrypt';
import { gerarToken, gerarRefreshToken, PapelColaborador } from '../utils/jwt';

export async function loginColaborador(email: string, senha: string) {
  const colaborador = await prisma.colaborador.findUnique({
    where: { email },
    include: { loja: { select: { id: true, nome: true } } },
  });

  if (!colaborador || !colaborador.ativo) {
    throw Object.assign(new Error('Credenciais inválidas'), { statusCode: 401 });
  }

  const ok = await compararSenha(senha, colaborador.senhaHash);
  if (!ok) throw Object.assign(new Error('Credenciais inválidas'), { statusCode: 401 });

  const payload = {
    id: colaborador.id,
    tipo: 'colaborador' as const,
    papel: colaborador.papel as unknown as PapelColaborador,
    lojaId: colaborador.lojaId,
  };

  return {
    token: gerarToken(payload),
    refreshToken: gerarRefreshToken(payload),
    colaborador: {
      id: colaborador.id,
      nome: colaborador.nome,
      email: colaborador.email,
      papel: colaborador.papel,
      lojaId: colaborador.lojaId,
      lojaNome: colaborador.loja.nome,
    },
  };
}

export async function criarColaborador(
  lojaId: string,
  nome: string,
  email: string,
  senha: string,
  papel: PrismaRole,
) {
  const existe = await prisma.colaborador.findUnique({ where: { email } });
  if (existe) throw Object.assign(new Error('Email já cadastrado'), { statusCode: 400 });

  const senhaHash = await hashSenha(senha);
  return prisma.colaborador.create({
    data: { lojaId, nome, email, senhaHash, papel },
    select: { id: true, nome: true, email: true, papel: true, ativo: true, criadoEm: true },
  });
}

export async function listarColaboradores(lojaId: string) {
  return prisma.colaborador.findMany({
    where: { lojaId },
    select: { id: true, nome: true, email: true, papel: true, ativo: true, criadoEm: true },
    orderBy: { criadoEm: 'desc' },
  });
}

export async function atualizarColaborador(
  id: string,
  lojaId: string,
  dados: { nome?: string; papel?: PrismaRole; ativo?: boolean },
) {
  const colab = await prisma.colaborador.findFirst({ where: { id, lojaId } });
  if (!colab) throw Object.assign(new Error('Colaborador não encontrado'), { statusCode: 404 });

  return prisma.colaborador.update({
    where: { id },
    data: dados,
    select: { id: true, nome: true, email: true, papel: true, ativo: true, criadoEm: true },
  });
}

export async function criarSolicitacaoPreco(
  produtoId: string,
  lojaId: string,
  solicitanteId: string,
  precoSolicitado: number,
  justificativa: string,
) {
  const produto = await prisma.produto.findFirst({ where: { id: produtoId, lojaId } });
  if (!produto) throw Object.assign(new Error('Produto não encontrado'), { statusCode: 404 });

  const pendente = await prisma.solicitacaoPreco.findFirst({
    where: { produtoId, status: 'pendente' },
  });
  if (pendente) {
    throw Object.assign(new Error('Já existe uma solicitação pendente para este produto'), {
      statusCode: 400,
    });
  }

  return prisma.solicitacaoPreco.create({
    data: {
      produtoId,
      lojaId,
      solicitanteId,
      precoAtual: produto.preco,
      precoSolicitado,
      justificativa,
    },
    include: {
      produto: { select: { id: true, nome: true } },
      solicitante: { select: { id: true, nome: true, email: true } },
    },
  });
}

export async function listarSolicitacoes(
  lojaId: string,
  opts: { solicitanteId?: string; status?: StatusSolicitacaoPreco } = {},
) {
  return prisma.solicitacaoPreco.findMany({
    where: {
      lojaId,
      ...(opts.solicitanteId ? { solicitanteId: opts.solicitanteId } : {}),
      ...(opts.status ? { status: opts.status } : {}),
    },
    include: {
      produto: { select: { id: true, nome: true, imagemUrl: true } },
      solicitante: { select: { id: true, nome: true, email: true } },
    },
    orderBy: { criadoEm: 'desc' },
  });
}

export async function contarPendentes(lojaId: string) {
  return prisma.solicitacaoPreco.count({ where: { lojaId, status: 'pendente' } });
}

export async function aprovarSolicitacao(
  id: string,
  lojaId: string,
  revisorId: string,
  revisorTipo: string,
  revisorNome: string,
  notaRevisao?: string,
) {
  const sol = await prisma.solicitacaoPreco.findFirst({
    where: { id, lojaId, status: 'pendente' },
  });
  if (!sol)
    throw Object.assign(new Error('Solicitação não encontrada ou já processada'), {
      statusCode: 404,
    });

  const [, atualizada] = await prisma.$transaction([
    prisma.produto.update({
      where: { id: sol.produtoId },
      data: { preco: sol.precoSolicitado },
    }),
    prisma.solicitacaoPreco.update({
      where: { id },
      data: {
        status: 'aprovado',
        revisadoPorId: revisorId,
        revisadoPorTipo: revisorTipo,
        revisadoPorNome: revisorNome,
        revisadoEm: new Date(),
        notaRevisao,
      },
    }),
  ]);

  return atualizada;
}

export async function rejeitarSolicitacao(
  id: string,
  lojaId: string,
  revisorId: string,
  revisorTipo: string,
  revisorNome: string,
  notaRevisao?: string,
) {
  const sol = await prisma.solicitacaoPreco.findFirst({
    where: { id, lojaId, status: 'pendente' },
  });
  if (!sol)
    throw Object.assign(new Error('Solicitação não encontrada ou já processada'), {
      statusCode: 404,
    });

  return prisma.solicitacaoPreco.update({
    where: { id },
    data: {
      status: 'rejeitado',
      revisadoPorId: revisorId,
      revisadoPorTipo: revisorTipo,
      revisadoPorNome: revisorNome,
      revisadoEm: new Date(),
      notaRevisao,
    },
  });
}

export type AuditAction =
  | 'product_created'
  | 'product_edited'
  | 'product_deleted'
  | 'price_change_requested'
  | 'price_change_approved'
  | 'price_change_rejected';

export async function registrarAudit(params: {
  lojaId: string;
  actorId: string;
  actorTipo: string;
  actorNome: string;
  actorPapel: string;
  action: AuditAction;
  entityType: string;
  entityId: string;
  entityName: string;
  changes?: Record<string, { before: unknown; after: unknown }>;
  ipAddress?: string;
}) {
  return prisma.auditLog.create({ data: params });
}

export async function listarAuditLogs(
  lojaId: string,
  opts: { page?: number; limit?: number } = {},
) {
  const { page = 1, limit = 50 } = opts;
  const skip = (page - 1) * limit;

  const [total, items] = await Promise.all([
    prisma.auditLog.count({ where: { lojaId } }),
    prisma.auditLog.findMany({
      where: { lojaId },
      orderBy: { timestamp: 'desc' },
      skip,
      take: limit,
    }),
  ]);

  return { total, page, limit, items };
}
