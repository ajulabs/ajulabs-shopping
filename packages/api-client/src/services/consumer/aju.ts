import { MensagemChat, RespostaAju } from '@ajulabs/types';

declare const process: { env: Record<string, string | undefined> };
const API_URL = (process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000').replace(/\/$/, '');

const ERRO_CONEXAO = 'Ops, tive um problema de conexão. Tente novamente em instantes.';

export async function matchAju(
  historico: MensagemChat[],
  textoUsuario: string,
  token: string,
  conversaId?: string,
  pedidoSelecionadoId?: string,
): Promise<RespostaAju> {
  let response: Response;
  try {
    response = await fetch(`${API_URL}/chat/mensagem`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        texto: textoUsuario,
        historico: historico.map((m) => ({
          remetente: m.remetente,
          conteudo: m.conteudo,
        })),
        conversaId,
        pedidoSelecionadoId,
      }),
    });
  } catch (err) {
    // Falha de rede (offline, DNS, timeout) — mensagem amigável, não o erro cru
    console.error('[matchAju] rede', err);
    throw new Error(ERRO_CONEXAO);
  }

  const data = await response.json().catch(() => ({}) as Record<string, unknown>);

  if (!response.ok) {
    // Prioriza texto amigável vindo do servidor (ex: rate-limit, erro tratado);
    // nunca expõe arrays de validação ou "Erro 500" cru.
    const errMsg =
      typeof data.texto === 'string'
        ? data.texto
        : typeof data.error === 'string'
          ? data.error
          : 'Eita, tive um probleminha aqui. Tenta de novo!';
    throw new Error(errMsg);
  }

  return data as RespostaAju;
}

/**
 * Reidrata o histórico da conversa mais recente a partir do servidor.
 * Usado quando não há histórico salvo localmente (ex: outro aparelho, web,
 * dados do app limpos). Retorna apenas texto — cards/produtos não são persistidos.
 */
export async function obterHistoricoAju(
  token: string,
): Promise<{ conversaId?: string; mensagens: MensagemChat[] }> {
  try {
    const res = await fetch(`${API_URL}/chat/historico`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return { mensagens: [] };
    const data = await res.json().catch(() => ({}));
    return {
      conversaId: typeof data.conversaId === 'string' ? data.conversaId : undefined,
      mensagens: Array.isArray(data.mensagens) ? (data.mensagens as MensagemChat[]) : [],
    };
  } catch {
    return { mensagens: [] };
  }
}

/** Retorna sugestões iniciais personalizadas (histórico) ou sazonais (sem histórico). */
export async function buscarSugestoesAju(token: string): Promise<string[]> {
  try {
    const res = await fetch(`${API_URL}/chat/sugestoes`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return [];
    const data = await res.json().catch(() => ({}));
    return Array.isArray(data.sugestoes) ? data.sugestoes : [];
  } catch {
    return [];
  }
}

/** Apaga toda a conversa do usuário no servidor (para a exclusão "colar" no F5/web). */
export async function limparHistoricoAju(token: string): Promise<void> {
  try {
    await fetch(`${API_URL}/chat/historico`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch {
    // fire-and-forget: não bloqueia o usuário
  }
}

export async function registrarCliqueSugestao(sugestaoId: string, token: string): Promise<void> {
  try {
    await fetch(`${API_URL}/chat/sugestao/${sugestaoId}/clique`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch {
    // fire-and-forget: não bloqueia o usuário
  }
}
