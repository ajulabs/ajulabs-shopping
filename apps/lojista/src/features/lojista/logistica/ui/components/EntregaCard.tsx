import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { EntregaDisplay } from '../../model/types';
import { useTheme } from '../../../../../shared/hooks';

interface Props {
  entrega: EntregaDisplay;
  onPress?: (entrega: EntregaDisplay) => void;
}

function getInitials(motoboy: string): string {
  return motoboy
    .split(' ')
    .map((w: string) => w[0])
    .join('')
    .slice(0, 2);
}

export function EntregaCard({ entrega: e, onPress }: Props) {
  const theme = useTheme();
  // Concluída renders as a dimmed, non-interactive card (no map/rastrear hints).
  if (e.status === 'concluida') {
    return (
      <View
        style={[
          s.card,
          { backgroundColor: theme.surf, borderColor: theme.border },
          s.cardConcluida,
        ]}
      >
        <View style={s.cardTop}>
          <View style={s.cardLeft}>
            <View style={s.cardTitleRow}>
              <Text style={[s.orderId, { color: theme.text }]}>{e.pedidoId}</Text>
              <View style={s.badgeGreenAlt}>
                <Ionicons name="checkmark-circle" size={11} color="#046C2E" />
                <Text style={s.badgeGreenTextAlt}>Concluída</Text>
              </View>
            </View>
            <Text style={[s.cardCliente, { color: theme.textMut }]}>{e.cliente}</Text>
            <Text style={[s.cardEndereco, { color: theme.text }]} numberOfLines={1}>
              {e.endereco}
            </Text>
          </View>
          <View style={s.cardRight}>
            <Text style={[s.hora, { color: '#9099B3', fontSize: 13 }]}>{e.hora}</Text>
          </View>
        </View>
        <View style={[s.motoboyRow, { borderTopColor: theme.borderL }]}>
          <View style={[s.motoboyAvatar, { backgroundColor: '#E4E7F1' }]}>
            <Text style={[s.motoboyInitials, { color: '#9099B3' }]}>{getInitials(e.motoboy)}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[s.motoboyName, { color: theme.text }]}>{e.motoboy}</Text>
            <Text style={[s.motoboyPlaca, { color: theme.textMut }]}>{e.placa}</Text>
          </View>
        </View>
      </View>
    );
  }

  return (
    <TouchableOpacity
      style={[s.card, { backgroundColor: theme.surf, borderColor: theme.border }]}
      activeOpacity={0.75}
      onPress={() => onPress?.(e)}
    >
      <View style={s.cardTop}>
        <View style={s.cardLeft}>
          <View style={s.cardTitleRow}>
            <Text style={[s.orderId, { color: theme.text }]}>{e.pedidoId}</Text>
            <View style={e.statusRaw === 'saiu_entrega' ? s.badgeGreen : s.badgeOrange}>
              <View style={e.statusRaw === 'saiu_entrega' ? s.dotGreen : s.dotOrangeSmall} />
              <Text style={e.statusRaw === 'saiu_entrega' ? s.badgeGreenText : s.badgeOrangeText}>
                {e.statusRaw === 'saiu_entrega' ? 'Em rota' : 'Aguardando'}
              </Text>
            </View>
          </View>
          <Text style={[s.cardCliente, { color: theme.textMut }]}>{e.cliente}</Text>
          <Text style={[s.cardEndereco, { color: theme.text }]} numberOfLines={1}>
            {e.endereco}
          </Text>
        </View>
        <View style={s.cardRight}>
          <Text style={s.hora}>{e.hora}</Text>
          <View style={s.mapHint}>
            <Ionicons name="map" size={12} color="#DE6708" />
            <Text style={s.mapHintTxt}>Ver mapa</Text>
          </View>
        </View>
      </View>
      <View style={[s.motoboyRow, { borderTopColor: theme.borderL }]}>
        <View style={s.motoboyAvatar}>
          <Text style={s.motoboyInitials}>{getInitials(e.motoboy)}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[s.motoboyName, { color: theme.text }]}>{e.motoboy}</Text>
          <Text style={[s.motoboyPlaca, { color: theme.textMut }]}>{e.placa}</Text>
        </View>
        <View style={s.rastrearHint}>
          <Ionicons name="navigate" size={13} color="#fff" />
          <Text style={s.rastrearTxt}>Rastrear</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E4E7F1',
    padding: 14,
    marginBottom: 10,
    overflow: 'hidden',
  },
  cardConcluida: { opacity: 0.72 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  cardLeft: { flex: 1, marginRight: 12 },
  cardRight: { alignItems: 'flex-end', gap: 6 },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 3 },
  orderId: { fontSize: 15, fontWeight: '700', color: '#000933' },
  cardCliente: { fontSize: 12.5, color: '#9099B3', marginBottom: 2 },
  cardEndereco: { fontSize: 12, color: '#000933' },
  hora: { fontSize: 17, fontWeight: '700', color: '#DE6708' },
  mapHint: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  mapHintTxt: { fontSize: 10, fontWeight: '600', color: '#DE6708' },

  badgeOrange: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFF0E6',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 99,
  },
  dotOrangeSmall: { width: 5, height: 5, borderRadius: 99, backgroundColor: '#DE6708' },
  badgeOrangeText: { fontSize: 10, fontWeight: '700', color: '#DE6708' },
  badgeGreen: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#E6F7ED',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 99,
  },
  dotGreen: { width: 5, height: 5, borderRadius: 99, backgroundColor: '#22C55E' },
  badgeGreenText: { fontSize: 10, fontWeight: '700', color: '#046C2E' },
  badgeGreenAlt: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#E6F7ED',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 99,
  },
  badgeGreenTextAlt: { fontSize: 10, fontWeight: '700', color: '#046C2E' },

  motoboyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F0F1F7',
  },
  motoboyAvatar: {
    width: 32,
    height: 32,
    borderRadius: 99,
    backgroundColor: '#DE6708',
    alignItems: 'center',
    justifyContent: 'center',
  },
  motoboyInitials: { fontSize: 12, fontWeight: '700', color: '#fff' },
  motoboyName: { fontSize: 13, fontWeight: '600', color: '#000933' },
  motoboyPlaca: { fontSize: 11, color: '#9099B3' },
  rastrearHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#DE6708',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 99,
  },
  rastrearTxt: { fontSize: 11, fontWeight: '700', color: '#fff' },
});
