import { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  ScrollView,
  Animated,
  ActivityIndicator,
  Dimensions,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Produto, AvaliacaoLoja, VariacaoProduto } from '@ajulabs/types';
import { ProdutoService, AvaliacaoService, FavoritoService } from '@ajulabs/api-client';
import { colors } from '@ajulabs/theme';
import { useCartStore, useAuthStore } from '../../../../store';
import { useTheme } from '../../../../hooks';

const { width: SCREEN_W } = Dimensions.get('window');

// ─── Helpers de variação ──────────────────────────────────────

interface Eixo {
  label: string;
  valores: string[];
}

const TAMANHOS_SET = new Set(['PP', 'P', 'M', 'G', 'GG', 'GGG', 'XS', 'S', 'L', 'XL', 'XXL']);
const CORES_SET = new Set([
  'Preto',
  'Branco',
  'Azul',
  'Vermelho',
  'Verde',
  'Rosa',
  'Amarelo',
  'Cinza',
  'Marrom',
  'Roxo',
  'Laranja',
  'Bege',
  'Nude',
  'Prata',
  'Dourado',
  'Marinho',
  'Coral',
  'Creme',
  'Vinho',
  'Khaki',
  'Inox',
]);

function inferirLabel(valores: string[]): string {
  if (valores.some((v) => TAMANHOS_SET.has(v) || /^\d{2,3}(GB|TB|ml|L)?$/.test(v)))
    return 'Tamanho';
  if (valores.some((v) => CORES_SET.has(v))) return 'Cor';
  return 'Opção';
}

function extrairEixos(variacoes: VariacaoProduto[]): Eixo[] {
  if (variacoes.length === 0) return [];
  const partes = variacoes.map((v) => v.nome.split(' · '));
  const numEixos = Math.max(...partes.map((p) => p.length));
  const eixos: Eixo[] = [];
  for (let i = 0; i < numEixos; i++) {
    const valores = [...new Set(partes.map((p) => p[i]).filter(Boolean))];
    if (valores.length > 0) eixos.push({ label: inferirLabel(valores), valores });
  }
  return eixos;
}

function encontrarVariacao(
  variacoes: VariacaoProduto[],
  selecao: (string | null)[],
): VariacaoProduto | null {
  if (selecao.some((v) => v === null)) return null;
  const nomeAlvo = selecao.join(' · ');
  return variacoes.find((v) => v.nome === nomeAlvo) ?? null;
}

// Tamanhos genéricos para fallback quando produto não tem variações cadastradas
const TAMANHOS_POR_CATEGORIA: Record<string, string[]> = {
  roupa: ['PP', 'P', 'M', 'G', 'GG', 'GGG'],
  calcado: ['36', '37', '38', '39', '40', '41', '42', '43'],
  esporte: ['PP', 'P', 'M', 'G', 'GG', 'GGG'],
};

function categoriaTamanho(categoria: string): string[] | null {
  const c = categoria.toLowerCase();
  if (
    c.includes('roupa') ||
    c.includes('camisa') ||
    c.includes('camiseta') ||
    c.includes('calça') ||
    c.includes('blusa') ||
    c.includes('moletom')
  ) {
    return TAMANHOS_POR_CATEGORIA.roupa;
  }
  if (
    c.includes('calçado') ||
    c.includes('tênis') ||
    c.includes('sapato') ||
    c.includes('chinelo') ||
    c.includes('sandália')
  ) {
    return TAMANHOS_POR_CATEGORIA.calcado;
  }
  if (c.includes('esporte') || c.includes('academia') || c.includes('futebol')) {
    return TAMANHOS_POR_CATEGORIA.esporte;
  }
  return null;
}

// ─── Stars ────────────────────────────────────────────────────

function Stars({ value, size = 14 }: { value: number; size?: number }) {
  return (
    <View style={{ flexDirection: 'row', gap: 2 }}>
      {Array.from({ length: 5 }, (_, i) => (
        <Ionicons
          key={i}
          name={i < Math.floor(value) ? 'star' : i < value ? 'star-half' : 'star-outline'}
          size={size}
          color={colors.orange}
        />
      ))}
    </View>
  );
}

// ─── Carrossel de imagens ─────────────────────────────────────

