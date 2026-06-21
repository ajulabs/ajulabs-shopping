import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Produto } from '@ajulabs/types';
import { calcNivel } from '../../../../../entities/produto';
import { C, NIVEL_CFG } from '../../lib/dashboardTheme';

export function ProdutoRow({
  produto,
  hasImgError,
  onImgError,
  onAjuste,
  onEditar,
  onDelete,
}: {
  produto: Produto;
  hasImgError: boolean;
  onImgError: () => void;
  onAjuste: () => void;
  onEditar: () => void;
  onDelete: () => void;
}) {
  const nivel = calcNivel(produto.estoque ?? 0, produto.estoqueMinimo ?? 0);
  const cfg = NIVEL_CFG[nivel];
  const hasImg = produto.imagem && !hasImgError;

  return (
    <View style={s.prodRow}>
      {hasImg ? (
        <Image
          source={{ uri: produto.imagem }}
          style={s.prodThumb}
          resizeMode="cover"
          onError={onImgError}
        />
      ) : (
        <View style={[s.prodThumb, s.prodThumbFallback]}>
          <Text style={s.prodThumbLetter}>{produto.nome.charAt(0).toUpperCase()}</Text>
        </View>
      )}
      <View style={s.prodInfo}>
        <Text style={s.prodNome} numberOfLines={1}>
          {produto.nome}
        </Text>
        <Text style={s.prodPreco}>R$ {Number(produto.preco).toFixed(2).replace('.', ',')}</Text>
      </View>
      <View style={s.prodRight}>
        <TouchableOpacity
          style={[s.stockBadge, { backgroundColor: cfg.color }]}
          onPress={onAjuste}
          activeOpacity={0.8}
        >
          <Text style={s.stockBadgeText}>{produto.estoque ?? 0}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.prodAction} onPress={onEditar} activeOpacity={0.7}>
          <Ionicons name="pencil-outline" size={15} color={C.sub} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[s.prodAction, { backgroundColor: '#FEE2E2' }]}
          onPress={onDelete}
          activeOpacity={0.7}
        >
          <Ionicons name="trash-outline" size={15} color={C.red} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  prodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: C.card,
    borderRadius: 14,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: C.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  prodThumb: { width: 46, height: 46, borderRadius: 12 },
  prodThumbFallback: {
    backgroundColor: C.orange + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  prodThumbLetter: { fontSize: 18, fontWeight: '800', color: C.orange },
  prodInfo: { flex: 1 },
  prodNome: { fontSize: 14, fontWeight: '700', color: C.text },
  prodPreco: { fontSize: 13, color: C.orange, fontWeight: '700', marginTop: 2 },
  prodRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  stockBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stockBadgeText: { color: '#fff', fontSize: 13, fontWeight: '800' },
  prodAction: {
    width: 32,
    height: 32,
    borderRadius: 9,
    backgroundColor: C.bg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: C.border,
  },
});
