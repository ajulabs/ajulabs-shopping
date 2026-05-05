import { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Pedido } from '@ajulabs/types';
import { colors } from '@ajulabs/theme';
import { PedidoService } from '@ajulabs/api-client';
import { PedidoCard } from './PedidoCard';

export function OrdersScreen() {
  const router = useRouter();
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    PedidoService.listar().then(data => {
      setPedidos(data);
      setLoading(false);
    });
  }, []);

  const ativos = pedidos.filter(p => !['entregue', 'cancelado'].includes(p.status));
  const historico = pedidos.filter(p => ['entregue', 'cancelado'].includes(p.status));

  const handlePress = (id: string) => {
    router.push(`/(consumer)/tracking/${id}`);
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.orange} />
      </View>
    );
  }

  if (pedidos.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.titulo}>Pedidos</Text>
        </View>
        <View style={styles.vazio}>
          <Text style={{ fontSize: 56 }}>📦</Text>
          <Text style={styles.vazioTitulo}>Nenhum pedido ainda</Text>
          <Text style={styles.vazioTxt}>Seus pedidos aparecerão aqui</Text>
          <TouchableOpacity
            style={styles.vazioBtn}
            onPress={() => router.push('/(consumer)/vitrines')}
            activeOpacity={0.85}
          >
            <Text style={styles.vazioBtnTxt}>Explorar vitrines</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.titulo}>Pedidos</Text>
        <Text style={styles.subtitulo}>{pedidos.length} pedidos</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {ativos.length > 0 && (
          <>
            <Text style={styles.secao}>Em andamento</Text>
            {ativos.map(p => (
              <PedidoCard key={p.id} pedido={p} onPress={handlePress} />
            ))}
          </>
        )}

        {historico.length > 0 && (
          <>
            <Text style={[styles.secao, ativos.length > 0 && { marginTop: 20 }]}>Histórico</Text>
            {historico.map(p => (
              <PedidoCard key={p.id} pedido={p} onPress={handlePress} />
            ))}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: '#FAFBFE' },
  header:       { paddingHorizontal: 16, paddingTop: 52, paddingBottom: 14,
                  backgroundColor: colors.n0, borderBottomWidth: 1, borderBottomColor: colors.n100 },
  titulo:       { fontSize: 20, fontWeight: '700', color: colors.navy },
  subtitulo:    { fontSize: 12, color: colors.n600, marginTop: 2 },

  scroll:       { padding: 16, paddingBottom: 24 },
  secao:        { fontSize: 13, fontWeight: '600', color: colors.n500, textTransform: 'uppercase',
                  letterSpacing: 0.5, marginBottom: 10 },

  vazio:        { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 8 },
  vazioTitulo:  { fontSize: 18, fontWeight: '700', color: colors.navy, marginTop: 12 },
  vazioTxt:     { fontSize: 13, color: colors.n600 },
  vazioBtn:     { marginTop: 16, paddingHorizontal: 24, paddingVertical: 12,
                  backgroundColor: colors.orange, borderRadius: 12 },
  vazioBtnTxt:  { color: colors.n0, fontSize: 14, fontWeight: '700' },
});