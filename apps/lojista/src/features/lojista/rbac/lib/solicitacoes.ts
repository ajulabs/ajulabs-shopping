import type { StatusSolicitacaoPreco } from '@ajulabs/types';

export const STATUS_CFG: Record<
  StatusSolicitacaoPreco,
  { label: string; color: string; bg: string }
> = {
  pendente: { label: 'Pendente', color: '#D97706', bg: '#FEF3C7' },
  aprovado: { label: 'Aprovado', color: '#059669', bg: '#D1FAE5' },
  rejeitado: { label: 'Rejeitado', color: '#DC2626', bg: '#FEE2E2' },
};

export function moeda(valor: number) {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}
