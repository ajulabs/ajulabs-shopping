import OpenAI from 'openai';
import { prisma } from '../utils/prisma';
import { uploadImagemProduto, uploadImagemLoja } from '../utils/supabase';
import { embedirProduto } from '../utils/embeddings';
import {
  getEntregadorLocalizacao,
  emitPedidoAtualizado,
  emitCorridaOferta,
  emitTicketMensagem,
  emitTicketStatus,
} from '../utils/socket';
import { assertValidImage } from '../lib/mimeValidator';
import { logger } from '../lib/logger';
import { notificarStatusPedido } from '../lib/pushNotifications';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const STATUS_PROGRESSAO: Partial<Record<string, string>> = {
  aguardando: 'confirmado',
  confirmado: 'preparando',
  preparando: 'pronto',
};

export async function verificarDonoLoja(lojaId: string, lojistaId: string) {
  const loja = await prisma.loja.findUnique({ where: { id: lojaId } });
  if (!loja || loja.lojistaId !== lojistaId) {
    throw Object.assign(new Error('Acesso negado'), { statusCode: 403 });
  }
  return loja;
}

// ── Pedidos ───────────────────────────────────────────────────────────────────

export async function getPedidos(
  lojaId: string,
  opts: { status?: string; page: number; limit: number },
) {
  const where: Record<string, unknown> = { lojaId };
  if (opts.status) where.status = opts.status;

  const [pedidos, total] = await Promise.all([
    prisma.pedido.findMany({
      where,
      include: {
        consumidor: { select: { nome: true, telefone: true } },
        itens: true,
        historico: { orderBy: { criadoEm: 'asc' } },
        enderecoEntrega: true,
        entregador: {
          select: {
            nome: true,
            telefone: true,
            veiculo: { select: { placa: true, modelo: true } },
          },
        },
      },
      orderBy: { criadoEm: 'desc' },
      skip: (opts.page - 1) * opts.limit,
      take: opts.limit,
    }),
    prisma.pedido.count({ where }),
  ]);

  return { pedidos, total, page: opts.page, limit: opts.limit };
}

export async function avancarStatusPedido(pedidoId: string, lojistaId: string) {
  const pedido = await prisma.pedido.findUnique({
    where: { id: pedidoId },
    include: { loja: true },
  });

  if (!pedido || pedido.loja.lojistaId !== lojistaId) {
    throw Object.assign(new Error('Acesso negado'), { statusCode: 403 });
  }
  if (pedido.status === 'cancelado' || pedido.status === 'entregue') {
    throw Object.assign(new Error('Pedido já finalizado'), { statusCode: 400 });
  }

  const proximoStatus = STATUS_PROGRESSAO[pedido.status];
  if (!proximoStatus) {
    throw Object.assign(new Error('Não é possível avançar este status'), { statusCode: 400 });
  }

  const atualizado = await prisma.pedido.update({
    where: { id: pedidoId },
    data: {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      status: proximoStatus as any,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      historico: { create: { status: proximoStatus as any } },
    },
    include: {
      itens: true,
      historico: { orderBy: { criadoEm: 'asc' } },
    },
  });

  emitPedidoAtualizado(atualizado.consumidorId, atualizado.id, proximoStatus, pedido.lojaId);
  void notificarStatusPedido(atualizado.consumidorId, atualizado.id, proximoStatus);
  if (proximoStatus === 'pronto') {
    emitCorridaOferta({
      id: atualizado.id,
      lojaId: pedido.lojaId,
      lojaNome: pedido.loja?.nome ?? '',
      total: Number(atualizado.total ?? 0),
      taxaEntrega: Number(atualizado.taxaEntrega ?? 0),
    });
  }

  return atualizado;
}

