import { useState } from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Produto } from '@ajulabs/types';
import { colors } from '@ajulabs/theme';
import { useTheme } from '../../../../../shared/hooks';

export function ProdutoSimilarCard({ produto }: { produto: Produto }) {
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
          onPress={() => router.push(`/(consumer)/produto/${produto.id}` as any)}
          disabled={!produto.disponivel}
          activeOpacity={0.8}
        >
          <Text style={styles.simBtnAddTxt}>+ Adicionar</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
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
});