function ImageCarousel({ imagens, nome }: { imagens: string[]; nome: string }) {
  const [current, setCurrent] = useState(0);
  const [errors, setErrors] = useState<Record<number, boolean>>({});

  if (!imagens.length) {
    return (
      <View style={styles.carouselFallback}>
        <Ionicons name="image-outline" size={48} color={colors.n300} />
      </View>
    );
  }

  return (
    <View style={styles.carouselWrapper}>
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={(e) => {
          const idx = Math.round(e.nativeEvent.contentOffset.x / SCREEN_W);
          if (idx !== current) setCurrent(idx);
        }}
        onMomentumScrollEnd={(e) => {
          const idx = Math.round(e.nativeEvent.contentOffset.x / SCREEN_W);
          setCurrent(idx);
        }}
      >
        {imagens.map((uri, idx) =>
          errors[idx] ? (
            <View key={idx} style={styles.carouselImgFallback}>
              <Text style={styles.carouselImgFallbackText}>{nome.charAt(0)}</Text>
            </View>
          ) : (
            <Image
              key={idx}
              source={{ uri }}
              style={styles.carouselImg}
              resizeMode="contain"
              onError={() => setErrors((e) => ({ ...e, [idx]: true }))}
            />
          ),
        )}
      </ScrollView>
      {imagens.length > 1 && (
        <View style={styles.dots}>
          {imagens.map((_, idx) => (
            <View key={idx} style={[styles.dot, idx === current && styles.dotActive]} />
          ))}
        </View>
      )}
    </View>
  );
}

// ─── Seletor de variações multi-dimensional ───────────────────

