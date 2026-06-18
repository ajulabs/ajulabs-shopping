import { useState, useCallback, useEffect, useRef } from 'react';
import { Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { LojaService, ProdutoService, FavoritoLojaService } from '@ajulabs/api-client';
import { useVitrineRealtime } from '@ajulabs/realtime';
import { Loja, Produto, HorarioFuncionamento } from '@ajulabs/types';
import { useCartStore, useAuthStore } from '../../../../store';

const API_URL = (process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000').replace(/\/$/, '');

export function useVitrineDetail(lojaId: string) {
  const router = useRouter();
  const cachearLoja = useCartStore((s) => s.cachearLoja);
  const adicionar = useCartStore((s) => s.adicionar);
  const token = useAuthStore((s) => s.token);

  const [catSelecionada, setCatSelecionada] = useState('Todos');
  const [busca, setBusca] = useState('');
  const [loja, setLoja] = useState<Loja | null>(null);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);
  const [favoritado, setFavoritado] = useState(false);
  const heartScale = useRef(new Animated.Value(1)).current;

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

  // Horário de hoje: lojista usa 0=Seg...6=Dom; JS getDay() usa 0=Dom...6=Sáb
  const lojistaIdx = (new Date().getDay() + 6) % 7;
  const hojeHorario: HorarioFuncionamento | undefined = loja?.horarios?.find(
    (h) => h.diaSemana === lojistaIdx,
  );

  const cats = ['Todos', ...Array.from(new Set(produtos.map((p) => p.categoria)))];
  const buscaLower = busca.trim().toLowerCase();
  const produtosFiltrados = produtos.filter((p) => {
    const catOk = catSelecionada === 'Todos' || p.categoria === catSelecionada;
    const buscaOk =
      buscaLower === '' ||
      p.nome.toLowerCase().includes(buscaLower) ||
      p.categoria.toLowerCase().includes(buscaLower) ||
      (p.descricao?.toLowerCase().includes(buscaLower) ?? false) ||
      (p.tags?.some((t) => t.toLowerCase().includes(buscaLower)) ?? false);
    return catOk && buscaOk;
  });

  return {
    loja,
    produtos,
    loading,
    favoritado,
    heartScale,
    handleFavorito,
    handleAddToCart,
    busca,
    setBusca,
    catSelecionada,
    setCatSelecionada,
    cats,
    produtosFiltrados,
    hojeHorario,
  };
}
