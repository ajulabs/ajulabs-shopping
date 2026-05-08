import { Router, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../utils/prisma';
import { authMiddleware, authEntregador, AuthRequest } from '../middleware/auth';

const router = Router();

// Todas as rotas deste arquivo exigem entregador autenticado
router.use(authMiddleware, authEntregador);

// ========================================
// POST /entregador/documentos
// Enviar frente/verso do documento (URLs do Storage)
// ========================================

const documentosSchema = z.object({
  frenteUrl: z.string().url(),
  versoUrl: z.string().url(),
});

router.post('/documentos', async (req: AuthRequest, res: Response) => {
  try {
    const { frenteUrl, versoUrl } = documentosSchema.parse(req.body);
    const entregadorId = req.user!.id;

    const documento = await prisma.documentoEntregador.upsert({
      where: { entregadorId },
      create: {
        entregadorId,
        frenteUrl,
        versoUrl,
        status: 'pendente',
      },
      update: {
        frenteUrl,
        versoUrl,
        status: 'pendente',
        revisadoEm: null,
      },
    });

    res.status(201).json({ documento });
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: error.errors });
    console.error(error);
    res.status(500).json({ error: 'Erro ao enviar documentos' });
  }
});

// ========================================
// POST /entregador/veiculo
// Cadastrar dados do veículo
// ========================================

const veiculoSchema = z.object({
  placa: z.string().min(7).max(8),
  modelo: z.string().min(1),
  cor: z.string().min(1),
  ano: z.number().int().min(1950).max(new Date().getFullYear() + 1),
});

router.post('/veiculo', async (req: AuthRequest, res: Response) => {
  try {
    const dados = veiculoSchema.parse(req.body);
    const entregadorId = req.user!.id;

    const veiculo = await prisma.veiculoEntregador.upsert({
      where: { entregadorId },
      create: { entregadorId, ...dados },
      update: dados,
    });

    res.status(201).json({ veiculo });
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: error.errors });
    console.error(error);
    res.status(500).json({ error: 'Erro ao cadastrar veículo' });
  }
});

// ========================================
// POST /entregador/dados-bancarios
// Cadastrar PIX ou conta bancária
// ========================================

const dadosBancariosSchema = z
  .object({
    tipo: z.enum(['pix', 'conta']),
    chavePix: z.string().optional(),
    banco: z.string().optional(),
    agencia: z.string().optional(),
    conta: z.string().optional(),
  })
  .refine(
    (d) => (d.tipo === 'pix' ? !!d.chavePix : !!d.banco && !!d.agencia && !!d.conta),
    { message: 'Para tipo "pix" envie chavePix; para "conta" envie banco, agencia e conta.' }
  );

router.post('/dados-bancarios', async (req: AuthRequest, res: Response) => {
  try {
    const dados = dadosBancariosSchema.parse(req.body);
    const entregadorId = req.user!.id;

    const payload =
      dados.tipo === 'pix'
        ? { tipo: 'pix' as const, chavePix: dados.chavePix!, banco: null, agencia: null, conta: null }
        : {
            tipo: 'conta' as const,
            chavePix: null,
            banco: dados.banco!,
            agencia: dados.agencia!,
            conta: dados.conta!,
          };

    const dadosBancarios = await prisma.dadosBancariosEntregador.upsert({
      where: { entregadorId },
      create: { entregadorId, ...payload },
      update: payload,
    });

    res.status(201).json({ dadosBancarios });
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: error.errors });
    console.error(error);
    res.status(500).json({ error: 'Erro ao cadastrar dados bancários' });
  }
});

// ========================================
// GET /entregador/perfil
// Ver perfil completo com status do onboarding
// ========================================

router.get('/perfil', async (req: AuthRequest, res: Response) => {
  try {
    const entregadorId = req.user!.id;

    const entregador = await prisma.entregador.findUnique({
      where: { id: entregadorId },
      include: {
        documentos: true,
        veiculo: true,
        dadosBancarios: true,
      },
    });

    if (!entregador) {
      return res.status(404).json({ error: 'Entregador não encontrado' });
    }

    const { senhaHash, ...entregadorSemSenha } = entregador;

    const onboarding = {
      documentosEnviados: !!entregador.documentos,
      documentosAprovados: entregador.documentos?.status === 'aprovado',
      veiculoCadastrado: !!entregador.veiculo,
      dadosBancariosCadastrados: !!entregador.dadosBancarios,
      contaAtiva: entregador.statusConta === 'ativo',
    };

    res.json({ entregador: entregadorSemSenha, onboarding });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao buscar perfil' });
  }
});

// ========================================
// GET /entregador/entregas
// Listar entregas realizadas e ganhos
// ========================================

router.get('/entregas', async (req: AuthRequest, res: Response) => {
  try {
    const entregadorId = req.user!.id;

    const entregas = await prisma.entregaRealizada.findMany({
      where: { entregadorId },
      orderBy: { criadoEm: 'desc' },
      include: {
        pedido: {
          select: {
            id: true,
            status: true,
            total: true,
            criadoEm: true,
            loja: { select: { id: true, nome: true } },
            enderecoEntrega: {
              select: { rua: true, numero: true, bairro: true, cidade: true },
            },
          },
        },
      },
    });

    const totalGanho = entregas.reduce((acc, e) => {
      const valor = Number(e.valorRecebido);
      const bonus = e.bonus ? Number(e.bonus) : 0;
      return acc + valor + bonus;
    }, 0);

    res.json({
      total: entregas.length,
      totalGanho: totalGanho.toFixed(2),
      entregas,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao listar entregas' });
  }
});

export default router;