export async function getLocalizacaoEntregador(pedidoId: string, lojistaId: string) {
  const pedido = await prisma.pedido.findUnique({
    where: { id: pedidoId },
    include: { loja: true },
  });

  if (!pedido || pedido.loja.lojistaId !== lojistaId) {
    throw Object.assign(new Error('Acesso negado'), { statusCode: 403 });
  }

  return getEntregadorLocalizacao(pedidoId);
}

// ── Dashboard ─────────────────────────────────────────────────────────────────

export async function getDashboard(lojaId: string) {
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
      where: { lojaId, criadoEm: { gte: inicioDia }, status: { not: 'cancelado' } },
    }),
    prisma.pedido.count({
      where: { lojaId, criadoEm: { gte: inicioMes }, status: { not: 'cancelado' } },
    }),
    prisma.pedido.aggregate({
      where: { lojaId, criadoEm: { gte: inicioDia }, status: { not: 'cancelado' } },
      _sum: { total: true },
    }),
    prisma.pedido.aggregate({
      where: { lojaId, criadoEm: { gte: inicioMes }, status: { not: 'cancelado' } },
      _sum: { total: true },
    }),
    prisma.pedido.groupBy({ by: ['status'], where: { lojaId }, _count: { id: true } }),
    prisma.produto.count({ where: { lojaId, disponivel: true } }),
    prisma.itemPedido.groupBy({
      by: ['produtoId', 'nomeSnapshot'],
      where: { pedido: { lojaId, status: { not: 'cancelado' } } },
      _sum: { quantidade: true },
      orderBy: { _sum: { quantidade: 'desc' } },
      take: 5,
    }),
  ]);

  return {
    hoje: { pedidos: totalPedidosHoje, faturamento: Number(faturamentoHoje._sum.total ?? 0) },
    mes: { pedidos: totalPedidosMes, faturamento: Number(faturamentoMes._sum.total ?? 0) },
    pedidosPorStatus: pedidosPorStatus.reduce(
      (acc, item) => ({ ...acc, [item.status]: item._count.id }),
      {} as Record<string, number>,
    ),
    totalProdutosAtivos,
    produtosMaisVendidos: produtosMaisVendidos.map((p) => ({
      produtoId: p.produtoId,
      nome: p.nomeSnapshot,
      totalVendido: p._sum.quantidade ?? 0,
    })),
  };
}

// ── Loja ──────────────────────────────────────────────────────────────────────

export async function getLoja(lojaId: string) {
  return prisma.loja.findUnique({
    where: { id: lojaId },
    include: { endereco: true, horarios: { orderBy: { diaSemana: 'asc' } } },
  });
}

export async function updateLoja(
  lojaId: string,
  dados: {
    nome?: string;
    descricao?: string;
    categoria?: string;
    telefone?: string;
    aceitaAgendamento?: boolean;
    antecedenciaMinima?: number;
    endereco?: {
      rua: string;
      numero?: string;
      bairro: string;
      cep: string;
      cidade: string;
      complemento?: string;
    };
  },
) {
  const { endereco, ...dadosSemEndereco } = dados;
  return prisma.loja.update({
    where: { id: lojaId },
    data: {
      ...dadosSemEndereco,
      ...(endereco && { endereco: { upsert: { create: endereco, update: endereco } } }),
    },
    include: { endereco: true },
  });
}

export async function updateImagemLoja(
  lojaId: string,
  files: { logo?: Express.Multer.File; banner?: Express.Multer.File },
) {
  const data: { logoUrl?: string; bannerUrl?: string } = {};

  if (files.logo) {
    assertValidImage(files.logo.buffer);
    data.logoUrl = await uploadImagemLoja(files.logo.buffer, files.logo.mimetype);
  }
  if (files.banner) {
    assertValidImage(files.banner.buffer);
    data.bannerUrl = await uploadImagemLoja(files.banner.buffer, files.banner.mimetype);
  }

  if (Object.keys(data).length === 0) {
    throw Object.assign(new Error('Nenhuma imagem enviada'), { statusCode: 400 });
  }

  return prisma.loja.update({ where: { id: lojaId }, data });
}

