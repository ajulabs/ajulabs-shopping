import { useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Loja } from '@ajulabs/types';
import { colors } from '@ajulabs/theme';

interface Props {
  lojas: Loja[];
  onAbrirVitrine: (id: string) => void;
  dark?: boolean;
}

function calcularScore(loja: Loja): number {
  const PRIOR_AVALIACOES = 50;
  const PRIOR_NOTA = 4.5;
  return (
    (loja.avaliacao * loja.totalAvaliacoes + PRIOR_NOTA * PRIOR_AVALIACOES) /
    (loja.totalAvaliacoes + PRIOR_AVALIACOES)
  );
}

export function LojasDestaque({ lojas, onAbrirVitrine, dark = false }: Props) {
  const textColor = dark ? colors.n0 : colors.navy;
  const subColor  = dark ? 'rgba(255,255,255,0.6)' : colors.n600;
  const surface   = dark ? colors.surfDark : colors.n0;
  const border    = dark ? 'rgba(255,255,255,0.06)' : colors.n200;

  const destaques = useMemo(() => {
    return lojas
      .filter(l => l.aberta)
      .map(l => ({ loja: l, score: calcularScore(l) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map(({ loja }) => loja);
  }, [lojas]);

  if (destaques.length === 0) return null;

  return (
    <View style={s.container}>
      <View style={s.tituloRow}>
        <Ionicons name="star" size={14} color={colors.orange} />
        <Text style={[s.titulo, { color: textColor }]}>Destaques</Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.scroll}>
        {destaques.map(loja => (
          <TouchableOpacity
            key={loja.id}
            style={[s.card, { backgroundColor: surface, borderColor: border }]}
            onPress={() => onAbrirVitrine(loja.id)}
            activeOpacity={0.88}
          >
            <Image source={{ uri: loja.imagem }} style={s.img} />
            <View style={s.imgOverlay} />
            <View style={s.badgeDestaque}>
              <Ionicons name="star" size={10} color="#fff" />
              <Text style={s.badgeText}>Destaque</Text>
            </View>

            <View style={s.info}>
              <Text style={[s.nome, { color: textColor }]} numberOfLines={1}>{loja.nome}</Text>
              <Text style={[s.desc, { color: subColor }]} numberOfLines={1}>
                {loja.descricao}
              </Text>
              <View style={s.row}>
                <Ionicons name="star" size={12} color={colors.orange} />
                <Text style={s.rating}>{loja.avaliacao.toFixed(1)}</Text>
                <Text style={[s.sub, { color: subColor }]}>· {loja.tempoEntregaMin}–{loja.tempoEntregaMax} min</Text>
              </View>
              <TouchableOpacity
                style={s.btnVer}
                onPress={() => onAbrirVitrine(loja.id)}
                activeOpacity={0.85}
              >
                <Text style={s.btnVerText}>Ver loja</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const CARD_WIDTH = 200;

const s = StyleSheet.create({
  container:     { paddingTop: 16, paddingBottom: 4 },
  tituloRow:     { flexDirection: 'row', alignItems: 'center', gap: 6,
                   paddingHorizontal: 16, marginBottom: 12 },
  titulo:        { fontSize: 15, fontWeight: '700', letterSpacing: -0.2 },
  scroll:        { paddingHorizontal: 16, gap: 12 },
  card:          { width: CARD_WIDTH, borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
  img:           { width: '100%', height: 110 },
  imgOverlay:    { position: 'absolute', top: 0, left: 0, right: 0, height: 110,
                   backgroundColor: 'rgba(0,9,51,0.18)' },
  badgeDestaque: { position: 'absolute', top: 10, left: 10, flexDirection: 'row',
                   alignItems: 'center', gap: 3,
                   backgroundColor: colors.orange,
                   paddingHorizontal: 8, paddingVertical: 3, borderRadius: 99 },
  badgeText:     { color: '#fff', fontSize: 10, fontWeight: '700' },
  info:          { padding: 10 },
  nome:          { fontSize: 13.5, fontWeight: '700', letterSpacing: -0.2 },
  desc:          { fontSize: 11, marginTop: 2, color: '#9099B3' },
  row:           { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 5 },
  rating:        { fontSize: 12, fontWeight: '700', color: colors.orange },
  sub:           { fontSize: 11 },
  btnVer:        { marginTop: 10, backgroundColor: colors.orange,
                   borderRadius: 10, paddingVertical: 7, alignItems: 'center' },
  btnVerText:    { fontSize: 12.5, fontWeight: '700', color: '#fff' },
});
