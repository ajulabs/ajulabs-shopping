import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { Destinatario } from '../../model/useChatPedido';
import { useTheme } from '../../../../../shared/hooks';

interface Props {
  destinatario: Destinatario;
  onChange: (d: Destinatario) => void;
}

export function DestinatarioToggle({ destinatario, onChange }: Props) {
  const theme = useTheme();
  return (
    <View style={[s.seletor, { backgroundColor: theme.surf, borderBottomColor: theme.border }]}>
      {(['CONSUMER', 'ENTREGADOR'] as Destinatario[]).map((p) => (
        <TouchableOpacity
          key={p}
          style={[s.seletorBtn, destinatario === p && s.seletorBtnAtivo]}
          onPress={() => onChange(p)}
        >
          <Ionicons
            name={p === 'CONSUMER' ? 'person-outline' : 'bicycle-outline'}
            size={14}
            color={destinatario === p ? '#fff' : theme.text}
          />
          <Text style={[s.seletorTxt, { color: destinatario === p ? '#fff' : theme.text }]}>
            {p === 'CONSUMER' ? 'Cliente' : 'Entregador'}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const s = StyleSheet.create({
  seletor: {
    flexDirection: 'row',
    gap: 8,
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E4E7F1',
    backgroundColor: '#fff',
  },
  seletorBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: 20,
  },
  seletorBtnAtivo: { backgroundColor: '#DE6708' },
  seletorTxt: { fontSize: 13, fontWeight: '600' },
});
