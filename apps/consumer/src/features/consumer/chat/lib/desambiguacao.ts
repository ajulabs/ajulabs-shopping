export interface Desambiguacao {
  label: string;
  msg: string;
}

/**
 * Sugestões contextuais derivadas do que o usuário está digitando — ex.: só
 * dígitos viram "produtos até R$ X" ou "rastrear pedido"; "R$ ..." vira busca
 * por orçamento.
 */
export function getDesambiguacao(input: string, carregando: boolean): Desambiguacao[] {
  const trimmed = input.trim();
  if (!trimmed || carregando) return [];

  if (/^\d+$/.test(trimmed) && trimmed.length <= 6) {
    // O backend não busca pedido por número (são UUIDs) — oferece o rastreio padrão
    // (lista + seleção) em vez de prometer um lookup que não existe.
    return [
      { label: `🔍 Produtos até R$ ${trimmed}`, msg: `Quero produtos até R$ ${trimmed}` },
      { label: `📦 Rastrear um pedido`, msg: `Quero rastrear meu pedido` },
    ];
  }

  if (/^r\$?\s*\d+/i.test(trimmed)) {
    return [
      {
        label: `🔍 Buscar com esse orçamento`,
        msg: `Quero produtos com orçamento de ${trimmed}`,
      },
    ];
  }

  return [];
}
