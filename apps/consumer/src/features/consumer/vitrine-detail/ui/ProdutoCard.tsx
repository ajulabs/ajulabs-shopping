// src/features/consumer/vitrine-detail/ui/ProdutoCard.tsx
import { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { Produto } from '@ajulabs/types';
import { colors } from '@ajulabs/theme';

interface ProdutoCardProps {
  produto: Produto;
  onAdd: (id: string) => void;
  dark?: boolean;
}

function ProductImg({ uri, alt, width, height }: {
  uri: string; alt: string; width: number; height: number;
}) {
  const [error, setError] = useState(false);
  if (error) {
    return (
      <View style={{ width, height, backgroundColor: colors.orange100,
        alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ fontSize: height * 0.3, fontWeight: '700', color: colors.orange600 }}>
          {alt.charAt(0)}
        </Text>
      </View>
    );
  }
  return (
    <Image source={{ uri }} style={{ width, height }} onError={() => setError(true)} />
  );
}

export function ProdutoCard({ produto, onAdd, dark = false }: ProdutoCardProps) {
  const textColor = dark ? colors.n0 : colors.navy;
  const subColor  = dark ? 'rgba(255,255,255,0.6)' : colors.n600;
  const surface   = dark ? colors.surfDark : colors.n0;
  const border    = dark ? 'rgba(255,255,255,0.06)' : colors.n200;

  const handleAdd = useCallback(() => onAdd(produto.id), [produto.id, onAdd]);

  return (
    <View style={[styles.card, { backgroundColor: surface, borderColor: border }]}>
      <View>
        <ProductImg uri={produto.imagem} alt={produto.nome} width={160} height={130} />
        {produto.destaque && (
          <View style={styles.badgeDestaque}>
            <Text style={styles.badgeDestaqueText}>⭐ Destaque</Text>
          </View>
        )}
        {!produto.disponivel && (
          <View style={styles.overlay}>
            <Text style={styles.overlayText}>Indisponível</Text>
          </View>
        )}
      </View>

      <View style={styles.info}>
        <Text style={[styles.nome, { color: textColor }]} numberOfLines={2}>
          {produto.nome}
        </Text>
        <Text style={[styles.desc, { color: subColor }]} numberOfLines={2}>
          {produto.descricao}
        </Text>
        <Text style={[styles.preco, { color: textColor }]}>
          R$ {produto.preco.toFixed(2).replace('.', ',')}
        </Text>
        <TouchableOpacity
          style={[styles.btnAdd, !produto.disponivel && { opacity: 0.4 }]}
          onPress={handleAdd}
          disabled={!produto.disponivel}
          activeOpacity={0.8}
        >
          <Text style={styles.btnAddText}>+ Adicionar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card:              { borderRadius: 14, overflow: 'hidden', borderWidth: 1 },
  info:              { padding: 10 },
  nome:              { fontSize: 12.5, fontWeight: '600', lineHeight: 16, minHeight: 30 },
  desc:              { fontSize: 11, marginTop: 2, lineHeight: 15, minHeight: 28 },
  preco:             { fontSize: 14, fontWeight: '700', marginTop: 4 },
  badgeDestaque:     { position: 'absolute', top: 8, left: 8,
                       backgroundColor: colors.orange,
                       paddingHorizontal: 7, paddingVertical: 3, borderRadius: 99 },
  badgeDestaqueText: { color: colors.n0, fontSize: 9, fontWeight: '700' },
  overlay:           { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                       backgroundColor: 'rgba(0,0,0,0.45)',
                       alignItems: 'center', justifyContent: 'center' },
  overlayText:       { color: colors.n0, fontSize: 12, fontWeight: '700' },
  btnAdd:            { width: '100%', height: 30, borderRadius: 8, marginTop: 8,
                       backgroundColor: colors.orange100,
                       alignItems: 'center', justifyContent: 'center' },
  btnAddText:        { color: colors.orange600, fontSize: 12, fontWeight: '600' },
});