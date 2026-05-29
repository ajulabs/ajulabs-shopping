import { Router } from 'express';
import { z } from 'zod';
import { PapelColaborador as PrismaRole, StatusSolicitacaoPreco } from '@prisma/client';
import {
  authMiddleware,
  authLojistaOrColaborador,
  requirePapel,
  AuthRequest,
} from '../middleware/auth';
import { prisma } from '../utils/prisma';
import {
  criarColaborador,
  listarColaboradores,
  atualizarColaborador,
  criarSolicitacaoPreco,
  listarSolicitacoes,
  contarPendentes,
  aprovarSolicitacao,
  rejeitarSolicitacao,
  registrarAudit,
  listarAuditLogs,
} from '../services/rbac.service';

const router = Router();

router.use(authMiddleware, authLojistaOrColaborador);

function resolveLojaId(req: AuthRequest): string | null {
  if (req.user?.tipo === 'colaborador') return req.user.lojaId ?? null;
  return (req.query.lojaId as string) || (req.body?.lojaId as string) || null;
}

async function checkAcessoLoja(lojaId: string, req: AuthRequest): Promise<boolean> {
  if (req.user?.tipo === 'colaborador') return req.user.lojaId === lojaId;
  const loja = await prisma.loja.findFirst({ where: { id: lojaId, lojistaId: req.user!.id } });
  return !!loja;
}

async function getActorInfo(req: AuthRequest) {
  if (req.user!.tipo === 'lojista') {
    const lojista = await prisma.lojista.findUnique({
      where: { id: req.user!.id },
      select: { nomeResponsavel: true },
    });
    return {
      actorId: req.user!.id,
      actorTipo: 'lojista',
      actorNome: lojista?.nomeResponsavel ?? 'Lojista',
      actorPapel: 'admin',
    };
  }
  const colab = await prisma.colaborador.findUnique({
    where: { id: req.user!.id },
    select: { nome: true, papel: true },
  });
  return {
    actorId: req.user!.id,
    actorTipo: 'colaborador',
    actorNome: colab?.nome ?? 'Colaborador',
    actorPapel: colab?.papel ?? req.user!.papel ?? 'funcionario',
  };
}

// ── Colaboradores ─────────────────────────────────────────────

router.get('/colaboradores', requirePapel('admin'), async (req: AuthRequest, res) => {
  const lojaId = resolveLojaId(req);
  if (!lojaId) return res.status(400).json({ error: 'lojaId obrigatório' });
  if (!(await checkAcessoLoja(lojaId, req)))
    return res.status(403).json({ error: 'Acesso negado' });

  const lista = await listarColaboradores(lojaId);
  res.json({ colaboradores: lista });
});

router.post('/colaboradores', requirePapel('admin'), async (req: AuthRequest, res) => {
  const lojaId = resolveLojaId(req);
  if (!lojaId) return res.status(400).json({ error: 'lojaId obrigatório' });
  if (!(await checkAcessoLoja(lojaId, req)))
    return res.status(403).json({ error: 'Acesso negado' });

  const { nome, email, senha, papel } = z
    .object({
      nome: z.string().min(2),
      email: z.string().email(),
      senha: z.string().min(6),
      papel: z.enum(['admin', 'gerente', 'funcionario']),
    })
    .parse(req.body);

  const colaborador = await criarColaborador(lojaId, nome, email, senha, papel as PrismaRole);
  res.status(201).json({ colaborador });
});

router.put('/colaboradores/:id', requirePapel('admin'), async (req: AuthRequest, res) => {
  const lojaId = resolveLojaId(req);
  if (!lojaId) return res.status(400).json({ error: 'lojaId obrigatório' });
  if (!(await checkAcessoLoja(lojaId, req)))
    return res.status(403).json({ error: 'Acesso negado' });

  const dados = z
    .object({
      nome: z.string().min(2).optional(),
      papel: z.enum(['admin', 'gerente', 'funcionario']).optional(),
      ativo: z.boolean().optional(),
    })
    .parse(req.body);

  const colaborador = await atualizarColaborador(
    req.params.id,
    lojaId,
    dados as { nome?: string; papel?: PrismaRole; ativo?: boolean },
  );
  res.json({ colaborador });
});

