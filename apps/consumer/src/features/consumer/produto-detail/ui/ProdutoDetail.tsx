import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '@ajulabs/theme';
import { VariacoesSelector } from '../../../../entities/produto';
import { useTheme, useHardwareBack } from '../../../../shared/hooks';
import { useProduto } from '../model/useProduto';
import { Stars } from './components/Stars';
import { ImageCarousel } from './components/ImageCarousel';
import { InfoRow } from './components/InfoRow';
import { ProdutoSimilarCard } from './components/ProdutoSimilarCard';
import { AvaliacaoResumo, AvaliacaoItem } from './components/Avaliacoes';

interface ProdutoDetailProps {
  produtoId: string;
  quantidadeInicial?: number;
}

export function ProdutoDetail({ produtoId, quantidadeInicial }: ProdutoDetailProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  useHardwareBack(() => {
    router.back();
    return true;
  });
  const { isDark, bg, surf, borderL, text, textSec, backBtn } = useTheme();

  const {
    produto,
    avaliacoes,
    similares,
    favoritado,
    loading,
    added,
    mostrarTodasAv,
    setMostrarTodasAv,
    variacaoSelecionada,
    setVariacaoSelecionada,
    quantidade,
    setQuantidade,
    heartScale,
    addScale,
    handleFavorito,
    handleAdd,
    precoExibido,
    imagens,
    tags,
    variacoes,
    hasVariacoes,
    mediaAvaliacoes,
    avsVisiveis,
    estoqueDisponivel,
    semEstoqueTotal,
    semEstoqueSelecao,
    podeContinuar,
    avisoEstoqueAtivo,
    salvandoAviso,
    toggleAvisoEstoque,
  } = useProduto(produtoId, quantidadeInicial);

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

  return (
    <View style={[styles.container, { backgroundColor: bg }]}>
      {/* Header */}
      <View
        style={[
          styles.header,
          {
            backgroundColor: surf,
            borderBottomColor: borderL as string,
            paddingTop: insets.top + 12,
          },
        ]}
      >
        <TouchableOpacity
          onPress={() => {
            if (router.canGoBack()) {
              router.back();
            } else {
              router.push(`/(consumer)/vitrine/${produto.lojaId}` as any);
            }
          }}
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
          {semEstoqueTotal && (
            <View style={[styles.badge, { backgroundColor: 'rgba(163,45,45,0.15)' }]}>
              <Text style={[styles.badgeTxt, { color: '#A32D2D' }]}>Esgotado</Text>
            </View>
          )}
          {!semEstoqueTotal &&
            !hasVariacoes &&
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
            R$ {precoExibido.toFixed(2).replace('.', ',')}
            {variacaoSelecionada?.preco != null && (
              <Text style={{ fontSize: 13, color: '#9ca3af' }}>
                {' '}
                (base R$ {produto.preco.toFixed(2).replace('.', ',')})
              </Text>
            )}
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

          {semEstoqueTotal && (
            <View style={styles.semEstoqueBanner}>
              <View style={styles.semEstoqueRow}>
                <Ionicons name="alert-circle" size={18} color="#A32D2D" />
                <View style={{ flex: 1 }}>
                  <Text style={styles.semEstoqueTitulo}>Produto esgotado</Text>
                  <Text style={styles.semEstoqueTxt}>
                    Este produto está sem estoque no momento. Acompanhe a vitrine — você será
                    avisado quando voltar.
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                style={[styles.avisarBtn, avisoEstoqueAtivo && styles.avisarBtnAtivo]}
                onPress={toggleAvisoEstoque}
                disabled={salvandoAviso}
                activeOpacity={0.85}
              >
                {salvandoAviso ? (
                  <ActivityIndicator size="small" color={colors.n0} />
                ) : (
                  <>
                    <Ionicons
                      name={avisoEstoqueAtivo ? 'checkmark-circle' : 'notifications-outline'}
                      size={16}
                      color={colors.n0}
                    />
                    <Text style={styles.avisarBtnTxt}>
                      {avisoEstoqueAtivo ? 'Você será avisado' : 'Avise-me quando voltar'}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}
          {!semEstoqueTotal && semEstoqueSelecao && (
            <View style={styles.semEstoqueBanner}>
              <Ionicons name="alert-circle" size={18} color="#A32D2D" />
              <Text style={[styles.semEstoqueTxt, { flex: 1 }]}>
                Esta opção está esgotada. Escolha outra acima.
              </Text>
            </View>
          )}

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
                <ProdutoSimilarCard key={s.id} produto={s} />
              ))}
            </ScrollView>
          </View>
        )}
      </ScrollView>

      {/* Footer fixo */}
      <View style={[styles.footer, { backgroundColor: surf, borderTopColor: borderL as string }]}>
        {semEstoqueTotal && (
          <Text style={styles.semEstoqueHint}>Produto sem estoque no momento</Text>
        )}
        {!semEstoqueTotal && semEstoqueSelecao && (
          <Text style={styles.semEstoqueHint}>Esta opção está esgotada</Text>
        )}
        {!semEstoqueTotal && !semEstoqueSelecao && hasVariacoes && !variacaoSelecionada && (
          <Text style={styles.variacaoHint}>Selecione o tamanho para adicionar ao carrinho</Text>
        )}

        {/* Seletor de quantidade */}
        {!added && !semEstoqueTotal && !semEstoqueSelecao && (
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 16,
              marginBottom: 8,
            }}
          >
            <TouchableOpacity
              onPress={() => setQuantidade((q) => Math.max(1, q - 1))}
              style={[styles.qtyBtn, { borderColor: borderL as string }]}
              activeOpacity={0.7}
            >
              <Text style={[styles.qtyTxt, { color: text }]}>−</Text>
            </TouchableOpacity>
            <Text style={[styles.qtyNum, { color: text }]}>{quantidade}</Text>
            <TouchableOpacity
              onPress={() =>
                setQuantidade((q) =>
                  Math.min(isFinite(estoqueDisponivel) ? estoqueDisponivel : 99, q + 1),
                )
              }
              style={[
                styles.qtyBtn,
                {
                  borderColor: borderL as string,
                  opacity: quantidade >= estoqueDisponivel ? 0.35 : 1,
                },
              ]}
              activeOpacity={0.7}
              disabled={quantidade >= estoqueDisponivel}
            >
              <Text style={[styles.qtyTxt, { color: text }]}>+</Text>
            </TouchableOpacity>
          </View>
        )}

        <Animated.View style={[{ flex: 1 }, { transform: [{ scale: addScale }] }]}>
          <TouchableOpacity
            style={[styles.btnAdd, added && styles.btnAdded, !podeContinuar && { opacity: 0.55 }]}
            onPress={() => (added ? router.push('/(consumer)/carrinho') : handleAdd())}
            activeOpacity={0.85}
            disabled={semEstoqueTotal || semEstoqueSelecao}
          >
            {added ? (
              <>
                <Ionicons name="cart" size={18} color={colors.n0} />
                <Text style={styles.btnAddTxt}>Ver carrinho</Text>
                <Ionicons name="chevron-forward" size={15} color={colors.n0} />
              </>
            ) : semEstoqueTotal || semEstoqueSelecao ? (
              <>
                <Ionicons name="close-circle-outline" size={18} color={colors.n0} />
                <Text style={styles.btnAddTxt}>Esgotado</Text>
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

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
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

  section: {
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
  },
  sectionTitulo: { fontSize: 15, fontWeight: '700', marginBottom: 12 },
  tagsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tagChip: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 99, borderWidth: 1 },
  tagTxt: { fontSize: 12 },

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
  semEstoqueBanner: {
    backgroundColor: '#FCEBEB',
    borderColor: '#FCA5A5',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginTop: 12,
    gap: 12,
  },
  semEstoqueRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  avisarBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#A32D2D',
    borderRadius: 10,
    paddingVertical: 11,
  },
  avisarBtnAtivo: { backgroundColor: colors.navy },
  avisarBtnTxt: { fontSize: 13, fontWeight: '700', color: colors.n0 },
  semEstoqueTitulo: { fontSize: 13.5, fontWeight: '700', color: '#A32D2D' },
  semEstoqueTxt: { fontSize: 12.5, color: '#7F1D1D', marginTop: 2, lineHeight: 17 },
  semEstoqueHint: {
    fontSize: 12,
    color: '#A32D2D',
    fontWeight: '700',
    textAlign: 'center',
  },
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

  qtyBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyTxt: { fontSize: 20, fontWeight: '600', lineHeight: 24 },
  qtyNum: { fontSize: 18, fontWeight: '700', minWidth: 28, textAlign: 'center' },
});
