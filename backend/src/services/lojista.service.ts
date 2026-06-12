import OpenAI from 'openai';
import { TicketStatus } from '@prisma/client';
import { prisma } from '../utils/prisma';
import { uploadImagemProduto, uploadImagemLoja } from '../utils/supabase';
import { embedirProduto } from '../utils/embeddings';
import {
  getEntregadorLocalizacao,
  emitPedidoAtualizado,
  emitCorridaOferta,
  emitCorridaCancelada,
  emitTicketMensagem,
  emitTicketStatus,
  emitProdutoVariacoes,
  emitVitrineAtualizada,
} from '../utils/socket';
import { assertValidImage } from '../lib/mimeValidator';
import { geocodeByCep, geocodeByQuery } from '../lib/geocoder';
import { logger } from '../lib/logger';
import { notificarStatusPedido, notificarCorridaOferta } from '../lib/pushNotifications';
import { restaurarEstoqueNoCancelamento } from './estoque.service';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// A UI do lojista tem só 3 ações (novo → preparando → pronto). O estado
// "confirmado" não tem representação distinta na tela (mapeia para "preparando"),
// então "Aceitar e preparar" leva direto de aguardando → preparando. Sem isso,
// o primeiro "Marcar como pronto" só avançava confirmado → preparando e a tela
// revertia (exigindo clicar 2x). Mantemos confirmado → preparando para que
// pedidos legados já em "confirmado" ainda consigam progredir.
const STATUS_PROGRESSAO: Partial<Record<string, string>> = {
  aguardando: 'preparando',
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
        consumidor: { select: { nome: true, telefone: true, avatarUrl: true } },
        itens: true,
        historico: { orderBy: { criadoEm: 'asc' } },
        enderecoEntrega: true,
        entregador: {
          select: {
            nome: true,
            telefone: true,
            fotoUrl: true,
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

export async function avancarStatusPedido(
  pedidoId: string,
  auth: { tipo: 'lojista'; id: string } | { tipo: 'colaborador'; lojaId: string },
) {
  const pedido = await prisma.pedido.findUnique({
    where: { id: pedidoId },
    include: {
      loja: { include: { endereco: { select: { rua: true, numero: true, bairro: true } } } },
      enderecoEntrega: { select: { rua: true, numero: true, bairro: true } },
    },
  });

  const hasAccess =
    auth.tipo === 'colaborador'
      ? pedido?.lojaId === auth.lojaId
      : pedido?.loja.lojistaId === auth.id;

  if (!pedido || !hasAccess) {
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

  // Cria o chat consumidor↔lojista ao aceitar o pedido (primeiro avanço, que
  // agora leva a "preparando"). Upsert é idempotente — seguro se rodar de novo.
  if (proximoStatus === 'preparando') {
    await prisma.chatPedido
      .upsert({
        where: { pedidoId: pedidoId },
        create: { pedidoId },
        update: {},
      })
      .catch(() => {});
  }

  if (proximoStatus === 'pronto') {
    const lojaEnd = pedido.loja?.endereco;
    const entregaEnd = pedido.enderecoEntrega;
    emitCorridaOferta({
      id: atualizado.id,
      lojaId: pedido.lojaId,
      lojaNome: pedido.loja?.nome ?? '',
      lojaEndereco: lojaEnd ? `${lojaEnd.rua}, ${lojaEnd.numero}` : undefined,
      lojaBairro: lojaEnd?.bairro ?? undefined,
      entregaEndereco: entregaEnd ? `${entregaEnd.rua}, ${entregaEnd.numero}` : undefined,
      entregaBairro: entregaEnd?.bairro ?? undefined,
      total: Number(atualizado.total ?? 0),
      taxaEntrega: Number(atualizado.taxaEntrega ?? 0),
    });
    void notificarCorridaOferta({
      pedidoId: atualizado.id,
      lojaNome: pedido.loja?.nome ?? 'Loja',
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
    horarios?: {
      diaSemana: number;
      ativo: boolean;
      abertura: string;
      fechamento: string;
    }[];
  },
) {
  const { endereco, horarios, ...dadosSemEndereco } = dados;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let enderecoComCoords: any = endereco;
  if (endereco) {
    const coords =
      (await geocodeByCep(endereco.cep ?? '')) ??
      (await geocodeByQuery(`${endereco.rua}, ${endereco.bairro}, ${endereco.cidade}`));

    if (coords) {
      logger.info({ lojaId, coords }, '[lojista] endereço da loja geocodificado');
      enderecoComCoords = {
        ...endereco,
        lat: coords.lat,
        lng: coords.lng,
        accuracy: 80,
        geoSource: 'geocode',
      };
    } else {
      logger.warn(
        { lojaId, cep: endereco.cep },
        '[lojista] não foi possível geocodificar endereço da loja',
      );
    }
  }

  const [loja] = await prisma.$transaction([
    prisma.loja.update({
      where: { id: lojaId },
      data: {
        ...dadosSemEndereco,
        ...(enderecoComCoords && {
          endereco: { upsert: { create: enderecoComCoords, update: enderecoComCoords } },
        }),
      },
      include: { endereco: true, horarios: true },
    }),
    ...(horarios
      ? [
          prisma.horarioFuncionamento.deleteMany({ where: { lojaId } }),
          prisma.horarioFuncionamento.createMany({
            data: horarios.map((h) => ({
              lojaId,
              diaSemana: h.diaSemana,
              ativo: h.ativo,
              abertura: h.abertura,
              fechamento: h.fechamento,
            })),
          }),
        ]
      : []),
  ]);

  return loja;
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
    max_tokens: 800,
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

Campos obrigatórios:
{
  "nome": "nome comercial do produto (máx 60 caracteres)",
  "categoria": "use EXATAMENTE um destes valores: Eletrônicos - Celular / Smartphone | Eletrônicos - Notebook / Computador | Eletrônicos - Tablet | Eletrônicos - Fone / Headphone | Eletrônicos - Eletrodoméstico | Calçados - Masculino | Calçados - Feminino | Calçados - Infantil | Roupas - Feminino | Roupas - Masculino | Roupas - Infantil | Acessórios - Bolsa / Mochila | Acessórios - Joias / Bijuterias | Acessórios - Relógio | Beleza - Maquiagem | Beleza - Perfumaria | Beleza - Cabelos | Esporte - Futebol | Esporte - Academia / Fitness | Casa / Deco - Móveis | Casa / Deco - Decoração | Casa / Deco - Utilidades | Alimentos - Geral | Alimentos - Bebidas | Alimentos - Doces / Confeitaria | Outros",
  "descricao": "descrição atraente em 1-2 frases (máx 150 caracteres)",
  "tags": ["tag1", "tag2", "tag3"],
  "preco": "preço sugerido em reais como string, ex: 49,90",
  "estoque": "quantidade sugerida como string, ex: 10"
}

Campos opcionais — inclua apenas se visível ou aplicável ao produto:
- "cor": array de cores detectadas. Valores permitidos: Preto, Branco, Azul, Rosa, Vermelho, Verde, Amarelo, Cinza, Bege, Marrom, Nude, Prata, Dourado, Rosê, Coral, Marinho, Inox
- "tipo": tipo da peça (roupas) ou tipo de produto (beleza). Valores: Vestido, Blusa, Calça, Saia, Short, Casaco, Íntima, Camisa, Camiseta, Bermuda, Moletom, Jaqueta, Base, Batom, Blush, Sombra, Rímel, Perfume, Colônia, Shampoo, Condicionador, Máscara
- "armazenamento": array para eletrônicos com memória. Valores: 64GB, 128GB, 256GB, 512GB, 1TB
- "material": array para joias/acessórios. Valores: Ouro, Prata, Rosê, Aço, Banhado a Ouro
- "volume": array para perfumes/cosméticos. Valores: 30ml, 50ml, 75ml, 100ml, 200ml`,
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
  variacoes: { nome: string; estoque: number; preco?: number }[] = [],
) {
  let imagemUrl = '';
  if (file) {
    assertValidImage(file.buffer);
    imagemUrl = await uploadImagemProduto(file.buffer, file.mimetype);
    logger.debug({ imagemUrl }, '[produto] imagemUrl salva');
  }

  const produto = await prisma.produto.create({
    data: {
      ...dados,
      imagemUrl,
      imagens: imagemUrl ? [imagemUrl] : [],
      ...(variacoes.length > 0 && {
        variacoes: {
          create: variacoes.map((v) => ({
            nome: v.nome,
            estoque: v.estoque,
            preco: v.preco ?? null,
          })),
        },
      }),
    },
    include: { variacoes: true },
  });

  // Avisa os consumidores na vitrine ANTES do embedding (que é assíncrono e só
  // serve à busca da Aju) — o produto deve aparecer na loja imediatamente.
  emitVitrineAtualizada(produto.lojaId, { produtoId: produto.id, acao: 'novo' });

  await embedirProduto(produto.id).catch((err) =>
    logger.error({ err, produtoId: produto.id }, '[embedding] falhou ao criar produto'),
  );

  return produto;
}

export async function updateProduto(
  produtoId: string,
  lojistaId: string,
  body: Record<string, string | undefined>,
  imagensExistentes: string[],
  files?: Express.Multer.File[],
  variacoes?: { nome: string; estoque: number; preco?: number }[],
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

  if (variacoes !== undefined && variacoes.length > 0) {
    dados.estoque = variacoes.reduce((s, v) => s + v.estoque, 0);
  }

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

  let atualizado;
  if (variacoes !== undefined) {
    atualizado = await prisma.$transaction(async (tx) => {
      // O estoque das variações é gerenciado em "Ajustar estoque". Ao editar o
      // produto, preservamos o estoque atual de cada variação (casado por nome);
      // variações novas começam com o que veio no payload (geralmente 0).
      const existentes = await tx.variacaoProduto.findMany({
        where: { produtoId },
        select: { nome: true, estoque: true },
      });
      const estoquePorNome = new Map(existentes.map((v) => [v.nome, v.estoque]));
      const variacoesFinais = variacoes.map((v) => ({
        nome: v.nome,
        estoque: estoquePorNome.get(v.nome) ?? v.estoque,
        preco: v.preco ?? null,
      }));

      await tx.variacaoProduto.deleteMany({ where: { produtoId } });
      return tx.produto.update({
        where: { id: produtoId },
        data: {
          ...dados,
          estoque: variacoesFinais.reduce((s, v) => s + v.estoque, 0),
          ...(variacoesFinais.length > 0 && {
            variacoes: { create: variacoesFinais },
          }),
        },
        include: { variacoes: true },
      });
    });
    emitProdutoVariacoes(produto.lojaId, produtoId, atualizado.variacoes);
  } else {
    atualizado = await prisma.produto.update({
      where: { id: produtoId },
      data: dados,
      include: { variacoes: true },
    });
  }

  emitVitrineAtualizada(produto.lojaId, { produtoId, acao: 'atualizado' });

  await embedirProduto(atualizado.id).catch((err) =>
    logger.error({ err, produtoId: atualizado.id }, '[embedding] falhou ao atualizar produto'),
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

  emitVitrineAtualizada(produto.lojaId, { produtoId, acao: 'removido' });
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
    data: { status: status as TicketStatus, ...(status === 'resolvido' ? { urgente: false } : {}) },
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

// ── Cancelamento de pedido ────────────────────────────────────────────────────

const CANCELAVEIS_LOJISTA = ['aguardando', 'confirmado', 'preparando', 'pronto'];
const PENALIZA_LOJISTA = ['preparando', 'pronto'];

export async function cancelarPedidoLojista(
  pedidoId: string,
  auth: { tipo: 'lojista'; id: string } | { tipo: 'colaborador'; lojaId: string },
  motivo: string,
) {
  const pedido = await prisma.pedido.findUnique({
    where: { id: pedidoId },
    include: { loja: true },
  });

  const hasAccess =
    auth.tipo === 'colaborador'
      ? pedido?.lojaId === auth.lojaId
      : pedido?.loja.lojistaId === auth.id;

  if (!pedido || !hasAccess) {
    throw Object.assign(new Error('Acesso negado'), { statusCode: 403 });
  }

  if (!CANCELAVEIS_LOJISTA.includes(pedido.status)) {
    throw Object.assign(new Error('Pedido não pode ser cancelado neste estágio'), {
      statusCode: 400,
    });
  }

  const penaliza = PENALIZA_LOJISTA.includes(pedido.status);

  await prisma.$transaction(async (tx) => {
    await tx.pedido.update({
      where: { id: pedidoId },
      data: {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        status: 'cancelado' as any,
        canceladoPor: 'lojista',
        motivoCancelamento: motivo,
        penalizouLojista: penaliza,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        historico: { create: { status: 'cancelado' as any } },
      },
    });

    if (penaliza) {
      await tx.loja.update({
        where: { id: pedido.lojaId },
        data: { cancelamentosAposAceite: { increment: 1 } },
      });
    }

    await restaurarEstoqueNoCancelamento(pedidoId, pedido.lojaId, tx);
  });

  emitPedidoAtualizado(pedido.consumidorId, pedidoId, 'cancelado', pedido.lojaId);
  void notificarStatusPedido(pedido.consumidorId, pedidoId, 'cancelado');
  // Pedido estava em 'pronto' → corrida já havia sido ofertada aos entregadores.
  // Remove da lista em tempo real para evitar tentativa de aceitar pedido cancelado.
  if (pedido.status === 'pronto') {
    emitCorridaCancelada(pedidoId);
  }
}
