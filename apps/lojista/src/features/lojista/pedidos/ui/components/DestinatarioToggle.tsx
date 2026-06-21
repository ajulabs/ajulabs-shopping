import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { Destinatario } from '../../model/useChatPedido';

interface Props {
  destinatario: Destinatario;
  onChange: (d: Destinatario) => void;
}

export function DestinatarioToggle({ destinatario, onChange }: Props) {
  return (
    <View style={s.seletor}>
      {(['CONSUMER', 'ENTREGADOR'] as Destinatario[]).map((p) => (
        <TouchableOpacity
          key={p}
          style={[s.seletorBtn, destinatario === p && s.seletorBtnAtivo]}
          onPress={() => onChange(p)}
        >
          <Ionicons
            name={p === 'CONSUMER' ? 'person-outline' : 'bicycle-outline'}
            size={14}
            color={destinatario === p ? '#fff' : '#000933'}
          />
          <Text style={[s.seletorTxt, { color: destinatario === p ? '#fff' : '#000933' }]}>
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
