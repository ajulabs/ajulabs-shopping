// src/features/consumer/vitrines/ui/LojaCard.tsx
import { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { Loja } from '@ajulabs/types';
import { colors } from '@ajulabs/theme';

interface LojaCardProps {
  loja: Loja;
  onPress: (id: string) => void;
  dark?: boolean;
}

function LojaImg({ uri, nome }: { uri: string; nome: string }) {
  const [error, setError] = useState(false);
  if (error) {
    return (
      <View style={styles.imgFallback}>
        <Text style={styles.imgFallbackText}>{nome.charAt(0)}</Text>
      </View>
    );
  }
  return (
    <Image
      source={{ uri }}
      style={styles.img}
      onError={() => setError(true)}
    />
  );
}

function Stars({ value }: { value: number }) {
  const stars = Array.from({ length: 5 }, (_, i) => i < Math.floor(value) ? '★' : '☆');
  return <Text style={styles.stars}>{stars.join('')}</Text>;
}

export function LojaCard({ loja, onPress, dark = false }: LojaCardProps) {
  const textColor = dark ? colors.n0   : colors.navy;
  const subColor  = dark ? 'rgba(255,255,255,0.6)' : colors.n600;
  const surface   = dark ? colors.surfDark : colors.n0;
  const border    = dark ? 'rgba(255,255,255,0.06)' : colors.n200;

  const handlePress = useCallback(() => onPress(loja.id), [loja.id, onPress]);

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: surface, borderColor: border }]}
      onPress={handlePress}
      activeOpacity={0.85}
    >
      <LojaImg uri={loja.imagem} nome={loja.nome} />

      <View style={styles.info}>
        <Text style={[styles.nome, { color: textColor }]} numberOfLines={1}>
          {loja.nome}
        </Text>
        <Text style={[styles.sub, { color: subColor }]}>
          {loja.endereco.bairro} · {loja.tempoEntregaMin}–{loja.tempoEntregaMax} min
        </Text>
        <View style={styles.row}>
          <Stars value={loja.avaliacao} />
          <Text style={[styles.aval, { color: subColor }]}>
            · {loja.totalAvaliacoes} avaliações
          </Text>
          {loja.taxaEntrega === 0 && (
            <View style={styles.badgeMint}>
              <Text style={styles.badgeMintText}>Frete grátis</Text>
            </View>
          )}
        </View>
        {!loja.aberta && (
          <View style={styles.badgeFechado}>
            <Text style={styles.badgeFechadoText}>Fechado agora</Text>
          </View>
        )}
      </View>

      <Text style={{ color: subColor, fontSize: 20, alignSelf: 'center' }}>›</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card:            { flexDirection: 'row', gap: 12, padding: 12, borderRadius: 14, borderWidth: 1 },
  img:             { width: 64, height: 64, borderRadius: 10 },
  imgFallback:     { width: 64, height: 64, borderRadius: 10,
                     backgroundColor: colors.orange100,
                     alignItems: 'center', justifyContent: 'center' },
  imgFallbackText: { fontSize: 24, fontWeight: '700', color: colors.orange600 },
  info:            { flex: 1, minWidth: 0 },
  nome:            { fontSize: 14, fontWeight: '600', lineHeight: 17 },
  sub:             { fontSize: 11, marginTop: 2 },
  row:             { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6, flexWrap: 'wrap' },
  aval:            { fontSize: 11 },
  stars:           { color: colors.orange, fontSize: 11, letterSpacing: 1 },
  badgeMint:       { backgroundColor: 'rgba(57,255,137,0.15)',
                     paddingHorizontal: 6, paddingVertical: 2, borderRadius: 99, marginLeft: 4 },
  badgeMintText:   { fontSize: 10, fontWeight: '600', color: '#046C2E' },
  badgeFechado:    { marginTop: 6, backgroundColor: 'rgba(107,115,144,0.15)',
                     paddingHorizontal: 6, paddingVertical: 2, borderRadius: 99, alignSelf: 'flex-start' },
  badgeFechadoText:{ fontSize: 10, fontWeight: '600', color: colors.n600 },
});