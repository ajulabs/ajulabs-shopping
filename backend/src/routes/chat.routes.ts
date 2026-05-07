import { Router, Request, Response } from 'express';
import { z } from 'zod';
import OpenAI, { toFile } from 'openai';
import multer from 'multer';

const router = Router();

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

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

const mensagemSchema = z.object({
  texto: z.string().min(1).max(1000),
  historico: z.array(z.object({
    remetente: z.enum(['usuario', 'aju']),
    conteudo: z.string(),
  })).default([]),
});

// POST /chat/mensagem
router.post('/mensagem', async (req: Request, res: Response) => {
  try {
    const { texto, historico } = mensagemSchema.parse(req.body);

    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...historico.map(m => ({
        role: m.remetente === 'usuario' ? 'user' : 'assistant',
        content: m.conteudo,
      } as OpenAI.Chat.ChatCompletionMessageParam)),
      { role: 'user', content: texto },
    ];

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      max_tokens: 600,
      response_format: { type: 'json_object' },
      messages,
    });

    const raw = completion.choices[0]?.message?.content ?? '{}';
    res.json(JSON.parse(raw));
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: error.errors });
    console.error(error);
    res.status(500).json({ texto: 'Eita, tive um probleminha aqui. Tenta de novo!' });
  }
});

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 25 * 1024 * 1024 } });

// POST /chat/transcricao  (multipart/form-data, campo: "audio")
router.post('/transcricao', upload.single('audio'), async (req: Request, res: Response) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Arquivo de áudio ausente' });

    const file = await toFile(req.file.buffer, req.file.originalname || 'audio.m4a', {
      type: req.file.mimetype || 'audio/m4a',
    });

    const transcricao = await openai.audio.transcriptions.create({
      file,
      model: 'whisper-1',
      language: 'pt',
    });

    res.json({ texto: transcricao.text });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao transcrever áudio' });
  }
});

export default router;
