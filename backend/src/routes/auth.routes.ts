import { Router } from 'express';
import { z } from 'zod';
import { hashSenha, compararSenha } from '../utils/bcrypt';
import { gerarToken, gerarRefreshToken, verificarRefreshToken } from '../utils/jwt';
import { prisma } from '../utils/prisma';
import {
  cpfSchema,
  cnpjSchema,
  senhaForteSchema,
  emailSchema,
} from '../utils/validacoes';

const router = Router();

// ========================================
// CONSUMIDOR
// ========================================

const registrarUsuarioSchema = z.object({
  nome: z.string().min(2),
  cpf: cpfSchema,
  telefone: z.string().regex(/^\+55\d{11}$/),
  email: emailSchema,
  senha: senhaForteSchema,
});

router.post('/usuario/registrar', async (req, res) => {
  try {
    const dados = registrarUsuarioSchema.parse(req.body);

    const existe = await prisma.usuario.findFirst({
      where: {
        OR: [{ cpf: dados.cpf }, { telefone: dados.telefone }, { email: dados.email }],
      },
    });

    if (existe) {
      return res.status(400).json({ error: 'CPF, telefone ou email já cadastrado' });
    }

    const { senha, ...dadosUsuario } = dados;
    const senhaHash = await hashSenha(senha);

    const usuario = await prisma.usuario.create({
      data: { ...dadosUsuario, senhaHash },
    });

    const tokenPayload = { id: usuario.id, tipo: 'usuario' as const };
    const token = gerarToken(tokenPayload);
    const refreshToken = gerarRefreshToken(tokenPayload);

    res.status(201).json({
      token,
      refreshToken,
      usuario: { id: usuario.id, nome: usuario.nome, telefone: usuario.telefone, email: usuario.email },
    });
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: error.errors });
    console.error(error);
    res.status(500).json({ error: 'Erro ao registrar usuário' });
  }
});

router.post('/usuario/login', async (req, res) => {
  try {
    const { cpf, senha } = z.object({
      cpf: z.string(),
      senha: z.string(),
    }).parse(req.body);

    const cpfRaw = cpf.replace(/\D/g, '');
    const usuario = await prisma.usuario.findUnique({ where: { cpf: cpfRaw } });

    if (!usuario || !(await compararSenha(senha, usuario.senhaHash))) {
      return res.status(401).json({ error: 'CPF ou senha inválidos' });
    }

    const tokenPayload = { id: usuario.id, tipo: 'usuario' as const };
    const token = gerarToken(tokenPayload);
    const refreshToken = gerarRefreshToken(tokenPayload);

    res.json({
      token,
      refreshToken,
      usuario: { id: usuario.id, nome: usuario.nome, telefone: usuario.telefone, email: usuario.email },
    });
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: error.errors });
    res.status(500).json({ error: 'Erro no login' });
  }
});

// ========================================
// ENTREGADOR
// ========================================

const registrarEntregadorSchema = z.object({
  nome: z.string().min(2),
  cpf: cpfSchema,
  telefone: z.string().regex(/^\+55\d{11}$/),
  email: emailSchema,
  senha: senhaForteSchema,
  tipoTransporte: z.enum(['bike', 'moto', 'carro']),
});

router.post('/entregador/registrar', async (req, res) => {
  try {
    const dados = registrarEntregadorSchema.parse(req.body);

    const existe = await prisma.entregador.findFirst({
      where: {
        OR: [{ cpf: dados.cpf }, { telefone: dados.telefone }, { email: dados.email }],
      },
    });

    if (existe) return res.status(400).json({ error: 'CPF, telefone ou email já cadastrado' });

    const { senha, ...dadosEntregador } = dados;
    const senhaHash = await hashSenha(senha);
    const entregador = await prisma.entregador.create({ data: { ...dadosEntregador, senhaHash } });

    const tokenPayload = { id: entregador.id, tipo: 'entregador' as const };
    const token = gerarToken(tokenPayload);
    const refreshToken = gerarRefreshToken(tokenPayload);

    res.status(201).json({
      token,
      refreshToken,
      entregador: { id: entregador.id, nome: entregador.nome, statusConta: entregador.statusConta },
    });
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: error.errors });
    res.status(500).json({ error: 'Erro ao registrar entregador' });
  }
});

