import { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '@ajulabs/theme';
import { useTheme } from '../../../../shared/hooks';
import { useEnderecoForm, EnderecoFormModal } from '../../../../entities/endereco';
import { useCart } from '../model/useCart';
import { CartLojaGrupo } from './CartLojaGrupo';

export function CartScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { isDark, bg, surf, border, borderL, text, textSec, backBtn, iconBg } = useTheme();

  const {
    grupos,
    quantidadeItens,
    subtotalGeral,
    freteTotal,
    total,
    numLojas,
    aumentar,
    diminuir,
    remover,
    token,
    enderecos,
    enderecoId,
    setEnderecoId,
    enderecoAtual,
    carregarEnderecos,
  } = useCart();

  const [showPicker, setShowPicker] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const enderecoForm = useEnderecoForm(token, async (novo) => {
    setShowForm(false);
    setShowPicker(true);
    await carregarEnderecos();
    setEnderecoId(novo.id);
  });

  const fmt = (v: number) => `R$ ${v.toFixed(2).replace('.', ',')}`;

  // ── tela vazia ────────────────────────────────────────────────
  if (grupos.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: bg }]}>
        <View
          style={[
            styles.header,
            { backgroundColor: surf, borderBottomColor: borderL, paddingTop: insets.top + 12 },
          ]}
        >
          <TouchableOpacity
            onPress={() => router.push('/(consumer)/vitrines')}
            style={[styles.btnBack, { backgroundColor: backBtn }]}
          >
            <Ionicons name="chevron-back" size={20} color={text} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={[styles.titulo, { color: text }]}>Carrinho</Text>
            <Text style={[styles.subtitulo, { color: textSec as string }]}>Vazio</Text>
          </View>
        </View>
        <View style={styles.vazio}>
          <Ionicons
            name="cart-outline"
            size={56}
            color={isDark ? 'rgba(255,255,255,0.2)' : colors.n300}
          />
          <Text style={[styles.vazioTitulo, { color: text }]}>Seu carrinho está vazio</Text>
          <Text style={[styles.vazioTxt, { color: textSec as string }]}>
            Explore as vitrines e adicione produtos
          </Text>
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
    <View style={[styles.container, { backgroundColor: bg }]}>
      {/* Header */}
      <View
        style={[
          styles.header,
          { backgroundColor: surf, borderBottomColor: borderL, paddingTop: insets.top + 12 },
        ]}
      >
        <TouchableOpacity
          onPress={() => router.push('/(consumer)/vitrines')}
          style={[styles.btnBack, { backgroundColor: backBtn }]}
          activeOpacity={0.85}
        >
          <Ionicons name="chevron-back" size={20} color={text} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={[styles.titulo, { color: text }]}>Carrinho</Text>
          <Text style={[styles.subtitulo, { color: textSec as string }]}>
            {quantidadeItens} {quantidadeItens === 1 ? 'item' : 'itens'} · {numLojas}{' '}
            {numLojas === 1 ? 'loja' : 'lojas'}
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Endereço */}
        <View style={[styles.endCard, { backgroundColor: surf, borderColor: border }]}>
          <TouchableOpacity
            style={styles.endRow}
            onPress={() => setShowPicker((v) => !v)}
            activeOpacity={0.8}
          >
            <View style={[styles.endIconBox, { backgroundColor: iconBg }]}>
              <Ionicons name="location" size={16} color={colors.orange} />
            </View>
            <View style={{ flex: 1 }}>
              {enderecoAtual ? (
                <>
                  <Text style={[styles.endApelido, { color: text }]}>{enderecoAtual.apelido}</Text>
                  <Text style={[styles.endRua, { color: textSec as string }]} numberOfLines={1}>
                    {enderecoAtual.rua}
                  </Text>
                </>
              ) : (
                <Text style={[styles.endVazio, { color: textSec as string }]}>
                  {enderecos.length === 0
                    ? 'Adicione um endereço de entrega'
                    : 'Selecione o endereço'}
                </Text>
              )}
            </View>
            <Ionicons
              name={showPicker ? 'chevron-up' : 'chevron-down'}
              size={16}
              color={textSec as string}
            />
          </TouchableOpacity>

          {showPicker && (
            <View style={[styles.endLista, { borderTopColor: borderL }]}>
              {enderecos.map((addr) => (
                <TouchableOpacity
                  key={addr.id}
                  style={styles.endOpcao}
                  onPress={() => {
                    setEnderecoId(addr.id);
                    setShowPicker(false);
                  }}
                  activeOpacity={0.75}
                >
                  <Ionicons
                    name={addr.id === enderecoId ? 'radio-button-on' : 'radio-button-off'}
                    size={18}
                    color={colors.orange}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.endOpcaoApelido, { color: text }]}>
                      {addr.apelido}
                      {addr.padrao ? '  ·  Padrão' : ''}
                    </Text>
                    <Text
                      style={[styles.endOpcaoRua, { color: textSec as string }]}
                      numberOfLines={1}
                    >
                      {addr.rua}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}

              {/* Botão adicionar novo endereço */}
              <TouchableOpacity
                style={[
                  styles.endOpcaoAdd,
                  { borderTopColor: borderL, borderTopWidth: enderecos.length > 0 ? 1 : 0 },
                ]}
                onPress={() => {
                  setShowPicker(false);
                  enderecoForm.resetar();
                  setShowForm(true);
                }}
                activeOpacity={0.75}
              >
                <Ionicons name="add-circle-outline" size={17} color={colors.orange} />
                <Text style={styles.endOpcaoAddTxt}>Adicionar novo endereço</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {numLojas > 1 && (
          <View style={[styles.banner, isDark && { backgroundColor: 'rgba(242,118,15,0.12)' }]}>
            <View style={styles.bannerTitleRow}>
              <Ionicons name="storefront-outline" size={13} color={colors.orange600} />
              <Text style={[styles.bannerTxt, { fontWeight: '700' }]}>
                Compra em {numLojas} lojas
              </Text>
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
            onRemover={remover}
          />
        ))}

        <View style={[styles.totalCard, { backgroundColor: surf, borderColor: border }]}>
          <View style={styles.linhaTotal}>
            <Text style={[styles.linhaLabel, { color: textSec as string }]}>Subtotal</Text>
            <Text style={[styles.linhaValue, { color: text }]}>{fmt(subtotalGeral)}</Text>
          </View>
          <View style={styles.linhaTotal}>
            <Text style={[styles.linhaLabel, { color: textSec as string }]}>
              Frete{numLojas > 1 ? ` (${numLojas} lojas)` : ''}
            </Text>
            <Text style={[styles.linhaValue, { color: text }]}>
              {freteTotal === 0 ? 'Grátis' : fmt(freteTotal)}
            </Text>
          </View>
          <View style={[styles.divider, { backgroundColor: borderL }]} />
          <View style={styles.linhaTotal}>
            <Text style={[styles.totalLabel, { color: text }]}>Total</Text>
            <Text style={[styles.totalValue, { color: text }]}>{fmt(total)}</Text>
          </View>
        </View>
      </ScrollView>

      <View style={[styles.footer, { backgroundColor: surf, borderTopColor: borderL }]}>
        <TouchableOpacity
          style={[styles.btnContinuar, { borderColor: colors.orange }]}
          onPress={() => router.push('/(consumer)/vitrines')}
          activeOpacity={0.85}
        >
          <Ionicons name="storefront-outline" size={16} color={colors.orange} />
          <Text style={styles.btnContinuarTxt}>Continuar comprando</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.btnFinalizar}
          onPress={() => router.push('/(consumer)/checkout')}
          activeOpacity={0.9}
        >
          <Text style={styles.btnFinalizarTxt}>Finalizar pedido</Text>
          <Ionicons name="chevron-forward" size={16} color={colors.n0} />
        </TouchableOpacity>
      </View>

      <EnderecoFormModal
        visible={showForm}
        controller={enderecoForm}
        onClose={() => setShowForm(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  btnBack: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titulo: { fontSize: 20, fontWeight: '700', letterSpacing: -0.3 },
  subtitulo: { fontSize: 12, marginTop: 1 },
  scroll: { padding: 16, paddingBottom: 24 },
  banner: {
    backgroundColor: colors.orange100,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    gap: 2,
  },
  bannerTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  bannerTxt: { fontSize: 12.5, color: colors.orange600, lineHeight: 17 },
  totalCard: { borderRadius: 14, borderWidth: 1, padding: 14, marginTop: 4 },
  linhaTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  linhaLabel: { fontSize: 13 },
  linhaValue: { fontSize: 13, fontWeight: '500' },
  divider: { height: 1, marginVertical: 8 },
  totalLabel: { fontSize: 16, fontWeight: '700' },
  totalValue: { fontSize: 22, fontWeight: '800', letterSpacing: -0.5 },
  endCard: { borderRadius: 14, borderWidth: 1, marginBottom: 12, overflow: 'hidden' },
  endRow: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14 },
  endIconBox: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  endApelido: { fontSize: 13, fontWeight: '700' },
  endRua: { fontSize: 12, marginTop: 1 },
  endVazio: { fontSize: 13 },
  endLista: { borderTopWidth: 1, paddingHorizontal: 14, paddingBottom: 6 },
  endOpcao: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10 },
  endOpcaoApelido: { fontSize: 13, fontWeight: '600' },
  endOpcaoRua: { fontSize: 12, marginTop: 1 },
  endOpcaoAdd: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    marginTop: 2,
  },
  endOpcaoAddTxt: { fontSize: 13, color: colors.orange, fontWeight: '600' },
  footer: { padding: 16, paddingBottom: 24, borderTopWidth: 1, gap: 10 },
  btnContinuar: {
    height: 46,
    borderRadius: 14,
    borderWidth: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  btnContinuarTxt: { color: colors.orange, fontSize: 14, fontWeight: '600' },
  btnFinalizar: {
    backgroundColor: colors.orange,
    height: 52,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    shadowColor: colors.orange,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 14,
    elevation: 4,
  },
  btnFinalizarTxt: { color: colors.n0, fontSize: 15, fontWeight: '700' },
  vazio: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 8 },
  vazioTitulo: { fontSize: 18, fontWeight: '700', marginTop: 12 },
  vazioTxt: { fontSize: 13, textAlign: 'center' },
  vazioBtn: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: colors.orange,
    borderRadius: 12,
  },
  vazioBtnTxt: { color: colors.n0, fontSize: 14, fontWeight: '700' },
});
