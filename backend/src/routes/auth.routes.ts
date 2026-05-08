import { Router } from 'express';
import { z } from 'zod';
import { hashSenha, compararSenha } from '../utils/bcrypt';
import { gerarToken } from '../utils/jwt';
import { prisma } from '../utils/prisma';

const router = Router();

// ========================================
// CONSUMIDOR
// ========================================

const registrarUsuarioSchema = z.object({
  nome: z.string().min(2),
  cpf: z.string().regex(/^\d{11}$/),
  telefone: z.string().regex(/^\+55\d{11}$/),
  email: z.string().email(),
  senha: z.string().min(6),
});

router.post('/usuario/registrar', async (req, res) => {
  try {
    const dados = registrarUsuarioSchema.parse(req.body);

    const existe = await prisma.usuario.findFirst({
      where: {
        OR: [
          { cpf: dados.cpf },
          { telefone: dados.telefone },
          { email: dados.email },
        ],
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

    const token = gerarToken({ id: usuario.id, tipo: 'usuario' });

    res.status(201).json({
      token,
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

    const token = gerarToken({ id: usuario.id, tipo: 'usuario' });

    res.json({
      token,
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
  cpf: z.string().regex(/^\d{11}$/),
  telefone: z.string().regex(/^\+55\d{11}$/),
  email: z.string().email(),
  senha: z.string().min(6),
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

    const { senha: senhaEnt, ...dadosEntregador } = dados;
    const senhaHash = await hashSenha(senhaEnt);
    const entregador = await prisma.entregador.create({ data: { ...dadosEntregador, senhaHash } });
    const token = gerarToken({ id: entregador.id, tipo: 'entregador' });

    res.status(201).json({
      token,
      entregador: { id: entregador.id, nome: entregador.nome, statusConta: entregador.statusConta },
    });
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: error.errors });
    res.status(500).json({ error: 'Erro ao registrar entregador' });
  }
});

router.post('/entregador/login', async (req, res) => {
  try {
    const { telefone, senha } = z.object({
      telefone: z.string(),
      senha: z.string(),
    }).parse(req.body);

    const entregador = await prisma.entregador.findUnique({ where: { telefone } });

    if (!entregador || !(await compararSenha(senha, entregador.senhaHash))) {
      return res.status(401).json({ error: 'Telefone ou senha inválidos' });
    }

    const token = gerarToken({ id: entregador.id, tipo: 'entregador' });

    res.json({
      token,
      entregador: { id: entregador.id, nome: entregador.nome, statusConta: entregador.statusConta },
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro no login' });
  }
});

// ========================================
// LOJISTA
// ========================================

const registrarLojistaSchema = z.object({
  cnpj: z.string().regex(/^\d{14}$/),
  nomeResponsavel: z.string().min(2),
  email: z.string().email(),
  senha: z.string().min(6),
  telefone: z.string().regex(/^\+55\d{11}$/),
});

router.post('/lojista/registrar', async (req, res) => {
  try {
    const dados = registrarLojistaSchema.parse(req.body);

    const existe = await prisma.lojista.findFirst({
      where: { OR: [{ cnpj: dados.cnpj }, { email: dados.email }] },
    });

    if (existe) return res.status(400).json({ error: 'CNPJ ou email já cadastrado' });

    const { senha: senhaLoj, ...dadosLojista } = dados;
    const senhaHash = await hashSenha(senhaLoj);
    const lojista = await prisma.lojista.create({ data: { ...dadosLojista, senhaHash } });
    const token = gerarToken({ id: lojista.id, tipo: 'lojista' });

    res.status(201).json({
      token,
      lojista: { id: lojista.id, nomeResponsavel: lojista.nomeResponsavel, email: lojista.email },
    });
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: error.errors });
    res.status(500).json({ error: 'Erro ao registrar lojista' });
  }
});

router.post('/lojista/login', async (req, res) => {
  try {
    const { cnpj, senha } = z.object({
      cnpj: z.string(),
      senha: z.string(),
    }).parse(req.body);

    const cnpjRaw = cnpj.replace(/\D/g, '');
    const lojista = await prisma.lojista.findUnique({ where: { cnpj: cnpjRaw } });

    if (!lojista || !(await compararSenha(senha, lojista.senhaHash))) {
      return res.status(401).json({ error: 'CNPJ ou senha inválidos' });
    }

    const token = gerarToken({ id: lojista.id, tipo: 'lojista' });

    res.json({
      token,
      lojista: { id: lojista.id, nomeResponsavel: lojista.nomeResponsavel, email: lojista.email },
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro no login' });
  }
});

export default router;
