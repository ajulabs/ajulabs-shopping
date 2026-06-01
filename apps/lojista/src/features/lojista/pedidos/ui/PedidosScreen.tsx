import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Animated,
  StatusBar,
  SafeAreaView,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LojistaService, ApiUnauthorizedError } from '@ajulabs/api-client';
import { useAuthLojistaStore } from '../../../../store';
import { ORDER_STATUS_MAP, STATUS_META, FLOW, type OrderStatus, type Order } from '../model/data';
import { OrderDetail } from './OrderDetail';
import { DeliveryScreen } from './DeliveryScreen';
import { usePedidoSound, SONS, type SomTipo } from './usePedidoSound';
import { TicketsScreen } from '../../tickets/ui/TicketsScreen';
import { ChatPedidoScreen } from './ChatPedidoScreen';

const brl = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

type Screen = 'list' | 'detail' | 'delivery' | 'tickets' | 'chat';

function mapPedidoToOrder(raw: any): Order {
  const status: OrderStatus = ORDER_STATUS_MAP[raw.status as string] ?? 'preparando';
  const entregadorId: string | undefined = raw.entregadorId ?? raw.entregador?.id ?? undefined;
  const entregadorNome: string | undefined = raw.entregador?.nome ?? undefined;
  const total = Number(raw.total ?? 0);
  const hora = raw.criadoEm
    ? new Date(raw.criadoEm).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    : '--:--';
  return {
    id: `#${raw.id.slice(-6).toUpperCase()}`,
    _id: raw.id,
    status,
    cliente: raw.consumidor?.nome ?? 'Cliente',
    endereco: raw.enderecoEntrega
      ? `${raw.enderecoEntrega.rua}, ${raw.enderecoEntrega.numero}\n${raw.enderecoEntrega.bairro}, ${raw.enderecoEntrega.cidade}`
      : '',
    distancia: '–',
    hora,
    total,
    itens: (raw.itens ?? []).map((it: any) => ({
      nome: it.nomeSnapshot ?? it.nome ?? '',
      qtd: it.quantidade ?? 1,
      preco: Number(it.precoUnitario ?? 0),
    })),
    entregadorId,
    entregadorNome,
  };
}

