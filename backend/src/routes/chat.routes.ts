import { Router, Response } from 'express';
import { z } from 'zod';
import OpenAI, { toFile } from 'openai';
import multer from 'multer';
import { audioFileFilter } from '../utils/fileFilters';
import { authMiddleware, authUsuario, AuthRequest } from '../middleware/auth';
import { Prisma } from '@prisma/client';
import { prisma } from '../utils/prisma';
import {
  ProdutoRAG,
  buscarProdutosRAG,
  buscarProdutosFallback,
  buscarProdutosPopulares,
  buscarProdutosPorIds,
} from '../utils/ragSearch';
import { TOOL_DEFINITIONS, executarTool } from '../tools';
import {
  obterOuCriarConversa,
  salvarMensagens,
  salvarSugestoesChat,
  registrarClique,
  obterEstado,
  obterHistorico,
  obterHistoricoParaIA,
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
- buscar_produtos: usuário quer COMPRAR algo novo, ver recomendações ou explorar uma loja, de UM tipo de produto. Se a mensagem contiver [lojaId:UUID], passe esse UUID no parâmetro lojaId. Se o usuário mencionar o nome de uma loja sem UUID, passe o nome em lojaNome.
- buscar_conjunto: usuário pede 2 ou mais TIPOS de produto diferentes na mesma mensagem querendo COMBINAR/montar um look (ex: "uma camisa e um tênis pra academia", "vestido e sandália pra festa"). Liste os tipos em "itens" e preencha "ocasiao", "genero" e "cor" quando mencionados — eles valem para todas as peças. Para um único tipo, use buscar_produtos.
- buscar_info_loja: usuário pergunta sobre a loja em si — horário de funcionamento, endereço, telefone, WhatsApp, se está aberta agora, taxa de entrega, tempo estimado. Se a mensagem contiver [lojaId:UUID], use lojaId; senão use lojaNome.
- rastrear_pedido: usuário quer rastrear um pedido específico, acompanhar onde está a entrega ou ver o status de um pedido
- listar_pedidos: usuário quer ver a lista geral de pedidos (sem intenção específica de rastrear). Se mencionar uma loja, passe o nome em lojaNome.
- criar_ticket: usuário menciona QUALQUER problema com pedido já feito (produto danificado, quebrado, errado, não chegou, entrega atrasada). Use IMEDIATAMENTE sem pedir confirmação ou número de pedido — o sistema buscará os pedidos automaticamente.
- consultar_tickets: usuário pergunta sobre suas reclamações, protocolo de atendimento, status de um ticket ou se alguém já respondeu.

NÃO use ferramentas quando:
- O usuário pede mais detalhes, descrição, estoque, disponibilidade, PREÇO ou CORES/VARIAÇÕES de um produto que JÁ aparece no histórico da conversa (ex: "me fale sobre o produto 1", "tem estoque?", "qual o preço do item 2?", "qual é mais barato?", "tem em azul?", "quais cores tem?"). O histórico traz os campos [estoque: N], [preço: R$ X] e [variações: ...] — use-os para responder diretamente SEM chamar nenhuma busca de novo. Sempre que sua resposta se referir a produto(s) específico(s) do histórico, inclua "produtoRef" com o(s) número(s) do(s) item(ns) para o app re-exibir o card. REGRA DE CONSISTÊNCIA: "produtoRef" deve conter EXATAMENTE os produtos que você cita no texto — nem mais, nem menos. Se o texto menciona 2 produtos, "produtoRef" tem os 2 números; se menciona só 1, tem só 1. Nunca cite um produto no texto sem o card correspondente. Para "qual o mais barato?", o ideal é responder só sobre o mais barato (1 número); se você comparar com outro, inclua os dois.
- O usuário quer adicionar ao carrinho, comprar ou finalizar ("adiciona ao carrinho", "quero comprar os dois", "fechar o pedido"). O chat não mexe no carrinho — oriente a tocar em "Ver na loja" em cada produto pra adicionar e concluir por lá.
- O usuário faz saudação ou pergunta geral que não exige busca.

Sempre responda em português brasileiro, mesmo que o usuário escreva em inglês, espanhol ou outro idioma latino. Para outros idiomas (árabe, japonês, etc.) o sistema já trata antes de chegar até você.
Se o usuário enviar conteúdo ofensivo, sexual ou inadequado que passar pela moderação automática, responda educadamente que não pode ajudar com isso e redirecione para o marketplace.

Se não precisar de ferramentas, responda diretamente com JSON:
{
  "texto": "mensagem curta e animada em português, com sotaque sergipano",
  "sugestoes": ["sugestão 1", "sugestão 2"],
  "produtoRef": []
}
"produtoRef" é opcional: preencha só quando estiver falando de produto(s) específico(s) já mostrado(s) no histórico, com o(s) número(s) do(s) item(ns). Caso contrário, omita ou deixe [].
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
- "produtosRelevantes" (CAMPO OBRIGATÓRIO): lista com as posições (número inteiro 1-based, máximo 6) dos itens em "produtos" a exibir.
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

Quando o usuário perguntar sobre estoque ou disponibilidade (ex: "tem estoque?", "quantas unidades?", "está disponível?"):
- Use o campo "estoque" do produto para responder. Se estoque > 0: informe a quantidade disponível. Se estoque = 0 ou produto indisponível: avise que está esgotado.
- Para produtos com variações, o estoque está por variação — mencione qual combinação está disponível.

Quando o usuário pedir mais detalhes sobre um produto específico (ex: "me fale mais", "quais as especificações", "é de que material", "qual a qualidade"):
- Use o campo "descricao" do produto para responder de forma concisa, destacando os pontos mais relevantes para a pergunta. Não copie a descrição na íntegra.
- Se a descrição estiver vazia, diga o que você sabe pelo nome e categoria.
- IMPORTANTE: quando o histórico listar produtos como "item 1 —", "item 2 —" etc., esses números são 1-based e correspondem exatamente aos badges visíveis nos cards. "item 1" = primeiro card da esquerda. NUNCA use indexação 0-based.

Para info de loja (horário, endereço, telefone etc.):
- Os dias da semana no campo "horarios" seguem a convenção 0=Segunda, 1=Terça, 2=Quarta, 3=Quinta, 4=Sexta, 5=Sábado, 6=Domingo.
- Responda de forma clara e direta. Se o usuário perguntou sobre horário, liste os dias ativos e seus horários. Se perguntou endereço ou telefone, informe diretamente.
- Se "dados" for null, diga que não encontrou informações da loja.
- "sugestoes": retorne [].

Para pedidos:
- Descreva o status de forma clara e amigável, sem repetir IDs técnicos.
- "sugestoes": retorne [].

Para ticket criado:
- Confirme o registro pelo protocolo e informe que a equipe entrará em contato em breve.
- "sugestoes": retorne [].

Para lista de tickets (consultar_tickets):
- Liste cada ticket com protocolo, status traduzido (aberto→"Aberto", em_andamento→"Em andamento", resolvido→"Resolvido", cancelado→"Cancelado") e um resumo do motivo.
- Se o ticket tiver "respostas" com mensagens da loja, mencione a resposta mais recente no texto: ex "A loja respondeu: [trecho da resposta]".
- Se não houver tickets, diga que o usuário não tem reclamações registradas.
- "sugestoes": retorne [].`;

const SYSTEM_CONJUNTO = `Você é a Aju, personal shopper do marketplace local de Aracaju (Sergipe).
O usuário pediu um CONJUNTO de produtos que combinam. Você recebe, por grupo, os candidatos numerados que a busca trouxe — e decide quais são DE FATO do tipo pedido no título do grupo, porque a busca por semelhança às vezes traz produtos parecidos mas de outro tipo.
Responda SEMPRE com JSON válido, sem markdown, NESTE formato:
{
  "grupos": [
    { "relevantes": [1, 2], "alternativaTitulo": "", "alternativaRelevantes": [] },
    { "relevantes": [], "alternativaTitulo": "Camisetas", "alternativaRelevantes": [1, 3] }
  ],
  "texto": "mensagem curta que amarra o conjunto"
}

Regras:
- "grupos": MESMA ordem e MESMA quantidade dos grupos recebidos. Para cada grupo:
  - "relevantes" = posições (inteiros 1-based) dos candidatos que realmente são do tipo do título. Se NENHUM candidato for daquele tipo, retorne [] — NUNCA force produtos de outro tipo (ex: não classifique uma camiseta como "vestido", nem um tênis como "sandália").
  - Quando "relevantes" for [] mas houver candidatos de OUTRO tipo que combinariam no mesmo estilo/ocasião, ofereça uma ALTERNATIVA: "alternativaTitulo" = o nome correto e honesto desses produtos (ex: "Camisetas", "Tênis") e "alternativaRelevantes" = as posições deles. NUNCA use o tipo pedido como título da alternativa. Se não houver alternativa boa, deixe "alternativaTitulo": "" e "alternativaRelevantes": [].
- "texto": 1 a 2 frases, tom amigável com leve sotaque sergipano. NÃO cite nomes nem preços (os cards já mostram). Se os tipos pedidos foram encontrados, enquadre como conjunto que combina, citando os TIPOS. Se você ofereceu alternativas, deixe claro que NÃO achou o que foi pedido e que está sugerindo um look alternativo que combina (ex: "Não achei vestido nem sandália, mas montei um look casual com camiseta e tênis que combina!"). Se nada foi encontrado nem houve alternativa, diga que não achou e convide a tentar outro estilo.
- Nunca mencione Amazon, iFood ou Shopee.`;

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
      // Resiliente: um item de histórico malformado (ex.: conteudo vazio/undefined
      // de uma mensagem-card antiga) NÃO pode derrubar a conversa inteira.
      // Cada item coage para um valor seguro em vez de falhar o .parse().
      z
        .object({
          remetente: z.enum(['usuario', 'aju']).catch('usuario'),
          conteudo: z.string().catch(''),
        })
        .catch({ remetente: 'usuario', conteudo: '' }),
    )
    .default([]),
  conversaId: z.string().uuid().optional(),
  pedidoSelecionadoId: z.string().uuid().optional(),
});

// ── Extração de quantidade da mensagem ───────────────────────────────────────

function extrairQuantidade(texto: string): number | null {
  // Detecta padrões como "quero 3 tênis", "preciso de 2", "comprar 5 pares"
  const match = texto.match(
    /(?:quero|preciso\s+de?|comprar|pedir|pedindo)\s+(\d+)\b|(\d+)\s*(?:unidades?|pares?|peças?|itens?|kits?|caixas?|exemplares?)/i,
  );
  if (!match) return null;
  const n = parseInt(match[1] ?? match[2]);
  return n >= 2 && n <= 99 ? n : null;
}

// ── Inferência de categoria ampla ────────────────────────────────────────────

const MAPA_CATEGORIAS: { keywords: string[]; categoria: string }[] = [
  {
    keywords: [
      'sandalia',
      'tenis',
      'sapato',
      'chinelo',
      'bota',
      'calcado',
      'sapatilha',
      'salto',
      'mocassim',
      'oxford',
      'scarpin',
    ],
    categoria: 'calçados',
  },
  {
    keywords: [
      'computador',
      'notebook',
      'laptop',
      'celular',
      'smartphone',
      'fone',
      'headphone',
      'tablet',
      'camera',
      'televisor',
      'monitor',
      'teclado',
      'mouse',
      'games',
      'videogame',
      'console',
      'eletronico',
    ],
    categoria: 'eletrônicos',
  },
  {
    keywords: [
      'pizza',
      'hamburguer',
      'lanche',
      'comida',
      'refeicao',
      'prato',
      'marmita',
      'sushi',
      'acai',
      'sorvete',
      'bolo',
      'doce',
      'snack',
      'salgado',
      'tapioca',
      'pastel',
    ],
    categoria: 'alimentação',
  },
  {
    keywords: [
      'camiseta',
      'camisa',
      'blusa',
      'vestido',
      'calca',
      'shorts',
      'roupa',
      'jaqueta',
      'moletom',
      'moda',
      'bermuda',
      'saia',
      'blazer',
      'casaco',
    ],
    categoria: 'roupas',
  },
  {
    keywords: [
      'shampoo',
      'creme',
      'perfume',
      'maquiagem',
      'cosmetico',
      'hidratante',
      'beleza',
      'skincare',
      'batom',
      'esmalte',
      'protetor',
    ],
    categoria: 'beleza',
  },
  {
    keywords: ['remedio', 'medicamento', 'farmacia', 'vitamina', 'suplemento', 'proteina', 'whey'],
    categoria: 'farmácia',
  },
  {
    keywords: [
      'cerveja',
      'vinho',
      'bebida',
      'refrigerante',
      'suco',
      'agua',
      'energetico',
      'whisky',
      'cachaça',
    ],
    categoria: 'bebidas',
  },
  {
    keywords: [
      'sofa',
      'mesa',
      'cadeira',
      'cama',
      'guarda-roupa',
      'estante',
      'movel',
      'decoracao',
      'tapete',
      'luminaria',
    ],
    categoria: 'móveis e decoração',
  },
  {
    keywords: ['brinquedo', 'boneca', 'carrinho', 'lego', 'jogo', 'puzzle', 'infantil'],
    categoria: 'brinquedos',
  },
];

const semAcentoCat = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

function inferirCategoria(query: string): string | null {
  const q = semAcentoCat(query);
  for (const { keywords, categoria } of MAPA_CATEGORIAS) {
    if (keywords.some((kw) => q.includes(kw))) return categoria;
  }
  return null;
}

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

const FAMILIAS_COR: Record<string, string[]> = {
  neutros: [
    'preto',
    'branco',
    'cinza',
    'bege',
    'marrom',
    'creme',
    'off-white',
    'nude',
    'prata',
    'dourado',
  ],
  quentes: ['vermelho', 'laranja', 'amarelo', 'rosa', 'vinho'],
  frios: ['azul', 'verde', 'roxo', 'roxa'],
};

function resolverFamiliaCor(corPedida?: string): string[] | null {
  if (!corPedida) return null;
  const c = semAcento(corPedida);
  if (/neutr/.test(c)) return FAMILIAS_COR.neutros;
  if (/quent/.test(c)) return FAMILIAS_COR.quentes;
  if (/\bfri/.test(c)) return FAMILIAS_COR.frios;
  const cores = coresNoTexto(corPedida);
  if (cores.length === 0) return null;
  const familia = Object.values(FAMILIAS_COR).find((fam) => fam.some((x) => cores.includes(x)));
  return familia ?? cores;
}

function titulizar(item: string): string {
  const t = item.trim();
  return t.length > 0 ? t.charAt(0).toUpperCase() + t.slice(1) : t;
}

function produtoEhDoTipo(p: ProdutoRAG, item: string): boolean {
  const head = (semAcento(item).trim().split(/\s+/)[0] ?? '').replace(/s$/, '');
  if (head.length < 3) return true;
  const stem = head.slice(0, Math.max(4, head.length - 1));
  const txt = semAcento(`${p.nome} ${p.categoria} ${(p.tags ?? []).join(' ')}`);
  return txt.includes(stem);
}

function tituloPorCategoria(produtos: ProdutoRAG[], fallback: string): string {
  const cont = new Map<string, number>();
  for (const p of produtos) {
    const c = (p.categoria ?? '').trim();
    if (c) cont.set(c, (cont.get(c) ?? 0) + 1);
  }
  let melhor = '';
  let max = 0;
  for (const [c, n] of cont) {
    if (n > max) {
      max = n;
      melhor = c;
    }
  }
  return melhor ? titulizar(melhor) : fallback;
}

function linhaContextoProduto(p: ProdutoRAG, numero: number, prefixo = ''): string {
  const desc = p.descricao ? `: ${p.descricao.slice(0, 120)}` : '';
  const estoque = typeof p.estoque === 'number' ? ` [estoque: ${p.estoque}]` : '';
  const preco = typeof p.preco === 'number' ? ` [preço: R$ ${p.preco.toFixed(2)}]` : '';
  const variacoes =
    p.variacoes && p.variacoes.length > 0
      ? ` [variações: ${p.variacoes.map((v) => v.nome).join(', ')}]`
      : '';
  return `${prefixo}item ${numero} (id:${p.id}) — ${p.nome} (${p.loja})${desc}${estoque}${preco}${variacoes}`;
}

/** Extrai os IDs do bloco PROD_CTX na ordem dos itens (índice 0 = item 1). */
function idsDoContextoProdutos(ctx: string): string[] {
  const ids: string[] = [];
  const re = /item\s+(\d+)\s+\(id:([0-9a-fA-F-]{36})\)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(ctx)) !== null) {
    ids[Number(m[1]) - 1] = m[2];
  }
  return ids;
}

// ── Afunilamento de buscas genéricas ──────────────────────────────────────────
// Quando a busca é ampla demais (ex: "quero ver calçados"), em vez de despejar o
// catálogo, mostramos poucos produtos E devolvemos uma pergunta de qualificação
// + chips de refinamento que afunilam a próxima busca. Tudo determinístico: não
// gasta tokens e protege o banco de queries pesadas conforme o catálogo cresce.
type Funil = { gatilhos: string[]; pergunta: string; opcoes: string[] };

const FUNIS: Funil[] = [
  {
    gatilhos: ['calcado', 'sapato'],
    pergunta: 'Pra eu te ajudar a escolher, qual estilo você procura?',
    opcoes: ['Calçados esportivos', 'Calçados casuais', 'Sapatos sociais', 'Calçados infantis'],
  },
  {
    gatilhos: ['roupa', 'vestuario', 'moda'],
    pergunta: 'Pra afunilar certinho, pra quem é?',
    opcoes: ['Roupas masculinas', 'Roupas femininas', 'Roupas infantis'],
  },
  {
    gatilhos: ['eletronico'],
    pergunta: 'Tenho bastante coisa por aqui! O que você procura?',
    opcoes: ['Celulares', 'Notebooks', 'Fones de ouvido', 'Acessórios'],
  },
  {
    gatilhos: ['movel', 'moveis', 'decoracao'],
    pergunta: 'Pra qual ambiente você procura?',
    opcoes: ['Móveis de sala', 'Móveis de quarto', 'Móveis de cozinha', 'Móveis de escritório'],
  },
  {
    gatilhos: ['cosmetico', 'beleza'],
    pergunta: 'O que você está buscando?',
    opcoes: ['Maquiagem', 'Skincare', 'Perfumes', 'Cabelo'],
  },
  {
    gatilhos: ['brinquedo'],
    pergunta: 'Pra qual idade você procura?',
    opcoes: ['Brinquedos para bebês', 'Brinquedos infantis', 'Jogos e puzzles'],
  },
];

// Sinais de que a busca JÁ foi afunilada (gênero, ocasião, ambiente, tipo
// específico). Nesses casos não perguntamos de novo — evita loop e respeita
// o usuário que já foi específico. Cor e preço são tratados à parte.
// Stems propositalmente curtos para casar singular E plural ("infant" cobre
// infantil/infantis, "casua" cobre casual/casuais, "socia" cobre social/sociais)
// — senão um chip no plural re-dispararia o funil.
const TERMOS_REFINAMENTO = [
  'masculin',
  'feminin',
  'infant',
  'crianca',
  'menino',
  'menina',
  'homem',
  'mulher',
  'bebe',
  'unissex',
  'esportiv',
  'casua',
  'socia',
  'corrida',
  'academia',
  'festa',
  'trabalho',
  'praia',
  'sala',
  'quarto',
  'cozinha',
  'escritorio',
  'maquiagem',
  'skincare',
  'perfume',
  'cabelo',
  'celular',
  'notebook',
  'fone',
  'tablet',
];

// Retorna o funil aplicável quando a busca é ampla e ainda não foi qualificada.
function detectarFunil(texto: string, temPreco: boolean): Funil | null {
  if (temPreco) return null;
  if (coresNoTexto(texto).length > 0) return null;
  const q = semAcento(texto);
  if (TERMOS_REFINAMENTO.some((t) => q.includes(t))) return null;
  for (const f of FUNIS) {
    if (f.gatilhos.some((g) => new RegExp(`\\b${g}`).test(q))) return f;
  }
  return null;
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
  return produtos.slice(0, 6).map((p) => ({
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

/**
 * Gera um resumo da conversa e o salva no banco.
 * Chamado assincronamente a cada 20 mensagens para manter o AI
 * informado sobre o histórico sem crescer o custo de tokens indefinidamente.
 */
async function gerarResumoConversa(conversaId: string): Promise<void> {
  try {
    const msgs = await prisma.mensagemChat.findMany({
      where: { conversaId },
      orderBy: { criadaEm: 'asc' },
      select: { remetente: true, conteudo: true },
    });

    const historicoTexto = msgs
      .map((m) => {
        // Remove blocos de contexto interno antes de resumir
        const conteudo = m.conteudo.split('<<PROD_CTX>>')[0].trim().slice(0, 300);
        return `${m.remetente === 'usuario' ? 'Usuário' : 'Aju'}: ${conteudo}`;
      })
      .join('\n');

    const resultado = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      max_tokens: 200,
      messages: [
        {
          role: 'system',
          content:
            'Gere um resumo objetivo em até 3 frases desta conversa de chat de marketplace. Foque em: o que o usuário buscou, preferências mencionadas (cor, preço, categoria, loja), ações realizadas (tickets abertos, pedidos rastreados). Seja conciso e direto.',
        },
        { role: 'user', content: historicoTexto },
      ],
    });

    const resumo = resultado.choices[0].message.content?.trim() ?? '';
    if (resumo) {
      await prisma.conversaChat.update({
        where: { id: conversaId },
        data: { resumoContexto: resumo },
      });
    }
  } catch (err) {
    logger.warn({ err }, '[chat] falha ao gerar resumo de conversa');
  }
}

async function notificarSlackModeracao(dados: {
  usuarioId: string;
  strikes: number;
  trecho: string;
}): Promise<void> {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;
  if (!webhookUrl) return;
  const acoes: Record<number, string> = { 3: 'Ban 1h', 4: 'Ban 24h' };
  const acao = acoes[dados.strikes] ?? 'Ban 7 dias';
  const linhas = [
    `🚨 *Moderação de Chat* — Strike ${dados.strikes}`,
    `*Usuário:* \`${dados.usuarioId}\``,
    `*Mensagem:* "${dados.trecho}${dados.trecho.length === 100 ? '…' : ''}"`,
    `*Ação aplicada:* ${acao}`,
  ].join('\n');
  await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: linhas }),
  });
}

