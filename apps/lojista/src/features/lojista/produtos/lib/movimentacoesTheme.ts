import { TipoMovimentacao } from '@ajulabs/types';
import { useTheme } from '../../../../shared/hooks';

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

/** Versão sensível ao tema (estrutura → tema; status → fixo). */
export function useMovimentacoesC() {
  const t = useTheme();
  return {
    ...C,
    bg: t.bg,
    card: t.surf,
    border: t.border,
    text: t.text,
    sub: t.textSec,
    mute: t.textMut,
  };
}

export type MovimentacoesC = ReturnType<typeof useMovimentacoesC>;
