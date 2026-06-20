import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Modal,
  Pressable,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { StatusSolicitacaoPreco } from '@ajulabs/types';
import { colors } from '../../../../theme';
import { STATUS_CFG, moeda } from '../lib/solicitacoes';
import { useSolicitacoes } from '../model/useSolicitacoes';
import { SolicitacaoCard } from './components/SolicitacaoCard';

interface Props {
  onVoltar: () => void;
}

export function SolicitacoesPrecoScreen({ onVoltar }: Props) {
  const insets = useSafeAreaInsets();
  const {
    solicitacoes,
    loading,
    refreshing,
    setRefreshing,
    filtroStatus,
    setFiltroStatus,
    revisaoModal,
    setRevisaoModal,
    notaRevisao,
    setNotaRevisao,
    processando,
    carregar,
    revisar,
    canApprovePrice,
    isFuncionario,
  } = useSolicitacoes();

  const filtros: (StatusSolicitacaoPreco | undefined)[] = [
    undefined,
    'pendente',
    'aprovado',
    'rejeitado',
  ];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity onPress={onVoltar} hitSlop={12} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.navy} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {isFuncionario ? 'Minhas solicitações' : 'Solicitações de preço'}
        </Text>
      </View>

      {/* Filtros */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filtrosRow}
      >
        {filtros.map((f) => (
          <TouchableOpacity
            key={f ?? 'todos'}
            style={[styles.filtroBtn, filtroStatus === f && styles.filtroBtnAtivo]}
            onPress={() => setFiltroStatus(f)}
          >
            <Text style={[styles.filtroText, filtroStatus === f && styles.filtroTextAtivo]}>
              {f ? STATUS_CFG[f].label : 'Todos'}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.orange} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.lista}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                carregar(true);
              }}
            />
          }
        >
          {solicitacoes.length === 0 && (
            <Text style={styles.emptyText}>Nenhuma solicitação encontrada.</Text>
          )}
          {solicitacoes.map((sol) => (
            <SolicitacaoCard
              key={sol.id}
              solicitacao={sol}
              isFuncionario={isFuncionario}
              canApprovePrice={canApprovePrice}
              onAprovar={(s) => {
                setRevisaoModal({ sol: s, acao: 'aprovar' });
                setNotaRevisao('');
              }}
              onRejeitar={(s) => {
                setRevisaoModal({ sol: s, acao: 'rejeitar' });
                setNotaRevisao('');
              }}
            />
          ))}
        </ScrollView>
      )}

      {/* Modal de revisão */}
      <Modal
        visible={!!revisaoModal}
        transparent
        animationType="slide"
        onRequestClose={() => setRevisaoModal(null)}
      >
        <Pressable style={styles.overlay} onPress={() => setRevisaoModal(null)}>
          <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
            <View style={styles.handle} />
            {revisaoModal && (
              <>
                <Text style={styles.sheetTitle}>
                  {revisaoModal.acao === 'aprovar' ? 'Aprovar solicitação' : 'Rejeitar solicitação'}
                </Text>
                <Text style={styles.sheetSub}>
                  Produto:{' '}
                  <Text style={{ fontWeight: '700' }}>{revisaoModal.sol.produto.nome}</Text>
                  {'\n'}Novo preço:{' '}
                  <Text style={{ fontWeight: '700', color: colors.orange }}>
                    {moeda(revisaoModal.sol.precoSolicitado)}
                  </Text>
                </Text>

                <Text style={styles.campoLabel}>NOTA (opcional)</Text>
                <TextInput
                  style={styles.notaInput}
                  value={notaRevisao}
                  onChangeText={setNotaRevisao}
                  placeholder="Observação para o colaborador..."
                  placeholderTextColor={colors.n300}
                  multiline
                  numberOfLines={3}
                />

                <TouchableOpacity
                  style={[
                    styles.confirmarBtn,
                    revisaoModal.acao === 'rejeitar' && { backgroundColor: '#DC2626' },
                    processando && { opacity: 0.7 },
                  ]}
                  onPress={revisar}
                  disabled={processando}
                >
                  {processando ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.confirmarBtnText}>
                      {revisaoModal.acao === 'aprovar'
                        ? 'Confirmar aprovação'
                        : 'Confirmar rejeição'}
                    </Text>
                  )}
                </TouchableOpacity>
                <TouchableOpacity style={styles.cancelarBtn} onPress={() => setRevisaoModal(null)}>
                  <Text style={styles.cancelarText}>Cancelar</Text>
                </TouchableOpacity>
              </>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F1F5F9' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 16,
    paddingHorizontal: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backBtn: { padding: 4, marginRight: 12 },
  headerTitle: { flex: 1, fontSize: 18, fontWeight: '700', color: colors.navy },

  filtrosRow: { paddingHorizontal: 16, paddingVertical: 12, gap: 8 },
  filtroBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    backgroundColor: '#fff',
  },
  filtroBtnAtivo: { borderColor: colors.orange, backgroundColor: colors.orange + '15' },
  filtroText: { fontSize: 13, fontWeight: '600', color: colors.n600 },
  filtroTextAtivo: { color: colors.orange },

  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  lista: { padding: 16, gap: 12 },
  emptyText: { textAlign: 'center', color: colors.n600, marginTop: 40, fontSize: 14 },

  overlay: { flex: 1, backgroundColor: 'rgba(0,9,51,0.6)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: '#fff',
    borderRadius: 24,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    padding: 24,
    paddingBottom: 40,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E2E8F0',
    alignSelf: 'center',
    marginBottom: 20,
  },
  sheetTitle: { fontSize: 18, fontWeight: '700', color: colors.navy, marginBottom: 8 },
  sheetSub: { fontSize: 13, color: colors.n600, lineHeight: 20, marginBottom: 16 },
  campoLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.n600,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 6,
  },
  notaInput: {
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    color: colors.navy,
    backgroundColor: '#F8FAFC',
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: 16,
  },
  confirmarBtn: {
    height: 50,
    borderRadius: 14,
    backgroundColor: '#059669',
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmarBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
  cancelarBtn: {
    height: 44,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  cancelarText: { fontSize: 14, fontWeight: '600', color: colors.n600 },
});
