import { useState, useEffect } from 'react';
import { EntregadorService } from '../../../../shared/lib/authServices';
import { useAuthEntregadorStore } from '../../../../store';

const WEEKDAY_LABELS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

function buildWeekdayLabels(dailyData: any[] | null): string[] {
  if (dailyData) {
    return dailyData.slice(-7).map((d: any) => {
      if (!d.dia && !d.data) return '–';
      const date = new Date(d.dia ?? d.data);
      return WEEKDAY_LABELS[date.getDay()];
    });
  }
  const today = new Date().getDay();
  return Array.from({ length: 7 }, (_, i) => WEEKDAY_LABELS[(today - 6 + i + 7) % 7]);
}

export function useEarnings() {
  const token = useAuthEntregadorStore((s) => s.token);
  const [ganhos, setGanhos] = useState<any>(null);
  const [entregas, setEntregas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPix, setShowPix] = useState(false);
  const [selectedDay, setSelectedDay] = useState<number>(6);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }
    Promise.all([
      EntregadorService.buscarGanhos(token).catch(() => null),
      EntregadorService.listarEntregas(token).catch(() => []),
    ])
      .then(([g, e]) => {
        setGanhos(g);
        setEntregas(e ?? []);
      })
      .finally(() => setLoading(false));
  }, [token]);

  const ganhoSemana = Number(ganhos?.semana?.total ?? 0);
  const corridasSemana = Number(ganhos?.semana?.corridas ?? 0);
  const dailyData: any[] | null = ganhos?.porDia ?? ganhos?.dias ?? null;
  const SALES_7D = dailyData
    ? dailyData.slice(-7).map((d: any) => Number(d.total ?? d.ganho ?? 0))
    : [0, 0, 0, 0, 0, 0, ganhoSemana];
  const weekLabels = buildWeekdayLabels(dailyData);
  const max = Math.max(...SALES_7D, 1);
  const totalSemana = ganhoSemana;

  const selectedValue = SALES_7D[selectedDay] ?? 0;
  const selectedLabel = weekLabels[selectedDay] ?? '–';
  const selectedDailyEntry = dailyData ? dailyData.slice(-7)[selectedDay] : null;
  const selectedCorridas = selectedDailyEntry?.corridas ?? selectedDailyEntry?.total_corridas ?? 0;
  const selectedDate = selectedDailyEntry
    ? new Date(selectedDailyEntry.dia ?? selectedDailyEntry.data).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'short',
      })
    : null;

  return {
    ganhos,
    entregas,
    loading,
    showPix,
    setShowPix,
    selectedDay,
    setSelectedDay,
    ganhoSemana,
    corridasSemana,
    dailyData,
    SALES_7D,
    weekLabels,
    max,
    totalSemana,
    selectedValue,
    selectedLabel,
    selectedCorridas,
    selectedDate,
  };
}
