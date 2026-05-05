import React from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, SafeAreaView, StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Order, STATUS_META } from '../data';

const brl = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

interface Props {
  order: Order;
  onBack: () => void;
  onAdvance: () => void;
  onDispatch: () => void;
}

export function OrderDetail({ order, onBack, onAdvance, onDispatch }: Props) {
  const meta = STATUS_META[order.status];
  const initials = order.cliente.split(' ').map(w => w[0]).join('').slice(0, 2);

  const statusIcon: Record<string, any> = {
    novo: 'time-outline',
    preparando: 'time-outline',
    pronto: 'checkmark',
    despachado: 'bicycle',
  };

  const statusSubtitle: Record<string, string> = {
    novo: 'Aceite pra começar a preparar',
    preparando: 'Marque como pronto quando terminar',
    pronto: 'Chame um motoboy pra despachar',
    despachado: `Com ${order.motoboy || 'motoboy'} · a caminho do cliente`,
  };

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#F6F7FB" />

      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={onBack} style={s.backBtn}>
          <Ionicons name="chevron-back" size={20} color="#000933" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={s.headerTitle}>{order.id}</Text>
          <Text style={s.headerSub}>{order.hora} · {order.cliente}</Text>
        </View>
        <TouchableOpacity style={s.phoneBtn}>
          <Ionicons name="call-outline" size={18} color="#000933" />
        </TouchableOpacity>
      </View>

      <ScrollView style={s.scroll} contentContainerStyle={{ paddingBottom: 100 }}>

        {/* Status banner */}
        <View style={[s.statusBanner, { backgroundColor: meta.bg }]}>
          <View style={[s.statusIcon, { backgroundColor: meta.color }]}>
            <Ionicons name={statusIcon[order.status]} size={22} color="#fff" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[s.statusLabel, { color: meta.color }]}>{meta.label}</Text>
            <Text style={[s.statusSub, { color: meta.color }]}>{statusSubtitle[order.status]}</Text>
          </View>
        </View>

        {/* Cliente */}
        <Text style={s.sectionLabel}>Cliente</Text>
        <View style={s.card}>
          <View style={s.clientRow}>
            <View style={s.avatar}>
              <Text style={s.avatarText}>{initials}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.clientName}>{order.cliente}</Text>
              <Text style={s.clientDist}>{order.distancia} de distância</Text>
            </View>
            <TouchableOpacity style={s.iconBtnGray}>
              <Ionicons name="chatbubble-outline" size={16} color="#000933" />
            </TouchableOpacity>
            <TouchableOpacity style={s.iconBtnGreen}>
              <Ionicons name="call" size={16} color="#002B12" />
            </TouchableOpacity>
          </View>
          <View style={s.addressRow}>
            <Ionicons name="home-outline" size={16} color="#209CEF" style={{ marginTop: 2 }} />
            <Text style={s.addressText}>{order.endereco}</Text>
          </View>
        </View>

        {/* Itens */}
        <Text style={s.sectionLabel}>Itens do pedido</Text>
        <View style={s.card}>
          {order.itens.map((it, i) => (
            <View key={i} style={[s.itemRow, i < order.itens.length - 1 && s.itemBorder]}>
              <View style={s.qtyBadge}>
                <Text style={s.qtyText}>{it.qtd}×</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.itemName}>{it.nome}</Text>
                <Text style={s.itemEach}>{brl(it.preco)} cada</Text>
              </View>
              <Text style={s.itemTotal}>{brl(it.preco * it.qtd)}</Text>
            </View>
          ))}
        </View>

        {/* Observação */}
        {order.obs && (
          <View style={s.obsCard}>
            <Ionicons name="sparkles" size={18} color="#B34D00" />
            <View style={{ flex: 1 }}>
              <Text style={s.obsTitle}>Observação do cliente</Text>
              <Text style={s.obsText}>{order.obs}</Text>
            </View>
          </View>
        )}

        {/* Resumo */}
        <View style={[s.card, { marginTop: 16 }]}>
          <View style={s.summaryRow}>
            <Text style={s.summaryLabel}>Subtotal</Text>
            <Text style={s.summaryValue}>{brl(order.total - 8.90)}</Text>
          </View>
          <View style={s.summaryRow}>
            <Text style={s.summaryLabel}>Taxa de entrega</Text>
            <Text style={s.summaryValue}>R$ 8,90</Text>
          </View>
          <View style={s.summaryRow}>
            <Text style={s.summaryLabel}>Pagamento</Text>
            <Text style={[s.summaryValue, { fontWeight: '600' }]}>Pix · pago</Text>
          </View>
          <View style={s.totalRow}>
            <Text style={s.totalLabel}>Total</Text>
            <Text style={s.totalValue}>{brl(order.total)}</Text>
          </View>
          <Text style={s.platformFee}>
            Você recebe{' '}
            <Text style={{ color: '#046C2E', fontWeight: '700' }}>{brl(order.total * 0.88)}</Text>
            {' '}depois da taxa da plataforma (12%).
          </Text>
        </View>
      </ScrollView>

      {/* Botão fixo */}
      {meta.next && (
        <View style={s.stickyBtn}>
          <TouchableOpacity
            style={s.ctaBtn}
            onPress={() => order.status === 'pronto' ? onDispatch() : onAdvance()}
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
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, backgroundColor: '#F6F7FB' },
  backBtn: { width: 38, height: 38, borderRadius: 99, backgroundColor: '#E4E7F1', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#000933' },
  headerSub: { fontSize: 12, color: '#9099B3', marginTop: 1 },
  phoneBtn: { width: 38, height: 38, borderRadius: 99, backgroundColor: '#E4E7F1', alignItems: 'center', justifyContent: 'center' },
  scroll: { flex: 1, paddingHorizontal: 16 },
  statusBanner: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 14, marginBottom: 16 },
  statusIcon: { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  statusLabel: { fontSize: 16, fontWeight: '700' },
  statusSub: { fontSize: 11.5, opacity: 0.85, marginTop: 2 },
  sectionLabel: { fontSize: 11, fontWeight: '600', color: '#9099B3', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 },
  card: { backgroundColor: '#fff', borderRadius: 14, borderWidth: 1, borderColor: '#E4E7F1', padding: 12, marginBottom: 14 },
  clientRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatar: { width: 42, height: 42, borderRadius: 99, backgroundColor: '#FFF0E6', alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 14, fontWeight: '700', color: '#B34D00' },
  clientName: { fontSize: 14, fontWeight: '600', color: '#000933' },
  clientDist: { fontSize: 11.5, color: '#9099B3', marginTop: 2 },
  iconBtnGray: { width: 38, height: 38, borderRadius: 99, backgroundColor: '#F0F1F7', alignItems: 'center', justifyContent: 'center' },
  iconBtnGreen: { width: 38, height: 38, borderRadius: 99, backgroundColor: '#39FF89', alignItems: 'center', justifyContent: 'center' },
  addressRow: { flexDirection: 'row', gap: 10, alignItems: 'flex-start', marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#E4E7F1' },
  addressText: { fontSize: 12.5, color: '#000933', lineHeight: 18, flex: 1 },
  itemRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 },
  itemBorder: { borderBottomWidth: 1, borderBottomColor: '#E4E7F1' },
  qtyBadge: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#FFF0E6', alignItems: 'center', justifyContent: 'center' },
  qtyText: { fontSize: 14, fontWeight: '700', color: '#B34D00' },
  itemName: { fontSize: 13.5, fontWeight: '600', color: '#000933' },
  itemEach: { fontSize: 11.5, color: '#9099B3' },
  itemTotal: { fontSize: 14, fontWeight: '700', color: '#000933' },
  obsCard: { flexDirection: 'row', gap: 10, padding: 12, borderRadius: 12, backgroundColor: '#FFF0E6', marginBottom: 4 },
  obsTitle: { fontSize: 12, fontWeight: '700', color: '#B34D00', marginBottom: 2 },
  obsText: { fontSize: 12.5, color: '#B34D00', lineHeight: 18 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 },
  summaryLabel: { fontSize: 13, color: '#9099B3' },
  summaryValue: { fontSize: 13, color: '#000933' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: 10, marginTop: 8, borderTopWidth: 1, borderTopColor: '#E4E7F1' },
  totalLabel: { fontSize: 16, fontWeight: '700', color: '#000933' },
  totalValue: { fontSize: 20, fontWeight: '700', color: '#000933' },
  platformFee: { fontSize: 11, color: '#9099B3', marginTop: 8, lineHeight: 16 },
  stickyBtn: { position: 'absolute', left: 0, right: 0, bottom: 0, padding: 16, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#E4E7F1' },
  ctaBtn: { backgroundColor: '#DE6708', borderRadius: 14, height: 54, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  ctaBtnText: { fontSize: 16, fontWeight: '600', color: '#fff' },
});