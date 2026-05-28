import { Router } from 'express';
import { z } from 'zod';
import { authMiddleware, authUsuario, AuthRequest } from '../middleware/auth';
import { prisma } from '../utils/prisma';
import { logger } from '../lib/logger';
import { viaCepByCep, geocodeByCep, geocodeByQuery } from '../lib/geocoder';
import { specValidatorMiddleware } from '../lib/spec-validator';

const router = Router();

const criarEnderecoSpec = {
  name: 'POST_enderecos',
  input: {
    apelido: { required: true, type: 'string' },
    rua: { required: true, type: 'string' },
    numero: { required: true, type: 'string' },
    bairro: { required: true, type: 'string' },
    cep: { required: true, type: 'string', constraints: ['8 dígitos numéricos'] },
    cidade: { required: true, type: 'string' },
    complemento: { required: false, type: 'string' },
    lat: { required: false, type: 'number' },
    lng: { required: false, type: 'number' },
    geoSource: { required: false, type: 'enum', constraints: ["'gps' | 'geocode' | 'manual'"] },
  },
} as const;

const enderecoSchema = z.object({
  apelido: z.string().min(1),
  rua: z.string().min(1),
  numero: z.string().min(1),
  bairro: z.string().min(1),
  cep: z.string().regex(/^\d{8}$/, 'CEP deve ter 8 dígitos numéricos'),
  cidade: z.string().min(1),
  complemento: z.string().optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
  geoSource: z.enum(['gps', 'geocode', 'manual']).optional(),
});

async function resolverCoords(
  dados: { cep: string; rua: string; bairro: string; cidade: string },
  coordsExternas?: { lat: number; lng: number; geoSource?: string },
): Promise<{
  lat: number | null;
  lng: number | null;
  accuracy: number | null;
  geoSource: string | null;
}> {
  // 1. Coordenadas fornecidas pelo cliente (GPS do dispositivo)
  if (coordsExternas?.lat && coordsExternas?.lng) {
    return {
      lat: coordsExternas.lat,
      lng: coordsExternas.lng,
      accuracy: 30,
      geoSource: coordsExternas.geoSource ?? 'gps',
    };
  }

  // 2. Geocodificar via CEP
  const porCep = await geocodeByCep(dados.cep);
  if (porCep) {
    logger.info({ cep: dados.cep, coords: porCep }, '[enderecos] coords via CEP');
    return { lat: porCep.lat, lng: porCep.lng, accuracy: 80, geoSource: 'geocode' };
  }

  // 3. Geocodificar via endereço textual
  const q = `${dados.rua}, ${dados.bairro}, ${dados.cidade}`;
  const porQuery = await geocodeByQuery(q);
  if (porQuery) {
    logger.info({ q, coords: porQuery }, '[enderecos] coords via query');
    return { lat: porQuery.lat, lng: porQuery.lng, accuracy: 150, geoSource: 'geocode' };
  }

  logger.warn({ cep: dados.cep, rua: dados.rua }, '[enderecos] não foi possível geocodificar');
  return { lat: null, lng: null, accuracy: null, geoSource: null };
}

// GET /enderecos
router.get('/', authMiddleware, authUsuario, async (req: AuthRequest, res) => {
  const enderecos = await prisma.enderecoUsuario.findMany({
    where: { usuarioId: req.user!.id },
    orderBy: [{ padrao: 'desc' }, { criadoEm: 'asc' }],
  });
  res.json({ enderecos });
});

// POST /enderecos
router.post(
  '/',
  authMiddleware,
  authUsuario,
  specValidatorMiddleware(criarEnderecoSpec),
  async (req: AuthRequest, res) => {
    const dados = enderecoSchema.parse(req.body);

    // Validar CEP no ViaCEP (P3)
    const via = await viaCepByCep(dados.cep);
    if (!via) {
      return res.status(422).json({ error: 'CEP inválido ou não encontrado.' });
    }

    const { lat: latExt, lng: lngExt, geoSource: srcExt, ...dadosSemCoords } = dados;
    const coords = await resolverCoords(
      dadosSemCoords,
      latExt != null && lngExt != null
        ? { lat: latExt, lng: lngExt, geoSource: srcExt }
        : undefined,
    );

    const total = await prisma.enderecoUsuario.count({ where: { usuarioId: req.user!.id } });

    const endereco = await prisma.enderecoUsuario.create({
      data: {
        ...dadosSemCoords,
        usuarioId: req.user!.id,
        padrao: total === 0,
        ...coords,
      },
    });

    res.status(201).json({ endereco });
  },
);

// PUT /enderecos/:id
router.put('/:id', authMiddleware, authUsuario, async (req: AuthRequest, res) => {
  const dados = enderecoSchema.partial().parse(req.body);

  const endereco = await prisma.enderecoUsuario.findUnique({ where: { id: req.params.id } });
  if (!endereco || endereco.usuarioId !== req.user!.id) {
    return res.status(403).json({ error: 'Acesso negado' });
  }

  // Valida CEP se foi alterado
  if (dados.cep && dados.cep !== endereco.cep) {
    const via = await viaCepByCep(dados.cep);
    if (!via) return res.status(422).json({ error: 'CEP inválido ou não encontrado.' });
  }

  const { lat: latExt, lng: lngExt, geoSource: srcExt, ...dadosSemCoords } = dados;

  // Re-geocodifica se endereço textual mudou e não vieram coords novas
  let coords: Awaited<ReturnType<typeof resolverCoords>> | undefined;
  const enderecoMudou = dados.rua || dados.bairro || dados.cep;
  if (enderecoMudou) {
    const base = {
      cep: dados.cep ?? endereco.cep,
      rua: dados.rua ?? endereco.rua,
      bairro: dados.bairro ?? endereco.bairro,
      cidade: dados.cidade ?? endereco.cidade,
    };
    coords = await resolverCoords(
      base,
      latExt != null && lngExt != null
        ? { lat: latExt, lng: lngExt, geoSource: srcExt }
        : undefined,
    );
  }

  const atualizado = await prisma.enderecoUsuario.update({
    where: { id: req.params.id },
    data: { ...dadosSemCoords, ...(coords ?? {}) },
  });

  res.json({ endereco: atualizado });
});

// DELETE /enderecos/:id
router.delete('/:id', authMiddleware, authUsuario, async (req: AuthRequest, res) => {
  const endereco = await prisma.enderecoUsuario.findUnique({ where: { id: req.params.id } });
  if (!endereco || endereco.usuarioId !== req.user!.id) {
    return res.status(403).json({ error: 'Acesso negado' });
  }
  if (endereco.padrao) {
    return res.status(400).json({ error: 'Não é possível remover o endereço padrão' });
  }
  await prisma.enderecoUsuario.delete({ where: { id: req.params.id } });
  res.json({ message: 'Endereço removido com sucesso' });
});

// PATCH /enderecos/:id/padrao
router.patch('/:id/padrao', authMiddleware, authUsuario, async (req: AuthRequest, res) => {
  const endereco = await prisma.enderecoUsuario.findUnique({ where: { id: req.params.id } });
  if (!endereco || endereco.usuarioId !== req.user!.id) {
    return res.status(403).json({ error: 'Acesso negado' });
  }
  await prisma.enderecoUsuario.updateMany({
    where: { usuarioId: req.user!.id },
    data: { padrao: false },
  });
  const atualizado = await prisma.enderecoUsuario.update({
    where: { id: req.params.id },
    data: { padrao: true },
  });
  res.json({ endereco: atualizado });
});

export default router;
