import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export function DocUploadButton({
  label,
  uri,
  onPick,
}: {
  label: string;
  uri: string | null;
  onPick: () => void;
}) {
  return (
    <TouchableOpacity style={s.docBtn} onPress={onPick} activeOpacity={0.85}>
      {uri ? (
        <Image source={{ uri }} style={s.docThumb} resizeMode="cover" />
      ) : (
        <View style={s.docPlaceholder}>
          <Ionicons name="cloud-upload-outline" size={24} color="#F2760F" />
        </View>
      )}
      <View style={{ flex: 1, marginLeft: 12 }}>
        <Text style={s.docLabel}>{label}</Text>
        <Text style={[s.docStatus, uri ? { color: '#039855' } : { color: '#9099B3' }]}>
          {uri ? 'Foto selecionada' : 'Toque para selecionar'}
        </Text>
      </View>
      <Ionicons
        name={uri ? 'checkmark-circle' : 'chevron-forward'}
        size={18}
        color={uri ? '#039855' : '#9099B3'}
      />
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  docBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E4E7F1',
    padding: 14,
    marginBottom: 8,
  },
  docThumb: { width: 48, height: 48, borderRadius: 10 },
  docPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 10,
    backgroundColor: 'rgba(242,118,15,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  docLabel: { fontSize: 14, fontWeight: '600', color: '#000933' },
  docStatus: { fontSize: 12, marginTop: 2 },
});
