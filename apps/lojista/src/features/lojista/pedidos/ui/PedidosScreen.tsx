import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Animated, StatusBar, SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Order, OrderStatus, PEDIDOS_MOCK, STATUS_META, FLOW } from '../data';
import { OrderDetail } from './OrderDetail';
import { DeliveryScreen } from './DeliveryScreen';

const brl = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

type Screen = 'list' | 'detail' | 'delivery';

export function PedidosScreen() {
  const [orders, setOrders] = useState<Order[]>(PEDIDOS_MOCK);
  const [filter, setFilter] = useState<'todos' | OrderStatus>('todos');
  const [screen, setScreen] = useState<Screen>('list');
  const [selected, setSelected] = useState<Order | null>(null);
  const pulseAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1, duration: 900, useNativeDriver: false }),
        Animated.timing(pulseAnim, { toValue: 0, duration: 900, useNativeDriver: false }),
      ])
    ).start();
  }, []);

  const advance = (id: string) => {
    setOrders(os => os.map(o => {
      if (o.id !== id) return o;
      const idx = FLOW.indexOf(o.status);
      const next = FLOW[idx + 1];
      return next ? { ...o, status: next } : o;
    }));
  };

  const novos = orders.filter(o => o.status === 'novo').length;
  const list = filter === 'todos' ? orders : orders.filter(o => o.status === filter);

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

  // Navegação entre telas
  if (screen === 'detail' && selected) {
    const currentOrder = orders.find(o => o.id === selected.id)!;
    return (
      <OrderDetail
        order={currentOrder}
        onBack={() => setScreen('list')}
        onAdvance={() => advance(currentOrder.id)}
        onDispatch={() => setScreen('delivery')}
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

      {/* Header */}
      <View style={s.header}>
        <View style={s.headerTop}>
          <View>
            <Text style={s.headerSub}>Loja do Chico — Calçados</Text>
            <Text style={s.headerTitle}>Pedidos hoje</Text>
          </View>
          <View style={s.onlineBadge}>
            <View style={s.onlineDot} />
            <Text style={s.onlineText}>ONLINE</Text>
          </View>
        </View>

        {novos > 0 && (
          <Animated.View style={[s.alertBanner, { borderColor }]}>
            <View style={s.alertIcon}>
              <Ionicons name="notifications" size={16} color="#fff" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.alertTitle}>{novos} pedido novo!</Text>
              <Text style={s.alertSub}>Aceite rápido pra manter a avaliação alta.</Text>
            </View>
          </Animated.View>
        )}

        {/* Filtros */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.filtersScroll}>
          {filters.map(f => {
            const count = f.id === 'todos' ? orders.length : orders.filter(o => o.status === f.id).length;
            const active = filter === f.id;
            return (
              <TouchableOpacity key={f.id} onPress={() => setFilter(f.id)} style={[s.filterBtn, active && s.filterBtnActive]}>
                <Text style={[s.filterLabel, active && s.filterLabelActive]}>{f.label}</Text>
                <View style={[s.filterCount, active && s.filterCountActive]}>
                  <Text style={[s.filterCountText, active && s.filterCountTextActive]}>{count}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Lista */}
      <ScrollView style={s.list} contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
        {list.length === 0 && (
          <Text style={s.empty}>Nenhum pedido nesse filtro agora.</Text>
        )}
        {list.map(o => {
          const meta = STATUS_META[o.status];
          const isNew = o.status === 'novo';
          return (
            <TouchableOpacity key={o.id} onPress={() => { setSelected(o); setScreen('detail'); }} activeOpacity={0.85}>
              <Animated.View style={[s.card, isNew && { borderColor, borderWidth: 2 }]}>
                <View style={s.cardTop}>
                  <View>
                    <Text style={s.orderId}>{o.id}</Text>
                    <Text style={s.orderMeta}>{o.hora} · {o.cliente} · {o.distancia}</Text>
                  </View>
                  <View style={[s.badge, { backgroundColor: meta.bg }]}>
                    <Text style={[s.badgeText, { color: meta.color }]}>{meta.label}</Text>
                  </View>
                </View>

                {o.itens.map((it, i) => (
                  <View key={i} style={s.itemRow}>
                    <Text style={s.itemName}><Text style={s.itemQty}>{it.qtd}×</Text> {it.nome}</Text>
                    <Text style={s.itemPrice}>{brl(it.preco * it.qtd)}</Text>
                  </View>
                ))}

                {o.obs && (
                  <View style={s.obs}>
                    <Text style={s.obsText}><Text style={{ fontWeight: '700' }}>Obs:</Text> {o.obs}</Text>
                  </View>
                )}

                <View style={s.cardBottom}>
                  <Text style={s.total}>{brl(o.total)}</Text>
                  {meta.next && (
                    <TouchableOpacity
                      style={[s.actionBtn, { backgroundColor: isNew ? '#DE6708' : '#000933' }]}
                      onPress={(e) => { advance(o.id); }}
                      activeOpacity={0.8}
                    >
                      <Text style={s.actionBtnText}>{meta.next}</Text>
                      <Ionicons name="chevron-forward" size={14} color="#fff" />
                    </TouchableOpacity>
                  )}
                  {!meta.next && (
                    <View style={s.dispatched}>
                      <Ionicons name="bicycle" size={14} color="#046C2E" />
                      <Text style={s.dispatchedText}>{o.motoboy || 'Com motoboy'}</Text>
                    </View>
                  )}
                </View>
              </Animated.View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F6F7FB' },
  header: { backgroundColor: '#fff', paddingHorizontal: 16, paddingTop: 16, borderBottomWidth: 1, borderBottomColor: '#E4E7F1' },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  headerSub: { fontSize: 11, color: '#9099B3', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  headerTitle: { fontSize: 24, fontWeight: '700', color: '#000933', marginTop: 2 },
  onlineBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(57,255,137,0.15)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 99 },
  onlineDot: { width: 7, height: 7, borderRadius: 99, backgroundColor: '#39FF89' },
  onlineText: { fontSize: 11, fontWeight: '700', color: '#046C2E' },
  alertBanner: { marginTop: 14, padding: 12, borderRadius: 12, backgroundColor: '#DE6708', flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 2 },
  alertIcon: { width: 32, height: 32, borderRadius: 99, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  alertTitle: { fontSize: 13, fontWeight: '600', color: '#fff' },
  alertSub: { fontSize: 11, color: '#fff', opacity: 0.9, marginTop: 1 },
  filtersScroll: { marginTop: 14, marginBottom: 14 },
  filterBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 99, backgroundColor: '#F0F1F7', marginRight: 8 },
  filterBtnActive: { backgroundColor: '#000933' },
  filterLabel: { fontSize: 12.5, fontWeight: '600', color: '#000933' },
  filterLabelActive: { color: '#fff' },
  filterCount: { minWidth: 18, height: 18, paddingHorizontal: 5, borderRadius: 99, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  filterCountActive: { backgroundColor: 'rgba(255,255,255,0.25)' },
  filterCountText: { fontSize: 10, fontWeight: '700', color: '#9099B3' },
  filterCountTextActive: { color: '#fff' },
  list: { flex: 1 },
  empty: { textAlign: 'center', color: '#9099B3', fontSize: 13, paddingVertical: 40 },
  card: { backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: '#E4E7F1' },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
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
  cardBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 },
  total: { fontSize: 18, fontWeight: '700', color: '#000933' },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 },
  actionBtnText: { fontSize: 13, fontWeight: '600', color: '#fff' },
  dispatched: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dispatchedText: { fontSize: 12, fontWeight: '600', color: '#046C2E' },
});