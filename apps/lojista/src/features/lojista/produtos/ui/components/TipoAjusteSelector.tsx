import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { C, TIPOS } from '../../lib/ajusteTipos';
import { TipoAjuste } from '../../model/useAjusteEstoque';

export function TipoAjusteSelector({
  tipo,
  onSelect,
}: {
  tipo: TipoAjuste;
  onSelect: (t: TipoAjuste) => void;
}) {
  return (
    <View style={s.tipoRow}>
      {TIPOS.map((t) => {
        const active = tipo === t.tipo;
        return (
          <TouchableOpacity
            key={t.tipo}
            style={[s.tipoBtn, active && { borderColor: t.color, backgroundColor: t.color + '12' }]}
            onPress={() => onSelect(t.tipo)}
            activeOpacity={0.75}
          >
            <View style={[s.tipoBtnIcon, { backgroundColor: active ? t.color + '20' : C.bg }]}>
              <Ionicons name={t.icon as any} size={18} color={active ? t.color : C.mute} />
            </View>
            <Text style={[s.tipoBtnLabel, active && { color: t.color }]}>{t.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const s = StyleSheet.create({
  tipoRow: { flexDirection: 'row', gap: 8, marginBottom: 22 },
  tipoBtn: {
    flex: 1,
    borderRadius: 14,
    padding: 10,
    alignItems: 'center',
    gap: 7,
    borderWidth: 1.5,
    borderColor: C.border,
    backgroundColor: C.bg,
  },
  tipoBtnIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tipoBtnLabel: { fontSize: 11, fontWeight: '800', color: C.sub, textAlign: 'center' },
});