// Aceita email OU telefone para login (campo "identificador" novo ou "telefone" legado)
router.post('/entregador/login', async (req, res) => {
  try {
    const body = z.object({
      identificador: z.string().optional(),
      telefone: z.string().optional(),
      senha: z.string(),
    }).parse(req.body);

    const raw = body.identificador ?? body.telefone ?? '';
    const senha = body.senha;

    if (!raw) return res.status(400).json({ error: 'Informe email ou telefone' });

    const isEmail = raw.includes('@');

    const entregador = await prisma.entregador.findFirst({
      where: isEmail ? { email: raw } : { telefone: raw },
    });

    if (!entregador || !(await compararSenha(senha, entregador.senhaHash))) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    const tokenPayload = { id: entregador.id, tipo: 'entregador' as const };
    const token = gerarToken(tokenPayload);
    const refreshToken = gerarRefreshToken(tokenPayload);

    res.json({
      token,
      refreshToken,
      entregador: { id: entregador.id, nome: entregador.nome, email: entregador.email, statusConta: entregador.statusConta },
    });
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: error.errors });
    res.status(500).json({ error: 'Erro no login' });
  }
});

// ========================================
// LOJISTA
// ========================================

const registrarLojistaSchema = z.object({
  cnpj: cnpjSchema,
  nomeResponsavel: z.string().min(2),
  email: emailSchema,
  senha: senhaForteSchema,
  telefone: z.string().regex(/^\+55\d{11}$/),
});

router.post('/lojista/registrar', async (req, res) => {
  try {
    const dados = registrarLojistaSchema.parse(req.body);

    const existe = await prisma.lojista.findFirst({
      where: { OR: [{ cnpj: dados.cnpj }, { email: dados.email }] },
    });

    if (existe) return res.status(400).json({ error: 'CNPJ ou email já cadastrado' });

    const { senha, ...dadosLojista } = dados;
    const senhaHash = await hashSenha(senha);
    const lojista = await prisma.lojista.create({ data: { ...dadosLojista, senhaHash } });

    const tokenPayload = { id: lojista.id, tipo: 'lojista' as const };
    const token = gerarToken(tokenPayload);
    const refreshToken = gerarRefreshToken(tokenPayload);

    res.status(201).json({
      token,
      refreshToken,
      lojista: { id: lojista.id, nomeResponsavel: lojista.nomeResponsavel, email: lojista.email },
    });
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: error.errors });
    res.status(500).json({ error: 'Erro ao registrar lojista' });
  }
});

// Aceita email OU cnpj para login (campo "identificador" novo ou "cnpj" legado)
router.post('/lojista/login', async (req, res) => {
  try {
    const body = z.object({
      identificador: z.string().optional(),
      cnpj: z.string().optional(),
      senha: z.string(),
    }).parse(req.body);

    const raw = body.identificador ?? body.cnpj ?? '';
    const senha = body.senha;

    if (!raw) return res.status(400).json({ error: 'Informe email ou CNPJ' });

    const isEmail = raw.includes('@');
    const cnpjRaw = isEmail ? '' : raw.replace(/\D/g, '');

    const lojista = await prisma.lojista.findFirst({
      where: isEmail ? { email: raw } : { cnpj: cnpjRaw },
    });

    if (!lojista || !(await compararSenha(senha, lojista.senhaHash))) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    const tokenPayload = { id: lojista.id, tipo: 'lojista' as const };
    const token = gerarToken(tokenPayload);
    const refreshToken = gerarRefreshToken(tokenPayload);

    res.json({
      token,
      refreshToken,
      lojista: { id: lojista.id, nomeResponsavel: lojista.nomeResponsavel, email: lojista.email, cnpj: lojista.cnpj },
    });
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: error.errors });
    res.status(500).json({ error: 'Erro no login' });
  }
});

// ========================================
// REFRESH TOKEN (todos os tipos)
// ========================================

router.post('/refresh', (req, res) => {
  try {
    const { refreshToken } = z.object({ refreshToken: z.string() }).parse(req.body);

    const payload = verificarRefreshToken(refreshToken);
    const novoToken = gerarToken({ id: payload.id, tipo: payload.tipo });
    const novoRefreshToken = gerarRefreshToken({ id: payload.id, tipo: payload.tipo });

    res.json({ token: novoToken, refreshToken: novoRefreshToken });
  } catch {
    res.status(401).json({ error: 'Refresh token inválido ou expirado' });
  }
});

export default router;
