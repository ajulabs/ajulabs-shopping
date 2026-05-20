import { useState } from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Produto } from '@ajulabs/types';
import { colors } from '../../../../theme';

function ProdutoThumb({ uri, nome, size = 88 }: { uri: string; nome: string; size?: number }) {
  const [error, setError] = useState(false);
  const s = { width: size, height: size, borderRadius: 12 };

  if (error || !uri) {
    return (
      <View style={[s, styles.thumbFallback]}>
        <Text style={[styles.thumbFallbackText, { fontSize: size * 0.38 }]}>
          {nome.charAt(0).toUpperCase()}
        </Text>
      </View>
    );
  }
  return (
    <Image
      source={{ uri }}
      style={[s, { overflow: 'hidden' }]}
      resizeMode="cover"
      onError={() => setError(true)}
    />
  );
}

export function ProdutoCard({
  produto,
  onEdit,
  onDelete,
}: {
  produto: Produto;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const preco = `R$ ${produto.preco.toFixed(2).replace('.', ',')}`;

  return (
    <View style={styles.card}>
      <ProdutoThumb uri={produto.imagem} nome={produto.nome} />

      <View style={styles.cardContent}>
        <View style={styles.cardTopRow}>
          <Text style={styles.cardNome} numberOfLines={2}>{produto.nome}</Text>
          <View style={[styles.badge, produto.disponivel ? styles.badgeOn : styles.badgeOff]}>
            <View style={[styles.badgeDot, produto.disponivel ? styles.badgeDotOn : styles.badgeDotOff]} />
            <Text style={[styles.badgeLabel, produto.disponivel ? styles.badgeLabelOn : styles.badgeLabelOff]}>
              {produto.disponivel ? 'Ativo' : 'Inativo'}
            </Text>
          </View>
        </View>

        <View style={styles.cardMidRow}>
          <Text style={styles.cardCategoria}>{produto.categoria}</Text>
          {produto.estoque != null && (
            <View style={[styles.estoqueBadge, produto.estoque === 0 && styles.estoqueBadgeZero]}>
              <Text style={[styles.estoqueBadgeText, produto.estoque === 0 && styles.estoqueBadgeTextZero]}>
                {produto.estoque === 0 ? 'Esgotado' : `${produto.estoque} un.`}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.cardBottomRow}>
          <Text style={styles.cardPreco}>{preco}</Text>
          <View style={styles.actions}>
            <TouchableOpacity style={styles.btnEdit} onPress={onEdit} activeOpacity={0.75}>
              <Ionicons name="pencil-outline" size={14} color={colors.n800} />
              <Text style={styles.btnEditText}>Editar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.btnDelete} onPress={onDelete} activeOpacity={0.75}>
              <Ionicons name="trash-outline" size={15} color="#DC2626" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  thumbFallback:        { backgroundColor: colors.orange100, alignItems: 'center', justifyContent: 'center' },
  thumbFallbackText:    { fontWeight: '800', color: colors.orange600 },

  card:                 { flexDirection: 'row', gap: 14, backgroundColor: colors.n0,
                          borderRadius: 16, padding: 14, borderWidth: 1, borderColor: colors.n200,
                          shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
                          shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  cardContent:          { flex: 1, justifyContent: 'space-between', gap: 4 },
  cardTopRow:           { flexDirection: 'row', alignItems: 'flex-start',
                          justifyContent: 'space-between', gap: 8 },
  cardNome:             { flex: 1, fontSize: 15, fontWeight: '700', color: colors.navy, lineHeight: 21 },
  cardCategoria:        { fontSize: 12, color: colors.n500, fontWeight: '500' },
  cardMidRow:           { flexDirection: 'row', alignItems: 'center',
                          justifyContent: 'space-between', gap: 6 },
  cardBottomRow:        { flexDirection: 'row', alignItems: 'center',
                          justifyContent: 'space-between', marginTop: 6 },
  cardPreco:            { fontSize: 18, fontWeight: '800', color: colors.orange },

  estoqueBadge:         { backgroundColor: colors.n100, borderRadius: 6,
                          paddingHorizontal: 7, paddingVertical: 3 },
  estoqueBadgeZero:     { backgroundColor: '#FEF2F2', borderColor: '#FECACA', borderWidth: 1 },
  estoqueBadgeText:     { fontSize: 10, fontWeight: '700', color: colors.n600 },
  estoqueBadgeTextZero: { color: '#DC2626' },

  actions:              { flexDirection: 'row', alignItems: 'center', gap: 8 },
  btnEdit:              { flexDirection: 'row', alignItems: 'center', gap: 5,
                          paddingHorizontal: 12, paddingVertical: 7,
                          borderRadius: 8, borderWidth: 1, borderColor: colors.n200,
                          backgroundColor: colors.n0 },
  btnEditText:          { fontSize: 12, fontWeight: '600', color: colors.n800 },
  btnDelete:            { width: 34, height: 34, borderRadius: 8, backgroundColor: '#FEF2F2',
                          borderWidth: 1, borderColor: '#FECACA',
                          alignItems: 'center', justifyContent: 'center' },

  badge:                { flexDirection: 'row', alignItems: 'center', gap: 5,
                          paddingHorizontal: 9, paddingVertical: 5,
                          borderRadius: 99, flexShrink: 0 },
  badgeDot:             { width: 6, height: 6, borderRadius: 3 },
  badgeDotOn:           { backgroundColor: '#16A34A' },
  badgeDotOff:          { backgroundColor: colors.n300 },
  badgeOn:              { backgroundColor: '#DCFCE7' },
  badgeOff:             { backgroundColor: colors.n100 },
  badgeLabel:           { fontSize: 11, fontWeight: '700' },
  badgeLabelOn:         { color: '#15803D' },
  badgeLabelOff:        { color: colors.n500 },
});
