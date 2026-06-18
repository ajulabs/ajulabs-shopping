export function formatCEP(value: string): string {
  const d = value.replace(/\D/g, '').slice(0, 8);
  return d.length > 5 ? `${d.slice(0, 5)}-${d.slice(5)}` : d;
}

export function iconeApelido(apelido: string): string {
  const a = apelido.toLowerCase();
  if (a.includes('casa') || a.includes('home')) return 'home';
  if (a.includes('trabalho') || a.includes('work') || a.includes('emprego')) return 'briefcase';
  return 'location';
}
