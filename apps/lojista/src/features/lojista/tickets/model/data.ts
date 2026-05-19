export type TicketStatus = 'aberto' | 'em_andamento' | 'resolvido';

export interface TicketNota {
  id: string;
  texto: string;
  criadoEm: string;
}

export interface Ticket {
  id: string;
  protocolo: string;
  motivo: string;
  status: TicketStatus;
  urgente: boolean;
  criadoEm: string;
  atualizadoEm: string;
  consumidor: { nome: string; telefone: string };
  pedido?: {
    id: string;
    total: number;
    criadoEm: string;
    itens: { nomeSnapshot: string; quantidade: number }[];
  };
  notas: TicketNota[];
}

export const STATUS_META: Record<TicketStatus, { label: string; bg: string; color: string; icon: string }> = {
  aberto:       { label: 'Aberto',       bg: '#FEE2E2', color: '#DC2626', icon: 'alert-circle' },
  em_andamento: { label: 'Em andamento', bg: '#DBEAFE', color: '#2563EB', icon: 'time' },
  resolvido:    { label: 'Resolvido',    bg: '#DCFCE7', color: '#16A34A', icon: 'checkmark-circle' },
};

export const STATUS_NEXT: Record<TicketStatus, TicketStatus | null> = {
  aberto:       'em_andamento',
  em_andamento: 'resolvido',
  resolvido:    null,
};

export const STATUS_NEXT_LABEL: Record<TicketStatus, string | null> = {
  aberto:       'Iniciar atendimento',
  em_andamento: 'Marcar como resolvido',
  resolvido:    null,
};

export const FILTERS: { id: 'todos' | TicketStatus; label: string }[] = [
  { id: 'todos',       label: 'Todos' },
  { id: 'aberto',      label: 'Abertos' },
  { id: 'em_andamento', label: 'Em andamento' },
  { id: 'resolvido',   label: 'Resolvidos' },
];

export function mapTicket(raw: any): Ticket {
  return {
    id:           raw.id,
    protocolo:    raw.protocolo,
    motivo:       raw.motivo,
    status:       raw.status as TicketStatus,
    urgente:      raw.urgente ?? false,
    criadoEm:     raw.criadoEm ?? raw.criado_em,
    atualizadoEm: raw.atualizadoEm ?? raw.atualizado_em ?? raw.criadoEm,
    consumidor:   { nome: raw.consumidor?.nome ?? '—', telefone: raw.consumidor?.telefone ?? '—' },
    pedido:       raw.pedido
      ? {
          id:       raw.pedido.id,
          total:    Number(raw.pedido.total ?? 0),
          criadoEm: raw.pedido.criadoEm ?? raw.pedido.criado_em,
          itens:    (raw.pedido.itens ?? []).map((it: any) => ({
            nomeSnapshot: it.nomeSnapshot ?? it.nome_snapshot ?? '',
            quantidade:   it.quantidade ?? 1,
          })),
        }
      : undefined,
    notas: (raw.notas ?? []).map((n: any) => ({
      id:       n.id,
      texto:    n.texto,
      criadoEm: n.criadoEm ?? n.criado_em,
    })),
  };
}
