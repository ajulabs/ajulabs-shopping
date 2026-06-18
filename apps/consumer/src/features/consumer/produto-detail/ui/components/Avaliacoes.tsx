import { View, Text, Image, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AvaliacaoLoja } from '@ajulabs/types';
import { colors } from '@ajulabs/theme';
import { Stars } from './Stars';

export function AvaliacaoResumo({
  avaliacoes,
  text,
  textSec,
  borderL,
}: {
  avaliacoes: AvaliacaoLoja[];
  text: string;
  textSec: string;
  borderL: string;
}) {
  if (!avaliacoes.length) return null;

  const media =
    Math.round((avaliacoes.reduce((s, a) => s + a.nota, 0) / avaliacoes.length) * 10) / 10;
  const recomendam = Math.round(
    (avaliacoes.filter((a) => a.nota >= 4).length / avaliacoes.length) * 100,
  );

  const barras = [5, 4, 3, 2, 1].map((nota) => ({
    nota,
    count: avaliacoes.filter((a) => a.nota === nota).length,
    pct: Math.round((avaliacoes.filter((a) => a.nota === nota).length / avaliacoes.length) * 100),
  }));

  return (
    <View style={[styles.avResumoCard, { borderColor: borderL }]}>
      <View style={styles.avResumoTop}>
        <View style={styles.avResumoEsq}>
          <Text style={[styles.avMediaNum, { color: text }]}>{media}</Text>
          <Stars value={media} size={18} />
          <Text style={[styles.avBaseadoEm, { color: textSec }]}>
            Baseado em {avaliacoes.length} avaliação{avaliacoes.length > 1 ? 'ões' : ''}
          </Text>
          <Text style={[styles.avRecomenda, { color: textSec }]}>{recomendam}% recomendam</Text>
        </View>

        <View style={styles.avBarras}>
          {barras.map((b) => (
            <View key={b.nota} style={styles.avBarraRow}>
              <Text style={[styles.avBarraNota, { color: textSec }]}>{b.nota}</Text>
              <Ionicons name="star" size={10} color={colors.orange} />
              <View style={[styles.avBarraFundo, { backgroundColor: borderL }]}>
                <View style={[styles.avBarraFill, { width: `${b.pct}%` as any }]} />
              </View>
              <Text style={[styles.avBarraPct, { color: textSec }]}>{b.pct}%</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

export function AvaliacaoItem({
  av,
  text,
  textSec,
  surf,
  borderL,
}: {
  av: AvaliacaoLoja;
  text: string;
  textSec: string;
  surf: string;
  borderL: string;
}) {
  const data = new Date(av.criadoEm).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  return (
    <View style={[styles.avCard, { backgroundColor: surf, borderColor: borderL }]}>
      <View style={styles.avHeader}>
        <View style={styles.avAvatar}>
          {av.usuario.avatarUrl ? (
            <Image source={{ uri: av.usuario.avatarUrl }} style={styles.avAvatarImg} />
          ) : (
            <Text style={styles.avAvatarText}>{av.usuario.nome.charAt(0)}</Text>
          )}
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.avNome, { color: text }]}>{av.usuario.nome}</Text>
          <Text style={[styles.avData, { color: textSec }]}>{data}</Text>
        </View>
        <Stars value={av.nota} size={12} />
      </View>
      {av.comentario ? (
        <Text style={[styles.avComentario, { color: text }]}>{av.comentario}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  avResumoCard: { borderRadius: 12, borderWidth: 1, padding: 14, marginBottom: 4 },
  avResumoTop: { flexDirection: 'row', gap: 16, alignItems: 'flex-start' },
  avResumoEsq: { alignItems: 'center', gap: 4, minWidth: 90 },
  avMediaNum: { fontSize: 40, fontWeight: '800', lineHeight: 44 },
  avBaseadoEm: { fontSize: 11, textAlign: 'center', marginTop: 4, lineHeight: 15 },
  avRecomenda: { fontSize: 11, textAlign: 'center', lineHeight: 15 },
  avBarras: { flex: 1, gap: 4 },
  avBarraRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  avBarraNota: { fontSize: 11, width: 8, textAlign: 'right' },
  avBarraFundo: { flex: 1, height: 6, borderRadius: 3, overflow: 'hidden' },
  avBarraFill: { height: 6, borderRadius: 3, backgroundColor: colors.orange },
  avBarraPct: { fontSize: 10, width: 28, textAlign: 'right' },

  avCard: { borderRadius: 12, padding: 12, borderWidth: 1 },
  avHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.orange100,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avAvatarImg: { width: 34, height: 34 },
  avAvatarText: { fontSize: 14, fontWeight: '700', color: colors.orange600 },
  avNome: { fontSize: 13, fontWeight: '700' },
  avData: { fontSize: 11, marginTop: 1 },
  avComentario: { fontSize: 13, lineHeight: 19, marginTop: 10 },
});
