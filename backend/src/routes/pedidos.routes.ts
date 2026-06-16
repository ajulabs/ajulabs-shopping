import { Router } from 'express';
import { z } from 'zod';
import { authMiddleware, authUsuario, AuthRequest } from '../middleware/auth';
import { prisma } from '../utils/prisma';
import { getEntregadorLocalizacao, emitPedidoNovo, emitPedidoAtualizado } from '../utils/socket';
import { notificarPedidoNovo } from '../lib/pushNotifications';
import { logger } from '../lib/logger';
import { specValidatorMiddleware } from '../lib/spec-validator';
import { restaurarEstoqueNoCancelamento } from '../services/estoque.service';

const router = Router();

const criarPedidoSchema = z.object({
  lojaId: z.string().min(1),
  enderecoEntregaId: z.string().min(1),
  metodoPagamento: z.enum(['pix', 'cartao']),
  obs: z.string().optional(),
  itens: z.array(
    z.object({
      produtoId: z.string().min(1),
      quantidade: z.number().int().positive(),
      variacaoId: z.string().optional(),
    }),
  ),
});

const criarPedidoSpec = {
  name: 'POST_pedidos',
  input: {
    lojaId: { required: true, type: 'string' },
    enderecoEntregaId: { required: true, type: 'string' },
    metodoPagamento: { required: true, type: 'enum', constraints: ["'pix' | 'cartao'"] },
    itens: { required: true, type: 'array' },
    obs: { required: false, type: 'string' },
  },
} as const;

