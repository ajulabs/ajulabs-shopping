import { prisma } from '../utils/prisma';
import { getIo, setEntregadorLocalizacao } from '../utils/socket';
import { uploadImagemEntregador, uploadDocumentoTrocaVeiculo } from '../utils/supabase';
import { hashSenha, compararSenha } from '../utils/bcrypt';
import { assertValidImage } from '../lib/mimeValidator';

// ── Perfil ────────────────────────────────────────────────────────────────────

export async function getPerfil(entregadorId: string) {
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

  if (!entregador) throw Object.assign(new Error('Entregador não encontrado'), { statusCode: 404 });

  const { senhaHash: _, ...entregadorSemSenha } = entregador;

  const onboarding = {
    documentosEnviados: !!entregador.documentos,
    documentosAprovados: entregador.documentos?.status === 'aprovado',
    veiculoCadastrado: !!entregador.veiculo,
    dadosBancariosCadastrados: !!entregador.dadosBancarios,
    contaAtiva: entregador.statusConta === 'ativo',
  };

  return { entregador: entregadorSemSenha, onboarding, docVeiculo: ultimaTroca ?? null };
}

export async function updateFoto(entregadorId: string, file: Express.Multer.File) {
  assertValidImage(file.buffer);
  const fotoUrl = await uploadImagemEntregador(file.buffer, file.mimetype);
  await prisma.entregador.update({ where: { id: entregadorId }, data: { fotoUrl } });
  return fotoUrl;
}

export async function updateDadosPessoais(
  entregadorId: string,
  dados: { nome?: string; email?: string; telefone?: string },
) {
  return prisma.entregador.update({
    where: { id: entregadorId },
    data: dados,
    select: { id: true, nome: true, email: true, telefone: true },
  });
}

export async function updateSenha(entregadorId: string, senhaAtual: string, novaSenha: string) {
  const entregador = await prisma.entregador.findUnique({ where: { id: entregadorId } });
  if (!entregador) throw Object.assign(new Error('Entregador não encontrado'), { statusCode: 404 });
  const ok = await compararSenha(senhaAtual, entregador.senhaHash);
  if (!ok) throw Object.assign(new Error('Senha atual incorreta'), { statusCode: 400 });
  const hash = await hashSenha(novaSenha);
  await prisma.entregador.update({ where: { id: entregadorId }, data: { senhaHash: hash } });
}

// ── Documentos ────────────────────────────────────────────────────────────────

export async function uploadDocumentos(
  entregadorId: string,
  frente: Express.Multer.File,
  verso: Express.Multer.File,
) {
  assertValidImage(frente.buffer);
  assertValidImage(verso.buffer);

  const [frenteUrl, versoUrl] = await Promise.all([
    uploadImagemEntregador(frente.buffer, frente.mimetype),
    uploadImagemEntregador(verso.buffer, verso.mimetype),
  ]);

  return prisma.documentoEntregador.upsert({
    where: { entregadorId },
    create: { entregadorId, frenteUrl, versoUrl, status: 'pendente' },
    update: { frenteUrl, versoUrl, status: 'pendente', revisadoEm: null },
  });
}

// ── Veículo ───────────────────────────────────────────────────────────────────

export async function cadastrarVeiculo(
  entregadorId: string,
  dados: { placa: string; modelo: string; cor: string; ano: number },
) {
  return prisma.veiculoEntregador.upsert({
    where: { entregadorId },
    create: { entregadorId, ...dados },
    update: dados,
  });
}

export async function getSolicitacaoTrocaPendente(entregadorId: string) {
  return prisma.solicitacaoTrocaVeiculo.findFirst({
    where: { entregadorId, status: 'pendente' },
    orderBy: { criadoEm: 'desc' },
  });
}

