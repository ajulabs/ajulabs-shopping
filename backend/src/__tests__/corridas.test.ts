import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';

const ENTREGADOR_ID = 'entregador-uuid';
const PEDIDO_ID = 'pedido-uuid';
const CONSUMIDOR_ID = 'consumidor-uuid';

vi.mock('../utils/prisma', () => ({
  prisma: {
    pedido: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      count: vi.fn(),
      update: vi.fn(),
    },
    entregador: { findUnique: vi.fn(), update: vi.fn() },
    historicoStatusPedido: { create: vi.fn() },
    entregaRealizada: { upsert: vi.fn() },
    chatPedido: { updateMany: vi.fn().mockResolvedValue({ count: 0 }) },
    solicitacaoSaque: { findMany: vi.fn() },
  },
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

vi.mock('../middleware/auth', () => ({
  authMiddleware: (req: any, _res: unknown, next: () => void) => {
    req.user = { id: ENTREGADOR_ID, tipo: 'entregador' };
    next();
  },
  authEntregador: (_r: unknown, _s: unknown, n: () => void) => n(),
  authUsuario: (_r: unknown, _s: unknown, n: () => void) => n(),
  authLojista: (_r: unknown, _s: unknown, n: () => void) => n(),
  authColaborador: (_r: unknown, _s: unknown, n: () => void) => n(),
  authLojistaOrColaborador: (_r: unknown, _s: unknown, n: () => void) => n(),
  requirePapel: () => (_r: unknown, _s: unknown, n: () => void) => n(),
}));

const { prisma } = await import('../utils/prisma');
const { app } = await import('../app');

const AUTH = { Authorization: 'Bearer mock.token' };

describe('GET /v1/entregador/corridas/disponivel', () => {
  beforeEach(() => vi.clearAllMocks());

  it('retorna lista vazia quando entregador está offline', async () => {
    (prisma.entregador.findUnique as any).mockResolvedValue({ online: false });

    const res = await request(app).get('/v1/entregador/corridas/disponivel').set(AUTH);

    expect(res.status).toBe(200);
    expect(res.body.corridas).toHaveLength(0);
  });

  it('retorna lista vazia quando entregador tem 2 ativas', async () => {
    (prisma.entregador.findUnique as any).mockResolvedValue({ online: true });
    (prisma.pedido.count as any).mockResolvedValue(2);

    const res = await request(app).get('/v1/entregador/corridas/disponivel').set(AUTH);

    expect(res.status).toBe(200);
    expect(res.body.corridas).toHaveLength(0);
  });

  it('retorna corridas quando online com capacidade', async () => {
    (prisma.entregador.findUnique as any).mockResolvedValue({ online: true });
    (prisma.pedido.count as any).mockResolvedValue(0);
    (prisma.pedido.findMany as any).mockResolvedValue([
      { id: PEDIDO_ID, loja: {}, enderecoEntrega: {}, itens: [], consumidor: {} },
    ]);

    const res = await request(app).get('/v1/entregador/corridas/disponivel').set(AUTH);

    expect(res.status).toBe(200);
    expect(res.body.corridas).toHaveLength(1);
  });
});

describe('POST /v1/entregador/corridas/:id/aceitar', () => {
  beforeEach(() => vi.clearAllMocks());

  it('retorna 409 quando limite de 2 corridas atingido', async () => {
    (prisma.pedido.count as any).mockResolvedValue(2);

    const res = await request(app).post(`/v1/entregador/corridas/${PEDIDO_ID}/aceitar`).set(AUTH);

    expect(res.status).toBe(409);
    expect(res.body.error).toMatch(/Limite/);
  });

  it('retorna 409 quando corrida não está mais disponível', async () => {
    (prisma.pedido.count as any).mockResolvedValue(0);
    (prisma.pedido.findFirst as any).mockResolvedValue(null);

    const res = await request(app).post(`/v1/entregador/corridas/${PEDIDO_ID}/aceitar`).set(AUTH);

    expect(res.status).toBe(409);
  });

  it('aceita corrida com sucesso', async () => {
    (prisma.pedido.count as any).mockResolvedValue(0);
    (prisma.pedido.findFirst as any).mockResolvedValue({
      id: PEDIDO_ID,
      status: 'pronto',
      entregadorId: null,
    });
    (prisma.pedido.update as any).mockResolvedValue({
      id: PEDIDO_ID,
      loja: { id: 'loja-id', nome: 'Loja', telefone: '' },
      enderecoEntrega: {},
      itens: [],
      consumidor: { nome: 'Cliente', telefone: '' },
    });

    const res = await request(app).post(`/v1/entregador/corridas/${PEDIDO_ID}/aceitar`).set(AUTH);

    expect(res.status).toBe(200);
    expect(res.body.pedido).toHaveProperty('id', PEDIDO_ID);
  });
});

describe('POST /v1/entregador/corridas/:id/confirmar-entrega', () => {
  beforeEach(() => vi.clearAllMocks());

  it('retorna 400 quando código incorreto', async () => {
    (prisma.pedido.findFirst as any).mockResolvedValue({
      id: PEDIDO_ID,
      codigoEntrega: 'ABC123',
      consumidorId: CONSUMIDOR_ID,
      taxaEntrega: '5.00',
    });

    const res = await request(app)
      .post(`/v1/entregador/corridas/${PEDIDO_ID}/confirmar-entrega`)
      .set(AUTH)
      .send({ codigo: 'ERRADO' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/Código/);
  });

  it('confirma entrega com código correto', async () => {
    (prisma.pedido.findFirst as any).mockResolvedValue({
      id: PEDIDO_ID,
      codigoEntrega: 'ABC123',
      consumidorId: CONSUMIDOR_ID,
      taxaEntrega: '5.00',
    });
    (prisma.pedido.update as any).mockResolvedValue({ id: PEDIDO_ID, status: 'entregue' });
    (prisma.historicoStatusPedido.create as any).mockResolvedValue({});
    (prisma.entregaRealizada.upsert as any).mockResolvedValue({});

    const res = await request(app)
      .post(`/v1/entregador/corridas/${PEDIDO_ID}/confirmar-entrega`)
      .set(AUTH)
      .send({ codigo: 'ABC123' });

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });
});

describe('PATCH /v1/entregador/status', () => {
  beforeEach(() => vi.clearAllMocks());

  it('retorna 400 quando body inválido', async () => {
    const res = await request(app)
      .patch('/v1/entregador/status')
      .set(AUTH)
      .send({ online: 'not-a-boolean' });

    expect(res.status).toBe(400);
  });

  it('atualiza status online', async () => {
    (prisma.entregador.update as any).mockResolvedValue({ id: ENTREGADOR_ID, online: true });

    const res = await request(app).patch('/v1/entregador/status').set(AUTH).send({ online: true });

    expect(res.status).toBe(200);
    expect(res.body.online).toBe(true);
  });
});
