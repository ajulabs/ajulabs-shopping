import { View, Text, TouchableOpacity, TextInput, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { C, onlyDigits, MAX_QTY_LEN } from '../../lib/ajusteTipos';

export function QtyInput({
  qty,
  qtyNum,
  isInvent,
  color,
  onChange,
}: {
  qty: string;
  qtyNum: number;
  isInvent: boolean;
  color: string;
  onChange: (v: string) => void;
}) {
  return (
    <View style={s.qtyWrap}>
      <Text style={s.fieldLabel}>{isInvent ? 'Total correto em estoque' : 'Quantidade'}</Text>
      <View style={[s.qtyRow, { borderColor: color + '40' }]}>
        {!isNaN(qtyNum) && qtyNum > (isInvent ? 0 : 1) && (
          <TouchableOpacity
            style={[s.qtyBtn, { backgroundColor: color + '12' }]}
            onPress={() =>
              onChange(String(Math.max(isInvent ? 0 : 1, (parseInt(qty, 10) || 0) - 1)))
            }
            activeOpacity={0.7}
          >
            <Ionicons name="remove" size={22} color={color} />
          </TouchableOpacity>
        )}
        <TextInput
          style={[s.qtyInput, { color }]}
          keyboardType="number-pad"
          inputMode="numeric"
          maxLength={MAX_QTY_LEN}
          placeholder="0"
          placeholderTextColor={C.mute}
          value={qty}
          onChangeText={(t) => onChange(onlyDigits(t))}
          textAlign="center"
        />
        <TouchableOpacity
          style={[s.qtyBtn, { backgroundColor: color + '12' }]}
          onPress={() => onChange(String((parseInt(qty, 10) || 0) + 1))}
          activeOpacity={0.7}
        >
          <Ionicons name="add" size={22} color={color} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  qtyWrap: { marginBottom: 16 },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: C.sub,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  qtyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderRadius: 18,
    overflow: 'hidden',
  },
  qtyBtn: { width: 58, height: 64, alignItems: 'center', justifyContent: 'center' },
  qtyInput: { flex: 1, fontSize: 40, fontWeight: '800', letterSpacing: -1.5, textAlign: 'center' },
});