// ── Solicitações de preço ─────────────────────────────────────

router.get(
  '/solicitacoes-preco/pendentes-count',
  requirePapel('admin', 'gerente'),
  async (req: AuthRequest, res) => {
    const lojaId = resolveLojaId(req);
    if (!lojaId) return res.status(400).json({ error: 'lojaId obrigatório' });
    if (!(await checkAcessoLoja(lojaId, req)))
      return res.status(403).json({ error: 'Acesso negado' });

    const count = await contarPendentes(lojaId);
    res.json({ count });
  },
);

router.get('/solicitacoes-preco', async (req: AuthRequest, res) => {
  const lojaId = resolveLojaId(req);
  if (!lojaId) return res.status(400).json({ error: 'lojaId obrigatório' });
  if (!(await checkAcessoLoja(lojaId, req)))
    return res.status(403).json({ error: 'Acesso negado' });

  const papel = req.user!.tipo === 'lojista' ? 'admin' : req.user!.papel;
  const isFuncionario = papel === 'funcionario';

  const statusParam = req.query.status as StatusSolicitacaoPreco | undefined;

  const solicitacoes = await listarSolicitacoes(lojaId, {
    solicitanteId: isFuncionario ? req.user!.id : undefined,
    status: statusParam,
  });

  res.json({ solicitacoes });
});

router.post('/solicitacoes-preco', requirePapel('funcionario'), async (req: AuthRequest, res) => {
  const { produtoId, lojaId, precoSolicitado, justificativa } = z
    .object({
      produtoId: z.string().min(1),
      lojaId: z.string().min(1),
      precoSolicitado: z.number().positive(),
      justificativa: z.string().min(5),
    })
    .parse(req.body);

  if (!(await checkAcessoLoja(lojaId, req)))
    return res.status(403).json({ error: 'Acesso negado' });

  const solicitacao = await criarSolicitacaoPreco(
    produtoId,
    lojaId,
    req.user!.id,
    precoSolicitado,
    justificativa,
  );

  const actor = await getActorInfo(req);
  await registrarAudit({
    lojaId,
    ...actor,
    action: 'price_change_requested',
    entityType: 'produto',
    entityId: produtoId,
    entityName: solicitacao.produto.nome,
    changes: {
      preco: { before: Number(solicitacao.precoAtual), after: precoSolicitado },
    },
    ipAddress: req.ip,
  });

  res.status(201).json({ solicitacao });
});

router.post(
  '/solicitacoes-preco/:id/aprovar',
  requirePapel('admin', 'gerente'),
  async (req: AuthRequest, res) => {
    const lojaId = resolveLojaId(req);
    if (!lojaId) return res.status(400).json({ error: 'lojaId obrigatório' });
    if (!(await checkAcessoLoja(lojaId, req)))
      return res.status(403).json({ error: 'Acesso negado' });

    const { notaRevisao } = z.object({ notaRevisao: z.string().optional() }).parse(req.body);

    const actor = await getActorInfo(req);

    const sol = await prisma.solicitacaoPreco.findFirst({
      where: { id: req.params.id, lojaId },
      include: { produto: { select: { nome: true } } },
    });
    if (!sol) return res.status(404).json({ error: 'Solicitação não encontrada' });

    const atualizada = await aprovarSolicitacao(
      req.params.id,
      lojaId,
      actor.actorId,
      actor.actorTipo,
      actor.actorNome,
      notaRevisao,
    );

    await registrarAudit({
      lojaId,
      ...actor,
      action: 'price_change_approved',
      entityType: 'produto',
      entityId: sol.produtoId,
      entityName: sol.produto.nome,
      changes: {
        preco: { before: Number(sol.precoAtual), after: Number(sol.precoSolicitado) },
      },
      ipAddress: req.ip,
    });

    res.json({ solicitacao: atualizada });
  },
);

