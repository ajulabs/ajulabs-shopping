import { useState, useEffect } from 'react';
import { LojistaService } from '@ajulabs/api-client';
import { useAuthLojistaStore } from '../../../../store';
import { brl } from '../lib/format';
import type { Period, DashboardData } from '../lib/types';

export function useVendas() {
  const token = useAuthLojistaStore((s) => s.token);
  const lojaId = useAuthLojistaStore((s) => s.lojaId);
  const lojaNome = useAuthLojistaStore((s) => s.lojaNome);

  const [period, setPeriod] = useState<Period>('dia');
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!lojaId || !token) {
      setLoading(false);
      return;
    }
    LojistaService.buscarDashboard(lojaId, token)
      .then((data) => setDashboard(data))
      .finally(() => setLoading(false));
  }, [lojaId, token]);

  const raw = period === 'dia' ? dashboard?.hoje : dashboard?.mes;
  const periodLabel = period === 'dia' ? 'VENDAS · HOJE' : 'VENDAS · MÊS';
  const valor = raw ? brl(Number(raw.receita ?? 0)) : 'R$ –';
  const pedidos = raw ? String(raw.pedidos ?? 0) : '–';
  const ticket = raw ? brl(Number(raw.ticketMedio ?? 0)) : 'R$ –';
  const topProduto = dashboard?.mes?.topProdutos?.[0]?.nome ?? '–';
  const bars: number[] = [0, 0, 0, 0, 0, 0, Number(dashboard?.hoje?.receita ?? 0)];

  return {
    lojaNome,
    period,
    setPeriod,
    loading,
    periodLabel,
    valor,
    pedidos,
    ticket,
    topProduto,
    bars,
  };
}
