import { useCallback, useRef } from 'react';
import { BackHandler } from 'react-native';
import { useFocusEffect } from 'expo-router';

/**
 * Intercepta o botão físico de voltar do Android enquanto a tela está em foco.
 *
 * Usa uma ref pro callback mais recente, de modo que o handler sempre enxergue
 * o estado atual — evita o closure travado no valor inicial (causa de "voltar
 * fecha o app" quando o estado interno, ex: `screen`, já mudou).
 *
 * @param onBack Retorne `true` para indicar que o evento foi tratado (impede o
 *               comportamento padrão de fechar o app).
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
