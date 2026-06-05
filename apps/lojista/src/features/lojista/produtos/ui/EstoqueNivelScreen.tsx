import { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LojistaService } from '@ajulabs/api-client';
import { Produto, NivelEstoque } from '@ajulabs/types';
import { useAuthLojistaStore } from '../../auth/model/store';
import { AjusteRapidoModal } from './AjusteRapidoModal';

const C = {
  bg: '#F1F5F9',
  card: '#FFFFFF',
  border: '#E2E8F0',
  text: '#0F172A',
  sub: '#64748B',
  mute: '#CBD5E1',
  orange: '#F2760F',
};

const NIVEL_CFG: Record<
  NivelEstoque,
  {
    color: string;
    label: string;
    desc: string;
    icon: string;
  }
> = {
  saudavel: {
    color: '#10B981',
    label: 'Saudável',
    desc: 'Estoque acima do nível de atenção',
    icon: 'checkmark-circle',
  },
  atencao: {
    color: '#F59E0B',
    label: 'Atenção',
    desc: 'Estoque próximo ao mínimo',
    icon: 'alert-circle',
  },
  critico: {
    color: '#EF4444',
    label: 'Crítico',
    desc: 'Estoque abaixo do mínimo definido',
    icon: 'warning',
  },
  zerado: {
    color: '#64748B',
    label: 'Sem estoque',
    desc: 'Nenhuma unidade disponível',
    icon: 'cube',
  },
};

function calcNivel(estoque: number, estoqueMinimo = 0): NivelEstoque {
  if (estoque <= 0) return 'zerado';
  if (estoqueMinimo > 0) {
    if (estoque < estoqueMinimo) return 'critico';
    if (estoque < estoqueMinimo * 2) return 'atencao';
    return 'saudavel';
  }
  if (estoque < 10) return 'critico';
  if (estoque < 20) return 'atencao';
  return 'saudavel';
}

interface Props {
  nivel: NivelEstoque;
  onVoltar: () => void;
  onEditarProduto: (p: Produto) => void;
}

