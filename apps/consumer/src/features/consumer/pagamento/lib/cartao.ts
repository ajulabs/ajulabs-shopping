export interface Cartao {
  id: string;
  apelido: string;
  bandeira: 'Visa' | 'Mastercard' | 'Elo' | 'Outro';
  ultimos4: string;
  titular: string;
}

export function detectarBandeira(num: string): Cartao['bandeira'] {
  if (num.startsWith('4')) return 'Visa';
  if (num.startsWith('5')) return 'Mastercard';
  if (num.startsWith('6')) return 'Elo';
  return 'Outro';
}

export function formatarNumero(v: string) {
  return v
    .replace(/\D/g, '')
    .slice(0, 16)
    .replace(/(\d{4})(?=\d)/g, '$1 ');
}

export function formatarValidade(v: string) {
  const d = v.replace(/\D/g, '').slice(0, 4);
  return d.length >= 3 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
}