async function processarConjunto(
  args: {
    itens?: unknown;
    ocasiao?: string;
    genero?: string;
    cor?: string;
    precoMax?: unknown;
    precoMin?: unknown;
    lojaNome?: string;
  },
  ctx: { texto: string; lojaContexto: string | null; usuarioId: string },
): Promise<{
  resposta: {
    tipo: 'resposta';
    texto: string;
    sugestoes: string[];
    grupos: { titulo: string; produtos: ProdutoChat[]; quantidade?: number }[];
  };
  produtosFlat: ProdutoRAG[];
  conteudoSalvar: string;
}> {
  const itensParsed = (Array.isArray(args.itens) ? args.itens : [])
    .map((it): { tipo: string; quantidade: number } => {
      if (typeof it === 'string') return { tipo: it.trim(), quantidade: 1 };
      if (it && typeof it === 'object') {
        const o = it as { tipo?: unknown; quantidade?: unknown };
        const tipo = typeof o.tipo === 'string' ? o.tipo.trim() : '';
        const q = Number(o.quantidade);
        return { tipo, quantidade: Number.isInteger(q) && q >= 2 && q <= 99 ? q : 1 };
      }
      return { tipo: '', quantidade: 1 };
    })
    .filter((it) => it.tipo.length > 0);

  const truncado = itensParsed.length > 3;
  const itens = itensParsed.slice(0, 3);

  const sufixo = [args.ocasiao, args.genero]
    .filter((v): v is string => typeof v === 'string' && v.trim().length > 0)
    .join(' ')
    .trim();
  const familiaCor = resolverFamiliaCor(args.cor);
  const precoMax =
    typeof args.precoMax === 'number' && args.precoMax > 0 ? args.precoMax : undefined;
  const precoMin =
    typeof args.precoMin === 'number' && args.precoMin > 0 ? args.precoMin : undefined;
  const filtrosBusca: Record<string, string> = {};
  if (args.lojaNome?.trim()) filtrosBusca.lojaNome = args.lojaNome.trim();
  else if (ctx.lojaContexto) filtrosBusca.lojaId = ctx.lojaContexto;
  if (precoMax != null) filtrosBusca.precoMax = String(precoMax);
  if (precoMin != null) filtrosBusca.precoMin = String(precoMin);

  const candidatos: { titulo: string; produtos: ProdutoRAG[]; quantidade: number }[] = [];
  for (const item of itens) {
    const query = `${item.tipo} ${sufixo}`.trim();
    const resultado = await executarTool(
      'buscar_produtos',
      { query, ...filtrosBusca },
      ctx.usuarioId,
    );
    let dados = resultado.tipo === 'produtos' ? resultado.dados : [];

    if (familiaCor && dados.length > 0) {
      const naFamilia = dados.filter((p) => produtoTemCor(p, familiaCor));
      if (naFamilia.length > 0) dados = naFamilia;
    }

    candidatos.push({
      titulo: titulizar(item.tipo),
      produtos: dados.slice(0, 6),
      quantidade: item.quantidade,
    });
  }

  const resumoGrupos = candidatos
    .map(
      (g, gi) =>
        `Grupo ${gi + 1} "${g.titulo}": ` +
        (g.produtos.length > 0
          ? g.produtos.map((p, i) => `[${i + 1}] ${p.nome}`).join(', ')
          : 'nenhum candidato'),
    )
    .join('\n');

  type SelGrupo = { relevantes: number[]; altTitulo: string; altRel: number[] };
  const toIdx = (v: unknown): number[] =>
    Array.isArray(v) ? v.map((n) => Number(n)).filter((n) => Number.isInteger(n) && n >= 1) : [];

  let texto = '';
  let selecaoPorGrupo: SelGrupo[] = [];
  try {
    const ia = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      max_tokens: 400,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: SYSTEM_CONJUNTO },
        {
          role: 'user',
          content:
            `Pedido do usuário: "${ctx.texto}"\n` +
            (args.ocasiao ? `Ocasião: ${args.ocasiao}\n` : '') +
            (args.genero ? `Gênero: ${args.genero}\n` : '') +
            (args.cor ? `Cor desejada: ${args.cor}\n` : '') +
            `Candidatos por grupo:\n${resumoGrupos}`,
        },
      ],
    });
    const parsed = JSON.parse(ia.choices[0].message.content ?? '{}');
    if (typeof parsed.texto === 'string') texto = parsed.texto;
    if (Array.isArray(parsed.grupos)) {
      selecaoPorGrupo = parsed.grupos.map((g: unknown) => {
        const o = (g ?? {}) as {
          relevantes?: unknown;
          alternativaTitulo?: unknown;
          alternativaRelevantes?: unknown;
        };
        return {
          relevantes: toIdx(o.relevantes),
          altTitulo: typeof o.alternativaTitulo === 'string' ? o.alternativaTitulo.trim() : '',
          altRel: toIdx(o.alternativaRelevantes),
        };
      });
    }
  } catch {
    texto = '';
  }

  const mapProdutos = (idx: number[], pool: ProdutoRAG[]): ProdutoRAG[] => {
    const escolhidos = idx.map((n) => pool[n - 1]).filter((p): p is ProdutoRAG => !!p);
    return escolhidos.filter((p, i) => escolhidos.findIndex((q) => q.id === p.id) === i);
  };
  const correlacaoOk = selecaoPorGrupo.length === candidatos.length;
  const grupos = candidatos.map((g, gi) => {
    const quantidade = g.quantidade;
    if (correlacaoOk) {
      const sel = selecaoPorGrupo[gi];
      const certos = mapProdutos(sel.relevantes, g.produtos);
      if (certos.length > 0) return { titulo: g.titulo, produtos: certos.slice(0, 4), quantidade };
      const alternativos = mapProdutos(sel.altRel, g.produtos);
      if (alternativos.length > 0 && sel.altTitulo) {
        return { titulo: titulizar(sel.altTitulo), produtos: alternativos.slice(0, 4), quantidade };
      }
      if (g.produtos.length > 0) {
        return {
          titulo: tituloPorCategoria(g.produtos, 'Opções que combinam'),
          produtos: g.produtos.slice(0, 4),
          quantidade,
        };
      }
      return { titulo: g.titulo, produtos: [] as ProdutoRAG[], quantidade };
    }
    const certos = g.produtos.filter((p) => produtoEhDoTipo(p, itens[gi]?.tipo ?? ''));
    return { titulo: g.titulo, produtos: certos.slice(0, 4), quantidade };
  });

  const gruposComProdutos = grupos.filter((g) => g.produtos.length > 0);
  const produtosFlat = gruposComProdutos.flatMap((g) => g.produtos);

  if (!texto) {
    texto =
      gruposComProdutos.length > 0
        ? 'Separei um conjunto que combina pra você:'
        : 'Não achei esses produtos nas lojas daqui. Quer tentar outro estilo?';
  }
  if (truncado) {
    texto = `${texto} (Por enquanto monto conjuntos de até 3 peças, então foquei nas 3 primeiras.)`;
  }

  const sugestoesConjunto: string[] = [];
  if (gruposComProdutos.length > 0 && itens.length > 0) {
    const base = itens.map((i) => i.tipo.toLowerCase()).join(' e ');
    const baseCap = base.charAt(0).toUpperCase() + base.slice(1);
    if (!args.genero?.trim()) {
      sugestoesConjunto.push(`${baseCap} masculino`, `${baseCap} feminino`);
    } else {
      const oposto = /fem/i.test(args.genero) ? 'masculino' : 'feminino';
      sugestoesConjunto.push(`${baseCap} ${oposto}`);
    }
    if (!args.cor?.trim()) {
      sugestoesConjunto.push(`${baseCap} em tons neutros`);
    }
  }

  const linhasCtx: string[] = [];
  let contadorCtx = 0;
  for (const g of gruposComProdutos) {
    for (const p of g.produtos) {
      contadorCtx += 1;
      linhasCtx.push(linhaContextoProduto(p, contadorCtx, `[${g.titulo}] `));
    }
  }
  const conteudoSalvar =
    produtosFlat.length > 0 ? `${texto}<<PROD_CTX>>${linhasCtx.join(' | ')}` : texto;

  return {
    resposta: {
      tipo: 'resposta',
      texto,
      sugestoes: sugestoesConjunto.slice(0, 3),
      grupos: gruposComProdutos.map((g) => ({
        titulo: g.titulo,
        produtos: ragParaChat(g.produtos),
        ...(g.quantidade > 1 ? { quantidade: g.quantidade } : {}),
      })),
    },
    produtosFlat,
    conteudoSalvar,
  };
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

      // ── Verificação de ban ────────────────────────────────────────────────────
      const usuarioDB = await prisma.usuario.findUnique({
        where: { id: usuarioId },
        select: { chatBloqueadoAte: true, chatStrikesCount: true },
      });

      if (usuarioDB?.chatBloqueadoAte && usuarioDB.chatBloqueadoAte > new Date()) {
        const msRestante = usuarioDB.chatBloqueadoAte.getTime() - Date.now();
        const horas = Math.floor(msRestante / 3600000);
        const minutos = Math.ceil((msRestante % 3600000) / 60000);
        const tempoRestante =
          horas > 0
            ? `${horas}h${minutos > 0 ? ` ${minutos}min` : ''}`
            : `${minutos} minuto${minutos !== 1 ? 's' : ''}`;
        return res.json({
          tipo: 'resposta',
          texto: `Seu acesso ao chat está suspenso por envio de conteúdo inadequado. Tente novamente em ${tempoRestante}.`,
          sugestoes: [],
          conversaId,
        });
      }

      // ── Moderação de conteúdo + sistema de strikes ────────────────────────────
      // Usa a Moderation API gratuita da OpenAI. Strikes acumulam com escalada:
      // strike 1-2 → aviso | 3 → 1h ban | 4 → 24h ban | 5+ → 7 dias ban + Slack.
      try {
        const moderation = await openai.moderations.create({ input: texto });
        if (moderation.results[0].flagged) {
          const strikes = (usuarioDB?.chatStrikesCount ?? 0) + 1;

          const BAN_DURACOES: Record<number, number> = { 3: 60, 4: 1440, 5: 10080 }; // minutos
          const banMinutos = BAN_DURACOES[strikes] ?? (strikes > 5 ? 10080 : 0);
          const banAte = banMinutos > 0 ? new Date(Date.now() + banMinutos * 60_000) : null;

          await prisma.usuario.update({
            where: { id: usuarioId },
            data: { chatStrikesCount: strikes, ...(banAte ? { chatBloqueadoAte: banAte } : {}) },
          });

          if (strikes >= 3) {
            void notificarSlackModeracao({ usuarioId, strikes, trecho: texto.slice(0, 100) });
          }

          const textoResposta =
            strikes === 1
              ? 'Ei, esse tipo de mensagem não é adequado por aqui! Posso te ajudar a encontrar produtos ou resolver problemas com pedidos. 😊'
              : strikes === 2
                ? 'Atenção: mais uma mensagem inadequada e seu acesso ao chat será suspenso. Posso te ajudar com compras ou pedidos?'
                : banMinutos === 60
                  ? 'Seu acesso ao chat foi suspenso por 1 hora devido ao envio de conteúdo inadequado.'
                  : banMinutos === 1440
                    ? 'Seu acesso ao chat foi suspenso por 24 horas por reincidência.'
                    : 'Seu acesso ao chat foi suspenso por 7 dias por múltiplas reincidências.';

          await salvarMensagens(conversaId, texto, textoResposta);
          return res.json({
            tipo: 'resposta',
            texto: textoResposta,
            sugestoes: strikes < 3 ? ['Buscar produtos', 'Rastrear pedido'] : [],
            ...(strikes < 3 ? { strikesCount: strikes, strikesMax: 3 } : {}),
            conversaId,
          });
        }
      } catch {
        // Moderação falhou — continua normalmente para não bloquear o usuário
      }

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
          /\b(outra\s+(coisa|pergunta)|esquece?(\s+isso)?|muda\s+(de\s+)?assunto|n[aã]o\s+quero\s+mais|cancela?\s+isso)\b/i.test(
            texto,
          ) ||
          /deixa\s+(pra\s+l[aá]|isso|de\s+lado)/i.test(texto) ||
          /sa[ií]\s+(disso|daqui|fora)/i.test(texto) ||
          /para\s+(isso|com\s+isso)/i.test(texto) ||
          /chega\s+disso/i.test(texto) ||
          /n[aã]o\s+(preciso|quero)\s+mais/i.test(texto) ||
          /tudo\s+bem\s+obrigad/i.test(texto) ||
          /(^|\s)(tchau|flw|valeu|obrigad\w*)(\s|$)/i.test(texto);

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

      // ── Detecção de idioma não-latino ────────────────────────────────────────
      // Scripts não-latinos (árabe, CJK, japonês, coreano, cirílico, hindi, tailandês)
      // recebem resposta bilíngue redirecionando para português, sem passar pelo AI.
      // Idiomas latinos (inglês, espanhol, francês) são tratados pelo AI normalmente
      // graças à instrução "sempre responda em português" no SYSTEM_AGENTE.
      const contemNaoLatino =
        /[؀-ۿݐ-ݿ]/.test(texto) || // árabe
        /[一-鿿぀-ヿ가-힯]/.test(texto) || // CJK, japonês, coreano
        /[Ѐ-ӿ]/.test(texto) || // cirílico (russo, etc.)
        /[ऀ-ॿ]/.test(texto) || // devanagari (hindi)
        /[฀-๿]/.test(texto); // tailandês

      if (contemNaoLatino) {
        const textoResposta =
          'Nosso serviço funciona apenas em português 🇧🇷\nOur service is currently available in Portuguese only.\nEl servicio está disponible solo en portugués.\n\nMe conta o que você procura em português!';
        await salvarMensagens(conversaId, texto, textoResposta);
        return res.json({ tipo: 'resposta', texto: textoResposta, sugestoes: [], conversaId });
      }

      // ── Sugestão "Rastrear outro pedido" → reinicia o fluxo diretamente ────────
      if (/rastrear.*(outro|um|meu)?\s*pedido/i.test(texto.trim()) && !estado) {
        const resultado = await iniciarFluxoRastreio(conversaId, usuarioId);
        await salvarMensagens(conversaId, texto, resultado.texto);
        return res.json({ ...resultado, conversaId });
      }

      // ── Fluxo normal com OpenAI ───────────────────────────────────────────────
      // Usa o histórico do banco (tem conteúdo enriquecido) em vez do frontend.
      // Mensagens com <<PROD_CTX>> são divididas: display text → role:assistant,
      // contexto de produto → role:system no final (o AI lê mas não ecoa ao usuário).
      const [dbHistorico, conversaParaResumo] = await Promise.all([
        obterHistoricoParaIA(conversaId),
        prisma.conversaChat.findUnique({
          where: { id: conversaId },
          select: { resumoContexto: true },
        }),
      ]);

      const PROD_CTX_MARKER = '<<PROD_CTX>>';
      let ultimoContextoProdutos = '';

      const historicoParsed: OpenAI.Chat.ChatCompletionMessageParam[] = [];

      // Injeta o resumo da conversa anterior como contexto fixo, se existir.
      if (conversaParaResumo?.resumoContexto) {
        historicoParsed.push({
          role: 'system',
          content: `Resumo da conversa anterior com este usuário: ${conversaParaResumo.resumoContexto}`,
        });
      }

      for (const m of dbHistorico.length > 0 ? dbHistorico : historico) {
        if (m.remetente === 'aju') {
          const sepIdx = m.conteudo.indexOf(PROD_CTX_MARKER);
          if (sepIdx !== -1) {
            ultimoContextoProdutos = m.conteudo.slice(sepIdx + PROD_CTX_MARKER.length);
            historicoParsed.push({
              role: 'assistant',
              content: m.conteudo.slice(0, sepIdx).trim(),
            });
          } else {
            historicoParsed.push({ role: 'assistant', content: m.conteudo });
          }
        } else {
          historicoParsed.push({ role: 'user', content: m.conteudo });
        }
      }

      // Injeta o contexto de produtos como system message — visível ao AI mas nunca
      // incluído no output, evitando que ele repita o bloco de contexto ao usuário.
      if (ultimoContextoProdutos) {
        historicoParsed.push({
          role: 'system',
          content: `Contexto dos produtos mostrados ao usuário na última busca (use para responder follow-ups — NUNCA repita este bloco ao usuário): ${ultimoContextoProdutos}`,
        });
      }

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

        // Follow-up sobre produto(s) específico(s) do histórico: re-exibe o card.
        // A IA devolve "produtoRef" (números 1-based); mapeamos para os IDs salvos
        // no último bloco PROD_CTX e buscamos o produto pra montar o card.
        const refs = Array.isArray(resposta.produtoRef)
          ? (resposta.produtoRef as unknown[])
              .map((n) => Number(n))
              .filter((n) => Number.isInteger(n) && n >= 1)
          : [];
        delete resposta.produtoRef;
        resposta.produtos = [];

        let produtosRef: ProdutoRAG[] = [];
        if (refs.length > 0 && ultimoContextoProdutos) {
          const idsOrdenados = idsDoContextoProdutos(ultimoContextoProdutos);
          const idsEscolhidos = [...new Set(refs.map((n) => idsOrdenados[n - 1]).filter(Boolean))];
          if (idsEscolhidos.length > 0) {
            const encontrados = await buscarProdutosPorIds(idsEscolhidos);
            produtosRef = idsEscolhidos
              .map((id) => encontrados.find((p) => p.id === id))
              .filter((p): p is ProdutoRAG => !!p);
            resposta.produtos = ragParaChat(produtosRef);
          }
        }

        const { msgAju } = await salvarMensagens(conversaId, texto, resposta.texto || '');
        if (produtosRef.length > 0) await salvarSugestoesChat(msgAju.id, produtosRef);
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

      if (toolCall.function.name === 'buscar_conjunto') {
        const conjuntoArgs = JSON.parse(toolCall.function.arguments) as {
          itens?: unknown;
          ocasiao?: string;
          genero?: string;
          cor?: string;
        };
        const { resposta, produtosFlat, conteudoSalvar } = await processarConjunto(conjuntoArgs, {
          texto,
          lojaContexto,
          usuarioId,
        });
        const { msgAju } = await salvarMensagens(conversaId, texto, conteudoSalvar);
        if (produtosFlat.length > 0) await salvarSugestoesChat(msgAju.id, produtosFlat);
        return res.json({ ...resposta, conversaId });
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
              corDisponivel:
                coresPedidas.length > 0 && toolResult.dados.length > 0
                  ? toolResult.dados.some((p) => produtoTemCor(p, coresPedidas))
                  : null,
              // Descrição truncada a 200 chars para o AI ter contexto sem inflar o prompt.
              produtos: toolResult.dados.map((p) => ({
                ...p,
                descricao: p.descricao
                  ? p.descricao.slice(0, 200) + (p.descricao.length > 200 ? '…' : '')
                  : '',
              })),
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

      // conteudoParaSalvar: o que vai para o banco (e vira contexto do AI no próximo turno).
      // Por padrão é igual ao texto exibido. Quando o fallback injeta produtos,
      // inclui nomes e lojas para o AI poder responder sobre eles — mas resposta.texto
      // fica limpo para não mostrar a lista crua ao consumidor.
      let conteudoParaSalvar: string | undefined;
      // Marca quando os produtos exibidos vieram do fallback (categoria/similares/
      // populares) — nesse caso não afunilamos, pois a busca original não casou.
      let usouFallbackSimilares = false;

      // ── Produtos similares quando busca retorna vazio ──────────────────────────
      // 1. Categoria inferida: mapeia query → categoria ampla e busca produtos dela
      // 2. RAG 0.65: semântico, fallback quando categoria não é reconhecida
      // 3. Produtos em destaque: último recurso quando nada da categoria existe ainda
      if (toolResult.tipo === 'produtos' && produtosExibidos.length === 0) {
        try {
          const categoriaInferida = inferirCategoria(texto);
          let similares: ProdutoRAG[] = [];
          let sufixoTexto = '';

          if (categoriaInferida) {
            similares = await buscarProdutosFallback(categoriaInferida, { limit: 3 });
            sufixoTexto = `— mas separei outros produtos de ${categoriaInferida} que podem te interessar:`;
          }

          if (similares.length === 0) {
            similares = await buscarProdutosRAG(texto, { threshold: 0.65, limit: 3 });
            sufixoTexto = '— mas separei algumas opções parecidas que podem te interessar:';
          }

          if (similares.length === 0) {
            similares = await buscarProdutosPopulares(3);
            sufixoTexto = '— mas dá uma olhada no que está em destaque nas lojas daqui:';
          }

          if (similares.length > 0) {
            usouFallbackSimilares = true;
            produtosExibidos = similares;
            resposta.produtos = ragParaChat(similares);

            const textoAtual = typeof resposta.texto === 'string' ? resposta.texto : '';
            const textoDisplay = `${textoAtual.replace(/[.!]+$/, '')} ${sufixoTexto}`;
            resposta.texto = textoDisplay;

            // Salva com numeração explícita 1-based para o AI referenciar corretamente
            // quando o usuário disser "item 1", "item 2" etc. — alinhado com os badges dos cards.
            const listaProdutos = similares
              .map((p, i) => linhaContextoProduto(p, i + 1))
              .join(' | ');
            conteudoParaSalvar = `${textoDisplay}<<PROD_CTX>>${listaProdutos}`;
          }
        } catch {
          // Silencia erro para não derrubar o fluxo principal
        }
      }

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

      // ── Loja fechada → sugere alternativas abertas na mesma categoria ──────────
      if (toolResult.tipo === 'infoLoja' && toolResult.dados !== null && !toolResult.dados.aberta) {
        try {
          const alternativas = await prisma.loja.findMany({
            where: {
              aberta: true,
              categoria: toolResult.dados.categoria,
              ...(lojaContexto ? { id: { not: lojaContexto } } : {}),
            },
            select: { nome: true },
            take: 2,
          });
          if (alternativas.length > 0) {
            const sugestoesAtivas = Array.isArray(resposta.sugestoes)
              ? (resposta.sugestoes as string[])
              : [];
            resposta.sugestoes = [
              ...alternativas.map((l) => `Ver produtos da ${l.nome}`),
              ...sugestoesAtivas,
            ].slice(0, 3);
          }
        } catch {
          // silencia — não crítico
        }
      }

      // Injeta quantidade APÓS o fallback de similares para cobrir ambos os casos
      // (busca normal E busca que caiu no fallback de categoria/RAG ampliado).
      if (toolResult.tipo === 'produtos' && produtosExibidos.length > 0) {
        const quantidade = extrairQuantidade(texto);
        if (quantidade) resposta.quantidade = quantidade;
      }

      // ── Afunilamento agêntico de busca genérica ────────────────────────────────
      // Busca ampla (ex: "quero ver calçados"): mostra os poucos produtos já
      // selecionados E injeta pergunta de qualificação + chips de refinamento, em
      // vez de deixar a resposta genérica. Determinístico, sem custo de tokens.
      if (
        toolResult.tipo === 'produtos' &&
        produtosExibidos.length > 0 &&
        !usouFallbackSimilares &&
        !toolResult.foraContextoLoja
      ) {
        const temPreco = !!(toolArgs.precoMax || toolArgs.precoMin);
        const funil = detectarFunil(texto, temPreco);
        if (funil) {
          resposta.texto = `Separei algumas opções pra começar! ${funil.pergunta}`;
          resposta.sugestoes = funil.opcoes;
        }
      }

      // ── Coerência entre texto e cards ──────────────────────────────────────────
      // A IA às vezes seleciona produtos parecidos para exibir MAS escreve um texto
      // de "não encontrei" (ex: pediu "sapatos sociais", mostra tênis e diz só
      // "Ainda não temos sapatos sociais"). Sem uma ponte, texto e carrossel ficam
      // contraditórios. Quando há cards e o texto é negativo, costura a transição —
      // mesmo padrão do fallback de similares, mas para o caso em que a própria IA
      // escolheu os produtos (e por isso o fallback determinístico não rodou).
      if (
        toolResult.tipo === 'produtos' &&
        produtosExibidos.length > 0 &&
        !usouFallbackSimilares &&
        !toolResult.foraContextoLoja
      ) {
        const txt = typeof resposta.texto === 'string' ? resposta.texto : '';
        const negativo = /n[ãa]o\s+(temos|tem|achei|encontr|h[áa])|ainda n[ãa]o|infelizmente/i.test(
          txt,
        );
        const jaTemPonte = /separei|d[áa] uma olhada|que podem te|:\s*$/i.test(txt);
        if (negativo && !jaTemPonte) {
          const cat = inferirCategoria(texto);
          const ponte = cat
            ? `mas separei outros produtos de ${cat} que podem te interessar:`
            : 'mas separei algumas opções parecidas que podem te interessar:';
          resposta.texto = `${txt.replace(/[.!\s]+$/, '')} — ${ponte}`;
        }
      }

      // Pedidos listados viram cards interativos (em vez de só texto da IA).
      if (toolResult.tipo === 'pedidos' && toolResult.dados.length > 0) {
        resposta.tipo = 'listarPedidos';
        resposta.pedidos = toolResult.dados.map((p, idx) => ({
          numero: idx + 1,
          id: p.id,
          loja: p.loja,
          lojaImagem: p.lojaImagem ?? null,
          total: p.total,
          data: p.criadoEm.split('T')[0],
          itens: p.itens,
          status: p.status,
        }));
      }

      // Tickets consultados → tipo especial para o frontend redirecionar à tela de tickets.
      if (toolResult.tipo === 'tickets') {
        resposta.tipo = 'verTickets';
        resposta.tickets = toolResult.dados;
      }

      // Para buscas normais (não fallback), enriquece o conteúdo salvo com
      // produto+descrição para o AI ter contexto em follow-ups.
      if (toolResult.tipo === 'produtos' && produtosExibidos.length > 0 && !conteudoParaSalvar) {
        const listaProdutos = produtosExibidos
          .map((p, i) => linhaContextoProduto(p, i + 1))
          .join(' | ');
        conteudoParaSalvar = `${(resposta.texto as string) ?? ''}<<PROD_CTX>>${listaProdutos}`;
      }

      const { msgAju } = await salvarMensagens(
        conversaId,
        texto,
        conteudoParaSalvar ?? (resposta.texto as string) ?? '',
      );

      if (toolResult.tipo === 'produtos' && produtosExibidos.length > 0) {
        await salvarSugestoesChat(msgAju.id, produtosExibidos);
      }

      // Dispara sumarização assíncrona a cada 20 mensagens (10 turnos de conversa).
      // Não bloqueia a resposta — roda em background.
      prisma.mensagemChat
        .count({ where: { conversaId } })
        .then((total) => {
          if (total % 20 === 0) void gerarResumoConversa(conversaId);
        })
        .catch(() => {});

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

// GET /chat/sugestoes — retorna 3 sugestões personalizadas pelo histórico ou sazonais
router.get('/sugestoes', authMiddleware, authUsuario, async (req: AuthRequest, res: Response) => {
  try {
    const usuarioId = req.user!.id;

    const conversa = await prisma.conversaChat.findFirst({
      where: { usuarioId },
      orderBy: { atualizadoEm: 'desc' },
    });

    const fallback = getSugestoesEstacionais();

    if (!conversa) return res.json({ sugestoes: fallback });

    const mensagens = await prisma.mensagemChat.findMany({
      where: { conversaId: conversa.id, remetente: 'usuario' },
      orderBy: { criadaEm: 'desc' },
      take: 8,
      select: { conteudo: true },
    });

    if (mensagens.length === 0) return res.json({ sugestoes: fallback });

    const historico = mensagens
      .map((m) =>
        m.conteudo
          .replace(/\[lojaId:[^\]]+\]/g, '')
          .trim()
          .slice(0, 80),
      )
      .filter(Boolean)
      .join(' | ');

    const resultado = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      max_tokens: 80,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content:
            'Gere exatamente 3 sugestões de busca curtas e específicas para um chat de marketplace em Aracaju (SE), baseadas no histórico de buscas do usuário. Retorne JSON: {"sugestoes":["s1","s2","s3"]}. Cada sugestão: máximo 30 caracteres, tom informal, variadas entre si.',
        },
        { role: 'user', content: `Buscas recentes: ${historico}` },
      ],
    });

    const parsed = JSON.parse(resultado.choices[0].message.content ?? '{}');
    const sugestoes =
      Array.isArray(parsed.sugestoes) && parsed.sugestoes.length === 3
        ? (parsed.sugestoes as string[])
        : fallback;

    res.json({ sugestoes });
  } catch {
    res.json({ sugestoes: getSugestoesEstacionais() });
  }
});

