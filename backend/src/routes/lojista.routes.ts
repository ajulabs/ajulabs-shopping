import { Router } from 'express';
import { z } from 'zod';
import OpenAI from 'openai';
import multer from 'multer';
import { authMiddleware, authLojista, AuthRequest } from '../middleware/auth';
import { prisma } from '../utils/prisma';
import { uploadImagemProduto } from '../utils/supabase';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const uploadImagem = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

const router = Router();

const STATUS_PROGRESSAO: Partial<Record<string, string>> = {
  aguardando: 'confirmado',
  confirmado: 'preparando',
  preparando: 'saiu_entrega',
  saiu_entrega: 'entregue',
};

async function verificarDonoLoja(lojaId: string, lojistaId: string) {
  const loja = await prisma.loja.findUnique({ where: { id: lojaId } });
  return loja?.lojistaId === lojistaId ? loja : null;
}

// GET /lojista/lojas/:id/pedidos - Listar pedidos da loja
router.get('/lojas/:id/pedidos', authMiddleware, authLojista, async (req: AuthRequest, res) => {
  try {
    const loja = await verificarDonoLoja(req.params.id, req.user!.id);
    if (!loja) return res.status(403).json({ error: 'Acesso negado' });

    const { status, page = '1', limit = '20' } = req.query;

    const where: Record<string, unknown> = { lojaId: loja.id };
    if (status) where.status = status;

    const [pedidos, total] = await Promise.all([
      prisma.pedido.findMany({
        where,
        include: {
          consumidor: { select: { nome: true, telefone: true } },
          itens: true,
          historico: { orderBy: { criadoEm: 'asc' } },
          enderecoEntrega: true,
          entregador: { select: { nome: true, telefone: true, veiculo: { select: { placa: true, modelo: true } } } },
        },
        orderBy: { criadoEm: 'desc' },
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit),
      }),
      prisma.pedido.count({ where }),
    ]);

    res.json({ pedidos, total, page: Number(page), limit: Number(limit) });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar pedidos' });
  }
});

