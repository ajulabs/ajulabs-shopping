import { z } from 'zod';

export function validarCPF(cpf: string): boolean {
  const raw = cpf.replace(/\D/g, '');
  if (raw.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(raw)) return false;

  const calcDigito = (slice: string, len: number): number => {
    let sum = 0;
    for (let i = 0; i < len; i++) {
      sum += parseInt(slice[i]) * (len + 1 - i);
    }
    const rem = (sum * 10) % 11;
    return rem >= 10 ? 0 : rem;
  };

  return (
    calcDigito(raw, 9) === parseInt(raw[9]) &&
    calcDigito(raw, 10) === parseInt(raw[10])
  );
}

export function validarCNPJ(cnpj: string): boolean {
  const raw = cnpj.replace(/\D/g, '');
  if (raw.length !== 14) return false;
  if (/^(\d)\1{13}$/.test(raw)) return false;

  const calcDigito = (slice: string, weights: number[]): number => {
    let sum = 0;
    for (let i = 0; i < weights.length; i++) {
      sum += parseInt(slice[i]) * weights[i];
    }
    const rem = sum % 11;
    return rem < 2 ? 0 : 11 - rem;
  };

  const d1 = calcDigito(raw, [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  const d2 = calcDigito(raw, [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);

  return d1 === parseInt(raw[12]) && d2 === parseInt(raw[13]);
}

export const cpfSchema = z
  .string()
  .transform((v) => v.replace(/\D/g, ''))
  .refine(validarCPF, { message: 'CPF inválido' });

export const cnpjSchema = z
  .string()
  .transform((v) => v.replace(/\D/g, ''))
  .refine(validarCNPJ, { message: 'CNPJ inválido' });

export const senhaForteSchema = z
  .string()
  .min(8, 'Senha deve ter no mínimo 8 caracteres')
  .regex(/[A-Z]/, 'Senha deve conter pelo menos 1 letra maiúscula')
  .regex(/[0-9]/, 'Senha deve conter pelo menos 1 número');

export const emailSchema = z.string().email('Email inválido');