router.post(
  '/solicitacoes-preco/:id/rejeitar',
  requirePapel('admin', 'gerente'),
  async (req: AuthRequest, res) => {
    const lojaId = resolveLojaId(req);
    if (!lojaId) return res.status(400).json({ error: 'lojaId obrigatório' });
    if (!(await checkAcessoLoja(lojaId, req)))
      return res.status(403).json({ error: 'Acesso negado' });

    const { notaRevisao } = z.object({ notaRevisao: z.string().optional() }).parse(req.body);

    const actor = await getActorInfo(req);

    const sol = await prisma.solicitacaoPreco.findFirst({
      where: { id: req.params.id, lojaId },
      include: { produto: { select: { nome: true } } },
    });
    if (!sol) return res.status(404).json({ error: 'Solicitação não encontrada' });

    const atualizada = await rejeitarSolicitacao(
      req.params.id,
      lojaId,
      actor.actorId,
      actor.actorTipo,
      actor.actorNome,
      notaRevisao,
    );

    await registrarAudit({
      lojaId,
      ...actor,
      action: 'price_change_rejected',
      entityType: 'produto',
      entityId: sol.produtoId,
      entityName: sol.produto.nome,
      ipAddress: req.ip,
    });

    res.json({ solicitacao: atualizada });
  },
);

// ── Produtos com RBAC ─────────────────────────────────────────

router.post('/produtos', async (req: AuthRequest, res) => {
  const lojaId = resolveLojaId(req);
  if (!lojaId) return res.status(400).json({ error: 'lojaId obrigatório' });
  if (!(await checkAcessoLoja(lojaId, req)))
    return res.status(403).json({ error: 'Acesso negado' });

  const papel = req.user!.tipo === 'lojista' ? 'admin' : req.user!.papel;
  const isFuncionario = papel === 'funcionario';

  const body = z
    .object({
      nome: z.string().min(1),
      descricao: z.string().min(1),
      preco: z.number().nonnegative(),
      estoque: z.number().int().nonnegative(),
      categoria: z.string().min(1),
      tags: z.array(z.string()).optional(),
      disponivel: z.boolean().optional(),
      imagemUrl: z.string().optional(),
      justificativaPreco: z.string().optional(),
    })
    .parse(req.body);

  const precoFinal = isFuncionario ? 0 : body.preco;

  const produto = await prisma.produto.create({
    data: {
      lojaId,
      nome: body.nome,
      descricao: body.descricao,
      preco: precoFinal,
      estoque: body.estoque,
      categoria: body.categoria,
      tags: body.tags ?? [],
      disponivel: body.disponivel ?? true,
      imagemUrl: body.imagemUrl ?? '',
    },
  });

  const actor = await getActorInfo(req);
  await registrarAudit({
    lojaId,
    ...actor,
    action: 'product_created',
    entityType: 'produto',
    entityId: produto.id,
    entityName: produto.nome,
    ipAddress: req.ip,
  });

  let solicitacaoPreco = null;
  if (isFuncionario && body.preco > 0 && body.justificativaPreco) {
    solicitacaoPreco = await criarSolicitacaoPreco(
      produto.id,
      lojaId,
      req.user!.id,
      body.preco,
      body.justificativaPreco,
    );
    await registrarAudit({
      lojaId,
      ...actor,
      action: 'price_change_requested',
      entityType: 'produto',
      entityId: produto.id,
      entityName: produto.nome,
      changes: { preco: { before: 0, after: body.preco } },
      ipAddress: req.ip,
    });
  }

  res.status(201).json({ produto, solicitacaoPreco });
});

