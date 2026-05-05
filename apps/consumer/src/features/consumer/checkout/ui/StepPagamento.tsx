import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MetodoPagamento } from '@ajulabs/types';
import { colors } from '@ajulabs/theme';

interface Props {
  metodo: MetodoPagamento;
  onSelect: (m: MetodoPagamento) => void;
  subtotal: number;
  frete: number;
  numLojas: number;
}

const fmt = (v: number) => `R$ ${v.toFixed(2).replace('.', ',')}`;

export function StepPagamento({ metodo, onSelect, subtotal, frete, numLojas }: Props) {
  const desconto = metodo === 'pix' ? (subtotal + frete) * 0.05 : 0;
  const total = subtotal + frete - desconto;

  return (
    <View>
      <Text style={styles.titulo}>Como você quer pagar?</Text>

      {/* PIX */}
      <TouchableOpacity
        style={[styles.card, metodo === 'pix' && styles.cardPix]}
        onPress={() => onSelect('pix')}
        activeOpacity={0.8}
      >
        <View style={[styles.iconBox, metodo === 'pix' && styles.iconBoxPix]}>
          <Ionicons name="qr-code" size={20} color={metodo === 'pix' ? colors.mintText : colors.navy} />
        </View>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={styles.metodoNome}>Pix</Text>
            <View style={styles.badgeMint}>
              <Text style={styles.badgeMintTxt}>5% OFF</Text>
            </View>
          </View>
          <Text style={styles.metodoDesc}>
            Aprovação instantânea · Economia de {fmt((subtotal + frete) * 0.05)}
          </Text>
        </View>
        {metodo === 'pix' && (
          <View style={styles.checkMint}>
            <Ionicons name="checkmark" size={12} color={colors.mintText} />
          </View>
        )}
      </TouchableOpacity>

      {/* Cartão */}
      <TouchableOpacity
        style={[styles.card, metodo === 'cartao' && styles.cardSelected]}
        onPress={() => onSelect('cartao')}
        activeOpacity={0.8}
      >
        <View style={styles.iconBox}>
          <Ionicons name="card" size={20} color={colors.navy} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.metodoNome}>Cartão de crédito</Text>
          <Text style={styles.metodoDesc}>Até 3x sem juros · Visa •••• 4821</Text>
        </View>
        {metodo === 'cartao' && (
          <View style={styles.check}>
            <Ionicons name="checkmark" size={12} color="#fff" />
          </View>
        )}
      </TouchableOpacity>

      {/* Resumo */}
      <View style={styles.resumoCard}>
        <Text style={styles.resumoTitulo}>Resumo do pedido</Text>

        <View style={styles.linha}>
          <Text style={styles.linhaLabel}>Subtotal</Text>
          <Text style={styles.linhaValue}>{fmt(subtotal)}</Text>
        </View>
        <View style={styles.linha}>
          <Text style={styles.linhaLabel}>Frete ({numLojas} {numLojas === 1 ? 'loja' : 'lojas'})</Text>
          <Text style={styles.linhaValue}>{frete === 0 ? 'Grátis' : fmt(frete)}</Text>
        </View>
        {desconto > 0 && (
          <View style={styles.linha}>
            <Text style={styles.linhaLabel}>Desconto Pix</Text>
            <Text style={[styles.linhaValue, { color: colors.mintText }]}>-{fmt(desconto)}</Text>
          </View>
        )}

        <View style={styles.divider} />

        <View style={styles.linha}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>{fmt(total)}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  titulo:         { fontSize: 17, fontWeight: '700', color: colors.navy, marginBottom: 12 },

  card:           { flexDirection: 'row', gap: 12, alignItems: 'center', padding: 14,
                    backgroundColor: colors.n0, borderRadius: 14, marginBottom: 10,
                    borderWidth: 1.5, borderColor: colors.n200 },
  cardSelected:   { borderColor: colors.orange },
  cardPix:        { borderColor: colors.mint, backgroundColor: 'rgba(57,255,137,0.06)' },

  iconBox:        { width: 40, height: 40, borderRadius: 10, backgroundColor: colors.n100,
                    alignItems: 'center', justifyContent: 'center' },
  iconBoxPix:     { backgroundColor: 'rgba(57,255,137,0.2)' },

  metodoNome:     { fontSize: 14.5, fontWeight: '600', color: colors.navy },
  metodoDesc:     { fontSize: 12, color: colors.n600, marginTop: 2 },

  badgeMint:      { backgroundColor: 'rgba(57,255,137,0.2)', paddingHorizontal: 8,
                    paddingVertical: 2, borderRadius: 99 },
  badgeMintTxt:   { fontSize: 10, fontWeight: '700', color: colors.mintText },

  check:          { width: 20, height: 20, borderRadius: 10, backgroundColor: colors.orange,
                    alignItems: 'center', justifyContent: 'center' },
  checkMint:      { width: 20, height: 20, borderRadius: 10, backgroundColor: colors.mint,
                    alignItems: 'center', justifyContent: 'center' },

  resumoCard:     { backgroundColor: colors.n0, borderRadius: 14, padding: 14, marginTop: 8,
                    borderWidth: 1, borderColor: colors.n200 },
  resumoTitulo:   { fontSize: 13, fontWeight: '600', color: colors.navy, marginBottom: 10 },
  linha:          { flexDirection: 'row', justifyContent: 'space-between', marginTop: 5 },
  linhaLabel:     { fontSize: 13, color: colors.n600 },
  linhaValue:     { fontSize: 13, color: colors.navy, fontWeight: '500' },
  divider:        { height: 1, backgroundColor: colors.n100, marginVertical: 10,
                    borderStyle: 'dashed' },
  totalLabel:     { fontSize: 15, fontWeight: '700', color: colors.navy },
  totalValue:     { fontSize: 20, fontWeight: '800', color: colors.navy },
});