// POST /pedidos - Criar pedido (usuário autenticado)
router.post(
  '/',
  authMiddleware,
  authUsuario,
  specValidatorMiddleware(criarPedidoSpec),
  async (req: AuthRequest, res) => {
    try {
      const dados = criarPedidoSchema.parse(req.body);

      const produtos = await prisma.produto.findMany({
        where: { id: { in: dados.itens.map((i) => i.produtoId) } },
      });

      if (produtos.length !== dados.itens.length) {
        return res.status(400).json({ error: 'Um ou mais produtos não encontrados' });
      }

      const indisponiveis = produtos.filter((p) => !p.disponivel);
      if (indisponiveis.length > 0) {
        return res.status(400).json({
          error: 'Produtos indisponíveis',
          produtos: indisponiveis.map((p) => ({ id: p.id, nome: p.nome })),
        });
      }

      // Fetch variations for items that specify a variacaoId
      const variacaoIds = dados.itens.map((i) => i.variacaoId).filter(Boolean) as string[];
      const variacoes =
        variacaoIds.length > 0
          ? await prisma.variacaoProduto.findMany({ where: { id: { in: variacaoIds } } })
          : [];

      const semEstoque = dados.itens.filter((item) => {
        if (item.variacaoId) {
          const variacao = variacoes.find((v) => v.id === item.variacaoId);
          if (!variacao) return true;
          return variacao.estoque < item.quantidade;
        }
        const produto = produtos.find((p) => p.id === item.produtoId)!;
        return produto.estoque < item.quantidade;
      });
      if (semEstoque.length > 0) {
        return res.status(400).json({
          error: 'Estoque insuficiente',
          produtos: semEstoque.map((item) => {
            const p = produtos.find((pr) => pr.id === item.produtoId)!;
            const v = item.variacaoId ? variacoes.find((vr) => vr.id === item.variacaoId) : null;
            return {
              id: p.id,
              nome: p.nome,
              variacaoNome: v?.nome,
              estoqueDisponivel: v?.estoque ?? p.estoque,
            };
          }),
        });
      }

      const loja = await prisma.loja.findUnique({ where: { id: dados.lojaId } });
      if (!loja) return res.status(404).json({ error: 'Loja não encontrada' });

      const subtotal = dados.itens.reduce((acc, item) => {
        const produto = produtos.find((p) => p.id === item.produtoId)!;
        const variacao = item.variacaoId ? variacoes.find((v) => v.id === item.variacaoId) : null;
        const precoUnit = variacao?.preco != null ? Number(variacao.preco) : Number(produto.preco);
        return acc + precoUnit * item.quantidade;
      }, 0);

      const taxaEntrega = Number(loja.taxaEntrega);
      const desconto = dados.metodoPagamento === 'pix' ? subtotal * 0.05 : 0;
      const total = subtotal + taxaEntrega - desconto;

      const consumidor = await prisma.usuario.findUnique({
        where: { id: req.user!.id },
        select: { telefone: true },
      });
      const digits = (consumidor?.telefone ?? '').replace(/\D/g, '');
      const codigoEntrega =
        digits.length >= 4 ? digits.slice(-4) : String(Math.floor(1000 + Math.random() * 9000));

      const { pedido } = await prisma.$transaction(async (tx) => {
        const pedido = await tx.pedido.create({
          data: {
            consumidorId: req.user!.id,
            lojaId: dados.lojaId,
            enderecoEntregaId: dados.enderecoEntregaId,
            metodoPagamento: dados.metodoPagamento,
            obs: dados.obs,
            codigoEntrega,
            subtotal,
            taxaEntrega,
            desconto,
            total,
            itens: {
              create: dados.itens.map((item) => {
                const produto = produtos.find((p) => p.id === item.produtoId)!;
                const variacao = item.variacaoId
                  ? variacoes.find((v) => v.id === item.variacaoId)
                  : null;
                return {
                  produtoId: produto.id,
                  nomeSnapshot: produto.nome,
                  precoUnitario: variacao?.preco ?? produto.preco,
                  quantidade: item.quantidade,
                  variacaoId: variacao?.id ?? null,
                  variacaoNome: variacao?.nome ?? null,
                };
              }),
            },
            historico: {
              create: { status: 'aguardando' },
            },
          },
          include: { itens: true, loja: true, historico: true },
        });

        await tx.pagamento.create({
          data: {
            pedidoId: pedido.id,
            metodo: dados.metodoPagamento,
            valor: total,
            status: 'pendente',
          },
        });

        for (const item of dados.itens) {
          const produto = produtos.find((p) => p.id === item.produtoId)!;
          let estoqueAntes: number;
          let estoqueDepois: number;

          if (item.variacaoId) {
            // Decremento atômico: só decrementa se houver estoque suficiente.
            // Protege contra corrida (TOCTOU) com pedidos simultâneos.
            const { count } = await tx.variacaoProduto.updateMany({
              where: { id: item.variacaoId, estoque: { gte: item.quantidade } },
              data: { estoque: { decrement: item.quantidade } },
            });
            if (count === 0) {
              throw Object.assign(new Error('Estoque insuficiente'), { statusCode: 409 });
            }
            const todasVars = await tx.variacaoProduto.findMany({
              where: { produtoId: item.produtoId },
              select: { estoque: true },
            });
            estoqueDepois = todasVars.reduce((s, v) => s + v.estoque, 0);
            estoqueAntes = estoqueDepois + item.quantidade;
            await tx.produto.update({
              where: { id: item.produtoId },
              data: {
                estoque: estoqueDepois,
                ...(estoqueDepois <= 0 ? { disponivel: false } : {}),
              },
            });
          } else {
            // Decremento atômico condicional no próprio produto.
            const { count } = await tx.produto.updateMany({
              where: { id: item.produtoId, estoque: { gte: item.quantidade } },
              data: { estoque: { decrement: item.quantidade } },
            });
            if (count === 0) {
              throw Object.assign(new Error('Estoque insuficiente'), { statusCode: 409 });
            }
            const atual = await tx.produto.findUnique({
              where: { id: item.produtoId },
              select: { estoque: true },
            });
            estoqueDepois = atual?.estoque ?? produto.estoque - item.quantidade;
            estoqueAntes = estoqueDepois + item.quantidade;
            if (estoqueDepois <= 0) {
              await tx.produto.update({
                where: { id: item.produtoId },
                data: { disponivel: false },
              });
            }
          }

          const variacaoVenda = item.variacaoId
            ? variacoes.find((v) => v.id === item.variacaoId)
            : null;
          await tx.movimentacaoEstoque.create({
            data: {
              produtoId: item.produtoId,
              lojaId: dados.lojaId,
              tipo: 'venda',
              quantidade: item.quantidade,
              estoqueAntes,
              estoqueDepois,
              pedidoId: pedido.id,
              variacaoId: variacaoVenda?.id ?? null,
              variacaoNome: variacaoVenda?.nome ?? null,
            },
          });
        }

        return { pedido };
      });

      emitPedidoNovo(dados.lojaId, {
        id: pedido.id,
        total: Number(total),
        itens: (pedido.itens ?? []).map((i: { nomeSnapshot: string; quantidade: number }) => ({
          nome: i.nomeSnapshot,
          quantidade: i.quantidade,
        })),
        criadoEm: pedido.criadoEm,
      });
      void notificarPedidoNovo(dados.lojaId, pedido.id, {
        total: Number(total),
        itens: (pedido.itens ?? []).map((i: { nomeSnapshot: string; quantidade: number }) => ({
          nome: i.nomeSnapshot,
          quantidade: i.quantidade,
        })),
      });
      res.status(201).json({ pedido });
    } catch (error) {
      if (error instanceof z.ZodError) return res.status(400).json({ error: error.errors });
      const appErr = error as { statusCode?: number; message?: string };
      if (appErr.statusCode && appErr.statusCode < 500) {
        return res.status(appErr.statusCode).json({ error: appErr.message });
      }
      logger.error({ error }, '[pedidos] erro ao criar pedido');
      res.status(500).json({ error: 'Erro ao criar pedido' });
    }
  },
);

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
        entregador: {
          select: { id: true, nome: true, fotoUrl: true, tipoTransporte: true },
        },
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

