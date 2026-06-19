import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Animated,
  StatusBar,
  ActivityIndicator,
  Modal,
  Platform,
  ToastAndroid,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LojistaService, ApiUnauthorizedError } from '@ajulabs/api-client';
import { usePedidosRealtime, usePedidoLojistaRealtime } from '@ajulabs/realtime';
import { useAuthLojistaStore } from '../../../../store';
import { useHardwareBack } from '../../../../hooks';

const API_URL = (process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000').replace(/\/$/, '');
import { ORDER_STATUS_MAP, STATUS_META, FLOW, type OrderStatus, type Order } from '../model/data';
import { OrderDetail } from './OrderDetail';
import { DeliveryScreen } from './DeliveryScreen';
import { usePedidoSound, SONS, type SomTipo } from './usePedidoSound';
import { TicketsScreen } from '../../tickets/ui/TicketsScreen';
import { ChatPedidoScreen } from './ChatPedidoScreen';

const brl = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const MOTIVOS_CANCELAMENTO = [
  { value: 'item_esgotado', label: 'Item esgotado' },
  { value: 'problema_cozinha', label: 'Problema com estoque/produtos' },
  { value: 'horario_encerramento', label: 'Horário de encerramento' },
  { value: 'outro', label: 'Outro motivo' },
] as const;

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

  // Botão físico de voltar do Android: respeita a navegação por estado interno.
  // Sem isso, voltar de uma sub-tela (detail/delivery/chat/tickets) fecha o app.
  const lastBackPressRef = useRef(0);
  useHardwareBack(() => {
    if (screen === 'chat') {
      setScreen('detail');
      return true;
    }
    // Em 'tickets' (lista aberta via card de Pedidos), voltar retorna pros
    // pedidos. O TicketsScreen é renderizado por estado (não é rota), então seu
    // próprio useFocusEffect/back não dispara aqui — quem trata é esta rota.
    if (screen === 'tickets') {
      setScreen('list');
      return true;
    }
    if (screen !== 'list') {
      setScreen('list');
      return true;
    }
    // Em 'list' (raiz da tab): padrão "aperte voltar novamente para sair".
    const agora = Date.now();
    if (agora - lastBackPressRef.current < 2000) {
      return false; // segundo toque em 2s → deixa o app fechar
    }
    lastBackPressRef.current = agora;
    if (Platform.OS === 'android') {
      ToastAndroid.show('Aperte voltar novamente para sair', ToastAndroid.SHORT);
    }
    return true; // primeiro toque → não fecha
  });
  const [showSomModal, setShowSomModal] = useState(false);
  const [openTickets, setOpenTickets] = useState(0);
  const [cancelModal, setCancelModal] = useState<{
    orderId: string;
    dbId: string;
    status: OrderStatus;
  } | null>(null);
  const [recarregando, setRecarregando] = useState(false);
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

  // Realtime: pedido novo chega na hora (não espera o polling de 30s).
  // O efeito de `novos` abaixo dispara o som ao detectar o aumento.
  usePedidosRealtime({
    apiUrl: API_URL,
    lojaId: lojaId ?? null,
    enabled: !!lojaId,
    onNovoPedido: () => {
      fetchPedidos();
    },
  });

  // Realtime: mudança de status (cancelamento pelo consumidor, entregador
  // alocado/retirou) reflete na lista e na tela de logística sem recarregar.
  usePedidoLojistaRealtime({
    apiUrl: API_URL,
    lojaId: lojaId ?? null,
    enabled: !!lojaId,
    onAtualizado: () => {
      fetchPedidos();
    },
  });

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

  const handleCancelar = useCallback(
    async (dbId: string, motivo: string) => {
      if (!token) return;
      setCancelModal(null);
      setOrders((os) => os.filter((o) => o._id !== dbId));
      try {
        await LojistaService.cancelarPedido(dbId, token, motivo);
      } catch (err) {
        console.error('[PedidosScreen] cancelarPedido error:', err);
        fetchPedidos();
      }
    },
    [token, fetchPedidos],
  );

  // Ordem de prioridade: novos primeiro (precisam de ação imediata), depois o fluxo.
  const PRIORIDADE: Record<OrderStatus, number> = {
    novo: 0,
    preparando: 1,
    pronto: 2,
    despachado: 3,
    entregue: 4,
  };
  const ordenarPorPrioridade = (lista: typeof orders) =>
    [...lista].sort((a, b) => (PRIORIDADE[a.status] ?? 9) - (PRIORIDADE[b.status] ?? 9));

  const list = ordenarPorPrioridade(
    filter === 'todos' ? orders : orders.filter((o) => o.status === filter),
  );

  const filters: { id: 'todos' | OrderStatus; label: string }[] = [
    { id: 'todos', label: 'Todos' },
    { id: 'novo', label: 'Novos' },
    { id: 'preparando', label: 'Preparando' },
    { id: 'pronto', label: 'Prontos' },
    { id: 'despachado', label: 'Despachados' },
    { id: 'entregue', label: 'Concluídos' },
  ];

  // Borda laranja fixa para destacar itens novos. (Antes era um pulse animado via
  // borderColor com useNativeDriver:false, que conflitava com animações nativas e
  // disparava "JS driven animation on a node moved to native" ao re-renderizar a lista.)
  const borderColor = '#DE6708';

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
    const deliveryOrder = orders.find((o) => o.id === selected.id) ?? selected;
    return <DeliveryScreen order={deliveryOrder} onBack={() => setScreen('list')} />;
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
          <TouchableOpacity onPress={() => setFilter('novo')} activeOpacity={1}>
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
              <Ionicons name="chevron-forward" size={18} color="#fff" />
            </Animated.View>
          </TouchableOpacity>
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
          <TouchableOpacity
            style={s.ticketCard}
            onPress={() => setScreen('tickets')}
            activeOpacity={0.8}
          >
            <View style={s.ticketCardLeft}>
              <View style={s.ticketCardIconWrap}>
                <Ionicons name="ticket-outline" size={18} color="#DE6708" />
              </View>
              <View>
                <Text style={s.ticketCardTitle}>Tickets de Suporte</Text>
                <Text style={s.ticketCardSub}>
                  {openTickets > 0
                    ? `${openTickets} ticket${openTickets > 1 ? 's' : ''} aberto${openTickets > 1 ? 's' : ''}`
                    : 'Visualize os tickets dos seus clientes'}
                </Text>
              </View>
            </View>
            <View style={s.ticketCardRight}>
              {openTickets > 0 && (
                <View style={s.ticketCardBadge}>
                  <Text style={s.ticketCardBadgeTxt}>{openTickets > 9 ? '9+' : openTickets}</Text>
                </View>
              )}
              <Ionicons name="chevron-forward" size={16} color="#9099B3" />
            </View>
          </TouchableOpacity>

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
                        <Ionicons name="bicycle" size={14} color="#0369A1" />
                        <Text style={[s.dispatchedText, { color: '#0369A1' }]}>
                          {(o as any).motoboy ?? 'Despachado'}
                        </Text>
                      </View>
                    )}
                    {!meta.next && o.status === 'entregue' && (
                      <View style={s.dispatched}>
                        <Ionicons name="checkmark-circle" size={14} color="#046C2E" />
                        <Text style={[s.dispatchedText, { color: '#046C2E' }]}>
                          Entrega concluída
                        </Text>
                      </View>
                    )}
                  </View>
                  {['novo', 'preparando', 'pronto'].includes(o.status) && (
                    <TouchableOpacity
                      style={s.cancelLink}
                      onPress={() =>
                        setCancelModal({ orderId: o.id, dbId: o._id!, status: o.status })
                      }
                      activeOpacity={0.7}
                    >
                      <Ionicons name="close-circle-outline" size={13} color="#9B2727" />
                      <Text style={s.cancelLinkTxt}>
                        {o.status === 'novo' ? 'Recusar pedido' : 'Cancelar pedido'}
                      </Text>
                    </TouchableOpacity>
                  )}
                </Animated.View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}

      {/* Modal de cancelamento */}
      {cancelModal && (
        <Modal
          visible
          transparent
          animationType="slide"
          onRequestClose={() => setCancelModal(null)}
        >
          <View style={s.modalOverlay}>
            <View style={s.modalBox}>
              <View style={s.modalHeader}>
                <Text style={s.modalTitulo}>Cancelar pedido</Text>
                <TouchableOpacity onPress={() => setCancelModal(null)}>
                  <Ionicons name="close" size={22} color="#000933" />
                </TouchableOpacity>
              </View>
              <Text style={s.modalSub}>{cancelModal.orderId}</Text>
              {['preparando', 'pronto'].includes(cancelModal.status) && (
                <View style={s.penaltyWarn}>
                  <Ionicons name="warning-outline" size={14} color="#B45309" />
                  <Text style={s.penaltyTxt}>
                    Cancelar após aceitar o pedido conta como penalidade e afeta o ranqueamento da
                    loja.
                  </Text>
                </View>
              )}
              <Text style={[s.modalSub, { marginTop: 14, marginBottom: 12 }]}>
                Selecione o motivo:
              </Text>
              {MOTIVOS_CANCELAMENTO.map((m) => (
                <TouchableOpacity
                  key={m.value}
                  style={s.motivoItem}
                  onPress={() => handleCancelar(cancelModal.dbId, m.value)}
                  activeOpacity={0.8}
                >
                  <Text style={s.motivoLabel}>{m.label}</Text>
                  <Ionicons name="chevron-forward" size={16} color="#9099B3" />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </Modal>
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
  ticketCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E4E7F1',
    backgroundColor: '#fff',
    marginBottom: 16,
  },
  ticketCardLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  ticketCardIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#FFF5EE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ticketCardTitle: { fontSize: 13, fontWeight: '600', color: '#000933' },
  ticketCardSub: { fontSize: 11, marginTop: 1, color: '#9099B3' },
  ticketCardRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  ticketCardBadge: {
    backgroundColor: '#DC2626',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  ticketCardBadgeTxt: { fontSize: 11, fontWeight: '700', color: '#fff' },
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
  // Cancelamento
  cancelLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F0F1F7',
  },
  cancelLinkTxt: { fontSize: 12, fontWeight: '600', color: '#9B2727' },
  penaltyWarn: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
    padding: 10,
    marginTop: 4,
  },
  penaltyTxt: { flex: 1, fontSize: 12, color: '#92400E', lineHeight: 17 },
  motivoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#E4E7F1',
    marginBottom: 10,
  },
  motivoLabel: { fontSize: 14, fontWeight: '600', color: '#000933' },
});
