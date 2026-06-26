import { useState, useCallback, useRef } from 'react';
import { Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Produto } from '@ajulabs/types';
import { ImageSlot } from '../lib/types';

/** Constrói os slots iniciais (até 4) a partir das imagens existentes do produto. */
function buildInitialSlots(produto: Produto): ImageSlot[] {
  const existingUrls =
    produto.imagens && produto.imagens.length > 0
      ? produto.imagens
      : produto.imagem
        ? [produto.imagem]
        : [];
  const filled: ImageSlot[] = existingUrls.map((url) => ({ type: 'existing', url }));
  while (filled.length < 4) filled.push({ type: 'empty' });
  return filled;
}

export function useImageSlots(produto: Produto) {
  const [slots, setSlots] = useState<ImageSlot[]>(() => buildInitialSlots(produto));
  const initialSlotsRef = useRef(slots);

  const pickImage = useCallback(async (index: number) => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permissão necessária', 'Precisamos de acesso à galeria.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.85,
      allowsEditing: true,
      aspect: [1, 1],
    });
    if (!result.canceled && result.assets[0]) {
      setSlots((prev) => {
        const next = [...prev];
        next[index] = { type: 'new', uri: result.assets[0].uri };
        return next;
      });
    }
  }, []);

  const removeSlot = useCallback((index: number) => {
    setSlots((prev) => {
      const next = [...prev];
      next[index] = { type: 'empty' };
      const filled: ImageSlot[] = next.filter((s) => s.type !== 'empty');
      while (filled.length < 4) filled.push({ type: 'empty' });
      return filled;
    });
  }, []);

  return { slots, setSlots, initialSlotsRef, pickImage, removeSlot };
}
