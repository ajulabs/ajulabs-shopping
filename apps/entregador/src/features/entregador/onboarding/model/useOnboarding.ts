import { useState, useCallback, useRef, useEffect } from 'react';
import { ScrollView, Alert, Platform, BackHandler } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { useAuthEntregadorStore } from '../../../../store';
import { EntregadorService } from '../../../../shared/lib/authServices';
import { validateCPF } from '../../../../shared/lib/formatCPF';
import { enrichRateLimit } from '../../../../shared/lib/enrichRateLimit';
import { LAPI, Data } from './constants';
import { validarPasso1 } from './validation';

interface UseOnboardingArgs {
  onDone: (result: 'submitted' | 'cancel') => void;
}

export function useOnboarding({ onDone }: UseOnboardingArgs) {
  const registrar = useAuthEntregadorStore((s) => s.registrar);
  const setFotoUrl = useAuthEntregadorStore((s) => s.setFotoUrl);

  const [step, setStep] = useState(0);
  const [data, setData] = useState<Data>({});
  const [erros, setErros] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [frenteUri, setFrenteUri] = useState<string | null>(null);
  const [versoUri, setVersoUri] = useState<string | null>(null);
  const [docModal, setDocModal] = useState<'frente' | 'verso' | null>(null);
  const [locLoading, setLocLoading] = useState(false);
  const [gpsCoords, setGpsCoords] = useState<{ lat: number; lng: number } | null>(null);

  const checkDisponivel = useCallback(
    async (field: 'cpf' | 'email' | 'telefone', value: string) => {
      try {
        const res = await fetch(
          `${LAPI}/auth/entregador/check?field=${field}&value=${encodeURIComponent(value)}`,
        );
        if (!res.ok) return;
        const { available } = await res.json();
        if (!available) {
          const msgs: Record<string, string> = {
            cpf: 'Este CPF já possui uma conta. Faça login ou use outro CPF.',
            email: 'Este e-mail já está em uso. Faça login ou use outro e-mail.',
            telefone: 'Este celular já está cadastrado. Faça login ou use outro número.',
          };
          setErros((prev) => ({
            ...prev,
            [field === 'telefone' ? 'celular' : field]: msgs[field],
          }));
        }
      } catch {
        // falha silenciosa
      }
    },
    [],
  );

  const onBlurCpf = useCallback(async () => {
    const digits = (data.cpf || '').replace(/\D/g, '');
    if (digits.length < 11 || !validateCPF(data.cpf || '')) return;
    await checkDisponivel('cpf', digits);
  }, [data.cpf, checkDisponivel]);

  const onBlurEmail = useCallback(async () => {
    const trimmed = (data.email || '').trim();
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(trimmed)) return;
    await checkDisponivel('email', trimmed);
  }, [data.email, checkDisponivel]);

  const pickDoc = (lado: 'frente' | 'verso') => setDocModal(lado);

  const launchCamera = async () => {
    const lado = docModal;
    setDocModal(null);
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permissão necessária', 'Permita o acesso à câmera nas configurações.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ allowsEditing: true, quality: 0.8 });
    if (!result.canceled && result.assets[0]) {
      if (lado === 'frente') setFrenteUri(result.assets[0].uri);
      else if (lado === 'verso') setVersoUri(result.assets[0].uri);
    }
  };

  const launchGallery = async () => {
    const lado = docModal;
    setDocModal(null);
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permissão necessária', 'Permita o acesso à galeria nas configurações.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      if (lado === 'frente') setFrenteUri(result.assets[0].uri);
      else if (lado === 'verso') setVersoUri(result.assets[0].uri);
    }
  };

  const pickPhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled && result.assets[0]) {
      setPhotoUri(result.assets[0].uri);
      setErros((e) => {
        const n = { ...e };
        delete n.foto;
        return n;
      });
    }
  };

  const geocodeCoords = useCallback(async (lat: number, lng: number) => {
    try {
      const res = await fetch(`${LAPI}/geocode/by-coords?lat=${lat}&lng=${lng}`);
      if (!res.ok) return;
      const geoData = await res.json();
      setData((d) => ({
        ...d,
        cep: (geoData.cep ?? d.cep ?? '').replace(/\D/g, ''),
        rua: geoData.rua || d.rua || '',
        bairro: geoData.bairro || d.bairro || '',
        cidade: geoData.cidade || d.cidade || '',
      }));
    } catch {
      // geocode falhou silenciosamente — usuário pode preencher manualmente
    }
  }, []);

  const usarLocalizacao = async () => {
    setLocLoading(true);
    setErros((e) => ({ ...e, localizacao: '' }));
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
          setErros((e) => ({ ...e, localizacao: msg }));
          return;
        }
      } else {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setErros((e) => ({ ...e, localizacao: 'Permissão de localização negada.' }));
          return;
        }
        const loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        lat = loc.coords.latitude;
        lng = loc.coords.longitude;
      }
      setGpsCoords({ lat, lng });
      await geocodeCoords(lat, lng);
    } finally {
      setLocLoading(false);
    }
  };

  const handlePinMoved = useCallback(
    async (lat: number, lng: number) => {
      setGpsCoords({ lat, lng });
      await geocodeCoords(lat, lng);
    },
    [geocodeCoords],
  );

  const up = (k: string, v: string) => {
    setData((d) => ({ ...d, [k]: v }));
    setErros((e) => {
      if (!e[k]) return e;
      const next = { ...e };
      delete next[k];
      return next;
    });
  };
  const needsVehicle = data.transporte !== 'bike';

  // Transporte vem antes de Documentos para que o label CNH/RG seja correto
  const steps = [
    { title: 'Dados pessoais' },
    { title: 'Transporte' },
    ...(needsVehicle ? [{ title: 'Veículo' }] : []),
    { title: 'Documentos' },
    { title: 'Bancário' },
    { title: 'Revisão' },
  ];

  const isLast = step === steps.length - 1;
  const cur = steps[step];

  const next = async () => {
    if (step === 0) {
      const e = validarPasso1(data);
      if (!photoUri) e.foto = 'Adicione uma foto de perfil para continuar.';
      if (Object.keys(e).length > 0) {
        setErros(e);
        return;
      }
      setErros({});
    }

    if (cur.title === 'Transporte') {
      if (!data.transporte) {
        setErros({ transporte: 'Selecione seu meio de transporte para continuar.' });
        return;
      }
      setErros({});
    }

    if (cur.title === 'Veículo') {
      const e: Record<string, string> = {};
      const placaClean = (data.placa || '').replace(/[^a-zA-Z0-9]/g, '');
      if (!placaClean) {
        e.placa = 'Informe a placa do veículo.';
      } else if (placaClean.length < 7) {
        e.placa = 'Placa incompleta — formato: ABC-1234 ou ABC-1D23.';
      }
      if (!data.modelo?.trim()) e.modelo = 'Informe o modelo do veículo.';
      if (!data.cor?.trim()) {
        e.cor = 'Informe a cor do veículo.';
      }
      if (!data.ano?.trim()) {
        e.ano = 'Informe o ano do veículo.';
      } else {
        const ano = parseInt(data.ano, 10);
        const anoAtual = new Date().getFullYear();
        if (isNaN(ano) || ano < 1990 || ano > anoAtual) {
          e.ano = `Informe um ano válido entre 1990 e ${anoAtual}.`;
        }
      }
      if (Object.keys(e).length > 0) {
        setErros(e);
        return;
      }
      setErros({});
    }

    if (cur.title === 'Bancário') {
      const hasPix = !!data.pix?.trim();
      const hasBanco = !!data.banco;
      const hasAgenciaConta = !!data.agencia?.trim() && !!data.conta?.trim();
      const e: Record<string, string> = {};
      if (!hasPix && !hasBanco) {
        e.pix = 'Informe sua chave Pix ou selecione um banco para continuar.';
      } else if (hasBanco && !hasAgenciaConta) {
        e.conta = 'Informe a agência e a conta do banco selecionado.';
      }
      if (Object.keys(e).length > 0) {
        setErros(e);
        return;
      }
      setErros({});
    }

    if (cur.title === 'Documentos') {
      if (!frenteUri) {
        Alert.alert(
          'Documento obrigatório',
          `Tire uma foto da frente do seu ${data.transporte === 'bike' ? 'RG' : 'CNH'}.`,
        );
        return;
      }
      if (!versoUri) {
        Alert.alert(
          'Documento obrigatório',
          `Tire uma foto do verso do seu ${data.transporte === 'bike' ? 'RG' : 'CNH'}.`,
        );
        return;
      }
    }

    if (!isLast) {
      setStep((s) => s + 1);
      return;
    }

    setLoading(true);
    setSubmitError('');
    console.log(
      '[Entregador][Onboarding] Enviando cadastro — nome:',
      data.nome,
      '| cpf:',
      data.cpf,
      '| email:',
      data.email,
      '| transporte:',
      data.transporte,
    );
    try {
      const celFull = (data.celularCompleto || data.celular || '').replace(/[^\d+]/g, '');
      console.log('[Entregador][Onboarding] Registrando conta...');
      await registrar({
        nome: data.nome,
        cpf: (data.cpf || '').replace(/\D/g, ''),
        telefone: celFull || `+55${(data.celular || '').replace(/\D/g, '')}`,
        email: data.email,
        senha: data.senha,
        tipoTransporte: (data.transporte || 'moto') as 'bike' | 'moto' | 'carro',
      });
      const currentToken = useAuthEntregadorStore.getState().token;
      console.log(
        '[Entregador][Onboarding] Conta criada — token:',
        currentToken ? 'presente' : 'ausente',
      );

      if (currentToken) {
        if (data.transporte === 'bike') {
          console.log('[Entregador][Onboarding] Cadastrando veículo (bicicleta)...');
          await EntregadorService.cadastrarVeiculo(currentToken, {
            placa: 'BICICLETA',
            modelo: 'Bicicleta',
            cor: (data.cor || 'Não informado').trim(),
            ano: parseInt(data.ano) || new Date().getFullYear(),
          }).catch((err) =>
            console.warn('[Entregador][Onboarding] Falha ao cadastrar veículo:', err),
          );
        } else if (data.placa && data.modelo) {
          console.log('[Entregador][Onboarding] Cadastrando veículo:', data.modelo, data.placa);
          await EntregadorService.cadastrarVeiculo(currentToken, {
            placa: data.placa.trim(),
            modelo: data.modelo.trim(),
            cor: (data.cor || 'Não informado').trim(),
            ano: parseInt(data.ano) || new Date().getFullYear(),
          }).catch((err) =>
            console.warn('[Entregador][Onboarding] Falha ao cadastrar veículo:', err),
          );
        }
      }

      if (currentToken && gpsCoords) {
        fetch(`${LAPI}/entregador/localizacao`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${currentToken}` },
          body: JSON.stringify({ lat: gpsCoords.lat, lng: gpsCoords.lng }),
        }).catch(() => {});
      }

      if (currentToken && data.cep && data.rua && data.numero && data.bairro && data.cidade) {
        await EntregadorService.atualizarEndereco(currentToken, {
          cep: data.cep.replace(/\D/g, ''),
          rua: data.rua.trim(),
          numero: data.numero.trim(),
          bairro: data.bairro.trim(),
          cidade: data.cidade.trim(),
          ...(gpsCoords ? { lat: gpsCoords.lat, lng: gpsCoords.lng } : {}),
        }).catch((err) => console.warn('[Entregador][Onboarding] Falha ao salvar endereço:', err));
      }

      if (currentToken && (data.pix || data.banco)) {
        const hasPix = !!data.pix;
        const temConta = !hasPix && !!data.banco && !!data.agencia && !!data.conta;
        if (hasPix) {
          console.log('[Entregador][Onboarding] Salvando chave Pix:', data.pixTipo, data.pix);
          await EntregadorService.atualizarDadosBancarios(currentToken, {
            tipo: 'pix',
            chavePix: data.pix,
          }).catch((err) => console.warn('[Entregador][Onboarding] Falha ao salvar Pix:', err));
        } else if (temConta) {
          console.log('[Entregador][Onboarding] Salvando conta bancária — banco:', data.banco);
          await EntregadorService.atualizarDadosBancarios(currentToken, {
            tipo: 'conta',
            banco: data.banco,
            agencia: data.agencia,
            conta: data.conta,
          }).catch((err) =>
            console.warn('[Entregador][Onboarding] Falha ao salvar conta bancária:', err),
          );
        }
      }

      if (currentToken && frenteUri && versoUri) {
        console.log('[Entregador][Onboarding] Enviando documentos de identidade...');
        await EntregadorService.uploadDocumentosIdentidade(currentToken, frenteUri, versoUri).catch(
          (err) => console.warn('[Entregador][Onboarding] Falha ao enviar documentos:', err),
        );
      }

      if (photoUri && currentToken) {
        console.log('[Entregador][Onboarding] Enviando foto de perfil...');
        const url = await EntregadorService.atualizarFoto(currentToken, photoUri);
        await setFotoUrl(url);
      }

      console.log('[Entregador][Onboarding] Cadastro concluído com sucesso');
      onDone('submitted');
    } catch (e: any) {
      console.error('[Entregador][Onboarding] Erro no cadastro:', e);
      const isNetwork =
        e?.message &&
        (e.message.includes('Network') ||
          e.message.includes('fetch') ||
          e.message.includes('Failed'));
      const msg = enrichRateLimit(
        isNetwork
          ? 'Sem conexão com o servidor. Verifique sua internet.'
          : (e?.message ?? 'Erro ao cadastrar. Tente novamente.'),
      );
      const field = e?.field as string | undefined;
      if (field) {
        setErros((prev) => ({ ...prev, [field === 'telefone' ? 'celular' : field]: msg }));
        setStep(0);
        setTimeout(() => scrollRef.current?.scrollTo({ y: 0, animated: true }), 100);
      } else {
        setSubmitError(msg);
        setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
      }
    } finally {
      setLoading(false);
    }
  };

  const temDadosPreenchidos = useCallback(
    () =>
      !!(
        (data.nome || '').trim() ||
        (data.cpf || '').trim() ||
        (data.celular || '').trim() ||
        (data.email || '').trim() ||
        data.senha ||
        data.transporte ||
        photoUri ||
        frenteUri ||
        versoUri
      ),
    [data, photoUri, frenteUri, versoUri],
  );

  const confirmarSaida = useCallback(() => {
    if (!temDadosPreenchidos()) {
      onDone('cancel');
      return;
    }
    Alert.alert(
      'Descartar cadastro?',
      'Você preencheu alguns dados. Se sair agora, eles serão perdidos.',
      [
        { text: 'Continuar cadastro', style: 'cancel' },
        { text: 'Descartar', style: 'destructive', onPress: () => onDone('cancel') },
      ],
    );
  }, [temDadosPreenchidos, onDone]);

  const prev = () => {
    if (step === 0) confirmarSaida();
    else setStep((s) => s - 1);
  };

  // Botão físico de voltar do Android: usa ref para sempre ver o step/data atuais
  const backRef = useRef<() => boolean>(() => false);
  backRef.current = () => {
    if (step > 0) {
      setStep((s) => s - 1);
      return true;
    }
    if (temDadosPreenchidos()) {
      confirmarSaida();
      return true;
    }
    return false;
  };
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => backRef.current());
    return () => sub.remove();
  }, []);

  const onClearGps = () => {
    setGpsCoords(null);
    setData((d) => ({ ...d, cep: '', rua: '', bairro: '' }));
    setErros((e) => ({ ...e, localizacao: '' }));
  };

  return {
    step,
    data,
    erros,
    submitError,
    loading,
    scrollRef,
    photoUri,
    frenteUri,
    versoUri,
    docModal,
    setDocModal,
    locLoading,
    gpsCoords,
    onBlurCpf,
    onBlurEmail,
    pickDoc,
    launchCamera,
    launchGallery,
    pickPhoto,
    handlePinMoved,
    usarLocalizacao,
    up,
    steps,
    isLast,
    cur,
    next,
    prev,
    onClearGps,
  };
}
