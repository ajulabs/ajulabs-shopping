import { Router, Response } from 'express';
import { z } from 'zod';
import multer from 'multer';
import { prisma } from '../utils/prisma';
import { authMiddleware, authEntregador, AuthRequest } from '../middleware/auth';
import { getIo } from '../utils/socket';
import { uploadImagemEntregador, uploadDocumentoTrocaVeiculo } from '../utils/supabase';
import { hashSenha, compararSenha } from '../utils/bcrypt';

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

const router = Router();

router.use(authMiddleware, authEntregador);

// ========================================
// POST /entregador/documentos/upload  (multipart — frente + verso)
// ========================================

const uploadDocs = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
}).fields([
  { name: 'frente', maxCount: 1 },
  { name: 'verso',  maxCount: 1 },
]);

router.post('/documentos/upload', uploadDocs, async (req: AuthRequest, res: Response) => {
  try {
    const files = req.files as Record<string, Express.Multer.File[]> | undefined;
    if (!files?.frente?.[0]) return res.status(400).json({ error: 'Frente do documento obrigatória' });
    if (!files?.verso?.[0])  return res.status(400).json({ error: 'Verso do documento obrigatório' });

    const entregadorId = req.user!.id;

    const [frenteUrl, versoUrl] = await Promise.all([
      uploadImagemEntregador(files.frente[0].buffer, files.frente[0].mimetype),
      uploadImagemEntregador(files.verso[0].buffer, files.verso[0].mimetype),
    ]);

    const documento = await prisma.documentoEntregador.upsert({
      where: { entregadorId },
      create: { entregadorId, frenteUrl, versoUrl, status: 'pendente' },
      update: { frenteUrl, versoUrl, status: 'pendente', revisadoEm: null },
    });

    res.status(201).json({ documento });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao enviar documentos' });
  }
});

// ========================================
// POST /entregador/veiculo
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
// ========================================

router.get('/perfil', async (req: AuthRequest, res: Response) => {
  try {
    const entregadorId = req.user!.id;

    const [entregador, ultimaTroca] = await Promise.all([
      prisma.entregador.findUnique({
        where: { id: entregadorId },
        include: { documentos: true, veiculo: true, dadosBancarios: true },
      }),
      prisma.solicitacaoTrocaVeiculo.findFirst({
        where: { entregadorId },
        orderBy: { criadoEm: 'desc' },
        select: { cnhUrl: true, docVeiculoUrl: true, status: true, criadoEm: true },
      }),
    ]);

    if (!entregador) return res.status(404).json({ error: 'Entregador não encontrado' });

    const { senhaHash, ...entregadorSemSenha } = entregador;

    const onboarding = {
      documentosEnviados: !!entregador.documentos,
      documentosAprovados: entregador.documentos?.status === 'aprovado',
      veiculoCadastrado: !!entregador.veiculo,
      dadosBancariosCadastrados: !!entregador.dadosBancarios,
      contaAtiva: entregador.statusConta === 'ativo',
    };

    res.json({ entregador: entregadorSemSenha, onboarding, docVeiculo: ultimaTroca ?? null });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao buscar perfil' });
  }
});

// ========================================
// PATCH /entregador/foto
// ========================================

router.patch('/foto', upload.single('foto'), async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Arquivo de imagem ausente' });

    const fotoUrl = await uploadImagemEntregador(req.file.buffer, req.file.mimetype);

    await prisma.entregador.update({
      where: { id: req.user!.id },
      data: { fotoUrl },
    });

    res.json({ fotoUrl });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao atualizar foto' });
  }
});

// ========================================
// GET /entregador/entregas
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
      return acc + Number(e.valorRecebido) + (e.bonus ? Number(e.bonus) : 0);
    }, 0);

    res.json({ total: entregas.length, totalGanho: totalGanho.toFixed(2), entregas });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao listar entregas' });
  }
});

// ========================================
// PATCH /entregador/status
// Toggle online/offline
// ========================================

