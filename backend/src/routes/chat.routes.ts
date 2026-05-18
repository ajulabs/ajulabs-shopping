import { Router, Response } from 'express';
import { z } from 'zod';
import OpenAI, { toFile } from 'openai';
import multer from 'multer';
import { authMiddleware, authUsuario, AuthRequest } from '../middleware/auth';
import { ProdutoRAG } from '../utils/ragSearch';
import { TOOL_DEFINITIONS, executarTool } from '../tools';
import {
  obterOuCriarConversa,
  salvarMensagens,
  salvarSugestoesChat,
  registrarClique,
  obterEstado,
} from '../utils/conversa';
import {
  iniciarFluxoQueixa,
  processarSelecaoPedido,
  processarConfirmacao,
} from '../tools/queixaFlow';

const router = Router();

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const SYSTEM_AGENTE = `Você é a Aju, personal shopper do marketplace local de Aracaju (Sergipe).

Use as ferramentas disponíveis quando necessário:
- buscar_produtos: quando o usuário quer comprar algo, ver opções ou pedir recomendações
- listar_pedidos: quando o usuário perguntar sobre seus pedidos, entrega ou rastreamento
- criar_ticket: quando o usuário reclamar ou reportar um problema

Se não precisar de ferramentas (saudação, dúvida geral), responda diretamente com JSON:
{
  "texto": "mensagem curta e animada em português, com sotaque sergipano",
  "sugestoes": ["sugestão 1", "sugestão 2"]
}
Nunca mencione Amazon, iFood ou Shopee.`;

const SYSTEM_RESPOSTA = `Você é a Aju, personal shopper do marketplace local de Aracaju (Sergipe).
Os resultados da ferramenta estão na conversa. Responda ao usuário com JSON válido, sem markdown:
{
  "texto": "mensagem curta e animada em português, com sotaque sergipano",
  "sugestoes": ["sugestão 1", "sugestão 2"]
}
Regras:
- Para produtos: destaque os mais relevantes no texto, sugira refinamentos em "sugestoes"
- Para pedidos: descreva o status de forma clara e amigável, sem repetir IDs técnicos
- Para tickets: confirme o registro pelo protocolo e diga que a equipe entrará em contato em breve
- "sugestoes" apenas para contexto de busca de produtos, máximo 3; caso contrário retorne []
- Nunca mencione Amazon, iFood ou Shopee`;

const mensagemSchema = z.object({
  texto: z.string().min(1).max(1000),
  historico: z.array(z.object({
    remetente: z.enum(['usuario', 'aju']),
    conteudo: z.string(),
  })).default([]),
  conversaId: z.string().uuid().optional(),
  pedidoSelecionadoId: z.string().uuid().optional(),
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
  return produtos.slice(0, 3).map(p => ({
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
    const { texto, historico, conversaId: conversaIdReq, pedidoSelecionadoId } = mensagemSchema.parse(req.body);
    const usuarioId = req.user!.id;

    const conversa = await obterOuCriarConversa(usuarioId, conversaIdReq);
    const conversaId = conversa.id;

    const estado = await obterEstado(conversaId);

    // ── Passo 3: confirmação ──────────────────────────────────────────────────
    if (estado?.passo === 'confirmando') {
      const resultado = await processarConfirmacao(conversaId, usuarioId, texto);
      const textoSalvo = resultado.tipo === 'resposta' ? resultado.texto
        : (resultado as { texto: string }).texto;
      await salvarMensagens(conversaId, texto, textoSalvo);
      return res.json({ ...resultado, conversaId });
    }

    // ── Passo 2: seleção de pedido ────────────────────────────────────────────
    if (estado?.passo === 'selecionando_pedido') {
      const resultado = await processarSelecaoPedido(conversaId, texto, pedidoSelecionadoId);
      await salvarMensagens(conversaId, texto, resultado.texto);
      return res.json({ ...resultado, conversaId });
    }

    // ── Fluxo normal com OpenAI ───────────────────────────────────────────────
    const historicoParsed: OpenAI.Chat.ChatCompletionMessageParam[] = historico.map(m => ({
      role: m.remetente === 'usuario' ? 'user' : 'assistant',
      content: m.conteudo,
    }));

    const primeiraResposta = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      max_tokens: 300,
      response_format: { type: 'json_object' },
      tools: TOOL_DEFINITIONS,
      tool_choice: 'auto',
      messages: [
        { role: 'system', content: SYSTEM_AGENTE },
        ...historicoParsed,
        { role: 'user', content: texto },
      ],
    });

    const mensagemAgente = primeiraResposta.choices[0].message;

    // Sem tool: resposta direta
    if (!mensagemAgente.tool_calls || mensagemAgente.tool_calls.length === 0) {
      const resposta = JSON.parse(mensagemAgente.content ?? '{}');
      resposta.tipo = 'resposta';
      resposta.produtos = [];
      await salvarMensagens(conversaId, texto, resposta.texto || '');
      return res.json({ ...resposta, conversaId });
    }

    const toolCall = mensagemAgente.tool_calls[0];
    if (toolCall.type !== 'function') {
      await salvarMensagens(conversaId, texto, 'Não entendi. Pode repetir?');
      return res.json({ tipo: 'resposta', texto: 'Não entendi. Pode repetir?', produtos: [], sugestoes: [], conversaId });
    }

    const toolArgs = JSON.parse(toolCall.function.arguments) as Record<string, string>;

    // ── Intercepta criar_ticket → inicia queixa flow ──────────────────────────
    if (toolCall.function.name === 'criar_ticket') {
      const resultado = await iniciarFluxoQueixa(conversaId, usuarioId, toolArgs.motivo ?? texto);
      await salvarMensagens(conversaId, texto, resultado.texto);
      return res.json({ ...resultado, conversaId });
    }

    // ── Executa outras tools normalmente ─────────────────────────────────────
    const toolResult = await executarTool(toolCall.function.name, toolArgs, usuarioId);

    const segundaResposta = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      max_tokens: 500,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: SYSTEM_RESPOSTA },
        ...historicoParsed,
        { role: 'user', content: texto },
        { role: 'assistant', content: null, tool_calls: mensagemAgente.tool_calls },
        {
          role: 'tool',
          tool_call_id: toolCall.id,
          content: JSON.stringify(toolResult.dados),
        },
      ],
    });

    const resposta = JSON.parse(segundaResposta.choices[0].message.content ?? '{}');
    resposta.tipo = 'resposta';
    resposta.produtos = toolResult.tipo === 'produtos' ? ragParaChat(toolResult.dados) : [];

    const { msgAju } = await salvarMensagens(conversaId, texto, resposta.texto || '');

    if (toolResult.tipo === 'produtos' && toolResult.dados.length > 0) {
      await salvarSugestoesChat(msgAju.id, toolResult.dados);
    }

    res.json({ ...resposta, conversaId });
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: error.errors });
    const msg = error instanceof Error ? error.message : String(error);
    console.error('[chat/mensagem]', msg);
    res.status(500).json({
      tipo: 'resposta',
      texto: 'Eita, tive um probleminha aqui. Tenta de novo!',
      ...(process.env.NODE_ENV !== 'production' && { debug: msg }),
    });
  }
});

// POST /chat/sugestao/:id/clique
router.post('/sugestao/:id/clique', authMiddleware, authUsuario, async (req: AuthRequest, res: Response) => {
  try {
    await registrarClique(req.params.id);
    res.json({ ok: true });
  } catch (error) {
    console.error('[chat/sugestao/clique]', error);
    res.status(500).json({ error: 'Erro ao registrar clique' });
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
