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
  atualizarEstado,
} from '../utils/conversa';
import {
  iniciarFluxoQueixa,
  iniciarFluxoQueixaComPedido,
  processarSelecaoPedido,
  processarConfirmacao,
} from '../tools/queixaFlow';
import { iniciarFluxoRastreio, processarSelecaoRastreio } from '../tools/rastreioFlow';
import { chatLimiter } from '../lib/rateLimiter';
import { logger } from '../lib/logger';
import { specValidatorMiddleware } from '../lib/spec-validator';
import { AGENT_SPEC_CONTEXT } from '../lib/agent-context';

const router = Router();

router.use(chatLimiter);

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const SYSTEM_AGENTE = `Você é a Aju, personal shopper do marketplace local de Aracaju (Sergipe).

${AGENT_SPEC_CONTEXT}

Use as ferramentas disponíveis quando necessário:
- buscar_produtos: usuário quer COMPRAR algo novo ou ver recomendações. Se a mensagem contiver [lojaId:UUID], passe esse UUID no parâmetro lojaId para filtrar apenas produtos daquela loja.
- rastrear_pedido: usuário quer rastrear um pedido específico, acompanhar onde está a entrega ou ver o status de um pedido
- listar_pedidos: usuário quer ver a lista geral de pedidos (sem intenção específica de rastrear)
- criar_ticket: usuário menciona QUALQUER problema com pedido já feito (produto danificado, quebrado, errado, não chegou, entrega atrasada). Use IMEDIATAMENTE sem pedir confirmação ou número de pedido — o sistema buscará os pedidos automaticamente.

Se não precisar de ferramentas (saudação, dúvida geral), responda diretamente com JSON:
{
  "texto": "mensagem curta e animada em português, com sotaque sergipano",
  "sugestoes": ["sugestão 1", "sugestão 2"]
}
Nunca mencione Amazon, iFood ou Shopee.`;

const SYSTEM_RESPOSTA = `Você é a Aju, personal shopper do marketplace local de Aracaju (Sergipe).
Os resultados da ferramenta estão na conversa. Responda ao usuário com JSON válido, sem markdown:
{
  "texto": "mensagem curta e natural em português",
  "sugestoes": ["sugestão 1", "sugestão 2"]
}
Regras gerais:
- Seja direta e genuinamente útil. Evite excessos de entusiasmo ("Eita!", "olha só que coisa linda!") — prefira tom amigável e natural.
- Nunca mencione Amazon, iFood ou Shopee.

Para produtos:
- O app já exibe cards com imagem, preço, loja e variações disponíveis — NÃO repita essas informações no "texto".
- Use o "texto" apenas para contextualizar brevemente o resultado (ex: "Achei 3 opções que podem te atender.") e convidar ao próximo passo (ex: "Quer filtrar por cor ou faixa de preço?").
- NÃO liste nomes de produtos, preços ou tamanhos no texto — os cards fazem isso.
- "sugestoes": até 3 refinamentos que ajudem o usuário a encontrar melhor o que quer (ex: "Só em preto", "Até R$ 100", "Para presente").

Para pedidos:
- Descreva o status de forma clara e amigável, sem repetir IDs técnicos.
- "sugestoes": retorne [].

Para tickets:
- Confirme o registro pelo protocolo e informe que a equipe entrará em contato em breve.
- "sugestoes": retorne [].`;

const chatMensagemSpec = {
  name: 'POST_chat_mensagem',
  input: {
    texto: { required: true, type: 'string', constraints: ['min 1, max 1000'] },
    historico: { required: false, type: 'array' },
    conversaId: { required: false, type: 'string', constraints: ['uuid'] },
    pedidoSelecionadoId: { required: false, type: 'string', constraints: ['uuid'] },
  },
} as const;

