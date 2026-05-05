import { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Pedido } from '@ajulabs/types';
import { colors } from '@ajulabs/theme';
import { PedidoService } from '@ajulabs/api-client';
import { TrackingTimeline } from './TrackingTimeline';

const fmt = (v: number) => `R$ ${v.toFixed(2).replace('.', ',')}`;

interface Props {
  pedidoId: string;
}

export function TrackingScreen({ pedidoId }: Props) {
  const router = useRouter();
  const [pedido, setPedido] = useState<Pedido | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    PedidoService.buscarPorId(pedidoId).then(data => {
      setPedido(data);
      setLoading(false);
    });
  }, [pedidoId]);

  if (loading || !pedido) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.orange} />
      </View>
    );
  }

  const isAtivo = !['entregue', 'cancelado'].includes(pedido.status);
  const etaMin = pedido.estimativaEntrega
    ? Math.max(1, Math.ceil((new Date(pedido.estimativaEntrega).getTime() - Date.now()) / 60000))
    : null;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.btnBack} activeOpacity={0.85}>
          <Text style={{ fontSize: 20, color: colors.navy, fontWeight: '600' }}>‹</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitulo}>Acompanhar pedido</Text>
          <Text style={styles.headerSub}>{pedido.id.toUpperCase()}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* ETA card */}
        {isAtivo && etaMin && (
          <View style={styles.etaCard}>
            <View style={styles.etaIconBox}>
              <Ionicons name="time-outline" size={20} color={colors.orange600} />
            </View>
            <View>
              <Text style={styles.etaLabel}>Chegada prevista</Text>
              <Text style={styles.etaValue}>em ~{etaMin} min</Text>
            </View>
          </View>
        )}

        {/* Loja + timeline */}
        <View style={styles.timelineCard}>
          <View style={styles.lojaRow}>
            <View style={styles.lojaAvatar}>
              <Text style={{ fontSize: 16 }}>🏪</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.lojaNome}>{pedido.lojaNome}</Text>
              <Text style={styles.lojaDesc}>
                {pedido.itens.reduce((a, i) => a + i.quantidade, 0)} itens · {fmt(pedido.total)}
              </Text>
            </View>
          </View>

          <View style={{ marginTop: 14 }}>
            <TrackingTimeline status={pedido.status} />
          </View>
        </View>

        {/* Resumo do pedido */}
        <View style={styles.resumoCard}>
          <Text style={styles.resumoTitulo}>Itens do pedido</Text>
          {pedido.itens.map((item, i) => (
            <View key={i} style={styles.itemRow}>
              <Text style={styles.itemQtd}>{item.quantidade}x</Text>
              <Text style={[styles.itemNome, { flex: 1 }]}>{item.produto.nome}</Text>
              <Text style={styles.itemPreco}>{fmt(item.precoUnitario * item.quantidade)}</Text>
            </View>
          ))}
          <View style={styles.divider} />
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>{fmt(pedido.total)}</Text>
          </View>
        </View>

        {/* Endereço */}
        <View style={styles.enderecoCard}>
          <Ionicons name="location-outline" size={16} color={colors.orange} />
          <View style={{ flex: 1 }}>
            <Text style={styles.enderecoTitulo}>Endereço de entrega</Text>
            <Text style={styles.enderecoTxt}>
              {pedido.enderecoEntrega.rua}, {pedido.enderecoEntrega.numero} · {pedido.enderecoEntrega.bairro}
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container:      { flex: 1, backgroundColor: '#FAFBFE' },

  header:         { flexDirection: 'row', alignItems: 'center', gap: 8,
                    paddingHorizontal: 16, paddingTop: 52, paddingBottom: 14,
                    backgroundColor: colors.n0, borderBottomWidth: 1, borderBottomColor: colors.n100 },
  btnBack:        { width: 38, height: 38, borderRadius: 19, backgroundColor: colors.n50,
                    alignItems: 'center', justifyContent: 'center' },
  headerTitulo:   { fontSize: 18, fontWeight: '700', color: colors.navy },
  headerSub:      { fontSize: 12, color: colors.n600, marginTop: 1 },

  scroll:         { padding: 16, paddingBottom: 24 },

  etaCard:        { flexDirection: 'row', alignItems: 'center', gap: 12,
                    backgroundColor: colors.n0, borderRadius: 14, padding: 14, marginBottom: 12,
                    borderWidth: 1, borderColor: colors.n200 },
  etaIconBox:     { width: 40, height: 40, borderRadius: 10, backgroundColor: colors.orange100,
                    alignItems: 'center', justifyContent: 'center' },
  etaLabel:       { fontSize: 11, color: colors.n500, fontWeight: '500' },
  etaValue:       { fontSize: 18, fontWeight: '700', color: colors.navy },

  timelineCard:   { backgroundColor: colors.n0, borderRadius: 14, padding: 14, marginBottom: 12,
                    borderWidth: 1, borderColor: colors.n200 },
  lojaRow:        { flexDirection: 'row', alignItems: 'center', gap: 10,
                    paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: colors.n100 },
  lojaAvatar:     { width: 36, height: 36, borderRadius: 10, backgroundColor: colors.n100,
                    alignItems: 'center', justifyContent: 'center' },
  lojaNome:       { fontSize: 14, fontWeight: '700', color: colors.navy },
  lojaDesc:       { fontSize: 12, color: colors.n600, marginTop: 1 },

  resumoCard:     { backgroundColor: colors.n0, borderRadius: 14, padding: 14, marginBottom: 12,
                    borderWidth: 1, borderColor: colors.n200 },
  resumoTitulo:   { fontSize: 13, fontWeight: '600', color: colors.navy, marginBottom: 10 },
  itemRow:        { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 4 },
  itemQtd:        { fontSize: 12, fontWeight: '600', color: colors.orange, minWidth: 24 },
  itemNome:       { fontSize: 13, color: colors.navy },
  itemPreco:      { fontSize: 13, fontWeight: '500', color: colors.navy },
  divider:        { height: 1, backgroundColor: colors.n100, marginVertical: 10 },
  totalRow:       { flexDirection: 'row', justifyContent: 'space-between' },
  totalLabel:     { fontSize: 14, fontWeight: '700', color: colors.navy },
  totalValue:     { fontSize: 16, fontWeight: '800', color: colors.navy },

  enderecoCard:   { flexDirection: 'row', alignItems: 'flex-start', gap: 10,
                    backgroundColor: colors.n0, borderRadius: 14, padding: 14,
                    borderWidth: 1, borderColor: colors.n200 },
  enderecoTitulo: { fontSize: 12, fontWeight: '600', color: colors.navy },
  enderecoTxt:    { fontSize: 12, color: colors.n600, marginTop: 2 },
});