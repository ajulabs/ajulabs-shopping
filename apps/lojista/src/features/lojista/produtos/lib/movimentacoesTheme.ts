import { TipoMovimentacao } from '@ajulabs/types';

/** Paleta local da tela de movimentações de estoque. */
export const C = {
  bg: '#F8FAFC',
  card: '#FFFFFF',
  border: '#E2E8F0',
  text: '#0F172A',
  sub: '#64748B',
  mute: '#94A3B8',
  orange: '#F2760F',
  green: '#10B981',
  red: '#F43F5E',
  amber: '#F59E0B',
};

export const FILTROS: { label: string; value: TipoMovimentacao | '' }[] = [
  { label: 'Todos', value: '' },
  { label: 'Entradas', value: 'entrada_manual' },
  { label: 'Saídas', value: 'saida_manual' },
  { label: 'Inventário', value: 'ajuste_inventario' },
  { label: 'Devoluções', value: 'devolucao' },
];
