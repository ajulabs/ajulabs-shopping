import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../../../shared/hooks';

export const CAPABILITIES: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  color: string;
  title: string;
  desc: string;
}[] = [
  {
    icon: 'search-outline',
    color: '#f97316',
    title: 'Buscar Produtos',
    desc: 'Descreva o que quer e encontro produtos similares por você',
  },
  {
    icon: 'receipt-outline',
    color: '#2563EB',
    title: 'Rastrear Pedidos',
    desc: 'Saiba exatamente onde está seu pedido e quando chega',
  },
  {
    icon: 'alert-circle-outline',
    color: '#DC2626',
    title: 'Fazer Reclamação',
    desc: 'Produto com defeito, não chegou ou diferente? Resolvemos em 24h',
  },
  {
    icon: 'chatbubble-outline',
    color: '#7C3AED',
    title: 'Tirar Dúvidas',
    desc: 'Pergunte sobre políticas, entrega, trocas, etc',
  },
];

export function AjuCapabilities() {
  const { text, textSec } = useTheme();
  return (
    <>
      {CAPABILITIES.map((c) => (
        <View key={c.title} style={styles.capRow}>
          <View style={[styles.capIconWrap, { backgroundColor: c.color + '18' }]}>
            <Ionicons name={c.icon} size={18} color={c.color} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.capTitle, { color: text }]}>{c.title}</Text>
            <Text style={[styles.capDesc, { color: textSec as string }]}>"{c.desc}"</Text>
          </View>
        </View>
      ))}
    </>
  );
}

const styles = StyleSheet.create({
  capRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  capIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  capTitle: { fontSize: 14, fontWeight: '700' },
  capDesc: { fontSize: 12, marginTop: 2 },
});
