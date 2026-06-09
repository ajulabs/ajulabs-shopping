import { useCallback } from 'react';
import { BackHandler } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';

/**
 * Intercepta o botão físico de voltar do Android enquanto a tela está em foco
 * e executa uma ação customizada.
 *
 * @param onBack Função executada ao pressionar voltar. Retorne `true` para indicar
 *               que o evento foi tratado (impede o comportamento padrão).
 */
export function useHardwareBack(onBack: () => boolean) {
  useFocusEffect(
    useCallback(() => {
      const sub = BackHandler.addEventListener('hardwareBackPress', onBack);
      return () => sub.remove();
    }, [onBack]),
  );
}

/**
 * Retorna uma função "voltar inteligente": segue a pilha de navegação real
 * (router.back) quando há histórico, criando o caminho de volta em cascata.
 * Se a pilha estiver vazia, cai num destino de fallback.
 *
 * NÃO registra o botão físico — use `useSmartBack` para o caso comum (registra
 * o físico automaticamente) ou combine `goBackOr` com seu próprio `useHardwareBack`
 * quando precisar de lógica extra (ex: fechar um modal antes).
 *
 * @param fallback Rota de destino quando a pilha está vazia.
 */
export function useGoBack(fallback: string) {
  const router = useRouter();
  return useCallback(() => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace(fallback as never);
    }
  }, [router, fallback]);
}

/**
 * "Voltar inteligente" completo: conecta tanto a função de voltar quanto o botão
 * físico do Android ao mesmo comportamento de pilha. Use no botão visual de voltar
 * e o físico fica sincronizado automaticamente.
 *
 * @param fallback Rota de destino quando a pilha está vazia.
 * @returns Função para o onPress do botão visual de voltar.
 */
export function useSmartBack(fallback: string) {
  const goBack = useGoBack(fallback);
  useHardwareBack(
    useCallback(() => {
      goBack();
      return true;
    }, [goBack]),
  );
  return goBack;
}
