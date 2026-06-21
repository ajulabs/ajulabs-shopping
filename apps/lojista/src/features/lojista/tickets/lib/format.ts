export function dataCurta(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}

export function dataCompleta(iso: string) {
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export const brl = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
