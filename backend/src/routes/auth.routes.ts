import { Router } from 'express';
import { z } from 'zod';
import { hashSenha, compararSenha } from '../utils/bcrypt';
import { gerarToken, gerarRefreshToken, verificarRefreshToken } from '../utils/jwt';
import { prisma } from '../utils/prisma';
import { cpfSchema, cnpjSchema, senhaForteSchema, emailSchema } from '../utils/validacoes';
import { authLimiter } from '../lib/rateLimiter';
import { logger } from '../lib/logger';
import { specValidatorMiddleware } from '../lib/spec-validator';
import { loginColaborador } from '../services/rbac.service';
import { sendEmail, recuperacaoSenhaHtml } from '../utils/email';

const router = Router();

router.use(authLimiter);

const loginUsuarioSpec = {
  name: 'POST_auth_usuario_login',
  input: {
    cpf: { required: true, type: 'string' },
    senha: { required: true, type: 'string' },
  },
} as const;

const registrarUsuarioSpec = {
  name: 'POST_auth_usuario_registrar',
  input: {
    nome: { required: true, type: 'string' },
    cpf: { required: true, type: 'string' },
    telefone: { required: true, type: 'string' },
    email: { required: true, type: 'string' },
    senha: { required: true, type: 'string' },
  },
} as const;

const registrarEntregadorSpec = {
  name: 'POST_auth_entregador_registrar',
  input: {
    nome: { required: true, type: 'string' },
    cpf: { required: true, type: 'string' },
    telefone: { required: true, type: 'string' },
    email: { required: true, type: 'string' },
    senha: { required: true, type: 'string' },
    tipoTransporte: { required: true, type: 'enum', constraints: ["'bike' | 'moto' | 'carro'"] },
  },
} as const;

const loginEntregadorSpec = {
  name: 'POST_auth_entregador_login',
  input: {
    cpf: { required: true, type: 'string' },
    senha: { required: true, type: 'string' },
  },
} as const;

const registrarLojistaSpec = {
  name: 'POST_auth_lojista_registrar',
  input: {
    cnpj: { required: true, type: 'string' },
    nomeResponsavel: { required: true, type: 'string' },
    email: { required: true, type: 'string' },
    senha: { required: true, type: 'string' },
    telefone: { required: true, type: 'string' },
  },
} as const;

const loginLojistaSpec = {
  name: 'POST_auth_lojista_login',
  input: {
    senha: { required: true, type: 'string' },
    identificador: { required: false, type: 'string' },
    cnpj: { required: false, type: 'string' },
  },
} as const;

const refreshSpec = {
  name: 'POST_auth_refresh',
  input: {
    refreshToken: { required: true, type: 'string' },
  },
} as const;

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

router.post(
  '/usuario/registrar',
  specValidatorMiddleware(registrarUsuarioSpec),
  async (req, res) => {
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
        usuario: {
          id: usuario.id,
          nome: usuario.nome,
          telefone: usuario.telefone,
          email: usuario.email,
        },
      });
    } catch (error) {
      if (error instanceof z.ZodError) return res.status(400).json({ error: error.errors });
      logger.error({ err: error }, 'Erro ao registrar usuário');
      res.status(500).json({ error: 'Erro ao registrar usuário' });
    }
  },
);

