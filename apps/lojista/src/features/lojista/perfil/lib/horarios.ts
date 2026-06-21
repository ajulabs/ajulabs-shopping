export interface HorarioDia {
  dia: string;
  abreviacao: string;
  ativo: boolean;
  abertura: string;
  fechamento: string;
}

export interface CategoriaItem {
  label: string;
  icone: string;
}

export const HORARIOS_INICIAIS: HorarioDia[] = [
  { dia: 'Segunda-feira', abreviacao: 'Seg', ativo: true, abertura: '08:00', fechamento: '18:00' },
  { dia: 'Terça-feira', abreviacao: 'Ter', ativo: true, abertura: '08:00', fechamento: '18:00' },
  { dia: 'Quarta-feira', abreviacao: 'Qua', ativo: true, abertura: '08:00', fechamento: '18:00' },
  { dia: 'Quinta-feira', abreviacao: 'Qui', ativo: true, abertura: '08:00', fechamento: '18:00' },
  { dia: 'Sexta-feira', abreviacao: 'Sex', ativo: true, abertura: '08:00', fechamento: '18:00' },
  { dia: 'Sábado', abreviacao: 'Sáb', ativo: true, abertura: '09:00', fechamento: '14:00' },
  { dia: 'Domingo', abreviacao: 'Dom', ativo: false, abertura: '--:--', fechamento: '--:--' },
];

export function formatarHora(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}:${digits.slice(2)}`;
}
