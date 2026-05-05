// src/features/consumer/vitrine-detail/ui/VitrineDetail.tsx
import { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { getLojaById, getProdutosByLoja } from '../../../../mock/mock-data';
import { colors } from '../../../../theme';
import { ProdutoCard } from './ProdutoCard';
import { useCartStore } from '../../../../store';

interface VitrineDetailProps {
  lojaId: string;
  dark?: boolean;
}

function Stars({ value }: { value: number }) {
  const stars = Array.from({ length: 5 }, (_, i) => i < Math.floor(value) ? '★' : '☆');
  return <Text style={{ color: colors.orange, fontSize: 12, letterSpacing: 1 }}>{stars.join('')}</Text>;
}

function BannerImg({ uri, nome }: { uri: string; nome: string }) {
  const [error, setError] = useState(false);
  if (error) {
    return <View style={[styles.banner, { backgroundColor: colors.orange100 }]} />;
  }
  return (
    <Image source={{ uri }} style={styles.banner} onError={() => setError(true)} />
  );
}

export function VitrineDetail({ lojaId, dark = false }: VitrineDetailProps) {
  const router = useRouter();
  const [catSelecionada, setCatSelecionada] = useState('Todos');

  const loja = getLojaById(lojaId);
  const produtos = loja ? getProdutosByLoja(loja.id) : [];

  const textColor = dark ? colors.n0 : colors.navy;
  const subColor  = dark ? 'rgba(255,255,255,0.6)' : colors.n600;
  const bgMain    = dark ? colors.bgDark : '#FAFBFE';
  const surface   = dark ? colors.surfDark : colors.n0;
  const border    = dark ? 'rgba(255,255,255,0.06)' : colors.n200;

  if (!loja) {
    return (
      <View style={[styles.container, { backgroundColor: bgMain, alignItems: 'center', justifyContent: 'center' }]}>
        <Text style={{ color: textColor, fontSize: 16 }}>Loja não encontrada.</Text>
        <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 12 }}>
          <Text style={{ color: colors.orange, fontWeight: '600' }}>Voltar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const cats = ['Todos', ...Array.from(new Set(produtos.map(p => p.categoria)))];
  const produtosFiltrados = catSelecionada === 'Todos'
    ? produtos
    : produtos.filter(p => p.categoria === catSelecionada);

  const adicionar = useCartStore(s => s.adicionar);

  const handleAddToCart = useCallback((produtoId: string) => {
    const produto = produtos.find(p => p.id === produtoId);
    if (produto) adicionar(produto);
  }, [produtos, adicionar]);

  return (
    <View style={[styles.container, { backgroundColor: bgMain }]}>
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Banner */}
        <View style={styles.bannerWrapper}>
          <BannerImg uri={loja.imagem} nome={loja.nome} />
          <View style={styles.bannerGradient} />
          <TouchableOpacity style={styles.btnBack} onPress={() => router.back()} activeOpacity={0.85}>
            <Text style={{ fontSize: 20, color: colors.navy, fontWeight: '600' }}>‹</Text>
          </TouchableOpacity>
        </View>

        {/* Card info da loja */}
        <View style={styles.infoCardWrapper}>
          <View style={[styles.infoCard, { backgroundColor: surface, borderColor: border }]}>
            <View style={styles.infoTop}>
              <Image source={{ uri: loja.imagem }} style={styles.avatar} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.lojaNome, { color: textColor }]}>{loja.nome}</Text>
                <Text style={[styles.lojaCategoria, { color: subColor }]}>
                  {loja.endereco.bairro} · {loja.endereco.cidade}
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6, gap: 4 }}>
                  <Stars value={loja.avaliacao} />
                  <Text style={{ fontSize: 12, fontWeight: '600', color: textColor }}> {loja.avaliacao}</Text>
                  <Text style={{ fontSize: 11, color: subColor }}>({loja.totalAvaliacoes})</Text>
                </View>
              </View>
            </View>

            {/* Badges */}
            <View style={styles.badgesRow}>
              <View style={[styles.badge, { backgroundColor: 'rgba(57,255,137,0.15)' }]}>
                <Text style={[styles.badgeText, { color: '#046C2E' }]}>
                  🛵 {loja.tempoEntregaMin}–{loja.tempoEntregaMax} min
                </Text>
              </View>
              <View style={[styles.badge, { backgroundColor: dark ? 'rgba(255,255,255,0.06)' : colors.n100 }]}>
                <Text style={[styles.badgeText, { color: textColor }]}>
                  {loja.taxaEntrega === 0 ? '🚚 Frete grátis' : `🚚 R$ ${loja.taxaEntrega.toFixed(2).replace('.', ',')}`}
                </Text>
              </View>
              {!loja.aberta && (
                <View style={[styles.badge, { backgroundColor: 'rgba(107,115,144,0.15)' }]}>
                  <Text style={[styles.badgeText, { color: colors.n600 }]}>Fechado agora</Text>
                </View>
              )}
            </View>

            {/* Botão Aju */}
            <TouchableOpacity
              style={styles.btnAju}
              onPress={() => router.push('/(consumer)/chat')}
              activeOpacity={0.85}
            >
              <Text style={styles.btnAjuText}>✨ Conversar com a Aju sobre essa loja</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Chips de categoria */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
          {cats.map(cat => {
            const ativo = cat === catSelecionada;
            return (
              <Pressable
                key={cat}
                onPress={() => setCatSelecionada(cat)}
                style={[styles.chip, {
                  backgroundColor: ativo ? colors.navy : (dark ? 'rgba(255,255,255,0.06)' : colors.n0),
                  borderColor: ativo ? colors.navy : border,
                }]}
              >
                <Text style={[styles.chipText, { color: ativo ? colors.n0 : textColor }]}>{cat}</Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Grid de produtos */}
        <View style={styles.grid}>
          {produtosFiltrados.map(p => (
            <View key={p.id} style={styles.gridItem}>
              <ProdutoCard produto={p} onAdd={handleAddToCart} dark={dark} />
            </View>
          ))}
          {produtosFiltrados.length === 0 && (
            <Text style={[styles.vazio, { color: subColor }]}>Nenhum produto nessa categoria.</Text>
          )}
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container:       { flex: 1 },
  bannerWrapper:   { height: 180, position: 'relative' },
  banner:          { width: '100%', height: 180 },
  bannerGradient:  { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                     backgroundColor: 'rgba(0,9,51,0.4)' },
  btnBack:         { position: 'absolute', top: 44, left: 14, width: 38, height: 38,
                     borderRadius: 19, backgroundColor: 'rgba(255,255,255,0.95)',
                     alignItems: 'center', justifyContent: 'center' },
  infoCardWrapper: { marginHorizontal: 16, marginTop: -40, zIndex: 1 },
  infoCard:        { borderRadius: 20, padding: 16, borderWidth: 1,
                     shadowColor: '#000933', shadowOffset: { width: 0, height: 8 },
                     shadowOpacity: 0.08, shadowRadius: 24, elevation: 4 },
  infoTop:         { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  avatar:          { width: 52, height: 52, borderRadius: 12 },
  lojaNome:        { fontWeight: '700', fontSize: 18, letterSpacing: -0.3, lineHeight: 22 },
  lojaCategoria:   { fontSize: 12, marginTop: 2 },
  badgesRow:       { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 14 },
  badge:           { paddingHorizontal: 8, paddingVertical: 5, borderRadius: 99 },
  badgeText:       { fontSize: 11.5, fontWeight: '600' },
  btnAju:          { marginTop: 14, paddingVertical: 10, borderRadius: 12,
                     alignItems: 'center', backgroundColor: colors.orange,
                     shadowColor: colors.orange, shadowOffset: { width: 0, height: 4 },
                     shadowOpacity: 0.3, shadowRadius: 14, elevation: 4 },
  btnAjuText:      { color: colors.n0, fontSize: 13.5, fontWeight: '600' },
  chips:           { paddingHorizontal: 16, paddingTop: 20, paddingBottom: 8, gap: 8 },
  chip:            { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 99, borderWidth: 1 },
  chipText:        { fontSize: 13, fontWeight: '600' },
  grid:            { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, gap: 12 },
  gridItem:        { width: '47%' },
  vazio:           { textAlign: 'center', marginTop: 40, fontSize: 14, width: '100%' },
});