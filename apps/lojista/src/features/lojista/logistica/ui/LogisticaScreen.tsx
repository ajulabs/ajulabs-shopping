import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, SafeAreaView, StatusBar, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

let MapView: any, Marker: any, Polyline: any;
if (Platform.OS !== 'web') {
  const Maps = require('react-native-maps');
  MapView = Maps.default;
  Marker = Maps.Marker;
  Polyline = Maps.Polyline;
}

interface Entrega {
  id: string;
  pedidoId: string;
  cliente: string;
  endereco: string;
  motoboy: string;
  placa: string;
  status: 'andamento' | 'concluida';
  hora: string;
  distancia: string;
  tempoRestante?: string;
  loja: { latitude: number; longitude: number };
  destino: { latitude: number; longitude: number };
  motoboyPos?: { latitude: number; longitude: number };
}

const ENTREGAS: Entrega[] = [
  {
    id: '1', pedidoId: '#SD-8839', cliente: 'Carla M.',
    endereco: 'R. Laranjeiras, 412 · Apto 302 — Atalaia',
    motoboy: 'Edson Silva', placa: 'ABC-1234',
    status: 'andamento', hora: '14:04', distancia: '3,2 km', tempoRestante: '8 min',
    loja:       { latitude: -10.9472, longitude: -37.0731 },
    destino:    { latitude: -10.9612, longitude: -37.0521 },
    motoboyPos: { latitude: -10.9530, longitude: -37.0640 },
  },
  {
    id: '2', pedidoId: '#SD-8837', cliente: 'Lucas F.',
    endereco: 'Av. Beira Mar, 880 — Coroa do Meio',
    motoboy: 'Ricardo P.', placa: 'XYZ-5678',
    status: 'andamento', hora: '13:45', distancia: '5,1 km', tempoRestante: '12 min',
    loja:       { latitude: -10.9472, longitude: -37.0731 },
    destino:    { latitude: -10.9320, longitude: -37.0890 },
    motoboyPos: { latitude: -10.9400, longitude: -37.0800 },
  },
  {
    id: '3', pedidoId: '#SD-8836', cliente: 'Ana C.',
    endereco: 'R. das Flores, 77 — Farolândia',
    motoboy: 'Marcos L.', placa: 'DEF-9012',
    status: 'concluida', hora: '13:10', distancia: '2,8 km',
    loja:    { latitude: -10.9472, longitude: -37.0731 },
    destino: { latitude: -10.9550, longitude: -37.0600 },
  },
  {
    id: '4', pedidoId: '#SD-8835', cliente: 'Pedro S.',
    endereco: 'Cond. Vista do Mar — Atalaia',
    motoboy: 'Edson Silva', placa: 'ABC-1234',
    status: 'concluida', hora: '12:50', distancia: '4,2 km',
    loja:    { latitude: -10.9472, longitude: -37.0731 },
    destino: { latitude: -10.9680, longitude: -37.0450 },
  },
];

