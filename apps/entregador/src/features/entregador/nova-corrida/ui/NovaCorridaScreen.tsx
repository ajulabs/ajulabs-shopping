import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNovaCorrida } from '../model/useNovaCorrida';

/**
 * Tela full-screen disparada quando uma notificação de nova corrida chega
 * (canal ride-alerts no Android). Permite aceitar ou recusar a corrida
 * mesmo com o app antes em segundo plano. Países onde Apple aprovou
 * critical-alerts entitlement, também funciona em iOS.
 *
 * Acessada via `router.push('/nova-corrida/[pedidoId]')` a partir do
 * listener de notificação em usePushRegistrationEntregador.
 */
export function NovaCorridaScreen({ pedidoId }: { pedidoId?: string }) {
  const { countdown, aceitando, erro, pulseAnim, aceitar, recusar } = useNovaCorrida(pedidoId);

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        <View style={s.urgentBadge}>
          <View style={s.urgentDot} />
          <Text style={s.urgentText}>NOVA CORRIDA</Text>
        </View>
        <Text style={s.countdown}>{countdown}s</Text>
      </View>

      <View style={s.content}>
        <View style={s.bikeIcon}>
          <Ionicons name="bicycle" size={64} color="#F2760F" />
        </View>
        <Text style={s.title}>Corrida disponível na sua região!</Text>
        <Text style={s.subtitle}>
          Aceite agora para começar a entrega. Você tem {countdown}s para responder.
        </Text>

        {!!erro && (
          <View style={s.erroBox}>
            <Ionicons name="alert-circle-outline" size={16} color="#A32D2D" />
            <Text style={s.erroTxt}>{erro}</Text>
          </View>
        )}
      </View>

      <View style={s.actions}>
        <TouchableOpacity style={s.recusarBtn} onPress={recusar} activeOpacity={0.8}>
          <Text style={s.recusarText}>Recusar</Text>
        </TouchableOpacity>

        <Animated.View style={{ flex: 2, transform: [{ scale: pulseAnim }] }}>
          <TouchableOpacity
            style={[s.aceitarBtn, aceitando && { opacity: 0.7 }]}
            onPress={aceitar}
            disabled={aceitando}
            activeOpacity={0.85}
          >
            {aceitando ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="checkmark" size={22} color="#FFFFFF" />
                <Text style={s.aceitarText}>Aceitar</Text>
              </>
            )}
          </TouchableOpacity>
        </Animated.View>
      </View>

      <Text style={s.footnote}>
        Não responder = recusar automaticamente. A corrida vai para outro entregador.
      </Text>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#000933', paddingHorizontal: 22 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    paddingBottom: 32,
  },
  urgentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 6,
    backgroundColor: '#F2760F',
    borderRadius: 99,
  },
  urgentDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#FFFFFF' },
  urgentText: { fontSize: 12, fontWeight: '800', color: '#FFFFFF', letterSpacing: 0.5 },
  countdown: {
    fontSize: 32,
    fontWeight: '800',
    color: '#F2760F',
    fontVariant: ['tabular-nums'],
  },

  content: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  bikeIcon: {
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: 'rgba(242,118,15,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 32,
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    lineHeight: 22,
  },

  erroBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 16,
    padding: 12,
    backgroundColor: 'rgba(163,45,45,0.2)',
    borderRadius: 10,
  },
  erroTxt: { flex: 1, fontSize: 13, color: '#FFB8B8' },

  actions: { flexDirection: 'row', gap: 12, paddingBottom: 16 },
  recusarBtn: {
    flex: 1,
    height: 64,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  recusarText: { fontSize: 16, fontWeight: '700', color: 'rgba(255,255,255,0.8)' },

  aceitarBtn: {
    height: 64,
    borderRadius: 16,
    backgroundColor: '#F2760F',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    shadowColor: '#F2760F',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 12,
  },
  aceitarText: { fontSize: 17, fontWeight: '800', color: '#FFFFFF' },

  footnote: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.4)',
    textAlign: 'center',
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
});
