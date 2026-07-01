import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MetodoPagamento } from '@ajulabs/types';
import { colors } from '@ajulabs/theme';
import { useTheme } from '../../../../shared/hooks';

interface Props {
  metodo: MetodoPagamento;
  onSelect: (m: MetodoPagamento) => void;
  subtotal: number;
  frete: number;
  numLojas: number;
}

const fmt = (v: number) => `R$ ${v.toFixed(2).replace('.', ',')}`;

export function StepPagamento({ metodo, onSelect, subtotal, frete, numLojas }: Props) {
  const theme = useTheme();
  const desconto = metodo === 'pix' ? (subtotal + frete) * 0.05 : 0;
  const total = subtotal + frete - desconto;
  // Mint fica com pouco contraste no escuro; usa um verde mais claro pro texto.
  const mintTxt = theme.isDark ? '#6EE7B7' : colors.mintText;

  return (
    <View>
      <Text style={[styles.titulo, { color: theme.text }]}>Como você quer pagar?</Text>

      {/* PIX */}
      <TouchableOpacity
        style={[
          styles.card,
          { backgroundColor: theme.surf, borderColor: theme.border },
          metodo === 'pix' && styles.cardPix,
        ]}
        onPress={() => onSelect('pix')}
        activeOpacity={0.8}
      >
        <View
          style={[
            styles.iconBox,
            { backgroundColor: theme.iconBg },
            metodo === 'pix' && styles.iconBoxPix,
          ]}
        >
          <Ionicons name="qr-code" size={20} color={metodo === 'pix' ? mintTxt : theme.text} />
        </View>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={[styles.metodoNome, { color: theme.text }]}>Pix</Text>
            <View style={styles.badgeMint}>
              <Text style={[styles.badgeMintTxt, { color: mintTxt }]}>5% OFF</Text>
            </View>
          </View>
          <Text style={[styles.metodoDesc, { color: theme.textSec }]}>
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
        style={[
          styles.card,
          { backgroundColor: theme.surf, borderColor: theme.border },
          metodo === 'cartao' && styles.cardSelected,
        ]}
        onPress={() => onSelect('cartao')}
        activeOpacity={0.8}
      >
        <View style={[styles.iconBox, { backgroundColor: theme.iconBg }]}>
          <Ionicons name="card" size={20} color={theme.text} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.metodoNome, { color: theme.text }]}>Cartão de crédito</Text>
          <Text style={[styles.metodoDesc, { color: theme.textSec }]}>
            Até 3x sem juros · Visa •••• 4821
          </Text>
        </View>
        {metodo === 'cartao' && (
          <View style={styles.check}>
            <Ionicons name="checkmark" size={12} color="#fff" />
          </View>
        )}
      </TouchableOpacity>

      {/* Resumo */}
      <View style={[styles.resumoCard, { backgroundColor: theme.surf, borderColor: theme.border }]}>
        <Text style={[styles.resumoTitulo, { color: theme.text }]}>Resumo do pedido</Text>

        <View style={styles.linha}>
          <Text style={[styles.linhaLabel, { color: theme.textSec }]}>Subtotal</Text>
          <Text style={[styles.linhaValue, { color: theme.text }]}>{fmt(subtotal)}</Text>
        </View>
        <View style={styles.linha}>
          <Text style={[styles.linhaLabel, { color: theme.textSec }]}>
            Frete ({numLojas} {numLojas === 1 ? 'loja' : 'lojas'})
          </Text>
          <Text style={[styles.linhaValue, { color: theme.text }]}>
            {frete === 0 ? 'Grátis' : fmt(frete)}
          </Text>
        </View>
        {desconto > 0 && (
          <View style={styles.linha}>
            <Text style={[styles.linhaLabel, { color: theme.textSec }]}>Desconto Pix</Text>
            <Text style={[styles.linhaValue, { color: mintTxt }]}>-{fmt(desconto)}</Text>
          </View>
        )}

        <View style={[styles.divider, { backgroundColor: theme.borderL }]} />

        <View style={styles.linha}>
          <Text style={[styles.totalLabel, { color: theme.text }]}>Total</Text>
          <Text style={[styles.totalValue, { color: theme.text }]}>{fmt(total)}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  titulo: { fontSize: 17, fontWeight: '700', color: colors.navy, marginBottom: 12 },

  card: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    padding: 14,
    backgroundColor: colors.n0,
    borderRadius: 14,
    marginBottom: 10,
    borderWidth: 1.5,
    borderColor: colors.n200,
  },
  cardSelected: { borderColor: colors.orange },
  cardPix: { borderColor: colors.mint, backgroundColor: 'rgba(57,255,137,0.06)' },

  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: colors.n100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBoxPix: { backgroundColor: 'rgba(57,255,137,0.2)' },

  metodoNome: { fontSize: 14.5, fontWeight: '600', color: colors.navy },
  metodoDesc: { fontSize: 12, color: colors.n600, marginTop: 2 },

  badgeMint: {
    backgroundColor: 'rgba(57,255,137,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 99,
  },
  badgeMintTxt: { fontSize: 10, fontWeight: '700', color: colors.mintText },

  check: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.orange,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkMint: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.mint,
    alignItems: 'center',
    justifyContent: 'center',
  },

  resumoCard: {
    backgroundColor: colors.n0,
    borderRadius: 14,
    padding: 14,
    marginTop: 8,
    borderWidth: 1,
    borderColor: colors.n200,
  },
  resumoTitulo: { fontSize: 13, fontWeight: '600', color: colors.navy, marginBottom: 10 },
  linha: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 5 },
  linhaLabel: { fontSize: 13, color: colors.n600 },
  linhaValue: { fontSize: 13, color: colors.navy, fontWeight: '500' },
  divider: { height: 1, backgroundColor: colors.n100, marginVertical: 10, borderStyle: 'dashed' },
  totalLabel: { fontSize: 15, fontWeight: '700', color: colors.navy },
  totalValue: { fontSize: 20, fontWeight: '800', color: colors.navy },
});
