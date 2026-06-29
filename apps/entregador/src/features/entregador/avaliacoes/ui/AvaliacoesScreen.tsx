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
import { ACCENT, useAvaliacoes } from '../model/useAvaliacoes';
import { DashboardHeader } from './components/DashboardHeader';
import { SecaoTags } from './components/SecaoTags';
import { ListaAvaliacoes } from './components/ListaAvaliacoes';
import { EmptyState } from './components/EmptyState';
import { useMemo } from 'react';
import { useTheme } from '../../../../shared/hooks';
import type { Theme } from '../../../../shared/hooks/useTheme';

interface Props {
  onBack: () => void;
}

export function AvaliacoesScreen({ onBack }: Props) {
  const { data, loading, refreshing, erro, carregar, onRefresh } = useAvaliacoes();

  const theme = useTheme();
  const s = useMemo(() => makeStyles(theme), [theme]);
  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={onBack} activeOpacity={0.8}>
          <Ionicons name="chevron-back" size={20} color={theme.text} />
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

function makeStyles(theme: Theme) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: theme.bg },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      backgroundColor: theme.surf,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
      gap: 12,
    },
    backBtn: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: theme.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerTitle: { fontSize: 18, fontWeight: '700', color: theme.text, flex: 1 },

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
  });
}
