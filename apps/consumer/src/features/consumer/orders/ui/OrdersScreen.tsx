import { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '@ajulabs/theme';
import { useTheme } from '../../../../shared/hooks';
import { PedidoCard } from './PedidoCard';
import { MeusTicketsScreen } from '../../tickets/ui/MeusTicketsScreen';
import { Ionicons } from '@expo/vector-icons';
import { EntregaConfirmadaModal } from '../../avaliacao/ui/EntregaConfirmadaModal';
import { AvaliacaoModal } from '../../avaliacao/ui/AvaliacaoModal';
import { useOrders } from '../model/useOrders';

type Screen = 'list' | 'tickets';

export function OrdersScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { isDark, bg, surf, borderL, text, textSec } = useTheme();
  const [screen, setScreen] = useState<Screen>('list');

  const {
    pedidos,
    loading,
    ticketsAbertos,
    ativos,
    historico,
    pedidoParaAvaliar,
    setPedidoParaAvaliar,
    showConfirmada,
    setShowConfirmada,
    showAvaliacao,
    setShowAvaliacao,
    enviandoAvaliacao,
    handleEnviarAvaliacao,
  } = useOrders();

  if (screen === 'tickets') {
    return <MeusTicketsScreen onBack={() => setScreen('list')} />;
  }

  const avaliacaoModals = pedidoParaAvaliar ? (
    <>
      <EntregaConfirmadaModal
        visible={showConfirmada}
        lojaNome={pedidoParaAvaliar.lojaNome}
        onAvaliar={() => {
          setShowConfirmada(false);
          setShowAvaliacao(true);
        }}
        onPular={() => {
          setShowConfirmada(false);
          setPedidoParaAvaliar(null);
        }}
      />
      <AvaliacaoModal
        visible={showAvaliacao}
        lojaNome={pedidoParaAvaliar.lojaNome}
        entregadorNome={pedidoParaAvaliar.entregador?.nome ?? null}
        itens={pedidoParaAvaliar.itens}
        enviando={enviandoAvaliacao}
        onEnviar={handleEnviarAvaliacao}
        onFechar={() => {
          setShowAvaliacao(false);
          setPedidoParaAvaliar(null);
        }}
      />
    </>
  ) : null;

  const handlePress = (id: string) => {
    router.push(`/(consumer)/tracking/${id}`);
  };

  // "Pedidos" é uma aba sem header nativo. Volta para a tela anterior (normalmente
  // o Perfil, de onde se navega para cá); se não houver histórico, vai ao Perfil.
  const handleBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/(consumer)/perfil');
  };

  if (loading) {
    return (
      <View
        style={[
          styles.container,
          { backgroundColor: bg, justifyContent: 'center', alignItems: 'center' },
        ]}
      >
        <ActivityIndicator size="large" color={colors.orange} />
        {avaliacaoModals}
      </View>
    );
  }

  if (pedidos.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: bg }]}>
        <View
          style={[
            styles.header,
            { backgroundColor: surf, borderBottomColor: borderL, paddingTop: insets.top + 12 },
          ]}
        >
          <View style={styles.headerRow}>
            <TouchableOpacity
              onPress={handleBack}
              style={styles.backBtn}
              activeOpacity={0.7}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="chevron-back" size={24} color={text} />
            </TouchableOpacity>
            <Text style={[styles.titulo, { color: text }]}>Pedidos</Text>
          </View>
        </View>
        <View style={styles.vazio}>
          <Text style={{ fontSize: 56 }}>📦</Text>
          <Text style={[styles.vazioTitulo, { color: text }]}>Nenhum pedido ainda</Text>
          <Text style={[styles.vazioTxt, { color: textSec as string }]}>
            Seus pedidos aparecerão aqui
          </Text>
          <TouchableOpacity
            style={styles.vazioBtn}
            onPress={() => router.push('/(consumer)/vitrines')}
            activeOpacity={0.85}
          >
            <Text style={styles.vazioBtnTxt}>Explorar vitrines</Text>
          </TouchableOpacity>
        </View>
        {avaliacaoModals}
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: bg }]}>
      <View
        style={[
          styles.header,
          { backgroundColor: surf, borderBottomColor: borderL, paddingTop: insets.top + 12 },
        ]}
      >
        <View style={styles.headerRow}>
          <TouchableOpacity
            onPress={handleBack}
            style={styles.backBtn}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="chevron-back" size={24} color={text} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={[styles.titulo, { color: text }]}>Pedidos</Text>
            <Text style={[styles.subtitulo, { color: textSec as string }]}>
              {pedidos.length} pedidos
            </Text>
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <TouchableOpacity
          style={[styles.ticketCard, { backgroundColor: surf, borderColor: borderL }]}
          onPress={() => setScreen('tickets')}
          activeOpacity={0.8}
        >
          <View style={styles.ticketCardLeft}>
            <View
              style={[
                styles.ticketCardIconWrap,
                { backgroundColor: isDark ? 'rgba(255,126,0,0.15)' : '#FFF3E8' },
              ]}
            >
              <Ionicons name="ticket-outline" size={18} color={colors.orange} />
            </View>
            <View>
              <Text style={[styles.ticketCardTitle, { color: text }]}>Meus Tickets</Text>
              <Text style={[styles.ticketCardSub, { color: textSec as string }]}>
                {ticketsAbertos > 0
                  ? `${ticketsAbertos} ticket${ticketsAbertos > 1 ? 's' : ''} aberto${ticketsAbertos > 1 ? 's' : ''}`
                  : 'Visualize aqui seus tickets criados'}
              </Text>
            </View>
          </View>
          <View style={styles.ticketCardRight}>
            {ticketsAbertos > 0 && (
              <View style={styles.ticketCardBadge}>
                <Text style={styles.ticketCardBadgeTxt}>{ticketsAbertos}</Text>
              </View>
            )}
            <Ionicons name="chevron-forward" size={16} color={textSec as string} />
          </View>
        </TouchableOpacity>

        {ativos.length > 0 && (
          <>
            <Text style={[styles.secao, { color: textSec as string }]}>Em andamento</Text>
            {ativos.map((p) => (
              <PedidoCard key={p.id} pedido={p} onPress={handlePress} />
            ))}
          </>
        )}

        {historico.length > 0 && (
          <>
            <Text
              style={[
                styles.secao,
                ativos.length > 0 && { marginTop: 20 },
                { color: textSec as string },
              ]}
            >
              Histórico
            </Text>
            {historico.map((p) => (
              <PedidoCard key={p.id} pedido={p} onPress={handlePress} />
            ))}
          </>
        )}
      </ScrollView>
      {avaliacaoModals}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 16, paddingBottom: 14, borderBottomWidth: 1 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  backBtn: { marginLeft: -4, padding: 4 },
  titulo: { fontSize: 20, fontWeight: '700' },
  subtitulo: { fontSize: 12, marginTop: 2 },

  scroll: { padding: 16, paddingBottom: 24 },

  ticketCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 16,
  },
  ticketCardLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  ticketCardIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ticketCardTitle: { fontSize: 13, fontWeight: '600' },
  ticketCardSub: { fontSize: 11, marginTop: 1 },
  ticketCardRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  ticketCardBadge: {
    backgroundColor: '#DC2626',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  ticketCardBadgeTxt: { fontSize: 11, fontWeight: '700', color: '#fff' },
  secao: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
  },

  vazio: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 8 },
  vazioTitulo: { fontSize: 18, fontWeight: '700', marginTop: 12 },
  vazioTxt: { fontSize: 13 },
  vazioBtn: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: colors.orange,
    borderRadius: 12,
  },
  vazioBtnTxt: { color: colors.n0, fontSize: 14, fontWeight: '700' },
});