router.patch('/status', async (req: AuthRequest, res: Response) => {
  try {
    const { online } = z.object({ online: z.boolean() }).parse(req.body);
    const entregadorId = req.user!.id;

    const entregador = await prisma.entregador.update({
      where: { id: entregadorId },
      data: { online },
      select: { id: true, online: true, statusConta: true },
    });

    res.json({ online: entregador.online });
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: error.errors });
    console.error(error);
    res.status(500).json({ error: 'Erro ao atualizar status' });
  }
});

// ========================================
// GET /entregador/corridas/disponivel
// Pedidos confirmados sem entregador, para entregador online
// ========================================

router.get('/corridas/disponivel', async (req: AuthRequest, res: Response) => {
  try {
    const entregadorId = req.user!.id;

    const entregador = await prisma.entregador.findUnique({
      where: { id: entregadorId },
      select: { online: true },
    });

    if (!entregador?.online) {
      return res.json({ corridas: [] });
    }

    const corridas = await prisma.pedido.findMany({
      where: { status: 'pronto', entregadorId: null },
      include: {
        loja: {
          select: {
            id: true,
            nome: true,
            endereco: { select: { rua: true, numero: true, bairro: true, cidade: true } },
          },
        },
        enderecoEntrega: { select: { rua: true, numero: true, bairro: true, cidade: true } },
        itens: {
          select: {
            quantidade: true,
            nomeSnapshot: true,
            precoUnitario: true,
          },
        },
      },
      orderBy: { criadoEm: 'asc' },
    });

    res.json({ corridas });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao buscar corridas' });
  }
});

// ========================================
// POST /entregador/corridas/:pedidoId/aceitar
// ========================================

router.post('/corridas/:pedidoId/aceitar', async (req: AuthRequest, res: Response) => {
  try {
    const { pedidoId } = req.params;
    const entregadorId = req.user!.id;

    const pedido = await prisma.pedido.findFirst({
      where: { id: pedidoId, status: 'pronto', entregadorId: null },
    });

    if (!pedido) {
      return res.status(409).json({ error: 'Corrida não está mais disponível' });
    }

    const pedidoAtualizado = await prisma.pedido.update({
      where: { id: pedidoId },
      data: { entregadorId },
      include: {
        loja: { select: { id: true, nome: true, telefone: true } },
        enderecoEntrega: true,
        itens: { select: { quantidade: true, nomeSnapshot: true, precoUnitario: true } },
      },
    });

    try {
      const io = getIo();
      io.to('entregadores').emit('corrida:aceita', { pedidoId, entregadorId });
    } catch {}

    res.json({ pedido: pedidoAtualizado });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao aceitar corrida' });
  }
});

// ========================================
// POST /entregador/corridas/:pedidoId/rejeitar
// ========================================

router.post('/corridas/:pedidoId/rejeitar', async (_req: AuthRequest, res: Response) => {
  res.json({ ok: true });
});

// ========================================
// PATCH /entregador/corridas/:pedidoId/status
// Transições: preparando → saiu_entrega → entregue
// ========================================

const TRANSICOES_VALIDAS: Record<string, string> = {
  saiu_entrega: 'entregue',
};

// ========================================
// POST /entregador/corridas/:pedidoId/confirmar-retirada
// Entregador tira foto do produto e confirma retirada (pronto → saiu_entrega)
// ========================================