// ── Produtos ──────────────────────────────────────────────────────────────────

export async function getProdutos(lojaId: string) {
  return prisma.produto.findMany({
    where: { lojaId },
    include: { variacoes: true },
    orderBy: [{ destaque: 'desc' }, { nome: 'asc' }],
  });
}

export async function analisarImagemProduto(file: Express.Multer.File) {
  assertValidImage(file.buffer);
  const base64 = file.buffer.toString('base64');
  const mimeType = file.mimetype || 'image/jpeg';

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

  return JSON.parse(completion.choices[0]?.message?.content ?? '{}');
}

export async function criarProduto(
  dados: {
    lojaId: string;
    nome: string;
    descricao: string;
    preco: number;
    estoque: number;
    categoria: string;
    tags: string[];
  },
  file?: Express.Multer.File,
) {
  let imagemUrl = '';
  if (file) {
    assertValidImage(file.buffer);
    imagemUrl = await uploadImagemProduto(file.buffer, file.mimetype);
    logger.debug({ imagemUrl }, '[produto] imagemUrl salva');
  }

  const produto = await prisma.produto.create({
    data: { ...dados, imagemUrl, imagens: imagemUrl ? [imagemUrl] : [] },
  });

  embedirProduto(produto.id).catch((err) =>
    logger.error({ err, produtoId: produto.id }, '[embedding] falhou'),
  );

  return produto;
}

export async function updateProduto(
  produtoId: string,
  lojistaId: string,
  body: Record<string, string | undefined>,
  imagensExistentes: string[],
  files?: Express.Multer.File[],
) {
  const produto = await prisma.produto.findUnique({
    where: { id: produtoId },
    include: { loja: true },
  });

  if (!produto || produto.loja.lojistaId !== lojistaId) {
    throw Object.assign(new Error('Acesso negado'), { statusCode: 403 });
  }

  const dados: Record<string, unknown> = {};
  if (body.nome) dados.nome = body.nome;
  if (body.descricao !== undefined) dados.descricao = body.descricao;
  if (body.categoria) dados.categoria = body.categoria;
  if (body.preco) dados.preco = parseFloat(body.preco);
  if (body.estoque !== undefined && body.estoque !== '') dados.estoque = parseInt(body.estoque, 10);
  if (body.disponivel !== undefined) dados.disponivel = body.disponivel === 'true';

  let newUrls: string[] = [];
  if (files && files.length > 0) {
    files.forEach((f) => assertValidImage(f.buffer));
    newUrls = await Promise.all(files.map((f) => uploadImagemProduto(f.buffer, f.mimetype)));
  }

  const todasImagens = [...imagensExistentes, ...newUrls];
  if (todasImagens.length > 0) {
    dados.imagemUrl = todasImagens[0];
    dados.imagens = todasImagens;
  }

  const atualizado = await prisma.produto.update({ where: { id: produtoId }, data: dados });

  embedirProduto(atualizado.id).catch((err) =>
    logger.error({ err, produtoId: atualizado.id }, '[embedding] falhou'),
  );

  return atualizado;
}

export async function deleteProduto(produtoId: string, lojistaId: string) {
  const produto = await prisma.produto.findUnique({
    where: { id: produtoId },
    include: { loja: true },
  });

  if (!produto || produto.loja.lojistaId !== lojistaId) {
    throw Object.assign(new Error('Acesso negado'), { statusCode: 403 });
  }

  await prisma.produto.delete({ where: { id: produtoId } });
}

// ── Tickets ───────────────────────────────────────────────────────────────────

