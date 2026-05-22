import { Router, Response } from 'express';
import { z } from 'zod';
import multer from 'multer';
import { authMiddleware, authEntregador, AuthRequest } from '../middleware/auth';
import * as svc from '../services/entregador.service';

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });
const uploadDocs = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
}).fields([
  { name: 'frente', maxCount: 1 },
  { name: 'verso', maxCount: 1 },
]);
const uploadTroca = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
}).fields([
  { name: 'cnh', maxCount: 1 },
  { name: 'docVeiculo', maxCount: 1 },
]);

const router = Router();
router.use(authMiddleware, authEntregador);

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

router.patch('/dados-pessoais', async (req: AuthRequest, res: Response) => {
  const dados = z
    .object({
      nome: z.string().min(2).optional(),
      email: z.string().email().optional(),
      telefone: z.string().min(10).optional(),
    })
    .parse(req.body);
  const entregador = await svc.updateDadosPessoais(req.user!.id, dados);
  res.json({ entregador });
});

router.patch('/senha', async (req: AuthRequest, res: Response) => {
  const { senhaAtual, novaSenha } = z
    .object({
      senhaAtual: z.string().min(1),
      novaSenha: z.string().min(6),
    })
    .parse(req.body);
  await svc.updateSenha(req.user!.id, senhaAtual, novaSenha);
  res.json({ success: true });
});

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

router.post('/veiculo', async (req: AuthRequest, res: Response) => {
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
});

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

router.post('/dados-bancarios', async (req: AuthRequest, res: Response) => {
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
});

// ── Status ────────────────────────────────────────────────────────────────────

router.patch('/status', async (req: AuthRequest, res: Response) => {
  const { online } = z.object({ online: z.boolean() }).parse(req.body);
  const isOnline = await svc.updateStatus(req.user!.id, online);
  res.json({ online: isOnline });
});

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

router.post('/corridas/:pedidoId/rejeitar', (_req: AuthRequest, res: Response) => {
  res.json({ ok: true });
});

router.post('/corridas/:pedidoId/confirmar-retirada', async (req: AuthRequest, res: Response) => {
  await svc.confirmarRetirada(req.user!.id, req.params.pedidoId);
  res.json({ ok: true });
});

router.post('/corridas/:pedidoId/confirmar-entrega', async (req: AuthRequest, res: Response) => {
  const { codigo } = z.object({ codigo: z.string().min(1) }).parse(req.body);
  await svc.confirmarEntrega(req.user!.id, req.params.pedidoId, codigo);
  res.json({ ok: true });
});

router.patch('/corridas/:pedidoId/status', async (req: AuthRequest, res: Response) => {
  const { status } = z.object({ status: z.enum(['saiu_entrega', 'entregue']) }).parse(req.body);
  const novoStatus = await svc.updateStatusCorrida(req.user!.id, req.params.pedidoId, status);
  res.json({ status: novoStatus });
});

router.post('/corridas/:pedidoId/localizacao', async (req: AuthRequest, res: Response) => {
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
});

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

router.post('/saque', async (req: AuthRequest, res: Response) => {
  const { valor } = z.object({ valor: z.number().min(10) }).parse(req.body);
  const data = await svc.solicitarSaque(req.user!.id, valor);
  res.status(201).json(data);
});

router.get('/saques', async (req: AuthRequest, res: Response) => {
  const saques = await svc.getSaques(req.user!.id);
  res.json({ saques });
});

export default router;
