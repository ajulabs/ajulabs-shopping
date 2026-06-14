import { useState, useRef, useEffect, useCallback } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { MensagemChat } from '@ajulabs/types';
import { ChatMsg } from './ChatMsg';
import { ChatInput } from './ChatInput';
import {
  matchAju,
  obterHistoricoAju,
  limparHistoricoAju,
  buscarSugestoesAju,
} from '@ajulabs/api-client';
import {
  View,
  Text,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Animated,
  StyleSheet,
  Modal,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { colors } from '@ajulabs/theme';
import { useTheme } from '../../../../hooks';
import { useAuthStore } from '../../../../store';
import { takePendingChatContext, takePendingChatAction } from '../model/pendingChatContext';
import { useTranscricao } from '../model/useTranscricao';
import * as SecureStore from 'expo-secure-store';

const ONBOARDING_KEY = 'aju_onboarding_v1';
const chatKey = (userId: string) => `aju_chat_${userId}`;

// expo-secure-store não funciona na web — fallback para localStorage
const storage = {
  getItem: (key: string) =>
    Platform.OS === 'web'
      ? Promise.resolve(typeof localStorage !== 'undefined' ? localStorage.getItem(key) : null)
      : SecureStore.getItemAsync(key),
  setItem: (key: string, value: string) => {
    if (Platform.OS === 'web') {
      if (typeof localStorage !== 'undefined') localStorage.setItem(key, value);
      return Promise.resolve();
    }
    return SecureStore.setItemAsync(key, value);
  },
  removeItem: (key: string) => {
    if (Platform.OS === 'web') {
      if (typeof localStorage !== 'undefined') localStorage.removeItem(key);
      return Promise.resolve();
    }
    return SecureStore.deleteItemAsync(key);
  },
};

const SUGESTOES_FALLBACK = ['Tênis preto até R$200', 'Presente pra mamãe', 'Fone bluetooth'];
const SUGESTOES_CACHE_TTL = 6 * 60 * 60 * 1000; // 6 horas
const sugestoesKey = (userId: string) => `aju_sugestoes_v1_${userId}`;

const MENSAGEM_INICIAL: MensagemChat = {
  id: '0',
  remetente: 'aju',
  conteudo:
    'Oi! Sou a Aju, sua personal shopper aqui de Aracaju. Me diz o que tá procurando que eu acho nas lojas daqui.',
  criadaEm: new Date().toISOString(),
};

const CAPABILITIES: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  color: string;
  title: string;
  desc: string;
}[] = [
  {
    icon: 'search-outline',
    color: '#f97316',
    title: 'Buscar Produtos',
    desc: 'Descreva o que quer e encontro produtos similares por você',
  },
  {
    icon: 'receipt-outline',
    color: '#2563EB',
    title: 'Rastrear Pedidos',
    desc: 'Saiba exatamente onde está seu pedido e quando chega',
  },
  {
    icon: 'alert-circle-outline',
    color: '#DC2626',
    title: 'Fazer Reclamação',
    desc: 'Produto com defeito, não chegou ou diferente? Resolvemos em 24h',
  },
  {
    icon: 'chatbubble-outline',
    color: '#7C3AED',
    title: 'Tirar Dúvidas',
    desc: 'Pergunte sobre políticas, entrega, trocas, etc',
  },
];

const QUICK_ACTIONS: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  msg: string;
  color: string;
}[] = [
  { icon: 'search-outline', label: 'Buscar', msg: 'Quero buscar produtos', color: '#f97316' },
  { icon: 'receipt-outline', label: 'Pedidos', msg: 'Quero rastrear meu pedido', color: '#2563EB' },
  {
    icon: 'alert-circle-outline',
    label: 'Reclamar',
    msg: 'Tive um problema com meu pedido',
    color: '#DC2626',
  },
  { icon: 'help-circle-outline', label: 'Dúvidas', msg: 'Tenho uma dúvida', color: '#7C3AED' },
];

