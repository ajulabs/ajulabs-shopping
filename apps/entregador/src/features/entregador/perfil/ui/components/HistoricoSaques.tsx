import { View, Text, StyleSheet } from 'react-native';
import { STATUS_LABEL, brl } from '../../model/useDadosBancarios';
import { useMemo } from 'react';
import { useTheme } from '../../../../../shared/hooks';
import type { Theme } from '../../../../../shared/hooks/useTheme';

interface HistoricoSaquesProps {
  saques: any[];
}

export function HistoricoSaques({ saques }: HistoricoSaquesProps) {
  const theme = useTheme();
  const s = useMemo(() => makeStyles(theme), [theme]);
  return (
    <>
      <Text style={s.sectionTitle}>Histórico de saques</Text>
      {saques.length === 0 ? (
        <View style={s.emptyBox}>
          <Text style={s.emptyText}>Nenhum saque solicitado ainda</Text>
        </View>
      ) : (
        saques.map((saque) => {
          const st = STATUS_LABEL[saque.status] ?? { label: saque.status, color: theme.textMut };
          const data = new Date(saque.criadoEm).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: '2-digit',
          });
          return (
            <View key={saque.id} style={s.saqueRow}>
              <View style={{ flex: 1 }}>
                <Text style={s.saqueValor}>{brl(Number(saque.valor))}</Text>
                <Text style={s.saqueData}>
                  {data} · {saque.chavePix}
                </Text>
              </View>
              <View style={[s.statusBadge, { backgroundColor: `${st.color}18` }]}>
                <Text style={[s.statusText, { color: st.color }]}>{st.label}</Text>
              </View>
            </View>
          );
        })
      )}
    </>
  );
}

function makeStyles(theme: Theme) {
  return StyleSheet.create({
    sectionTitle: { fontSize: 15, fontWeight: '700', color: theme.text, marginBottom: 10 },
    emptyBox: { alignItems: 'center', paddingVertical: 20 },
    emptyText: { fontSize: 13, color: theme.textMut },
    saqueRow: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.surf,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.border,
      padding: 14,
      marginBottom: 8,
    },
    saqueValor: { fontSize: 15, fontWeight: '700', color: theme.text },
    saqueData: { fontSize: 11, color: theme.textMut, marginTop: 2 },
    statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 99 },
    statusText: { fontSize: 11, fontWeight: '700' },
  });
}
