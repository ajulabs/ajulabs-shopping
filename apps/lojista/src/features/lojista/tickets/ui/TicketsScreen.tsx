import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTickets } from '../model/useTickets';
import { TicketDetail } from './TicketDetail';
import { TicketCard } from './components/TicketCard';
import { TicketFilterTabs } from './components/TicketFilterTabs';

export function TicketsScreen({ onBack }: { onBack?: () => void }) {
  const {
    token,
    lojaNome,
    loading,
    filter,
    setFilter,
    selected,
    setSelected,
    fetchTickets,
    handleTicketUpdate,
    list,
    countFor,
    abertos,
  } = useTickets();

  if (selected) {
    return (
      <TicketDetail
        ticket={selected}
        token={token!}
        onBack={() => setSelected(null)}
        onUpdate={handleTicketUpdate}
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
            <View style={s.tituloRow}>
              {onBack && (
                <TouchableOpacity onPress={onBack} style={s.backBtn} activeOpacity={0.7}>
                  <Ionicons name="chevron-back" size={22} color="#000933" />
                </TouchableOpacity>
              )}
              <Text style={s.headerTitle}>Tickets</Text>
            </View>
          </View>
          <TouchableOpacity onPress={fetchTickets} style={s.refreshBtn} activeOpacity={0.7}>
            <Ionicons name="refresh" size={18} color="#9099B3" />
          </TouchableOpacity>
        </View>

        {abertos > 0 && (
          <View style={s.alertBanner}>
            <View style={s.alertIcon}>
              <Ionicons name="alert-circle" size={16} color="#fff" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.alertTitle}>
                {abertos} ticket{abertos > 1 ? 's' : ''} aberto{abertos > 1 ? 's' : ''}
              </Text>
              <Text style={s.alertSub}>Aguardando análise</Text>
            </View>
          </View>
        )}

        <TicketFilterTabs filter={filter} onSelect={setFilter} countFor={countFor} />
      </View>

      <View style={s.tooltip}>
        <Ionicons
          name="information-circle-outline"
          size={16}
          color="#DE6708"
          style={{ marginTop: 1 }}
        />
        <Text style={s.tooltipTxt}>
          Tickets são abertos pelos seus clientes pelo{' '}
          <Text style={{ color: '#DE6708', fontWeight: '600' }}>Chat Aju</Text>
          {' ou manualmente pelo app. '}
          Você recebe uma notificação assim que um novo ticket é criado.
        </Text>
      </View>

      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color="#DE6708" />
        </View>
      ) : (
        <ScrollView style={s.list} contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
          {list.length === 0 && (
            <View style={s.emptyWrap}>
              <Ionicons name="checkmark-circle-outline" size={48} color="#C8CDE0" />
              <Text style={s.empty}>Nenhum ticket nesse filtro</Text>
            </View>
          )}
          {list.map((ticket) => (
            <TicketCard key={ticket.id} ticket={ticket} onPress={setSelected} />
          ))}
        </ScrollView>
      )}
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
    letterSpacing: 0.5,
  },
  headerTitle: { fontSize: 24, fontWeight: '700', color: '#000933', marginTop: 2 },
  tituloRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F0F1F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  refreshBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F0F1F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertBanner: {
    marginTop: 14,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#DC2626',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
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
  tooltip: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 4,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FFD9B3',
    backgroundColor: '#FFF8F2',
  },
  tooltipTxt: { flex: 1, fontSize: 12, lineHeight: 17, color: '#9099B3' },
  list: { flex: 1 },
  emptyWrap: { alignItems: 'center', paddingVertical: 60, gap: 10 },
  empty: { textAlign: 'center', color: '#9099B3', fontSize: 13 },
});
