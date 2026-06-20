const GREEN = '#10B981';
const RED = '#F43F5E';
const AMBER = '#F59E0B';

/** Metadados (label, ícone, sinal, cor) de cada tipo de movimentação de estoque. */
export const TIPO_META: Record<
  string,
  { label: string; icon: string; positive: boolean; color: string }
> = {
  entrada_manual: {
    label: 'Entrada manual',
    icon: 'arrow-down-circle',
    positive: true,
    color: GREEN,
  },
  devolucao: { label: 'Devolução', icon: 'return-up-back', positive: true, color: GREEN },
  cancelamento: { label: 'Cancelamento', icon: 'refresh-circle', positive: true, color: GREEN },
  liberacao_reserva: { label: 'Lib. reserva', icon: 'lock-open', positive: true, color: GREEN },
  venda: { label: 'Venda', icon: 'cart', positive: false, color: RED },
  saida_manual: { label: 'Saída manual', icon: 'arrow-up-circle', positive: false, color: RED },
  ajuste_inventario: {
    label: 'Ajuste inventário',
    icon: 'calculator',
    positive: false,
    color: AMBER,
  },
  reserva: { label: 'Reserva', icon: 'lock-closed', positive: false, color: AMBER },
};

/** Rótulos curtos de tipo de movimentação (usado em listas compactas). */
export const TIPO_LABEL: Record<string, string> = {
  venda: 'Venda',
  entrada_manual: 'Entrada',
  saida_manual: 'Saída',
  ajuste_inventario: 'Inventário',
  devolucao: 'Devolução',
  cancelamento: 'Cancelamento',
};
