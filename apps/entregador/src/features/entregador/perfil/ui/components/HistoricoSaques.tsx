import { View, Text, StyleSheet } from 'react-native';
import { STATUS_LABEL, brl } from '../../model/useDadosBancarios';

interface HistoricoSaquesProps {
  saques: any[];
}

export function HistoricoSaques({ saques }: HistoricoSaquesProps) {
  return (
    <>
      <Text style={s.sectionTitle}>Histórico de saques</Text>
      {saques.length === 0 ? (
        <View style={s.emptyBox}>
          <Text style={s.emptyText}>Nenhum saque solicitado ainda</Text>
        </View>
      ) : (
        saques.map((saque) => {
          const st = STATUS_LABEL[saque.status] ?? { label: saque.status, color: '#9099B3' };
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

const s = StyleSheet.create({
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#000933', marginBottom: 10 },
  emptyBox: { alignItems: 'center', paddingVertical: 20 },
  emptyText: { fontSize: 13, color: '#9099B3' },
  saqueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E4E7F1',
    padding: 14,
    marginBottom: 8,
  },
  saqueValor: { fontSize: 15, fontWeight: '700', color: '#000933' },
  saqueData: { fontSize: 11, color: '#9099B3', marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 99 },
  statusText: { fontSize: 11, fontWeight: '700' },
});