router.post('/usuario/login', specValidatorMiddleware(loginUsuarioSpec), async (req, res) => {
  try {
    const { cpf, senha } = z
      .object({
        cpf: z.string(),
        senha: z.string(),
      })
      .parse(req.body);

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
      usuario: {
        id: usuario.id,
        nome: usuario.nome,
        telefone: usuario.telefone,
        email: usuario.email,
      },
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

router.post(
  '/entregador/registrar',
  specValidatorMiddleware(registrarEntregadorSpec),
  async (req, res) => {
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
      const entregador = await prisma.entregador.create({
        data: { ...dadosEntregador, senhaHash },
      });

      const tokenPayload = { id: entregador.id, tipo: 'entregador' as const };
      const token = gerarToken(tokenPayload);
      const refreshToken = gerarRefreshToken(tokenPayload);

      res.status(201).json({
        token,
        refreshToken,
        entregador: {
          id: entregador.id,
          nome: entregador.nome,
          statusConta: entregador.statusConta,
        },
      });
    } catch (error) {
      if (error instanceof z.ZodError) return res.status(400).json({ error: error.errors });
      logger.error({ err: error }, '[entregador/registrar]');
      res.status(500).json({ error: 'Erro ao registrar entregador' });
    }
  },
);

// Aceita email OU telefone para login (campo "identificador" novo ou "telefone" legado)
router.post('/entregador/login', specValidatorMiddleware(loginEntregadorSpec), async (req, res) => {
  try {
    const { cpf, senha } = z
      .object({
        cpf: z.string(),
        senha: z.string(),
      })
      .parse(req.body);

    const cpfRaw = cpf.replace(/\D/g, '');
    const entregador = await prisma.entregador.findUnique({ where: { cpf: cpfRaw } });

    if (!entregador || !(await compararSenha(senha, entregador.senhaHash))) {
      return res.status(401).json({ error: 'CPF ou senha inválidos' });
    }

    const tokenPayload = { id: entregador.id, tipo: 'entregador' as const };
    const token = gerarToken(tokenPayload);
    const refreshToken = gerarRefreshToken(tokenPayload);

    res.json({
      token,
      refreshToken,
      entregador: {
        id: entregador.id,
        nome: entregador.nome,
        email: entregador.email,
        statusConta: entregador.statusConta,
        fotoUrl: entregador.fotoUrl ?? null,
      },
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

router.post(
  '/lojista/registrar',
  specValidatorMiddleware(registrarLojistaSpec),
  async (req, res) => {
    try {
      const dados = registrarLojistaSchema.parse(req.body);

      const existe = await prisma.lojista.findFirst({
        where: { OR: [{ cnpj: dados.cnpj }, { email: dados.email }] },
      });

      if (existe) return res.status(400).json({ error: 'CNPJ ou email já cadastrado' });

      const { senha, ...dadosLojista } = dados;
      const senhaHash = await hashSenha(senha);
      const lojista = await prisma.lojista.create({ data: { ...dadosLojista, senhaHash } });

      const loja = await prisma.loja.create({
        data: {
          lojistaId: lojista.id,
          nome: dados.nomeResponsavel,
          descricao: '',
          categoria: '',
          telefone: dados.telefone,
          tempoEntregaMin: 30,
          tempoEntregaMax: 60,
          taxaEntrega: 0,
        },
      });

      const tokenPayload = { id: lojista.id, tipo: 'lojista' as const };
      const token = gerarToken(tokenPayload);
      const refreshToken = gerarRefreshToken(tokenPayload);

      res.status(201).json({
        token,
        refreshToken,
        lojista: {
          id: lojista.id,
          nomeResponsavel: lojista.nomeResponsavel,
          email: lojista.email,
          lojaId: loja.id,
          lojaNome: loja.nome,
        },
      });
    } catch (error) {
      if (error instanceof z.ZodError) return res.status(400).json({ error: error.errors });
      res.status(500).json({ error: 'Erro ao registrar lojista' });
    }
  },
);

// Aceita email OU cnpj para login (campo "identificador" novo ou "cnpj" legado)
router.post('/lojista/login', specValidatorMiddleware(loginLojistaSpec), async (req, res) => {
  try {
    const body = z
      .object({
        identificador: z.string().optional(),
        cnpj: z.string().optional(),
        senha: z.string(),
      })
      .parse(req.body);

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

    let loja = await prisma.loja.findFirst({
      where: { lojistaId: lojista.id },
      orderBy: { criadoEm: 'asc' },
      select: { id: true, nome: true },
    });

    if (!loja) {
      loja = await prisma.loja.create({
        data: {
          lojistaId: lojista.id,
          nome: lojista.nomeResponsavel,
          descricao: '',
          categoria: '',
          telefone: lojista.telefone,
          tempoEntregaMin: 30,
          tempoEntregaMax: 60,
          taxaEntrega: 0,
        },
        select: { id: true, nome: true },
      });
      logger.warn({ lojistaId: lojista.id }, 'Loja criada automaticamente no login');
    }

    const tokenPayload = { id: lojista.id, tipo: 'lojista' as const };
    const token = gerarToken(tokenPayload);
    const refreshToken = gerarRefreshToken(tokenPayload);

    res.json({
      token,
      refreshToken,
      lojista: {
        id: lojista.id,
        nomeResponsavel: lojista.nomeResponsavel,
        email: lojista.email,
        cnpj: lojista.cnpj,
        lojaId: loja?.id ?? null,
        lojaNome: loja?.nome ?? null,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: error.errors });
    res.status(500).json({ error: 'Erro no login' });
  }
});

// ========================================
// RECUPERAÇÃO DE SENHA (CONSUMIDOR)
// ========================================

router.post('/usuario/recuperar-senha', async (req, res) => {
  try {
    const { cpf } = z.object({ cpf: z.string() }).parse(req.body);
    const cpfRaw = cpf.replace(/\D/g, '');

    const usuario = await prisma.usuario.findUnique({ where: { cpf: cpfRaw } });

    // Responde 200 mesmo se CPF não encontrado para não vazar informação
    if (!usuario) {
      return res.json({ ok: true });
    }

    // Invalida tokens anteriores
    await prisma.tokenRecuperacaoSenha.updateMany({
      where: { usuarioId: usuario.id, usado: false },
      data: { usado: true },
    });

    // Gera código de 6 dígitos e salva com validade de 15 min
    const codigo = String(Math.floor(100000 + Math.random() * 900000));
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    await prisma.tokenRecuperacaoSenha.create({
      data: { usuarioId: usuario.id, codigo, expiresAt },
    });

    try {
      await sendEmail({
        to: usuario.email,
        subject: 'Código de recuperação de senha — AjuLabs Shopping',
        html: recuperacaoSenhaHtml(usuario.nome, codigo),
      });
    } catch {
      // Email falhou (ex: domínio não verificado) — loga o código no console para dev
      logger.warn(
        { codigo, email: usuario.email },
        '[auth] Email não enviado — código de recuperação para uso em dev',
      );
    }

    logger.info({ usuarioId: usuario.id }, '[auth] Código de recuperação enviado');
    res.json({ ok: true });
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: error.errors });
    logger.error({ err: error }, '[auth] Erro ao enviar recuperação de senha');
    res.status(500).json({ error: 'Erro ao enviar código. Tente novamente.' });
  }
});

router.post('/usuario/redefinir-senha', async (req, res) => {
  try {
    const { cpf, codigo, novaSenha } = z
      .object({
        cpf: z.string(),
        codigo: z.string().length(6, 'Código deve ter 6 dígitos'),
        novaSenha: senhaForteSchema,
      })
      .parse(req.body);

    const cpfRaw = cpf.replace(/\D/g, '');
    const usuario = await prisma.usuario.findUnique({ where: { cpf: cpfRaw } });

    if (!usuario) {
      return res.status(400).json({ error: 'Código inválido ou expirado' });
    }

    const token = await prisma.tokenRecuperacaoSenha.findFirst({
      where: {
        usuarioId: usuario.id,
        codigo,
        usado: false,
        expiresAt: { gt: new Date() },
      },
      orderBy: { criadoEm: 'desc' },
    });

    if (!token) {
      return res.status(400).json({ error: 'Código inválido ou expirado' });
    }

    const senhaHash = await hashSenha(novaSenha);

    await prisma.$transaction([
      prisma.usuario.update({ where: { id: usuario.id }, data: { senhaHash } }),
      prisma.tokenRecuperacaoSenha.update({ where: { id: token.id }, data: { usado: true } }),
    ]);

    logger.info({ usuarioId: usuario.id }, '[auth] Senha redefinida com sucesso');
    res.json({ ok: true });
  } catch (error) {
    if (error instanceof z.ZodError)
      return res.status(400).json({ error: error.errors[0]?.message ?? 'Dados inválidos' });
    logger.error({ err: error }, '[auth] Erro ao redefinir senha');
    res.status(500).json({ error: 'Erro ao redefinir senha. Tente novamente.' });
  }
});

// ========================================
// COLABORADOR (RBAC)
// ========================================

router.post('/colaborador/login', async (req, res) => {
  try {
    const { email, senha } = z
      .object({ email: z.string().email(), senha: z.string().min(1) })
      .parse(req.body);

    const resultado = await loginColaborador(email, senha);
    res.json(resultado);
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: error.errors });
    const err = error as { statusCode?: number; message?: string };
    res.status(err.statusCode ?? 500).json({ error: err.message ?? 'Erro no login' });
  }
});

// ========================================
// REFRESH TOKEN (todos os tipos)
// ========================================

router.post('/refresh', specValidatorMiddleware(refreshSpec), (req, res) => {
  try {
    const { refreshToken } = z.object({ refreshToken: z.string() }).parse(req.body);

    const payload = verificarRefreshToken(refreshToken);
    const novoToken = gerarToken({
      id: payload.id,
      tipo: payload.tipo,
      papel: payload.papel,
      lojaId: payload.lojaId,
    });
    const novoRefreshToken = gerarRefreshToken({
      id: payload.id,
      tipo: payload.tipo,
      papel: payload.papel,
      lojaId: payload.lojaId,
    });

    res.json({ token: novoToken, refreshToken: novoRefreshToken });
  } catch {
    res.status(401).json({ error: 'Refresh token inválido ou expirado' });
  }
});

export default router;
