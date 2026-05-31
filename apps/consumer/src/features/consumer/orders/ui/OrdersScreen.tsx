import { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Pedido } from '@ajulabs/types';
import { colors } from '@ajulabs/theme';
import { PedidoService, ConsumerTicketService, AvaliacaoService } from '@ajulabs/api-client';
import { useAuthStore } from '../../../../store';
import { useTheme } from '../../../../hooks';
import { PedidoCard } from './PedidoCard';
import { usePedidoConsumerRealtime, useTicketRealtime } from '@ajulabs/realtime';
import { MeusTicketsScreen } from '../../tickets/ui/MeusTicketsScreen';
import { Ionicons } from '@expo/vector-icons';
import { EntregaConfirmadaModal } from '../../avaliacao/ui/EntregaConfirmadaModal';
import { AvaliacaoModal } from '../../avaliacao/ui/AvaliacaoModal';

const API_URL = (process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000').replace(/\/$/, '');

type Screen = 'list' | 'tickets';

export function OrdersScreen() {
  const router = useRouter();
  const token = useAuthStore((s) => s.token);
  const userId = useAuthStore((s) => s.userId);
  const { isDark, bg, surf, borderL, text, textSec } = useTheme();
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);
  const [screen, setScreen] = useState<Screen>('list');
  const [ticketsAbertos, setTicketsAbertos] = useState(0);
  const [pedidoParaAvaliar, setPedidoParaAvaliar] = useState<Pedido | null>(null);
  const [showConfirmada, setShowConfirmada] = useState(false);
  const [showAvaliacao, setShowAvaliacao] = useState(false);
  const [enviandoAvaliacao, setEnviandoAvaliacao] = useState(false);
  const pedidosRef = useRef<Pedido[]>([]);

  const fetchTicketCount = useCallback(async () => {
    if (!token) return;
    try {
      const raw = await ConsumerTicketService.listar(token);
      setTicketsAbertos((raw ?? []).filter((t: any) => t.status === 'aberto').length);
    } catch {}
  }, [token]);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }
    PedidoService.listar(token)
      .then((data) => {
        setPedidos(data);
        pedidosRef.current = data;
      })
      .catch(() => {})
      .finally(() => setLoading(false));

    fetchTicketCount();

    const interval = setInterval(() => {
      PedidoService.listar(token)
        .then((data) => {
          setPedidos(data);
          pedidosRef.current = data;
        })
        .catch(() => {});
      fetchTicketCount();
    }, 60_000);

    return () => clearInterval(interval);
  }, [token, fetchTicketCount]);

  usePedidoConsumerRealtime({
    apiUrl: API_URL,
    userId: userId ?? null,
    enabled: !!userId,
    onAtualizado: ({ pedidoId, status }) => {
      setPedidos((prev) => {
        const atualizado = prev.map((p) =>
          p.id === pedidoId ? { ...p, status: status as any } : p,
        );
        pedidosRef.current = atualizado;

        if (status === 'entregue') {
          const pedido = atualizado.find((p) => p.id === pedidoId);
          if (pedido && !pedido.avaliado) {
            setPedidoParaAvaliar(pedido);
            setShowConfirmada(true);
          }
        }

        return atualizado;
      });
    },
  });

  async function handleEnviarAvaliacaoOrders(dados: {
    notaLoja: number;
    comentarioLoja?: string;
    tagsLoja: string[];
    notaEntregador: number;
    comentarioEntregador?: string;
    tagsEntregador: string[];
    avaliacoesProdutos: { produtoId: string; nota: number; comentario?: string }[];
  }) {
    if (!token || !pedidoParaAvaliar) return;
    setEnviandoAvaliacao(true);
    try {
      await AvaliacaoService.avaliarPedido({ pedidoId: pedidoParaAvaliar.id, ...dados }, token);
      setPedidos((prev) =>
        prev.map((p) => (p.id === pedidoParaAvaliar.id ? { ...p, avaliado: true } : p)),
      );
      setShowAvaliacao(false);
      setPedidoParaAvaliar(null);
    } catch {
      // user can retry later
    } finally {
      setEnviandoAvaliacao(false);
    }
  }

  useTicketRealtime({
    apiUrl: API_URL,
    ticketId: null,
    roomId: userId ?? null,
    roomType: 'usuario',
    enabled: !!userId,
    onNovo: () => {
      fetchTicketCount();
    },
    onStatus: ({ status }) => {
      if (status === 'resolvido' || status === 'cancelado') {
        setTicketsAbertos((prev) => Math.max(0, prev - 1));
      }
    },
  });

  if (screen === 'tickets') {
    return <MeusTicketsScreen onBack={() => setScreen('list')} />;
  }

  const avaliacaoModals = pedidoParaAvaliar ? (
    <>
      <EntregaConfirmadaModal
        visible={showConfirmada}
        lojaNome={pedidoParaAvaliar.lojaNome}
        onAvaliar={() => {
          setShowConfirmada(false);
          setShowAvaliacao(true);
        }}
        onPular={() => {
          setShowConfirmada(false);
          setPedidoParaAvaliar(null);
        }}
      />
      <AvaliacaoModal
        visible={showAvaliacao}
        lojaNome={pedidoParaAvaliar.lojaNome}
        entregadorNome={pedidoParaAvaliar.entregador?.nome ?? null}
        itens={pedidoParaAvaliar.itens}
        enviando={enviandoAvaliacao}
        onEnviar={handleEnviarAvaliacaoOrders}
        onFechar={() => {
          setShowAvaliacao(false);
          setPedidoParaAvaliar(null);
        }}
      />
    </>
  ) : null;

  const ativos = pedidos.filter((p) => !['entregue', 'cancelado'].includes(p.status));
  const historico = pedidos.filter((p) => ['entregue', 'cancelado'].includes(p.status));

  const handlePress = (id: string) => {
    router.push(`/(consumer)/tracking/${id}`);
  };

  if (loading) {
    return (
      <View
        style={[
          styles.container,
          { backgroundColor: bg, justifyContent: 'center', alignItems: 'center' },
        ]}
      >
        <ActivityIndicator size="large" color={colors.orange} />
        {avaliacaoModals}
      </View>
    );
  }

  if (pedidos.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: bg }]}>
        <View style={[styles.header, { backgroundColor: surf, borderBottomColor: borderL }]}>
          <View style={styles.headerRow}>
            <Text style={[styles.titulo, { color: text }]}>Pedidos</Text>
            <TouchableOpacity
              onPress={() => setScreen('tickets')}
              style={styles.ticketBtn}
              activeOpacity={0.8}
            >
              <Ionicons name="ticket-outline" size={20} color={text} />
              {ticketsAbertos > 0 && (
                <View style={styles.ticketBadge}>
                  <Text style={styles.ticketBadgeTxt}>{ticketsAbertos}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.vazio}>
          <Text style={{ fontSize: 56 }}>📦</Text>
          <Text style={[styles.vazioTitulo, { color: text }]}>Nenhum pedido ainda</Text>
          <Text style={[styles.vazioTxt, { color: textSec as string }]}>
            Seus pedidos aparecerão aqui
          </Text>
          <TouchableOpacity
            style={styles.vazioBtn}
            onPress={() => router.push('/(consumer)/vitrines')}
            activeOpacity={0.85}
          >
            <Text style={styles.vazioBtnTxt}>Explorar vitrines</Text>
          </TouchableOpacity>
        </View>
        {avaliacaoModals}
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: bg }]}>
      <View style={[styles.header, { backgroundColor: surf, borderBottomColor: borderL }]}>
        <View style={styles.headerRow}>
          <Text style={[styles.titulo, { color: text }]}>Pedidos</Text>
          <TouchableOpacity
            onPress={() => setScreen('tickets')}
            style={styles.ticketBtn}
            activeOpacity={0.8}
          >
            <Ionicons name="ticket-outline" size={20} color={text} />
            {ticketsAbertos > 0 && (
              <View style={styles.ticketBadge}>
                <Text style={styles.ticketBadgeTxt}>{ticketsAbertos}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
        <Text style={[styles.subtitulo, { color: textSec as string }]}>
          {pedidos.length} pedidos
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {ativos.length > 0 && (
          <>
            <Text style={[styles.secao, { color: textSec as string }]}>Em andamento</Text>
            {ativos.map((p) => (
              <PedidoCard key={p.id} pedido={p} onPress={handlePress} />
            ))}
          </>
        )}

        {historico.length > 0 && (
          <>
            <Text
              style={[
                styles.secao,
                ativos.length > 0 && { marginTop: 20 },
                { color: textSec as string },
              ]}
            >
              Histórico
            </Text>
            {historico.map((p) => (
              <PedidoCard key={p.id} pedido={p} onPress={handlePress} />
            ))}
          </>
        )}
      </ScrollView>
      {avaliacaoModals}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 16, paddingTop: 52, paddingBottom: 14, borderBottomWidth: 1 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  titulo: { fontSize: 20, fontWeight: '700' },
  subtitulo: { fontSize: 12, marginTop: 2 },
  ticketBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ticketBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#DC2626',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  ticketBadgeTxt: { fontSize: 9, fontWeight: '800', color: '#fff', lineHeight: 12 },

  scroll: { padding: 16, paddingBottom: 24 },
  secao: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
  },

  vazio: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 8 },
  vazioTitulo: { fontSize: 18, fontWeight: '700', marginTop: 12 },
  vazioTxt: { fontSize: 13 },
  vazioBtn: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: colors.orange,
    borderRadius: 12,
  },
  vazioBtnTxt: { color: colors.n0, fontSize: 14, fontWeight: '700' },
});
