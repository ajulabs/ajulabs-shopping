import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface AddressMapProps {
  address: string;
  style?: any;
  zoom?: number;
}

// Native: mostra endereço textual simples (mapa nativo requer config extra)
export function AddressMap({ address, style }: AddressMapProps) {
  return (
    <View style={[styles.container, style]}>
      <Ionicons name="map-outline" size={24} color="#9099B3" />
      <Text style={styles.txt} numberOfLines={2}>{address}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F6F7FB',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    gap: 8,
  },
  txt: { fontSize: 13, color: '#5A6480', textAlign: 'center' },
});