import type { Period } from './types';

export const WEEKDAYS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

export const PERIODS: { key: Period; label: string }[] = [
  { key: 'dia', label: 'Hoje' },
  { key: 'mes', label: 'Mês' },
];
