// src/features/consumer/vitrines/ui/LojaDestaqueCard.tsx
import { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { Loja } from '@ajulabs/types';
import { colors } from '@ajulabs/theme';

interface LojaDestaqueCardProps {
  loja: Loja;
  width: number;
  onPress: (id: string) => void;
  dark?: boolean;
}

export function LojaDestaqueCard({ loja, width, onPress, dark = false }: LojaDestaqueCardProps) {
  const [imgError, setImgError] = useState(false);

  const textColor = dark ? colors.n0 : colors.navy;
  const subColor  = dark ? 'rgba(255,255,255,0.6)' : colors.n600;
  const surface   = dark ? colors.surfDark : colors.n0;
  const border    = dark ? 'rgba(255,255,255,0.06)' : colors.n200;

  const handlePress = useCallback(() => onPress(loja.id), [loja.id, onPress]);

  return (
    <TouchableOpacity
      style={[styles.card, { width, backgroundColor: surface, borderColor: border }]}
      onPress={handlePress}
      activeOpacity={0.85}
    >
      <View style={styles.imgWrapper}>
        {imgError ? (
          <View style={[styles.img, styles.imgFallback]}>
            <Text style={styles.imgFallbackText}>{loja.nome.charAt(0)}</Text>
          </View>
        ) : (
          <Image
            source={{ uri: loja.imagem }}
            style={styles.img}
            onError={() => setImgError(true)}
          />
        )}
        <View style={styles.imgOverlay} />
        <View style={styles.badgeDestaque}>
          <Text style={styles.badgeDestaqueText}>⭐ Destaque</Text>
        </View>
      </View>

      <View style={styles.info}>
        <Text style={[styles.nome, { color: textColor }]} numberOfLines={1}>
          {loja.nome}
        </Text>
        <Text style={[styles.descricao, { color: subColor }]} numberOfLines={2}>
          {loja.descricao}
        </Text>
        <View style={styles.row}>
          <Text style={styles.rating}>★ {loja.avaliacao.toFixed(1)}</Text>
          <Text style={[styles.totalAval, { color: subColor }]}>
            ({loja.totalAvaliacoes})
          </Text>
          <Text style={[styles.sep, { color: subColor }]}>·</Text>
          <Text style={[styles.tempo, { color: subColor }]}>
            {loja.tempoEntregaMin}–{loja.tempoEntregaMax} min
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card:            { borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
  imgWrapper:      { width: '100%', height: 130, position: 'relative' },
  img:             { width: '100%', height: '100%' },
  imgFallback:     { backgroundColor: colors.orange100,
                     alignItems: 'center', justifyContent: 'center' },
  imgFallbackText: { fontSize: 48, fontWeight: '700', color: colors.orange600 },
  imgOverlay:      { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                     backgroundColor: 'rgba(0,9,51,0.15)' },
  badgeDestaque:   { position: 'absolute', top: 10, left: 10,
                     backgroundColor: colors.orange,
                     paddingHorizontal: 9, paddingVertical: 4, borderRadius: 99 },
  badgeDestaqueText: { color: colors.n0, fontSize: 10, fontWeight: '700', letterSpacing: 0.3 },
  info:            { padding: 12 },
  nome:            { fontSize: 15, fontWeight: '700', letterSpacing: -0.2 },
  descricao:       { fontSize: 11.5, marginTop: 3, lineHeight: 15 },
  row:             { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8 },
  rating:          { fontSize: 12.5, fontWeight: '700', color: colors.orange },
  totalAval:       { fontSize: 11 },
  sep:             { fontSize: 11, marginHorizontal: 2 },
  tempo:           { fontSize: 11, fontWeight: '500' },
});