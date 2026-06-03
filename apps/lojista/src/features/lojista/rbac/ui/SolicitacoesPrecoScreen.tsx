import { useState, useCallback, useEffect } from 'react';
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
  Alert,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RBACService } from '@ajulabs/api-client';
import type { SolicitacaoPreco, StatusSolicitacaoPreco } from '@ajulabs/types';
import { colors } from '../../../../theme';
import { useAuthLojistaStore } from '../../auth/model/store';
import { usePermissions } from '../hooks/usePermissions';

interface Props {
  onVoltar: () => void;
}

const STATUS_CFG: Record<StatusSolicitacaoPreco, { label: string; color: string; bg: string }> = {
  pendente: { label: 'Pendente', color: '#D97706', bg: '#FEF3C7' },
  aprovado: { label: 'Aprovado', color: '#059669', bg: '#D1FAE5' },
  rejeitado: { label: 'Rejeitado', color: '#DC2626', bg: '#FEE2E2' },
};

function moeda(valor: number) {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function SolicitacoesPrecoScreen({ onVoltar }: Props) {
  const insets = useSafeAreaInsets();
  const lojaId = useAuthLojistaStore((s) => s.lojaId);
  const colaboradorId = useAuthLojistaStore((s) => s.colaboradorId);
  const token = useAuthLojistaStore((s) => s.token);
  const { canApprovePrice, isFuncionario } = usePermissions();

  const [solicitacoes, setSolicitacoes] = useState<SolicitacaoPreco[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filtroStatus, setFiltroStatus] = useState<StatusSolicitacaoPreco | undefined>(undefined);

  // Modal de revisão (aprovar/rejeitar)
  const [revisaoModal, setRevisaoModal] = useState<{
    sol: SolicitacaoPreco;
    acao: 'aprovar' | 'rejeitar';
  } | null>(null);
  const [notaRevisao, setNotaRevisao] = useState('');
  const [processando, setProcessando] = useState(false);

  const carregar = useCallback(
    async (silent = false) => {
      if (!lojaId || !token) return;
      if (!silent) setLoading(true);
      try {
        const opts: { solicitanteId?: string; status?: StatusSolicitacaoPreco } = {};
        if (isFuncionario && colaboradorId) opts.solicitanteId = colaboradorId;
        if (filtroStatus) opts.status = filtroStatus;
        const lista = await RBACService.listarSolicitacoes(lojaId, token, opts.status);
        // filter by solicitante client-side if funcionario
        const filtrada =
          isFuncionario && colaboradorId
            ? lista.filter((s) => s.solicitanteId === colaboradorId)
            : lista;
        setSolicitacoes(filtrada);
      } catch {
        if (!silent) Alert.alert('Erro', 'Não foi possível carregar as solicitações.');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [lojaId, token, isFuncionario, colaboradorId, filtroStatus],
  );

  useEffect(() => {
    carregar();
  }, [carregar]);

  const revisar = useCallback(async () => {
    if (!revisaoModal || !lojaId || !token) return;
    const { sol, acao } = revisaoModal;
    setProcessando(true);
    try {
      if (acao === 'aprovar') {
        await RBACService.aprovarSolicitacao(sol.id, lojaId, token, notaRevisao || undefined);
      } else {
        await RBACService.rejeitarSolicitacao(sol.id, lojaId, token, notaRevisao || undefined);
      }
      setRevisaoModal(null);
      setNotaRevisao('');
      carregar(true);
    } catch (e) {
      Alert.alert('Erro', e instanceof Error ? e.message : 'Erro ao processar solicitação.');
    } finally {
      setProcessando(false);
    }
  }, [revisaoModal, lojaId, token, notaRevisao, carregar]);

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
          {solicitacoes.map((sol) => {
            const cfg = STATUS_CFG[sol.status];
            return (
              <View key={sol.id} style={styles.card}>
                <View style={styles.cardTop}>
                  <Text style={styles.produtoNome} numberOfLines={1}>
                    {sol.produto.nome}
                  </Text>
                  <View style={[styles.statusBadge, { backgroundColor: cfg.bg }]}>
                    <Text style={[styles.statusText, { color: cfg.color }]}>{cfg.label}</Text>
                  </View>
                </View>

                <View style={styles.precoRow}>
                  <View style={styles.precoBox}>
                    <Text style={styles.precoLabel}>Preço atual</Text>
                    <Text style={styles.precoValor}>{moeda(sol.precoAtual)}</Text>
                  </View>
                  <Ionicons name="arrow-forward" size={16} color={colors.n300} />
                  <View style={styles.precoBox}>
                    <Text style={styles.precoLabel}>Solicitado</Text>
                    <Text style={[styles.precoValor, { color: colors.orange }]}>
                      {moeda(sol.precoSolicitado)}
                    </Text>
                  </View>
                </View>

                <Text style={styles.justLabel}>Justificativa</Text>
                <Text style={styles.justText}>{sol.justificativa}</Text>

                {!isFuncionario && (
                  <Text style={styles.solicitanteText}>
                    Solicitado por:{' '}
                    <Text style={{ fontWeight: '600' }}>{sol.solicitante.nome}</Text>
                  </Text>
                )}

                {sol.status !== 'pendente' && sol.revisadoPorNome && (
                  <View style={styles.revisaoBox}>
                    <Text style={styles.revisaoBy}>
                      {sol.status === 'aprovado' ? 'Aprovado' : 'Rejeitado'} por{' '}
                      {sol.revisadoPorNome}
                    </Text>
                    {sol.notaRevisao && <Text style={styles.revisaoNota}>"{sol.notaRevisao}"</Text>}
                  </View>
                )}

                {canApprovePrice && sol.status === 'pendente' && (
                  <View style={styles.acaoRow}>
                    <TouchableOpacity
                      style={[styles.acaoBtn, styles.acaoBtnRejeitar]}
                      onPress={() => {
                        setRevisaoModal({ sol, acao: 'rejeitar' });
                        setNotaRevisao('');
                      }}
                    >
                      <Text style={styles.acaoBtnText}>Rejeitar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.acaoBtn, styles.acaoBtnAprovar]}
                      onPress={() => {
                        setRevisaoModal({ sol, acao: 'aprovar' });
                        setNotaRevisao('');
                      }}
                    >
                      <Text style={[styles.acaoBtnText, { color: '#fff' }]}>Aprovar</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            );
          })}
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

  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  produtoNome: { fontSize: 15, fontWeight: '700', color: colors.navy, flex: 1, marginRight: 8 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  statusText: { fontSize: 12, fontWeight: '700' },

  precoRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  precoBox: { flex: 1 },
  precoLabel: { fontSize: 11, color: colors.n600, fontWeight: '600', marginBottom: 2 },
  precoValor: { fontSize: 16, fontWeight: '700', color: colors.navy },

  justLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.n600,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 4,
  },
  justText: { fontSize: 13, color: colors.navy, lineHeight: 19, marginBottom: 10 },

  solicitanteText: { fontSize: 12, color: colors.n600, marginBottom: 10 },

  revisaoBox: { backgroundColor: '#F8FAFC', borderRadius: 10, padding: 10, marginBottom: 10 },
  revisaoBy: { fontSize: 12, color: colors.n600, fontWeight: '500' },
  revisaoNota: { fontSize: 13, color: colors.navy, fontStyle: 'italic', marginTop: 4 },

  acaoRow: { flexDirection: 'row', gap: 10, marginTop: 4 },
  acaoBtn: {
    flex: 1,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  acaoBtnRejeitar: { borderWidth: 1.5, borderColor: '#DC2626' },
  acaoBtnAprovar: { backgroundColor: '#059669' },
  acaoBtnText: { fontSize: 14, fontWeight: '700', color: '#DC2626' },

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
