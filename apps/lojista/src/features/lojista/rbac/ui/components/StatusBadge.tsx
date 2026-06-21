import { View, Text, StyleSheet } from 'react-native';
import type { StatusSolicitacaoPreco } from '@ajulabs/types';
import { STATUS_CFG } from '../../lib/solicitacoes';

interface Props {
  status: StatusSolicitacaoPreco;
}

export function StatusBadge({ status }: Props) {
  const cfg = STATUS_CFG[status];
  return (
    <View style={[styles.statusBadge, { backgroundColor: cfg.bg }]}>
      <Text style={[styles.statusText, { color: cfg.color }]}>{cfg.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  statusText: { fontSize: 12, fontWeight: '700' },
});
