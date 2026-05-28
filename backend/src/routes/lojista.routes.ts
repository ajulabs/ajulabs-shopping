import { Router } from 'express';
import { z } from 'zod';
import multer from 'multer';
import { authMiddleware, authLojista, AuthRequest } from '../middleware/auth';
import * as svc from '../services/lojista.service';
import { specValidatorMiddleware } from '../lib/spec-validator';

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

const router = Router();

const ticketStatusSpec = {
  name: 'PATCH_lojista_tickets_id_status',
  input: {
    status: {
      required: true,
      type: 'string',
      constraints: ["'aberto' | 'em_andamento' | 'resolvido' | 'cancelado'"],
    },
  },
} as const;

const ticketUrgenteSpec = {
  name: 'PATCH_lojista_tickets_id_urgente',
  input: {
    urgente: { required: true, type: 'boolean' },
  },
} as const;

const ticketNotaSpec = {
  name: 'POST_lojista_tickets_id_notas',
  input: {
    texto: { required: true, type: 'string' },
  },
} as const;

const ticketMensagemLojistaSpec = {
  name: 'POST_lojista_tickets_id_mensagens',
  input: {
    texto: { required: true, type: 'string' },
  },
} as const;

const lojaUpdateSchema = z.object({
  nome: z.string().min(2).optional(),
  descricao: z.string().optional(),
  categoria: z.string().optional(),
  telefone: z.string().optional(),
  aceitaAgendamento: z.boolean().optional(),
  antecedenciaMinima: z.number().int().nonnegative().optional(),
  endereco: z
    .object({
      rua: z.string(),
      numero: z.string().optional().default(''),
      bairro: z.string(),
      cep: z.string(),
      cidade: z.string(),
      complemento: z.string().optional(),
    })
    .optional(),
});

const variacaoSchema = z.object({
  nome: z.string().min(1),
  estoque: z.number().int().nonnegative(),
});

const produtoFormSchema = z.object({
  lojaId: z.string().uuid(),
  nome: z.string().min(2),
  descricao: z.string(),
  preco: z
    .string()
    .transform((v) => parseFloat(v))
    .pipe(z.number().positive()),
  estoque: z
    .string()
    .transform((v) => parseInt(v, 10))
    .pipe(z.number().int().nonnegative()),
  categoria: z.string(),
  tags: z
    .string()
    .optional()
    .transform((v) => {
      try {
        return JSON.parse(v ?? '[]');
      } catch {
        return [];
      }
    })
    .pipe(z.array(z.string())),
  variacoes: z
    .string()
    .optional()
    .transform((v) => {
      try {
        return JSON.parse(v ?? '[]');
      } catch {
        return [];
      }
    })
    .pipe(z.array(variacaoSchema)),
});

// ── Pedidos ───────────────────────────────────────────────────────────────────

router.get('/lojas/:id/pedidos', authMiddleware, authLojista, async (req: AuthRequest, res) => {
  await svc.verificarDonoLoja(req.params.id, req.user!.id);
  const { status, page = '1', limit = '20' } = req.query;
  const data = await svc.getPedidos(req.params.id, {
    status: status as string | undefined,
    page: Number(page),
    limit: Number(limit),
  });
  res.json(data);
});

router.patch('/pedidos/:id/status', authMiddleware, authLojista, async (req: AuthRequest, res) => {
  const pedido = await svc.avancarStatusPedido(req.params.id, req.user!.id);
  res.json({ pedido });
});

router.get(
  '/pedidos/:id/localizacao-entregador',
  authMiddleware,
  authLojista,
  async (req: AuthRequest, res) => {
    const localizacao = await svc.getLocalizacaoEntregador(req.params.id, req.user!.id);
    res.json({ localizacao });
  },
);

// ── Dashboard ─────────────────────────────────────────────────────────────────

router.get('/lojas/:id/dashboard', authMiddleware, authLojista, async (req: AuthRequest, res) => {
  await svc.verificarDonoLoja(req.params.id, req.user!.id);
  const data = await svc.getDashboard(req.params.id);
  res.json(data);
});

// ── Loja ──────────────────────────────────────────────────────────────────────

router.get('/lojas/:id', authMiddleware, authLojista, async (req: AuthRequest, res) => {
  await svc.verificarDonoLoja(req.params.id, req.user!.id);
  const loja = await svc.getLoja(req.params.id);
  res.json({ loja });
});

router.patch('/lojas/:id', authMiddleware, authLojista, async (req: AuthRequest, res) => {
  await svc.verificarDonoLoja(req.params.id, req.user!.id);
  const dados = lojaUpdateSchema.parse(req.body);
  const loja = await svc.updateLoja(req.params.id, dados);
  res.json({ loja });
});