router.post('/corridas/:pedidoId/confirmar-retirada', async (req: AuthRequest, res: Response) => {
  try {
    const { pedidoId } = req.params;
    const entregadorId = req.user!.id;

    const pedido = await prisma.pedido.findFirst({
      where: { id: pedidoId, entregadorId, status: 'pronto' },
    });

    if (!pedido) {
      return res.status(404).json({ error: 'Pedido não encontrado ou status inválido' });
    }

    await prisma.pedido.update({
      where: { id: pedidoId },
      data: { status: 'saiu_entrega' },
    });

    await prisma.historicoStatusPedido.create({
      data: { pedidoId, status: 'saiu_entrega' },
    });

    try {
      const io = getIo();
      io.to(`usuario:${pedido.consumidorId}`).emit('pedido:status', { pedidoId, status: 'saiu_entrega' });
    } catch {}

    res.json({ ok: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao confirmar retirada' });
  }
});

// ========================================
// POST /entregador/corridas/:pedidoId/confirmar-entrega
// Consumer diz o código → entregador digita → saiu_entrega → entregue
// ========================================

router.post('/corridas/:pedidoId/confirmar-entrega', async (req: AuthRequest, res: Response) => {
  try {
    const { pedidoId } = req.params;
    const entregadorId = req.user!.id;
    const { codigo } = z.object({ codigo: z.string().min(1) }).parse(req.body);

    const pedido = await prisma.pedido.findFirst({
      where: { id: pedidoId, entregadorId, status: 'saiu_entrega' },
    });

    if (!pedido) {
      return res.status(404).json({ error: 'Pedido não encontrado ou status inválido' });
    }

    if (pedido.codigoEntrega !== codigo) {
      return res.status(400).json({ error: 'Código incorreto' });
    }

    await prisma.pedido.update({
      where: { id: pedidoId },
      data: { status: 'entregue' },
    });

    await prisma.historicoStatusPedido.create({
      data: { pedidoId, status: 'entregue' },
    });

    await prisma.entregaRealizada.upsert({
      where: { pedidoId },
      create: { entregadorId, pedidoId, valorRecebido: Number(pedido.taxaEntrega) * 0.8 },
      update: { valorRecebido: Number(pedido.taxaEntrega) * 0.8 },
    });

    try {
      const io = getIo();
      io.to(`usuario:${pedido.consumidorId}`).emit('pedido:status', { pedidoId, status: 'entregue' });
    } catch {}

    res.json({ ok: true });
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: error.errors });
    console.error(error);
    res.status(500).json({ error: 'Erro ao confirmar entrega' });
  }
});

router.patch('/corridas/:pedidoId/status', async (req: AuthRequest, res: Response) => {
  try {
    const { pedidoId } = req.params;
    const entregadorId = req.user!.id;
    const { status } = z
      .object({ status: z.enum(['saiu_entrega', 'entregue']) })
      .parse(req.body);

    const pedido = await prisma.pedido.findFirst({
      where: { id: pedidoId, entregadorId },
    });

    if (!pedido) {
      return res.status(404).json({ error: 'Corrida não encontrada' });
    }

    const proximoStatus = TRANSICOES_VALIDAS[pedido.status];
    if (proximoStatus !== status) {
      return res.status(400).json({
        error: `Transição inválida: ${pedido.status} → ${status}. Esperado: ${proximoStatus ?? 'nenhum'}`,
      });
    }

    const pedidoAtualizado = await prisma.pedido.update({
      where: { id: pedidoId },
      data: { status },
      select: { id: true, status: true, consumidorId: true },
    });

    await prisma.historicoStatusPedido.create({
      data: { pedidoId, status: status as any },
    });

    if (status === 'entregue') {
      const valorRecebido = Number(pedido.taxaEntrega) * 0.8;
      await prisma.entregaRealizada.upsert({
        where: { pedidoId },
        create: { entregadorId, pedidoId, valorRecebido },
        update: { valorRecebido },
      });
    }

    try {
      const io = getIo();
      io.to(`usuario:${pedidoAtualizado.consumidorId}`).emit('pedido:status', {
        pedidoId,
        status,
      });
    } catch {}

    res.json({ status: pedidoAtualizado.status });
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: error.errors });
    console.error(error);
    res.status(500).json({ error: 'Erro ao atualizar status da corrida' });
  }
});

// ========================================
// GET /entregador/ganhos
// Resumo de ganhos: semana, mês, total
// ========================================

