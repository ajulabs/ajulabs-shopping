import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  SafeAreaView,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Loja, ItemCarrinho } from '../../../../types';
import { LOJAS } from '../../../../mock/mock-data';
import { useCarrinhoStore, GrupoLoja } from '../useCarrinhoStore';

export function CarrinhoScreen() {
  const router = useRouter();
  const { grupos, incrementar, decrementar, totalItens, totalFrete, totalGeral } =
    useCarrinhoStore();

  const qtdTotal = totalItens();
  const qtdLojas = grupos.length;
  const frete = totalFrete();
  const total = totalGeral();
  const subtotal = total - frete;

  const fmt = (v: number) =>
    v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  if (qtdTotal === 0) {
    return (
      <SafeAreaView style={s.safeArea}>
        <View style={s.header}>
          <TouchableOpacity
            style={s.backButton}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <Text style={s.backIcon}>‹</Text>
          </TouchableOpacity>
          <Text style={s.headerTitle}>Carrinho</Text>
        </View>
        <View style={s.emptyContainer}>
          <View style={s.emptyIconCircle}>
            <Text style={s.emptyIconText}>🛍️</Text>
          </View>
          <Text style={s.emptyTitle}>Seu carrinho tá vazio</Text>
          <Text style={s.emptySubtitle}>
            Peça pra Aju te ajudar a achar o que tá procurando.
          </Text>
          <TouchableOpacity
            style={s.btnAju}
            onPress={() => router.push('/(consumer)/chat')}
            activeOpacity={0.85}
          >
            <Text style={s.btnAjuText}>✦  Falar com a Aju</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.safeArea}>
      <View style={s.header}>
        <TouchableOpacity
          style={s.backButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Text style={s.backIcon}>‹</Text>
        </TouchableOpacity>
        <View>
          <Text style={s.headerTitle}>Carrinho</Text>
          <Text style={s.headerSubtitle}>
            {qtdTotal} {qtdTotal === 1 ? 'item' : 'itens'} · {qtdLojas}{' '}
            {qtdLojas === 1 ? 'loja' : 'lojas'}
          </Text>
        </View>
      </View>

      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {qtdLojas > 1 && (
          <View style={s.bannerMultiLoja}>
            <Ionicons
              name="sparkles"
              size={14}
              color="#F2760F"
              style={{ marginTop: 1 }}
            />
            <Text style={s.bannerTexto}>
              <Text style={s.bannerBold}>Compra em {qtdLojas} lojas</Text>
              {
                ' — cada loja tem seu frete e motoboy próprio, mas você paga tudo de uma vez.'
              }
            </Text>
          </View>
        )}

        {grupos.map((grupo: GrupoLoja, idx: number) => {
          const loja: Loja | undefined = LOJAS.find(
            (l: Loja) => l.id === grupo.lojaId
          );
          const subtotalLoja = grupo.itens.reduce(
            (acc: number, i: ItemCarrinho) =>
              acc + i.produto.preco * i.quantidade,
            0
          );
          return (
            <View key={grupo.lojaId} style={s.lojaCard}>
              <View style={s.lojaHeader}>
                <View style={s.lojaBadge}>
                  <Text style={s.lojaBadgeText}>{idx + 1}</Text>
                </View>
                <View style={s.lojaInfo}>
                  <Text style={s.lojaNome}>{loja?.nome ?? 'Loja'}</Text>
                  <Text style={s.lojaDetalhe}>
                    🕐 {loja?.tempoEntregaMin}–{loja?.tempoEntregaMax} min · Frete{' '}
                    {(loja?.taxaEntrega ?? 0) === 0
                      ? 'grátis'
                      : fmt(loja?.taxaEntrega ?? 0)}
                  </Text>
                </View>
              </View>
              <View style={s.divider} />
              {grupo.itens.map((item: ItemCarrinho, index: number) => (
                <View key={item.produto.id}>
                  <View style={s.itemRow}>
                    <Image
                      source={{ uri: item.produto.imagem }}
                      style={s.itemImage}
                      resizeMode="cover"
                    />
                    <View style={s.itemInfo}>
                      <Text style={s.itemNome}>{item.produto.nome}</Text>
                      <Text style={s.itemVariante}>Padrão</Text>
                      <Text style={s.itemPreco}>{fmt(item.produto.preco)}</Text>
                    </View>
                    <View style={s.qtdContainer}>
                      <TouchableOpacity
                        style={s.qtdBtnRemove}
                        onPress={() =>
                          decrementar(item.produto.id, grupo.lojaId)
                        }
                        activeOpacity={0.8}
                      >
                        <Text style={s.qtdBtnRemoveText}>✕</Text>
                      </TouchableOpacity>
                      <Text style={s.qtdNumero}>{item.quantidade}</Text>
                      <TouchableOpacity
                        style={s.qtdBtnAdd}
                        onPress={() =>
                          incrementar(item.produto.id, grupo.lojaId)
                        }
                        activeOpacity={0.8}
                      >
                        <Text style={s.qtdBtnAddText}>+</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                  {index < grupo.itens.length - 1 && (
                    <View style={s.itemDivider} />
                  )}
                </View>
              ))}
              <View style={s.divider} />
              <View style={s.subtotalLoja}>
                <Text style={s.subtotalLabel}>Subtotal da loja</Text>
                <Text style={s.subtotalValue}>{fmt(subtotalLoja)}</Text>
              </View>
            </View>
          );
        })}
      </ScrollView>

      <View style={s.footer}>
        <View style={s.footerRow}>
          <Text style={s.footerLabel}>Subtotal</Text>
          <Text style={s.footerValue}>{fmt(subtotal)}</Text>
        </View>
        <View style={s.footerRow}>
          <Text style={s.footerLabel}>
            Frete ({qtdLojas} {qtdLojas === 1 ? 'loja' : 'lojas'})
          </Text>
          <Text style={s.footerValue}>{frete === 0 ? 'Grátis' : fmt(frete)}</Text>
        </View>
        <View style={s.footerTotalRow}>
          <Text style={s.footerTotalLabel}>Total</Text>
          <Text style={s.footerTotalValue}>{fmt(total)}</Text>
        </View>
        <TouchableOpacity
          style={s.btnFinalizar}
          activeOpacity={0.85}
          onPress={() => router.push('/(consumer)/checkout')}
        >
          <Text style={s.btnFinalizarText}>Finalizar pedido  ›</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const O = '#F2760F',
  N = '#000933',
  M = '#2A3156',
  MU = '#9099B3',
  BG = '#F6F7FB',
  W = '#FFFFFF',
  B = '#EDEEF2';

const s = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: BG },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    backgroundColor: W,
    borderBottomWidth: 1,
    borderBottomColor: B,
    gap: 10,
  },
  backButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: B,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: { fontSize: 22, color: M, lineHeight: 24, marginTop: -2 },
  headerTitle: { fontSize: 17, fontWeight: '700', color: M },
  headerSubtitle: { fontSize: 12, color: MU, marginTop: 1 },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 8, gap: 12 },
  bannerMultiLoja: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#FEF0E3',
    borderRadius: 12,
    padding: 12,
  },
  bannerTexto: { flex: 1, fontSize: 12, color: MU, lineHeight: 18 },
  bannerBold: { fontWeight: '700', color: M },
  lojaCard: {
    backgroundColor: W,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  lojaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 10,
  },
  lojaBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: O,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lojaBadgeText: { color: W, fontSize: 13, fontWeight: '700' },
  lojaInfo: { flex: 1 },
  lojaNome: { fontSize: 14, fontWeight: '700', color: M },
  lojaDetalhe: { fontSize: 12, color: MU, marginTop: 2 },
  divider: { height: 1, backgroundColor: B, marginHorizontal: 14 },
  itemRow: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
  itemImage: { width: 72, height: 72, borderRadius: 10, backgroundColor: BG },
  itemInfo: { flex: 1 },
  itemNome: { fontSize: 14, fontWeight: '600', color: M, marginBottom: 2 },
  itemVariante: { fontSize: 12, color: MU, marginBottom: 6 },
  itemPreco: { fontSize: 15, fontWeight: '700', color: M },
  itemDivider: { height: 1, backgroundColor: B, marginHorizontal: 14 },
  qtdContainer: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  qtdBtnRemove: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: BG,
    borderWidth: 1,
    borderColor: B,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtdBtnRemoveText: { fontSize: 10, color: MU, fontWeight: '600' },
  qtdNumero: {
    fontSize: 15,
    fontWeight: '700',
    color: M,
    minWidth: 18,
    textAlign: 'center',
  },
  qtdBtnAdd: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: O,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtdBtnAddText: { fontSize: 18, color: W, fontWeight: '600', lineHeight: 22 },
  subtotalLoja: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  subtotalLabel: { fontSize: 13, color: MU },
  subtotalValue: { fontSize: 13, fontWeight: '600', color: M },
  footer: {
    backgroundColor: W,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 24,
    borderTopWidth: 1,
    borderTopColor: B,
    gap: 4,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  footerLabel: { fontSize: 13, color: MU },
  footerValue: { fontSize: 13, color: M },
  footerTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
    marginBottom: 14,
  },
  footerTotalLabel: { fontSize: 16, fontWeight: '700', color: M },
  footerTotalValue: { fontSize: 20, fontWeight: '800', color: N },
  btnFinalizar: {
    backgroundColor: O,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnFinalizarText: {
    color: W,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  emptyIconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#FEF0E3',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyIconText: { fontSize: 40 },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: M,
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 13,
    color: MU,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 220,
    marginBottom: 24,
  },
  btnAju: {
    backgroundColor: O,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnAjuText: {
    color: W,
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});
