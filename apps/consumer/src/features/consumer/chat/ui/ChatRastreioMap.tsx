import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useAuthStore } from '../../auth/model/store';
import { useEntregadorTracking } from '../../tracking/hooks/useEntregadorTracking';
import { DeliveryMap } from '../../../../shared/ui/DeliveryMap';
import { useTheme } from '../../../../shared/hooks';
import type { RastreioChat } from '@ajulabs/types';

interface Props {
  rastreio: RastreioChat;
}

export function ChatRastreioMap({ rastreio }: Props) {
  const token = useAuthStore((s) => s.token);
  const userId = useAuthStore((s) => s.userId);
  const { isDark } = useTheme();

  const destino =
    rastreio.destinoLat != null && rastreio.destinoLng != null
      ? { lat: rastreio.destinoLat, lng: rastreio.destinoLng }
      : null;

  const initialEntregadorLocation =
    rastreio.entregadorLat != null && rastreio.entregadorLng != null
      ? { lat: rastreio.entregadorLat, lng: rastreio.entregadorLng }
      : null;

  const { entregadorLocation } = useEntregadorTracking({
    pedidoId: rastreio.pedidoId,
    token,
    userId,
    isActive: true,
    initialEntregadorLocation,
  });

  return (
    <View
      style={[styles.container, { borderColor: isDark ? 'rgba(255,255,255,0.08)' : '#e5e7eb' }]}
    >
      <DeliveryMap
        entregadorLocation={entregadorLocation}
        destinoLocation={destino}
        style={styles.map}
      />
      <View
        style={[
          styles.legend,
          { backgroundColor: isDark ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.9)' },
        ]}
      >
        <View style={styles.legendItem}>
          <View style={[styles.dot, { backgroundColor: '#209CEF' }]} />
          <Text style={[styles.legendText, { color: isDark ? '#e5e7eb' : '#374151' }]}>
            Entregador
          </Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.dot, { backgroundColor: '#F2760F' }]} />
          <Text style={[styles.legendText, { color: isDark ? '#e5e7eb' : '#374151' }]}>
            Destino
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 10,
    borderRadius: 14,
    overflow: 'hidden',
    height: 200,
    borderWidth: 1,
    position: 'relative',
  },
  map: {
    flex: 1,
  },
  legend: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    flexDirection: 'row',
    gap: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    fontSize: 11,
    fontWeight: '600',
  },
});