router.get('/ganhos', async (req: AuthRequest, res: Response) => {
  try {
    const entregadorId = req.user!.id;

    const agora = new Date();
    const inicioSemana = new Date(agora);
    inicioSemana.setDate(agora.getDate() - agora.getDay());
    inicioSemana.setHours(0, 0, 0, 0);

    const inicioMes = new Date(agora.getFullYear(), agora.getMonth(), 1);

    const [semana, mes, allTime, emAndamento] = await Promise.all([
      prisma.entregaRealizada.aggregate({
        where: { entregadorId, criadoEm: { gte: inicioSemana } },
        _sum: { valorRecebido: true, bonus: true },
        _count: true,
      }),
      prisma.entregaRealizada.aggregate({
        where: { entregadorId, criadoEm: { gte: inicioMes } },
        _sum: { valorRecebido: true, bonus: true },
        _count: true,
      }),
      prisma.entregaRealizada.aggregate({
        where: { entregadorId },
        _sum: { valorRecebido: true, bonus: true },
        _count: true,
      }),
      prisma.pedido.count({
        where: { entregadorId, status: { in: ['pronto', 'saiu_entrega'] } },
      }),
    ]);

    const calcTotal = (agg: typeof allTime) =>
      (Number(agg._sum.valorRecebido ?? 0) + Number(agg._sum.bonus ?? 0)).toFixed(2);

    res.json({
      semana: { total: calcTotal(semana), corridas: semana._count },
      mes: { total: calcTotal(mes), corridas: mes._count },
      allTime: { total: calcTotal(allTime), corridas: allTime._count },
      emAndamento,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao buscar ganhos' });
  }
});

// ========================================
// POST /entregador/saque
// Solicitar saque via PIX
// ========================================

router.post('/saque', async (req: AuthRequest, res: Response) => {
  try {
    const entregadorId = req.user!.id;
    const { valor } = z.object({ valor: z.number().min(10) }).parse(req.body);

    const [ganhos, saques, entregador] = await Promise.all([
      prisma.entregaRealizada.aggregate({
        where: { entregadorId },
        _sum: { valorRecebido: true, bonus: true },
      }),
      prisma.solicitacaoSaque.aggregate({
        where: { entregadorId, status: { not: 'falhou' } },
        _sum: { valor: true },
      }),
      prisma.entregador.findUnique({
        where: { id: entregadorId },
        include: { dadosBancarios: true },
      }),
    ]);

    const totalGanho =
      Number(ganhos._sum.valorRecebido ?? 0) + Number(ganhos._sum.bonus ?? 0);
    const totalSacado = Number(saques._sum.valor ?? 0);
    const saldo = totalGanho - totalSacado;

    if (valor > saldo) {
      return res.status(400).json({
        error: `Saldo insuficiente. Disponível: R$ ${saldo.toFixed(2)}`,
      });
    }

    if (!entregador?.dadosBancarios?.chavePix) {
      return res.status(400).json({
        error: 'Cadastre uma chave PIX antes de solicitar saque',
      });
    }

    const saque = await prisma.solicitacaoSaque.create({
      data: {
        entregadorId,
        valor,
        chavePix: entregador.dadosBancarios.chavePix,
        status: 'solicitado',
      },
    });

    res.status(201).json({ saque, saldoRestante: (saldo - valor).toFixed(2) });
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: error.errors });
    console.error(error);
    res.status(500).json({ error: 'Erro ao solicitar saque' });
  }
});

// ========================================
// GET /entregador/saques
// Histórico de saques solicitados
// ========================================

router.get('/saques', async (req: AuthRequest, res: Response) => {
  try {
    const entregadorId = req.user!.id;

    const saques = await prisma.solicitacaoSaque.findMany({
      where: { entregadorId },
      orderBy: { criadoEm: 'desc' },
    });

    res.json({ saques });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao listar saques' });
  }
});

// ========================================
// PATCH /entregador/dados-pessoais
// ========================================

router.patch('/dados-pessoais', async (req: AuthRequest, res: Response) => {
  try {
    const schema = z.object({
      nome:     z.string().min(2).optional(),
      email:    z.string().email().optional(),
      telefone: z.string().min(10).optional(),
    });
    const dados = schema.parse(req.body);
    const entregador = await prisma.entregador.update({
      where: { id: req.user!.id },
      data: dados,
      select: { id: true, nome: true, email: true, telefone: true },
    });
    res.json({ entregador });
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: error.errors });
    res.status(500).json({ error: 'Erro ao atualizar dados pessoais' });
  }
});

// ========================================
// PATCH /entregador/senha
// ========================================

