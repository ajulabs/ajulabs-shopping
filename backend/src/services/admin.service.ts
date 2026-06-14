import { prisma } from '../utils/prisma';
import { compararSenha } from '../utils/bcrypt';
import { gerarToken } from '../utils/jwt';

/** Login do admin de plataforma. Retorna token + dados básicos. */
export async function loginAdmin(email: string, senha: string) {
  const admin = await prisma.adminPlataforma.findUnique({ where: { email } });
  if (!admin || !admin.ativo) {
    throw Object.assign(new Error('Credenciais inválidas.'), { statusCode: 401 });
  }
  const ok = await compararSenha(senha, admin.senhaHash);
  if (!ok) {
    throw Object.assign(new Error('Credenciais inválidas.'), { statusCode: 401 });
  }
  await prisma.adminPlataforma.update({
    where: { id: admin.id },
    data: { ultimoLogin: new Date() },
  });
  const token = gerarToken({ id: admin.id, tipo: 'admin' });
  return { token, admin: { id: admin.id, nome: admin.nome, papel: admin.papel } };
}

/** Lista as fotos de perfil de entregadores aguardando moderação. */
export async function listarFotosPendentes() {
  const entregadores = await prisma.entregador.findMany({
    where: { fotoStatus: 'pendente', fotoPendenteUrl: { not: null } },
    select: { id: true, nome: true, fotoPendenteUrl: true, fotoEnviadaEm: true },
    orderBy: { fotoEnviadaEm: 'asc' },
  });
  return entregadores.map((e) => ({
    id: e.id,
    nome: e.nome,
    fotoPendenteUrl: e.fotoPendenteUrl!,
    enviadaEm: e.fotoEnviadaEm,
  }));
}

/** Aprova a foto pendente: ela passa a ser a foto pública (fotoUrl). */
export async function aprovarFoto(entregadorId: string) {
  const entregador = await prisma.entregador.findUnique({
    where: { id: entregadorId },
    select: { fotoPendenteUrl: true, fotoStatus: true },
  });
  if (!entregador || entregador.fotoStatus !== 'pendente' || !entregador.fotoPendenteUrl) {
    throw Object.assign(new Error('Foto pendente não encontrada.'), { statusCode: 404 });
  }
  await prisma.entregador.update({
    where: { id: entregadorId },
    data: {
      fotoUrl: entregador.fotoPendenteUrl,
      fotoStatus: 'aprovado',
      fotoPendenteUrl: null,
    },
  });
  return { ok: true as const };
}

/** Rejeita a foto pendente: descartada, a foto pública atual permanece. */
export async function rejeitarFoto(entregadorId: string) {
  const entregador = await prisma.entregador.findUnique({
    where: { id: entregadorId },
    select: { fotoStatus: true },
  });
  if (!entregador || entregador.fotoStatus !== 'pendente') {
    throw Object.assign(new Error('Foto pendente não encontrada.'), { statusCode: 404 });
  }
  await prisma.entregador.update({
    where: { id: entregadorId },
    data: {
      fotoStatus: 'rejeitado',
      fotoPendenteUrl: null,
    },
  });
  return { ok: true as const };
}
