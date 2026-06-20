import { View, Text, StyleSheet } from 'react-native';
import { type AvaliacaoDetalhada } from '@ajulabs/types';
import { StarRow } from './StarRow';
import type { TagCatalog } from '../../lib/types';

export function ListaAvaliacoes({
  avaliacoes,
  tagCatalog,
}: {
  avaliacoes: AvaliacaoDetalhada[];
  tagCatalog: TagCatalog;
}) {
  const tagLookup = new Map(tagCatalog.map((t) => [t.id, t.label]));
  if (avaliacoes.length === 0) return null;

  return (
    <View style={s.section}>
      <Text style={s.sectionTitle}>Últimas avaliações</Text>
      <View style={{ gap: 12, marginTop: 12 }}>
        {avaliacoes.map((av) => (
          <View key={av.id} style={s.avCard}>
            <View style={s.avHeader}>
              <View style={s.avAvatar}>
                <Text style={s.avAvatarTxt}>
                  {(av.usuario.nome ?? '?').charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.avNome}>{av.usuario.nome}</Text>
                <Text style={s.avData}>
                  {new Date(av.criadoEm).toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  })}
                </Text>
              </View>
              <StarRow nota={av.nota} />
            </View>
            {av.comentario ? <Text style={s.avComentario}>{av.comentario}</Text> : null}
            {av.tags.length > 0 && (
              <View style={s.avTagsWrap}>
                {av.tags.map((id) => (
                  <View key={id} style={s.avTagChip}>
                    <Text style={s.avTagChipTxt}>{tagLookup.get(id) ?? id}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        ))}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E4E7F1',
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: '#000933' },

  avCard: {
    backgroundColor: '#FAFBFE',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E4E7F1',
  },
  avHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFF0E6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avAvatarTxt: { fontSize: 13, fontWeight: '700', color: '#DE6708' },
  avNome: { fontSize: 13, fontWeight: '700', color: '#000933' },
  avData: { fontSize: 11, color: '#9099B3', marginTop: 1 },
  avComentario: { fontSize: 13, color: '#000933', lineHeight: 18, marginTop: 8 },
  avTagsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  avTagChip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 99,
    backgroundColor: '#FFF0E6',
  },
  avTagChipTxt: { fontSize: 11, color: '#DE6708', fontWeight: '600' },
});
