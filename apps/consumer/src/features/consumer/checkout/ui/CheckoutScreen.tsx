import { useState, useMemo, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { MetodoPagamento } from '@ajulabs/types';
import { colors } from '@ajulabs/theme';
import {
  useCartStore,
  calcularGrupos,
  calcularQuantidadeItens,
} from '../../../../store';
import { StepEndereco } from './StepEndereco';
import { StepPagamento } from './StepPagamento';
import { StepConfirmacao } from './StepConfirmacao';

const STEP_TITLES = ['Endereço', 'Pagamento', 'Confirmação'];

function gerarCodigoPedido(): string {
  const num = Math.floor(1000 + Math.random() * 9000);
  return `#SD-${num}`;
}

export function CheckoutScreen() {
  const router = useRouter();

  const itensPorLoja = useCartStore(s => s.itensPorLoja);
  const limparTudo = useCartStore(s => s.limparTudo);
  const grupos = useMemo(() => calcularGrupos(itensPorLoja), [itensPorLoja]);

  const subtotal = useMemo(() => grupos.reduce((a, g) => a + g.subtotal, 0), [grupos]);
  const frete = useMemo(() => grupos.reduce((a, g) => a + g.taxaEntrega, 0), [grupos]);

  const [step, setStep] = useState(0);
  const [enderecoId, setEnderecoId] = useState('addr-1');
  const [metodoPagamento, setMetodoPagamento] = useState<MetodoPagamento>('pix');
  const [codigoPedido] = useState(gerarCodigoPedido);

  const desconto = metodoPagamento === 'pix' ? (subtotal + frete) * 0.05 : 0;
  const total = subtotal + frete - desconto;
  const numLojas = grupos.length;

  const tempoMin = useMemo(
    () => Math.min(...grupos.map(g => g.tempoEntregaMin)),
    [grupos]
  );
  const tempoMax = useMemo(
    () => Math.max(...grupos.map(g => g.tempoEntregaMax)),
    [grupos]
  );

  const fmt = (v: number) => `R$ ${v.toFixed(2).replace('.', ',')}`;

  const handleBack = useCallback(() => {
    if (step === 0) {
      router.back();
    } else {
      setStep(s => s - 1);
    }
  }, [step, router]);

  const handleNext = useCallback(() => {
    if (step === 1) {
      // Ao confirmar o pagamento, limpa o carrinho
      limparTudo();
    }
    setStep(s => s + 1);
  }, [step, limparTudo]);

  const handleAcompanhar = useCallback(() => {
    // TODO: navegar pro tracking quando estiver pronto
    router.push('/(consumer)/pedidos');
  }, [router]);

  const handleVoltarHome = useCallback(() => {
    router.push('/(consumer)/vitrines');
  }, [router]);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.btnBack} activeOpacity={0.85}>
          <Text style={{ fontSize: 20, color: colors.navy, fontWeight: '600' }}>‹</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitulo}>Finalizar pedido</Text>
          <Text style={styles.headerSub}>
            Passo {step + 1} de 3 · {STEP_TITLES[step]}
          </Text>
        </View>
      </View>

      {/* Progress bar */}
      <View style={styles.progressContainer}>
        {[0, 1, 2].map(i => (
          <View
            key={i}
            style={[
              styles.progressBar,
              { backgroundColor: i <= step ? colors.orange : colors.n200 },
            ]}
          />
        ))}
      </View>

      {/* Conteúdo dos steps */}
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {step === 0 && (
          <StepEndereco enderecoId={enderecoId} onSelect={setEnderecoId} />
        )}
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
            codigoPedido={codigoPedido}
            tempoMin={tempoMin}
            tempoMax={tempoMax}
            numLojas={numLojas}
            onAcompanhar={handleAcompanhar}
            onVoltarHome={handleVoltarHome}
          />
        )}
      </ScrollView>

      {/* Footer com CTA (só nos steps 0 e 1) */}
      {step < 2 && (
        <View style={styles.footer}>
          <TouchableOpacity style={styles.btnContinuar} onPress={handleNext} activeOpacity={0.9}>
            <Text style={styles.btnContinuarTxt}>
              {step === 0 ? `Continuar · ${fmt(subtotal + frete)}` : `Pagar ${fmt(total)}`}
            </Text>
            <Text style={{ color: colors.n0, fontSize: 16 }}>›</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container:       { flex: 1, backgroundColor: '#FAFBFE' },

  header:          { flexDirection: 'row', alignItems: 'center', gap: 8,
                     paddingHorizontal: 16, paddingTop: 52, paddingBottom: 10,
                     backgroundColor: colors.n0 },
  btnBack:         { width: 38, height: 38, borderRadius: 19, backgroundColor: colors.n50,
                     alignItems: 'center', justifyContent: 'center' },
  headerTitulo:    { fontSize: 18, fontWeight: '700', color: colors.navy },
  headerSub:       { fontSize: 12, color: colors.n600, marginTop: 1 },

  progressContainer:{ flexDirection: 'row', gap: 6, paddingHorizontal: 16, paddingVertical: 10,
                      backgroundColor: colors.n0, borderBottomWidth: 1, borderBottomColor: colors.n100 },
  progressBar:     { flex: 1, height: 4, borderRadius: 99 },

  scroll:          { padding: 16, paddingBottom: 100 },

  footer:          { padding: 16, paddingBottom: 24, backgroundColor: colors.n0,
                     borderTopWidth: 1, borderTopColor: colors.n100 },
  btnContinuar:    { backgroundColor: colors.orange, height: 52, borderRadius: 14,
                     flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
                     shadowColor: colors.orange, shadowOffset: { width: 0, height: 4 },
                     shadowOpacity: 0.3, shadowRadius: 14, elevation: 4 },
  btnContinuarTxt: { color: colors.n0, fontSize: 15, fontWeight: '700' },
});