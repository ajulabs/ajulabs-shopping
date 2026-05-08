import { useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import {
  useCartStore,
  calcularGrupos,
  calcularQuantidadeItens,
} from '../../../../store';
import { colors } from '@ajulabs/theme';
import { CartLojaGrupo } from './CartLojaGrupo';

export function CartScreen() {
  const router = useRouter();

  const itensPorLoja = useCartStore(s => s.itensPorLoja);
  const lojasCache = useCartStore(s => s.lojasCache);
  const aumentar = useCartStore(s => s.aumentar);
  const diminuir = useCartStore(s => s.diminuir);

  const grupos = useMemo(() => calcularGrupos(itensPorLoja, lojasCache), [itensPorLoja, lojasCache]);
  const quantidadeItens = useMemo(
    () => calcularQuantidadeItens(itensPorLoja),
    [itensPorLoja]
  );
  const subtotalGeral = useMemo(
    () => grupos.reduce((acc, g) => acc + g.subtotal, 0),
    [grupos]
  );
  const freteTotal = useMemo(
    () => grupos.reduce((acc, g) => acc + g.taxaEntrega, 0),
    [grupos]
  );
  const total = subtotalGeral + freteTotal;

  const fmt = (v: number) => `R$ ${v.toFixed(2).replace('.', ',')}`;
  const numLojas = grupos.length;

  if (grupos.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.btnBack}>
            <Ionicons name="chevron-back" size={20} color={colors.navy} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.titulo}>Carrinho</Text>
            <Text style={styles.subtitulo}>Vazio</Text>
          </View>
        </View>
        <View style={styles.vazio}>
          <Ionicons name="cart-outline" size={56} color={colors.n300} />
          <Text style={styles.vazioTitulo}>Seu carrinho está vazio</Text>
          <Text style={styles.vazioTxt}>Explore as vitrines e adicione produtos</Text>
          <TouchableOpacity
            style={styles.vazioBtn}
            onPress={() => router.push('/(consumer)/vitrines')}
            activeOpacity={0.85}
          >
            <Text style={styles.vazioBtnTxt}>Ver vitrines</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.btnBack} activeOpacity={0.85}>
          <Ionicons name="chevron-back" size={20} color={colors.navy} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.titulo}>Carrinho</Text>
          <Text style={styles.subtitulo}>
            {quantidadeItens} {quantidadeItens === 1 ? 'item' : 'itens'} · {numLojas} {numLojas === 1 ? 'loja' : 'lojas'}
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {numLojas > 1 && (
          <View style={styles.banner}>
            <View style={styles.bannerTitleRow}>
              <Ionicons name="storefront-outline" size={13} color={colors.orange600} />
              <Text style={[styles.bannerTxt, { fontWeight: '700' }]}>Compra em {numLojas} lojas</Text>
            </View>
            <Text style={styles.bannerTxt}>
              Cada loja tem seu frete e motoboy próprio, mas você paga tudo de uma vez.
            </Text>
          </View>
        )}

        {grupos.map((grupo, idx) => (
          <CartLojaGrupo
            key={grupo.lojaId}
            numero={idx + 1}
            grupo={grupo}
            onAumentar={aumentar}
            onDiminuir={diminuir}
          />
        ))}

        <View style={styles.totalCard}>
          <View style={styles.linhaTotal}>
            <Text style={styles.linhaLabel}>Subtotal</Text>
            <Text style={styles.linhaValue}>{fmt(subtotalGeral)}</Text>
          </View>
          <View style={styles.linhaTotal}>
            <Text style={styles.linhaLabel}>
              Frete{numLojas > 1 ? ` (${numLojas} lojas)` : ''}
            </Text>
            <Text style={styles.linhaValue}>
              {freteTotal === 0 ? 'Grátis' : fmt(freteTotal)}
            </Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.linhaTotal}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>{fmt(total)}</Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.btnFinalizar}
          onPress={() => router.push('/(consumer)/checkout')}
          activeOpacity={0.9}
        >
          <Text style={styles.btnFinalizarTxt}>Finalizar pedido</Text>
          <Ionicons name="chevron-forward" size={16} color={colors.n0} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container:       { flex: 1, backgroundColor: '#FAFBFE' },
  header:          { flexDirection: 'row', alignItems: 'center', gap: 8,
                     paddingHorizontal: 16, paddingTop: 52, paddingBottom: 14,
                     backgroundColor: colors.n0, borderBottomWidth: 1, borderBottomColor: colors.n100 },
  btnBack:         { width: 38, height: 38, borderRadius: 19, backgroundColor: colors.n50,
                     alignItems: 'center', justifyContent: 'center' },
  titulo:          { fontSize: 20, fontWeight: '700', color: colors.navy, letterSpacing: -0.3 },
  subtitulo:       { fontSize: 12, color: colors.n600, marginTop: 1 },

  scroll:          { padding: 16, paddingBottom: 24 },

  banner:          { backgroundColor: colors.orange100, borderRadius: 12, padding: 12, marginBottom: 12, gap: 2 },
  bannerTitleRow:  { flexDirection: 'row', alignItems: 'center', gap: 5 },
  bannerTxt:       { fontSize: 12.5, color: colors.orange600, lineHeight: 17 },

  totalCard:       { backgroundColor: colors.n0, borderRadius: 14, borderWidth: 1, borderColor: colors.n200,
                     padding: 14, marginTop: 4 },
  linhaTotal:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
                     paddingVertical: 4 },
  linhaLabel:      { fontSize: 13, color: colors.n600 },
  linhaValue:      { fontSize: 13, color: colors.navy, fontWeight: '500' },
  divider:         { height: 1, backgroundColor: colors.n100, marginVertical: 8 },
  totalLabel:      { fontSize: 16, fontWeight: '700', color: colors.navy },
  totalValue:      { fontSize: 22, fontWeight: '800', color: colors.navy, letterSpacing: -0.5 },

  footer:          { padding: 16, paddingBottom: 24, backgroundColor: colors.n0,
                     borderTopWidth: 1, borderTopColor: colors.n100 },
  btnFinalizar:    { backgroundColor: colors.orange, height: 52, borderRadius: 14,
                     flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
                     shadowColor: colors.orange, shadowOffset: { width: 0, height: 4 },
                     shadowOpacity: 0.3, shadowRadius: 14, elevation: 4 },
  btnFinalizarTxt: { color: colors.n0, fontSize: 15, fontWeight: '700' },

  vazio:           { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 8 },
  vazioTitulo:     { fontSize: 18, fontWeight: '700', color: colors.navy, marginTop: 12 },
  vazioTxt:        { fontSize: 13, color: colors.n600, textAlign: 'center' },
  vazioBtn:        { marginTop: 16, paddingHorizontal: 24, paddingVertical: 12,
                     backgroundColor: colors.orange, borderRadius: 12 },
  vazioBtnTxt:     { color: colors.n0, fontSize: 14, fontWeight: '700' },
});
