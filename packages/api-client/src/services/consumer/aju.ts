import { MensagemChat, RespostaAju } from "@ajulabs/types";

declare const process: { env: Record<string, string | undefined> };
const API_URL = (process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000').replace(/\/$/, '');

export async function matchAju(
  historico: MensagemChat[],
  textoUsuario: string
): Promise<RespostaAju> {
  try {
    const response = await fetch(`${API_URL}/chat/mensagem`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        texto: textoUsuario,
        historico: historico.map(m => ({
          remetente: m.remetente,
          conteudo: m.conteudo,
        })),
      }),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const errMsg = typeof data.debug === 'string' ? data.debug
        : typeof data.error === 'string' ? data.error
        : typeof data.texto === 'string' ? data.texto
        : `Erro ${response.status}`;
      throw new Error(errMsg);
    }

    return data as RespostaAju;
  } catch (err) {
    console.error('[matchAju]', err);
    const msg = err instanceof Error ? err.message : 'Eita, tive um probleminha aqui. Tenta de novo!';
    return { texto: msg };
  }
}
