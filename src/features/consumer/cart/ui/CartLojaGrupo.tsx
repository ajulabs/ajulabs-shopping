// src/features/consumer/cart/ui/CartLojaGrupo.tsx
import { View, Text, StyleSheet } from 'react-native';
import { GrupoLoja } from '../../../../store';
import { colors } from '../../../../theme';
import { CartItemRow } from './CartItemRow';

interface Props {
  numero: number;
  grupo: GrupoLoja;
  onAumentar: (produtoId: string) => void;
  onDiminuir: (produtoId: string) => void;
}

export function CartLojaGrupo({ numero, grupo, onAumentar, onDiminuir }: Props) {
  const fmtMoney = (v: number) => `R$ ${v.toFixed(2).replace('.', ',')}`;
  const fretetxt = grupo.taxaEntrega === 0
    ? 'Frete grátis'
    : `Frete ${fmtMoney(grupo.taxaEntrega)}`;

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.numeroBolha}>
          <Text style={styles.numeroTxt}>{numero}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.lojaNome}>{grupo.lojaNome}</Text>
          <Text style={styles.metaTxt}>
            🛵 {grupo.tempoEntregaMin}–{grupo.tempoEntregaMax} min · {fretetxt}
          </Text>
        </View>
      </View>

      {/* Itens */}
      <View style={styles.itens}>
        {grupo.itens.map(item => (
          <CartItemRow
            key={item.produto.id}
            item={item}
            onAumentar={onAumentar}
            onDiminuir={onDiminuir}
          />
        ))}
      </View>

      {/* Subtotal da loja */}
      <View style={styles.subtotalRow}>
        <Text style={styles.subtotalLabel}>Subtotal da loja</Text>
        <Text style={styles.subtotalValue}>{fmtMoney(grupo.subtotal)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card:           { backgroundColor: colors.n0, borderRadius: 14, borderWidth: 1, borderColor: colors.n200,
                    marginBottom: 12, overflow: 'hidden' },
  header:         { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12,
                    borderBottomWidth: 1, borderBottomColor: colors.n100 },
  numeroBolha:    { width: 26, height: 26, borderRadius: 13, backgroundColor: colors.orange100,
                    alignItems: 'center', justifyContent: 'center' },
  numeroTxt:      { color: colors.orange600, fontSize: 13, fontWeight: '700' },
  lojaNome:       { fontSize: 14, fontWeight: '700', color: colors.navy },
  metaTxt:        { fontSize: 11.5, color: colors.n600, marginTop: 2 },
  itens:          { paddingHorizontal: 12 },
  subtotalRow:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
                    paddingHorizontal: 12, paddingVertical: 10,
                    borderTopWidth: 1, borderTopColor: colors.n100, backgroundColor: '#FAFBFE' },
  subtotalLabel:  { fontSize: 12, color: colors.n600 },
  subtotalValue:  { fontSize: 13, fontWeight: '700', color: colors.navy },
});