import { useState, useMemo, useCallback } from 'react';
import { Alert } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { MetodoPagamento } from '@ajulabs/types';
import { PedidoService } from '@ajulabs/api-client';
import { useCartStore, useAuthStore, calcularGrupos } from '../../../../store';

export function useCheckout() {
  const router = useRouter();
  const itensPorLoja = useCartStore((s) => s.itensPorLoja);
  const lojasCache = useCartStore((s) => s.lojasCache);
  const limparTudo = useCartStore((s) => s.limparTudo);
  const token = useAuthStore((s) => s.token);

  const grupos = useMemo(
    () => calcularGrupos(itensPorLoja, lojasCache),
    [itensPorLoja, lojasCache],
  );
  const subtotal = useMemo(() => grupos.reduce((a, g) => a + g.subtotal, 0), [grupos]);
  const frete = useMemo(() => grupos.reduce((a, g) => a + g.taxaEntrega, 0), [grupos]);

  const [step, setStep] = useState(0);
  const [enderecoId, setEnderecoId] = useState('');
  const [metodoPagamento, setMetodoPagamento] = useState<MetodoPagamento>('pix');
  const [placing, setPlacing] = useState(false);
  const [pedidoIds, setPedidoIds] = useState<string[]>([]);
  // Tempo estimado de entrega (min) do pedido recém-criado, vindo do backend
  // (distância loja→cliente a ~60 km/h). 0 antes de finalizar o pedido.
  const [etaBaseMin, setEtaBaseMin] = useState(0);

  // Esta é uma tela de tab — fica montada após o primeiro pedido, então o
  // `step` persistiria e o próximo checkout reabriria já na confirmação.
  // Reseta o fluxo ao SAIR da tela (cleanup do blur), assim um novo checkout
  // sempre começa no passo 0 sem "piscar" o passo anterior ao reentrar.
  useFocusEffect(
    useCallback(() => {
      return () => {
        setStep(0);
        setPedidoIds([]);
        setEtaBaseMin(0);
      };
    }, []),
  );

  const desconto = metodoPagamento === 'pix' ? (subtotal + frete) * 0.05 : 0;
  const total = subtotal + frete - desconto;
  const numLojas = grupos.length;

  // Faixa exibida na confirmação: base (vinda do backend) a base+5 min.
  const tempoMin = etaBaseMin;
  const tempoMax = etaBaseMin + 5;

  const handleBack = useCallback(() => {
    if (step === 0) {
      router.back();
    } else {
      setStep((s) => s - 1);
    }
  }, [step, router]);

  const handleNext = useCallback(async () => {
    // Passo 0 (Endereço): não avança sem um endereço cadastrado/selecionado.
    if (step === 0) {
      if (!enderecoId) {
        Alert.alert('Endereço', 'Adicione ou selecione um endereço de entrega para continuar.');
        return;
      }
      setStep((s) => s + 1);
      return;
    }
    if (step === 1) {
      if (!token) {
        Alert.alert('Erro', 'Faça login para continuar.');
        return;
      }
      if (!enderecoId) {
        Alert.alert('Endereço', 'Selecione um endereço de entrega.');
        return;
      }
      setPlacing(true);
      try {
        const ids: string[] = [];
        let maxEta = 0;
        for (const grupo of grupos) {
          const pedido = await PedidoService.criar(token, {
            lojaId: grupo.lojaId,
            enderecoEntregaId: enderecoId,
            metodoPagamento,
            itens: grupo.itens.map((i) => ({ produtoId: i.produto.id, quantidade: i.quantidade })),
          });
          ids.push(pedido.id);
          // Vários pedidos (uma por loja) → mostra a maior estimativa (entrega mais longa).
          if (pedido.tempoEstimadoMin && pedido.tempoEstimadoMin > maxEta) {
            maxEta = pedido.tempoEstimadoMin;
          }
        }
        setPedidoIds(ids);
        setEtaBaseMin(maxEta);
        limparTudo();
        setStep((s) => s + 1);
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Erro ao criar pedido.';
        Alert.alert('Erro', msg);
      } finally {
        setPlacing(false);
      }
    } else {
      setStep((s) => s + 1);
    }
  }, [step, token, enderecoId, grupos, metodoPagamento, limparTudo]);

  const handleAcompanhar = useCallback(() => {
    if (pedidoIds[0]) {
      router.push(`/(consumer)/tracking/${pedidoIds[0]}`);
    } else {
      router.push('/(consumer)/pedidos');
    }
  }, [router, pedidoIds]);

  const handleVoltarHome = useCallback(() => {
    router.push('/(consumer)/vitrines');
  }, [router]);

  return {
    step,
    enderecoId,
    setEnderecoId,
    metodoPagamento,
    setMetodoPagamento,
    placing,
    pedidoIds,
    subtotal,
    frete,
    desconto,
    total,
    numLojas,
    tempoMin,
    tempoMax,
    handleBack,
    handleNext,
    handleAcompanhar,
    handleVoltarHome,
  };
}
