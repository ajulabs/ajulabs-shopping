import { Router, Response } from 'express';
import { z } from 'zod';
import multer from 'multer';
import { imageFileFilter } from '../utils/fileFilters';
import { authMiddleware, authEntregador, AuthRequest } from '../middleware/auth';
import * as svc from '../services/entregador.service';
import { specValidatorMiddleware } from '../lib/spec-validator';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: imageFileFilter,
});
const uploadDocs = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: imageFileFilter,
}).fields([
  { name: 'frente', maxCount: 1 },
  { name: 'verso', maxCount: 1 },
]);
const uploadTroca = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: imageFileFilter,
}).fields([
  { name: 'cnh', maxCount: 1 },
  { name: 'docVeiculo', maxCount: 1 },
]);

const router = Router();
router.use(authMiddleware, authEntregador);

const dadosPessoaisSpec = {
  name: 'PATCH_entregador_dados_pessoais',
  input: {
    nome: { required: false, type: 'string' },
    email: { required: false, type: 'string' },
    telefone: { required: false, type: 'string' },
  },
} as const;

const senhaSpec = {
  name: 'PATCH_entregador_senha',
  input: {
    senhaAtual: { required: true, type: 'string' },
    novaSenha: { required: true, type: 'string' },
  },
} as const;

const veiculoSpec = {
  name: 'POST_entregador_veiculo',
  input: {
    placa: { required: true, type: 'string' },
    modelo: { required: true, type: 'string' },
    cor: { required: true, type: 'string' },
    ano: { required: true, type: 'number', constraints: ['int'] },
  },
} as const;

const dadosBancariosSpec = {
  name: 'POST_entregador_dados_bancarios',
  input: {
    tipo: { required: true, type: 'enum', constraints: ["'pix' | 'conta'"] },
    chavePix: { required: false, type: 'string' },
    banco: { required: false, type: 'string' },
    agencia: { required: false, type: 'string' },
    conta: { required: false, type: 'string' },
  },
} as const;

const statusSpec = {
  name: 'PATCH_entregador_status',
  input: {
    online: { required: true, type: 'boolean' },
  },
} as const;

const heartbeatSpec = {
  name: 'POST_entregador_heartbeat',
  input: {
    lat: { required: true, type: 'number', constraints: ['-90 a 90'] },
    lng: { required: true, type: 'number', constraints: ['-180 a 180'] },
  },
} as const;

const confirmarEntregaSpec = {
  name: 'POST_entregador_corridas_pedidoId_confirmar_entrega',
  input: {
    codigo: {
      required: true,
      type: 'string',
      constraints: ['4 dígitos — últimos 4 do telefone do consumidor'],
    },
  },
} as const;

const localizacaoSpec = {
  name: 'POST_entregador_corridas_localizacao',
  input: {
    lat: { required: true, type: 'number' },
    lng: { required: true, type: 'number' },
    heading: { required: false, type: 'number' },
    speedKmh: { required: false, type: 'number' },
  },
} as const;

const enderecoSpec = {
  name: 'PATCH_entregador_endereco',
  input: {
    cep: { required: true, type: 'string' },
    rua: { required: true, type: 'string' },
    numero: { required: true, type: 'string' },
    bairro: { required: true, type: 'string' },
    cidade: { required: true, type: 'string' },
    complemento: { required: false, type: 'string' },
    lat: { required: false, type: 'number' },
    lng: { required: false, type: 'number' },
  },
} as const;

const saqueSpec = {
  name: 'POST_entregador_saque',
  input: {
    valor: { required: true, type: 'number', constraints: ['min 10'] },
  },
} as const;

// ── Perfil ────────────────────────────────────────────────────────────────────

router.get('/perfil', async (req: AuthRequest, res: Response) => {
  const data = await svc.getPerfil(req.user!.id);
  res.json(data);
});

router.patch('/foto', upload.single('foto'), async (req: AuthRequest, res: Response) => {
  if (!req.file) return res.status(400).json({ error: 'Arquivo de imagem ausente' });
  const fotoUrl = await svc.updateFoto(req.user!.id, req.file);
  res.json({ fotoUrl });
});

router.patch(
  '/dados-pessoais',
  specValidatorMiddleware(dadosPessoaisSpec),
  async (req: AuthRequest, res: Response) => {
    const dados = z
      .object({
        nome: z.string().min(2).optional(),
        email: z.string().email().optional(),
        telefone: z.string().min(10).optional(),
      })
      .parse(req.body);
    const entregador = await svc.updateDadosPessoais(req.user!.id, dados);
    res.json({ entregador });
  },
);

