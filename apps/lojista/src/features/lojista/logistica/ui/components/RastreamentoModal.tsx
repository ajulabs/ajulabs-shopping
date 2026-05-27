import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Modal,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { EntregaMap } from '../../components/EntregaMap';
import { useRastreamento } from '../../hooks/useRastreamento';
import type { EntregaDisplay } from '../../model/types';

interface Props {
  entrega: EntregaDisplay;
  lojaId: string | null;
  token: string | null;
  onClose: () => void;
  onOpenChat: (pedidoId: string) => void;
}

export function RastreamentoModal({ entrega, lojaId, token, onClose, onOpenChat }: Props) {
  const { entregadorLocation, connected } = useRastreamento({
    entregaId: entrega.id,
    lojaId,
    token,
  });

  const statusLabel = entrega.statusRaw === 'pronto' ? 'Aguardando retirada' : 'Em rota de entrega';
  const statusColor = entrega.statusRaw === 'pronto' ? '#DE6708' : '#22C55E';

  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={s.safe}>
        <StatusBar barStyle="dark-content" />

        <View style={s.header}>
          <TouchableOpacity onPress={onClose} style={s.closeBtn} activeOpacity={0.8}>
            <Ionicons name="chevron-down" size={22} color="#000933" />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={s.title}>{entrega.pedidoId}</Text>
            <View style={s.statusRow}>
              <View style={[s.statusDot, { backgroundColor: statusColor }]} />
              <Text style={[s.statusTxt, { color: statusColor }]}>{statusLabel}</Text>
              {connected && (
                <View style={s.liveBadge}>
                  <View style={s.liveDot} />
                  <Text style={s.liveTxt}>Ao vivo</Text>
                </View>
              )}
            </View>
          </View>
        </View>

        <View style={s.mapContainer}>
          <EntregaMap entregadorLocation={entregadorLocation} />

          {!entregadorLocation && (
            <View style={s.mapPlaceholder}>
              <Ionicons name="location-outline" size={36} color="#9099B3" />
              <Text style={s.mapPlaceholderTxt}>
                {connected
                  ? 'Aguardando localização do entregador...'
                  : 'Conectando ao rastreamento...'}
              </Text>
              {!connected && <ActivityIndicator color="#DE6708" style={{ marginTop: 12 }} />}
            </View>
          )}

          {entregadorLocation && (
            <View style={s.coordBadge}>
              <Ionicons name="navigate" size={11} color="#fff" />
              <Text style={s.coordTxt}>
                {entregadorLocation.lat.toFixed(4)}, {entregadorLocation.lng.toFixed(4)}
              </Text>
              {entregadorLocation.speedKmh != null && entregadorLocation.speedKmh > 0 && (
                <Text style={s.speedTxt}>{Math.round(entregadorLocation.speedKmh)} km/h</Text>
              )}
            </View>
          )}
        </View>

        <ScrollView style={s.infoScroll} contentContainerStyle={{ padding: 16, gap: 10 }}>
          <View style={s.infoCard}>
            <View style={s.infoCardIcon}>
              <Ionicons name="bicycle" size={18} color="#DE6708" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.infoCardLabel}>Entregador</Text>
              <Text style={s.infoCardValue}>{entrega.motoboy}</Text>
              <Text style={s.infoCardSub}>Placa: {entrega.placa}</Text>
            </View>
            {entrega.status === 'andamento' && (
              <TouchableOpacity style={s.chatBtn} onPress={() => onOpenChat(entrega.id)}>
                <Ionicons name="chatbubble-ellipses" size={16} color="#DE6708" />
              </TouchableOpacity>
            )}
            {entrega.motoboyTelefone && (
              <TouchableOpacity style={s.callBtn}>
                <Ionicons name="call" size={16} color="#002B12" />
              </TouchableOpacity>
            )}
          </View>

          <View style={s.infoCard}>
            <View style={[s.infoCardIcon, { backgroundColor: '#E8F4FF' }]}>
              <Ionicons name="person" size={18} color="#209CEF" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.infoCardLabel}>Cliente</Text>
              <Text style={s.infoCardValue}>{entrega.cliente}</Text>
              <Text style={s.infoCardSub} numberOfLines={1}>
                {entrega.endereco}
              </Text>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F6F7FB' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E4E7F1',
  },
  closeBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F0F1F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: 17, fontWeight: '700', color: '#000933' },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
  statusDot: { width: 7, height: 7, borderRadius: 99 },
  statusTxt: { fontSize: 12, fontWeight: '600' },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#E6F7ED',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 99,
  },
  liveDot: { width: 5, height: 5, borderRadius: 99, backgroundColor: '#22C55E' },
  liveTxt: { fontSize: 10, fontWeight: '700', color: '#046C2E' },

  mapContainer: { flex: 1, position: 'relative' },
  mapPlaceholder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0F2F8',
  },
  mapPlaceholderTxt: {
    fontSize: 13,
    color: '#9099B3',
    marginTop: 10,
    textAlign: 'center',
    paddingHorizontal: 32,
  },

  coordBadge: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(0,9,51,0.75)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  coordTxt: { fontSize: 10, color: '#fff', fontWeight: '600' },
  speedTxt: { fontSize: 10, color: '#39FF89', fontWeight: '700' },

  infoScroll: { maxHeight: 200 },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E4E7F1',
  },
  infoCardIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#FFF0E6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoCardLabel: {
    fontSize: 10,
    color: '#9099B3',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  infoCardValue: { fontSize: 14, fontWeight: '700', color: '#000933', marginTop: 1 },
  infoCardSub: { fontSize: 11, color: '#9099B3', marginTop: 1 },
  chatBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFF0E6',
    borderWidth: 1,
    borderColor: '#DE6708',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  callBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#39FF89',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
