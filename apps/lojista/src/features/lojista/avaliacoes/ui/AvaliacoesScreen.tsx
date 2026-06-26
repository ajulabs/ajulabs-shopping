import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TAGS_AVALIACAO_LOJA } from '@ajulabs/types';
import { useAvaliacoes } from '../model/useAvaliacoes';
import { DashboardHeader } from './components/DashboardHeader';
import { SecaoTags } from './components/SecaoTags';
import { ListaAvaliacoes } from './components/AvaliacaoDetalhada';
import { EmptyState } from './components/EmptyState';
import { useTheme } from '../../../../shared/hooks';

export function AvaliacoesScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { data, loading, refreshing, erro, carregar, onRefresh } = useAvaliacoes();

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: theme.bg }]}>
      <View style={[s.header, { backgroundColor: theme.surf, borderBottomColor: theme.border }]}>
        <TouchableOpacity
          style={[s.backBtn, { backgroundColor: theme.backBtn }]}
          onPress={() => router.navigate('/(lojista)/perfil' as any)}
          activeOpacity={0.8}
        >
          <Ionicons name="chevron-back" size={20} color={theme.text} />
        </TouchableOpacity>
        <Text style={[s.headerTitle, { color: theme.text }]}>Avaliações</Text>
        <View style={{ width: 36 }} />
      </View>

      {loading ? (
        <View style={s.centerLoader}>
          <ActivityIndicator color="#DE6708" />
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
          <DashboardHeader data={data} accentColor="#DE6708" tagCatalog={TAGS_AVALIACAO_LOJA} />
          <SecaoTags
            titulo="Pontos fortes"
            iconName="thumbs-up"
            iconColor="#15803D"
            bgIcone="#DCFCE7"
            tags={data.pontosFortes}
            vazio="Ainda sem destaques positivos suficientes."
          />
          <SecaoTags
            titulo="Pontos a melhorar"
            iconName="warning"
            iconColor="#B45309"
            bgIcone="#FEF3C7"
            tags={data.pontosAMelhorar}
            vazio="Nenhum padrão de crítica recorrente. Continue assim!"
          />
          <ListaAvaliacoes avaliacoes={data.avaliacoes} tagCatalog={TAGS_AVALIACAO_LOJA} />
        </ScrollView>
      )}
    </SafeAreaView>
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
    backgroundColor: '#DE6708',
    marginTop: 8,
  },
  errBtnTxt: { color: '#FFFFFF', fontWeight: '700', fontSize: 13 },

  content: { padding: 16, paddingBottom: 40 },
});
