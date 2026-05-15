import { Router, Response } from 'express';
import { z } from 'zod';
import OpenAI, { toFile } from 'openai';
import multer from 'multer';
import { prisma } from '../utils/prisma';
import { authMiddleware, authUsuario, AuthRequest } from '../middleware/auth';
import { buscarProdutosRAG, buscarProdutosFallback, ProdutoRAG } from '../utils/ragSearch';

const router = Router();

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const SYSTEM_PROMPT = `Você é a Aju, personal shopper do marketplace local de Aracaju (Sergipe).
Responda SEMPRE com um JSON válido, sem markdown, sem explicações fora do JSON.

Formato obrigatório:
{
  "texto": "mensagem curta e animada em português, com sotaque sergipano",
  "produtos": ["uuid-produto-1", "uuid-produto-2"],
  "sugestoes": ["mais barato", "só masculino", "outra cor"]
}

Regras:
- Use APENAS os ids dos produtos listados no contexto — nunca invente ids
- Inclua de 1 a 3 ids de produtos relevantes quando o usuário pedir algo para comprar
- Se não houver produtos relevantes no contexto, retorne "produtos": []
- "sugestoes" são chips de refinamento da busca, máximo 3
- Nunca mencione Amazon, iFood ou Shopee`;

function buildContexto(produtos: ProdutoRAG[]): string {
  if (produtos.length === 0) return '\n\n=== PRODUTOS DISPONÍVEIS ===\nNenhum produto encontrado para esta busca.';

  const linhas = produtos.map(p => {
    const taxa = p.taxaEntrega === 0 ? 'grátis' : `R$ ${p.taxaEntrega.toFixed(2)}`;
    const tags = p.tags.length ? ` [${p.tags.join(', ')}]` : '';
    return `• id:${p.id} | ${p.nome} | R$ ${p.preco.toFixed(2)} | ${p.categoria}${tags} | ${p.loja} | entrega: ${p.tempoEntrega} | taxa: ${taxa}`;
  });

  return `\n\n=== PRODUTOS RELEVANTES (use apenas estes ids) ===\n${linhas.join('\n')}`;
}

const mensagemSchema = z.object({
  texto: z.string().min(1).max(1000),
  historico: z.array(z.object({
    remetente: z.enum(['usuario', 'aju']),
    conteudo: z.string(),
  })).default([]),
});

type ProdutoChat = {
  id: string;
  lojaId: string;
  nome: string;
  loja: string;
  preco: number;
  precoOriginal: number | null;
  tempoEntrega: string;
  imagemUrl: string;
};

function ragParaChat(produtos: ProdutoRAG[]): ProdutoChat[] {
  return produtos.map(p => ({
    id: p.id,
    lojaId: p.lojaId,
    nome: p.nome,
    loja: p.loja,
    preco: p.preco,
    precoOriginal: null,
    tempoEntrega: p.tempoEntrega,
    imagemUrl: p.imagemUrl,
  }));
}

// POST /chat/mensagem
router.post('/mensagem', authMiddleware, authUsuario, async (req: AuthRequest, res: Response) => {
  try {
    const { texto, historico } = mensagemSchema.parse(req.body);

    // Busca semântica: TOP-8 produtos relevantes para a mensagem do usuário
    const produtosRAG = await buscarProdutosRAG(texto);

    const systemPrompt = SYSTEM_PROMPT + buildContexto(produtosRAG);

    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: 'system', content: systemPrompt },
      ...historico.map(m => ({
        role: m.remetente === 'usuario' ? 'user' : 'assistant',
        content: m.conteudo,
      } as OpenAI.Chat.ChatCompletionMessageParam)),
      { role: 'user', content: texto },
    ];

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      max_tokens: 500,
      response_format: { type: 'json_object' },
      messages,
    });

    const raw = completion.choices[0]?.message?.content ?? '{}';
    const resposta = JSON.parse(raw);

    // Mapeia os ids retornados pela IA contra os produtos do RAG (sem query extra ao banco)
    const idsRetornados: string[] = Array.isArray(resposta.produtos)
      ? resposta.produtos.map((id: unknown) => String(id)).filter(Boolean)
      : [];

    const produtosValidados = idsRetornados.length > 0
      ? ragParaChat(produtosRAG.filter(p => idsRetornados.includes(p.id)))
      : [];

    // Fallback: se RAG não teve resultados e a IA não retornou nada, usa busca por keyword
    const produtosFinais = produtosValidados.length > 0
      ? produtosValidados
      : produtosRAG.length === 0
        ? ragParaChat(await buscarProdutosFallback(texto))
        : [];

    resposta.produtos = produtosFinais;

    res.json(resposta);
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: error.errors });
    const msg = error instanceof Error ? error.message : String(error);
    console.error('[chat/mensagem]', msg);
    res.status(500).json({
      texto: 'Eita, tive um probleminha aqui. Tenta de novo!',
      ...(process.env.NODE_ENV !== 'production' && { debug: msg }),
    });
  }
});

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 25 * 1024 * 1024 } });

// POST /chat/transcricao  (multipart/form-data, campo: "audio")
router.post('/transcricao', authMiddleware, authUsuario, upload.single('audio'), async (req: AuthRequest, res: Response) => {
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
