import { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Animated,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useHardwareBack } from '../../../../hooks';
import { LojaService, ProdutoService, FavoritoLojaService } from '@ajulabs/api-client';
import { useVitrineRealtime } from '@ajulabs/realtime';
import { setPendingChatContext } from '../../chat/model/pendingChatContext';
import { Loja, Produto, HorarioFuncionamento } from '@ajulabs/types';
import { colors } from '@ajulabs/theme';
import { ProdutoCard } from './ProdutoCard';
import { useCartStore, useAuthStore } from '../../../../store';

const API_URL = (process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000').replace(/\/$/, '');

interface VitrineDetailProps {
  lojaId: string;
  dark?: boolean;
}

function Stars({ value }: { value: number }) {
  return (
    <View style={{ flexDirection: 'row', gap: 1 }}>
      {Array.from({ length: 5 }, (_, i) => (
        <Ionicons
          key={i}
          name={i < Math.floor(value) ? 'star' : 'star-outline'}
          size={12}
          color={colors.orange}
        />
      ))}
    </View>
  );
}

function BannerImg({ uri }: { uri: string }) {
  const [error, setError] = useState(false);
  if (error || !uri) {
    return <View style={[styles.banner, { backgroundColor: colors.orange100 }]} />;
  }
  return <Image source={{ uri }} style={styles.banner} onError={() => setError(true)} />;
}

export function VitrineDetail({ lojaId, dark = false }: VitrineDetailProps) {
  const router = useRouter();
  useHardwareBack(() => {
    router.back();
    return true;
  });
  const [catSelecionada, setCatSelecionada] = useState('Todos');
  const [loja, setLoja] = useState<Loja | null>(null);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);
  const [favoritado, setFavoritado] = useState(false);
  const cachearLoja = useCartStore((s) => s.cachearLoja);
  const adicionar = useCartStore((s) => s.adicionar);
  const token = useAuthStore((s) => s.token);
  const heartScale = useRef(new Animated.Value(1)).current;
  const [sobreAberto, setSobreAberto] = useState(true);
  const chevronRot = useRef(new Animated.Value(1)).current;

  const toggleSobre = useCallback(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    const novoEstado = !sobreAberto;
    setSobreAberto(novoEstado);
    Animated.timing(chevronRot, {
      toValue: novoEstado ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [sobreAberto, chevronRot]);

  const chevronRotStyle = {
    transform: [
      {
        rotate: chevronRot.interpolate({ inputRange: [0, 1], outputRange: ['180deg', '0deg'] }),
      },
    ],
  };

  useEffect(() => {
    setLoading(true);
    setLoja(null);
    setProdutos([]);
    setCatSelecionada('Todos');

    Promise.all([
      LojaService.buscarPorId(lojaId),
      ProdutoService.listarPorLoja(lojaId).catch(() => [] as Produto[]),
      token ? FavoritoLojaService.checar(lojaId, token) : Promise.resolve(false),
    ])
      .then(([l, p, fav]) => {
        if (l) {
          setLoja(l);
          cachearLoja(l);
        }
        setProdutos(p);
        setFavoritado(fav as boolean);
      })
      .finally(() => setLoading(false));
  }, [lojaId]);

  // Recarrega o catálogo quando o lojista cria/edita/remove um produto desta loja,
  // sem o consumidor precisar sair e voltar na vitrine.
  const recarregarProdutos = useCallback(() => {
    ProdutoService.listarPorLoja(lojaId)
      .then((p) => setProdutos(p))
      .catch(() => {});
  }, [lojaId]);

  useVitrineRealtime({
    apiUrl: API_URL,
    lojaId,
    enabled: !!lojaId,
    onAtualizada: recarregarProdutos,
  });

  const handleFavorito = useCallback(async () => {
    if (!token) {
      router.push('/(auth)/login');
      return;
    }
    const novo = !favoritado;
    setFavoritado(novo);
    Animated.sequence([
      Animated.timing(heartScale, { toValue: 1.4, duration: 120, useNativeDriver: true }),
      Animated.spring(heartScale, { toValue: 1, useNativeDriver: true, speed: 20, bounciness: 8 }),
    ]).start();
    if (novo) await FavoritoLojaService.favoritar(lojaId, token);
    else await FavoritoLojaService.desfavoritar(lojaId, token);
  }, [favoritado, token, lojaId]);

  const handleAddToCart = useCallback(
    (produtoId: string) => {
      const produto = produtos.find((p) => p.id === produtoId);
      if (!produto) return;
      if ((produto.variacoes?.length ?? 0) > 0) return; // variação obrigatória: ProdutoCard já redireciona para PDP
      adicionar(produto);
    },
    [produtos, adicionar],
  );

  const textColor = dark ? colors.n0 : colors.navy;
  const subColor = dark ? 'rgba(255,255,255,0.6)' : colors.n600;
  const bgMain = dark ? colors.bgDark : '#FAFBFE';
  const surface = dark ? colors.surfDark : colors.n0;
  const border = dark ? 'rgba(255,255,255,0.06)' : colors.n200;

  if (loading) {
    return (
      <View
        style={[
          styles.container,
          { backgroundColor: bgMain, alignItems: 'center', justifyContent: 'center' },
        ]}
      >
        <ActivityIndicator size="large" color={colors.orange} />
      </View>
    );
  }

  if (!loja) {
    return (
      <View
        style={[
          styles.container,
          { backgroundColor: bgMain, alignItems: 'center', justifyContent: 'center' },
        ]}
      >
        <Text style={{ color: textColor, fontSize: 16 }}>Loja não encontrada.</Text>
        <TouchableOpacity
          onPress={() => router.push('/(consumer)/vitrines')}
          style={{ marginTop: 12 }}
        >
          <Text style={{ color: colors.orange, fontWeight: '600' }}>Voltar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Horário de hoje: lojista usa 0=Seg...6=Dom; JS getDay() usa 0=Dom...6=Sáb
  const lojistaIdx = (new Date().getDay() + 6) % 7;
  const hojeHorario: HorarioFuncionamento | undefined = loja.horarios?.find(
    (h) => h.diaSemana === lojistaIdx,
  );

  const cats = ['Todos', ...Array.from(new Set(produtos.map((p) => p.categoria)))];
  const produtosFiltrados =
    catSelecionada === 'Todos' ? produtos : produtos.filter((p) => p.categoria === catSelecionada);

  return (
    <View style={[styles.container, { backgroundColor: bgMain }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.bannerWrapper}>
          <BannerImg uri={loja.imagem} />
          <View style={styles.bannerGradient} />
          <TouchableOpacity
            style={styles.btnBack}
            onPress={() => router.push('/(consumer)/vitrines')}
            activeOpacity={0.85}
          >
            <Ionicons name="chevron-back" size={20} color={colors.navy} />
          </TouchableOpacity>
          <Animated.View style={[styles.btnHeart, { transform: [{ scale: heartScale }] }]}>
            <TouchableOpacity onPress={handleFavorito} activeOpacity={0.85}>
              <Ionicons
                name={favoritado ? 'heart' : 'heart-outline'}
                size={20}
                color={favoritado ? colors.orange : colors.navy}
              />
            </TouchableOpacity>
          </Animated.View>
        </View>

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
                  <Text style={{ fontSize: 12, fontWeight: '600', color: textColor }}>
                    {' '}
                    {loja.avaliacao}
                  </Text>
                  <Text style={{ fontSize: 11, color: subColor }}>({loja.totalAvaliacoes})</Text>
                </View>
              </View>
            </View>

            <View style={styles.badgesRow}>
              <View style={[styles.badge, { backgroundColor: 'rgba(57,255,137,0.15)' }]}>
                <Ionicons name="time-outline" size={12} color="#046C2E" />
                <Text style={[styles.badgeText, { color: '#046C2E' }]}>
                  {loja.tempoEntregaMin}–{loja.tempoEntregaMax} min
                </Text>
              </View>
              <View
                style={[
                  styles.badge,
                  { backgroundColor: dark ? 'rgba(255,255,255,0.06)' : colors.n100 },
                ]}
              >
                <Ionicons name="cube-outline" size={12} color={textColor} />
                <Text style={[styles.badgeText, { color: textColor }]}>
                  {loja.taxaEntrega === 0
                    ? 'Frete grátis'
                    : `R$ ${loja.taxaEntrega.toFixed(2).replace('.', ',')}`}
                </Text>
              </View>
              {!loja.aberta && (
                <View style={[styles.badge, { backgroundColor: 'rgba(107,115,144,0.15)' }]}>
                  <Text style={[styles.badgeText, { color: colors.n600 }]}>Fechado agora</Text>
                </View>
              )}
            </View>

            <TouchableOpacity
              style={styles.btnAju}
              onPress={() => {
                setPendingChatContext({ id: loja.id, nome: loja.nome });
                router.push('/(consumer)/chat');
              }}
              activeOpacity={0.85}
            >
              <Ionicons name="chatbubble-ellipses-outline" size={14} color={colors.n0} />
              <Text style={styles.btnAjuText}>Conversar com a Aju sobre essa loja</Text>
            </TouchableOpacity>
          </View>
        </View>

        {(() => {
          const temInfo = !!(loja.descricao || loja.endereco?.rua || hojeHorario || loja.telefone);
          return (
            <View style={[styles.sobreSection, { backgroundColor: surface, borderColor: border }]}>
              <TouchableOpacity
                style={styles.sobreHeader}
                onPress={temInfo ? toggleSobre : undefined}
                activeOpacity={temInfo ? 0.7 : 1}
              >
                <Text style={[styles.sobreTitulo, { color: textColor }]}>Sobre a Loja</Text>
                {temInfo && (
                  <Animated.View style={chevronRotStyle}>
                    <Ionicons name="chevron-up" size={16} color={subColor} />
                  </Animated.View>
                )}
              </TouchableOpacity>

              {!temInfo ? (
                <Text style={[styles.sobreVazio, { color: subColor }]}>
                  Esta loja ainda não adicionou informações.
                </Text>
              ) : (
                sobreAberto && (
                  <>
                    {!!loja.descricao && (
                      <Text style={[styles.sobreDescricao, { color: subColor }]}>
                        {loja.descricao}
                      </Text>
                    )}

                    {(loja.endereco?.rua || hojeHorario || loja.telefone) && (
                      <View style={[styles.sobreDivider, { backgroundColor: border }]} />
                    )}

                    {!!loja.endereco?.rua && (
                      <View style={styles.sobreItem}>
                        <View
                          style={[
                            styles.sobreIconBox,
                            { backgroundColor: dark ? 'rgba(255,255,255,0.06)' : colors.n100 },
                          ]}
                        >
                          <Ionicons name="location-outline" size={15} color={colors.orange} />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.sobreItemLabel, { color: subColor }]}>Endereço</Text>
                          <Text style={[styles.sobreItemValue, { color: textColor }]}>
                            {loja.endereco.rua}
                            {loja.endereco.numero ? `, ${loja.endereco.numero}` : ''}
                          </Text>
                          <Text style={[styles.sobreItemSub, { color: subColor }]}>
                            {loja.endereco.bairro} · {loja.endereco.cidade}
                          </Text>
                        </View>
                      </View>
                    )}

                    {hojeHorario && (
                      <View style={styles.sobreItem}>
                        <View
                          style={[
                            styles.sobreIconBox,
                            { backgroundColor: dark ? 'rgba(255,255,255,0.06)' : colors.n100 },
                          ]}
                        >
                          <Ionicons name="time-outline" size={15} color={colors.orange} />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.sobreItemLabel, { color: subColor }]}>
                            Horário de hoje
                          </Text>
                          <Text style={[styles.sobreItemValue, { color: textColor }]}>
                            {hojeHorario.ativo
                              ? `${hojeHorario.abertura} – ${hojeHorario.fechamento}`
                              : 'Fechado hoje'}
                          </Text>
                        </View>
                        {hojeHorario.ativo && (
                          <View
                            style={[
                              styles.sobreStatusChip,
                              { backgroundColor: 'rgba(57,255,137,0.15)' },
                            ]}
                          >
                            <Text style={[styles.sobreStatusText, { color: '#046C2E' }]}>
                              Aberta
                            </Text>
                          </View>
                        )}
                      </View>
                    )}

                    {!!loja.telefone && (
                      <View style={styles.sobreItem}>
                        <View
                          style={[
                            styles.sobreIconBox,
                            { backgroundColor: dark ? 'rgba(255,255,255,0.06)' : colors.n100 },
                          ]}
                        >
                          <Ionicons name="call-outline" size={15} color={colors.orange} />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.sobreItemLabel, { color: subColor }]}>Telefone</Text>
                          <Text style={[styles.sobreItemValue, { color: textColor }]}>
                            {loja.telefone}
                          </Text>
                        </View>
                      </View>
                    )}
                  </>
                )
              )}
            </View>
          );
        })()}

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chips}
        >
          {cats.map((cat) => {
            const ativo = cat === catSelecionada;
            return (
              <Pressable
                key={cat}
                onPress={() => setCatSelecionada(cat)}
                style={[
                  styles.chip,
                  {
                    backgroundColor: ativo
                      ? colors.navy
                      : dark
                        ? 'rgba(255,255,255,0.06)'
                        : colors.n0,
                    borderColor: ativo ? colors.navy : border,
                  },
                ]}
              >
                <Text style={[styles.chipText, { color: ativo ? colors.n0 : textColor }]}>
                  {cat}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <View style={styles.grid}>
          {produtosFiltrados.map((p) => (
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
  container: { flex: 1 },
  bannerWrapper: { height: 180, position: 'relative' },
  banner: { width: '100%', height: 180 },
  bannerGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,9,51,0.4)',
  },
  btnBack: {
    position: 'absolute',
    top: 44,
    left: 14,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.95)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnHeart: {
    position: 'absolute',
    top: 44,
    right: 14,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.95)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoCardWrapper: { marginHorizontal: 16, marginTop: -40, zIndex: 1 },
  infoCard: {
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    shadowColor: '#000933',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 4,
  },
  infoTop: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  avatar: { width: 52, height: 52, borderRadius: 12 },
  lojaNome: { fontWeight: '700', fontSize: 18, letterSpacing: -0.3, lineHeight: 22 },
  lojaCategoria: { fontSize: 12, marginTop: 2 },
  badgesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 14 },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 99,
  },
  badgeText: { fontSize: 11.5, fontWeight: '600' },
  sobreSection: {
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
  },
  sobreHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  sobreTitulo: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  sobreDescricao: {
    fontSize: 13.5,
    lineHeight: 20,
    marginBottom: 4,
  },
  sobreDivider: {
    height: 1,
    marginVertical: 12,
  },
  sobreItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingVertical: 6,
  },
  sobreIconBox: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sobreItemLabel: { fontSize: 11, marginBottom: 2 },
  sobreItemValue: { fontSize: 13.5, fontWeight: '600' },
  sobreItemSub: { fontSize: 12, marginTop: 1 },
  sobreStatusChip: {
    alignSelf: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 99,
  },
  sobreStatusText: { fontSize: 11, fontWeight: '700' },
  sobreVazio: { fontSize: 13, fontStyle: 'italic' },
  btnAju: {
    marginTop: 14,
    paddingVertical: 10,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.orange,
    shadowColor: colors.orange,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 14,
    elevation: 4,
  },
  btnAjuText: { color: colors.n0, fontSize: 13.5, fontWeight: '600' },
  chips: { paddingHorizontal: 16, paddingTop: 20, paddingBottom: 8, gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 99, borderWidth: 1 },
  chipText: { fontSize: 13, fontWeight: '600' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, gap: 12 },
  gridItem: { width: '47%' },
  vazio: { textAlign: 'center', marginTop: 40, fontSize: 14, width: '100%' },
});
