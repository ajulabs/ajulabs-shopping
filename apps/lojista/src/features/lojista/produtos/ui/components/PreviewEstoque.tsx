import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { C } from '../../lib/ajusteTipos';

export function PreviewEstoque({
  atual,
  novoEstoque,
  delta,
  color,
}: {
  atual: number;
  novoEstoque: number;
  delta: number | null;
  color: string;
}) {
  return (
    <View style={s.preview}>
      <View style={s.previewBox}>
        <Text style={s.previewLabel}>Atual</Text>
        <Text style={s.previewNum}>{atual}</Text>
      </View>
      <View style={[s.previewArrow, { backgroundColor: color + '15' }]}>
        <Ionicons name="arrow-forward" size={14} color={color} />
      </View>
      <View style={[s.previewBox, { borderColor: color + '40' }]}>
        <Text style={s.previewLabel}>Novo</Text>
        <Text style={[s.previewNum, { color }]}>{novoEstoque}</Text>
      </View>
      {delta !== null && (
        <View style={[s.deltaChip, { backgroundColor: color + '15' }]}>
          <Text style={[s.deltaText, { color }]}>
            {delta > 0 ? `+${delta}` : delta < 0 ? String(delta) : '='}
          </Text>
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  preview: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 18,
  },
  previewBox: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: C.border,
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    gap: 4,
    backgroundColor: C.bg,
  },
  previewLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: C.mute,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  previewNum: { fontSize: 26, fontWeight: '800', color: C.text },
  previewArrow: {
    width: 30,
    height: 30,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deltaChip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12 },
  deltaText: { fontSize: 18, fontWeight: '800' },
});
