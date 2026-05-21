import { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Pedido } from '@ajulabs/types';
import { colors } from '@ajulabs/theme';
import { PedidoService } from '@ajulabs/api-client';
import { useAuthStore } from '../../../../store';
import { useTheme } from '../../../../hooks';
import { PedidoCard } from './PedidoCard';
import { usePedidoConsumerRealtime } from '@ajulabs/realtime';

const API_URL = (process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000').replace(/\/$/, '');

export function OrdersScreen() {
  const router = useRouter();
  const token  = useAuthStore(s => s.token);
  const userId = useAuthStore(s => s.userId);
  const { isDark, bg, surf, borderL, text, textSec } = useTheme();
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }
    PedidoService.listar(token)
      .then(data => setPedidos(data))
      .catch(() => {})
      .finally(() => setLoading(false));

    const interval = setInterval(() => {
      PedidoService.listar(token)
        .then(data => setPedidos(data))
        .catch(() => {});
    }, 60_000);

    return () => clearInterval(interval);
  }, [token]);

  usePedidoConsumerRealtime({
    apiUrl: API_URL,
    userId: userId ?? null,
    enabled: !!userId,
    onAtualizado: ({ pedidoId, status }) => {
      setPedidos(prev => prev.map(p => p.id === pedidoId ? { ...p, status: status as any } : p));
    },
  });

  const ativos = pedidos.filter(p => !['entregue', 'cancelado'].includes(p.status));
  const historico = pedidos.filter(p => ['entregue', 'cancelado'].includes(p.status));

  const handlePress = (id: string) => {
    router.push(`/(consumer)/tracking/${id}`);
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: bg, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.orange} />
      </View>
    );
  }

  if (pedidos.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: bg }]}>
        <View style={[styles.header, { backgroundColor: surf, borderBottomColor: borderL }]}>
          <Text style={[styles.titulo, { color: text }]}>Pedidos</Text>
        </View>
        <View style={styles.vazio}>
          <Text style={{ fontSize: 56 }}>📦</Text>
          <Text style={[styles.vazioTitulo, { color: text }]}>Nenhum pedido ainda</Text>
          <Text style={[styles.vazioTxt, { color: textSec as string }]}>Seus pedidos aparecerão aqui</Text>
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
    <View style={[styles.container, { backgroundColor: bg }]}>
      <View style={[styles.header, { backgroundColor: surf, borderBottomColor: borderL }]}>
        <Text style={[styles.titulo, { color: text }]}>Pedidos</Text>
        <Text style={[styles.subtitulo, { color: textSec as string }]}>{pedidos.length} pedidos</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {ativos.length > 0 && (
          <>
            <Text style={[styles.secao, { color: textSec as string }]}>Em andamento</Text>
            {ativos.map(p => (
              <PedidoCard key={p.id} pedido={p} onPress={handlePress} />
            ))}
          </>
        )}

        {historico.length > 0 && (
          <>
            <Text style={[styles.secao, ativos.length > 0 && { marginTop: 20 }, { color: textSec as string }]}>
              Histórico
            </Text>
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
  container:    { flex: 1 },
  header:       { paddingHorizontal: 16, paddingTop: 52, paddingBottom: 14,
                  borderBottomWidth: 1 },
  titulo:       { fontSize: 20, fontWeight: '700' },
  subtitulo:    { fontSize: 12, marginTop: 2 },

  scroll:       { padding: 16, paddingBottom: 24 },
  secao:        { fontSize: 13, fontWeight: '600', textTransform: 'uppercase',
                  letterSpacing: 0.5, marginBottom: 10 },

  vazio:        { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 8 },
  vazioTitulo:  { fontSize: 18, fontWeight: '700', marginTop: 12 },
  vazioTxt:     { fontSize: 13 },
  vazioBtn:     { marginTop: 16, paddingHorizontal: 24, paddingVertical: 12,
                  backgroundColor: colors.orange, borderRadius: 12 },
  vazioBtnTxt:  { color: colors.n0, fontSize: 14, fontWeight: '700' },
});