export function ChatIA() {
  const [mensagens, setMensagens] = useState<MensagemChat[]>([MENSAGEM_INICIAL]);
  const [sugestoes, setSugestoes] = useState<string[]>(SUGESTOES_FALLBACK);
  const [carregando, setCarregando] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [conversaId, setConversaId] = useState<string | undefined>(undefined);
  const [showWelcome, setShowWelcome] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [textoTranscrito, setTextoTranscrito] = useState<string | null>(null);
  const welcomeOpacity = useRef(new Animated.Value(0)).current;

  const { isDark, bg, surf, borderL, text, textSec } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const token = useAuthStore((s) => s.token) ?? '';
  const userId = useAuthStore((s) => s.userId);
  const { gravando, transcrevendo, toggleGravacao } = useTranscricao();

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

  // Auto-send when chat gains focus after navigating from another screen.
  // Ref mantém a versão mais recente de enviarMensagem sem re-disparar o efeito.
  const enviarMensagemRef = useRef<(texto: string, pedidoId?: string) => void>(() => {});

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

  useEffect(() => {
    storage.getItem(ONBOARDING_KEY).then((done) => {
      if (!done) {
        setShowWelcome(true);
        Animated.timing(welcomeOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }).start();
      }
    });
  }, []);

  function limparConversa() {
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
      setSugestoes(SUGESTOES_INICIAIS);
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
  }

  function dismissWelcome() {
    Animated.timing(welcomeOpacity, { toValue: 0, duration: 250, useNativeDriver: true }).start(
      () => {
        setShowWelcome(false);
        storage.setItem(ONBOARDING_KEY, '1').catch(() => {});
      },
    );
  }

  async function enviarMensagem(texto: string, pedidoSelecionadoId?: string) {
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
  }

  // Mantém o ref sincronizado com a versão atual (usado pelo useFocusEffect)
  enviarMensagemRef.current = enviarMensagem;

  function handleEnviar() {
    const texto = inputValue.trim();
    if (!texto) return;
    setInputValue('');
    enviarMensagem(texto);
  }

  function getDesambiguacao(input: string): { label: string; msg: string }[] {
    const trimmed = input.trim();
    if (!trimmed || carregando) return [];

    if (/^\d+$/.test(trimmed) && trimmed.length <= 6) {
      // O backend não busca pedido por número (são UUIDs) — oferece o rastreio padrão
      // (lista + seleção) em vez de prometer um lookup que não existe.
      return [
        { label: `🔍 Produtos até R$ ${trimmed}`, msg: `Quero produtos até R$ ${trimmed}` },
        { label: `📦 Rastrear um pedido`, msg: `Quero rastrear meu pedido` },
      ];
    }

    if (/^r\$?\s*\d+/i.test(trimmed)) {
      return [
        {
          label: `🔍 Buscar com esse orçamento`,
          msg: `Quero produtos com orçamento de ${trimmed}`,
        },
      ];
    }

    return [];
  }

  const desambiguacao = getDesambiguacao(inputValue);

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <View style={{ flex: 1 }}>
        {/* Header */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 16,
            paddingTop: insets.top + 12,
            paddingBottom: 16,
            backgroundColor: surf,
            borderBottomWidth: 1,
            borderBottomColor: borderL,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View
              style={{
                width: 42,
                height: 42,
                borderRadius: 21,
                backgroundColor: '#f97316',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 10,
              }}
            >
              <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 18 }}>A</Text>
            </View>
            <View>
              <Text style={{ fontWeight: '600', fontSize: 15, color: text }}>
                Aju · Personal Shopper
              </Text>
              <Text style={{ fontSize: 12, color: '#22c55e' }}>● Online agora</Text>
            </View>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <TouchableOpacity
              onPress={limparConversa}
              style={{
                width: 34,
                height: 34,
                borderRadius: 17,
                backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : colors.n100,
                alignItems: 'center',
                justifyContent: 'center',
              }}
              activeOpacity={0.7}
            >
              <Ionicons name="trash-outline" size={17} color="#ef4444" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setShowHelp(true)}
              style={{
                width: 34,
                height: 34,
                borderRadius: 17,
                backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : colors.n100,
                alignItems: 'center',
                justifyContent: 'center',
              }}
              activeOpacity={0.7}
            >
              <Text style={{ fontSize: 15, color: textSec as string, fontWeight: '700' }}>?</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.push('/(consumer)/carrinho')}>
              <Ionicons name="cart-outline" size={22} color={text} />
            </TouchableOpacity>
          </View>
        </View>

        <ChatMsg
          mensagens={mensagens}
          sugestoes={sugestoes}
          onSugestao={(texto, pedidoId) => {
            if (texto === 'Ver meus tickets') {
              router.push('/(consumer)/tickets' as any);
              return;
            }
            if (texto === 'Ver meus pedidos') {
              router.push('/(consumer)/pedidos' as any);
              return;
            }
            enviarMensagem(texto, pedidoId);
          }}
          carregando={carregando}
        />

        {/* Quick Actions */}
        <View style={[s.quickRow, { backgroundColor: bg }]}>
          {QUICK_ACTIONS.map((a) => (
            <TouchableOpacity
              key={a.label}
              onPress={() => {
                setInputValue('');
                enviarMensagem(a.msg);
              }}
              disabled={carregando}
              style={[
                s.quickBtn,
                { backgroundColor: surf, borderColor: borderL },
                carregando && { opacity: 0.4 },
              ]}
              activeOpacity={0.65}
            >
              <View style={[s.quickIconWrap, { backgroundColor: a.color + '18' }]}>
                <Ionicons name={a.icon} size={13} color={a.color} />
              </View>
              <Text style={[s.quickLabel, { color: text }]}>{a.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {desambiguacao.length > 0 && (
          <View
            style={{
              flexDirection: 'row',
              flexWrap: 'wrap',
              gap: 8,
              paddingHorizontal: 16,
              paddingBottom: 8,
              backgroundColor: bg,
            }}
          >
            {desambiguacao.map((d) => (
              <TouchableOpacity
                key={d.msg}
                onPress={() => {
                  setInputValue('');
                  enviarMensagem(d.msg);
                }}
                activeOpacity={0.75}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 6,
                  backgroundColor: isDark ? 'rgba(249,115,22,0.15)' : '#fff7ed',
                  borderWidth: 1,
                  borderColor: isDark ? 'rgba(249,115,22,0.35)' : '#fed7aa',
                  borderRadius: 20,
                  paddingHorizontal: 12,
                  paddingVertical: 7,
                }}
              >
                <Text
                  style={{
                    fontSize: 12.5,
                    fontWeight: '600',
                    color: isDark ? '#fb923c' : '#c2410c',
                  }}
                >
                  {d.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Preview de confirmação do texto transcrito por voz */}
        {textoTranscrito && (
          <View
            style={{
              marginHorizontal: 12,
              marginBottom: 8,
              backgroundColor: isDark ? 'rgba(249,115,22,0.12)' : '#fff7ed',
              borderWidth: 1,
              borderColor: isDark ? 'rgba(249,115,22,0.35)' : '#fed7aa',
              borderRadius: 14,
              padding: 12,
              gap: 8,
            }}
          >
            <Text style={{ fontSize: 12, color: textSec as string }}>🎤 Entendi:</Text>
            <Text style={{ fontSize: 14, color: text, fontWeight: '500' }}>
              "{textoTranscrito}"
            </Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TouchableOpacity
                onPress={() => {
                  enviarMensagem(textoTranscrito);
                  setTextoTranscrito(null);
                }}
                style={{
                  flex: 1,
                  backgroundColor: '#f97316',
                  borderRadius: 10,
                  paddingVertical: 9,
                  alignItems: 'center',
                }}
                activeOpacity={0.8}
              >
                <Text style={{ color: '#fff', fontSize: 13, fontWeight: '700' }}>Enviar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  setInputValue(textoTranscrito);
                  setTextoTranscrito(null);
                }}
                style={{
                  flex: 1,
                  borderWidth: 1,
                  borderColor: isDark ? 'rgba(255,255,255,0.2)' : '#d1d5db',
                  borderRadius: 10,
                  paddingVertical: 9,
                  alignItems: 'center',
                }}
                activeOpacity={0.8}
              >
                <Text style={{ color: text, fontSize: 13, fontWeight: '600' }}>Editar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setTextoTranscrito(null)}
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 9,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                activeOpacity={0.8}
              >
                <Ionicons name="close" size={18} color={textSec as string} />
              </TouchableOpacity>
            </View>
          </View>
        )}

        <ChatInput
          value={inputValue}
          onChangeValue={setInputValue}
          onSend={handleEnviar}
          onMicPress={() => toggleGravacao((texto) => setTextoTranscrito(texto))}
          gravando={gravando}
          transcrevendo={transcrevendo}
          disabled={carregando}
        />

        <Text
          style={{
            textAlign: 'center',
            fontSize: 11,
            color: textSec,
            paddingBottom: 16 + insets.bottom,
            backgroundColor: bg,
          }}
        >
          IA com <Text style={{ color: '#f97316', fontWeight: '500' }}>lojas reais</Text> de Aracaju
        </Text>
      </View>

      {/* Welcome Overlay */}
      {showWelcome && (
        <Animated.View style={[StyleSheet.absoluteFill, s.overlay, { opacity: welcomeOpacity }]}>
          <View style={[s.card, { backgroundColor: isDark ? colors.surfDark : colors.n0 }]}>
            <Text style={[s.welcomeTitle, { color: text }]}>👋 Bem-vindo ao Aju</Text>
            <Text style={[s.welcomeSub, { color: textSec as string }]}>
              Sua personal shopper de Aracaju
            </Text>

            {CAPABILITIES.map((c) => (
              <View key={c.title} style={s.capRow}>
                <View style={[s.capIconWrap, { backgroundColor: c.color + '18' }]}>
                  <Ionicons name={c.icon} size={18} color={c.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[s.capTitle, { color: text }]}>{c.title}</Text>
                  <Text style={[s.capDesc, { color: textSec as string }]}>"{c.desc}"</Text>
                </View>
              </View>
            ))}

            <TouchableOpacity onPress={dismissWelcome} style={s.primaryBtn} activeOpacity={0.85}>
              <Text style={s.primaryBtnTxt}>Entendi!</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      )}

      {/* Help Modal */}
      <Modal
        visible={showHelp}
        transparent
        animationType="fade"
        onRequestClose={() => setShowHelp(false)}
      >
        <View style={s.overlay}>
          <View style={[s.card, { backgroundColor: isDark ? colors.surfDark : colors.n0 }]}>
            <Text style={[s.helpTitle, { color: text }]}> O que Aju pode fazer?</Text>
            <View style={[s.divider, { backgroundColor: borderL }]} />

            {CAPABILITIES.map((c) => (
              <View key={c.title} style={s.capRow}>
                <View style={[s.capIconWrap, { backgroundColor: c.color + '18' }]}>
                  <Ionicons name={c.icon} size={18} color={c.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[s.capTitle, { color: text }]}>{c.title}</Text>
                  <Text style={[s.capDesc, { color: textSec as string }]}>"{c.desc}"</Text>
                </View>
              </View>
            ))}

            <TouchableOpacity
              onPress={() => setShowHelp(false)}
              style={[s.primaryBtn, { backgroundColor: colors.navy }]}
              activeOpacity={0.85}
            >
              <Text style={s.primaryBtnTxt}>Fechar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    zIndex: 100,
  },
  card: { borderRadius: 24, padding: 24, width: '100%', maxWidth: 360 },
  welcomeTitle: { fontSize: 22, fontWeight: '800', marginBottom: 4 },
  welcomeSub: { fontSize: 13, marginBottom: 20 },
  helpTitle: { fontSize: 18, fontWeight: '800', marginBottom: 4 },
  divider: { height: 1, marginVertical: 14 },
  capRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  capIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  capTitle: { fontSize: 14, fontWeight: '700' },
  capDesc: { fontSize: 12, marginTop: 2 },
  primaryBtn: {
    marginTop: 8,
    backgroundColor: colors.orange,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryBtnTxt: { fontSize: 15, fontWeight: '700', color: colors.n0 },
  quickRow: { flexDirection: 'row', paddingHorizontal: 12, paddingVertical: 8, gap: 6 },
  quickBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    borderRadius: 10,
    paddingVertical: 8,
    borderWidth: 1,
  },
  quickIconWrap: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickLabel: { fontSize: 11.5, fontWeight: '600' },
});
