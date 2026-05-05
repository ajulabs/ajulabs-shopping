// src/services/consumer/aju.ts
import { MensagemChat, RespostaAju } from "@ajulabs/types";

const SYSTEM_PROMPT = `Você é a Aju, personal shopper do marketplace local de Aracaju (Sergipe).
Responda SEMPRE com um JSON válido, sem markdown, sem explicações fora do JSON.

Formato obrigatório:
{
  "texto": "mensagem curta e animada em português, com sotaque sergipano",
  "produtos": [
    {
      "id": "1",
      "nome": "Nome do Produto",
      "loja": "Nome da Loja — Categoria",
      "preco": 189.90,
      "precoOriginal": 249.90,
      "tempoEntrega": "25–40 min",
      "imagemUrl": ""
    }
  ],
  "sugestoes": ["mais barato", "só masculino", "outra cor"]
}

Regras:
- "produtos" só aparece quando o usuário pede algo específico para comprar
- Máximo 3 produtos por resposta
- Nunca mencione Amazon, iFood ou Shopee
- Só sugira lojas de Aracaju
- "sugestoes" são chips que refinam a busca, máximo 3`;

export async function matchAju(
  historico: MensagemChat[],
  textoUsuario: string
): Promise<RespostaAju> {
  const messages = historico.map((m) => ({
    role: m.remetente === 'usuario' ? 'user' : 'assistant',
    content: m.conteudo,
  }));

  messages.push({ role: 'user', content: textoUsuario });

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.EXPO_PUBLIC_OPENAI_API_KEY ?? ''}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        max_tokens: 600,
        response_format: { type: 'json_object' }, // força JSON puro
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          ...messages,
        ],
      }),
    });

    const data = await response.json();
    const raw = data.choices?.[0]?.message?.content ?? '{}';
    return JSON.parse(raw) as RespostaAju;
  } catch {
    return { texto: 'Eita, tive um probleminha aqui. Tenta de novo!' };
  }
}