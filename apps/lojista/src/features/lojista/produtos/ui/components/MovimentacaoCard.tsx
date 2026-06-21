import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MovimentacaoEstoque } from '@ajulabs/types';
import { TIPO_META } from '../../../../../entities/produto';
import { C } from '../../lib/movimentacoesTheme';

export function MovimentacaoCard({ m }: { m: MovimentacaoEstoque }) {
  const meta = TIPO_META[m.tipo] ?? {
    label: m.tipo,
    icon: 'ellipse',
    positive: true,
    color: C.sub,
  };
  const hora = new Date(m.criadoEm).toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <View style={s.card}>
      <View style={[s.cardIcon, { backgroundColor: meta.color + '15' }]}>
        <Ionicons name={meta.icon as any} size={18} color={meta.color} />
      </View>

      <View style={s.cardBody}>
        <Text style={s.cardNome} numberOfLines={1}>
          {m.produto?.nome ?? '—'}
        </Text>
        <View style={s.cardTipoRow}>
          <Text style={s.cardTipo}>{meta.label}</Text>
          {m.variacaoNome ? (
            <View style={s.varTag}>
              <Text style={s.varTagText} numberOfLines={1}>
                {m.variacaoNome}
              </Text>
            </View>
          ) : null}
        </View>
        {m.motivo ? (
          <Text style={s.cardMotivo} numberOfLines={1}>
            "{m.motivo}"
          </Text>
        ) : null}
      </View>

      <View style={s.cardRight}>
        <Text style={[s.cardQty, { color: meta.color }]}>
          {meta.positive ? '+' : '−'}
          {m.quantidade}
        </Text>
        <View style={s.cardStockRow}>
          <Ionicons name="cube-outline" size={10} color={C.mute} />
          <Text style={s.cardStock}>{m.estoqueDepois}</Text>
        </View>
        <Text style={s.cardHora}>{hora}</Text>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: C.card,
    borderRadius: 14,
    padding: 14,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: C.border,
  },
  cardIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  cardBody: { flex: 1, gap: 2 },
  cardNome: { fontSize: 14, fontWeight: '700', color: C.text },
  cardTipoRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  cardTipo: { fontSize: 12, color: C.sub },
  varTag: {
    backgroundColor: C.bg,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  varTagText: { fontSize: 10, fontWeight: '700', color: C.sub, maxWidth: 160 },
  cardMotivo: { fontSize: 11, color: C.mute, fontStyle: 'italic' },
  cardRight: { alignItems: 'flex-end', gap: 3 },
  cardQty: { fontSize: 20, fontWeight: '800', letterSpacing: -0.5 },
  cardStockRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  cardStock: { fontSize: 11, color: C.mute, fontWeight: '600' },
  cardHora: { fontSize: 10, color: C.mute },
});
