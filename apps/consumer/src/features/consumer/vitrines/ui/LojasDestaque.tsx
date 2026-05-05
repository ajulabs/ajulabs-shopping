// src/features/consumer/vitrines/ui/LojasDestaque.tsx
import { useMemo, useState, useRef, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet, Dimensions,
  NativeScrollEvent, NativeSyntheticEvent,
} from 'react-native';
import { LOJAS } from '@ajulabs/api-client';
import { Loja } from '@ajulabs/types';
import { colors } from '@ajulabs/theme';
import { LojaDestaqueCard } from './LojaDestaqueCard';

interface LojasDestaqueProps {
  onAbrirVitrine: (id: string) => void;
  dark?: boolean;
}

const SCREEN_WIDTH = Dimensions.get('window').width;
const CARD_GAP = 12;
const SIDE_PADDING = 16;
const CARD_WIDTH = Math.round(SCREEN_WIDTH * 0.72);
const SNAP_INTERVAL = CARD_WIDTH + CARD_GAP;

// Score combinando nota + número de avaliações.
// Lojas com poucas avaliações ficam ancoradas em 4.5 (média global de prior).
function calcularScore(loja: Loja): number {
  const PRIOR_AVALIACOES = 50;
  const PRIOR_NOTA = 4.5;
  return (
    (loja.avaliacao * loja.totalAvaliacoes + PRIOR_NOTA * PRIOR_AVALIACOES) /
    (loja.totalAvaliacoes + PRIOR_AVALIACOES)
  );
}

export function LojasDestaque({ onAbrirVitrine, dark = false }: LojasDestaqueProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef<FlatList<Loja>>(null);

  const textColor = dark ? colors.n0 : colors.navy;
  const subColor  = dark ? 'rgba(255,255,255,0.6)' : colors.n600;
  const dotInactive = dark ? 'rgba(255,255,255,0.2)' : colors.n200;

  // Top 3 lojas abertas, ordenadas por score
  const destaques = useMemo(() => {
    return LOJAS
      .filter(l => l.aberta)
      .map(l => ({ loja: l, score: calcularScore(l) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map(({ loja }) => loja);
  }, []);

  const handleScroll = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = e.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / SNAP_INTERVAL);
    setActiveIndex(index);
  }, []);

  if (destaques.length === 0) return null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.titulo, { color: textColor }]}>⭐ Destaques de Aracaju</Text>
        <Text style={[styles.subtitulo, { color: subColor }]}>
          As mais bem avaliadas
        </Text>
      </View>

      <FlatList
        ref={flatListRef}
        data={destaques}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <LojaDestaqueCard
            loja={item}
            width={CARD_WIDTH}
            onPress={onAbrirVitrine}
            dark={dark}
          />
        )}
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={SNAP_INTERVAL}
        decelerationRate="fast"
        contentContainerStyle={styles.lista}
        ItemSeparatorComponent={() => <View style={{ width: CARD_GAP }} />}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      />

      <View style={styles.dots}>
        {destaques.map((_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              {
                backgroundColor: i === activeIndex ? colors.orange : dotInactive,
                width: i === activeIndex ? 22 : 6,
              },
            ]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container:  { paddingTop: 16, paddingBottom: 8 },
  header:     { paddingHorizontal: 16, marginBottom: 12 },
  titulo:     { fontSize: 16, fontWeight: '700', letterSpacing: -0.2 },
  subtitulo:  { fontSize: 12, marginTop: 2 },
  lista:      { paddingHorizontal: SIDE_PADDING },
  dots:       { flexDirection: 'row', justifyContent: 'center',
                gap: 6, marginTop: 12, alignItems: 'center' },
  dot:        { height: 6, borderRadius: 3 },
});