export function LogisticaScreen() {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const emAndamento = ENTREGAS.filter(e => e.status === 'andamento');
  const concluidas  = ENTREGAS.filter(e => e.status === 'concluida');

  const toggle = (id: string) => {
    setExpandedId(prev => prev === id ? null : id);
  };

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#F6F7FB" />

      {/* Header */}
      <View style={s.header}>
        <Text style={s.headerTitle}>Logística</Text>
        <View style={s.headerStats}>
          <View style={s.statPill}>
            <View style={s.dotOrange} />
            <Text style={s.statPillText}>{emAndamento.length} em rota</Text>
          </View>
          <View style={[s.statPill, s.statPillGreen]}>
            <Ionicons name="checkmark-circle" size={12} color="#046C2E" />
            <Text style={[s.statPillText, { color: '#046C2E' }]}>{concluidas.length} concluídas</Text>
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>

        {/* Em andamento */}
        <Text style={s.sectionLabel}>Em andamento</Text>
        {emAndamento.map(e => {
          const expanded = expandedId === e.id;
          const midLat = (e.loja.latitude + e.destino.latitude) / 2;
          const midLng = (e.loja.longitude + e.destino.longitude) / 2;
          const delta  = Math.abs(e.loja.latitude - e.destino.latitude) * 1.8;

          return (
            <View key={e.id} style={s.card}>
              <TouchableOpacity onPress={() => toggle(e.id)} activeOpacity={0.8}>
                <View style={s.cardTop}>
                  <View style={s.cardLeft}>
                    <View style={s.cardTitleRow}>
                      <Text style={s.orderId}>{e.pedidoId}</Text>
                      <View style={s.badgeOrange}>
                        <View style={s.dotOrangeSmall} />
                        <Text style={s.badgeOrangeText}>Em rota</Text>
                      </View>
                    </View>
                    <Text style={s.cardCliente}>{e.cliente} · {e.distancia}</Text>
                    <Text style={s.cardEndereco} numberOfLines={1}>{e.endereco}</Text>
                  </View>
                  <View style={s.cardRight}>
                    <Text style={s.tempoRestante}>{e.tempoRestante}</Text>
                    <Text style={s.tempoLabel}>restantes</Text>
                    <Ionicons
                      name={expanded ? 'chevron-up' : 'chevron-down'}
                      size={16} color="#9099B3" style={{ marginTop: 6 }}
                    />
                  </View>
                </View>

                {/* Motoboy */}
                <View style={s.motoboyRow}>
                  <View style={s.motoboyAvatar}>
                    <Text style={s.motoboyInitials}>
                      {e.motoboy.split(' ').map(w => w[0]).join('').slice(0, 2)}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={s.motoboyName}>{e.motoboy}</Text>
                    <Text style={s.motoboyPlaca}>{e.placa}</Text>
                  </View>
                  <TouchableOpacity style={s.callBtn}>
                    <Ionicons name="call" size={15} color="#002B12" />
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>

              {/* Mapa expansível */}
              {expanded && (
                <View style={s.mapContainer}>
                  {Platform.OS !== 'web' ? (
                    <MapView
                      style={s.map}
                      region={{
                        latitude: midLat,
                        longitude: midLng,
                        latitudeDelta: delta,
                        longitudeDelta: delta,
                      }}
                      scrollEnabled={false}
                      zoomEnabled={false}
                    >
                      <Marker coordinate={e.loja} title="Sua loja">
                        <View style={s.markerLoja}>
                          <Ionicons name="storefront" size={14} color="#fff" />
                        </View>
                      </Marker>
                      {e.motoboyPos && (
                        <Marker coordinate={e.motoboyPos} title={e.motoboy}>
                          <View style={s.markerMotoboy}>
                            <Ionicons name="bicycle" size={14} color="#fff" />
                          </View>
                        </Marker>
                      )}
                      <Marker coordinate={e.destino} title={e.cliente}>
                        <View style={s.markerDestino}>
                          <Ionicons name="location" size={14} color="#fff" />
                        </View>
                      </Marker>
                      <Polyline
                        coordinates={[e.loja, e.motoboyPos ?? e.loja, e.destino]}
                        strokeColor="#DE6708"
                        strokeWidth={3}
                        lineDashPattern={[6, 4]}
                      />
                    </MapView>
                  ) : (
                    <View style={[s.map, s.mapWebFallback]}>
                      <Ionicons name="map-outline" size={32} color="#9099B3" />
                      <Text style={s.mapWebText}>Mapa disponível no app mobile</Text>
                    </View>
                  )}

                  {/* Legenda */}
                  <View style={s.mapLegend}>
                    <View style={s.legendItem}>
                      <View style={[s.legendDot, { backgroundColor: '#000933' }]} />
                      <Text style={s.legendText}>Loja</Text>
                    </View>
                    <View style={s.legendItem}>
                      <View style={[s.legendDot, { backgroundColor: '#DE6708' }]} />
                      <Text style={s.legendText}>Motoboy</Text>
                    </View>
                    <View style={s.legendItem}>
                      <View style={[s.legendDot, { backgroundColor: '#17258E' }]} />
                      <Text style={s.legendText}>Destino</Text>
                    </View>
                  </View>
                </View>
              )}
            </View>
          );
        })}

        {/* Concluídas */}
        <Text style={[s.sectionLabel, { marginTop: 8 }]}>Concluídas hoje</Text>
        {concluidas.map(e => (
          <View key={e.id} style={[s.card, s.cardConcluida]}>
            <View style={s.cardTop}>
              <View style={s.cardLeft}>
                <View style={s.cardTitleRow}>
                  <Text style={s.orderId}>{e.pedidoId}</Text>
                  <View style={s.badgeGreen}>
                    <Ionicons name="checkmark-circle" size={11} color="#046C2E" />
                    <Text style={s.badgeGreenText}>Concluída</Text>
                  </View>
                </View>
                <Text style={s.cardCliente}>{e.cliente} · {e.distancia}</Text>
                <Text style={s.cardEndereco} numberOfLines={1}>{e.endereco}</Text>
              </View>
              <View style={s.cardRight}>
                <Text style={[s.tempoRestante, { color: '#9099B3', fontSize: 13 }]}>{e.hora}</Text>
              </View>
            </View>
            <View style={s.motoboyRow}>
              <View style={[s.motoboyAvatar, { backgroundColor: '#E4E7F1' }]}>
                <Text style={[s.motoboyInitials, { color: '#9099B3' }]}>
                  {e.motoboy.split(' ').map(w => w[0]).join('').slice(0, 2)}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.motoboyName}>{e.motoboy}</Text>
                <Text style={s.motoboyPlaca}>{e.placa}</Text>
              </View>
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F6F7FB' },
  header: { backgroundColor: '#fff', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: '#E4E7F1', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle: { fontSize: 24, fontWeight: '700', color: '#000933' },
  headerStats: { flexDirection: 'row', gap: 8 },
  statPill: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#FFF0E6', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 99 },
  statPillGreen: { backgroundColor: '#E6F7ED' },
  statPillText: { fontSize: 11, fontWeight: '600', color: '#B34D00' },
  dotOrange: { width: 7, height: 7, borderRadius: 99, backgroundColor: '#DE6708' },
  sectionLabel: { fontSize: 11, fontWeight: '600', color: '#9099B3', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 },
  card: { backgroundColor: '#fff', borderRadius: 14, borderWidth: 1, borderColor: '#E4E7F1', padding: 14, marginBottom: 10, overflow: 'hidden' },
  cardConcluida: { opacity: 0.75 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  cardLeft: { flex: 1, marginRight: 12 },
  cardRight: { alignItems: 'flex-end' },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 3 },
  orderId: { fontSize: 15, fontWeight: '700', color: '#000933' },
  cardCliente: { fontSize: 12.5, color: '#9099B3', marginBottom: 2 },
  cardEndereco: { fontSize: 12, color: '#000933' },
  tempoRestante: { fontSize: 17, fontWeight: '700', color: '#DE6708' },
  tempoLabel: { fontSize: 10, color: '#9099B3', textAlign: 'right' },
  badgeOrange: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#FFF0E6', paddingHorizontal: 7, paddingVertical: 3, borderRadius: 99 },
  dotOrangeSmall: { width: 5, height: 5, borderRadius: 99, backgroundColor: '#DE6708' },
  badgeOrangeText: { fontSize: 10, fontWeight: '700', color: '#DE6708' },
  badgeGreen: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#E6F7ED', paddingHorizontal: 7, paddingVertical: 3, borderRadius: 99 },
  badgeGreenText: { fontSize: 10, fontWeight: '700', color: '#046C2E' },
  motoboyRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#F0F1F7' },
  motoboyAvatar: { width: 32, height: 32, borderRadius: 99, backgroundColor: '#DE6708', alignItems: 'center', justifyContent: 'center' },
  motoboyInitials: { fontSize: 12, fontWeight: '700', color: '#fff' },
  motoboyName: { fontSize: 13, fontWeight: '600', color: '#000933' },
  motoboyPlaca: { fontSize: 11, color: '#9099B3' },
  callBtn: { width: 34, height: 34, borderRadius: 99, backgroundColor: '#39FF89', alignItems: 'center', justifyContent: 'center' },
  mapContainer: { marginTop: 12, borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: '#E4E7F1' },
  map: { width: '100%', height: 200 },
  mapWebFallback: { alignItems: 'center', justifyContent: 'center', backgroundColor: '#F0F1F7', gap: 8 },
  mapWebText: { fontSize: 13, color: '#9099B3', fontWeight: '500' },
  mapLegend: { flexDirection: 'row', justifyContent: 'center', gap: 16, padding: 10, backgroundColor: '#fff' },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot: { width: 8, height: 8, borderRadius: 99 },
  legendText: { fontSize: 11, color: '#9099B3' },
  markerLoja: { width: 28, height: 28, borderRadius: 99, backgroundColor: '#000933', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#fff' },
  markerMotoboy: { width: 28, height: 28, borderRadius: 99, backgroundColor: '#DE6708', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#fff' },
  markerDestino: { width: 28, height: 28, borderRadius: 99, backgroundColor: '#17258E', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#fff' },
});