router.patch('/senha', async (req: AuthRequest, res: Response) => {
  try {
    const schema = z.object({
      senhaAtual: z.string().min(1),
      novaSenha:  z.string().min(6),
    });
    const { senhaAtual, novaSenha } = schema.parse(req.body);
    const entregador = await prisma.entregador.findUnique({ where: { id: req.user!.id } });
    if (!entregador) return res.status(404).json({ error: 'Entregador não encontrado' });
    const ok = await compararSenha(senhaAtual, entregador.senhaHash);
    if (!ok) return res.status(400).json({ error: 'Senha atual incorreta' });
    const hash = await hashSenha(novaSenha);
    await prisma.entregador.update({ where: { id: req.user!.id }, data: { senhaHash: hash } });
    res.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: error.errors });
    res.status(500).json({ error: 'Erro ao alterar senha' });
  }
});

// ========================================
// GET /entregador/veiculo/trocar
// Retorna a última solicitação de troca pendente
// ========================================

router.get('/veiculo/trocar', async (req: AuthRequest, res: Response) => {
  try {
    const entregadorId = req.user!.id;
    const solicitacao = await prisma.solicitacaoTrocaVeiculo.findFirst({
      where: { entregadorId, status: 'pendente' },
      orderBy: { criadoEm: 'desc' },
    });
    res.json({ solicitacao });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao buscar solicitação' });
  }
});

// ========================================
// POST /entregador/veiculo/trocar
// Envia solicitação de troca de veículo
// Moto/Carro: requer cnh + docVeiculo (arquivos)
// Bike: aprovação imediata
// ========================================

const uploadTroca = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
}).fields([
  { name: 'cnh', maxCount: 1 },
  { name: 'docVeiculo', maxCount: 1 },
]);

const trocaVeiculoSchema = z.object({
  tipoTransporte: z.enum(['bike', 'moto', 'carro']),
  modelo: z.string().min(1),
  placa: z.string().min(1),
  cor: z.string().min(1),
  ano: z.string().regex(/^\d{4}$/),
});

router.post('/veiculo/trocar', uploadTroca, async (req: AuthRequest, res: Response) => {
  try {
    const entregadorId = req.user!.id;
    const dados = trocaVeiculoSchema.parse(req.body);
    const files = req.files as Record<string, Express.Multer.File[]> | undefined;

    const isBike = dados.tipoTransporte === 'bike';

    let cnhUrl: string | undefined;
    let docVeiculoUrl: string | undefined;

    if (!isBike) {
      if (!files?.cnh?.[0]) return res.status(400).json({ error: 'Foto da CNH obrigatória para moto/carro' });
      if (!files?.docVeiculo?.[0]) return res.status(400).json({ error: 'Documento do veículo obrigatório para moto/carro' });
      cnhUrl = await uploadDocumentoTrocaVeiculo(files.cnh[0].buffer, files.cnh[0].mimetype);
      docVeiculoUrl = await uploadDocumentoTrocaVeiculo(files.docVeiculo[0].buffer, files.docVeiculo[0].mimetype);
    }

    if (isBike) {
      // Bicicleta: aprova imediatamente e atualiza veículo + tipoTransporte
      await prisma.veiculoEntregador.upsert({
        where: { entregadorId },
        create: {
          entregadorId,
          placa: 'BICICLETA',
          modelo: 'Bicicleta',
          cor: dados.cor,
          ano: parseInt(dados.ano),
        },
        update: {
          placa: 'BICICLETA',
          modelo: 'Bicicleta',
          cor: dados.cor,
          ano: parseInt(dados.ano),
        },
      });
      await prisma.entregador.update({
        where: { id: entregadorId },
        data: { tipoTransporte: 'bike' },
      });
      return res.json({ status: 'aprovado', message: 'Veículo atualizado para bicicleta' });
    }

    // Moto/Carro: cria solicitação pendente
    const solicitacao = await prisma.solicitacaoTrocaVeiculo.create({
      data: {
        entregadorId,
        tipoTransporte: dados.tipoTransporte as any,
        modelo: dados.modelo,
        placa: dados.placa.toUpperCase(),
        cor: dados.cor,
        ano: parseInt(dados.ano),
        cnhUrl,
        docVeiculoUrl,
        status: 'pendente',
      },
    });

    res.status(201).json({ status: 'pendente', solicitacao });
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: error.errors });
    console.error(error);
    res.status(500).json({ error: 'Erro ao enviar solicitação de troca de veículo' });
  }
});

export default router;
