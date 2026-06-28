import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { type Order } from '../lib';
import { useOrderDetail } from '../model/useOrderDetail';
import { OrderItemsList, OrderSummary } from './components';
import { useTheme } from '../../../../shared/hooks';

interface Props {
  order: Order;
  onBack: () => void;
  onAdvance: () => void;
  onDispatch: () => void;
  onChatConsumer?: () => void;
  onChatEntregador?: () => void;
}

export function OrderDetail({ order, onBack, onAdvance, onDispatch, onChatConsumer }: Props) {
  const theme = useTheme();
  const { meta, initials, statusIcon, statusSubtitle } = useOrderDetail(order);

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: theme.bg }]}>
      <StatusBar
        barStyle={theme.isDark ? 'light-content' : 'dark-content'}
        backgroundColor={theme.bg}
      />

      <View style={[s.header, { backgroundColor: theme.bg }]}>
        <TouchableOpacity onPress={onBack} style={[s.backBtn, { backgroundColor: theme.backBtn }]}>
          <Ionicons name="chevron-back" size={20} color={theme.text} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={[s.headerTitle, { color: theme.text }]}>{order.id}</Text>
          <Text style={[s.headerSub, { color: theme.textMut }]}>
            {order.hora} · {order.cliente}
          </Text>
        </View>
        <TouchableOpacity style={[s.phoneBtn, { backgroundColor: theme.backBtn }]}>
          <Ionicons name="call-outline" size={18} color={theme.text} />
        </TouchableOpacity>
      </View>

      <ScrollView style={s.scroll} contentContainerStyle={{ paddingBottom: 100 }}>
        <View style={[s.statusBanner, { backgroundColor: meta.bg }]}>
          <View style={[s.statusIcon, { backgroundColor: meta.color }]}>
            <Ionicons name={statusIcon[order.status]} size={22} color="#fff" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[s.statusLabel, { color: meta.color }]}>{meta.label}</Text>
            <Text style={[s.statusSub, { color: meta.color }]}>{statusSubtitle[order.status]}</Text>
          </View>
        </View>

        <Text style={[s.sectionLabel, { color: theme.textMut }]}>Cliente</Text>
        <View style={[s.card, { backgroundColor: theme.surf, borderColor: theme.border }]}>
          <View style={s.clientRow}>
            <View style={s.avatar}>
              <Text style={s.avatarText}>{initials}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[s.clientName, { color: theme.text }]}>{order.cliente}</Text>
              <Text style={[s.clientDist, { color: theme.textMut }]}>
                {order.distancia} de distância
              </Text>
            </View>
            <TouchableOpacity
              style={[s.iconBtnGray, { backgroundColor: theme.surf2 }]}
              onPress={onChatConsumer}
            >
              <Ionicons name="chatbubble-outline" size={16} color={theme.text} />
            </TouchableOpacity>
            <TouchableOpacity style={s.iconBtnGreen}>
              <Ionicons name="call" size={16} color="#002B12" />
            </TouchableOpacity>
          </View>
          <View style={[s.addressRow, { borderTopColor: theme.borderL }]}>
            <Ionicons name="home-outline" size={16} color="#209CEF" style={{ marginTop: 2 }} />
            <Text style={[s.addressText, { color: theme.text }]}>{order.endereco}</Text>
          </View>
        </View>

        <Text style={[s.sectionLabel, { color: theme.textMut }]}>Itens do pedido</Text>
        <OrderItemsList itens={order.itens} />

        {order.obs && (
          <View style={s.obsCard}>
            <Ionicons name="sparkles" size={18} color="#B34D00" />
            <View style={{ flex: 1 }}>
              <Text style={s.obsTitle}>Observação do cliente</Text>
              <Text style={s.obsText}>{order.obs}</Text>
            </View>
          </View>
        )}

        <OrderSummary order={order} />
      </ScrollView>

      {meta.next && (
        <View style={[s.stickyBtn, { backgroundColor: theme.surf, borderTopColor: theme.border }]}>
          <TouchableOpacity
            style={s.ctaBtn}
            onPress={() => (order.status === 'pronto' ? onDispatch() : onAdvance())}
            activeOpacity={0.85}
          >
            <Text style={s.ctaBtnText}>{meta.next}</Text>
            <Ionicons name="arrow-forward" size={16} color="#fff" />
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F6F7FB' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    backgroundColor: '#F6F7FB',
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 99,
    backgroundColor: '#E4E7F1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#000933' },
  headerSub: { fontSize: 12, color: '#9099B3', marginTop: 1 },
  phoneBtn: {
    width: 38,
    height: 38,
    borderRadius: 99,
    backgroundColor: '#E4E7F1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: { flex: 1, paddingHorizontal: 16 },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 14,
    marginBottom: 16,
  },
  statusIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusLabel: { fontSize: 16, fontWeight: '700' },
  statusSub: { fontSize: 11.5, opacity: 0.85, marginTop: 2 },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#9099B3',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E4E7F1',
    padding: 12,
    marginBottom: 14,
  },
  clientRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 99,
    backgroundColor: '#FFF0E6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 14, fontWeight: '700', color: '#B34D00' },
  clientName: { fontSize: 14, fontWeight: '600', color: '#000933' },
  clientDist: { fontSize: 11.5, color: '#9099B3', marginTop: 2 },
  iconBtnGray: {
    width: 38,
    height: 38,
    borderRadius: 99,
    backgroundColor: '#F0F1F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBtnGreen: {
    width: 38,
    height: 38,
    borderRadius: 99,
    backgroundColor: '#39FF89',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addressRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#E4E7F1',
  },
  addressText: { fontSize: 12.5, color: '#000933', lineHeight: 18, flex: 1 },
  obsCard: {
    flexDirection: 'row',
    gap: 10,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#FFF0E6',
    marginBottom: 4,
  },
  obsTitle: { fontSize: 12, fontWeight: '700', color: '#B34D00', marginBottom: 2 },
  obsText: { fontSize: 12.5, color: '#B34D00', lineHeight: 18 },
  stickyBtn: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E4E7F1',
  },
  ctaBtn: {
    backgroundColor: '#DE6708',
    borderRadius: 14,
    height: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  ctaBtnText: { fontSize: 16, fontWeight: '600', color: '#fff' },
});