export async function solicitarTrocaVeiculo(
  entregadorId: string,
  dados: {
    tipoTransporte: 'bike' | 'moto' | 'carro';
    modelo: string;
    placa: string;
    cor: string;
    ano: string;
  },
  files?: Record<string, Express.Multer.File[]>,
) {
  const isBike = dados.tipoTransporte === 'bike';

  if (isBike) {
    await prisma.veiculoEntregador.upsert({
      where: { entregadorId },
      create: {
        entregadorId,
        placa: 'BICICLETA',
        modelo: 'Bicicleta',
        cor: dados.cor,
        ano: parseInt(dados.ano),
      },
      update: { placa: 'BICICLETA', modelo: 'Bicicleta', cor: dados.cor, ano: parseInt(dados.ano) },
    });
    await prisma.entregador.update({
      where: { id: entregadorId },
      data: { tipoTransporte: 'bike' },
    });
    return { status: 'aprovado', message: 'Veículo atualizado para bicicleta' };
  }

  const cnhFile = files?.cnh?.[0];
  const docFile = files?.docVeiculo?.[0];
  if (!cnhFile)
    throw Object.assign(new Error('Foto da CNH obrigatória para moto/carro'), { statusCode: 400 });
  if (!docFile)
    throw Object.assign(new Error('Documento do veículo obrigatório para moto/carro'), {
      statusCode: 400,
    });

  assertValidImage(cnhFile.buffer);
  assertValidImage(docFile.buffer);

  const [cnhUrl, docVeiculoUrl] = await Promise.all([
    uploadDocumentoTrocaVeiculo(cnhFile.buffer, cnhFile.mimetype),
    uploadDocumentoTrocaVeiculo(docFile.buffer, docFile.mimetype),
  ]);

  const solicitacao = await prisma.solicitacaoTrocaVeiculo.create({
    data: {
      entregadorId,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

  return { status: 'pendente', solicitacao };
}

// ── Dados bancários ───────────────────────────────────────────────────────────

export async function cadastrarDadosBancarios(
  entregadorId: string,
  dados: {
    tipo: 'pix' | 'conta';
    chavePix?: string;
    banco?: string;
    agencia?: string;
    conta?: string;
  },
) {
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

  return prisma.dadosBancariosEntregador.upsert({
    where: { entregadorId },
    create: { entregadorId, ...payload },
    update: payload,
  });
}

// ── Status ────────────────────────────────────────────────────────────────────

export async function updateStatus(entregadorId: string, online: boolean) {
  const entregador = await prisma.entregador.update({
    where: { id: entregadorId },
    data: { online },
    select: { id: true, online: true },
  });
  return entregador.online;
}

// ── Corridas ──────────────────────────────────────────────────────────────────

const CORRIDA_INCLUDE = {
  loja: {
    select: {
      id: true,
      nome: true,
      endereco: { select: { rua: true, numero: true, bairro: true, cidade: true, cep: true } },
    },
  },
  enderecoEntrega: { select: { rua: true, numero: true, bairro: true, cidade: true, cep: true } },
  itens: { select: { quantidade: true, nomeSnapshot: true, precoUnitario: true } },
  consumidor: { select: { nome: true, telefone: true } },
} as const;

export async function getCorridasAtivas(entregadorId: string) {
  return prisma.pedido.findMany({
    where: { entregadorId, status: { in: ['pronto', 'saiu_entrega'] } },
    include: CORRIDA_INCLUDE,
    orderBy: { criadoEm: 'asc' },
  });
}

export async function getCorridasDisponiveis(entregadorId: string) {
  const entregador = await prisma.entregador.findUnique({
    where: { id: entregadorId },
    select: { online: true },
  });

  if (!entregador?.online) return [];

  const ativasCount = await prisma.pedido.count({
    where: { entregadorId, status: { in: ['pronto', 'saiu_entrega'] } },
  });

  if (ativasCount >= 2) return [];

  return prisma.pedido.findMany({
    where: { status: 'pronto', entregadorId: null },
    include: CORRIDA_INCLUDE,
    orderBy: { criadoEm: 'asc' },
  });
}

export async function aceitarCorrida(entregadorId: string, pedidoId: string) {
  const ativasCount = await prisma.pedido.count({
    where: { entregadorId, status: { in: ['pronto', 'saiu_entrega'] } },
  });

  if (ativasCount >= 2) {
    throw Object.assign(new Error('Limite de 2 entregas simultâneas atingido'), {
      statusCode: 409,
    });
  }

  const pedido = await prisma.pedido.findFirst({
    where: { id: pedidoId, status: 'pronto', entregadorId: null },
  });

  if (!pedido) {
    throw Object.assign(new Error('Corrida não está mais disponível'), { statusCode: 409 });
  }

  const pedidoAtualizado = await prisma.pedido.update({
    where: { id: pedidoId },
    data: { entregadorId },
    include: {
      loja: { select: { id: true, nome: true, telefone: true } },
      enderecoEntrega: true,
      itens: { select: { quantidade: true, nomeSnapshot: true, precoUnitario: true } },
      consumidor: { select: { nome: true, telefone: true } },
    },
  });

  try {
    getIo().to('entregadores').emit('corrida:aceita', { pedidoId, entregadorId });
  } catch {
    /* socket may not be initialized */
  }

  return pedidoAtualizado;
}

export async function confirmarRetirada(entregadorId: string, pedidoId: string) {
  const pedido = await prisma.pedido.findFirst({
    where: { id: pedidoId, entregadorId, status: 'pronto' },
  });

  if (!pedido)
    throw Object.assign(new Error('Pedido não encontrado ou status inválido'), { statusCode: 404 });

  await prisma.pedido.update({ where: { id: pedidoId }, data: { status: 'saiu_entrega' } });
  await prisma.historicoStatusPedido.create({ data: { pedidoId, status: 'saiu_entrega' } });

  try {
    getIo()
      .to(`usuario:${pedido.consumidorId}`)
      .emit('pedido:status', { pedidoId, status: 'saiu_entrega' });
  } catch {
    /* socket may not be initialized */
  }
}

export async function confirmarEntrega(entregadorId: string, pedidoId: string, codigo: string) {
  const pedido = await prisma.pedido.findFirst({
    where: { id: pedidoId, entregadorId, status: 'saiu_entrega' },
  });

  if (!pedido)
    throw Object.assign(new Error('Pedido não encontrado ou status inválido'), { statusCode: 404 });
  if (pedido.codigoEntrega !== codigo)
    throw Object.assign(new Error('Código incorreto'), { statusCode: 400 });

  await prisma.pedido.update({ where: { id: pedidoId }, data: { status: 'entregue' } });
  await prisma.historicoStatusPedido.create({ data: { pedidoId, status: 'entregue' } });
  await prisma.entregaRealizada.upsert({
    where: { pedidoId },
    create: { entregadorId, pedidoId, valorRecebido: Number(pedido.taxaEntrega) * 0.8 },
    update: { valorRecebido: Number(pedido.taxaEntrega) * 0.8 },
  });

  try {
    getIo()
      .to(`usuario:${pedido.consumidorId}`)
      .emit('pedido:status', { pedidoId, status: 'entregue' });
  } catch {
    /* socket may not be initialized */
  }
}

const TRANSICOES_VALIDAS: Record<string, string> = { saiu_entrega: 'entregue' };

export async function updateStatusCorrida(
  entregadorId: string,
  pedidoId: string,
  novoStatus: 'saiu_entrega' | 'entregue',
) {
  const pedido = await prisma.pedido.findFirst({ where: { id: pedidoId, entregadorId } });
  if (!pedido) throw Object.assign(new Error('Corrida não encontrada'), { statusCode: 404 });

  const esperado = TRANSICOES_VALIDAS[pedido.status];
  if (esperado !== novoStatus) {
    throw Object.assign(
      new Error(
        `Transição inválida: ${pedido.status} → ${novoStatus}. Esperado: ${esperado ?? 'nenhum'}`,
      ),
      { statusCode: 400 },
    );
  }

  const atualizado = await prisma.pedido.update({
    where: { id: pedidoId },
    data: { status: novoStatus },
    select: { id: true, status: true, consumidorId: true },
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await prisma.historicoStatusPedido.create({ data: { pedidoId, status: novoStatus as any } });

  if (novoStatus === 'entregue') {
    await prisma.entregaRealizada.upsert({
      where: { pedidoId },
      create: { entregadorId, pedidoId, valorRecebido: Number(pedido.taxaEntrega) * 0.8 },
      update: { valorRecebido: Number(pedido.taxaEntrega) * 0.8 },
    });
  }

  try {
    getIo()
      .to(`usuario:${atualizado.consumidorId}`)
      .emit('pedido:status', { pedidoId, status: novoStatus });
  } catch {
    /* socket may not be initialized */
  }

  return atualizado.status;
}

export async function updateLocalizacao(
  entregadorId: string,
  pedidoId: string,
  coords: { lat: number; lng: number; heading?: number; speedKmh?: number },
) {
  const pedido = await prisma.pedido.findFirst({
    where: { id: pedidoId, entregadorId, status: { in: ['pronto', 'saiu_entrega'] } },
    select: { consumidorId: true, lojaId: true },
  });

  if (!pedido) throw Object.assign(new Error('Pedido não encontrado'), { statusCode: 404 });

  setEntregadorLocalizacao(
    pedidoId,
    coords.lat,
    coords.lng,
    pedido.consumidorId,
    pedido.lojaId,
    coords.heading,
    coords.speedKmh,
  );
}

// ── Ganhos ────────────────────────────────────────────────────────────────────

export async function getGanhos(entregadorId: string) {
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
    prisma.pedido.count({ where: { entregadorId, status: { in: ['pronto', 'saiu_entrega'] } } }),
  ]);

  const calc = (agg: typeof allTime) =>
    (Number(agg._sum.valorRecebido ?? 0) + Number(agg._sum.bonus ?? 0)).toFixed(2);

  return {
    semana: { total: calc(semana), corridas: semana._count },
    mes: { total: calc(mes), corridas: mes._count },
    allTime: { total: calc(allTime), corridas: allTime._count },
    emAndamento,
  };
}

export async function getEntregas(entregadorId: string) {
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
          enderecoEntrega: { select: { rua: true, numero: true, bairro: true, cidade: true } },
        },
      },
    },
  });

  const totalGanho = entregas.reduce(
    (acc, e) => acc + Number(e.valorRecebido) + (e.bonus ? Number(e.bonus) : 0),
    0,
  );

  return { total: entregas.length, totalGanho: totalGanho.toFixed(2), entregas };
}

// ── Saques ────────────────────────────────────────────────────────────────────

export async function solicitarSaque(entregadorId: string, valor: number) {
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

  const saldo =
    Number(ganhos._sum.valorRecebido ?? 0) +
    Number(ganhos._sum.bonus ?? 0) -
    Number(saques._sum.valor ?? 0);

  if (valor > saldo) {
    throw Object.assign(new Error(`Saldo insuficiente. Disponível: R$ ${saldo.toFixed(2)}`), {
      statusCode: 400,
    });
  }

  if (!entregador?.dadosBancarios?.chavePix) {
    throw Object.assign(new Error('Cadastre uma chave PIX antes de solicitar saque'), {
      statusCode: 400,
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

  return { saque, saldoRestante: (saldo - valor).toFixed(2) };
}

export async function getSaques(entregadorId: string) {
  return prisma.solicitacaoSaque.findMany({
    where: { entregadorId },
    orderBy: { criadoEm: 'desc' },
  });
}
