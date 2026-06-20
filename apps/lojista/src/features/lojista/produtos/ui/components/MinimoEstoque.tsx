import { View, Text, TouchableOpacity, TextInput, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { C, onlyDigits, MAX_QTY_LEN } from '../../lib/ajusteTipos';

export function MinimoEstoque({
  minimo,
  onChange,
}: {
  minimo: string;
  onChange: (v: string) => void;
}) {
  return (
    <View style={s.minimoBox}>
      <View style={s.minimoHead}>
        <Ionicons name="alert-circle-outline" size={13} color={C.mute} />
        <Text style={s.minimoTitle}>Alerta de estoque mínimo</Text>
      </View>
      <View style={s.minimoCtrl}>
        {(parseInt(minimo, 10) || 0) > 0 && (
          <TouchableOpacity
            style={s.minimoBtn}
            onPress={() => onChange(String(Math.max(0, (parseInt(minimo, 10) || 0) - 1)))}
            activeOpacity={0.7}
          >
            <Ionicons name="remove" size={16} color={C.sub} />
          </TouchableOpacity>
        )}
        <TextInput
          style={s.minimoInput}
          keyboardType="number-pad"
          inputMode="numeric"
          maxLength={MAX_QTY_LEN}
          value={minimo}
          onChangeText={(t) => onChange(onlyDigits(t))}
          placeholder="0"
          placeholderTextColor={C.mute}
          textAlign="center"
        />
        <TouchableOpacity
          style={s.minimoBtn}
          onPress={() => onChange(String((parseInt(minimo, 10) || 0) + 1))}
          activeOpacity={0.7}
        >
          <Ionicons name="add" size={16} color={C.sub} />
        </TouchableOpacity>
        <Text style={s.minimoUnit}>un.</Text>
      </View>
      <Text style={s.minimoHint}>Alerta ativo quando estoque cair abaixo deste valor.</Text>
    </View>
  );
}

const s = StyleSheet.create({
  minimoBox: {
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 14,
    padding: 14,
    backgroundColor: C.bg,
    marginBottom: 18,
  },
  minimoHead: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 },
  minimoTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: C.sub,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  minimoCtrl: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  minimoBtn: {
    width: 32,
    height: 32,
    borderRadius: 9,
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  minimoInput: {
    flex: 1,
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '800',
    color: C.text,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 9,
    paddingVertical: 5,
    backgroundColor: C.card,
  },
  minimoUnit: { fontSize: 12, color: C.mute, fontWeight: '600' },
  minimoHint: { fontSize: 11, color: C.mute, lineHeight: 16 },
});