router.put('/produtos/:id', async (req: AuthRequest, res) => {
  const lojaId = resolveLojaId(req);
  if (!lojaId) return res.status(400).json({ error: 'lojaId obrigatório' });
  if (!(await checkAcessoLoja(lojaId, req)))
    return res.status(403).json({ error: 'Acesso negado' });

  const papel = req.user!.tipo === 'lojista' ? 'admin' : req.user!.papel;
  const isFuncionario = papel === 'funcionario';
  const canEditPrice = !isFuncionario;

  const body = z
    .object({
      nome: z.string().min(1).optional(),
      descricao: z.string().min(1).optional(),
      preco: z.number().nonnegative().optional(),
      estoque: z.number().int().nonnegative().optional(),
      categoria: z.string().min(1).optional(),
      tags: z.array(z.string()).optional(),
      disponivel: z.boolean().optional(),
      imagemUrl: z.string().optional(),
      justificativaPreco: z.string().optional(),
    })
    .parse(req.body);

  const produto = await prisma.produto.findFirst({ where: { id: req.params.id, lojaId } });
  if (!produto) return res.status(404).json({ error: 'Produto não encontrado' });

  const precoAntes = Number(produto.preco);
  const precoNovo = body.preco;
  const precoMudou = precoNovo !== undefined && precoNovo !== precoAntes;

  const changes: Record<string, { before: unknown; after: unknown }> = {};
  if (body.nome && body.nome !== produto.nome)
    changes.nome = { before: produto.nome, after: body.nome };
  if (body.descricao && body.descricao !== produto.descricao)
    changes.descricao = { before: produto.descricao, after: body.descricao };
  if (body.estoque !== undefined && body.estoque !== produto.estoque)
    changes.estoque = { before: produto.estoque, after: body.estoque };

  if (precoMudou && canEditPrice) {
    changes.preco = { before: precoAntes, after: precoNovo };
  }

  const { preco: _preco, justificativaPreco: _just, ...dadosSemPreco } = body;

  const atualizado = await prisma.produto.update({
    where: { id: req.params.id },
    data: {
      ...dadosSemPreco,
      ...(precoMudou && canEditPrice ? { preco: precoNovo } : {}),
    },
  });

  const actor = await getActorInfo(req);

  if (Object.keys(changes).length > 0) {
    await registrarAudit({
      lojaId,
      ...actor,
      action: 'product_edited',
      entityType: 'produto',
      entityId: atualizado.id,
      entityName: atualizado.nome,
      changes,
      ipAddress: req.ip,
    });
  }

  let solicitacaoPreco = null;
  if (precoMudou && isFuncionario && body.justificativaPreco) {
    solicitacaoPreco = await criarSolicitacaoPreco(
      atualizado.id,
      lojaId,
      req.user!.id,
      precoNovo!,
      body.justificativaPreco,
    ).catch(() => null);

    if (solicitacaoPreco) {
      await registrarAudit({
        lojaId,
        ...actor,
        action: 'price_change_requested',
        entityType: 'produto',
        entityId: atualizado.id,
        entityName: atualizado.nome,
        changes: { preco: { before: precoAntes, after: precoNovo } },
        ipAddress: req.ip,
      });
    }
  }

  res.json({ produto: atualizado, solicitacaoPreco });
});

router.delete('/produtos/:id', async (req: AuthRequest, res) => {
  const lojaId = resolveLojaId(req);
  if (!lojaId) return res.status(400).json({ error: 'lojaId obrigatório' });
  if (!(await checkAcessoLoja(lojaId, req)))
    return res.status(403).json({ error: 'Acesso negado' });

  const produto = await prisma.produto.findFirst({ where: { id: req.params.id, lojaId } });
  if (!produto) return res.status(404).json({ error: 'Produto não encontrado' });

  await prisma.produto.delete({ where: { id: req.params.id } });

  const actor = await getActorInfo(req);
  await registrarAudit({
    lojaId,
    ...actor,
    action: 'product_deleted',
    entityType: 'produto',
    entityId: produto.id,
    entityName: produto.nome,
    ipAddress: req.ip,
  });

  res.json({ ok: true });
});

// ── Audit log ─────────────────────────────────────────────────

router.get('/audit-log', requirePapel('admin', 'gerente'), async (req: AuthRequest, res) => {
  const lojaId = resolveLojaId(req);
  if (!lojaId) return res.status(400).json({ error: 'lojaId obrigatório' });
  if (!(await checkAcessoLoja(lojaId, req)))
    return res.status(403).json({ error: 'Acesso negado' });

  const page = Number(req.query.page ?? 1);
  const limit = Math.min(Number(req.query.limit ?? 50), 100);

  const result = await listarAuditLogs(lojaId, { page, limit });
  res.json(result);
});

export default router;