export function PedidosScreen() {
  const token = useAuthLojistaStore((s) => s.token);
  const lojaId = useAuthLojistaStore((s) => s.lojaId);
  const lojaNome = useAuthLojistaStore((s) => s.lojaNome);

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'todos' | OrderStatus>('todos');
  const [screen, setScreen] = useState<Screen>('list');
  const [selected, setSelected] = useState<Order | null>(null);
  const [showSomModal, setShowSomModal] = useState(false);
  const [openTickets, setOpenTickets] = useState(0);
  const [recarregando, setRecarregando] = useState(false);
  const pulseAnim = useRef(new Animated.Value(0)).current;
  const spinAnim = useRef(new Animated.Value(0)).current;
  const spinLoopRef = useRef<Animated.CompositeAnimation | null>(null);
  const { tocarSom, somAtual, salvarSom } = usePedidoSound();
  const novosAnteriorRef = useRef(0);
  const primeiraCarregadaRef = useRef(true);

  const fetchPedidos = useCallback(async () => {
    if (!lojaId) {
      setLoading(false);
      setError('loja_null');
      return;
    }
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const raw = await LojistaService.listarPedidos(lojaId, token);
      setOrders(raw.map(mapPedidoToOrder));
      setError(null);
    } catch (err) {
      if (err instanceof ApiUnauthorizedError) {
        // Dispara refresh — quando o token atualizar no store o componente
        // re-renderiza com novo token e o useEffect chama fetchPedidos novamente.
        useAuthLojistaStore.getState().refreshAccessToken();
      } else {
        console.error('[PedidosScreen] fetchPedidos error:', err);
        setError('Não foi possível carregar pedidos.');
      }
    }
    setLoading(false);
  }, [lojaId, token]);

  const handleRefresh = useCallback(async () => {
    if (recarregando) return;
    setRecarregando(true);
    spinAnim.setValue(0);
    spinLoopRef.current = Animated.loop(
      Animated.timing(spinAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
    );
    spinLoopRef.current.start();
    await fetchPedidos();
    spinLoopRef.current.stop();
    spinAnim.setValue(0);
    setRecarregando(false);
  }, [recarregando, fetchPedidos, spinAnim]);

  const fetchTicketCount = useCallback(async () => {
    if (!lojaId || !token) return;
    try {
      const raw = await LojistaService.listarTickets(lojaId, token);
      setOpenTickets(raw.filter((t: any) => t.status === 'aberto').length);
    } catch {
      /* silencioso — badge opcional */
    }
  }, [lojaId, token]);

  useEffect(() => {
    fetchPedidos();
    fetchTicketCount();
    const interval = setInterval(() => {
      fetchPedidos();
      fetchTicketCount();
    }, 30000);
    return () => clearInterval(interval);
  }, [fetchPedidos, fetchTicketCount]);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1, duration: 900, useNativeDriver: false }),
        Animated.timing(pulseAnim, { toValue: 0, duration: 900, useNativeDriver: false }),
      ]),
    ).start();
  }, []);

  const novos = orders.filter((o) => o.status === 'novo').length;

  useEffect(() => {
    if (primeiraCarregadaRef.current) {
      primeiraCarregadaRef.current = false;
      novosAnteriorRef.current = novos;
      return;
    }
    if (novos > novosAnteriorRef.current) {
      tocarSom();
    }
    novosAnteriorRef.current = novos;
  }, [novos]);

  const advance = useCallback(
    async (id: string) => {
      const order = orders.find((o) => o.id === id);
      if (!order || !token) return;
      setOrders((os) =>
        os.map((o) => {
          if (o.id !== id) return o;
          const idx = FLOW.indexOf(o.status);
          const next = FLOW[idx + 1];
          return next ? { ...o, status: next } : o;
        }),
      );
      if (order._id) {
        try {
          await LojistaService.avancarStatus(order._id, token);
        } catch (err) {
          console.error('[PedidosScreen] avancarStatus error:', err);
          fetchPedidos();
        }
      }
    },
    [orders, token, fetchPedidos],
  );

  const list = filter === 'todos' ? orders : orders.filter((o) => o.status === filter);

  const filters: { id: 'todos' | OrderStatus; label: string }[] = [
    { id: 'todos', label: 'Todos' },
    { id: 'novo', label: 'Novos' },
    { id: 'preparando', label: 'Preparando' },
    { id: 'pronto', label: 'Prontos' },
    { id: 'despachado', label: 'Despachados' },
  ];

  const borderColor = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['#DE6708', '#FFD0A8'],
  });

  if (!loading && error === 'loja_null') {
    return (
      <SafeAreaView style={s.safe}>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 }}>
          <Ionicons name="storefront-outline" size={56} color="#9099B3" />
          <Text
            style={{
              fontSize: 18,
              fontWeight: '700',
              color: '#000933',
              marginTop: 20,
              textAlign: 'center',
            }}
          >
            Loja não configurada
          </Text>
          <Text
            style={{
              fontSize: 13,
              color: '#9099B3',
              textAlign: 'center',
              marginTop: 8,
              lineHeight: 20,
            }}
          >
            Sua conta não tem uma loja associada. Faça login novamente para resolver o problema.
          </Text>
          <TouchableOpacity
            style={{
              marginTop: 28,
              backgroundColor: '#DE6708',
              borderRadius: 12,
              paddingHorizontal: 28,
              paddingVertical: 13,
            }}
            onPress={() => useAuthLojistaStore.getState().logout()}
            activeOpacity={0.8}
          >
            <Text style={{ color: '#fff', fontWeight: '700', fontSize: 14 }}>
              Fazer login novamente
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (screen === 'tickets') {
    return <TicketsScreen onBack={() => setScreen('list')} />;
  }

  if (screen === 'chat' && selected) {
    return (
      <ChatPedidoScreen pedidoId={selected._id ?? selected.id} onBack={() => setScreen('detail')} />
    );
  }

  if (screen === 'detail' && selected) {
    const currentOrder = orders.find((o) => o.id === selected.id)!;
    return (
      <OrderDetail
        order={currentOrder}
        onBack={() => setScreen('list')}
        onAdvance={() => advance(currentOrder.id)}
        onDispatch={() => setScreen('delivery')}
        onChatConsumer={() => setScreen('chat')}
      />
    );
  }

  if (screen === 'delivery' && selected) {
    return (
      <DeliveryScreen
        order={selected}
        onBack={() => {
          advance(selected.id);
          setScreen('list');
        }}
      />
    );
  }

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      <View style={s.header}>
        <View style={s.headerTop}>
          <View>
            <Text style={s.headerSub}>{lojaNome ?? 'Minha Loja'}</Text>
            <Text style={s.headerTitle}>Pedidos hoje</Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TouchableOpacity
              onPress={() => setShowSomModal(true)}
              style={s.refreshBtn}
              activeOpacity={0.7}
            >
              <Ionicons name="musical-notes" size={18} color="#9099B3" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setScreen('tickets')}
              style={s.refreshBtn}
              activeOpacity={0.7}
            >
              <Ionicons name="ticket-outline" size={18} color="#9099B3" />
              {openTickets > 0 && (
                <View style={s.ticketBadge}>
                  <Text style={s.ticketBadgeText}>{openTickets > 9 ? '9+' : openTickets}</Text>
                </View>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleRefresh}
              style={s.refreshBtn}
              activeOpacity={0.7}
              disabled={recarregando}
            >
              <Animated.View
                style={{
                  transform: [
                    {
                      rotate: spinAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['0deg', '360deg'],
                      }),
                    },
                  ],
                }}
              >
                <Ionicons name="refresh" size={18} color={recarregando ? '#DE6708' : '#9099B3'} />
              </Animated.View>
            </TouchableOpacity>
          </View>
        </View>

        {novos > 0 && (
          <Animated.View style={[s.alertBanner, { borderColor }]}>
            <View style={s.alertIcon}>
              <Ionicons name="notifications" size={16} color="#fff" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.alertTitle}>
                {novos} pedido{novos > 1 ? 's' : ''} novo{novos > 1 ? 's' : ''}!
              </Text>
              <Text style={s.alertSub}>Aceite rápido pra manter a avaliação alta.</Text>
            </View>
          </Animated.View>
        )}

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.filtersScroll}>
          {filters.map((f) => {
            const count =
              f.id === 'todos' ? orders.length : orders.filter((o) => o.status === f.id).length;
            const active = filter === f.id;
            return (
              <TouchableOpacity
                key={f.id}
                onPress={() => setFilter(f.id)}
                style={[s.filterBtn, active && s.filterBtnActive]}
              >
                <Text style={[s.filterLabel, active && s.filterLabelActive]}>{f.label}</Text>
                <View style={[s.filterCount, active && s.filterCountActive]}>
                  <Text style={[s.filterCountText, active && s.filterCountTextActive]}>
                    {count}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color="#DE6708" />
        </View>
      ) : error && error !== 'loja_null' ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <Ionicons name="cloud-offline-outline" size={40} color="#9099B3" />
          <Text style={{ color: '#9099B3', fontSize: 13, marginTop: 12, textAlign: 'center' }}>
            {error}
          </Text>
          <TouchableOpacity
            onPress={fetchPedidos}
            style={{
              marginTop: 16,
              backgroundColor: '#000933',
              borderRadius: 10,
              paddingHorizontal: 20,
              paddingVertical: 10,
            }}
            activeOpacity={0.8}
          >
            <Text style={{ color: '#fff', fontWeight: '600', fontSize: 13 }}>Tentar novamente</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView style={s.list} contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
          {list.length === 0 && <Text style={s.empty}>Nenhum pedido nesse filtro agora.</Text>}
          {list.map((o) => {
            const meta = STATUS_META[o.status];
            const isNew = o.status === 'novo';
            return (
              <TouchableOpacity
                key={o.id}
                onPress={() => {
                  setSelected(o);
                  setScreen('detail');
                }}
                activeOpacity={0.85}
              >
                <Animated.View style={[s.card, isNew && { borderColor, borderWidth: 2 }]}>
                  <View style={s.cardTop}>
                    <View>
                      <Text style={s.orderId}>{o.id}</Text>
                      <Text style={s.orderMeta}>
                        {o.hora} · {o.cliente} · {o.distancia}
                      </Text>
                    </View>
                    <View
                      style={[
                        s.badge,
                        {
                          backgroundColor:
                            o.status === 'pronto' && o.entregadorId ? '#E0F2FE' : meta.bg,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          s.badgeText,
                          {
                            color: o.status === 'pronto' && o.entregadorId ? '#0369A1' : meta.color,
                          },
                        ]}
                      >
                        {o.status === 'pronto' && o.entregadorId ? 'A caminho' : meta.label}
                      </Text>
                    </View>
                  </View>
                  {o.itens.map((it, i) => (
                    <View key={i} style={s.itemRow}>
                      <Text style={s.itemName}>
                        <Text style={s.itemQty}>{it.qtd}×</Text> {it.nome}
                      </Text>
                      <Text style={s.itemPrice}>{brl(it.preco * it.qtd)}</Text>
                    </View>
                  ))}
                  {o.obs && (
                    <View style={s.obs}>
                      <Text style={s.obsText}>
                        <Text style={{ fontWeight: '700' }}>Obs:</Text> {o.obs}
                      </Text>
                    </View>
                  )}
                  <View style={s.cardBottom}>
                    <Text style={s.total}>{brl(o.total)}</Text>
                    {meta.next && (
                      <TouchableOpacity
                        style={[s.actionBtn, { backgroundColor: isNew ? '#DE6708' : '#000933' }]}
                        onPress={() => advance(o.id)}
                        activeOpacity={0.8}
                      >
                        <Text style={s.actionBtnText}>{meta.next}</Text>
                        <Ionicons name="chevron-forward" size={14} color="#fff" />
                      </TouchableOpacity>
                    )}
                    {!meta.next && o.status === 'pronto' && !o.entregadorId && (
                      <View style={s.dispatched}>
                        <Ionicons name="time-outline" size={14} color="#7C3AED" />
                        <Text style={[s.dispatchedText, { color: '#7C3AED' }]}>
                          Aguardando motoboy
                        </Text>
                      </View>
                    )}
                    {!meta.next && o.status === 'pronto' && o.entregadorId && (
                      <View style={s.dispatched}>
                        <Ionicons name="bicycle" size={14} color="#0369A1" />
                        <Text style={[s.dispatchedText, { color: '#0369A1' }]}>
                          Entregador a caminho{o.entregadorNome ? ` · ${o.entregadorNome}` : ''}
                        </Text>
                      </View>
                    )}
                    {!meta.next && o.status === 'despachado' && (
                      <View style={s.dispatched}>
                        <Ionicons name="bicycle" size={14} color="#046C2E" />
                        <Text style={s.dispatchedText}>{(o as any).motoboy ?? 'Despachado'}</Text>
                      </View>
                    )}
                  </View>
                </Animated.View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}

      {/* Modal de seleção de som */}
      <Modal
        visible={showSomModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowSomModal(false)}
      >
        <View style={s.modalOverlay}>
          <View style={s.modalBox}>
            <View style={s.modalHeader}>
              <Text style={s.modalTitulo}>Som de notificação</Text>
              <TouchableOpacity onPress={() => setShowSomModal(false)}>
                <Ionicons name="close" size={22} color="#000933" />
              </TouchableOpacity>
            </View>
            <Text style={s.modalSub}>Toque em cada opção para ouvir um preview</Text>
            {SONS.map((som) => (
              <TouchableOpacity
                key={som.id}
                style={[s.somItem, somAtual === som.id && s.somItemAtivo]}
                onPress={() => {
                  tocarSom(som.id);
                  salvarSom(som.id);
                }}
                activeOpacity={0.8}
              >
                <View style={{ flex: 1 }}>
                  <Text style={[s.somLabel, somAtual === som.id && { color: '#DE6708' }]}>
                    {som.label}
                  </Text>
                  <Text style={s.somDesc}>{som.descricao}</Text>
                </View>
                {somAtual === som.id && (
                  <Ionicons name="checkmark-circle" size={22} color="#DE6708" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F6F7FB' },
  header: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingTop: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E4E7F1',
  },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  headerSub: {
    fontSize: 11,
    color: '#9099B3',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  headerTitle: { fontSize: 24, fontWeight: '700', color: '#000933', marginTop: 2 },
  refreshBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F0F1F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ticketBadge: {
    position: 'absolute',
    top: -3,
    right: -3,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#DC2626',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: '#fff',
  },
  ticketBadgeText: { fontSize: 9, fontWeight: '800', color: '#fff', lineHeight: 12 },
  alertBanner: {
    marginTop: 14,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#DE6708',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 2,
  },
  alertIcon: {
    width: 32,
    height: 32,
    borderRadius: 99,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertTitle: { fontSize: 13, fontWeight: '600', color: '#fff' },
  alertSub: { fontSize: 11, color: '#fff', opacity: 0.9, marginTop: 1 },
  filtersScroll: { marginTop: 14, marginBottom: 14 },
  filterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 99,
    backgroundColor: '#F0F1F7',
    marginRight: 8,
  },
  filterBtnActive: { backgroundColor: '#000933' },
  filterLabel: { fontSize: 12.5, fontWeight: '600', color: '#000933' },
  filterLabelActive: { color: '#fff' },
  filterCount: {
    minWidth: 18,
    height: 18,
    paddingHorizontal: 5,
    borderRadius: 99,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterCountActive: { backgroundColor: 'rgba(255,255,255,0.25)' },
  filterCountText: { fontSize: 10, fontWeight: '700', color: '#9099B3' },
  filterCountTextActive: { color: '#fff' },
  list: { flex: 1 },
  empty: { textAlign: 'center', color: '#9099B3', fontSize: 13, paddingVertical: 40 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E4E7F1',
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  orderId: { fontSize: 16, fontWeight: '700', color: '#000933' },
  orderMeta: { fontSize: 12, color: '#9099B3', marginTop: 1 },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 99 },
  badgeText: { fontSize: 11, fontWeight: '700' },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 3 },
  itemName: { fontSize: 13, color: '#000933' },
  itemQty: { fontWeight: '700' },
  itemPrice: { fontSize: 13, color: '#9099B3' },
  obs: { marginTop: 8, padding: 8, borderRadius: 8, backgroundColor: '#FFF0E6' },
  obsText: { fontSize: 11.5, color: '#B34D00', lineHeight: 18 },
  cardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  total: { fontSize: 18, fontWeight: '700', color: '#000933' },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  actionBtnText: { fontSize: 13, fontWeight: '600', color: '#fff' },
  dispatched: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dispatchedText: { fontSize: 12, fontWeight: '600', color: '#046C2E' },
  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalBox: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  modalTitulo: { fontSize: 18, fontWeight: '700', color: '#000933' },
  modalSub: { fontSize: 12, color: '#9099B3', marginBottom: 16 },
  somItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#E4E7F1',
    marginBottom: 10,
  },
  somItemAtivo: { borderColor: '#DE6708', backgroundColor: '#FFF5EE' },
  somEmoji: { fontSize: 28 },
  somLabel: { fontSize: 14, fontWeight: '700', color: '#000933' },
  somDesc: { fontSize: 12, color: '#9099B3', marginTop: 2 },
});