export function EstoqueNivelScreen({ nivel, onVoltar, onEditarProduto }: Props) {
  const insets = useSafeAreaInsets();
  const lojaId = useAuthLojistaStore((s) => s.lojaId);
  const token = useAuthLojistaStore((s) => s.token);

  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [ajusteTarget, setAjusteTarget] = useState<Produto | null>(null);
  const [imgErrors, setImgErrors] = useState<Record<string, boolean>>({});

  const cfg = NIVEL_CFG[nivel];

  const carregar = useCallback(
    async (silent = false) => {
      if (!lojaId || !token) return;
      if (!silent) setLoading(true);
      try {
        const lista = await LojistaService.listarProdutos(lojaId, token);
        const filtrados = lista.filter(
          (p) => calcNivel(p.estoque ?? 0, p.estoqueMinimo ?? 0) === nivel,
        );
        setProdutos(filtrados);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [lojaId, token, nivel],
  );

  useEffect(() => {
    carregar();
  }, [carregar]);

  function renderItem({ item: produto }: { item: Produto }) {
    const hasImg = produto.imagem && !imgErrors[produto.id];
    return (
      <View style={s.card}>
        {/* Miniatura */}
        {hasImg ? (
          <Image
            source={{ uri: produto.imagem }}
            style={s.thumb}
            resizeMode="cover"
            onError={() => setImgErrors((prev) => ({ ...prev, [produto.id]: true }))}
          />
        ) : (
          <View style={[s.thumb, s.thumbFallback, { backgroundColor: cfg.color + '20' }]}>
            <Text style={[s.thumbLetter, { color: cfg.color }]}>
              {produto.nome.charAt(0).toUpperCase()}
            </Text>
          </View>
        )}

        {/* Info */}
        <View style={s.info}>
          <Text style={s.nome} numberOfLines={1}>
            {produto.nome}
          </Text>
          <Text style={s.preco}>R$ {Number(produto.preco).toFixed(2).replace('.', ',')}</Text>
          {produto.categoria && (
            <Text style={s.categoria} numberOfLines={1}>
              {produto.categoria}
            </Text>
          )}
        </View>

        {/* Direita: badge de estoque + editar */}
        <View style={s.right}>
          <TouchableOpacity
            style={[s.badge, { backgroundColor: cfg.color }]}
            onPress={() => setAjusteTarget(produto)}
            activeOpacity={0.8}
          >
            <Text style={s.badgeText}>{produto.estoque ?? 0}</Text>
            <Text style={s.badgeUnit}>un</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={s.editBtn}
            onPress={() => onEditarProduto(produto)}
            activeOpacity={0.7}
          >
            <Ionicons name="pencil-outline" size={15} color={C.sub} />
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={s.root}>
      {/* Header com cor do nível */}
      <View style={[s.header, { backgroundColor: cfg.color, paddingTop: insets.top + 12 }]}>
        <TouchableOpacity style={s.backBtn} onPress={onVoltar} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={22} color="#fff" />
        </TouchableOpacity>
        <View style={s.headerMid}>
          <View style={s.headerTitleRow}>
            <Ionicons name={cfg.icon as any} size={18} color="#fff" />
            <Text style={s.headerTitle}>{cfg.label}</Text>
          </View>
          <Text style={s.headerDesc}>{cfg.desc}</Text>
        </View>
        {!loading && (
          <View style={s.countBadge}>
            <Text style={[s.countText, { color: cfg.color }]}>{produtos.length}</Text>
          </View>
        )}
      </View>

      {loading ? (
        <View style={s.center}>
          <ActivityIndicator size="large" color={cfg.color} />
        </View>
      ) : produtos.length === 0 ? (
        <View style={s.empty}>
          <View style={[s.emptyIcon, { backgroundColor: cfg.color + '18' }]}>
            <Ionicons name={cfg.icon as any} size={32} color={cfg.color} />
          </View>
          <Text style={s.emptyTitle}>Nenhum produto aqui</Text>
          <Text style={s.emptySub}>Não há produtos com status "{cfg.label}" no momento.</Text>
        </View>
      ) : (
        <FlatList
          data={produtos}
          keyExtractor={(p) => p.id}
          renderItem={renderItem}
          contentContainerStyle={s.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                carregar(true);
              }}
              tintColor={cfg.color}
            />
          }
          ListHeaderComponent={
            <View style={s.listHeader}>
              <Text style={s.listHeaderText}>
                {produtos.length} produto{produtos.length !== 1 ? 's' : ''} encontrado
                {produtos.length !== 1 ? 's' : ''}
              </Text>
              <Text style={s.listHeaderHint}>Toque no número para ajustar o estoque</Text>
            </View>
          }
        />
      )}

      {ajusteTarget && lojaId && token && (
        <AjusteRapidoModal
          visible
          produto={ajusteTarget}
          lojaId={lojaId}
          token={token}
          onClose={() => setAjusteTarget(null)}
          onSaved={(atualizado) => {
            setProdutos((prev) =>
              prev
                .map((p) => (p.id === atualizado.id ? { ...p, ...atualizado } : p))
                .filter((p) => calcNivel(p.estoque ?? 0, p.estoqueMinimo ?? 0) === nivel),
            );
            setAjusteTarget(null);
          }}
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  /* Header colorido */
  header: {
    paddingBottom: 20,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerMid: { flex: 1, gap: 3 },
  headerTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#fff' },
  headerDesc: { fontSize: 12, color: 'rgba(255,255,255,0.8)', fontWeight: '500' },
  countBadge: {
    backgroundColor: '#fff',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  countText: { fontSize: 16, fontWeight: '900' },

  /* Lista */
  list: { paddingHorizontal: 16, paddingBottom: 56 },
  listHeader: { paddingVertical: 16, gap: 2 },
  listHeaderText: { fontSize: 13, fontWeight: '700', color: C.text },
  listHeaderHint: { fontSize: 11, color: C.sub },

  /* Card de produto */
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: C.card,
    borderRadius: 16,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: C.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  thumb: { width: 50, height: 50, borderRadius: 13 },
  thumbFallback: { alignItems: 'center', justifyContent: 'center' },
  thumbLetter: { fontSize: 20, fontWeight: '800' },
  info: { flex: 1, gap: 2 },
  nome: { fontSize: 14, fontWeight: '700', color: C.text },
  preco: { fontSize: 13, fontWeight: '700', color: C.orange },
  categoria: { fontSize: 11, color: C.sub },
  right: { alignItems: 'center', gap: 6 },
  badge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20, alignItems: 'center' },
  badgeText: { color: '#fff', fontSize: 16, fontWeight: '900', lineHeight: 18 },
  badgeUnit: { color: 'rgba(255,255,255,0.8)', fontSize: 9, fontWeight: '600' },
  editBtn: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: C.bg,
    borderWidth: 1,
    borderColor: C.border,
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* Empty */
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 32 },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: { fontSize: 17, fontWeight: '800', color: C.text },
  emptySub: { fontSize: 13, color: C.sub, textAlign: 'center', lineHeight: 20 },
});
