export type TicketStatus = 'aberto' | 'em_andamento' | 'resolvido' | 'cancelado';

export interface TicketMensagem {
  id: string;
  remetente: 'consumidor' | 'lojista';
  texto: string;
  criadoEm: string;
}

export interface TicketConsumidor {
  id: string;
  protocolo: string;
  motivo: string;
  status: TicketStatus;
  criadoEm: string;
  atualizadoEm: string;
  avaliacaoConsumidor: number | null;
  loja?: { nome: string };
  pedido?: {
    id: string;
    total: number;
    criadoEm: string;
    itens: { nomeSnapshot: string; quantidade: number }[];
  };
  mensagens: TicketMensagem[];
}

export const STATUS_META: Record<
  TicketStatus,
  { label: string; color: string; bg: string; icon: string }
> = {
  aberto: { label: 'Aberto', color: '#DC2626', bg: '#FEE2E2', icon: 'alert-circle-outline' },
  em_andamento: { label: 'Em andamento', color: '#2563EB', bg: '#DBEAFE', icon: 'time-outline' },
  resolvido: {
    label: 'Resolvido',
    color: '#16A34A',
    bg: '#DCFCE7',
    icon: 'checkmark-circle-outline',
  },
  cancelado: { label: 'Cancelado', color: '#6B7390', bg: '#EEF0F7', icon: 'close-circle-outline' },
};

export function tempoRelativo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return 'Agora';
  if (min < 60) return `${min}min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

export function mapTicketConsumidor(raw: any): TicketConsumidor {
  return {
    id: raw.id,
    protocolo: raw.protocolo,
    motivo: raw.motivo,
    status: raw.status as TicketStatus,
    criadoEm: raw.criadoEm ?? raw.criado_em,
    atualizadoEm: raw.atualizadoEm ?? raw.atualizado_em ?? raw.criadoEm,
    avaliacaoConsumidor: raw.avaliacaoConsumidor ?? raw.avaliacao_consumidor ?? null,
    loja: raw.loja ? { nome: raw.loja.nome } : undefined,
    pedido: raw.pedido
      ? {
          id: raw.pedido.id,
          total: Number(raw.pedido.total ?? 0),
          criadoEm: raw.pedido.criadoEm ?? raw.pedido.criado_em,
          itens: (raw.pedido.itens ?? []).map((it: any) => ({
            nomeSnapshot: it.nomeSnapshot ?? it.nome_snapshot ?? '',
            quantidade: it.quantidade ?? 1,
          })),
        }
      : undefined,
    mensagens: (raw.mensagens ?? [])
      .map((m: any) => ({
        id: m.id,
        remetente: m.remetente as 'consumidor' | 'lojista',
        texto: m.texto,
        criadoEm: m.criadoEm ?? m.criado_em,
      }))
      .sort(
        (a: TicketMensagem, b: TicketMensagem) =>
          new Date(a.criadoEm).getTime() - new Date(b.criadoEm).getTime(),
      ),
  };
}
