import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GrupoLoja } from '../../../../store';
import { colors } from '@ajulabs/theme';
import { CartItemRow } from './CartItemRow';

interface Props {
  numero: number;
  grupo: GrupoLoja;
  onAumentar: (produtoId: string) => void;
  onDiminuir: (produtoId: string) => void;
  isDark?: boolean;
}

export function CartLojaGrupo({ numero, grupo, onAumentar, onDiminuir, isDark = false }: Props) {
  const fmtMoney = (v: number) => `R$ ${v.toFixed(2).replace('.', ',')}`;
  const fretetxt = grupo.taxaEntrega === 0
    ? 'Frete grátis'
    : `Frete ${fmtMoney(grupo.taxaEntrega)}`;

  const surf    = isDark ? colors.surfDark : colors.n0;
  const border  = isDark ? 'rgba(255,255,255,0.08)' : colors.n200;
  const borderL = isDark ? 'rgba(255,255,255,0.05)' : colors.n100;
  const text    = isDark ? colors.n0      : colors.navy;
  const textSec = isDark ? 'rgba(255,255,255,0.55)' : colors.n600;
  const subBg   = isDark ? 'rgba(255,255,255,0.03)' : '#FAFBFE';

  return (
    <View style={[styles.card, { backgroundColor: surf, borderColor: border }]}>
      <View style={[styles.header, { borderBottomColor: borderL }]}>
        <View style={styles.numeroBolha}>
          <Text style={styles.numeroTxt}>{numero}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.lojaNome, { color: text }]}>{grupo.lojaNome}</Text>
          <View style={styles.metaRow}>
            <Ionicons name="time-outline" size={11} color={textSec as string} />
            <Text style={[styles.metaTxt, { color: textSec as string }]}>
              {grupo.tempoEntregaMin}–{grupo.tempoEntregaMax} min · {fretetxt}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.itens}>
        {grupo.itens.map(item => (
          <CartItemRow
            key={item.produto.id}
            item={item}
            onAumentar={onAumentar}
            onDiminuir={onDiminuir}
            isDark={isDark}
          />
        ))}
      </View>

      <View style={[styles.subtotalRow, { borderTopColor: borderL, backgroundColor: subBg }]}>
        <Text style={[styles.subtotalLabel, { color: textSec as string }]}>Subtotal da loja</Text>
        <Text style={[styles.subtotalValue, { color: text }]}>{fmtMoney(grupo.subtotal)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card:          { borderRadius: 14, borderWidth: 1, marginBottom: 12, overflow: 'hidden' },
  header:        { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12,
                   borderBottomWidth: 1 },
  numeroBolha:   { width: 26, height: 26, borderRadius: 13, backgroundColor: colors.orange100,
                   alignItems: 'center', justifyContent: 'center' },
  numeroTxt:     { color: colors.orange600, fontSize: 13, fontWeight: '700' },
  lojaNome:      { fontSize: 14, fontWeight: '700' },
  metaRow:       { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  metaTxt:       { fontSize: 11.5 },
  itens:         { paddingHorizontal: 12 },
  subtotalRow:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
                   paddingHorizontal: 12, paddingVertical: 10, borderTopWidth: 1 },
  subtotalLabel: { fontSize: 12 },
  subtotalValue: { fontSize: 13, fontWeight: '700' },
});