// POST /pedidos/:id/cancelar - Cancelar pedido (usuário autenticado)
router.post('/:id/cancelar', authMiddleware, authUsuario, async (req: AuthRequest, res) => {
  try {
    const pedido = await prisma.pedido.findUnique({
      where: { id: req.params.id },
      select: { consumidorId: true, status: true, lojaId: true },
    });

    if (!pedido || pedido.consumidorId !== req.user!.id) {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    if (pedido.status !== 'aguardando') {
      return res.status(400).json({
        error:
          'Cancelamento não permitido. Só é possível cancelar enquanto o pedido aguarda confirmação da loja.',
      });
    }

    const motivo: string | undefined = req.body?.motivo;

    // Cancelamento condicional: o UPDATE só aplica se o status AINDA for
    // 'aguardando'. Evita o TOCTOU em que a loja aceita o pedido entre a leitura
    // acima e a escrita — o que cancelaria um pedido já em preparo e restauraria
    // estoque indevidamente.
    let cancelado = true;
    await prisma.$transaction(async (tx) => {
      const upd = await tx.pedido.updateMany({
        where: { id: req.params.id, status: 'aguardando' },
        data: {
          status: 'cancelado',
          canceladoPor: 'consumidor',
          motivoCancelamento: motivo ?? null,
        },
      });
      if (upd.count === 0) {
        cancelado = false;
        return;
      }
      await tx.historicoStatusPedido.create({
        data: { pedidoId: req.params.id, status: 'cancelado' },
      });
      await restaurarEstoqueNoCancelamento(req.params.id, pedido.lojaId, tx);
    });

    if (!cancelado) {
      return res.status(409).json({
        error: 'O pedido já foi aceito pela loja e não pode mais ser cancelado.',
      });
    }

    // Notifica o lojista (e ecoa para outros dispositivos do consumidor) em tempo real
    emitPedidoAtualizado(pedido.consumidorId, req.params.id, 'cancelado', pedido.lojaId);

    res.json({ ok: true });
  } catch (error) {
    logger.error({ error }, '[pedidos] erro ao cancelar pedido');
    res.status(500).json({ error: 'Erro ao cancelar pedido' });
  }
});

// GET /pedidos/:id/localizacao-entregador - Última posição GPS do entregador
router.get(
  '/:id/localizacao-entregador',
  authMiddleware,
  authUsuario,
  async (req: AuthRequest, res) => {
    try {
      const pedido = await prisma.pedido.findUnique({
        where: { id: req.params.id },
        select: { consumidorId: true },
      });

      if (!pedido || pedido.consumidorId !== req.user!.id) {
        return res.status(403).json({ error: 'Acesso negado' });
      }

      const loc = getEntregadorLocalizacao(req.params.id);
      res.json({ localizacao: loc });
    } catch (error) {
      res.status(500).json({ error: 'Erro ao buscar localização' });
    }
  },
);

export default router;
