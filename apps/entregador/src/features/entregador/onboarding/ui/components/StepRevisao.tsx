import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Data, TRANSPORTES } from '../../model/constants';

export function StepRevisao({ data }: { data: Data }) {
  const t = TRANSPORTES.find((t) => t.id === data.transporte);
  const rows = [
    { label: 'Nome', value: data.nome || '—' },
    { label: 'CPF', value: data.cpf || '—' },
    { label: 'Email', value: data.email || '—' },
    { label: 'Celular', value: data.celular || '—' },
    { label: 'Transporte', value: t?.label || '—' },
    { label: 'Chave Pix', value: data.pix || '—' },
  ];
  return (
    <View>
      <View style={s.reviewHero}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Text style={s.reviewTitle}>Tudo pronto!</Text>
          <Ionicons name="happy" size={22} color="#FFFFFF" />
        </View>
        <Text style={s.reviewSub}>Vamos revisar seu cadastro antes de enviar.</Text>
      </View>
      {rows.map((r) => (
        <View key={r.label} style={s.reviewRow}>
          <Text style={s.reviewLabel}>{r.label}</Text>
          <Text style={s.reviewValue}>{r.value}</Text>
        </View>
      ))}
      <View style={s.tipBox}>
        <Ionicons name="flash" size={16} color="#F2760F" />
        <Text style={s.tipText}>
          <Text style={{ fontWeight: '700' }}>Dica:</Text> entregadores que começam já na primeira
          semana ganham bônus de R$ 100.
        </Text>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  reviewHero: { padding: 18, borderRadius: 16, backgroundColor: '#000933', marginBottom: 14 },
  reviewTitle: { fontSize: 22, fontWeight: '700', color: '#FFFFFF', letterSpacing: -0.4 },
  reviewSub: { fontSize: 13, color: 'rgba(255,255,255,0.75)', marginTop: 4, lineHeight: 18 },
  reviewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E4E7F1',
  },
  reviewLabel: { fontSize: 13, color: '#9099B3' },
  reviewValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#000933',
    textAlign: 'right',
    flex: 1,
    marginLeft: 12,
  },
  tipBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 14,
    backgroundColor: '#FEF0E3',
    borderRadius: 12,
    marginTop: 14,
  },
  tipText: { flex: 1, fontSize: 12, color: '#F2760F', lineHeight: 18 },
});
