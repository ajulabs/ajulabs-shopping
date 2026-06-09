import { useCallback } from 'react';
import { BackHandler } from 'react-native';
import { useFocusEffect } from 'expo-router';

/**
 * Intercepta o botão físico de voltar do Android enquanto a tela está em foco.
 * Necessário no CourierApp, que usa navegação por estado interno (setScreen).
 * Sem isso, o voltar tenta sair da rota raiz e fecha o app.
 *
 * @param onBack Retorne `true` para indicar que o evento foi tratado.
 */
export function useHardwareBack(onBack: () => boolean) {
  useFocusEffect(
    useCallback(() => {
      const sub = BackHandler.addEventListener('hardwareBackPress', onBack);
      return () => sub.remove();
    }, [onBack]),
  );
}