router.patch(
  '/lojas/:id/imagem',
  authMiddleware,
  authLojista,
  upload.fields([
    { name: 'logo', maxCount: 1 },
    { name: 'banner', maxCount: 1 },
  ]),
  async (req: AuthRequest, res) => {
    await svc.verificarDonoLoja(req.params.id, req.user!.id);
    const files = req.files as { [k: string]: Express.Multer.File[] } | undefined;
    const loja = await svc.updateImagemLoja(req.params.id, {
      logo: files?.logo?.[0],
      banner: files?.banner?.[0],
    });
    res.json({ loja });
  },
);

// ── Produtos ──────────────────────────────────────────────────────────────────

router.get('/produtos', authMiddleware, authLojista, async (req: AuthRequest, res) => {
  const { lojaId } = req.query;
  if (!lojaId) return res.status(400).json({ error: 'lojaId é obrigatório' });
  await svc.verificarDonoLoja(lojaId as string, req.user!.id);
  const produtos = await svc.getProdutos(lojaId as string);
  res.json({ produtos });
});

router.post(
  '/produtos/analisar',
  authMiddleware,
  authLojista,
  upload.single('imagem'),
  async (req: AuthRequest, res) => {
    if (!req.file) return res.status(400).json({ error: 'Imagem ausente' });
    const resultado = await svc.analisarImagemProduto(req.file);
    res.json(resultado);
  },
);

router.post(
  '/produtos',
  authMiddleware,
  authLojista,
  upload.single('imagem'),
  async (req: AuthRequest, res) => {
    const { variacoes = [], ...dadosSemVar } = produtoFormSchema.parse(req.body);
    await svc.verificarDonoLoja(dadosSemVar.lojaId, req.user!.id);
    const produto = await svc.criarProduto(dadosSemVar, req.file, variacoes);
    res.status(201).json({ produto });
  },
);

router.put(
  '/produtos/:id',
  authMiddleware,
  authLojista,
  upload.array('imagens', 4),
  async (req: AuthRequest, res) => {
    const body = req.body as Record<string, string | undefined>;
    let imagensExistentes: string[] = [];
    try {
      imagensExistentes = JSON.parse(body.imagensExistentes ?? '[]');
    } catch {
      /* invalid JSON defaults to [] */
    }
    let variacoes: { nome: string; estoque: number }[] | undefined;
    if (body.variacoes !== undefined) {
      try {
        variacoes = JSON.parse(body.variacoes);
      } catch {
        variacoes = [];
      }
    }
    const files = req.files as Express.Multer.File[] | undefined;
    const produto = await svc.updateProduto(
      req.params.id,
      req.user!.id,
      body,
      imagensExistentes,
      files,
      variacoes,
    );
    res.json({ produto });
  },
);

router.delete('/produtos/:id', authMiddleware, authLojista, async (req: AuthRequest, res) => {
  await svc.deleteProduto(req.params.id, req.user!.id);
  res.json({ message: 'Produto removido com sucesso' });
});

// ── Tickets ───────────────────────────────────────────────────────────────────

router.get('/lojas/:id/tickets', authMiddleware, authLojista, async (req: AuthRequest, res) => {
  await svc.verificarDonoLoja(req.params.id, req.user!.id);
  const { status, page = '1', limit = '20' } = req.query;
  const data = await svc.getTickets(req.params.id, {
    status: status as string | undefined,
    page: Number(page),
    limit: Number(limit),
  });
  res.json(data);
});

router.get('/tickets/:id', authMiddleware, authLojista, async (req: AuthRequest, res) => {
  const ticket = await svc.getTicket(req.params.id, req.user!.id);
  res.json({ ticket });
});

router.patch(
  '/tickets/:id/status',
  authMiddleware,
  authLojista,
  specValidatorMiddleware(ticketStatusSpec),
  async (req: AuthRequest, res) => {
    const ticket = await svc.updateTicketStatus(req.params.id, req.user!.id, req.body.status);
    res.json({ ticket });
  },
);

router.patch(
  '/tickets/:id/urgente',
  authMiddleware,
  authLojista,
  specValidatorMiddleware(ticketUrgenteSpec),
  async (req: AuthRequest, res) => {
    const ticket = await svc.updateTicketUrgente(
      req.params.id,
      req.user!.id,
      Boolean(req.body.urgente),
    );
    res.json({ ticket });
  },
);

router.post(
  '/tickets/:id/notas',
  authMiddleware,
  authLojista,
  specValidatorMiddleware(ticketNotaSpec),
  async (req: AuthRequest, res) => {
    if (!req.body.texto?.trim()) return res.status(400).json({ error: 'Texto obrigatório' });
    const nota = await svc.addTicketNota(req.params.id, req.user!.id, req.body.texto);
    res.status(201).json({ nota });
  },
);

router.post(
  '/tickets/:id/mensagens',
  authMiddleware,
  authLojista,
  specValidatorMiddleware(ticketMensagemLojistaSpec),
  async (req: AuthRequest, res) => {
    if (!req.body.texto?.trim()) return res.status(400).json({ error: 'Texto obrigatório' });
    const mensagem = await svc.addTicketMensagem(req.params.id, req.user!.id, req.body.texto);
    res.status(201).json({ mensagem });
  },
);

export default router;
