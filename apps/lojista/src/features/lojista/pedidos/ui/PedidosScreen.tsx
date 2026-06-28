import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Animated,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthLojistaStore } from '../../../../store';
import { useTheme } from '../../../../shared/hooks';
import { usePedidos } from '../model/usePedidos';
import { OrderDetail } from './OrderDetail';
import { DeliveryScreen } from './DeliveryScreen';
import { TicketsScreen } from '../../tickets/ui/TicketsScreen';
import { ChatPedidoScreen } from './ChatPedidoScreen';
import {
  OrderCard,
  OrderFilterBar,
  SoundModal,
  CancelModal,
  CancelamentoSucessoOverlay,
} from './components';

export function PedidosScreen() {
  const theme = useTheme();
  const barStyle = theme.isDark ? 'light-content' : 'dark-content';
  const {
    lojaNome,
    orders,
    list,
    loading,
    error,
    novos,
    openTickets,
    filters,
    filter,
    setFilter,
    screen,
    setScreen,
    selected,
    setSelected,
    showSomModal,
    setShowSomModal,
    cancelModal,
    setCancelModal,
    cancelando,
    sucessoCancel,
    fecharSucessoCancel,
    recarregando,
    spinAnim,
    borderColor,
    fetchPedidos,
    handleRefresh,
    advance,
    handleCancelar,
    tocarSom,
    somAtual,
    salvarSom,
  } = usePedidos();

  if (!loading && error === 'loja_null') {
    return (
      <SafeAreaView style={[s.safe, { backgroundColor: theme.bg }]}>
        <StatusBar barStyle={barStyle} backgroundColor={theme.surf} />
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
    <SafeAreaView style={[s.safe, { backgroundColor: theme.bg }]}>
      <StatusBar barStyle={barStyle} backgroundColor={theme.surf} />

      <View style={[s.header, { backgroundColor: theme.surf, borderBottomColor: theme.border }]}>
        <View style={s.headerTop}>
          <View>
            <Text style={[s.headerSub, { color: theme.textMut }]}>{lojaNome ?? 'Minha Loja'}</Text>
            <Text style={[s.headerTitle, { color: theme.text }]}>Pedidos hoje</Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TouchableOpacity
              onPress={() => setShowSomModal(true)}
              style={[s.refreshBtn, { backgroundColor: theme.backBtn }]}
              activeOpacity={0.7}
            >
              <Ionicons name="musical-notes" size={18} color={theme.textMut} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleRefresh}
              style={[s.refreshBtn, { backgroundColor: theme.backBtn }]}
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
                <Ionicons
                  name="refresh"
                  size={18}
                  color={recarregando ? '#DE6708' : theme.textMut}
                />
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

        <OrderFilterBar filters={filters} filter={filter} orders={orders} onSelect={setFilter} />
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
            style={[s.ticketCard, { backgroundColor: theme.surf, borderColor: theme.border }]}
            onPress={() => setScreen('tickets')}
            activeOpacity={0.8}
          >
            <View style={s.ticketCardLeft}>
              <View style={s.ticketCardIconWrap}>
                <Ionicons name="ticket-outline" size={18} color="#DE6708" />
              </View>
              <View>
                <Text style={[s.ticketCardTitle, { color: theme.text }]}>Tickets de Suporte</Text>
                <Text style={[s.ticketCardSub, { color: theme.textMut }]}>
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
              <Ionicons name="chevron-forward" size={16} color={theme.textMut} />
            </View>
          </TouchableOpacity>

          {list.length === 0 && (
            <Text style={[s.empty, { color: theme.textMut }]}>
              Nenhum pedido nesse filtro agora.
            </Text>
          )}
          {list.map((o) => (
            <OrderCard
              key={o.id}
              order={o}
              borderColor={borderColor}
              onPress={() => {
                setSelected(o);
                setScreen('detail');
              }}
              onAdvance={() => advance(o.id)}
              onCancel={() => setCancelModal({ orderId: o.id, dbId: o._id!, status: o.status })}
            />
          ))}
        </ScrollView>
      )}

      <CancelModal
        data={cancelModal}
        loading={cancelando}
        onClose={() => {
          if (!cancelando) setCancelModal(null);
        }}
        onConfirm={handleCancelar}
      />

      <CancelamentoSucessoOverlay
        visible={sucessoCancel !== null}
        orderId={sucessoCancel}
        onClose={fecharSucessoCancel}
      />

      <SoundModal
        visible={showSomModal}
        somAtual={somAtual}
        onClose={() => setShowSomModal(false)}
        onSelect={(id) => {
          tocarSom(id);
          salvarSom(id);
        }}
      />
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
  list: { flex: 1 },
  empty: { textAlign: 'center', color: '#9099B3', fontSize: 13, paddingVertical: 40 },
});
