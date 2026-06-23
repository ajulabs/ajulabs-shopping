import { useEffect, useState } from 'react';
import { EntregadorService } from '../../../../shared/lib/authServices';
import { useAuthEntregadorStore } from '../../../../store';
import type { RideWithStage } from '../../../../entities/corrida';
import type { EntregaFilter } from '../ui/components/EntregasFilterBar';

export interface EntregaHistorico {
  id: string;
  valorRecebido: number;
  bonus: number | null;
  criadoEm: string;
  pedido: {
    id: string;
    loja: { nome: string } | null;
    enderecoEntrega: { bairro: string; cidade: string } | null;
  } | null;
}

export interface CancelamentoHistorico {
  id: string;
  motivo: 'area_risco' | 'pneu_furou' | 'acidente';
  criadoEm: string;
  pedido: {
    id: string;
    loja: { nome: string } | null;
    enderecoEntrega: { bairro: string; cidade: string } | null;
  } | null;
}

export type HistoricoItem =
  | { kind: 'entrega'; data: EntregaHistorico }
  | { kind: 'cancelamento'; data: CancelamentoHistorico };

export function useEntregasAndamento(rides: RideWithStage[]) {
  const token = useAuthEntregadorStore((s) => s.token);
  const slots = 2 - rides.length;

  const [entregas, setEntregas] = useState<EntregaHistorico[]>([]);
  const [cancelamentos, setCancelamentos] = useState<CancelamentoHistorico[]>([]);
  const [loadingHistorico, setLoadingHistorico] = useState(true);
  const [filter, setFilter] = useState<EntregaFilter>('todos');

  useEffect(() => {
    if (!token) return;
    setLoadingHistorico(true);
    Promise.all([
      EntregadorService.listarEntregas(token).catch(() => [] as EntregaHistorico[]),
      EntregadorService.listarCancelamentos(token).catch(() => [] as CancelamentoHistorico[]),
    ])
      .then(([es, cs]) => {
        setEntregas(es);
        setCancelamentos(cs);
      })
      .finally(() => setLoadingHistorico(false));
  }, [token]);

  const historicoAll: HistoricoItem[] = [
    ...entregas.map((e) => ({ kind: 'entrega' as const, data: e })),
    ...cancelamentos.map((c) => ({ kind: 'cancelamento' as const, data: c })),
  ].sort((a, b) => new Date(b.data.criadoEm).getTime() - new Date(a.data.criadoEm).getTime());

  const counts: Record<EntregaFilter, number> = {
    todos: rides.length + historicoAll.length,
    em_andamento: rides.length,
    entregue: entregas.length,
    cancelado: cancelamentos.length,
  };

  const filters: { id: EntregaFilter; label: string }[] = [
    { id: 'todos', label: 'Todos' },
    { id: 'em_andamento', label: 'Andamento' },
    { id: 'entregue', label: 'Entregues' },
    { id: 'cancelado', label: 'Cancelados' },
  ];

  const mostrarRides = filter === 'todos' || filter === 'em_andamento';
  const historicoFiltrado =
    filter === 'todos'
      ? historicoAll
      : filter === 'entregue'
        ? historicoAll.filter((i) => i.kind === 'entrega')
        : filter === 'cancelado'
          ? historicoAll.filter((i) => i.kind === 'cancelamento')
          : [];

  return {
    slots,
    loadingHistorico,
    filter,
    setFilter,
    counts,
    filters,
    mostrarRides,
    historicoFiltrado,
  };
}
