import type { Period } from './types';

export const WEEKDAYS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

export const PERIODS: { key: Period; label: string }[] = [
  { key: 'dia', label: 'Hoje' },
  { key: 'mes', label: 'Mês' },
];

// Mock data: demanda reprimida (Insight IA). Mantido verbatim — comportamento preservado.
export const INSIGHTS = [
  { rank: 1, nome: 'Chinelo slide masculino', buscas: 142, pct: '+38%' },
  { rank: 2, nome: 'Tênis branco infantil', buscas: 87, pct: '+22%' },
  { rank: 3, nome: 'Bota coturno feminina', buscas: 64, pct: '+18%' },
];