// PATCH /lojista/pedidos/:id/status - Avançar status do pedido
router.patch('/pedidos/:id/status', authMiddleware, authLojista, async (req: AuthRequest, res) => {
  try {
    const pedido = await prisma.pedido.findUnique({
      where: { id: req.params.id },
      include: { loja: true },
    });

    if (!pedido || pedido.loja.lojistaId !== req.user!.id) {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    if (pedido.status === 'cancelado' || pedido.status === 'entregue') {
      return res.status(400).json({ error: 'Pedido já finalizado' });
    }

    const proximoStatus = STATUS_PROGRESSAO[pedido.status];
    if (!proximoStatus) {
      return res.status(400).json({ error: 'Não é possível avançar este status' });
    }

    const atualizado = await prisma.pedido.update({
      where: { id: req.params.id },
      data: {
        status: proximoStatus as any,
        historico: { create: { status: proximoStatus as any } },
      },
      include: {
        itens: true,
        historico: { orderBy: { criadoEm: 'asc' } },
      },
    });

    res.json({ pedido: atualizado });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao atualizar status' });
  }
});

// GET /lojista/lojas/:id/dashboard - Métricas de vendas
router.get('/lojas/:id/dashboard', authMiddleware, authLojista, async (req: AuthRequest, res) => {
  try {
    const loja = await verificarDonoLoja(req.params.id, req.user!.id);
    if (!loja) return res.status(403).json({ error: 'Acesso negado' });

    const agora = new Date();
    const inicioDia = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate());
    const inicioMes = new Date(agora.getFullYear(), agora.getMonth(), 1);

    const [
      totalPedidosHoje,
      totalPedidosMes,
      faturamentoHoje,
      faturamentoMes,
      pedidosPorStatus,
      totalProdutosAtivos,
      produtosMaisVendidos,
    ] = await Promise.all([
      prisma.pedido.count({
        where: { lojaId: loja.id, criadoEm: { gte: inicioDia }, status: { not: 'cancelado' } },
      }),
      prisma.pedido.count({
        where: { lojaId: loja.id, criadoEm: { gte: inicioMes }, status: { not: 'cancelado' } },
      }),
      prisma.pedido.aggregate({
        where: { lojaId: loja.id, criadoEm: { gte: inicioDia }, status: { not: 'cancelado' } },
        _sum: { total: true },
      }),
      prisma.pedido.aggregate({
        where: { lojaId: loja.id, criadoEm: { gte: inicioMes }, status: { not: 'cancelado' } },
        _sum: { total: true },
      }),
      prisma.pedido.groupBy({
        by: ['status'],
        where: { lojaId: loja.id },
        _count: { id: true },
      }),
      prisma.produto.count({ where: { lojaId: loja.id, disponivel: true } }),
      prisma.itemPedido.groupBy({
        by: ['produtoId', 'nomeSnapshot'],
        where: { pedido: { lojaId: loja.id, status: { not: 'cancelado' } } },
        _sum: { quantidade: true },
        orderBy: { _sum: { quantidade: 'desc' } },
        take: 5,
      }),
    ]);

    res.json({
      hoje: {
        pedidos: totalPedidosHoje,
        faturamento: Number(faturamentoHoje._sum.total ?? 0),
      },
      mes: {
        pedidos: totalPedidosMes,
        faturamento: Number(faturamentoMes._sum.total ?? 0),
      },
      pedidosPorStatus: pedidosPorStatus.reduce(
        (acc, item) => ({ ...acc, [item.status]: item._count.id }),
        {} as Record<string, number>,
      ),
      totalProdutosAtivos,
      produtosMaisVendidos: produtosMaisVendidos.map(p => ({
        produtoId: p.produtoId,
        nome: p.nomeSnapshot,
        totalVendido: p._sum.quantidade ?? 0,
      })),
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar dashboard' });
  }
});

const lojaUpdateSchema = z.object({
  nome: z.string().min(2).optional(),
  descricao: z.string().optional(),
  categoria: z.string().optional(),
  telefone: z.string().optional(),
  aceitaAgendamento: z.boolean().optional(),
  antecedenciaMinima: z.number().int().nonnegative().optional(),
  endereco: z.object({
    rua: z.string(),
    numero: z.string().optional().default(''),
    bairro: z.string(),
    cep: z.string(),
    cidade: z.string(),
    complemento: z.string().optional(),
  }).optional(),
});

// GET /lojista/lojas/:id - Detalhes da loja (incluindo campos privados)
router.get('/lojas/:id', authMiddleware, authLojista, async (req: AuthRequest, res) => {
  try {
    const loja = await verificarDonoLoja(req.params.id, req.user!.id);
    if (!loja) return res.status(403).json({ error: 'Acesso negado' });

    const lojaDetalhes = await prisma.loja.findUnique({
      where: { id: req.params.id },
      include: {
        endereco: true,
        horarios: { orderBy: { diaSemana: 'asc' } },
      },
    });

    res.json({ loja: lojaDetalhes });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar loja' });
  }
});

// PATCH /lojista/lojas/:id - Atualizar dados da loja
router.patch('/lojas/:id', authMiddleware, authLojista, async (req: AuthRequest, res) => {
  try {
    const loja = await verificarDonoLoja(req.params.id, req.user!.id);
    if (!loja) return res.status(403).json({ error: 'Acesso negado' });

    const { endereco, ...dadosSemEndereco } = lojaUpdateSchema.parse(req.body);

    const lojaAtualizada = await prisma.loja.update({
      where: { id: req.params.id },
      data: {
        ...dadosSemEndereco,
        ...(endereco && {
          endereco: {
            upsert: {
              create: endereco,
              update: endereco,
            },
          },
        }),
      },
      include: { endereco: true },
    });

    res.json({ loja: lojaAtualizada });
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: error.errors });
    res.status(500).json({ error: 'Erro ao atualizar loja' });
  }
});

const produtoSchema = z.object({
  lojaId: z.string().uuid(),
  nome: z.string().min(2),
  descricao: z.string(),
  preco: z.number().positive(),
  estoque: z.number().int().nonnegative(),
  imagemUrl: z.string().optional().default(''),
  categoria: z.string(),
  tags: z.array(z.string()).default([]),
  destaque: z.boolean().default(false),
});

const produtoFormSchema = z.object({
  lojaId: z.string().uuid(),
  nome: z.string().min(2),
  descricao: z.string(),
  preco: z.string().transform(v => parseFloat(v)).pipe(z.number().positive()),
  estoque: z.string().transform(v => parseInt(v, 10)).pipe(z.number().int().nonnegative()),
  categoria: z.string(),
  tags: z.string().optional().transform(v => {
    try { return JSON.parse(v ?? '[]'); } catch { return []; }
  }).pipe(z.array(z.string())),
});

