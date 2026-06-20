import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { LojistaService } from '@ajulabs/api-client';
import { useAuthLojistaStore } from '../../../../store';
import { HORARIOS_INICIAIS, type HorarioDia } from '../lib/horarios';

export const TOTAL_STEPS = 3;

export function useOnboarding() {
  const router = useRouter();
  const token = useAuthLojistaStore((s) => s.token);
  const lojaId = useAuthLojistaStore((s) => s.lojaId);
  const lojaNome = useAuthLojistaStore((s) => s.lojaNome) ?? '';

  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [logoUri, setLogoUri] = useState<string | null>(null);
  const [bannerUri, setBannerUri] = useState<string | null>(null);
  const [uploading, setUploading] = useState<'logo' | 'banner' | null>(null);
  const [categoria, setCategoria] = useState('');
  const [descricao, setDescricao] = useState('');
  const [horarios, setHorarios] = useState<HorarioDia[]>(HORARIOS_INICIAIS);

  const updateHorario = useCallback((index: number, updated: HorarioDia) => {
    setHorarios((prev) => prev.map((h, i) => (i === index ? updated : h)));
  }, []);

  const pickImage = useCallback(
    async (tipo: 'logo' | 'banner') => {
      if (!token || !lojaId) return;
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: tipo === 'logo' ? [1, 1] : [3, 1],
        quality: 0.8,
      });
      if (result.canceled || !result.assets?.[0]) return;
      const uri = result.assets[0].uri;
      if (tipo === 'logo') setLogoUri(uri);
      else setBannerUri(uri);
      setUploading(tipo);
      try {
        await LojistaService.atualizarImagemLoja(lojaId, token, tipo, uri);
      } catch {
        Alert.alert('Erro', 'Não foi possível enviar a imagem. Tente novamente.');
        if (tipo === 'logo') setLogoUri(null);
        else setBannerUri(null);
      } finally {
        setUploading(null);
      }
    },
    [token, lojaId],
  );

  const salvarEAvancar = useCallback(async () => {
    if (step < TOTAL_STEPS) {
      setStep((s) => s + 1);
      return;
    }
    if (!token || !lojaId) {
      router.replace('/(lojista)/pedidos');
      return;
    }
    setSaving(true);
    try {
      await LojistaService.atualizarLoja(lojaId, token, {
        categoria,
        descricao,
        horarios: horarios.map((h, i) => ({
          diaSemana: i,
          ativo: h.ativo,
          abertura: h.abertura,
          fechamento: h.fechamento,
        })),
      });
    } catch {
      // Falha silenciosa: o lojista ajusta os dados depois em Perfil.
    } finally {
      setSaving(false);
      router.replace('/(lojista)/pedidos');
    }
  }, [step, token, lojaId, categoria, descricao, horarios, router]);

  const pular = useCallback(() => {
    if (step < TOTAL_STEPS) setStep((s) => s + 1);
    else router.replace('/(lojista)/pedidos');
  }, [step, router]);

  return {
    step,
    setStep,
    saving,
    logoUri,
    bannerUri,
    uploading,
    categoria,
    setCategoria,
    descricao,
    setDescricao,
    horarios,
    lojaNome,
    updateHorario,
    pickImage,
    salvarEAvancar,
    pular,
  };
}
