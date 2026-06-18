import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useHardwareBack } from '../../../../shared/hooks';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '@ajulabs/theme';
import { StepEndereco } from './StepEndereco';
import { StepPagamento } from './StepPagamento';
import { StepConfirmacao } from './StepConfirmacao';
import { useCheckout } from '../model/useCheckout';

const STEP_TITLES = ['Endereço', 'Pagamento', 'Confirmação'];

export function CheckoutScreen() {
  const router = useRouter();
  useHardwareBack(() => {
    router.back();
    return true;
  });
  const insets = useSafeAreaInsets();

  const {
    step,
    enderecoId,
    setEnderecoId,
    metodoPagamento,
    setMetodoPagamento,
    placing,
    pedidoIds,
    subtotal,
    frete,
    total,
    numLojas,
    tempoMin,
    tempoMax,
    handleBack,
    handleNext,
    handleAcompanhar,
    handleVoltarHome,
  } = useCheckout();

  const fmt = (v: number) => `R$ ${v.toFixed(2).replace('.', ',')}`;

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity onPress={handleBack} style={styles.btnBack} activeOpacity={0.85}>
          <Ionicons name="chevron-back" size={20} color={colors.navy} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitulo}>Finalizar pedido</Text>
          <Text style={styles.headerSub}>
            Passo {step + 1} de 3 · {STEP_TITLES[step]}
          </Text>
        </View>
      </View>

      <View style={styles.progressContainer}>
        {[0, 1, 2].map((i) => (
          <View
            key={i}
            style={[
              styles.progressBar,
              { backgroundColor: i <= step ? colors.orange : colors.n200 },
            ]}
          />
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {step === 0 && <StepEndereco enderecoId={enderecoId} onSelect={setEnderecoId} />}
        {step === 1 && (
          <StepPagamento
            metodo={metodoPagamento}
            onSelect={setMetodoPagamento}
            subtotal={subtotal}
            frete={frete}
            numLojas={numLojas}
          />
        )}
        {step === 2 && (
          <StepConfirmacao
            codigoPedido={pedidoIds[0] ? `#${pedidoIds[0].slice(-6).toUpperCase()}` : '#SD-0000'}
            tempoMin={tempoMin}
            tempoMax={tempoMax}
            numLojas={numLojas}
            onAcompanhar={handleAcompanhar}
            onVoltarHome={handleVoltarHome}
          />
        )}
      </ScrollView>

      {step < 2 && (
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.btnContinuar, placing && { opacity: 0.7 }]}
            onPress={handleNext}
            activeOpacity={0.9}
            disabled={placing}
          >
            {placing ? (
              <ActivityIndicator color={colors.n0} />
            ) : (
              <>
                <Text style={styles.btnContinuarTxt}>
                  {step === 0 ? `Continuar · ${fmt(subtotal + frete)}` : `Pagar ${fmt(total)}`}
                </Text>
                <Ionicons name="chevron-forward" size={16} color={colors.n0} />
              </>
            )}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFBFE' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingBottom: 10,
    backgroundColor: colors.n0,
  },
  btnBack: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.n50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitulo: { fontSize: 18, fontWeight: '700', color: colors.navy },
  headerSub: { fontSize: 12, color: colors.n600, marginTop: 1 },

  progressContainer: {
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: colors.n0,
    borderBottomWidth: 1,
    borderBottomColor: colors.n100,
  },
  progressBar: { flex: 1, height: 4, borderRadius: 99 },

  scroll: { padding: 16, paddingBottom: 100 },

  footer: {
    padding: 16,
    paddingBottom: 24,
    backgroundColor: colors.n0,
    borderTopWidth: 1,
    borderTopColor: colors.n100,
  },
  btnContinuar: {
    backgroundColor: colors.orange,
    height: 52,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: colors.orange,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 14,
    elevation: 4,
  },
  btnContinuarTxt: { color: colors.n0, fontSize: 15, fontWeight: '700' },
});
