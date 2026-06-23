import { validateCPF } from '../../../../shared/lib/formatCPF';
import { Data } from './constants';

export function validarPasso1(data: Data): Record<string, string> {
  const e: Record<string, string> = {};
  const nomeParts = (data.nome || '').trim().split(/\s+/);
  if (nomeParts.length < 2 || nomeParts[1].length < 2) e.nome = 'Informe seu nome e sobrenome.';
  const cpfDigits = (data.cpf || '').replace(/\D/g, '');
  if (cpfDigits.length < 11) e.cpf = 'CPF incompleto — informe os 11 dígitos.';
  else if (!validateCPF(data.cpf || '')) e.cpf = 'CPF inválido. Verifique os números digitados.';
  if ((data.celularCompleto || data.celular || '').replace(/\D/g, '').length < 10)
    e.celular = 'Celular inválido.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test((data.email || '').trim())) e.email = 'Email inválido.';
  if ((data.senha || '').length < 6) e.senha = 'Mínimo 6 caracteres.';
  if (!(data.confirmarSenha || '')) e.confirmarSenha = 'Confirme sua senha.';
  else if ((data.senha || '') !== (data.confirmarSenha || ''))
    e.confirmarSenha = 'As senhas não coincidem.';
  return e;
}
