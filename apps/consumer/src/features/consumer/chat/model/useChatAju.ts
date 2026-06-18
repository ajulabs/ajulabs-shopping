import { useState, useRef, useEffect, useCallback } from 'react';
import { Platform, Alert } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { MensagemChat } from '@ajulabs/types';
import {
  matchAju,
  obterHistoricoAju,
  limparHistoricoAju,
  buscarSugestoesAju,
} from '@ajulabs/api-client';
import { useAuthStore } from '../../../../store';
import { takePendingChatContext, takePendingChatAction } from './pendingChatContext';
import { storage, ONBOARDING_KEY, chatKey, sugestoesKey } from '../lib/storage';

const SUGESTOES_FALLBACK = ['Tênis preto até R$200', 'Presente pra mamãe', 'Fone bluetooth'];
const SUGESTOES_CACHE_TTL = 6 * 60 * 60 * 1000; // 6 horas

const MENSAGEM_INICIAL: MensagemChat = {
  id: '0',
  remetente: 'aju',
  conteudo:
    'Oi! Sou a Aju, sua personal shopper aqui de Aracaju. Me diz o que tá procurando que eu acho nas lojas daqui.',
  criadaEm: new Date().toISOString(),
};

export { ONBOARDING_KEY, storage };

export function useChatAju() {
  const token = useAuthStore((s) => s.token) ?? '';
  const userId = useAuthStore((s) => s.userId);

  const [mensagens, setMensagens] = useState<MensagemChat[]>([MENSAGEM_INICIAL]);
  const [sugestoes, setSugestoes] = useState<string[]>(SUGESTOES_FALLBACK);
  const [carregando, setCarregando] = useState(false);
  const [conversaId, setConversaId] = useState<string | undefined>(undefined);

  // Token via ref: usado dentro de efeitos sem que sua rotação re-dispare a carga.
  const tokenRef = useRef(token);
  tokenRef.current = token;

  // Preserva o lojaId da conversa atual para que follow-ups funcionem mesmo após
  // limpar a conversa (o histórico do banco é apagado mas o contexto em memória fica).
  const lojaContextoRef = useRef<string | null>(null);

  // Carrega histórico ao montar: primeiro o local (rico, com cards); se não houver,
  // reidrata do servidor (ex: outro aparelho, web, dados do app limpos).
  useEffect(() => {
    if (!userId) return;
    let cancelado = false;

    storage.getItem(chatKey(userId)).then(async (raw) => {
      if (cancelado) return;

      if (raw) {
        try {
          const { conversaId: cid, mensagens: msgs } = JSON.parse(raw);
          if (cid) setConversaId(cid);
          if (Array.isArray(msgs) && msgs.length > 0) {
            setMensagens(msgs);
            // As sugestões iniciais não fazem sentido se já há conversa salva —
            // a última mensagem da Aju já carrega as sugestões dentro de resposta.sugestoes
            setSugestoes([]);
          }
          return;
        } catch {}
      }

      // Sem histórico local → tenta o servidor
      const tk = tokenRef.current;
      if (!tk) return;
      const { conversaId: cid, mensagens: msgs } = await obterHistoricoAju(tk);
      if (cancelado || msgs.length === 0) return;
      if (cid) setConversaId(cid);
      // Só reidrata se o usuário ainda não interagiu (evita sobrescrever)
      setMensagens((prev) => (prev.length <= 1 ? [MENSAGEM_INICIAL, ...msgs] : prev));
      setSugestoes([]);
    });

    return () => {
      cancelado = true;
    };
  }, [userId]);

  // Busca sugestões personalizadas em background com cache de 6h.
  // Só atualiza as sugestões iniciais — não interfere em conversas já iniciadas.
  useEffect(() => {
    if (!userId || !token) return;
    const key = sugestoesKey(userId);

    storage.getItem(key).then(async (raw) => {
      if (raw) {
        try {
          const { sugestoes: cached, ts } = JSON.parse(raw);
          if (Date.now() - ts < SUGESTOES_CACHE_TTL && Array.isArray(cached)) {
            setSugestoes((prev) => (prev.length === 0 ? cached : prev));
            return;
          }
        } catch {}
      }
      const novas = await buscarSugestoesAju(token);
      if (novas.length > 0) {
        setSugestoes((prev) => (prev.length === 0 ? novas : prev));
        storage.setItem(key, JSON.stringify({ sugestoes: novas, ts: Date.now() })).catch(() => {});
      }
    });
  }, [userId, token]);

  const enviarMensagem = useCallback(
    async (texto: string, pedidoSelecionadoId?: string) => {
      if (!texto.trim() || carregando) return;

      // Captura o lojaId quando presente na mensagem (ex: vindo do botão "Conversar com Aju")
      const lojaMatch = texto.match(/\[lojaId:([0-9a-f-]{36})\]/i);
      if (lojaMatch) lojaContextoRef.current = lojaMatch[1];

      // Se há contexto de loja em memória mas a mensagem não inclui o lojaId (follow-up
      // após limpar conversa), injeta no texto enviado ao backend para o contexto persistir.
      const textoBackend =
        lojaContextoRef.current && !texto.includes('[lojaId:')
          ? `${texto} [lojaId:${lojaContextoRef.current}]`
          : texto;

      const textoExibido = textoBackend.replace(/\s*\[lojaId:[^\]]+\]/g, '');
      const msgUsuario: MensagemChat = {
        id: Date.now().toString(),
        remetente: 'usuario',
        conteudo: textoExibido,
        criadaEm: new Date().toISOString(),
      };

      setMensagens((prev) => [...prev, msgUsuario]);
      setSugestoes([]);
      setCarregando(true);

      try {
        const resposta = await matchAju(
          mensagens,
          textoBackend,
          token,
          conversaId,
          pedidoSelecionadoId,
        );

        if (resposta.conversaId && !conversaId) {
          setConversaId(resposta.conversaId);
        }

        const msgAju: MensagemChat = {
          id: (Date.now() + 1).toString(),
          remetente: 'aju',
          conteudo: resposta.texto,
          resposta,
          criadaEm: new Date().toISOString(),
        };

        setMensagens((prev) => {
          const atualizadas = [...prev, msgAju];
          if (userId) {
            const cid = resposta.conversaId ?? conversaId;
            storage
              .setItem(
                chatKey(userId),
                JSON.stringify({ conversaId: cid, mensagens: atualizadas.slice(-50) }),
              )
              .catch(() => {});
          }
          return atualizadas;
        });
      } catch (err) {
        const conteudo =
          err instanceof Error && err.message
            ? err.message
            : 'Ops, tive um problema de conexão. Tente novamente em instantes.';
        const msgErro: MensagemChat = {
          id: (Date.now() + 1).toString(),
          remetente: 'aju',
          conteudo,
          criadaEm: new Date().toISOString(),
        };
        // Não persiste erros no histórico — são transitórios.
        setMensagens((prev) => [...prev, msgErro]);
      } finally {
        setCarregando(false);
      }
    },
    [mensagens, token, conversaId, userId, carregando],
  );

  // Auto-send ao focar o chat após navegar de outra tela.
  // Ref mantém a versão mais recente de enviarMensagem sem re-disparar o efeito.
  const enviarMensagemRef = useRef(enviarMensagem);
  enviarMensagemRef.current = enviarMensagem;

  useFocusEffect(
    useCallback(() => {
      if (!token) return;

      const ctx = takePendingChatContext();
      if (ctx) {
        enviarMensagemRef.current(`Quero ver produtos da loja ${ctx.nome} [lojaId:${ctx.id}]`);
        return;
      }

      const action = takePendingChatAction();
      if (action === 'reclamar') {
        enviarMensagemRef.current('Tive um problema com meu pedido');
      }
    }, [token]),
  );

  const limparConversa = useCallback(() => {
    const executar = () => {
      if (userId) {
        storage.removeItem(chatKey(userId)).catch(() => {});
        storage.removeItem(sugestoesKey(userId)).catch(() => {});
      }
      // Apaga também no servidor — senão o F5/outro aparelho reidrata a conversa de volta.
      if (token) limparHistoricoAju(token).catch(() => {});
      lojaContextoRef.current = null;
      setMensagens([MENSAGEM_INICIAL]);
      setConversaId(undefined);
      setSugestoes(SUGESTOES_FALLBACK);
    };

    if (Platform.OS === 'web') {
      if (window.confirm('Deseja apagar todo o histórico da conversa com a Aju?')) executar();
      return;
    }

    Alert.alert(
      'Apagar conversa',
      'Deseja apagar todo o histórico da conversa com a Aju? Esta ação não pode ser desfeita.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Apagar', style: 'destructive', onPress: executar },
      ],
    );
  }, [userId, token]);

  return { mensagens, sugestoes, carregando, enviarMensagem, limparConversa };
}
