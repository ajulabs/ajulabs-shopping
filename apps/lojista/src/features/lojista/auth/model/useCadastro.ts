import { useState, useCallback, useRef } from 'react';
import { ScrollView, Platform, Alert, BackHandler } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import * as Location from 'expo-location';
import { useAuthLojistaStore } from '../../../../store';
import { enrichRateLimit } from '../../../../shared/lib/enrichRateLimit';
import { validateCNPJ } from '../lib/validateCNPJ';
import { validateCadastro, type FormData, type EnderecoLoja } from '../lib/validateCadastro';
import { formatCNPJ } from '../lib/formatCNPJ';

const LAPI =
  (process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000').replace(/\/$/, '') + '/v1';

export function useCadastro(onCadastroSuccess?: () => void) {
  const router = useRouter();
  const registrar = useAuthLojistaStore((s) => s.registrar);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [aceitouTermos, setAceitouTermos] = useState(false);
  const [form, setForm] = useState<FormData>({
    cnpj: '',
    nomeLoja: '',
    telefone: '',
    telefoneCompleto: '',
    email: '',
    senha: '',
    confirmarSenha: '',
  });
  const [endereco, setEndereco] = useState<EnderecoLoja>({
    cep: '',
    rua: '',
    numero: '',
    bairro: '',
  });
  const [locLoading, setLocLoading] = useState(false);
  const [pinCoords, setPinCoords] = useState<{ lat: number; lng: number } | null>(null);

  const scrollRef = useRef<ScrollView>(null);
  const fieldPositions = useRef<Record<string, number>>({});

  const setEnderecoField = useCallback((key: keyof EnderecoLoja, value: string) => {
    setEndereco((prev) => ({ ...prev, [key]: value }));
  }, []);

  const clearError = useCallback(
    (...keys: string[]) =>
      setErrors((prev) => {
        if (keys.every((k) => !prev[k])) return prev;
        const next = { ...prev };
        keys.forEach((k) => delete next[k]);
        return next;
      }),
    [],
  );

  const scrollToField = useCallback((key: string) => {
    const y = fieldPositions.current[key];
    if (typeof y !== 'number') return;
    scrollRef.current?.scrollTo({ y: Math.max(0, y - 20), animated: true });
  }, []);

  const usarLocalizacao = useCallback(async () => {
    setLocLoading(true);
    clearError('localizacao');
    try {
      let lat: number, lng: number;
      if (Platform.OS === 'web') {
        try {
          const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              enableHighAccuracy: false,
              timeout: 15000,
              maximumAge: 60000,
            }),
          );
          lat = pos.coords.latitude;
          lng = pos.coords.longitude;
        } catch (geoErr: any) {
          const msg =
            geoErr?.code === 1
              ? 'Permissão de localização negada. Permita o acesso no navegador e tente novamente.'
              : 'Não foi possível obter sua localização. Verifique se o GPS está ativo.';
          setErrors((e) => ({ ...e, localizacao: msg }));
          return;
        }
      } else {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setErrors((e) => ({ ...e, localizacao: 'Permissão de localização negada.' }));
          return;
        }
        const loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        lat = loc.coords.latitude;
        lng = loc.coords.longitude;
      }

      // GPS obtido — exibe mapa mesmo que o geocode falhe
      setPinCoords({ lat, lng });

      try {
        const res = await fetch(`${LAPI}/geocode/by-coords?lat=${lat}&lng=${lng}`);
        if (!res.ok) throw new Error();
        const data = await res.json();
        setEndereco({
          cep: (data.cep ?? '').replace(/\D/g, ''),
          rua: data.rua ?? '',
          numero: '',
          bairro: data.bairro ?? '',
        });
        clearError('cep', 'rua', 'bairro');
      } catch {
        // Geocode falhou mas coordenadas estão disponíveis — usuário pode preencher manualmente
      }
    } finally {
      setLocLoading(false);
    }
  }, [clearError]);

  const handlePinMoved = useCallback(
    async (lat: number, lng: number) => {
      setPinCoords({ lat, lng });
      try {
        const res = await fetch(`${LAPI}/geocode/by-coords?lat=${lat}&lng=${lng}`);
        if (!res.ok) return;
        const data = await res.json();
        setEndereco((prev) => ({
          ...prev,
          cep: (data.cep ?? prev.cep).replace(/\D/g, ''),
          rua: data.rua || prev.rua,
          bairro: data.bairro || prev.bairro,
        }));
        clearError('cep', 'rua', 'bairro');
      } catch {}
    },
    [clearError],
  );

  const limparEndereco = useCallback(() => {
    setPinCoords(null);
    setEndereco({ cep: '', rua: '', numero: '', bairro: '' });
    clearError('cep', 'rua', 'bairro', 'localizacao');
  }, [clearError]);

  const setField = useCallback(
    (key: keyof FormData, value: string) => {
      setForm((prev) => ({ ...prev, [key]: value }));
      clearError(key);
    },
    [clearError],
  );

  const setTelefone = useCallback(
    (local: string, full: string) => {
      setForm((f) => ({ ...f, telefone: local, telefoneCompleto: full }));
      clearError('telefone');
    },
    [clearError],
  );

  const toggleTermos = useCallback(() => {
    setAceitouTermos((v) => !v);
    clearError('termos');
  }, [clearError]);

  const checkDisponivel = useCallback(
    async (field: 'cnpj' | 'email' | 'telefone', value: string) => {
      try {
        const res = await fetch(
          `${LAPI}/auth/lojista/check?field=${field}&value=${encodeURIComponent(value)}`,
        );
        if (!res.ok) return;
        const { available } = await res.json();
        if (!available) {
          const msgs: Record<string, string> = {
            cnpj: 'Este CNPJ já possui uma conta. Faça login ou use outro CNPJ.',
            email: 'Este e-mail já está em uso. Faça login ou use outro e-mail.',
            telefone: 'Este telefone já está cadastrado. Faça login ou use outro número.',
          };
          setErrors((prev) => ({ ...prev, [field]: msgs[field] }));
        }
      } catch {
        // falha silenciosa — o submit valida novamente no servidor
      }
    },
    [],
  );

  const blurCnpj = useCallback(async () => {
    const digits = form.cnpj.replace(/\D/g, '');
    if (!digits) return;
    if (digits.length < 14) {
      setErrors((e) => ({ ...e, cnpj: 'CNPJ incompleto — informe os 14 dígitos.' }));
    } else if (!validateCNPJ(form.cnpj)) {
      setErrors((e) => ({ ...e, cnpj: 'CNPJ inválido. Verifique os números digitados.' }));
    } else {
      await checkDisponivel('cnpj', digits);
    }
  }, [form.cnpj, checkDisponivel]);

  const blurEmail = useCallback(async () => {
    const trimmed = form.email.trim();
    if (!trimmed) return;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(trimmed)) {
      setErrors((e) => ({ ...e, email: 'Email inválido.' }));
    } else {
      await checkDisponivel('email', trimmed);
    }
  }, [form.email, checkDisponivel]);

  const blurTelefone = useCallback(async () => {
    const digits = form.telefoneCompleto.replace(/\D/g, '');
    if (digits.length < 10) return;
    await checkDisponivel('telefone', form.telefoneCompleto.replace(/[^\d+]/g, ''));
  }, [form.telefoneCompleto, checkDisponivel]);

  const validate = useCallback(() => {
    const errs = validateCadastro(form, endereco, aceitouTermos);
    setErrors(errs);
    return errs;
  }, [form, endereco, aceitouTermos]);

  const handleCadastro = useCallback(async () => {
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      const order = [
        'cnpj',
        'nomeLoja',
        'telefone',
        'email',
        'senha',
        'confirmarSenha',
        'cep',
        'bairro',
        'rua',
        'termos',
      ];
      const firstKey = order.find((k) => errs[k]);
      if (firstKey) scrollToField(firstKey);
      return;
    }
    setLoading(true);
    try {
      await registrar({
        cnpj: form.cnpj,
        nomeResponsavel: form.nomeLoja,
        telefone: form.telefoneCompleto,
        email: form.email,
        senha: form.senha,
      });

      if (endereco.rua.trim() && endereco.cep.trim()) {
        const { lojaId, token } = useAuthLojistaStore.getState();
        if (lojaId && token) {
          await fetch(`${LAPI}/lojista/lojas/${lojaId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({
              endereco: {
                rua: endereco.rua,
                numero: endereco.numero || 's/n',
                bairro: endereco.bairro,
                cep: endereco.cep.replace(/\D/g, ''),
                cidade: 'Aracaju',
                ...(pinCoords ? { lat: pinCoords.lat, lng: pinCoords.lng } : {}),
              },
            }),
          }).catch(() => {});
        }
      }

      onCadastroSuccess?.();
      router.replace('/(lojista)/onboarding');
    } catch (e) {
      const isNetwork =
        e instanceof Error &&
        (e.message.includes('Network') ||
          e.message.includes('fetch') ||
          e.message.includes('Failed'));
      const msg = isNetwork
        ? 'Sem conexão com o servidor.'
        : e instanceof Error
          ? e.message
          : 'Erro ao criar conta.';
      const field = (e as any)?.field as string | undefined;
      if (field && fieldPositions.current[field] !== undefined) {
        setErrors({ [field]: enrichRateLimit(msg) });
        scrollToField(field);
      } else {
        setErrors({ geral: enrichRateLimit(msg) });
      }
    } finally {
      setLoading(false);
    }
  }, [form, validate, registrar, onCadastroSuccess, router, scrollToField, pinCoords, endereco]);

  // Confirma antes de sair se já começou a preencher (evita perder tudo por engano)
  const temDadosPreenchidos = useCallback(
    () =>
      !!(
        form.cnpj.trim() ||
        form.nomeLoja.trim() ||
        form.telefone.trim() ||
        form.email.trim() ||
        form.senha ||
        form.confirmarSenha ||
        endereco.rua.trim() ||
        endereco.cep.trim()
      ),
    [form, endereco.rua, endereco.cep],
  );

  const confirmarSaida = useCallback(() => {
    if (!temDadosPreenchidos()) {
      router.back();
      return;
    }
    Alert.alert(
      'Descartar cadastro?',
      'Você preencheu alguns dados. Se sair agora, eles serão perdidos.',
      [
        { text: 'Continuar cadastro', style: 'cancel' },
        { text: 'Descartar', style: 'destructive', onPress: () => router.back() },
      ],
    );
  }, [temDadosPreenchidos, router]);

  useFocusEffect(
    useCallback(() => {
      const sub = BackHandler.addEventListener('hardwareBackPress', () => {
        if (temDadosPreenchidos()) {
          confirmarSaida();
          return true;
        }
        return false;
      });
      return () => sub.remove();
    }, [temDadosPreenchidos, confirmarSaida]),
  );

  return {
    loading,
    errors,
    aceitouTermos,
    form,
    endereco,
    locLoading,
    pinCoords,
    scrollRef,
    fieldPositions,
    setField,
    setTelefone,
    setEnderecoField,
    clearError,
    toggleTermos,
    usarLocalizacao,
    handlePinMoved,
    limparEndereco,
    blurCnpj,
    blurEmail,
    blurTelefone,
    handleCadastro,
    confirmarSaida,
    formatCNPJ,
  };
}
