import { useThemeStore } from '../../store';
import { colors } from '@ajulabs/theme';

export interface Theme {
  isDark: boolean;
  bg: string;
  surf: string;
  border: string;
  borderL: string;
  text: string;
  textSec: string;
  textMut: string;
  iconBg: string;
  backBtn: string;
  inputBg: string;
}

export function useTheme(): Theme {
  const isDark = useThemeStore((s) => s.isDark);
  return {
    isDark,
    bg: isDark ? colors.bgDark : '#FAFBFE',
    surf: isDark ? colors.surfDark : colors.n0,
    border: isDark ? 'rgba(255,255,255,0.08)' : colors.n200,
    borderL: isDark ? 'rgba(255,255,255,0.05)' : colors.n100,
    text: isDark ? colors.n0 : colors.navy,
    textSec: isDark ? 'rgba(255,255,255,0.55)' : colors.n600,
    textMut: isDark ? 'rgba(255,255,255,0.40)' : colors.n500,
    iconBg: isDark ? 'rgba(255,255,255,0.08)' : colors.orange100,
    backBtn: isDark ? 'rgba(255,255,255,0.08)' : colors.n50,
    inputBg: isDark ? 'rgba(255,255,255,0.06)' : colors.n0,
  };
}