router.patch(
  '/senha',
  specValidatorMiddleware(senhaSpec),
  async (req: AuthRequest, res: Response) => {
    const { senhaAtual, novaSenha } = z
      .object({
        senhaAtual: z.string().min(1),
        novaSenha: z.string().min(6),
      })
      .parse(req.body);
    await svc.updateSenha(req.user!.id, senhaAtual, novaSenha);
    res.json({ success: true });
  },
);

// ── Documentos ────────────────────────────────────────────────────────────────

router.post('/documentos/upload', uploadDocs, async (req: AuthRequest, res: Response) => {
  const files = req.files as Record<string, Express.Multer.File[]> | undefined;
  if (!files?.frente?.[0])
    return res.status(400).json({ error: 'Frente do documento obrigatória' });
  if (!files?.verso?.[0]) return res.status(400).json({ error: 'Verso do documento obrigatório' });
  const documento = await svc.uploadDocumentos(req.user!.id, files.frente[0], files.verso[0]);
  res.status(201).json({ documento });
});

// ── Veículo ───────────────────────────────────────────────────────────────────

router.post(
  '/veiculo',
  specValidatorMiddleware(veiculoSpec),
  async (req: AuthRequest, res: Response) => {
    const dados = z
      .object({
        placa: z.string().min(7).max(8),
        modelo: z.string().min(1),
        cor: z.string().min(1),
        ano: z
          .number()
          .int()
          .min(1950)
          .max(new Date().getFullYear() + 1),
      })
      .parse(req.body);
    const veiculo = await svc.cadastrarVeiculo(req.user!.id, dados);
    res.status(201).json({ veiculo });
  },
);

router.get('/veiculo/trocar', async (req: AuthRequest, res: Response) => {
  const solicitacao = await svc.getSolicitacaoTrocaPendente(req.user!.id);
  res.json({ solicitacao });
});

router.post('/veiculo/trocar', uploadTroca, async (req: AuthRequest, res: Response) => {
  const dados = z
    .object({
      tipoTransporte: z.enum(['bike', 'moto', 'carro']),
      modelo: z.string().min(1),
      placa: z.string().min(1),
      cor: z.string().min(1),
      ano: z.string().regex(/^\d{4}$/),
    })
    .parse(req.body);
  const files = req.files as Record<string, Express.Multer.File[]> | undefined;
  const result = await svc.solicitarTrocaVeiculo(req.user!.id, dados, files);
  res.status(result.status === 'aprovado' ? 200 : 201).json(result);
});

// ── Dados bancários ───────────────────────────────────────────────────────────

router.post(
  '/dados-bancarios',
  specValidatorMiddleware(dadosBancariosSpec),
  async (req: AuthRequest, res: Response) => {
    const dados = z
      .object({
        tipo: z.enum(['pix', 'conta']),
        chavePix: z.string().optional(),
        banco: z.string().optional(),
        agencia: z.string().optional(),
        conta: z.string().optional(),
      })
      .refine((d) => (d.tipo === 'pix' ? !!d.chavePix : !!d.banco && !!d.agencia && !!d.conta), {
        message: 'Para tipo "pix" envie chavePix; para "conta" envie banco, agencia e conta.',
      })
      .parse(req.body);
    const dadosBancarios = await svc.cadastrarDadosBancarios(req.user!.id, dados);
    res.status(201).json({ dadosBancarios });
  },
);

// ── Endereço ──────────────────────────────────────────────────────────────────

router.patch(
  '/endereco',
  specValidatorMiddleware(enderecoSpec),
  async (req: AuthRequest, res: Response) => {
    const dados = z
      .object({
        cep: z.string().length(8),
        rua: z.string().min(1),
        numero: z.string().min(1),
        bairro: z.string().min(1),
        cidade: z.string().min(1),
        complemento: z.string().optional(),
        lat: z.number().optional(),
        lng: z.number().optional(),
      })
      .parse(req.body);
    await svc.updateEndereco(req.user!.id, dados);
    res.json({ ok: true });
  },
);

// ── Status ────────────────────────────────────────────────────────────────────

router.patch(
  '/status',
  specValidatorMiddleware(statusSpec),
  async (req: AuthRequest, res: Response) => {
    const { online } = z.object({ online: z.boolean() }).parse(req.body);
    const isOnline = await svc.updateStatus(req.user!.id, online);
    res.json({ online: isOnline });
  },
);

