/**
 * Se a mensagem de erro do backend contém "X minutos" ou "X segundos",
 * calcula o horário exato em que o usuário poderá tentar novamente
 * e anexa ao final da mensagem.
 *
 * Ex.: "Muitas tentativas. Tente novamente em 5 minutos."
 *   → "Muitas tentativas. Tente novamente em 5 minutos — a partir das 14:35."
 */
export function enrichRateLimit(msg: string): string {
  const minMatch = msg.match(/(\d+)\s*minuto/i);
  const secMatch = !minMatch ? msg.match(/(\d+)\s*segundo/i) : null;

  const ms = minMatch
    ? parseInt(minMatch[1], 10) * 60_000
    : secMatch
      ? parseInt(secMatch[1], 10) * 1_000
      : 0;

  if (!ms) return msg;

  const at = new Date(Date.now() + ms);
  const hhmm = at.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  return `${msg.trimEnd().replace(/\.$/, '')} — a partir das ${hhmm}.`;
}
