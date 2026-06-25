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
      .then((data) => setDashboard(data as DashboardData))
      .finally(() => setLoading(false));
  }, [lojaId, token]);

  const raw = period === 'dia' ? dashboard?.hoje : dashboard?.mes;
  const periodLabel = period === 'dia' ? 'VENDAS · HOJE' : 'VENDAS · MÊS';
  const faturamento = Number(raw?.faturamento ?? 0);
  const qtdPedidos = Number(raw?.pedidos ?? 0);
  const valor = raw ? brl(faturamento) : 'R$ –';
  const pedidos = raw ? String(qtdPedidos) : '–';
  const ticket = raw ? brl(qtdPedidos > 0 ? faturamento / qtdPedidos : 0) : 'R$ –';
  const topProduto = dashboard?.produtosMaisVendidos?.[0]?.nome ?? '–';
  const bars: number[] = [0, 0, 0, 0, 0, 0, Number(dashboard?.hoje?.faturamento ?? 0)];

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
