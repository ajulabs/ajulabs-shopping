import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { colors } from '../../../../../theme';

export function PrecoField({
  preco,
  canEditPrices,
  onChangePreco,
  onSolicitar,
}: {
  preco: string;
  canEditPrices: boolean;
  onChangePreco: (v: string) => void;
  onSolicitar: () => void;
}) {
  return (
    <View style={styles.rowFields}>
      <View style={[styles.fieldGroup, { flex: 1 }]}>
        <Text style={styles.fieldLabel}>Preço (R$)</Text>
        {canEditPrices ? (
          <TextInput
            style={styles.input}
            value={preco}
            onChangeText={(v) => onChangePreco(v.replace(/[^0-9.,]/g, ''))}
            placeholder="0,00"
            keyboardType="decimal-pad"
          />
        ) : (
          <View style={styles.precoReadonly}>
            <Text style={styles.precoReadonlyText}>{preco}</Text>
            <TouchableOpacity onPress={onSolicitar} style={styles.solicitarBtn}>
              <Text style={styles.solicitarBtnText}>Solicitar mudança</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  rowFields: { flexDirection: 'row', gap: 10 },
  fieldGroup: { gap: 6 },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.n600,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  input: {
    backgroundColor: colors.n0,
    borderWidth: 1.5,
    borderColor: colors.n200,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: colors.navy,
  },
  precoReadonly: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.n50,
    borderWidth: 1.5,
    borderColor: colors.n200,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  precoReadonlyText: { flex: 1, fontSize: 14, color: colors.n600 },
  solicitarBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: colors.orange + '18',
    borderWidth: 1,
    borderColor: colors.orange,
  },
  solicitarBtnText: { fontSize: 11, fontWeight: '700', color: colors.orange },
});
