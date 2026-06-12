import { Router, Response } from 'express';
import { z } from 'zod';
import OpenAI, { toFile } from 'openai';
import multer from 'multer';
import { audioFileFilter } from '../utils/fileFilters';
import { authMiddleware, authUsuario, AuthRequest } from '../middleware/auth';
import { Prisma } from '@prisma/client';
import { prisma } from '../utils/prisma';
import { ProdutoRAG } from '../utils/ragSearch';
import { TOOL_DEFINITIONS, executarTool } from '../tools';
import {
  obterOuCriarConversa,
  salvarMensagens,
  salvarSugestoesChat,
  registrarClique,
  obterEstado,
  obterHistorico,
  obterLojaContexto,
  limparHistorico,
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
- buscar_produtos: usuário quer COMPRAR algo novo, ver recomendações ou explorar uma loja. Se a mensagem contiver [lojaId:UUID], passe esse UUID no parâmetro lojaId. Se o usuário mencionar o nome de uma loja sem UUID, passe o nome em lojaNome.
- buscar_info_loja: usuário pergunta sobre a loja em si — horário de funcionamento, endereço, telefone, WhatsApp, se está aberta agora, taxa de entrega, tempo estimado. Se a mensagem contiver [lojaId:UUID], use lojaId; senão use lojaNome.
- rastrear_pedido: usuário quer rastrear um pedido específico, acompanhar onde está a entrega ou ver o status de um pedido
- listar_pedidos: usuário quer ver a lista geral de pedidos (sem intenção específica de rastrear). Se mencionar uma loja, passe o nome em lojaNome.
- criar_ticket: usuário menciona QUALQUER problema com pedido já feito (produto danificado, quebrado, errado, não chegou, entrega atrasada). Use IMEDIATAMENTE sem pedir confirmação ou número de pedido — o sistema buscará os pedidos automaticamente.

Se não precisar de ferramentas (saudação, dúvida geral), responda diretamente com JSON:
{
  "texto": "mensagem curta e animada em português, com sotaque sergipano",
  "sugestoes": ["sugestão 1", "sugestão 2"]
}
Nunca mencione Amazon, iFood ou Shopee.

Regras para "sugestoes" em qualquer resposta:
- Sugira APENAS ações que o sistema consegue executar: buscar um produto (com filtro de cor, preço ou categoria), ver informações de uma loja, rastrear pedido, ver meus pedidos, reportar um problema.
- NUNCA sugira: promoções, descontos, cupons, frete grátis, novidades, lançamentos, comparar produtos, lista de desejos, favoritos, pagamento, cancelamento. Essas funcionalidades não existem no chat.
- Se não houver sugestão útil e executável, retorne [].`;

const SYSTEM_RESPOSTA = `Você é a Aju, personal shopper do marketplace local de Aracaju (Sergipe).
Os resultados da ferramenta estão na conversa. Responda SEMPRE com JSON válido, sem markdown.

Quando a ferramenta retornar PRODUTOS, use OBRIGATORIAMENTE este formato (todos os campos são obrigatórios, NESTA ORDEM):
{
  "produtosRelevantes": [1, 2],
  "texto": "mensagem curta e natural em português, consistente com a quantidade em produtosRelevantes",
  "sugestoes": ["sugestão 1", "sugestão 2"]
}

Quando NÃO retornar produtos (pedidos, tickets, resposta direta):
{
  "texto": "mensagem curta e natural em português",
  "sugestoes": []
}

Regras gerais:
- Seja direta e genuinamente útil. Evite excessos de entusiasmo — prefira tom amigável e natural.
- Nunca mencione Amazon, iFood ou Shopee.

Para produtos (a ferramenta retorna objeto com "busca", "corPedida", "corDisponivel" e "produtos"):
- O app já exibe cards com imagem, preço, loja e variações — NÃO repita essas informações no "texto".
- Use "texto" só para contextualizar e convidar ao próximo passo. NÃO liste nomes, preços ou tamanhos.
- "produtosRelevantes" (CAMPO OBRIGATÓRIO): lista com as posições (número inteiro 1-based) dos itens em "produtos" a exibir.
  - Se o usuário pediu um TIPO específico (ex: "tênis", "camisa"): inclua apenas os desse tipo. Outros tipos ficam de fora mesmo que tenham a cor ou preço certo. Retorne [] se nenhum for do tipo pedido.
  - Se o usuário NÃO pediu tipo específico (ex: "ver produtos da loja", "o que tem aqui"): inclua TODOS os itens retornados — o usuário quer navegar o catálogo.
  - NÃO omita este campo. Retorne [] explicitamente se nada for relevante.
  - IMPORTANTE: decida "produtosRelevantes" PRIMEIRO, depois escreva o "texto" baseado exatamente na quantidade que você selecionou. 1 item → singular ("encontrei um modelo", "esse tênis"); 2+ → plural ("encontrei alguns modelos"). Nunca escreva plural quando selecionou apenas 1.
- SEJA HONESTO no "texto" sobre o que NÃO bateu (avalie nesta ordem):
  1. "produtosRelevantes" = []: diga claramente que não encontrou (ex: "Ainda não temos tênis nas lojas daqui."). NÃO diga "separei esses" nem ofereça alternativas no texto.
  2. "corDisponivel" = false: avise a cor (ex: "Não achei em preto, mas separei esses modelos:").
  3. "busca" = "aproximada": avise o orçamento (ex: "Não tinha dentro de R$200, mas esse fica logo acima:").
  4. Tudo certo: vá direto ao ponto.
- "sugestoes": até 3 refinamentos que o sistema consegue executar — filtros de cor/preço/categoria, buscar em outra categoria, ver informações da loja, rastrear pedido. NUNCA sugira promoções, descontos, cupons, frete grátis, novidades, lançamentos, comparações ou qualquer funcionalidade inexistente no chat. Se não houver sugestão executável, retorne [].

Para info de loja (horário, endereço, telefone etc.):
- Os dias da semana no campo "horarios" seguem a convenção 0=Segunda, 1=Terça, 2=Quarta, 3=Quinta, 4=Sexta, 5=Sábado, 6=Domingo.
- Responda de forma clara e direta. Se o usuário perguntou sobre horário, liste os dias ativos e seus horários. Se perguntou endereço ou telefone, informe diretamente.
- Se "dados" for null, diga que não encontrou informações da loja.
- "sugestoes": retorne [].

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

// ── Detecção de cor ───────────────────────────────────────────────────────────

const CORES = [
  'preto',
  'branco',
  'azul',
  'vermelho',
  'verde',
  'amarelo',
  'rosa',
  'cinza',
  'marrom',
  'bege',
  'laranja',
  'roxo',
  'roxa',
  'vinho',
  'dourado',
  'prata',
  'nude',
  'off-white',
  'creme',
];

// Remove acentos para casar independente de como foi digitado.
const semAcento = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

// Word boundary garante que "laranja" não case em "laranjas" e "rosa" não case em "rosacea".
function coresNoTexto(texto: string): string[] {
  const t = semAcento(texto);
  return CORES.filter((c) => new RegExp(`\\b${semAcento(c).replace('-', '\\-')}\\b`).test(t));
}

function produtoTemCor(p: ProdutoRAG, cores: string[]): boolean {
  const txt = semAcento(`${p.nome} ${(p.tags ?? []).join(' ')}`);
  return cores.some((c) => new RegExp(`\\b${semAcento(c).replace('-', '\\-')}\\b`).test(txt));
}

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

      // ── Escape / troca de fluxo intermediário ─────────────────────────────────
      if (estado && !pedidoSelecionadoId) {
        const emSelecaoRastreio = estado.passo === 'selecionando_pedido_rastreio';
        const emSelecaoQueixa =
          estado.passo === 'selecionando_pedido' || estado.passo === 'confirmando';

        // Troca de intenção: rastreando → quer RECLAMAR
        if (
          emSelecaoRastreio &&
          /\b(problema|reclama\w*|defeit\w*|quebr\w*|danific\w*|n[ãa]o\s+chegou|atrasad\w*|cobran[çc]a)\b/i.test(
            texto,
          )
        ) {
          const resultado = await iniciarFluxoQueixa(conversaId, usuarioId, texto);
          await salvarMensagens(conversaId, texto, resultado.texto);
          return res.json({ ...resultado, conversaId });
        }

        // Troca de intenção: reclamando → quer RASTREAR
        if (
          emSelecaoQueixa &&
          /\b(rastre\w*|acompanh\w*|cad[êe]|onde\s+(est|t)[áa])\b/i.test(texto)
        ) {
          const resultado = await iniciarFluxoRastreio(conversaId, usuarioId);
          await salvarMensagens(conversaId, texto, resultado.texto);
          return res.json({ ...resultado, conversaId });
        }

        // Escape genérico → limpa estado e cai pro agente
        const escapando =
          /\b(buscar?|comprar?|procurar?|pesquisar?)\b/i.test(texto) ||
          /\bme\s+(recomend|indic|suger|mostr)\w*/i.test(texto) ||
          /\btem\s+(algum|produtos?|algo)\b/i.test(texto) ||
          /\bquero\s+(comprar|ver\s+produtos?|encontrar|achar)\b/i.test(texto) ||
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

      // Contexto de loja: extrai do texto atual, do estado já carregado (cache), ou do banco.
      // O estado já carregado evita a query extra na maioria das mensagens.
      const lojaIdFromTexto = texto.match(/\[lojaId:([0-9a-f-]{36})\]/i)?.[1] ?? null;
      const lojaContextoFromEstado =
        typeof (estado as Record<string, unknown> | null | undefined)?.lojaContexto === 'string'
          ? ((estado as unknown as Record<string, unknown>).lojaContexto as string)
          : null;
      // "Buscar em todas as lojas" → suprime o lojaContexto para essa mensagem
      const buscaGlobal =
        /\b(outras\s+lojas|todas\s+(as\s+)?lojas|qualquer\s+loja|busca.*geral|sem\s+filtro\s+de\s+loja)\b/i.test(
          texto,
        );
      const lojaContexto = buscaGlobal
        ? null
        : (lojaIdFromTexto ?? lojaContextoFromEstado ?? (await obterLojaContexto(conversaId)));

      // Quando encontrado pela primeira vez no texto, persiste no estado para evitar
      // a query de scan de mensagens nas próximas interações.
      if (lojaIdFromTexto && !lojaContextoFromEstado) {
        const estadoAtual = (estado ?? {}) as Record<string, unknown>;
        void prisma.conversaChat
          .update({
            where: { id: conversaId },
            data: {
              estado: { ...estadoAtual, lojaContexto: lojaIdFromTexto } as Prisma.JsonObject,
            },
          })
          .catch(() => {});
      }
      const systemAgenteComContexto = lojaContexto
        ? SYSTEM_AGENTE +
          `\n\nContexto da conversa: o usuário está navegando a loja com ID "${lojaContexto}". ` +
          `Ao usar buscar_produtos ou buscar_info_loja, passe lojaId="${lojaContexto}" automaticamente ` +
          `quando o usuário não especificar outra loja.`
        : SYSTEM_AGENTE;

      const primeiraResposta = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        max_tokens: 300,
        response_format: { type: 'json_object' },
        tools: TOOL_DEFINITIONS,
        tool_choice: 'auto',
        messages: [
          { role: 'system', content: systemAgenteComContexto },
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

      // infoLoja sem resultado: resposta direta, sem segunda chamada à IA
      if (toolResult.tipo === 'infoLoja' && toolResult.dados === null) {
        const textoResposta =
          'Não encontrei essa loja. Pode verificar se o nome está correto ou me dizer o nome completo?';
        await salvarMensagens(conversaId, texto, textoResposta);
        return res.json({ tipo: 'resposta', texto: textoResposta, sugestoes: [], conversaId });
      }

      // Sinais de cor calculados ANTES de passar ao modelo, sobre os candidatos brutos.
      // corDisponivel será recalculado APÓS o filtro de tipo para maior precisão.
      const coresPedidas = toolResult.tipo === 'produtos' ? coresNoTexto(texto) : [];

      const toolContent =
        toolResult.tipo === 'produtos'
          ? JSON.stringify({
              busca: toolResult.aproximado ? 'aproximada' : 'exata',
              corPedida: coresPedidas.length > 0 ? coresPedidas : null,
              // corDisponivel calculado sobre candidatos brutos como sinal inicial para a IA.
              // O sistema refina após filtrar por tipo (ver abaixo).
              corDisponivel:
                coresPedidas.length > 0 && toolResult.dados.length > 0
                  ? toolResult.dados.some((p) => produtoTemCor(p, coresPedidas))
                  : null,
              produtos: toolResult.dados,
            })
          : JSON.stringify(toolResult.dados);

      const segundaResposta = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        max_tokens: 600,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: SYSTEM_RESPOSTA },
          ...historicoParsed,
          { role: 'user', content: texto },
          { role: 'assistant', content: null, tool_calls: mensagemAgente.tool_calls },
          {
            role: 'tool',
            tool_call_id: toolCall.id,
            content: toolContent,
          },
        ],
      });

      // Protege contra JSON truncado (max_tokens) ou malformado
      let resposta: Record<string, unknown>;
      try {
        resposta = JSON.parse(segundaResposta.choices[0].message.content ?? '{}');
      } catch {
        resposta = { texto: 'Ops, tive um probleminha. Pode repetir?', sugestoes: [] };
      }
      resposta.tipo = 'resposta';

      // ── Filtro de relevância (tipo/categoria) ─────────────────────────────────
      // A IA indica em "produtosRelevantes" quais candidatos são do tipo correto.
      // Tipo é critério principal; cor/preço são preferência filtrada depois.
      let produtosRelevantes: ProdutoRAG[] = toolResult.tipo === 'produtos' ? toolResult.dados : [];
      if (toolResult.tipo === 'produtos') {
        const sel = resposta.produtosRelevantes;
        if (Array.isArray(sel)) {
          const porIndice = sel.length > 0 && sel.every((x: unknown) => /^\d+$/.test(String(x)));
          const escolhidos = porIndice
            ? sel.map((n: unknown) => toolResult.dados[Number(n) - 1])
            : sel.map((id: unknown) => toolResult.dados.find((p) => p.id === String(id)));
          const validos = escolhidos.filter((p: ProdutoRAG | undefined): p is ProdutoRAG => !!p);
          // Dedup preservando a ordem da IA
          produtosRelevantes = validos.filter(
            (p, i) => validos.findIndex((q) => q.id === p.id) === i,
          );
        }
        // sel não-array (resposta malformada) → mantém todos como fallback seguro
      }
      delete resposta.produtosRelevantes;

      // ── Filtro de cor ──────────────────────────────────────────────────────────
      // Calculado sobre os produtos JÁ filtrados por tipo — evita que item de outra
      // categoria com a cor pedida suprima o aviso.
      let produtosExibidos = produtosRelevantes;
      if (coresPedidas.length > 0 && produtosRelevantes.length > 0) {
        const naCor = produtosRelevantes.filter((p) => produtoTemCor(p, coresPedidas));
        if (naCor.length > 0) {
          // Cor encontrada nos produtos do tipo certo → exibe só esses.
          produtosExibidos = naCor;
        } else {
          // Cor NÃO encontrada → injeta aviso sempre (não confia no texto da IA,
          // que pode mencionar a cor sem ter confirmado a ausência dela).
          produtosExibidos = produtosRelevantes;
          resposta.texto = `Não achei em ${coresPedidas.join(' nem ')}, mas separei essas opções que podem te servir:`;
        }
      }

      resposta.produtos = toolResult.tipo === 'produtos' ? ragParaChat(produtosExibidos) : [];

      // ── Aviso de busca fora do contexto da loja ────────────────────────────────
      // Quando o produto não existe na loja do contexto e o sistema buscou globalmente,
      // injeta mensagem clara + chips para o usuário escolher o que fazer.
      if (toolResult.tipo === 'produtos' && toolResult.foraContextoLoja && lojaContexto) {
        const lojaInfo = await prisma.loja.findUnique({
          where: { id: lojaContexto },
          select: { nome: true },
        });
        const nomeLoja = lojaInfo?.nome ?? 'essa loja';
        resposta.texto =
          produtosExibidos.length > 0
            ? `Esse produto não está disponível na ${nomeLoja}, mas encontrei em outras lojas de Aracaju:`
            : `Esse produto não está disponível na ${nomeLoja} e também não encontrei em outras lojas por aqui.`;
        resposta.sugestoes = [`Ver o que tem na ${nomeLoja}`, 'Buscar em todas as lojas'];
      }

      // Pedidos listados viram cards interativos (em vez de só texto da IA).
      if (toolResult.tipo === 'pedidos' && toolResult.dados.length > 0) {
        resposta.tipo = 'listarPedidos';
        resposta.pedidos = toolResult.dados.map((p, idx) => ({
          numero: idx + 1,
          id: p.id,
          loja: p.loja,
          total: p.total,
          data: p.criadoEm.split('T')[0],
          itens: p.itens,
          status: p.status,
        }));
      }

      const { msgAju } = await salvarMensagens(conversaId, texto, (resposta.texto as string) || '');

      if (toolResult.tipo === 'produtos' && produtosExibidos.length > 0) {
        await salvarSugestoesChat(msgAju.id, produtosExibidos);
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

// GET /chat/historico — reidrata a conversa mais recente do usuário
router.get('/historico', authMiddleware, authUsuario, async (req: AuthRequest, res: Response) => {
  try {
    const data = await obterHistorico(req.user!.id);
    res.json(data);
  } catch (error) {
    logger.error({ err: error }, '[chat/historico]');
    res.status(500).json({ error: 'Erro ao carregar histórico' });
  }
});

// DELETE /chat/historico — apaga toda a conversa do usuário (local + servidor)
router.delete(
  '/historico',
  authMiddleware,
  authUsuario,
  async (req: AuthRequest, res: Response) => {
    try {
      await limparHistorico(req.user!.id);
      res.json({ ok: true });
    } catch (error) {
      logger.error({ err: error }, '[chat/historico DELETE]');
      res.status(500).json({ error: 'Erro ao limpar histórico' });
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

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 },
  fileFilter: audioFileFilter,
});

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
