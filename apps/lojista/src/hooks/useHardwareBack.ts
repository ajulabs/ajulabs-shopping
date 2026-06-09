import { useCallback } from 'react';
import { BackHandler } from 'react-native';
import { useFocusEffect } from 'expo-router';

/**
 * Intercepta o botão físico de voltar do Android enquanto a tela está em foco.
 * Necessário em telas com navegação por estado interno (setScreen) dentro de Tabs:
 * sem isso, o voltar tenta sair da tab raiz e fecha o app.
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
