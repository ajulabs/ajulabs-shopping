import { useState, useEffect, useCallback, useRef } from 'react';
import { Animated, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Produto, AvaliacaoLoja, VariacaoProduto } from '@ajulabs/types';
import { ProdutoService, AvaliacaoService, FavoritoService } from '@ajulabs/api-client';
import { useProdutoEstoqueRealtime } from '@ajulabs/realtime';
import { categoriaTamanho } from '../../../../entities/produto';
import { useCartStore, useAuthStore } from '../../../../store';

const API_URL = (process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000').replace(/\/$/, '');

export function useProduto(produtoId: string, quantidadeInicial?: number) {
  const router = useRouter();
  const token = useAuthStore((s) => s.token);
  const adicionar = useCartStore((s) => s.adicionar);
  const itensPorLoja = useCartStore((s) => s.itensPorLoja);

  const [produto, setProduto] = useState<Produto | null>(null);
  const [avaliacoes, setAvaliacoes] = useState<AvaliacaoLoja[]>([]);
  const [similares, setSimilares] = useState<Produto[]>([]);
  const [favoritado, setFavoritado] = useState(false);
  const [loading, setLoading] = useState(true);
  const [added, setAdded] = useState(false);
  const [mostrarTodasAv, setMostrarTodasAv] = useState(false);
  const [variacaoSelecionada, setVariacaoSelecionada] = useState<VariacaoProduto | null>(null);
  const [tamanhoFallbackSelecionado, setTamanhoFallbackSelecionado] = useState<string | null>(null);
  const [quantidade, setQuantidade] = useState(quantidadeInicial ?? 1);

  const heartScale = useRef(new Animated.Value(1)).current;
  const addScale = useRef(new Animated.Value(1)).current;

  // Sincroniza quantidade quando a tela já está na pilha e o usuário navega
  // novamente com um quantidadeInicial diferente (useState não reinicializa).
  useEffect(() => {
    setQuantidade(quantidadeInicial ?? 1);
  }, [quantidadeInicial]);

  // Sincroniza `added` com o carrinho real — reseta quando o item é removido.
  useEffect(() => {
    if (!added || !produto) return;
    const varId = variacaoSelecionada?.id;
    const isInCart = Object.values(itensPorLoja).some((items) =>
      items.some((i) => i.produto.id === produtoId && i.variacaoId === varId),
    );
    if (!isInCart) setAdded(false);
  }, [itensPorLoja, added, produto, variacaoSelecionada, produtoId]);

  useEffect(() => {
    setLoading(true);
    setAdded(false);
    setVariacaoSelecionada(null);
    setTamanhoFallbackSelecionado(null);
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

  // Estoque/variações em tempo real (lojista ajustou o estoque).
  useProdutoEstoqueRealtime({
    apiUrl: API_URL,
    produtoId,
    onVariacoes: (variacoes) => {
      setProduto((prev) => (prev ? { ...prev, variacoes } : prev));
      setVariacaoSelecionada((sel) =>
        sel ? (variacoes.find((v) => v.nome === sel.nome) ?? sel) : sel,
      );
    },
    onEstoque: ({ estoque }) => {
      setProduto((prev) => (prev ? { ...prev, estoque } : prev));
    },
  });

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
          'Selecione uma opção',
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
      if (!hasVariacoes && p.id === produtoId && !tamanhoFallbackSelecionado) {
        const tamanhosDoProduto = categoriaTamanho(p.categoria, p.nome) ?? [];
        if (tamanhosDoProduto.length > 0) {
          Alert.alert('Selecione um tamanho', 'Escolha o tamanho antes de adicionar ao carrinho.');
          return;
        }
      }
      if (!p.disponivel) {
        Alert.alert('Produto indisponível', 'Este produto não está disponível para compra.');
        return;
      }
      const variacaoEfetiva = p.id === produtoId ? variacaoSelecionada : undefined;
      const estoqueEfetivo = hasVariacoes
        ? (variacaoEfetiva?.estoque ?? Infinity)
        : (p.estoque ?? Infinity);
      if (isFinite(estoqueEfetivo) && quantidade > estoqueEfetivo) {
        Alert.alert(
          'Estoque insuficiente',
          `Só ${estoqueEfetivo === 1 ? 'há 1 unidade disponível' : `temos ${estoqueEfetivo} unidades disponíveis`} deste produto.`,
        );
        return;
      }
      // Produtos com tamanho de fallback não têm variações reais — passa o tamanho como nome.
      const variacaoNomeFinal =
        variacaoEfetiva?.nome ??
        (p.id === produtoId && !hasVariacoes
          ? (tamanhoFallbackSelecionado ?? undefined)
          : undefined);
      const qtd = p.id === produtoId ? quantidade : 1;
      for (let i = 0; i < qtd; i++) {
        adicionar(
          p,
          variacaoEfetiva?.id,
          variacaoNomeFinal,
          variacaoEfetiva?.preco != null ? variacaoEfetiva.preco : undefined,
        );
      }
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
    [produto, adicionar, produtoId, variacaoSelecionada, tamanhoFallbackSelecionado, quantidade],
  );

  // ─── Derivados ───────────────────────────────────────────────
  const precoExibido =
    variacaoSelecionada?.preco != null ? variacaoSelecionada.preco : (produto?.preco ?? 0);

  const imagens = produto?.imagens?.length
    ? produto.imagens
    : produto?.imagem
      ? [produto.imagem]
      : [];
  const tags = produto?.tags?.filter(Boolean) ?? [];
  const variacoes = produto?.variacoes ?? [];
  const hasVariacoes = variacoes.length > 0;
  const tamanhosFallback =
    produto && !hasVariacoes ? (categoriaTamanho(produto.categoria, produto.nome) ?? []) : [];

  const mediaAvaliacoes = avaliacoes.length
    ? Math.round((avaliacoes.reduce((s, a) => s + a.nota, 0) / avaliacoes.length) * 10) / 10
    : 0;
  const avsVisiveis = mostrarTodasAv ? avaliacoes : avaliacoes.slice(0, 3);

  // Estoque efetivo: variação selecionada se houver, senão o do produto.
  // Infinity quando indefinido para não bloquear produtos sem controle de estoque.
  const estoqueDisponivel = hasVariacoes
    ? (variacaoSelecionada?.estoque ?? Infinity)
    : (produto?.estoque ?? Infinity);

  const podeContinuar =
    !!produto?.disponivel &&
    (!hasVariacoes || variacaoSelecionada !== null) &&
    (tamanhosFallback.length === 0 || tamanhoFallbackSelecionado !== null);

  return {
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
    tamanhoFallbackSelecionado,
    setTamanhoFallbackSelecionado,
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
    tamanhosFallback,
    mediaAvaliacoes,
    avsVisiveis,
    estoqueDisponivel,
    podeContinuar,
  };
}
