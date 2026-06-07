import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AvaliacaoService } from '@ajulabs/api-client';
import {
  TAGS_AVALIACAO_ENTREGADOR,
  type DashboardAvaliacoes,
  type AvaliacaoDetalhada,
  type TagAgregada,
} from '@ajulabs/types';
import { useAuthEntregadorStore } from '../../../../store';

interface Props {
  onBack: () => void;
}

const ACCENT = '#F2760F';

export function AvaliacoesScreen({ onBack }: Props) {
  const token = useAuthEntregadorStore((s) => s.token);

  const [data, setData] = useState<DashboardAvaliacoes | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [erro, setErro] = useState('');

  const carregar = useCallback(async () => {
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const dashboard = await AvaliacaoService.dashboardEntregador(token);
      setData(dashboard);
      setErro('');
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Erro ao carregar avaliações');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    carregar();
  }, [carregar]);

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={onBack} activeOpacity={0.8}>
          <Ionicons name="chevron-back" size={20} color="#000933" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Avaliações</Text>
        <View style={{ width: 36 }} />
      </View>

      {loading ? (
        <View style={s.centerLoader}>
          <ActivityIndicator color={ACCENT} />
        </View>
      ) : erro ? (
        <View style={s.errBox}>
          <Ionicons name="alert-circle-outline" size={48} color="#A32D2D" />
          <Text style={s.errTxt}>{erro}</Text>
          <TouchableOpacity onPress={carregar} style={s.errBtn} activeOpacity={0.8}>
            <Text style={s.errBtnTxt}>Tentar de novo</Text>
          </TouchableOpacity>
        </View>
      ) : !data || data.total === 0 ? (
        <EmptyState />
      ) : (
        <ScrollView
          contentContainerStyle={s.content}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          <DashboardHeader data={data} />
          <SecaoTags
            titulo="Pontos fortes"
            iconName="thumbs-up"
            iconColor="#15803D"
            bgIcone="#DCFCE7"
            tags={data.pontosFortes}
            vazio="Continue cuidando das entregas — em breve aparecerão destaques aqui."
          />
          <SecaoTags
            titulo="Pontos a melhorar"
            iconName="warning"
            iconColor="#B45309"
            bgIcone="#FEF3C7"
            tags={data.pontosAMelhorar}
            vazio="Nenhuma crítica recorrente. Mandou bem!"
          />
          <ListaAvaliacoes avaliacoes={data.avaliacoes} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

// ─── Componentes ──────────────────────────────────────────

function StarRow({ nota, size = 16 }: { nota: number; size?: number }) {
  return (
    <View style={{ flexDirection: 'row', gap: 2 }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Ionicons key={n} name={n <= nota ? 'star' : 'star-outline'} size={size} color="#F59E0B" />
      ))}
    </View>
  );
}

function DashboardHeader({ data }: { data: DashboardAvaliacoes }) {
  const maxBar = Math.max(...Object.values(data.distribuicao));
  return (
    <View style={s.headerCard}>
      <View style={s.headerCardTop}>
        <View style={{ alignItems: 'center' }}>
          <Text style={s.mediaNum}>{data.media.toFixed(1)}</Text>
          <StarRow nota={Math.round(data.media)} size={18} />
          <Text style={s.totalText}>
            {data.total} avaliaç{data.total === 1 ? 'ão' : 'ões'}
          </Text>
        </View>
        <View style={{ flex: 1, gap: 6 }}>
          {(['5', '4', '3', '2', '1'] as const).map((nota) => {
            const count = data.distribuicao[nota];
            const pct = maxBar > 0 ? (count / maxBar) * 100 : 0;
            return (
              <View key={nota} style={s.barRow}>
                <Text style={s.barNota}>{nota}</Text>
                <Ionicons name="star" size={11} color="#F59E0B" />
                <View style={s.barTrack}>
                  <View style={[s.barFill, { width: `${pct}%` }]} />
                </View>
                <Text style={s.barCount}>{count}</Text>
              </View>
            );
          })}
        </View>
      </View>
    </View>
  );
}

function SecaoTags({
  titulo,
  iconName,
  iconColor,
  bgIcone,
  tags,
  vazio,
}: {
  titulo: string;
  iconName: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  bgIcone: string;
  tags: TagAgregada[];
  vazio: string;
}) {
  return (
    <View style={s.section}>
      <View style={s.sectionHeader}>
        <View style={[s.sectionIcon, { backgroundColor: bgIcone }]}>
          <Ionicons name={iconName} size={14} color={iconColor} />
        </View>
        <Text style={s.sectionTitle}>{titulo}</Text>
      </View>
      {tags.length === 0 ? (
        <Text style={s.sectionEmpty}>{vazio}</Text>
      ) : (
        <View style={{ gap: 8 }}>
          {tags.map((t) => (
            <View key={t.tag.id} style={s.tagRow}>
              <Text style={s.tagLabel}>{t.tag.label}</Text>
              <View style={s.tagBadge}>
                <Text style={s.tagBadgeText}>
                  {t.count} mençã{t.count === 1 ? 'o' : 'ões'}
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

function ListaAvaliacoes({ avaliacoes }: { avaliacoes: AvaliacaoDetalhada[] }) {
  const tagLookup = new Map(TAGS_AVALIACAO_ENTREGADOR.map((t) => [t.id, t.label]));
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

function EmptyState() {
  return (
    <View style={s.emptyBox}>
      <View style={s.emptyIcon}>
        <Ionicons name="star-outline" size={32} color="#9099B3" />
      </View>
      <Text style={s.emptyTitle}>Ainda sem avaliações</Text>
      <Text style={s.emptyDesc}>
        Quando os clientes começarem a avaliar suas entregas, aparecerá aqui um resumo das notas e
        comentários.
      </Text>
    </View>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F6F7FB' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E4E7F1',
    gap: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F6F7FB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#000933', flex: 1 },

  centerLoader: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  errBox: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 12 },
  errTxt: { fontSize: 14, color: '#A32D2D', textAlign: 'center' },
  errBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 99,
    backgroundColor: ACCENT,
    marginTop: 8,
  },
  errBtnTxt: { color: '#FFFFFF', fontWeight: '700', fontSize: 13 },

  content: { padding: 16, paddingBottom: 40 },

  headerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E4E7F1',
    marginBottom: 16,
  },
  headerCardTop: { flexDirection: 'row', gap: 20, alignItems: 'center' },
  mediaNum: { fontSize: 40, fontWeight: '800', lineHeight: 44, color: ACCENT },
  totalText: { fontSize: 11, color: '#9099B3', marginTop: 4 },
  barRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  barNota: { fontSize: 11, color: '#9099B3', width: 10, textAlign: 'right' },
  barTrack: {
    flex: 1,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#F0F1F5',
    overflow: 'hidden',
  },
  barFill: { height: 7, borderRadius: 4, backgroundColor: ACCENT },
  barCount: { fontSize: 10, color: '#9099B3', width: 22, textAlign: 'right' },

  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E4E7F1',
    marginBottom: 12,
  },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  sectionIcon: {
    width: 26,
    height: 26,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: '#000933' },
  sectionEmpty: { fontSize: 12, color: '#9099B3', lineHeight: 17 },

  tagRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  tagLabel: { fontSize: 13, color: '#000933', fontWeight: '600' },
  tagBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 99,
    backgroundColor: '#F0F1F5',
  },
  tagBadgeText: { fontSize: 11, fontWeight: '700', color: '#000933' },

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
    backgroundColor: '#FEF0E3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avAvatarTxt: { fontSize: 13, fontWeight: '700', color: ACCENT },
  avNome: { fontSize: 13, fontWeight: '700', color: '#000933' },
  avData: { fontSize: 11, color: '#9099B3', marginTop: 1 },
  avComentario: { fontSize: 13, color: '#000933', lineHeight: 18, marginTop: 8 },
  avTagsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  avTagChip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 99,
    backgroundColor: '#FEF0E3',
  },
  avTagChipTxt: { fontSize: 11, color: ACCENT, fontWeight: '600' },

  emptyBox: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 12 },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#F0F1F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#000933' },
  emptyDesc: {
    fontSize: 13,
    color: '#9099B3',
    textAlign: 'center',
    lineHeight: 19,
    maxWidth: 280,
  },
});
