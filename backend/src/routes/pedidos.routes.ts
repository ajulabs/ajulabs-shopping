import { Router } from 'express';
import { z } from 'zod';
import { authMiddleware, authUsuario, AuthRequest } from '../middleware/auth';
import { prisma } from '../utils/prisma';

const router = Router();

const criarPedidoSchema = z.object({
  lojaId: z.string().min(1),
  enderecoEntregaId: z.string().min(1),
  metodoPagamento: z.enum(['pix', 'cartao']),
  obs: z.string().optional(),
  itens: z.array(z.object({
    produtoId: z.string().min(1),
    quantidade: z.number().int().positive(),
  })),
});

// POST /pedidos - Criar pedido (usuário autenticado)
router.post('/', authMiddleware, authUsuario, async (req: AuthRequest, res) => {
  try {
    const dados = criarPedidoSchema.parse(req.body);

    const produtos = await prisma.produto.findMany({
      where: { id: { in: dados.itens.map(i => i.produtoId) } },
    });

    if (produtos.length !== dados.itens.length) {
      return res.status(400).json({ error: 'Um ou mais produtos não encontrados' });
    }

    const indisponiveis = produtos.filter(p => !p.disponivel);
    if (indisponiveis.length > 0) {
      return res.status(400).json({
        error: 'Produtos indisponíveis',
        produtos: indisponiveis.map(p => ({ id: p.id, nome: p.nome })),
      });
    }

    const loja = await prisma.loja.findUnique({ where: { id: dados.lojaId } });
    if (!loja) return res.status(404).json({ error: 'Loja não encontrada' });

    const subtotal = dados.itens.reduce((acc, item) => {
      const produto = produtos.find(p => p.id === item.produtoId)!;
      return acc + Number(produto.preco) * item.quantidade;
    }, 0);

    const taxaEntrega = Number(loja.taxaEntrega);
    const desconto = dados.metodoPagamento === 'pix' ? subtotal * 0.05 : 0;
    const total = subtotal + taxaEntrega - desconto;

    const pedido = await prisma.pedido.create({
      data: {
        consumidorId: req.user!.id,
        lojaId: dados.lojaId,
        enderecoEntregaId: dados.enderecoEntregaId,
        metodoPagamento: dados.metodoPagamento,
        obs: dados.obs,
        subtotal,
        taxaEntrega,
        desconto,
        total,
        itens: {
          create: dados.itens.map(item => {
            const produto = produtos.find(p => p.id === item.produtoId)!;
            return {
              produtoId: produto.id,
              nomeSnapshot: produto.nome,
              precoUnitario: produto.preco,
              quantidade: item.quantidade,
            };
          }),
        },
        historico: {
          create: { status: 'aguardando' },
        },
      },
      include: { itens: true, loja: true, historico: true },
    });

    await prisma.pagamento.create({
      data: {
        pedidoId: pedido.id,
        metodo: dados.metodoPagamento,
        valor: total,
        status: 'pendente',
      },
    });

    res.status(201).json({ pedido });
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: error.errors });
    console.error(error);
    res.status(500).json({ error: 'Erro ao criar pedido' });
  }
});

// GET /pedidos - Listar pedidos do usuário
router.get('/', authMiddleware, authUsuario, async (req: AuthRequest, res) => {
  try {
    const pedidos = await prisma.pedido.findMany({
      where: { consumidorId: req.user!.id },
      include: {
        loja: true,
        itens: true,
        historico: { orderBy: { criadoEm: 'asc' } },
      },
      orderBy: { criadoEm: 'desc' },
    });

    res.json({ pedidos });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar pedidos' });
  }
});

// GET /pedidos/:id - Detalhes do pedido
router.get('/:id', authMiddleware, authUsuario, async (req: AuthRequest, res) => {
  try {
    const pedido = await prisma.pedido.findUnique({
      where: { id: req.params.id },
      include: {
        loja: true,
        itens: { include: { produto: true } },
        historico: { orderBy: { criadoEm: 'asc' } },
        enderecoEntrega: true,
      },
    });

    if (!pedido) return res.status(404).json({ error: 'Pedido não encontrado' });

    if (pedido.consumidorId !== req.user!.id) {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    res.json({ pedido });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar pedido' });
  }
});

// POST /pedidos/:id/rastrear - Rastreamento em tempo real
router.post('/:id/rastrear', authMiddleware, authUsuario, async (req: AuthRequest, res) => {
  try {
    const pedido = await prisma.pedido.findUnique({
      where: { id: req.params.id },
      include: {
        loja: {
          select: {
            nome: true,
            telefone: true,
            logoUrl: true,
            endereco: true,
          },
        },
        entregador: {
          select: {
            id: true,
            nome: true,
            telefone: true,
            fotoUrl: true,
            tipoTransporte: true,
          },
        },
        enderecoEntrega: true,
        historico: { orderBy: { criadoEm: 'asc' } },
      },
    });

    if (!pedido) return res.status(404).json({ error: 'Pedido não encontrado' });

    if (pedido.consumidorId !== req.user!.id) {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    res.json({
      rastreamento: {
        pedidoId: pedido.id,
        status: pedido.status,
        estimativaEntrega: pedido.estimativaEntrega,
        historico: pedido.historico,
        loja: pedido.loja,
        entregador: pedido.entregador ?? null,
        enderecoEntrega: pedido.enderecoEntrega,
      },
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar rastreamento' });
  }
});

export default router;