function getSugestoesEstacionais(): string[] {
  const mes = new Date().getMonth() + 1;
  const SAZONAIS: Record<number, string[]> = {
    1: ['Liquidação de verão', 'Óculos de sol', 'Protetor solar'],
    2: ['Presente pra namorada', 'Perfume feminino', 'Chocolates finos'],
    3: ['Roupa de academia', 'Tênis esportivo', 'Whey protein'],
    4: ['Presente de Páscoa', 'Chocolate artesanal', 'Cesta de café'],
    5: ['Presente Dia das Mães', 'Bolsa feminina', 'Perfume especial'],
    6: ['Roupa junina', 'Comida nordestina', 'Chapéu de palha'],
    7: ['Moletom e casaco', 'Cobertor grosso', 'Bota de cano'],
    8: ['Presente Dia dos Pais', 'Eletrônico masculino', 'Perfume masculino'],
    9: ['Tênis colorido', 'Vestido floral', 'Sandália nova'],
    10: ['Fantasia criativa', 'Decoração de festa', 'Acessório divertido'],
    11: ['Eletrônico em oferta', 'Tênis barato', 'Celular novo'],
    12: ['Presente de Natal', 'Panetone especial', 'Decoração natalina'],
  };
  return SAZONAIS[mes] ?? ['Tênis preto até R$200', 'Presente pra mamãe', 'Fone bluetooth'];
}

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
