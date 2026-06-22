import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { brl } from '../../../../../shared/lib/format';

export function DeliveryHistory({ entregas }: { entregas: any[] }) {
  return (
    <>
      <View style={s.sectionHeader}>
        <Text style={s.sectionTitle}>Corridas recentes</Text>
      </View>

      {entregas.length === 0 ? (
        <View style={{ alignItems: 'center', paddingVertical: 24 }}>
          <Text style={{ fontSize: 13, color: '#9099B3' }}>Nenhuma entrega ainda</Text>
        </View>
      ) : (
        entregas.slice(0, 10).map((e: any) => {
          const loja = e.pedido?.loja?.nome ?? '–';
          const bairro = e.pedido?.enderecoEntrega?.bairro ?? '–';
          const valor = Number(e.valorRecebido ?? 0) + Number(e.bonus ?? 0);
          const data = e.criadoEm
            ? new Date(e.criadoEm).toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
              })
            : '–';
          return (
            <View key={e.id} style={s.historyRow}>
              <View style={s.historyIcon}>
                <Ionicons name="swap-horizontal" size={17} color="#9099B3" />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={s.historyTrajeto} numberOfLines={1}>
                  {loja} → {bairro}
                </Text>
                <Text style={s.historyData}>{data}</Text>
              </View>
              <Text style={s.historyValor}>{brl(valor)}</Text>
            </View>
          );
        })
      )}
    </>
  );
}

const s = StyleSheet.create({
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 10,
  },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#000933' },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 10,
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E4E7F1',
  },
  historyIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#F6F7FB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  historyTrajeto: { fontSize: 13, fontWeight: '600', color: '#000933' },
  historyData: { fontSize: 11, color: '#9099B3' },
  historyValor: { fontSize: 14, fontWeight: '700', color: '#000933' },
});
