// src/features/consumer/chat/logic/matchAju.ts
import { MensagemChat } from "../../types";

export async function matchAju(
  historico: MensagemChat[],
  textoUsuario: string
): Promise<string> {
  const messages = historico.map((m) => ({
    role: m.remetente === 'usuario' ? 'user' : 'assistant',
    content: m.conteudo,
  }));

  messages.push({ role: 'user', content: textoUsuario });

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY ?? '',
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-opus-4-5',
        max_tokens: 400,
        system: `Você é a Aju, personal shopper do marketplace local de Aracaju (Sergipe).
        Responda de forma curta, animada e com sotaque regional sergipano.
        Sugira produtos das lojas locais de Aracaju. Nunca mencione Amazon, iFood ou Shopee.
        Responda sempre em português do Brasil.`,
        messages,
      }),
    });

    const data = await response.json();
    return data.content?.[0]?.text ?? 'Deixa eu verificar nas lojas daqui...';
  } catch {
    return 'Eita, tive um probleminha aqui. Tenta de novo!';
  }
}