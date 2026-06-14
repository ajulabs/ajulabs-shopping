import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { validateAgainstSpec } from '../lib/spec-validator';
import type { SpecShape } from '../lib/spec-validator';

// ── Mocks necessários para importar app ──────────────────────────────────────

vi.mock('../utils/prisma', () => ({
  prisma: {
    usuario: { findFirst: vi.fn(), findUnique: vi.fn(), create: vi.fn() },
    produto: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    loja: { findUnique: vi.fn(), findMany: vi.fn(), findFirst: vi.fn(), create: vi.fn() },
    pedido: { findMany: vi.fn(), findUnique: vi.fn(), create: vi.fn() },
  },
}));

vi.mock('../utils/bcrypt', () => ({
  hashSenha: vi.fn().mockResolvedValue('$2b$10$hashed'),
  compararSenha: vi.fn().mockResolvedValue(true),
}));

vi.mock('../utils/jwt', () => ({
  gerarToken: vi.fn().mockReturnValue('mock.jwt.token'),
  gerarRefreshToken: vi.fn().mockReturnValue('mock.refresh.token'),
  verificarRefreshToken: vi.fn().mockReturnValue({ id: 'uid', tipo: 'usuario' }),
}));

vi.mock('../lib/rateLimiter', () => ({
  authLimiter: (_r: unknown, _s: unknown, n: () => void) => n(),
  chatLimiter: (_r: unknown, _s: unknown, n: () => void) => n(),
}));

vi.mock('../lib/logger', () => ({
  logger: { info: vi.fn(), debug: vi.fn(), error: vi.fn(), warn: vi.fn() },
}));

vi.mock('../utils/cors', () => ({ corsOptions: {} }));

vi.mock('../utils/socket', () => ({
  getIo: vi.fn(() => ({ to: vi.fn(() => ({ emit: vi.fn() })) })),
  emitPedidoNovo: vi.fn(),
  emitPedidoAtualizado: vi.fn(),
  getEntregadorLocalizacao: vi.fn(),
}));

vi.mock('../lib/pushNotifications', () => ({
  notificarPedidoNovo: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../middleware/auth', () => ({
  authMiddleware: (_r: unknown, _s: unknown, n: () => void) => n(),
  authUsuario: (_r: unknown, _s: unknown, n: () => void) => n(),
  authLojista: (_r: unknown, _s: unknown, n: () => void) => n(),
  authEntregador: (_r: unknown, _s: unknown, n: () => void) => n(),
  authColaborador: (_r: unknown, _s: unknown, n: () => void) => n(),
  authLojistaOrColaborador: (_r: unknown, _s: unknown, n: () => void) => n(),
  requirePapel: () => (_r: unknown, _s: unknown, n: () => void) => n(),
}));

const { app } = await import('../app');

// ── Unit tests: validateAgainstSpec ──────────────────────────────────────────

describe('validateAgainstSpec — unit', () => {
  const spec: SpecShape = {
    name: 'test_spec',
    input: {
      nome: { required: true, type: 'string' },
      preco: { required: true, type: 'number' },
      descricao: { required: false, type: 'string' },
      imagem: { required: false, type: 'file' },
    },
  };

  it('retorna valid=true quando todos os campos obrigatórios estão presentes', () => {
    const result = validateAgainstSpec(spec, { nome: 'Produto X', preco: 10 });
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
    expect(result.specName).toBe('test_spec');
  });

  it('retorna valid=false quando campo obrigatório está ausente', () => {
    const result = validateAgainstSpec(spec, { nome: 'Produto X' });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Campo obrigatório ausente: "preco"');
  });

  it('retorna valid=false quando múltiplos campos obrigatórios estão ausentes', () => {
    const result = validateAgainstSpec(spec, {});
    expect(result.valid).toBe(false);
    expect(result.errors).toHaveLength(2);
    expect(result.errors).toContain('Campo obrigatório ausente: "nome"');
    expect(result.errors).toContain('Campo obrigatório ausente: "preco"');
  });

  it('ignora campos opcionais ausentes', () => {
    const result = validateAgainstSpec(spec, { nome: 'X', preco: 5 });
    expect(result.valid).toBe(true);
  });

  it('ignora campos do tipo file (multipart)', () => {
    const result = validateAgainstSpec(
      { name: 'upload_spec', input: { arquivo: { required: true, type: 'file' } } },
      {},
    );
    expect(result.valid).toBe(true);
  });

  it('ignora campos que são path params (constraints com "path param")', () => {
    const specComPathParam: SpecShape = {
      name: 'spec_com_path',
      input: {
        id: { required: true, type: 'string', constraints: ['uuid — path param'] },
        corpo: { required: true, type: 'string' },
      },
    };
    const result = validateAgainstSpec(specComPathParam, { corpo: 'valor' });
    expect(result.valid).toBe(true);
  });

  it('retorna valid=true com body vazio e spec sem campos obrigatórios', () => {
    const specVazio: SpecShape = { name: 'spec_vazio', input: {} };
    expect(validateAgainstSpec(specVazio, {}).valid).toBe(true);
  });

  it('trata null como ausente para campo obrigatório', () => {
    const result = validateAgainstSpec(spec, { nome: null as unknown as string, preco: 10 });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Campo obrigatório ausente: "nome"');
  });
});

// ── Integration tests: POST /v1/auth/usuario/login ───────────────────────────

