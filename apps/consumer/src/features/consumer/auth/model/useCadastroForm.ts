import { useState, useCallback, useRef } from 'react';
import { ScrollView, Platform, Alert, BackHandler } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import * as Location from 'expo-location';
import { useAuthStore } from '../../../../store';
import { enrichRateLimit } from '../../../../shared/lib/enrichRateLimit';
import { validateCPF } from '../lib/formatCPF';

const LAPI =
  (process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000').replace(/\/$/, '') + '/v1';

export interface EnderecoConsumer {
  cep: string;
  rua: string;
  numero: string;
  bairro: string;
}

export function useCadastroForm(onCadastroSuccess?: () => void) {
  const router = useRouter();
  const registrar = useAuthStore((s) => s.registrar);

  const [nome, setNome] = useState('');
  const [cpf, setCpf] = useState('');
  const [telefone, setTelefone] = useState('');
  const [telefoneCompleto, setTelefoneCompleto] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [aceitouTermos, setAceitouTermos] = useState(false);
  const [endereco, setEndereco] = useState<EnderecoConsumer>({
    cep: '',
    rua: '',
    numero: '',
    bairro: '',
  });
  const [locLoading, setLocLoading] = useState(false);
  const [pinCoords, setPinCoords] = useState<{ lat: number; lng: number } | null>(null);

  const scrollRef = useRef<ScrollView>(null);
  const fieldPositions = useRef<Record<string, number>>({});

  const clearError = (...keys: string[]) =>
    setErrors((prev) => {
      if (keys.every((k) => !prev[k])) return prev;
      const next = { ...prev };
      keys.forEach((k) => delete next[k]);
      return next;
    });

  const setEnderecoField = useCallback((key: keyof EnderecoConsumer, value: string) => {
    setEndereco((prev) => ({ ...prev, [key]: value }));
  }, []);

  const limparEndereco = useCallback(() => {
    setPinCoords(null);
    setEndereco({ cep: '', rua: '', numero: '', bairro: '' });
    clearError('cep', 'rua', 'bairro', 'localizacao');
  }, []);

  const usarLocalizacao = useCallback(async () => {
    setLocLoading(true);
    clearError('localizacao');
    try {
      let lat: number, lng: number;
      if (Platform.OS === 'web') {
        const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 15000,
            maximumAge: 0,
          }),
        );
        lat = pos.coords.latitude;
        lng = pos.coords.longitude;
      } else {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setErrors((e) => ({ ...e, localizacao: 'Permissão de localização negada.' }));
          return;
        }
        const loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.BestForNavigation,
        });
        lat = loc.coords.latitude;
        lng = loc.coords.longitude;
      }
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
      setPinCoords({ lat, lng });
    } catch {
      setErrors((e) => ({ ...e, localizacao: 'Não foi possível obter sua localização.' }));
    } finally {
      setLocLoading(false);
    }
  }, []);

  const handlePinMoved = useCallback(async (lat: number, lng: number) => {
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
    } catch {
      /* silently keep previous values */
    }
  }, []);

  const checkDisponivel = useCallback(
    async (field: 'cpf' | 'email' | 'telefone', value: string) => {
      try {
        const res = await fetch(
          `${LAPI}/auth/usuario/check?field=${field}&value=${encodeURIComponent(value)}`,
        );
        if (!res.ok) return;
        const { available } = await res.json();
        if (!available) {
          const msgs: Record<string, string> = {
            cpf: 'Este CPF já possui uma conta. Faça login ou use outro CPF.',
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

  const blurNome = () => {
    const trimmed = nome.trim();
    if (!trimmed || !trimmed.includes(' ')) return;
    const parts = trimmed.split(/\s+/);
    if (parts.length < 2 || parts[1].length < 2)
      setErrors((e) => ({ ...e, nome: 'Informe seu nome e sobrenome.' }));
  };

  const blurCpf = useCallback(async () => {
    const digits = cpf.replace(/\D/g, '');
    if (!digits) return;
    if (digits.length < 11) {
      setErrors((e) => ({ ...e, cpf: 'CPF incompleto — informe os 11 dígitos.' }));
    } else if (!validateCPF(cpf)) {
      setErrors((e) => ({ ...e, cpf: 'CPF inválido. Verifique os números digitados.' }));
    } else {
      await checkDisponivel('cpf', digits);
    }
  }, [cpf, checkDisponivel]);

  const blurEmail = useCallback(async () => {
    const trimmed = email.trim();
    if (!trimmed) return;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(trimmed)) {
      setErrors((e) => ({ ...e, email: 'Email inválido.' }));
    } else {
      await checkDisponivel('email', trimmed);
    }
  }, [email, checkDisponivel]);

  const blurTelefone = useCallback(async () => {
    const digits = telefoneCompleto.replace(/\D/g, '');
    if (digits.length < 10) return;
    await checkDisponivel('telefone', telefoneCompleto.replace(/[^\d+]/g, ''));
  }, [telefoneCompleto, checkDisponivel]);

  const validate = useCallback(() => {
    const errs: Record<string, string> = {};
    const nomeParts = nome.trim().split(/\s+/);
    if (nomeParts.length < 2 || nomeParts[1].length < 2)
      errs.nome = 'Informe seu nome e sobrenome.';
    const cpfDigits = cpf.replace(/\D/g, '');
    if (cpfDigits.length < 11) errs.cpf = 'CPF incompleto — informe os 11 dígitos.';
    else if (!validateCPF(cpf)) errs.cpf = 'CPF inválido. Verifique os números digitados.';
    if (telefoneCompleto.replace(/\D/g, '').length < 10) errs.telefone = 'Telefone inválido.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())) errs.email = 'Email inválido.';
    if (senha.length < 8) errs.senha = 'A senha deve ter pelo menos 8 caracteres.';
    else if (!/[A-Z]/.test(senha)) errs.senha = 'A senha deve conter pelo menos 1 letra maiúscula.';
    else if (!/[0-9]/.test(senha)) errs.senha = 'A senha deve conter pelo menos 1 número.';
    if (!confirmar) errs.confirmar = 'Confirme sua senha.';
    else if (senha !== confirmar) errs.confirmar = 'As senhas não coincidem.';
    const hasAnyAddress = endereco.cep || endereco.rua.trim() || endereco.bairro.trim();
    if (hasAnyAddress) {
      if (!endereco.cep) {
        errs.cep = 'Informe o CEP para completar o endereço.';
      } else if (endereco.cep.length < 8) {
        errs.cep = 'CEP incompleto — informe os 8 dígitos (somente números).';
      }
      if (!endereco.rua.trim()) {
        errs.rua = 'Informe a rua ou avenida.';
      }
      if (!endereco.bairro.trim()) {
        errs.bairro = 'Informe o bairro.';
      }
    }
    if (!aceitouTermos) errs.termos = 'Aceite os Termos de Uso para continuar.';
    setErrors(errs);
    return errs;
  }, [
    nome,
    cpf,
    telefoneCompleto,
    email,
    senha,
    confirmar,
    endereco.cep,
    endereco.rua,
    endereco.bairro,
    aceitouTermos,
  ]);

  const scrollToField = useCallback((key: string) => {
    const y = fieldPositions.current[key];
    if (typeof y !== 'number') return;
    scrollRef.current?.scrollTo({ y: Math.max(0, y - 20), animated: true });
  }, []);

  const handleCadastro = useCallback(async () => {
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      const order = [
        'nome',
        'cpf',
        'telefone',
        'email',
        'senha',
        'confirmar',
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
      await registrar({ nome, cpf, telefone: telefoneCompleto, email, senha });

      // Se endereço preenchido, salva como endereço padrão
      if (endereco.rua.trim() && endereco.cep.trim()) {
        const { token } = useAuthStore.getState();
        if (token) {
          await fetch(`${LAPI}/enderecos`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({
              apelido: 'Casa',
              rua: endereco.rua,
              numero: endereco.numero || 's/n',
              bairro: endereco.bairro,
              cep: endereco.cep.replace(/\D/g, ''),
              cidade: 'Aracaju',
              ...(pinCoords ? { lat: pinCoords.lat, lng: pinCoords.lng, geoSource: 'gps' } : {}),
            }),
          }).catch(() => {});
        }
      }

      onCadastroSuccess?.();
      router.replace('/(consumer)/chat');
    } catch (err) {
      const isNetwork =
        err instanceof Error &&
        (err.message.includes('Network') ||
          err.message.includes('fetch') ||
          err.message.includes('Failed'));
      const msg = isNetwork
        ? 'Sem conexão com o servidor. Verifique sua internet.'
        : err instanceof Error
          ? err.message
          : 'Erro ao criar conta. Tente novamente.';
      const field = (err as any)?.field as string | undefined;
      if (field && fieldPositions.current[field] !== undefined) {
        setErrors({ [field]: enrichRateLimit(msg) });
        scrollToField(field);
      } else {
        setErrors({ geral: enrichRateLimit(msg) });
      }
    } finally {
      setLoading(false);
    }
  }, [validate, registrar, nome, cpf, telefoneCompleto, email, senha, onCadastroSuccess, router]);

  // Confirma antes de sair se o usuário já começou a preencher (evita perder tudo por engano)
  const temDadosPreenchidos = useCallback(
    () =>
      !!(
        nome.trim() ||
        cpf.trim() ||
        telefone.trim() ||
        email.trim() ||
        senha ||
        confirmar ||
        endereco.rua.trim() ||
        endereco.cep.trim()
      ),
    [nome, cpf, telefone, email, senha, confirmar, endereco.rua, endereco.cep],
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
    nome,
    setNome,
    cpf,
    setCpf,
    telefone,
    setTelefone,
    telefoneCompleto,
    setTelefoneCompleto,
    email,
    setEmail,
    senha,
    setSenha,
    confirmar,
    setConfirmar,
    loading,
    errors,
    clearError,
    aceitouTermos,
    setAceitouTermos,
    endereco,
    setEnderecoField,
    locLoading,
    usarLocalizacao,
    handlePinMoved,
    pinCoords,
    blurNome,
    blurCpf,
    blurEmail,
    blurTelefone,
    handleCadastro,
    confirmarSaida,
    limparEndereco,
    scrollRef,
    fieldPositions,
  };
}
