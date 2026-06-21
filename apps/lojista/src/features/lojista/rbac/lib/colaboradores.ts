import type { PapelColaborador } from '@ajulabs/types';

export const PAPEL_LABEL: Record<PapelColaborador, string> = {
  admin: 'Administrador',
  gerente: 'Gerente',
  funcionario: 'Funcionário',
};

export const PAPEL_COLOR: Record<PapelColaborador, string> = {
  admin: '#7C3AED',
  gerente: '#2563EB',
  funcionario: '#059669',
};

export interface FormState {
  nome: string;
  email: string;
  senha: string;
  papel: PapelColaborador;
}

export const FORM_INICIAL: FormState = { nome: '', email: '', senha: '', papel: 'funcionario' };