describe('POST /v1/auth/usuario/login — spec validation', () => {
  beforeEach(() => vi.clearAllMocks());

  it('retorna 422 quando cpf está ausente', async () => {
    const res = await request(app).post('/v1/auth/usuario/login').send({ senha: 'Senha@123' });

    expect(res.status).toBe(422);
    expect(res.body.spec).toBe('POST_auth_usuario_login');
    expect(res.body.campos_ausentes).toContain('Campo obrigatório ausente: "cpf"');
  });

  it('retorna 422 quando senha está ausente', async () => {
    const res = await request(app).post('/v1/auth/usuario/login').send({ cpf: '529.982.247-25' });

    expect(res.status).toBe(422);
    expect(res.body.campos_ausentes).toContain('Campo obrigatório ausente: "senha"');
  });

  it('retorna 422 quando body está completamente vazio', async () => {
    const res = await request(app).post('/v1/auth/usuario/login').send({});

    expect(res.status).toBe(422);
    expect(res.body.campos_ausentes).toHaveLength(2);
  });

  it('passa pelo spec-validator e chega no handler quando campos estão presentes', async () => {
    const { prisma } = await import('../utils/prisma');
    (prisma.usuario.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(null);

    const res = await request(app)
      .post('/v1/auth/usuario/login')
      .send({ cpf: '529.982.247-25', senha: 'qualquerSenha' });

    // Spec validator passou, chegou no handler (401 do handler por usuário não encontrado)
    expect(res.status).toBe(401);
    expect(res.body.error).toBe('CPF ou senha inválidos');
  });
});

// ── Integration tests: POST /v1/pedidos ──────────────────────────────────────

describe('POST /v1/pedidos — spec validation', () => {
  beforeEach(() => vi.clearAllMocks());

  it('retorna 422 quando lojaId está ausente', async () => {
    const res = await request(app)
      .post('/v1/pedidos')
      .send({
        enderecoEntregaId: 'end_123',
        metodoPagamento: 'pix',
        itens: [{ produtoId: 'prod_1', quantidade: 1 }],
      });

    expect(res.status).toBe(422);
    expect(res.body.spec).toBe('POST_pedidos');
    expect(res.body.campos_ausentes).toContain('Campo obrigatório ausente: "lojaId"');
  });

  it('retorna 422 quando itens está ausente', async () => {
    const res = await request(app).post('/v1/pedidos').send({
      lojaId: 'loja_123',
      enderecoEntregaId: 'end_123',
      metodoPagamento: 'pix',
    });

    expect(res.status).toBe(422);
    expect(res.body.campos_ausentes).toContain('Campo obrigatório ausente: "itens"');
  });

  it('retorna 422 quando múltiplos campos obrigatórios estão ausentes', async () => {
    const res = await request(app).post('/v1/pedidos').send({});

    expect(res.status).toBe(422);
    const ausentes: string[] = res.body.campos_ausentes;
    expect(ausentes.length).toBeGreaterThanOrEqual(3);
  });

  it('passa pelo spec-validator quando todos os campos obrigatórios estão presentes', async () => {
    const { prisma } = await import('../utils/prisma');
    (prisma.produto.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([]);

    const res = await request(app)
      .post('/v1/pedidos')
      .send({
        lojaId: 'loja_123',
        enderecoEntregaId: 'end_123',
        metodoPagamento: 'pix',
        itens: [{ produtoId: 'prod_1', quantidade: 1 }],
      });

    // Spec passou — chegou no handler (400 por produto não encontrado)
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/produtos não encontrados/i);
  });
});

// ── Integration tests: POST /v1/produtos ─────────────────────────────────────

describe('POST /v1/produtos — spec validation', () => {
  beforeEach(() => vi.clearAllMocks());

  it('retorna 422 quando lojaId está ausente', async () => {
    const res = await request(app).post('/v1/produtos').send({
      nome: 'Camiseta',
      descricao: 'Boa',
      preco: 39.9,
      estoque: 10,
      imagemUrl: 'https://example.com/img.jpg',
      categoria: 'vestuario',
    });

    expect(res.status).toBe(422);
    expect(res.body.spec).toBe('POST_produtos');
    expect(res.body.campos_ausentes).toContain('Campo obrigatório ausente: "lojaId"');
  });

  it('retorna 422 quando nome e preco estão ausentes', async () => {
    const res = await request(app).post('/v1/produtos').send({ lojaId: 'loja_123' });

    expect(res.status).toBe(422);
    const ausentes: string[] = res.body.campos_ausentes;
    expect(ausentes).toContain('Campo obrigatório ausente: "nome"');
    expect(ausentes).toContain('Campo obrigatório ausente: "preco"');
  });

  it('passa pelo spec-validator quando campos obrigatórios estão presentes', async () => {
    const { prisma } = await import('../utils/prisma');
    (prisma.loja.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(null);

    const res = await request(app).post('/v1/produtos').send({
      lojaId: '00000000-0000-0000-0000-000000000001',
      nome: 'Camiseta',
      descricao: 'Boa',
      preco: 39.9,
      estoque: 10,
      imagemUrl: 'https://example.com/img.jpg',
      categoria: 'vestuario',
    });

    // Spec passou — chegou no handler (403 por loja não pertencer ao lojista)
    expect(res.status).toBe(403);
  });
});
