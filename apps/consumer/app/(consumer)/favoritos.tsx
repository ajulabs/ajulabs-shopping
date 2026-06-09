import { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@ajulabs/theme';
import { Produto, Loja } from '@ajulabs/types';
import { FavoritoService, FavoritoLojaService } from '@ajulabs/api-client';
import { useTheme, useSmartBack } from '../../src/hooks';
import { useAuthStore } from '../../src/store';
import { useCartStore } from '../../src/store';

type Aba = 'produtos' | 'lojas';

// ─── Card de produto favorito ─────────────────────────────────

function ProdutoFavoritoCard({
  produto,
  onRemove,
}: {
  produto: Produto;
  onRemove: (id: string) => void;
}) {
  const router = useRouter();
  const goBack = useSmartBack('/(consumer)/perfil');
  const token = useAuthStore((s) => s.token);
  const adicionar = useCartStore((s) => s.adicionar);
  const { surf, borderL, text, textSec } = useTheme();
  const [imgError, setImgError] = useState(false);

  const handleDesfavoritar = async () => {
    if (!token) return;
    onRemove(produto.id);
    await FavoritoService.desfavoritar(produto.id, token);
  };

  return (
    <TouchableOpacity
      style={[styles.prodCard, { backgroundColor: surf, borderColor: borderL }]}
      onPress={() => router.push(`/(consumer)/produto/${produto.id}` as any)}
      activeOpacity={0.9}
    >
      {imgError || !produto.imagem ? (
        <View style={styles.prodImgFallback}>
          <Text style={styles.prodImgFallbackTxt}>{produto.nome.charAt(0)}</Text>
        </View>
      ) : (
        <Image
          source={{ uri: produto.imagem }}
          style={styles.prodImg}
          resizeMode="cover"
          onError={() => setImgError(true)}
        />
      )}
      <View style={styles.prodInfo}>
        <Text style={[styles.prodNome, { color: text }]} numberOfLines={2}>
          {produto.nome}
        </Text>
        <Text style={[styles.prodCategoria, { color: textSec as string }]} numberOfLines={1}>
          {produto.categoria}
        </Text>
        <Text style={[styles.prodPreco, { color: text }]}>
          R$ {produto.preco.toFixed(2).replace('.', ',')}
        </Text>
        <TouchableOpacity
          style={[styles.btnAdd, !produto.disponivel && { opacity: 0.4 }]}
          onPress={() => {
            adicionar(produto);
            router.push('/(consumer)/carrinho');
          }}
          disabled={!produto.disponivel}
          activeOpacity={0.8}
        >
          <Ionicons name="cart-outline" size={13} color={colors.orange600} />
          <Text style={styles.btnAddTxt}>{produto.disponivel ? 'Adicionar' : 'Indisponível'}</Text>
        </TouchableOpacity>
      </View>
      <TouchableOpacity style={styles.heartBtn} onPress={handleDesfavoritar} hitSlop={8}>
        <Ionicons name="heart" size={20} color={colors.orange} />
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

// ─── Card de loja favorita ────────────────────────────────────

function LojaFavoritoCard({ loja, onRemove }: { loja: Loja; onRemove: (id: string) => void }) {
  const router = useRouter();
  const token = useAuthStore((s) => s.token);
  const { surf, borderL, text, textSec } = useTheme();
  const [imgError, setImgError] = useState(false);

  const handleDesfavoritar = async () => {
    if (!token) return;
    onRemove(loja.id);
    await FavoritoLojaService.desfavoritar(loja.id, token);
  };

  return (
    <TouchableOpacity
      style={[styles.lojaCard, { backgroundColor: surf, borderColor: borderL }]}
      onPress={() => router.push(`/(consumer)/vitrine/${loja.id}` as any)}
      activeOpacity={0.9}
    >
      {/* Logo */}
      <View style={styles.lojaLogoWrap}>
        {imgError || !loja.logo ? (
          <View style={styles.lojaLogoFallback}>
            <Text style={styles.lojaLogoFallbackTxt}>{loja.nome.charAt(0)}</Text>
          </View>
        ) : (
          <Image
            source={{ uri: loja.logo }}
            style={styles.lojaLogo}
            resizeMode="cover"
            onError={() => setImgError(true)}
          />
        )}
      </View>

      {/* Info */}
      <View style={styles.lojaInfo}>
        <Text style={[styles.lojaNome, { color: text }]} numberOfLines={1}>
          {loja.nome}
        </Text>
        <Text style={[styles.lojaEndereco, { color: textSec as string }]} numberOfLines={1}>
          {loja.endereco.bairro} · {loja.endereco.cidade}
        </Text>

        <View style={styles.lojaBadgesRow}>
          <View style={[styles.lojaBadge, { backgroundColor: 'rgba(57,255,137,0.12)' }]}>
            <Ionicons name="time-outline" size={10} color="#046C2E" />
            <Text style={[styles.lojaBadgeTxt, { color: '#046C2E' }]}>
              {loja.tempoEntregaMin}–{loja.tempoEntregaMax} min
            </Text>
          </View>
          <View style={[styles.lojaBadge, { backgroundColor: colors.orange100 }]}>
            <Ionicons name="cube-outline" size={10} color={colors.orange600} />
            <Text style={[styles.lojaBadgeTxt, { color: colors.orange600 }]}>
              {loja.taxaEntrega === 0
                ? 'Frete grátis'
                : `R$ ${loja.taxaEntrega.toFixed(2).replace('.', ',')}`}
            </Text>
          </View>
        </View>

        <View style={styles.lojaRatingRow}>
          {Array.from({ length: 5 }, (_, i) => (
            <Ionicons
              key={i}
              name={i < Math.floor(loja.avaliacao) ? 'star' : 'star-outline'}
              size={11}
              color={colors.orange}
            />
          ))}
          <Text style={[styles.lojaRatingTxt, { color: textSec as string }]}>
            ({loja.totalAvaliacoes})
          </Text>
        </View>
      </View>

      {/* Coração */}
      <TouchableOpacity style={styles.heartBtn} onPress={handleDesfavoritar} hitSlop={8}>
        <Ionicons name="heart" size={20} color={colors.orange} />
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

// ─── Tela principal ───────────────────────────────────────────

export default function FavoritosScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const token = useAuthStore((s) => s.token);
  const [aba, setAba] = useState<Aba>('produtos');
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [lojas, setLojas] = useState<Loja[]>([]);
  const [loadingProd, setLoadingProd] = useState(false);
  const [loadingLojas, setLoadingLojas] = useState(false);
  const { isDark, bg, surf, borderL, text, textSec, backBtn } = useTheme();
  const textMuted = isDark ? 'rgba(255,255,255,0.3)' : colors.n300;

  useFocusEffect(
    useCallback(() => {
      if (!token) return;
      setLoadingProd(true);
      setLoadingLojas(true);
      FavoritoService.listar(token)
        .then(setProdutos)
        .finally(() => setLoadingProd(false));
      FavoritoLojaService.listar(token)
        .then(setLojas)
        .finally(() => setLoadingLojas(false));
    }, [token]),
  );

  const handleRemoveProduto = (id: string) =>
    setProdutos((prev) => prev.filter((p) => p.id !== id));
  const handleRemoveLoja = (id: string) => setLojas((prev) => prev.filter((l) => l.id !== id));

  const tabLabel = (t: Aba) => {
    if (t === 'produtos') return `Produtos${produtos.length ? ` (${produtos.length})` : ''}`;
    return `Lojas${lojas.length ? ` (${lojas.length})` : ''}`;
  };

  // ── Estado vazio reutilizável
  const Vazio = ({ mensagem, sub }: { mensagem: string; sub: string }) => (
    <View style={styles.vazio}>
      <Ionicons name="heart-outline" size={56} color={textMuted as string} />
      <Text style={[styles.vazioTitulo, { color: text }]}>{mensagem}</Text>
      <Text style={[styles.vazioTxt, { color: textSec as string }]}>{sub}</Text>
      <TouchableOpacity
        style={styles.btnExplorar}
        onPress={() => router.push('/(consumer)/vitrines')}
        activeOpacity={0.85}
      >
        <Text style={styles.btnExplorarTxt}>Explorar vitrines</Text>
      </TouchableOpacity>
    </View>
  );

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
          onPress={() => goBack()}
          style={[styles.btnBack, { backgroundColor: backBtn }]}
        >
          <Ionicons name="chevron-back" size={20} color={text} />
        </TouchableOpacity>
        <Text style={[styles.titulo, { color: text }]}>Favoritos</Text>
      </View>

      {/* Tabs */}
      <View style={[styles.tabs, { backgroundColor: surf, borderBottomColor: borderL }]}>
        {(['produtos', 'lojas'] as Aba[]).map((t) => (
          <TouchableOpacity
            key={t}
            style={[styles.tab, aba === t && styles.tabActive]}
            onPress={() => setAba(t)}
            activeOpacity={0.75}
          >
            <Text
              style={[styles.tabTxt, { color: aba === t ? colors.orange : (textSec as string) }]}
            >
              {tabLabel(t)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ── Aba Produtos */}
      {aba === 'produtos' &&
        (!token ? (
          <Vazio
            mensagem="Faça login para ver favoritos"
            sub="Entre na sua conta para salvar produtos"
          />
        ) : loadingProd ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={colors.orange} />
          </View>
        ) : produtos.length === 0 ? (
          <Vazio
            mensagem="Nenhum produto favoritado"
            sub="Toque no coração de um produto para salvar aqui"
          />
        ) : (
          <FlatList
            data={produtos}
            keyExtractor={(p) => p.id}
            renderItem={({ item }) => (
              <ProdutoFavoritoCard produto={item} onRemove={handleRemoveProduto} />
            )}
            contentContainerStyle={{ padding: 16, gap: 12 }}
            showsVerticalScrollIndicator={false}
          />
        ))}

      {/* ── Aba Lojas */}
      {aba === 'lojas' &&
        (!token ? (
          <Vazio
            mensagem="Faça login para ver favoritos"
            sub="Entre na sua conta para salvar lojas"
          />
        ) : loadingLojas ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={colors.orange} />
          </View>
        ) : lojas.length === 0 ? (
          <Vazio
            mensagem="Nenhuma loja favoritada"
            sub="Toque no coração de uma loja para salvar aqui"
          />
        ) : (
          <FlatList
            data={lojas}
            keyExtractor={(l) => l.id}
            renderItem={({ item }) => <LojaFavoritoCard loja={item} onRemove={handleRemoveLoja} />}
            contentContainerStyle={{ padding: 16, gap: 12 }}
            showsVerticalScrollIndicator={false}
          />
        ))}
    </View>
  );
}

// ─── Estilos ──────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
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
  titulo: { fontSize: 20, fontWeight: '700' },
  tabs: { flexDirection: 'row', borderBottomWidth: 1 },
  tab: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: { borderBottomColor: colors.orange },
  tabTxt: { fontSize: 14, fontWeight: '600' },
  vazio: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 10 },
  vazioTitulo: { fontSize: 18, fontWeight: '700', marginTop: 8 },
  vazioTxt: { fontSize: 13, textAlign: 'center', lineHeight: 20 },
  btnExplorar: {
    marginTop: 12,
    paddingHorizontal: 28,
    paddingVertical: 13,
    backgroundColor: colors.orange,
    borderRadius: 14,
  },
  btnExplorarTxt: { color: colors.n0, fontSize: 14, fontWeight: '700' },
  heartBtn: { padding: 12, alignSelf: 'flex-start' },

  // Produto
  prodCard: { flexDirection: 'row', borderRadius: 14, borderWidth: 1, overflow: 'hidden' },
  prodImg: { width: 100, aspectRatio: 1 },
  prodImgFallback: {
    width: 100,
    aspectRatio: 1,
    backgroundColor: colors.orange100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  prodImgFallbackTxt: { fontSize: 32, fontWeight: '700', color: colors.orange600 },
  prodInfo: { flex: 1, padding: 12, justifyContent: 'space-between' },
  prodNome: { fontSize: 13, fontWeight: '600', lineHeight: 18 },
  prodCategoria: { fontSize: 11, marginTop: 2 },
  prodPreco: { fontSize: 15, fontWeight: '800', marginTop: 4 },
  btnAdd: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.orange100,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  btnAddTxt: { fontSize: 11.5, fontWeight: '600', color: colors.orange600 },

  // Loja
  lojaCard: {
    flexDirection: 'row',
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    gap: 12,
    alignItems: 'flex-start',
  },
  lojaLogoWrap: {
    width: 56,
    height: 56,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: colors.orange100,
  },
  lojaLogo: { width: 56, height: 56 },
  lojaLogoFallback: { width: 56, height: 56, alignItems: 'center', justifyContent: 'center' },
  lojaLogoFallbackTxt: { fontSize: 22, fontWeight: '700', color: colors.orange600 },
  lojaInfo: { flex: 1, gap: 4 },
  lojaNome: { fontSize: 14, fontWeight: '700' },
  lojaEndereco: { fontSize: 11.5 },
  lojaBadgesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 },
  lojaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 99,
  },
  lojaBadgeTxt: { fontSize: 10.5, fontWeight: '600' },
  lojaRatingRow: { flexDirection: 'row', alignItems: 'center', gap: 2, marginTop: 2 },
  lojaRatingTxt: { fontSize: 11, marginLeft: 2 },
});
