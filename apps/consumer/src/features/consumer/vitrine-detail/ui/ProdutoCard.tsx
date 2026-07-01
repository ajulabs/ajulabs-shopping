import { useState, useCallback, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Produto } from '@ajulabs/types';
import { colors } from '@ajulabs/theme';

interface ProdutoCardProps {
  produto: Produto;
  onAdd: (id: string) => void;
  dark?: boolean;
}

function ProductImg({ uri, alt }: { uri: string; alt: string }) {
  const [error, setError] = useState(false);
  if (error || !uri) {
    return (
      <View style={styles.imgFallback}>
        <Text style={styles.imgFallbackText}>{alt.charAt(0)}</Text>
      </View>
    );
  }
  return (
    <Image
      source={uri}
      style={styles.img}
      contentFit="cover"
      transition={150}
      cachePolicy="memory-disk"
      onError={() => setError(true)}
    />
  );
}

export function ProdutoCard({ produto, onAdd, dark = false }: ProdutoCardProps) {
  const router = useRouter();
  const textColor = dark ? colors.n0 : colors.navy;
  const subColor = dark ? 'rgba(255,255,255,0.6)' : colors.n600;
  const surface = dark ? colors.surfDark : colors.n0;
  const border = dark ? 'rgba(255,255,255,0.06)' : colors.n200;
  // No dark o pastel claro "estoura" sobre o card escuro: troca por tint translúcido
  // da laranja da marca + texto laranja claro para manter contraste.
  const btnAddBg = dark ? 'rgba(242,118,15,0.18)' : colors.orange100;
  const btnAddColor = dark ? '#FDBA74' : colors.orange600;

  const [added, setAdded] = useState(false);
  const scale = useRef(new Animated.Value(1)).current;

  const handleAdd = useCallback(() => {
    if (added) {
      router.push('/(consumer)/carrinho');
      return;
    }
    // Sempre abre a PDP para que o usuário confirme opções antes de adicionar
    router.push(`/(consumer)/produto/${produto.id}` as any);
  }, [added, produto.id, router]);

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: surface, borderColor: border }]}
      onPress={() => router.push(`/(consumer)/produto/${produto.id}` as any)}
      activeOpacity={0.92}
    >
      <View>
        <ProductImg uri={produto.imagem} alt={produto.nome} />
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
        <Animated.View style={{ transform: [{ scale }] }}>
          <TouchableOpacity
            style={[
              styles.btnAdd,
              { backgroundColor: added ? colors.orange : btnAddBg },
              !produto.disponivel && { opacity: 0.4 },
            ]}
            onPress={handleAdd}
            disabled={!produto.disponivel}
            activeOpacity={0.8}
          >
            {added ? (
              <>
                <Ionicons name="cart" size={13} color={colors.n0} />
                <Text style={styles.btnAddedText}>Ver carrinho</Text>
                <Ionicons name="chevron-forward" size={11} color={colors.n0} />
              </>
            ) : (
              <Text style={[styles.btnAddText, { color: btnAddColor }]}>+ Adicionar</Text>
            )}
          </TouchableOpacity>
        </Animated.View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 14, overflow: 'hidden', borderWidth: 1, flexShrink: 0 },
  img: { width: '100%', aspectRatio: 4 / 3 },
  imgFallback: {
    width: '100%',
    aspectRatio: 4 / 3,
    backgroundColor: colors.orange100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imgFallbackText: { fontSize: 28, fontWeight: '700', color: colors.orange600 },
  info: { padding: 10 },
  nome: { fontSize: 12.5, fontWeight: '600', lineHeight: 16, minHeight: 30 },
  desc: { fontSize: 11, marginTop: 2, lineHeight: 15, minHeight: 28 },
  preco: { fontSize: 14, fontWeight: '700', marginTop: 4 },
  badgeDestaque: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: colors.orange,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 99,
  },
  badgeDestaqueText: { color: colors.n0, fontSize: 9, fontWeight: '700' },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlayText: { color: colors.n0, fontSize: 12, fontWeight: '700' },
  btnAdd: {
    width: '100%',
    height: 30,
    borderRadius: 8,
    marginTop: 8,
    backgroundColor: colors.orange100,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  btnAddText: { color: colors.orange600, fontSize: 12, fontWeight: '600' },
  btnAddedText: { color: colors.n0, fontSize: 12, fontWeight: '600' },
});