export async function getTickets(
  lojaId: string,
  opts: { status?: string; page: number; limit: number },
) {
  const where: Record<string, unknown> = { lojaId };
  if (opts.status) where.status = opts.status;

  const [tickets, total] = await Promise.all([
    prisma.supportTicket.findMany({
      where,
      include: {
        consumidor: { select: { nome: true, telefone: true } },
        pedido: {
          select: {
            id: true,
            total: true,
            criadoEm: true,
            itens: { select: { nomeSnapshot: true, quantidade: true } },
          },
        },
        notas: true,
        mensagens: true,
      },
      orderBy: [{ urgente: 'desc' }, { criadoEm: 'desc' }],
      skip: (opts.page - 1) * opts.limit,
      take: opts.limit,
    }),
    prisma.supportTicket.count({ where }),
  ]);

  return { tickets, total, page: opts.page, limit: opts.limit };
}

export async function getTicket(ticketId: string, lojistaId: string) {
  const ticket = await prisma.supportTicket.findUnique({
    where: { id: ticketId },
    include: {
      consumidor: { select: { nome: true, telefone: true } },
      pedido: {
        select: {
          id: true,
          total: true,
          criadoEm: true,
          itens: { select: { nomeSnapshot: true, quantidade: true } },
        },
      },
      loja: { select: { lojistaId: true } },
      notas: true,
      mensagens: true,
    },
  });

  if (!ticket || ticket.loja?.lojistaId !== lojistaId) {
    throw Object.assign(new Error('Acesso negado'), { statusCode: 403 });
  }

  return ticket;
}

export async function updateTicketStatus(ticketId: string, lojistaId: string, status: string) {
  const VALID = ['aberto', 'em_andamento', 'resolvido'];
  if (!VALID.includes(status))
    throw Object.assign(new Error('Status inválido'), { statusCode: 400 });

  const ticket = await prisma.supportTicket.findUnique({
    where: { id: ticketId },
    include: { loja: { select: { lojistaId: true } } },
  });

  if (!ticket || ticket.loja?.lojistaId !== lojistaId) {
    throw Object.assign(new Error('Acesso negado'), { statusCode: 403 });
  }

  const atualizado = await prisma.supportTicket.update({
    where: { id: ticketId },
    data: { status, ...(status === 'resolvido' && { urgente: false }) },
  });

  emitTicketStatus(ticket.consumidorId, ticketId, status);
  return atualizado;
}

export async function updateTicketUrgente(ticketId: string, lojistaId: string, urgente: boolean) {
  const ticket = await prisma.supportTicket.findUnique({
    where: { id: ticketId },
    include: { loja: { select: { lojistaId: true } } },
  });

  if (!ticket || ticket.loja?.lojistaId !== lojistaId) {
    throw Object.assign(new Error('Acesso negado'), { statusCode: 403 });
  }

  return prisma.supportTicket.update({ where: { id: ticketId }, data: { urgente } });
}

export async function addTicketNota(ticketId: string, lojistaId: string, texto: string) {
  const ticket = await prisma.supportTicket.findUnique({
    where: { id: ticketId },
    include: { loja: { select: { lojistaId: true } } },
  });

  if (!ticket || ticket.loja?.lojistaId !== lojistaId) {
    throw Object.assign(new Error('Acesso negado'), { statusCode: 403 });
  }

  return prisma.ticketNota.create({ data: { ticketId, texto: texto.trim() } });
}

export async function addTicketMensagem(ticketId: string, lojistaId: string, texto: string) {
  const ticket = await prisma.supportTicket.findUnique({
    where: { id: ticketId },
    include: { loja: { select: { lojistaId: true } } },
  });

  if (!ticket || ticket.loja?.lojistaId !== lojistaId) {
    throw Object.assign(new Error('Acesso negado'), { statusCode: 403 });
  }

  const mensagem = await prisma.ticketMensagem.create({
    data: { ticketId, remetente: 'lojista', texto: texto.trim() },
  });

  emitTicketMensagem(ticket.consumidorId, ticket.lojaId, { ...mensagem, ticketId }, 'lojista');
  return mensagem;
}
