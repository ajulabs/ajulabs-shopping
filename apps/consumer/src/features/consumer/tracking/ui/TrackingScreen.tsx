import { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Pedido } from '@ajulabs/types';
import { colors } from '@ajulabs/theme';
import { PedidoService } from '@ajulabs/api-client';
import { useAuthStore } from '../../../../store';
import { useTheme } from '../../../../hooks';
import { TrackingTimeline } from './TrackingTimeline';
import { DeliveryMap } from '../../../../components/DeliveryMap';
import { useEntregadorTracking } from '../hooks/useEntregadorTracking';

const CHAT_STATUSES = ['confirmado', 'preparando', 'pronto', 'saiu_entrega'];

const fmt = (v: number) => `R$ ${v.toFixed(2).replace('.', ',')}`;

const ACTIVE_STATUSES = ['pronto', 'saiu_entrega'];

interface Props {
  pedidoId: string;
}

export function TrackingScreen({ pedidoId }: Props) {
  const router = useRouter();
  const token = useAuthStore((s) => s.token);
  const userId = useAuthStore((s) => s.userId);
  const { isDark, bg, surf, border, borderL, text, textSec, textMut, backBtn, iconBg } = useTheme();
  const avatarBg = isDark ? 'rgba(255,255,255,0.08)' : colors.n100;

  const [pedido, setPedido] = useState<Pedido | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }
    PedidoService.buscarPorId(pedidoId, token)
      .then((data) => {
        setPedido(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));

    const interval = setInterval(() => {
      PedidoService.buscarPorId(pedidoId, token)
        .then((data) => {
          if (data) setPedido(data);
        })
        .catch(() => {});
    }, 10000);
    return () => clearInterval(interval);
  }, [pedidoId, token]);

  const isActive = pedido ? ACTIVE_STATUSES.includes(pedido.status) : false;

  const { entregadorLocation, destinoLocation } = useEntregadorTracking({
    pedidoId,
    token,
    userId,
    isActive,
    enderecoEntrega: pedido?.enderecoEntrega,
  });

  if (loading || !pedido) {
    return (
      <View
        style={[
          styles.container,
          { backgroundColor: bg, justifyContent: 'center', alignItems: 'center' },
        ]}
      >
        <ActivityIndicator size="large" color={colors.orange} />
      </View>
    );
  }

  const isAtivo = !['entregue', 'cancelado'].includes(pedido.status);
  const showMap = ACTIVE_STATUSES.includes(pedido.status);
  const etaMin = pedido.estimativaEntrega
    ? Math.max(1, Math.ceil((new Date(pedido.estimativaEntrega).getTime() - Date.now()) / 60000))
    : null;

  return (
    <View style={[styles.container, { backgroundColor: bg }]}>
      <View style={[styles.header, { backgroundColor: surf, borderBottomColor: borderL }]}>
        <TouchableOpacity
          onPress={() => router.navigate('/(consumer)/pedidos')}
          style={[styles.btnBack, { backgroundColor: backBtn }]}
          activeOpacity={0.85}
        >
          <Text style={{ fontSize: 20, color: text, fontWeight: '600' }}>‹</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={[styles.headerTitulo, { color: text }]}>Acompanhar pedido</Text>
          <Text style={[styles.headerSub, { color: textSec as string }]}>
            {pedido.id.toUpperCase()}
          </Text>
        </View>
      </View>

      {showMap && (
        <View style={styles.mapContainer}>
          <DeliveryMap entregadorLocation={entregadorLocation} destinoLocation={destinoLocation} />
          {entregadorLocation ? (
            <View style={styles.liveBadge}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>Ao vivo</Text>
            </View>
          ) : (
            <View style={[styles.liveBadge, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
              <ActivityIndicator
                size="small"
                color="#fff"
                style={{ transform: [{ scale: 0.6 }] }}
              />
              <Text style={styles.liveText}>Localizando...</Text>
            </View>
          )}
        </View>
      )}

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {isAtivo && etaMin && (
          <View style={[styles.etaCard, { backgroundColor: surf, borderColor: border }]}>
            <View style={[styles.etaIconBox, { backgroundColor: iconBg }]}>
              <Ionicons name="time-outline" size={20} color={colors.orange600} />
            </View>
            <View>
              <Text style={[styles.etaLabel, { color: textMut as string }]}>Chegada prevista</Text>
              <Text style={[styles.etaValue, { color: text }]}>em ~{etaMin} min</Text>
            </View>
          </View>
        )}

        {pedido.entregador && ACTIVE_STATUSES.includes(pedido.status) && (
          <View style={[styles.entregadorCard, { backgroundColor: surf, borderColor: border }]}>
            <View style={[styles.entregadorAvatar, { backgroundColor: avatarBg }]}>
              <Ionicons name="bicycle" size={20} color={colors.navy} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.entregadorNome, { color: text }]}>{pedido.entregador.nome}</Text>
              <Text style={[styles.entregadorTipo, { color: textSec as string }]}>
                {pedido.entregador.tipoTransporte ?? 'Entregador'}
              </Text>
            </View>
            {entregadorLocation && (
              <View style={styles.locBadge}>
                <View style={styles.locDot} />
                <Text style={styles.locTxt}>Rastreando</Text>
              </View>
            )}
            <TouchableOpacity
              style={styles.chatBubbleBtn}
              onPress={() =>
                router.push({
                  pathname: '/(consumer)/chat-pedido/[pedidoId]',
                  params: { pedidoId: pedido.id, destinatario: 'ENTREGADOR' },
                })
              }
              activeOpacity={0.8}
            >
              <Ionicons name="chatbubble-ellipses" size={16} color={colors.orange} />
            </TouchableOpacity>
          </View>
        )}

        <View style={[styles.timelineCard, { backgroundColor: surf, borderColor: border }]}>
          <View style={[styles.lojaRow, { borderBottomColor: borderL }]}>
            <View style={[styles.lojaAvatar, { backgroundColor: avatarBg }]}>
              <Text style={{ fontSize: 16 }}>🏪</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.lojaNome, { color: text }]}>{pedido.lojaNome}</Text>
              <Text style={[styles.lojaDesc, { color: textSec as string }]}>
                {pedido.itens.reduce((a, i) => a + i.quantidade, 0)} itens · {fmt(pedido.total)}
              </Text>
            </View>
            {CHAT_STATUSES.includes(pedido.status) && (
              <TouchableOpacity
                style={styles.chatBubbleBtn}
                onPress={() =>
                  router.push({
                    pathname: '/(consumer)/chat-pedido/[pedidoId]',
                    params: { pedidoId: pedido.id, destinatario: 'LOJISTA' },
                  })
                }
                activeOpacity={0.8}
              >
                <Ionicons name="chatbubble-ellipses" size={16} color={colors.orange} />
              </TouchableOpacity>
            )}
          </View>
          <View style={{ marginTop: 14 }}>
            <TrackingTimeline status={pedido.status} />
          </View>
        </View>

        {pedido.status === 'saiu_entrega' && pedido.codigoEntrega && (
          <View style={[styles.codigoCard, { backgroundColor: surf }]}>
            <View style={styles.codigoHeader}>
              <Ionicons name="key-outline" size={16} color={colors.orange} />
              <Text style={[styles.codigoTitulo, { color: text }]}>Código para o entregador</Text>
            </View>
            <View style={styles.codigoDigitos}>
              {pedido.codigoEntrega.split('').map((d, i) => (
                <View key={i} style={styles.codigoDigito}>
                  <Text style={styles.codigoDigitoTxt}>{d}</Text>
                </View>
              ))}
            </View>
            <Text style={[styles.codigoHint, { color: textSec as string }]}>
              Informe os 4 últimos dígitos do seu telefone ao entregador para confirmar a entrega
            </Text>
          </View>
        )}

        <View style={[styles.resumoCard, { backgroundColor: surf, borderColor: border }]}>
          <Text style={[styles.resumoTitulo, { color: text }]}>Itens do pedido</Text>
          {pedido.itens.map((item, i) => (
            <View key={i} style={styles.itemRow}>
              <Text style={styles.itemQtd}>{item.quantidade}x</Text>
              <Text style={[styles.itemNome, { flex: 1, color: text }]}>{item.produto.nome}</Text>
              <Text style={[styles.itemPreco, { color: text }]}>
                {fmt(item.precoUnitario * item.quantidade)}
              </Text>
            </View>
          ))}
          <View style={[styles.divider, { backgroundColor: borderL }]} />
          <View style={styles.totalRow}>
            <Text style={[styles.totalLabel, { color: text }]}>Total</Text>
            <Text style={[styles.totalValue, { color: text }]}>{fmt(pedido.total)}</Text>
          </View>
        </View>

        <View style={[styles.enderecoCard, { backgroundColor: surf, borderColor: border }]}>
          <Ionicons name="location-outline" size={16} color={colors.orange} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.enderecoTitulo, { color: text }]}>Endereço de entrega</Text>
            <Text style={[styles.enderecoTxt, { color: textSec as string }]}>
              {pedido.enderecoEntrega.rua}, {pedido.enderecoEntrega.numero} ·{' '}
              {pedido.enderecoEntrega.bairro}
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 52,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  btnBack: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitulo: { fontSize: 18, fontWeight: '700' },
  headerSub: { fontSize: 12, marginTop: 1 },

  mapContainer: { height: 220, position: 'relative' },
  liveBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#39FF89' },
  liveText: { fontSize: 11, fontWeight: '700', color: '#fff' },

  scroll: { padding: 16, paddingBottom: 24 },

  etaCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
  },
  etaIconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  etaLabel: { fontSize: 11, fontWeight: '500' },
  etaValue: { fontSize: 18, fontWeight: '700' },

  entregadorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
  },
  entregadorAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  entregadorNome: { fontSize: 14, fontWeight: '700' },
  entregadorTipo: { fontSize: 12, marginTop: 1, textTransform: 'capitalize' },
  locBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#E8FFF3',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  locDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#22C55E' },
  locTxt: { fontSize: 11, fontWeight: '600', color: '#16A34A' },

  timelineCard: { borderRadius: 14, padding: 14, marginBottom: 12, borderWidth: 1 },
  lojaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  lojaAvatar: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lojaNome: { fontSize: 14, fontWeight: '700' },
  lojaDesc: { fontSize: 12, marginTop: 1 },

  codigoCard: {
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: colors.orange,
  },
  codigoHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 14 },
  codigoTitulo: { fontSize: 13, fontWeight: '700' },
  codigoDigitos: { flexDirection: 'row', gap: 10, justifyContent: 'center', marginBottom: 12 },
  codigoDigito: {
    width: 56,
    height: 64,
    borderRadius: 14,
    backgroundColor: colors.orange,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.orange,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  codigoDigitoTxt: { fontSize: 30, fontWeight: '900', color: '#fff' },
  codigoHint: { fontSize: 12, textAlign: 'center' },

  resumoCard: { borderRadius: 14, padding: 14, marginBottom: 12, borderWidth: 1 },
  resumoTitulo: { fontSize: 13, fontWeight: '600', marginBottom: 10 },
  itemRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 4 },
  itemQtd: { fontSize: 12, fontWeight: '600', color: colors.orange, minWidth: 24 },
  itemNome: { fontSize: 13 },
  itemPreco: { fontSize: 13, fontWeight: '500' },
  divider: { height: 1, marginVertical: 10 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between' },
  totalLabel: { fontSize: 14, fontWeight: '700' },
  totalValue: { fontSize: 16, fontWeight: '800' },

  enderecoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
  },
  enderecoTitulo: { fontSize: 12, fontWeight: '600' },
  enderecoTxt: { fontSize: 12, marginTop: 2 },

  chatBubbleBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#FFF0E6',
    borderWidth: 1,
    borderColor: colors.orange,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
});
