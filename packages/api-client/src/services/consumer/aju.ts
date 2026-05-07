import { MensagemChat, RespostaAju } from "@ajulabs/types";

declare const process: { env: Record<string, string | undefined> };
const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';

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

    if (!response.ok) throw new Error('Erro na resposta da Aju');
    return await response.json() as RespostaAju;
  } catch {
    return { texto: 'Eita, tive um probleminha aqui. Tenta de novo!' };
  }
}
