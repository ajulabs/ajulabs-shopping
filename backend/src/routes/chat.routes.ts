import { Router, Request, Response } from 'express';
import { z } from 'zod';
import OpenAI, { toFile } from 'openai';
import multer from 'multer';
import { prisma } from '../utils/prisma';

const router = Router();

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const SYSTEM_PROMPT_BASE = `Você é a Aju, personal shopper do marketplace local de Aracaju (Sergipe).
Responda SEMPRE com um JSON válido, sem markdown, sem explicações fora do JSON.

Formato obrigatório:
{
  "texto": "mensagem curta e animada em português, com sotaque sergipano",
  "produtos": [
    {
      "id": "uuid-real-do-produto",
      "nome": "Nome do Produto",
      "loja": "Nome da Loja — Categoria",
      "preco": 189.90,
      "precoOriginal": null,
      "tempoEntrega": "25–40 min",
      "imagemUrl": "url-real-ou-vazio"
    }
  ],
  "sugestoes": ["mais barato", "só masculino", "outra cor"]
}

Regras:
- "produtos" DEVE aparecer sempre que o usuário: pedir algo para comprar, pedir indicação de lojas, querer ver opções, mencionar qualquer categoria, ou pedir recomendações gerais — inclua sempre de 1 a 3 produtos representativos do catálogo
- Quando recomendar lojas, escolha lojas diferentes e inclua 1 produto representativo de cada
- Use APENAS lojas e produtos da lista abaixo — nunca invente lojas ou produtos
- Use o "id" real do produto exatamente como listado abaixo
- Máximo 3 produtos por resposta
- Nunca mencione Amazon, iFood ou Shopee
- "sugestoes" são chips que refinam a busca, máximo 3
- Se não houver produtos compatíveis no catálogo, diga isso honestamente`;

async function buildSystemPrompt(): Promise<string> {
  const lojas = await prisma.loja.findMany({
    where: { aberta: true },
    select: {
      nome: true,
      categoria: true,
      tempoEntregaMin: true,
      tempoEntregaMax: true,
      taxaEntrega: true,
      avaliacao: true,
      produtos: {
        where: { disponivel: true },
        select: {
          id: true,
          lojaId: true,
          nome: true,
          preco: true,
          categoria: true,
          imagemUrl: true,
          tags: true,
        },
        take: 30,
      },
    },
  });

  if (lojas.length === 0) {
    return `${SYSTEM_PROMPT_BASE}\n\n=== CATÁLOGO ===\nNenhuma loja disponível no momento.`;
  }

  const catalogo = lojas.map(loja => {
    const entrega = `${loja.tempoEntregaMin}–${loja.tempoEntregaMax} min`;
    const taxa = Number(loja.taxaEntrega) === 0 ? 'grátis' : `R$ ${Number(loja.taxaEntrega).toFixed(2)}`;
    const header = `🏪 ${loja.nome} | ${loja.categoria} | entrega: ${entrega} | taxa: ${taxa} | ⭐ ${loja.avaliacao}`;
    const itens = loja.produtos.map(p => {
      const tags = p.tags.length ? ` [${p.tags.join(', ')}]` : '';
      return `  • id:${p.id} | ${p.nome} | R$ ${Number(p.preco).toFixed(2)} | ${p.categoria}${tags} | img:${p.imagemUrl || ''}`;
    }).join('\n');
    return itens ? `${header}\n${itens}` : `${header}\n  (sem produtos disponíveis)`;
  }).join('\n\n');

  return `${SYSTEM_PROMPT_BASE}\n\n=== CATÁLOGO REAL DO MARKETPLACE ===\n${catalogo}`;
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

async function buscarProdutosReais(ids: string[], texto: string): Promise<ProdutoChat[]> {
  const include = {
    loja: { select: { nome: true, categoria: true, tempoEntregaMin: true, tempoEntregaMax: true } },
  };

  // Primeiro tenta pelos IDs que a IA retornou
  let produtos = await prisma.produto.findMany({
    where: { id: { in: ids }, disponivel: true },
    include,
    take: 3,
  });

  // Se a IA inventou IDs, busca por palavras-chave do texto do usuário
  if (produtos.length === 0 && texto.trim().length > 0) {
    const palavras = texto.trim().split(/\s+/).filter(p => p.length > 2);
    if (palavras.length > 0) {
      produtos = await prisma.produto.findMany({
        where: {
          disponivel: true,
          OR: palavras.flatMap(p => [
            { nome: { contains: p, mode: 'insensitive' as const } },
            { categoria: { contains: p, mode: 'insensitive' as const } },
            { descricao: { contains: p, mode: 'insensitive' as const } },
          ]),
        },
        include,
        take: 3,
      });
    }
  }

  // Último recurso: retorna produtos em destaque de lojas abertas distintas
  if (produtos.length === 0) {
    const lojas = await prisma.loja.findMany({
      where: { aberta: true },
      select: { id: true },
      take: 3,
    });
    if (lojas.length > 0) {
      produtos = await prisma.produto.findMany({
        where: { disponivel: true, lojaId: { in: lojas.map(l => l.id) } },
        include,
        orderBy: { criadoEm: 'desc' },  //
        take: 3,
        distinct: ['lojaId'],
      });
    }
  }

  return produtos.map(p => ({
    id: p.id,
    lojaId: p.lojaId,
    nome: p.nome,
    loja: `${p.loja.nome}${p.loja.categoria ? ` — ${p.loja.categoria}` : ''}`,
    preco: Number(p.preco),
    precoOriginal: null,
    tempoEntrega: `${p.loja.tempoEntregaMin}–${p.loja.tempoEntregaMax} min`,
    imagemUrl: p.imagemUrl ?? '',
  }));
}

// POST /chat/mensagem
router.post('/mensagem', async (req: Request, res: Response) => {
  try {
    const { texto, historico } = mensagemSchema.parse(req.body);

    const systemPrompt = await buildSystemPrompt();

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
      max_tokens: 800,
      response_format: { type: 'json_object' },
      messages,
    });

    const raw = completion.choices[0]?.message?.content ?? '{}';
    const resposta = JSON.parse(raw);

    // Validação server-side: substituir produtos pela versão real do banco
    const ids = Array.isArray(resposta.produtos)
      ? resposta.produtos.map((p: any) => String(p.id ?? '')).filter(Boolean)
      : [];
    resposta.produtos = await buscarProdutosReais(ids, texto);

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