/**
 * Heartbeat de localização do entregador online.
 *
 * Chamado pelo app aproximadamente a cada 1 min enquanto o entregador
 * está online (sem corrida ativa). Atualiza a última posição reportada
 * para que o backend possa ofertar corridas para os entregadores mais
 * próximos sem depender de socket aberto.
 *
 * Durante uma corrida ativa, o app envia posição via socket
 * `localizacao:update` com frequência muito maior (a cada 5s), então
 * essa rota só é usada no modo "online idle".
 */
router.post(
  '/heartbeat',
  specValidatorMiddleware(heartbeatSpec),
  async (req: AuthRequest, res: Response) => {
    const { lat, lng } = z
      .object({
        lat: z.number().min(-90).max(90),
        lng: z.number().min(-180).max(180),
      })
      .parse(req.body);
    await svc.atualizarHeartbeat(req.user!.id, lat, lng);
    res.json({ ok: true });
  },
);

// ── Corridas ──────────────────────────────────────────────────────────────────

router.get('/corridas/ativas', async (req: AuthRequest, res: Response) => {
  const corridas = await svc.getCorridasAtivas(req.user!.id);
  res.json({ corridas });
});

router.get('/corridas/disponivel', async (req: AuthRequest, res: Response) => {
  const corridas = await svc.getCorridasDisponiveis(req.user!.id);
  res.json({ corridas });
});

router.post('/corridas/:pedidoId/aceitar', async (req: AuthRequest, res: Response) => {
  const pedido = await svc.aceitarCorrida(req.user!.id, req.params.pedidoId);
  res.json({ pedido });
});

router.post('/corridas/:pedidoId/rejeitar', async (req: AuthRequest, res: Response) => {
  await svc.rejeitarCorrida(req.user!.id, req.params.pedidoId);
  res.json({ ok: true });
});

router.post(
  '/corridas/:pedidoId/cancelar',
  upload.single('foto'),
  async (req: AuthRequest, res: Response) => {
    const { motivo } = z
      .object({ motivo: z.enum(['area_risco', 'pneu_furou', 'acidente']) })
      .parse(req.body);
    const result = await svc.cancelarCorrida(req.user!.id, req.params.pedidoId, motivo, req.file);
    res.json({ ok: true, ...result });
  },
);

router.post('/corridas/:pedidoId/confirmar-retirada', async (req: AuthRequest, res: Response) => {
  await svc.confirmarRetirada(req.user!.id, req.params.pedidoId);
  res.json({ ok: true });
});

router.post(
  '/corridas/:pedidoId/confirmar-entrega',
  specValidatorMiddleware(confirmarEntregaSpec),
  async (req: AuthRequest, res: Response) => {
    const { codigo } = z.object({ codigo: z.string().min(1) }).parse(req.body);
    await svc.confirmarEntrega(req.user!.id, req.params.pedidoId, codigo);
    res.json({ ok: true });
  },
);

router.post(
  '/corridas/:pedidoId/localizacao',
  specValidatorMiddleware(localizacaoSpec),
  async (req: AuthRequest, res: Response) => {
    const coords = z
      .object({
        lat: z.number(),
        lng: z.number(),
        heading: z.number().optional(),
        speedKmh: z.number().optional(),
      })
      .parse(req.body);
    await svc.updateLocalizacao(req.user!.id, req.params.pedidoId, coords);
    res.json({ ok: true });
  },
);

// ── Ganhos & Entregas ─────────────────────────────────────────────────────────

router.get('/ganhos', async (req: AuthRequest, res: Response) => {
  const data = await svc.getGanhos(req.user!.id);
  res.json(data);
});

router.get('/entregas', async (req: AuthRequest, res: Response) => {
  const data = await svc.getEntregas(req.user!.id);
  res.json(data);
});

// ── Saques ────────────────────────────────────────────────────────────────────

router.post(
  '/saque',
  specValidatorMiddleware(saqueSpec),
  async (req: AuthRequest, res: Response) => {
    const { valor } = z.object({ valor: z.number().min(10) }).parse(req.body);
    const data = await svc.solicitarSaque(req.user!.id, valor);
    res.status(201).json(data);
  },
);

router.get('/saques', async (req: AuthRequest, res: Response) => {
  const saques = await svc.getSaques(req.user!.id);
  res.json({ saques });
});

export default router;