// GET /lojista/produtos - Listar produtos da loja
router.get('/produtos', authMiddleware, authLojista, async (req: AuthRequest, res) => {
  try {
    const { lojaId } = req.query;
    if (!lojaId) return res.status(400).json({ error: 'lojaId é obrigatório' });

    const loja = await verificarDonoLoja(lojaId as string, req.user!.id);
    if (!loja) return res.status(403).json({ error: 'Acesso negado' });

    const produtos = await prisma.produto.findMany({
      where: { lojaId: loja.id },
      include: { variacoes: true },
      orderBy: [{ destaque: 'desc' }, { nome: 'asc' }],
    });

    res.json({ produtos });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar produtos' });
  }
});

// POST /lojista/produtos/analisar - Analisar imagem com GPT-4o Vision
router.post('/produtos/analisar', authMiddleware, authLojista, uploadImagem.single('imagem'), async (req: AuthRequest, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Imagem ausente' });

    const base64 = req.file.buffer.toString('base64');
    const mimeType = req.file.mimetype || 'image/jpeg';

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      max_tokens: 500,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: { url: `data:${mimeType};base64,${base64}`, detail: 'low' },
            },
            {
              type: 'text',
              text: `Analise esta imagem de produto para um marketplace local de Aracaju, Sergipe.
Responda APENAS com JSON válido, sem markdown.

Formato obrigatório:
{
  "nome": "nome comercial do produto (máx 60 caracteres)",
  "categoria": "uma de: Alimentos, Bebidas, Roupas, Calçados, Eletrônicos, Farmácia, Mercado, Outros",
  "descricao": "descrição atraente em 1-2 frases (máx 150 caracteres)",
  "tags": ["tag1", "tag2", "tag3"],
  "preco": "preço sugerido em reais como string com vírgula, ex: 49,90",
  "estoque": "quantidade inicial sugerida como string, ex: 10"
}`,
            },
          ],
        },
      ],
    });

    const raw = completion.choices[0]?.message?.content ?? '{}';
    res.json(JSON.parse(raw));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao analisar imagem' });
  }
});

// POST /lojista/produtos - Criar produto (multipart: imagem + dados)
router.post('/produtos', authMiddleware, authLojista, uploadImagem.single('imagem'), async (req: AuthRequest, res) => {
  try {
    const dados = produtoFormSchema.parse(req.body);

    const loja = await verificarDonoLoja(dados.lojaId, req.user!.id);
    if (!loja) return res.status(403).json({ error: 'Acesso negado a esta loja' });

    let imagemUrl = '';
    if (req.file) {
      try {
        imagemUrl = await uploadImagemProduto(req.file.buffer, req.file.mimetype);
      } catch {
        // Continua sem imagem se o upload falhar
      }
    }

    const produto = await prisma.produto.create({
      data: { ...dados, imagemUrl },
    });

    res.status(201).json({ produto });
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: error.errors });
    res.status(500).json({ error: 'Erro ao criar produto' });
  }
});

// PUT /lojista/produtos/:id - Editar produto
router.put('/produtos/:id', authMiddleware, authLojista, async (req: AuthRequest, res) => {
  try {
    const produto = await prisma.produto.findUnique({
      where: { id: req.params.id },
      include: { loja: true },
    });

    if (!produto || produto.loja.lojistaId !== req.user!.id) {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    const dados = produtoSchema.partial().omit({ lojaId: true }).parse(req.body);

    const atualizado = await prisma.produto.update({
      where: { id: req.params.id },
      data: dados,
    });

    res.json({ produto: atualizado });
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: error.errors });
    res.status(500).json({ error: 'Erro ao atualizar produto' });
  }
});

// DELETE /lojista/produtos/:id - Remover produto
router.delete('/produtos/:id', authMiddleware, authLojista, async (req: AuthRequest, res) => {
  try {
    const produto = await prisma.produto.findUnique({
      where: { id: req.params.id },
      include: { loja: true },
    });

    if (!produto || produto.loja.lojistaId !== req.user!.id) {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    await prisma.produto.delete({ where: { id: req.params.id } });

    res.json({ message: 'Produto removido com sucesso' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao remover produto' });
  }
});

export default router;
