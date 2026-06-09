import { useCallback, useRef } from 'react';
import { BackHandler } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';

/**
 * Intercepta o botão físico de voltar do Android enquanto a tela está em foco.
 *
 * Usa uma ref pro callback mais recente, de modo que o handler sempre enxergue
 * o estado atual — evita o closure travado no valor inicial (causa de "voltar
 * fecha o app" quando o estado já mudou).
 *
 * @param onBack Retorne `true` para indicar que o evento foi tratado.
 */
export function useHardwareBack(onBack: () => boolean) {
  const handlerRef = useRef(onBack);
  handlerRef.current = onBack;

  useFocusEffect(
    useCallback(() => {
      const sub = BackHandler.addEventListener('hardwareBackPress', () => handlerRef.current());
      return () => sub.remove();
    }, []),
  );
}

/**
 * Retorna uma função "voltar inteligente": segue a pilha de navegação real
 * (router.back) quando há histórico, criando o caminho de volta em cascata.
 * Se a pilha estiver vazia, cai num destino de fallback.
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
 * "Voltar inteligente" completo: conecta a função de voltar E o botão físico do
 * Android ao mesmo comportamento de pilha. Use no botão visual de voltar; o
 * físico fica sincronizado automaticamente.
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
