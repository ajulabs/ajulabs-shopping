import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { SolicitacaoPreco } from '@ajulabs/types';
import { colors } from '../../../../../theme';
import { moeda } from '../../lib/solicitacoes';
import { StatusBadge } from './StatusBadge';

interface Props {
  solicitacao: SolicitacaoPreco;
  isFuncionario: boolean;
  canApprovePrice: boolean;
  onAprovar: (sol: SolicitacaoPreco) => void;
  onRejeitar: (sol: SolicitacaoPreco) => void;
}

export function SolicitacaoCard({
  solicitacao: sol,
  isFuncionario,
  canApprovePrice,
  onAprovar,
  onRejeitar,
}: Props) {
  return (
    <View style={styles.card}>
      <View style={styles.cardTop}>
        <Text style={styles.produtoNome} numberOfLines={1}>
          {sol.produto.nome}
        </Text>
        <StatusBadge status={sol.status} />
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
          Solicitado por: <Text style={{ fontWeight: '600' }}>{sol.solicitante.nome}</Text>
        </Text>
      )}

      {sol.status !== 'pendente' && sol.revisadoPorNome && (
        <View style={styles.revisaoBox}>
          <Text style={styles.revisaoBy}>
            {sol.status === 'aprovado' ? 'Aprovado' : 'Rejeitado'} por {sol.revisadoPorNome}
          </Text>
          {sol.notaRevisao && <Text style={styles.revisaoNota}>"{sol.notaRevisao}"</Text>}
        </View>
      )}

      {canApprovePrice && sol.status === 'pendente' && (
        <View style={styles.acaoRow}>
          <TouchableOpacity
            style={[styles.acaoBtn, styles.acaoBtnRejeitar]}
            onPress={() => onRejeitar(sol)}
          >
            <Text style={styles.acaoBtnText}>Rejeitar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.acaoBtn, styles.acaoBtnAprovar]}
            onPress={() => onAprovar(sol)}
          >
            <Text style={[styles.acaoBtnText, { color: '#fff' }]}>Aprovar</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
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
});
