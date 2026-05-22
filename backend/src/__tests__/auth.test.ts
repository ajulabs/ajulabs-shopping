import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';

vi.mock('../utils/prisma', () => ({
  prisma: {
    usuario: { findFirst: vi.fn(), findUnique: vi.fn(), create: vi.fn() },
    entregador: { findFirst: vi.fn(), findUnique: vi.fn(), create: vi.fn() },
    lojista: { findFirst: vi.fn(), findUnique: vi.fn(), create: vi.fn() },
    loja: { findFirst: vi.fn(), create: vi.fn() },
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

vi.mock('../utils/cors', () => ({
  corsOptions: {},
}));

vi.mock('../utils/socket', () => ({
  getIo: vi.fn(() => ({ to: vi.fn(() => ({ emit: vi.fn() })) })),
  setEntregadorLocalizacao: vi.fn(),
  emitPedidoAtualizado: vi.fn(),
  emitCorridaOferta: vi.fn(),
  emitTicketMensagem: vi.fn(),
  emitTicketStatus: vi.fn(),
  getEntregadorLocalizacao: vi.fn(),
}));

const { prisma } = await import('../utils/prisma');
const { app } = await import('../app');

describe('POST /v1/auth/usuario/registrar', () => {
  beforeEach(() => vi.clearAllMocks());

  it('retorna 400 quando CPF inválido', async () => {
    const res = await request(app).post('/v1/auth/usuario/registrar').send({
      nome: 'Test',
      cpf: '000.000.000-00',
      telefone: '+5511999999999',
      email: 'test@test.com',
      senha: 'Senha@12345',
    });
    expect(res.status).toBe(400);
  });

  it('retorna 400 quando usuário já existe', async () => {
    (prisma.usuario.findFirst as any).mockResolvedValue({ id: 'existing' });

    const res = await request(app).post('/v1/auth/usuario/registrar').send({
      nome: 'Test',
      cpf: '529.982.247-25',
      telefone: '+5511999999999',
      email: 'test@test.com',
      senha: 'Senha@12345',
    });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/já cadastrado/);
  });

  it('cria usuário e retorna tokens', async () => {
    (prisma.usuario.findFirst as any).mockResolvedValue(null);
    (prisma.usuario.create as any).mockResolvedValue({
      id: 'new-user',
      nome: 'Test',
      telefone: '+5511999999999',
      email: 'test@test.com',
    });

    const res = await request(app).post('/v1/auth/usuario/registrar').send({
      nome: 'Test',
      cpf: '529.982.247-25',
      telefone: '+5511999999999',
      email: 'test@test.com',
      senha: 'Senha@12345',
    });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('token', 'mock.jwt.token');
    expect(res.body.usuario).toHaveProperty('id', 'new-user');
  });
});

describe('POST /v1/auth/usuario/login', () => {
  beforeEach(() => vi.clearAllMocks());

  it('retorna 401 quando usuário não existe', async () => {
    (prisma.usuario.findUnique as any).mockResolvedValue(null);

    const res = await request(app)
      .post('/v1/auth/usuario/login')
      .send({ cpf: '529.982.247-25', senha: 'qualquer' });

    expect(res.status).toBe(401);
  });

  it('retorna tokens em login válido', async () => {
    (prisma.usuario.findUnique as any).mockResolvedValue({
      id: 'uid',
      nome: 'Test',
      telefone: '+5511999999999',
      email: 'test@test.com',
      senhaHash: '$2b$10$hash',
    });

    const res = await request(app)
      .post('/v1/auth/usuario/login')
      .send({ cpf: '529.982.247-25', senha: 'Senha@12345' });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
  });
});

describe('POST /v1/auth/refresh', () => {
  it('gera novo token a partir de refreshToken válido', async () => {
    const res = await request(app)
      .post('/v1/auth/refresh')
      .send({ refreshToken: 'valid.refresh.token' });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
    expect(res.body).toHaveProperty('refreshToken');
  });
});
