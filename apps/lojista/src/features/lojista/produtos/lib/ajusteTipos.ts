import { TipoAjuste } from '../model/useAjusteEstoque';
import { useTheme } from '../../../../shared/hooks';

/** Paleta local do modal de ajuste de estoque. */
export const C = {
  bg: '#F8FAFC',
  card: '#FFFFFF',
  border: '#E2E8F0',
  text: '#0F172A',
  sub: '#64748B',
  mute: '#94A3B8',
  orange: '#F2760F',
};

/** Mantém apenas dígitos (web/teclado físico ignoram keyboard="number-pad"). */
export const onlyDigits = (v: string) => v.replace(/[^0-9]/g, '');
export const MAX_QTY_LEN = 6;

export const TIPOS: {
  tipo: TipoAjuste;
  label: string;
  desc: string;
  hint: string;
  icon: string;
  color: string;
}[] = [
  {
    tipo: 'entrada_manual',
    label: 'Entrada',
    desc: 'Adicionar unidades',
    hint: 'Use quando chegar mercadoria. A quantidade informada é somada ao estoque atual.',
    icon: 'arrow-down-circle',
    color: '#10B981',
  },
  {
    tipo: 'saida_manual',
    label: 'Saída',
    desc: 'Remover unidades',
    hint: 'Use para registrar perdas, quebras ou consumos. A quantidade é subtraída do estoque atual.',
    icon: 'arrow-up-circle',
    color: '#F43F5E',
  },
  {
    tipo: 'ajuste_inventario',
    label: 'Inventário',
    desc: 'Definir total exato',
    hint: 'Use após uma contagem física. O valor informado substitui o estoque atual, independente do que estava registrado.',
    icon: 'calculator',
    color: '#A78BFA',
  },
  {
    tipo: 'devolucao',
    label: 'Devolução',
    desc: 'Retorno de produto',
    hint: 'Use quando um cliente devolver um produto. A quantidade retorna ao estoque e fica registrada separadamente no histórico.',
    icon: 'return-up-back',
    color: '#60A5FA',
  },
];

/** Versão sensível ao tema da paleta do modal de ajuste. */
export function useAjusteC() {
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
export type AjusteC = ReturnType<typeof useAjusteC>;
