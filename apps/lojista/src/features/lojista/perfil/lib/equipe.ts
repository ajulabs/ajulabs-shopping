import type { PapelColaborador } from '@ajulabs/types';

export const PAPEL_CFG: Record<PapelColaborador, { label: string; cor: string; bg: string }> = {
  admin: { label: 'Admin', cor: '#7C3AED', bg: '#F3E8FF' },
  gerente: { label: 'Gerente', cor: '#2563EB', bg: '#DBEAFE' },
  funcionario: { label: 'Funcionário', cor: '#059669', bg: '#D1FAE5' },
};

export const PAPEIS: PapelColaborador[] = ['admin', 'gerente', 'funcionario'];

export interface FormColaborador {
  nome: string;
  email: string;
  senha: string;
  papel: PapelColaborador;
}

export const FORM_VAZIO: FormColaborador = { nome: '', email: '', senha: '', papel: 'funcionario' };