const mensagemSchema = z.object({
  texto: z.string().min(1).max(1000),
  historico: z
    .array(
      z.object({
        remetente: z.enum(['usuario', 'aju']),
        conteudo: z.string(),
      }),
    )
    .default([]),
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
  variacoes: { id: string; nome: string; preco: number | null }[];
};

function ragParaChat(produtos: ProdutoRAG[]): ProdutoChat[] {
  return produtos.slice(0, 3).map((p) => ({
    id: p.id,
    lojaId: p.lojaId,
    nome: p.nome,
    loja: p.loja,
    preco: p.preco,
    precoOriginal: null,
    tempoEntrega: p.tempoEntrega,
    imagemUrl: p.imagemUrl,
    variacoes: p.variacoes ?? [],
  }));
}

// POST /chat/mensagem
router.post(
  '/mensagem',
  authMiddleware,
  authUsuario,
  specValidatorMiddleware(chatMensagemSpec),
  async (req: AuthRequest, res: Response) => {
    try {
      const {
        texto,
        historico,
        conversaId: conversaIdReq,
        pedidoSelecionadoId,
      } = mensagemSchema.parse(req.body);
      const usuarioId = req.user!.id;

      const conversa = await obterOuCriarConversa(usuarioId, conversaIdReq);
      const conversaId = conversa.id;

      let estado = await obterEstado(conversaId);

      // ── Escape de fluxo intermediário: intenção claramente diferente ──────────
      if (estado && !pedidoSelecionadoId) {
        const escapando =
          // Busca / compra de produto
          /\b(buscar?|comprar?|procurar?|pesquisar?)\b/i.test(texto) ||
          /\bme\s+(recomend|indic|suger|mostr)\w*/i.test(texto) ||
          /\btem\s+(algum|produtos?|algo)\b/i.test(texto) ||
          /\bquero\s+(comprar|ver\s+produtos?|encontrar|achar)\b/i.test(texto) ||
          // Saída explícita do fluxo
          /\b(outra\s+(coisa|pergunta)|esquece?(\s+isso)?|muda\s+(de\s+)?assunto|não\s+quero\s+mais|cancela?\s+isso)\b/i.test(
            texto,
          );

        if (escapando) {
          await atualizarEstado(conversaId, null);
          estado = null;
        }
      }

      // ── Passo 3: confirmação ──────────────────────────────────────────────────
      if (estado?.passo === 'confirmando') {
        const resultado = await processarConfirmacao(conversaId, usuarioId, texto);
        const textoSalvo =
          resultado.tipo === 'resposta' ? resultado.texto : (resultado as { texto: string }).texto;
        await salvarMensagens(conversaId, texto, textoSalvo);
        return res.json({ ...resultado, conversaId });
      }

      // ── Passo 2: seleção de pedido (queixa) ──────────────────────────────────
      if (estado?.passo === 'selecionando_pedido') {
        const resultado = await processarSelecaoPedido(conversaId, texto, pedidoSelecionadoId);
        await salvarMensagens(conversaId, texto, resultado.texto);
        return res.json({ ...resultado, conversaId });
      }

      // ── Rastreio concluído: "problema" pula direto para confirmação de queixa ──
      if (estado?.passo === 'rastreio_concluido') {
        const isProblema =
          /\b(problema|reclamar?|defeituoso|quebrou|danific|não\s+chegou|errado|atrasad|cobrança)\b/i.test(
            texto,
          );
        if (isProblema) {
          const resultado = await iniciarFluxoQueixaComPedido(
            conversaId,
            usuarioId,
            texto,
            (estado as { pedidoId: string }).pedidoId,
          );
          await salvarMensagens(conversaId, texto, resultado.texto);
          return res.json({ ...resultado, conversaId });
        }
        await atualizarEstado(conversaId, null);
        estado = null;
      }

      // ── Passo 2: seleção de pedido (rastreio) ─────────────────────────────────
      if (estado?.passo === 'selecionando_pedido_rastreio') {
        const resultado = await processarSelecaoRastreio(conversaId, texto, pedidoSelecionadoId);
        await salvarMensagens(conversaId, texto, resultado.texto);
        return res.json({ ...resultado, conversaId });
      }

      // ── Sugestão "Rastrear outro pedido" → reinicia o fluxo diretamente ────────
      if (/rastrear.*(outro|um|meu)?\s*pedido/i.test(texto.trim()) && !estado) {
        const resultado = await iniciarFluxoRastreio(conversaId, usuarioId);
        await salvarMensagens(conversaId, texto, resultado.texto);
        return res.json({ ...resultado, conversaId });
      }

      // ── Fluxo normal com OpenAI ───────────────────────────────────────────────
      const historicoParsed: OpenAI.Chat.ChatCompletionMessageParam[] = historico.map((m) => ({
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
        return res.json({
          tipo: 'resposta',
          texto: 'Não entendi. Pode repetir?',
          produtos: [],
          sugestoes: [],
          conversaId,
        });
      }

      const toolArgs = JSON.parse(toolCall.function.arguments) as Record<string, string>;

      // ── Intercepta rastrear_pedido → inicia rastreio flow ────────────────────
      if (toolCall.function.name === 'rastrear_pedido') {
        const resultado = await iniciarFluxoRastreio(conversaId, usuarioId);
        await salvarMensagens(conversaId, texto, resultado.texto);
        return res.json({ ...resultado, conversaId });
      }

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
      logger.error({ msg }, '[chat/mensagem]');
      res.status(500).json({
        tipo: 'resposta',
        texto: 'Eita, tive um probleminha aqui. Tenta de novo!',
        ...(process.env.NODE_ENV !== 'production' && { debug: msg }),
      });
    }
  },
);

// POST /chat/sugestao/:id/clique
router.post(
  '/sugestao/:id/clique',
  authMiddleware,
  authUsuario,
  async (req: AuthRequest, res: Response) => {
    try {
      await registrarClique(req.params.id);
      res.json({ ok: true });
    } catch (error) {
      logger.error({ err: error }, '[chat/sugestao/clique]');
      res.status(500).json({ error: 'Erro ao registrar clique' });
    }
  },
);

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 25 * 1024 * 1024 } });

// POST /chat/transcricao  (multipart/form-data, campo: "audio")
router.post(
  '/transcricao',
  authMiddleware,
  authUsuario,
  upload.single('audio'),
  async (req: AuthRequest, res: Response) => {
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
      logger.error({ err: error }, 'Erro ao transcrever áudio');
      res.status(500).json({ error: 'Erro ao transcrever áudio' });
    }
  },
);

export default router;
