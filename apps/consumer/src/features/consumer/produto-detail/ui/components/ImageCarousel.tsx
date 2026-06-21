import { useState } from 'react';
import { View, Text, Image, ScrollView, StyleSheet, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@ajulabs/theme';

const { width: SCREEN_W } = Dimensions.get('window');

export function ImageCarousel({ imagens, nome }: { imagens: string[]; nome: string }) {
  const [current, setCurrent] = useState(0);
  const [errors, setErrors] = useState<Record<number, boolean>>({});

  if (!imagens.length) {
    return (
      <View style={styles.carouselFallback}>
        <Ionicons name="image-outline" size={48} color={colors.n300} />
      </View>
    );
  }

  return (
    <View style={styles.carouselWrapper}>
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={16}
        style={styles.carouselScroll}
        onScroll={(e) => {
          const idx = Math.round(e.nativeEvent.contentOffset.x / SCREEN_W);
          if (idx !== current) setCurrent(idx);
        }}
        onMomentumScrollEnd={(e) => {
          const idx = Math.round(e.nativeEvent.contentOffset.x / SCREEN_W);
          setCurrent(idx);
        }}
      >
        {imagens.map((uri, idx) =>
          errors[idx] ? (
            <View key={idx} style={styles.carouselImgFallback}>
              <Text style={styles.carouselImgFallbackText}>{nome.charAt(0)}</Text>
            </View>
          ) : (
            <Image
              key={idx}
              source={{ uri }}
              style={styles.carouselImg}
              resizeMode="contain"
              onError={() => setErrors((e) => ({ ...e, [idx]: true }))}
            />
          ),
        )}
      </ScrollView>
      {imagens.length > 1 && (
        <View style={styles.dots}>
          {imagens.map((_, idx) => (
            <View key={idx} style={[styles.dot, idx === current && styles.dotActive]} />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  carouselWrapper: { width: SCREEN_W, backgroundColor: '#f5f5f7' },
  carouselScroll: { height: 300 },
  carouselImg: { width: SCREEN_W, height: 300, backgroundColor: '#f5f5f7' },
  carouselImgFallback: {
    width: SCREEN_W,
    height: 300,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.orange100,
  },
  carouselImgFallbackText: { fontSize: 64, fontWeight: '700', color: colors.orange600 },
  carouselFallback: {
    width: SCREEN_W,
    height: 300,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.n100,
  },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 6, paddingVertical: 10 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.n300 },
  dotActive: { backgroundColor: colors.orange, width: 18 },
});
