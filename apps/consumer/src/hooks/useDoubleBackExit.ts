import { useCallback, useRef } from 'react';
import { BackHandler, ToastAndroid, Platform } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';

/**
 * Padrão Android "aperte voltar novamente para sair".
 *
 * Aplique na(s) tela(s) raiz de um navegador de Tabs. Enquanto a tela está em
 * foco: se houver histórico de navegação, volta normalmente (router.back);
 * se estiver na raiz, o primeiro voltar mostra um toast e só o segundo (em até
 * 2s) deixa o app fechar. Evita fechar por engano.
 */
export function useDoubleBackExit() {
  const router = useRouter();
  const lastBackPressRef = useRef(0);

  useFocusEffect(
    useCallback(() => {
      const onBack = () => {
        // Se há para onde voltar na pilha, segue o fluxo normal
        if (router.canGoBack()) {
          router.back();
          return true;
        }
        const agora = Date.now();
        if (agora - lastBackPressRef.current < 2000) {
          return false; // segundo toque → deixa fechar
        }
        lastBackPressRef.current = agora;
        if (Platform.OS === 'android') {
          ToastAndroid.show('Aperte voltar novamente para sair', ToastAndroid.SHORT);
        }
        return true; // primeiro toque → não fecha
      };
      const sub = BackHandler.addEventListener('hardwareBackPress', onBack);
      return () => sub.remove();
    }, [router]),
  );
}
