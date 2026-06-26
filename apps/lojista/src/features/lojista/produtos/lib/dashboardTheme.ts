import { NivelEstoque } from '@ajulabs/types';
import { useTheme } from '../../../../shared/hooks';

/** Paleta local do dashboard de estoque (cores fixas, não dependem do tema). */
export const C = {
  bg: '#F1F5F9',
  card: '#FFFFFF',
  border: '#E2E8F0',
  text: '#0F172A',
  sub: '#64748B',
  mute: '#CBD5E1',
  green: '#10B981',
  red: '#EF4444',
  amber: '#F59E0B',
  slate: '#64748B',
  orange: '#F2760F',
  navy: '#0F172A',
};

/** Config visual (cor/label/ícone) por nível de estoque no dashboard. */
export const NIVEL_CFG: Record<NivelEstoque, { color: string; label: string; icon: string }> = {
  saudavel: { color: C.green, label: 'Saudável', icon: 'checkmark-circle' },
  atencao: { color: C.amber, label: 'Atenção', icon: 'alert-circle' },
  critico: { color: C.red, label: 'Crítico', icon: 'close-circle' },
  zerado: { color: C.slate, label: 'Zerado', icon: 'remove-circle' },
};

/**
 * Versão sensível ao tema da paleta do dashboard de estoque.
 * Cores ESTRUTURAIS (bg/card/border/text/sub/mute) seguem o tema;
 * cores de STATUS/marca (green/red/amber/slate/orange/navy) ficam fixas.
 */
export function useDashboardC() {
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

export type DashboardC = ReturnType<typeof useDashboardC>;
