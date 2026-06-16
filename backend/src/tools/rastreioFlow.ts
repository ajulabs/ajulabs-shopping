import { prisma } from '../utils/prisma';
import {
  atualizarEstado,
  obterEstado,
  PedidoCardData,
  EstadoSelecionandoPedidoRastreio,
  EstadoRastreioConcluido,
  STATUS_RECLAMAVEL,
} from '../utils/conversa';

export type RespostaSelecionarPedidoRastreio = {
  tipo: 'selecionarPedido';
  pedidos: PedidoCardData[];
  texto: string;
};

export type RespostaRastreio = {
  tipo: 'resposta';
  texto: string;
  sugestoes: string[];
  rastreio?: {
    pedidoId: string;
    destinoLat?: number | null;
    destinoLng?: number | null;
  };
};

const STATUS_LABEL: Record<string, string> = {
  aguardando: 'aguardando confirmação da loja',
  confirmado: 'confirmado pela loja',
  preparando: 'sendo preparado pela loja',
  pronto: 'pronto, aguardando retirada pelo entregador',
  saiu_entrega: 'saiu para entrega',
  entregue: 'entregue',
  cancelado: 'cancelado',
};

// ─── Passo 1: lista pedidos para seleção ─────────────────────────────────────

export async function iniciarFluxoRastreio(
  conversaId: string,
  usuarioId: string,
): Promise<RespostaSelecionarPedidoRastreio> {
  const pedidosRaw = await prisma.pedido.findMany({
    where: {
      consumidorId: usuarioId,
      status: { notIn: ['entregue', 'cancelado'] },
    },
    orderBy: { criadoEm: 'desc' },
    take: 5,
    include: {
      loja: { select: { nome: true, logoUrl: true } },
      itens: { select: { nomeSnapshot: true, quantidade: true } },
    },
  });

  if (pedidosRaw.length === 0) {
    await atualizarEstado(conversaId, null);
    return {
      tipo: 'selecionarPedido',
      pedidos: [],
      texto: 'Não encontrei nenhum pedido em andamento para rastrear. Quer buscar produtos?',
    };
  }

  const pedidos: PedidoCardData[] = pedidosRaw.map((p, idx) => ({
    numero: idx + 1,
    id: p.id,
    loja: p.loja.nome,
    lojaImagem: p.loja.logoUrl ?? null,
    total: Number(p.total),
    data: p.criadoEm.toISOString().split('T')[0],
    itens: p.itens.map((i) =>
      i.quantidade > 1 ? `${i.nomeSnapshot} x${i.quantidade}` : i.nomeSnapshot,
    ),
    status: p.status,
  }));

  await atualizarEstado(conversaId, {
    passo: 'selecionando_pedido_rastreio',
    pedidos,
  } satisfies EstadoSelecionandoPedidoRastreio);

  return {
    tipo: 'selecionarPedido',
    pedidos,
    texto: 'Qual pedido você quer rastrear?',
  };
}

// ─── Passo 2: processa seleção e retorna status ───────────────────────────────

export async function processarSelecaoRastreio(
  conversaId: string,
  textoUser: string,
  pedidoSelecionadoId?: string,
): Promise<RespostaSelecionarPedidoRastreio | RespostaRastreio> {
  const estado = (await obterEstado(conversaId)) as EstadoSelecionandoPedidoRastreio | null;
  if (!estado || estado.passo !== 'selecionando_pedido_rastreio') {
    throw new Error('Estado inválido para seleção de pedido para rastreio');
  }

  let pedido: PedidoCardData | undefined;

  if (pedidoSelecionadoId) {
    pedido = estado.pedidos.find((p) => p.id === pedidoSelecionadoId);
  }

  if (!pedido) {
    const match = textoUser.match(/\b([1-5])\b/);
    if (match) {
      pedido = estado.pedidos.find((p) => p.numero === parseInt(match[1]));
    }
  }

  if (!pedido) {
    const lower = textoUser.toLowerCase();
    pedido = estado.pedidos.find((p) => lower.includes(p.loja.toLowerCase().split(' ')[0]));
  }

  if (!pedido) {
    return {
      tipo: 'selecionarPedido',
      pedidos: estado.pedidos,
      texto: 'Não consegui identificar o pedido. Toque em um dos cards acima para selecionar.',
    };
  }

  const pedidoCompleto = await prisma.pedido.findUnique({
    where: { id: pedido.id },
    include: {
      loja: { select: { nome: true, logoUrl: true, tempoEntregaMin: true, tempoEntregaMax: true } },
      entregador: { select: { nome: true, ultimaLat: true, ultimaLng: true } },
      enderecoEntrega: { select: { lat: true, lng: true } },
    },
  });

  if (!pedidoCompleto) {
    await atualizarEstado(conversaId, null);
    return { tipo: 'resposta', texto: 'Não encontrei informações desse pedido.', sugestoes: [] };
  }

  // Só salva o contexto p/ "Tive um problema" pular a seleção se o pedido for reclamável
  // (já saiu para entrega ou foi entregue). Em preparo, não há o que reclamar ainda.
  const reclamavel = STATUS_RECLAMAVEL.includes(pedidoCompleto.status);
  if (reclamavel) {
    await atualizarEstado(conversaId, {
      passo: 'rastreio_concluido',
      pedidoId: pedidoCompleto.id,
    } satisfies EstadoRastreioConcluido);
  } else {
    await atualizarEstado(conversaId, null);
  }

  const statusTexto = STATUS_LABEL[pedidoCompleto.status] ?? pedidoCompleto.status;
  const entregadorInfo = pedidoCompleto.entregador ? ` com ${pedidoCompleto.entregador.nome}` : '';
  const etaInfo =
    pedidoCompleto.status === 'saiu_entrega' &&
    pedidoCompleto.loja.tempoEntregaMin &&
    pedidoCompleto.loja.tempoEntregaMax
      ? ` Previsão: ${pedidoCompleto.loja.tempoEntregaMin}–${pedidoCompleto.loja.tempoEntregaMax} min.`
      : '';

  const texto = `Seu pedido da ${pedidoCompleto.loja.nome} está *${statusTexto}*${entregadorInfo}! 🚀${etaInfo}`;

  // "Tive um problema" só é oferecido quando o pedido é reclamável.
  const sugestoes = reclamavel
    ? ['Tive um problema com esse pedido', 'Rastrear outro pedido']
    : pedidoCompleto.status === 'cancelado'
      ? ['Buscar produtos']
      : ['Rastrear outro pedido'];

  const rastreio =
    pedidoCompleto.status === 'saiu_entrega'
      ? {
          pedidoId: pedidoCompleto.id,
          destinoLat: pedidoCompleto.enderecoEntrega.lat,
          destinoLng: pedidoCompleto.enderecoEntrega.lng,
          entregadorLat: pedidoCompleto.entregador?.ultimaLat ?? null,
          entregadorLng: pedidoCompleto.entregador?.ultimaLng ?? null,
        }
      : undefined;

  return { tipo: 'resposta', texto, sugestoes, rastreio };
}