function VariacoesSelector({
  variacoes,
  isDark,
  text,
  textSec,
  borderL,
  onSelecionar,
}: {
  variacoes: VariacaoProduto[];
  isDark: boolean;
  text: string;
  textSec: string;
  borderL: string;
  onSelecionar: (v: VariacaoProduto | null) => void;
}) {
  const eixos = extrairEixos(variacoes);
  const [selecao, setSelecao] = useState<(string | null)[]>(eixos.map(() => null));

  const toggleOpcao = (eixoIdx: number, valor: string) => {
    const nova = [...selecao];
    nova[eixoIdx] = nova[eixoIdx] === valor ? null : valor;
    setSelecao(nova);
    onSelecionar(encontrarVariacao(variacoes, nova));
  };

  const variacaoSelecionada = encontrarVariacao(variacoes, selecao);
  const todosEixosSelecionados = selecao.every((v) => v !== null);

  if (eixos.length === 0) return null;

  return (
    <View style={varSelStyles.container}>
      {eixos.map((eixo, eixoIdx) => (
        <View key={eixoIdx} style={varSelStyles.eixoGroup}>
          <View style={varSelStyles.eixoHeader}>
            <Text style={[varSelStyles.eixoLabel, { color: textSec }]}>{eixo.label}:</Text>
            {selecao[eixoIdx] && (
              <Text style={[varSelStyles.eixoSelecionado, { color: text }]}>
                {selecao[eixoIdx]}
              </Text>
            )}
          </View>
          <View style={varSelStyles.opcoeRow}>
            {eixo.valores.map((valor) => {
              // Verifica se este valor tem estoque em alguma combinação válida
              const selecaoHipotetica = [...selecao];
              selecaoHipotetica[eixoIdx] = valor;
              const temEstoque = variacoes.some((v) => {
                const partes = v.nome.split(' · ');
                return (
                  selecaoHipotetica.every((s, i) => s === null || partes[i] === s) && v.estoque > 0
                );
              });
              const isAtivo = selecao[eixoIdx] === valor;
              return (
                <TouchableOpacity
                  key={valor}
                  style={[
                    varSelStyles.opcaoBadge,
                    {
                      backgroundColor: isAtivo
                        ? colors.navy
                        : isDark
                          ? 'rgba(255,255,255,0.06)'
                          : colors.n0,
                      borderColor: isAtivo ? colors.navy : borderL,
                      opacity: temEstoque ? 1 : 0.4,
                    },
                  ]}
                  onPress={() => toggleOpcao(eixoIdx, valor)}
                  activeOpacity={0.75}
                  disabled={!temEstoque}
                >
                  <Text style={[varSelStyles.opcaoTxt, { color: isAtivo ? colors.n0 : text }]}>
                    {valor}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      ))}

      {todosEixosSelecionados && variacaoSelecionada && (
        <View style={varSelStyles.statusRow}>
          <Ionicons
            name={variacaoSelecionada.estoque > 0 ? 'checkmark-circle' : 'close-circle'}
            size={14}
            color={variacaoSelecionada.estoque > 0 ? '#16A34A' : '#DC2626'}
          />
          <Text
            style={[
              varSelStyles.statusTxt,
              { color: variacaoSelecionada.estoque > 0 ? '#15803D' : '#DC2626' },
            ]}
          >
            {variacaoSelecionada.estoque > 0
              ? `${variacaoSelecionada.estoque} disponível${variacaoSelecionada.estoque === 1 ? '' : 'is'}`
              : 'Sem estoque para esta combinação'}
          </Text>
        </View>
      )}

      {todosEixosSelecionados && !variacaoSelecionada && (
        <View style={varSelStyles.statusRow}>
          <Ionicons name="close-circle" size={14} color="#DC2626" />
          <Text style={[varSelStyles.statusTxt, { color: '#DC2626' }]}>
            Combinação indisponível
          </Text>
        </View>
      )}
    </View>
  );
}

// Fallback de tamanhos sem variações reais (comportamento legado)
function TabelaTamanhoSimples({
  opcoes,
  isDark,
  text,
  borderL,
}: {
  opcoes: string[];
  isDark: boolean;
  text: string;
  borderL: string;
}) {
  const [selecionado, setSelecionado] = useState<string | null>(null);
  return (
    <View>
      <Text style={[styles.tamanhoLabel, { color: text }]}>Tamanho:</Text>
      <View style={styles.tamanhoRow}>
        {opcoes.map((op) => {
          const ativo = selecionado === op;
          return (
            <TouchableOpacity
              key={op}
              style={[
                styles.tamanhoBadge,
                {
                  backgroundColor: ativo
                    ? colors.navy
                    : isDark
                      ? 'rgba(255,255,255,0.06)'
                      : colors.n0,
                  borderColor: ativo ? colors.navy : borderL,
                },
              ]}
              onPress={() => setSelecionado(ativo ? null : op)}
              activeOpacity={0.75}
            >
              <Text style={[styles.tamanhoTxt, { color: ativo ? colors.n0 : text }]}>{op}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const varSelStyles = StyleSheet.create({
  container: { gap: 14 },
  eixoGroup: { gap: 8 },
  eixoHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  eixoLabel: { fontSize: 13, fontWeight: '600' },
  eixoSelecionado: { fontSize: 13, fontWeight: '700' },
  opcoeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  opcaoBadge: {
    minWidth: 44,
    height: 36,
    borderRadius: 8,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  opcaoTxt: { fontSize: 13, fontWeight: '700' },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: 'rgba(0,0,0,0.04)',
    borderRadius: 8,
  },
  statusTxt: { fontSize: 12, fontWeight: '600' },
});

// ─── Avaliações ───────────────────────────────────────────────

function AvaliacaoResumo({
  avaliacoes,
  text,
  textSec,
  borderL,
}: {
  avaliacoes: AvaliacaoLoja[];
  text: string;
  textSec: string;
  borderL: string;
}) {
  if (!avaliacoes.length) return null;

  const media =
    Math.round((avaliacoes.reduce((s, a) => s + a.nota, 0) / avaliacoes.length) * 10) / 10;
  const recomendam = Math.round(
    (avaliacoes.filter((a) => a.nota >= 4).length / avaliacoes.length) * 100,
  );

  const barras = [5, 4, 3, 2, 1].map((nota) => ({
    nota,
    count: avaliacoes.filter((a) => a.nota === nota).length,
    pct: Math.round((avaliacoes.filter((a) => a.nota === nota).length / avaliacoes.length) * 100),
  }));

  return (
    <View style={[styles.avResumoCard, { borderColor: borderL }]}>
      <View style={styles.avResumoTop}>
        <View style={styles.avResumoEsq}>
          <Text style={[styles.avMediaNum, { color: text }]}>{media}</Text>
          <Stars value={media} size={18} />
          <Text style={[styles.avBaseadoEm, { color: textSec }]}>
            Baseado em {avaliacoes.length} avaliação{avaliacoes.length > 1 ? 'ões' : ''}
          </Text>
          <Text style={[styles.avRecomenda, { color: textSec }]}>{recomendam}% recomendam</Text>
        </View>

        <View style={styles.avBarras}>
          {barras.map((b) => (
            <View key={b.nota} style={styles.avBarraRow}>
              <Text style={[styles.avBarraNota, { color: textSec }]}>{b.nota}</Text>
              <Ionicons name="star" size={10} color={colors.orange} />
              <View style={[styles.avBarraFundo, { backgroundColor: borderL }]}>
                <View style={[styles.avBarraFill, { width: `${b.pct}%` as any }]} />
              </View>
              <Text style={[styles.avBarraPct, { color: textSec }]}>{b.pct}%</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

function AvaliacaoItem({
  av,
  text,
  textSec,
  surf,
  borderL,
}: {
  av: AvaliacaoLoja;
  text: string;
  textSec: string;
  surf: string;
  borderL: string;
}) {
  const data = new Date(av.criadoEm).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  return (
    <View style={[styles.avCard, { backgroundColor: surf, borderColor: borderL }]}>
      <View style={styles.avHeader}>
        <View style={styles.avAvatar}>
          {av.usuario.avatarUrl ? (
            <Image source={{ uri: av.usuario.avatarUrl }} style={styles.avAvatarImg} />
          ) : (
            <Text style={styles.avAvatarText}>{av.usuario.nome.charAt(0)}</Text>
          )}
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.avNome, { color: text }]}>{av.usuario.nome}</Text>
          <Text style={[styles.avData, { color: textSec }]}>{data}</Text>
        </View>
        <Stars value={av.nota} size={12} />
      </View>
      {av.comentario ? (
        <Text style={[styles.avComentario, { color: text }]}>{av.comentario}</Text>
      ) : null}
    </View>
  );
}

// ─── Card de produto similar ──────────────────────────────────

function ProdutoSimilarCard({ produto, onAdd }: { produto: Produto; onAdd: (p: Produto) => void }) {
  const router = useRouter();
  const { surf, borderL, text, textSec } = useTheme();
  const [imgError, setImgError] = useState(false);

  return (
    <TouchableOpacity
      style={[styles.simCard, { backgroundColor: surf, borderColor: borderL }]}
      onPress={() => router.push(`/(consumer)/produto/${produto.id}` as any)}
      activeOpacity={0.88}
    >
      {imgError || !produto.imagem ? (
        <View style={styles.simImgFallback}>
          <Text style={styles.simImgFallbackTxt}>{produto.nome.charAt(0)}</Text>
        </View>
      ) : (
        <Image
          source={{ uri: produto.imagem }}
          style={styles.simImg}
          resizeMode="cover"
          onError={() => setImgError(true)}
        />
      )}
      {produto.destaque && (
        <View style={styles.simBadge}>
          <Text style={styles.simBadgeTxt}>Destaque</Text>
        </View>
      )}
      <View style={styles.simInfo}>
        <Text style={[styles.simNome, { color: text }]} numberOfLines={2}>
          {produto.nome}
        </Text>
        <Text style={[styles.simCateg, { color: textSec as string }]} numberOfLines={1}>
          {produto.categoria}
        </Text>
        <Text style={[styles.simPreco, { color: text }]}>
          R$ {produto.preco.toFixed(2).replace('.', ',')}
        </Text>
        <TouchableOpacity
          style={[styles.simBtnAdd, !produto.disponivel && { opacity: 0.4 }]}
          onPress={() => onAdd(produto)}
          disabled={!produto.disponivel}
          activeOpacity={0.8}
        >
          <Text style={styles.simBtnAddTxt}>+ Adicionar</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

// ─── Tela principal ───────────────────────────────────────────

interface ProdutoDetailProps {
  produtoId: string;
}

export function ProdutoDetail({ produtoId }: ProdutoDetailProps) {
  const router = useRouter();
  const { isDark, bg, surf, borderL, text, textSec, backBtn } = useTheme();
  const token = useAuthStore((s) => s.token);
  const adicionar = useCartStore((s) => s.adicionar);

  const [produto, setProduto] = useState<Produto | null>(null);
  const [avaliacoes, setAvaliacoes] = useState<AvaliacaoLoja[]>([]);
  const [similares, setSimilares] = useState<Produto[]>([]);
  const [favoritado, setFavoritado] = useState(false);
  const [loading, setLoading] = useState(true);
  const [added, setAdded] = useState(false);
  const [mostrarTodasAv, setMostrarTodasAv] = useState(false);
  const [variacaoSelecionada, setVariacaoSelecionada] = useState<VariacaoProduto | null>(null);

  const heartScale = useRef(new Animated.Value(1)).current;
  const addScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    setLoading(true);
    setAdded(false);
    setVariacaoSelecionada(null);
    ProdutoService.buscarPorId(produtoId).then(async (p) => {
      if (!p) {
        setLoading(false);
        return;
      }
      setProduto(p);

      const [avs, sim, fav] = await Promise.all([
        AvaliacaoService.listarPorLoja(p.lojaId),
        ProdutoService.listarPorLoja(p.lojaId).catch(() => [] as Produto[]),
        token ? FavoritoService.checar(produtoId, token) : Promise.resolve(false),
      ]);
      setAvaliacoes(avs);
      setSimilares(sim.filter((s) => s.id !== p.id).slice(0, 10));
      setFavoritado(fav);
      setLoading(false);
    });
  }, [produtoId]);

  const handleFavorito = useCallback(async () => {
    if (!token) {
      router.push('/(auth)/login');
      return;
    }
    const novo = !favoritado;
    setFavoritado(novo);
    Animated.sequence([
      Animated.timing(heartScale, { toValue: 1.35, duration: 120, useNativeDriver: true }),
      Animated.spring(heartScale, { toValue: 1, useNativeDriver: true, speed: 20, bounciness: 8 }),
    ]).start();
    if (novo) await FavoritoService.favoritar(produtoId, token);
    else await FavoritoService.desfavoritar(produtoId, token);
  }, [favoritado, token, produtoId]);

  const handleAdd = useCallback(
    (p: Produto = produto!) => {
      if (!p) return;
      const hasVariacoes = (p.variacoes?.length ?? 0) > 0;
      if (hasVariacoes && p.id === produtoId && !variacaoSelecionada) {
        Alert.alert(
          'Selecione uma variação',
          'Escolha as opções do produto antes de adicionar ao carrinho.',
        );
        return;
      }
      if (
        hasVariacoes &&
        p.id === produtoId &&
        variacaoSelecionada &&
        variacaoSelecionada.estoque === 0
      ) {
        Alert.alert('Sem estoque', 'Esta combinação está esgotada.');
        return;
      }
      adicionar(
        p,
        p.id === produtoId ? variacaoSelecionada?.id : undefined,
        p.id === produtoId ? variacaoSelecionada?.nome : undefined,
      );
      if (p.id === produtoId) {
        setAdded(true);
        Animated.sequence([
          Animated.timing(addScale, { toValue: 0.93, duration: 80, useNativeDriver: true }),
          Animated.spring(addScale, {
            toValue: 1,
            useNativeDriver: true,
            speed: 20,
            bounciness: 6,
          }),
        ]).start();
      }
    },
    [produto, adicionar, produtoId, variacaoSelecionada],
  );

  if (loading) {
    return (
      <View
        style={[
          styles.container,
          { backgroundColor: bg, alignItems: 'center', justifyContent: 'center' },
        ]}
      >
        <ActivityIndicator size="large" color={colors.orange} />
      </View>
    );
  }

  if (!produto) {
    return (
      <View
        style={[
          styles.container,
          { backgroundColor: bg, alignItems: 'center', justifyContent: 'center' },
        ]}
      >
        <Ionicons name="alert-circle-outline" size={48} color={colors.n300} />
        <Text style={[styles.erroTxt, { color: text }]}>Produto não encontrado</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.btnVoltar}>
          <Text style={styles.btnVoltarTxt}>Voltar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const imagens = produto.imagens?.length
    ? produto.imagens
    : produto.imagem
      ? [produto.imagem]
      : [];
  const tags = produto.tags?.filter(Boolean) ?? [];
  const variacoes = produto.variacoes ?? [];
  const hasVariacoes = variacoes.length > 0;

  // Fallback: tamanhos inferidos por categoria quando produto não tem variações
  const tamanhosFallback = !hasVariacoes ? (categoriaTamanho(produto.categoria) ?? []) : [];

  const mediaAvaliacoes = avaliacoes.length
    ? Math.round((avaliacoes.reduce((s, a) => s + a.nota, 0) / avaliacoes.length) * 10) / 10
    : 0;
  const avsVisiveis = mostrarTodasAv ? avaliacoes : avaliacoes.slice(0, 3);

  // Botão de add: desabilitado se produto tem variações mas nenhuma selecionada
  const podeContinuar = produto.disponivel && (!hasVariacoes || variacaoSelecionada !== null);

  return (
    <View style={[styles.container, { backgroundColor: bg }]}>
      {/* Header */}
      <View
        style={[styles.header, { backgroundColor: surf, borderBottomColor: borderL as string }]}
      >
        <TouchableOpacity
          onPress={() => router.push(`/(consumer)/vitrine/${produto.lojaId}` as any)}
          style={[styles.headerBtn, { backgroundColor: backBtn }]}
        >
          <Ionicons name="chevron-back" size={20} color={text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitulo, { color: text }]} numberOfLines={1}>
          {produto.nome}
        </Text>
        <Animated.View style={{ transform: [{ scale: heartScale }] }}>
          <TouchableOpacity
            onPress={handleFavorito}
            style={[styles.headerBtn, { backgroundColor: backBtn }]}
          >
            <Ionicons
              name={favoritado ? 'heart' : 'heart-outline'}
              size={20}
              color={favoritado ? colors.orange : text}
            />
          </TouchableOpacity>
        </Animated.View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        {/* Carrossel */}
        <ImageCarousel imagens={imagens} nome={produto.nome} />

        {/* Badges */}
        <View style={styles.badgesRow}>
          {produto.destaque && (
            <View style={[styles.badge, { backgroundColor: colors.orange100 }]}>
              <Text style={[styles.badgeTxt, { color: colors.orange600 }]}>⭐ Destaque</Text>
            </View>
          )}
          {!produto.disponivel && (
            <View style={[styles.badge, { backgroundColor: 'rgba(107,115,144,0.15)' }]}>
              <Text style={[styles.badgeTxt, { color: colors.n600 }]}>Indisponível</Text>
            </View>
          )}
          {!hasVariacoes &&
            produto.estoque != null &&
            produto.estoque <= 5 &&
            produto.estoque > 0 && (
              <View style={[styles.badge, { backgroundColor: 'rgba(255,107,0,0.12)' }]}>
                <Text style={[styles.badgeTxt, { color: colors.orange }]}>
                  Últimas {produto.estoque} unid.
                </Text>
              </View>
            )}
        </View>

        {/* Info principal */}
        <View style={[styles.infoCard, { backgroundColor: surf, borderColor: borderL as string }]}>
          <Text style={[styles.nome, { color: text }]}>{produto.nome}</Text>
          <Text style={[styles.preco, { color: text }]}>
            R$ {produto.preco.toFixed(2).replace('.', ',')}
          </Text>

          <View style={styles.ratingRow}>
            <Stars value={mediaAvaliacoes} />
            {avaliacoes.length > 0 && (
              <Text style={[styles.ratingNum, { color: text }]}>{mediaAvaliacoes}</Text>
            )}
            <Text style={[styles.ratingTotal, { color: textSec as string }]}>
              {avaliacoes.length} avalia{avaliacoes.length !== 1 ? 'ções' : 'ção'}
            </Text>
          </View>

          <Text style={[styles.desc, { color: textSec as string }]}>{produto.descricao}</Text>

          {/* Seletor de variações reais */}
          {hasVariacoes && (
            <View style={[styles.tamanhoSection, { borderTopColor: borderL as string }]}>
              <VariacoesSelector
                variacoes={variacoes}
                isDark={isDark}
                text={text}
                textSec={textSec as string}
                borderL={borderL as string}
                onSelecionar={setVariacaoSelecionada}
              />
            </View>
          )}

          {/* Fallback: tamanhos inferidos por categoria */}
          {!hasVariacoes && tamanhosFallback.length > 0 && (
            <View style={[styles.tamanhoSection, { borderTopColor: borderL as string }]}>
              <TabelaTamanhoSimples
                opcoes={tamanhosFallback}
                isDark={isDark}
                text={text}
                borderL={borderL as string}
              />
            </View>
          )}
        </View>

        {/* Informações */}
        <View style={[styles.section, { backgroundColor: surf, borderColor: borderL as string }]}>
          <Text style={[styles.sectionTitulo, { color: text }]}>Informações</Text>
          <InfoRow
            label="Categoria"
            value={produto.categoria}
            text={text}
            textSec={textSec as string}
            borderL={borderL as string}
          />
          {!hasVariacoes && produto.estoque != null && (
            <InfoRow
              label="Estoque"
              value={produto.estoque > 0 ? `${produto.estoque} unidades` : 'Sem estoque'}
              text={text}
              textSec={textSec as string}
              borderL={borderL as string}
            />
          )}
          {hasVariacoes && (
            <InfoRow
              label="Variações"
              value={`${variacoes.length} combinações disponíveis`}
              text={text}
              textSec={textSec as string}
              borderL={borderL as string}
            />
          )}
        </View>

        {/* Tags */}
        {tags.length > 0 && (
          <View style={[styles.section, { backgroundColor: surf, borderColor: borderL as string }]}>
            <Text style={[styles.sectionTitulo, { color: text }]}>Tags</Text>
            <View style={styles.tagsWrap}>
              {tags.map((tag, idx) => (
                <View
                  key={idx}
                  style={[
                    styles.tagChip,
                    {
                      backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : colors.n100,
                      borderColor: borderL as string,
                    },
                  ]}
                >
                  <Text style={[styles.tagTxt, { color: textSec as string }]}>#{tag}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Avaliações */}
        {avaliacoes.length > 0 && (
          <View style={[styles.section, { backgroundColor: surf, borderColor: borderL as string }]}>
            <Text style={[styles.sectionTitulo, { color: text }]}>Avaliações</Text>

            <AvaliacaoResumo
              avaliacoes={avaliacoes}
              text={text}
              textSec={textSec as string}
              borderL={borderL as string}
            />

            <View style={{ marginTop: 12, gap: 10 }}>
              {avsVisiveis.map((av) => (
                <AvaliacaoItem
                  key={av.id}
                  av={av}
                  text={text}
                  textSec={textSec as string}
                  surf={bg}
                  borderL={borderL as string}
                />
              ))}
            </View>

            {avaliacoes.length > 3 && (
              <TouchableOpacity
                style={[styles.btnVerTodas, { borderColor: borderL as string }]}
                onPress={() => setMostrarTodasAv((v) => !v)}
                activeOpacity={0.7}
              >
                <Text style={[styles.btnVerTodasTxt, { color: colors.orange }]}>
                  {mostrarTodasAv ? 'Ver menos' : `Ver todas as ${avaliacoes.length} avaliações`}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Outros produtos da loja */}
        {similares.length > 0 && (
          <View style={styles.similaresSection}>
            <Text style={[styles.sectionTitulo, { color: text, paddingHorizontal: 16 }]}>
              Mais produtos desta loja
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.similaresScroll}
            >
              {similares.map((s) => (
                <ProdutoSimilarCard key={s.id} produto={s} onAdd={handleAdd} />
              ))}
            </ScrollView>
          </View>
        )}
      </ScrollView>

      {/* Footer fixo */}
      <View style={[styles.footer, { backgroundColor: surf, borderTopColor: borderL as string }]}>
        {hasVariacoes && !variacaoSelecionada && (
          <Text style={styles.variacaoHint}>Selecione as opções para adicionar ao carrinho</Text>
        )}
        <Animated.View style={[{ flex: 1 }, { transform: [{ scale: addScale }] }]}>
          <TouchableOpacity
            style={[
              styles.btnAdd,
              added && styles.btnAdded,
              (!produto.disponivel || (hasVariacoes && !variacaoSelecionada)) && { opacity: 0.5 },
            ]}
            onPress={() => (added ? router.push('/(consumer)/carrinho') : handleAdd())}
            disabled={!podeContinuar}
            activeOpacity={0.85}
          >
            {added ? (
              <>
                <Ionicons name="cart" size={18} color={colors.n0} />
                <Text style={styles.btnAddTxt}>Ver carrinho</Text>
                <Ionicons name="chevron-forward" size={15} color={colors.n0} />
              </>
            ) : (
              <>
                <Ionicons name="add" size={18} color={colors.n0} />
                <Text style={styles.btnAddTxt}>Adicionar ao carrinho</Text>
              </>
            )}
          </TouchableOpacity>
        </Animated.View>
      </View>
    </View>
  );
}

function InfoRow({
  label,
  value,
  text,
  textSec,
  borderL,
}: {
  label: string;
  value: string;
  text: string;
  textSec: string;
  borderL: string;
}) {
  return (
    <View style={[styles.infoRow, { borderTopColor: borderL }]}>
      <Text style={[styles.infoLabel, { color: textSec }]}>{label}</Text>
      <Text style={[styles.infoValue, { color: text }]}>{value}</Text>
    </View>
  );
}

// ─── Estilos ──────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 52,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  headerBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitulo: { flex: 1, fontSize: 16, fontWeight: '700' },

  carouselWrapper: { width: SCREEN_W, backgroundColor: '#f5f5f7' },
  carouselImg: { width: SCREEN_W, height: 300, backgroundColor: '#f5f5f7' },
  carouselImgFallback: {
    width: SCREEN_W,
    height: 300,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.orange100,
  },
  carouselImgFallbackText: { fontSize: 64, fontWeight: '700', color: colors.orange600 },
  carouselFallback: {
    width: SCREEN_W,
    height: 300,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.n100,
  },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 6, paddingVertical: 10 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.n300 },
  dotActive: { backgroundColor: colors.orange, width: 18 },

  badgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    paddingHorizontal: 16,
    paddingTop: 14,
  },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 99 },
  badgeTxt: { fontSize: 11.5, fontWeight: '600' },

  infoCard: { margin: 16, marginTop: 12, borderRadius: 16, padding: 16, borderWidth: 1 },
  nome: { fontSize: 20, fontWeight: '700', lineHeight: 26 },
  preco: { fontSize: 24, fontWeight: '800', marginTop: 6 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10 },
  ratingNum: { fontSize: 13, fontWeight: '700' },
  ratingTotal: { fontSize: 12 },
  desc: { fontSize: 14, lineHeight: 21, marginTop: 12 },

  tamanhoSection: { marginTop: 16, paddingTop: 16, borderTopWidth: 1 },
  tamanhoLabel: { fontSize: 13, fontWeight: '600', marginBottom: 10 },
  tamanhoRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tamanhoBadge: {
    minWidth: 44,
    height: 36,
    borderRadius: 8,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  tamanhoTxt: { fontSize: 13, fontWeight: '700' },

  section: {
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
  },
  sectionTitulo: { fontSize: 15, fontWeight: '700', marginBottom: 12 },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 10,
    borderTopWidth: 1,
  },
  infoLabel: { fontSize: 13, fontWeight: '500', flex: 1 },
  infoValue: { fontSize: 13, fontWeight: '600', flex: 2, textAlign: 'right' },
  tagsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tagChip: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 99, borderWidth: 1 },
  tagTxt: { fontSize: 12 },

  avResumoCard: { borderRadius: 12, borderWidth: 1, padding: 14, marginBottom: 4 },
  avResumoTop: { flexDirection: 'row', gap: 16, alignItems: 'flex-start' },
  avResumoEsq: { alignItems: 'center', gap: 4, minWidth: 90 },
  avMediaNum: { fontSize: 40, fontWeight: '800', lineHeight: 44 },
  avBaseadoEm: { fontSize: 11, textAlign: 'center', marginTop: 4, lineHeight: 15 },
  avRecomenda: { fontSize: 11, textAlign: 'center', lineHeight: 15 },
  avBarras: { flex: 1, gap: 4 },
  avBarraRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  avBarraNota: { fontSize: 11, width: 8, textAlign: 'right' },
  avBarraFundo: { flex: 1, height: 6, borderRadius: 3, overflow: 'hidden' },
  avBarraFill: { height: 6, borderRadius: 3, backgroundColor: colors.orange },
  avBarraPct: { fontSize: 10, width: 28, textAlign: 'right' },

  avCard: { borderRadius: 12, padding: 12, borderWidth: 1 },
  avHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.orange100,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avAvatarImg: { width: 34, height: 34 },
  avAvatarText: { fontSize: 14, fontWeight: '700', color: colors.orange600 },
  avNome: { fontSize: 13, fontWeight: '700' },
  avData: { fontSize: 11, marginTop: 1 },
  avComentario: { fontSize: 13, lineHeight: 19, marginTop: 10 },
  btnVerTodas: {
    marginTop: 14,
    paddingVertical: 11,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
  },
  btnVerTodasTxt: { fontSize: 13, fontWeight: '600' },

  similaresSection: { marginBottom: 12 },
  similaresScroll: { paddingHorizontal: 16, paddingBottom: 4, gap: 12 },
  simCard: { width: 156, borderRadius: 14, overflow: 'hidden', borderWidth: 1 },
  simImg: { width: '100%', aspectRatio: 4 / 3 },
  simImgFallback: {
    width: '100%',
    aspectRatio: 4 / 3,
    backgroundColor: colors.orange100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  simImgFallbackTxt: { fontSize: 28, fontWeight: '700', color: colors.orange600 },
  simBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: colors.orange,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 99,
  },
  simBadgeTxt: { color: colors.n0, fontSize: 9, fontWeight: '700' },
  simInfo: { padding: 10 },
  simNome: { fontSize: 12, fontWeight: '600', lineHeight: 16, minHeight: 30 },
  simCateg: { fontSize: 10.5, marginTop: 2 },
  simPreco: { fontSize: 13, fontWeight: '700', marginTop: 4 },
  simBtnAdd: {
    marginTop: 8,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: colors.orange100,
    alignItems: 'center',
  },
  simBtnAddTxt: { color: colors.orange600, fontSize: 11.5, fontWeight: '600' },

  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    paddingBottom: 32,
    borderTopWidth: 1,
    gap: 8,
  },
  variacaoHint: { fontSize: 12, color: colors.n500, textAlign: 'center' },
  btnAdd: {
    height: 52,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.orange,
    shadowColor: colors.orange,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 4,
  },
  btnAdded: { backgroundColor: colors.navy },
  btnAddTxt: { color: colors.n0, fontSize: 15, fontWeight: '700' },

  erroTxt: { fontSize: 16, marginTop: 12, fontWeight: '600' },
  btnVoltar: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: colors.orange,
    borderRadius: 12,
  },
  btnVoltarTxt: { color: colors.n0, fontWeight: '600', fontSize: 14 },
});
