import { validateCNPJ } from './validateCNPJ';

export interface FormData {
  cnpj: string;
  nomeLoja: string;
  telefone: string;
  telefoneCompleto: string;
  email: string;
  senha: string;
  confirmarSenha: string;
}

export interface EnderecoLoja {
  cep: string;
  rua: string;
  numero: string;
  bairro: string;
}

export function validateCadastro(
  form: FormData,
  endereco: EnderecoLoja,
  aceitouTermos: boolean,
): Record<string, string> {
  const errs: Record<string, string> = {};
  const cnpjDigits = form.cnpj.replace(/\D/g, '');
  if (cnpjDigits.length < 14) errs.cnpj = 'CNPJ incompleto — informe os 14 dígitos.';
  else if (!validateCNPJ(form.cnpj)) errs.cnpj = 'CNPJ inválido. Verifique os números digitados.';
  if (!form.nomeLoja.trim()) errs.nomeLoja = 'Informe o nome da loja.';
  if (form.telefoneCompleto.replace(/\D/g, '').length < 10) errs.telefone = 'Telefone inválido.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(form.email.trim())) errs.email = 'Email inválido.';
  if (form.senha.length < 8) errs.senha = 'Mínimo 8 caracteres.';
  else if (!/[A-Z]/.test(form.senha)) errs.senha = 'Inclua ao menos 1 letra maiúscula.';
  else if (!/[0-9]/.test(form.senha)) errs.senha = 'Inclua ao menos 1 número.';
  if (!form.confirmarSenha) errs.confirmarSenha = 'Confirme sua senha.';
  else if (form.senha !== form.confirmarSenha) errs.confirmarSenha = 'As senhas não coincidem.';
  if (!endereco.cep) errs.cep = 'Informe o CEP da loja.';
  else if (endereco.cep.length < 8) errs.cep = 'CEP incompleto — informe os 8 dígitos.';
  if (!endereco.rua.trim()) errs.rua = 'Informe a rua ou avenida da loja.';
  if (!endereco.bairro.trim()) errs.bairro = 'Informe o bairro da loja.';
  if (!aceitouTermos) errs.termos = 'Aceite os Termos de Uso para continuar.';
  return errs;
}
