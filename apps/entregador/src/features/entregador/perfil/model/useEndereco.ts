import { useEffect, useState, useCallback } from 'react';
import { Platform, BackHandler } from 'react-native';
import * as Location from 'expo-location';
import { EntregadorService } from '../../../../shared/lib/authServices';
import { useAuthEntregadorStore } from '../../../../store';

const LAPI =
  (process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000').replace(/\/$/, '') + '/v1';

export type EnderecoOriginal = {
  cep: string;
  rua: string;
  numero: string;
  bairro: string;
  cidade: string;
  complemento: string;
};

export function useEndereco(onBack: () => void) {
  const token = useAuthEntregadorStore((s) => s.token);
  const refreshAccessToken = useAuthEntregadorStore((s) => s.refreshAccessToken);

  const [cep, setCep] = useState('');
  const [rua, setRua] = useState('');
  const [numero, setNumero] = useState('');
  const [bairro, setBairro] = useState('');
  const [cidade, setCidade] = useState('');
  const [complemento, setComplemento] = useState('');
  const [original, setOriginal] = useState<EnderecoOriginal | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [locLoading, setLocLoading] = useState(false);
  const [gpsCoords, setGpsCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locError, setLocError] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [showDiscardModal, setShowDiscardModal] = useState(false);

  const formatCep = (v: string) => {
    const d = v.replace(/\D/g, '').slice(0, 8);
    return d.length > 5 ? `${d.slice(0, 5)}-${d.slice(5)}` : d;
  };

  const carregarPerfil = useCallback(
    async (tk: string) => {
      const p = await EntregadorService.buscarPerfil(tk);
      if (!p) {
        const ok = await refreshAccessToken();
        if (ok) {
          const newTk = useAuthEntregadorStore.getState().token;
          if (newTk) return carregarPerfil(newTk);
        }
        return;
      }
      const end = p?.entregador?.endereco ?? p?.onboarding?.endereco ?? {};
      const cepFmt = formatCep(end.cep ?? '');
      const ruaVal = end.rua ?? '';
      const numVal = end.numero ?? '';
      const bairroVal = end.bairro ?? '';
      const cidadeVal = end.cidade ?? '';
      const compVal = end.complemento ?? '';
      setCep(cepFmt);
      setRua(ruaVal);
      setNumero(numVal);
      setBairro(bairroVal);
      setCidade(cidadeVal);
      setComplemento(compVal);
      setOriginal({
        cep: cepFmt,
        rua: ruaVal,
        numero: numVal,
        bairro: bairroVal,
        cidade: cidadeVal,
        complemento: compVal,
      });
      if (end.lat && end.lng) {
        setGpsCoords({ lat: end.lat, lng: end.lng });
      }
    },
    [refreshAccessToken],
  );

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }
    carregarPerfil(token).finally(() => setLoading(false));
  }, [token, carregarPerfil]);

  const geocodeCoords = useCallback(async (lat: number, lng: number) => {
    try {
      const res = await fetch(`${LAPI}/geocode/by-coords?lat=${lat}&lng=${lng}`);
      if (!res.ok) return;
      const data = await res.json();
      if (data.cep) setCep(formatCep(data.cep));
      if (data.rua) setRua(data.rua);
      if (data.bairro) setBairro(data.bairro);
      if (data.cidade) setCidade(data.cidade);
    } catch {
      // geocode silencioso — usuário preenche manualmente
    }
  }, []);

  const usarLocalizacao = async () => {
    setLocLoading(true);
    setLocError('');
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
          setLocError(
            geoErr?.code === 1
              ? 'Permissão negada. Permita o acesso no navegador e tente novamente.'
              : 'Não foi possível obter sua localização. Verifique se o GPS está ativo.',
          );
          return;
        }
      } else {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setLocError('Permissão de localização negada.');
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

  const limparGps = () => {
    setGpsCoords(null);
    setLocError('');
    setFieldErrors({});
    if (original) {
      setCep(original.cep);
      setRua(original.rua);
      setBairro(original.bairro);
      setCidade(original.cidade);
      setComplemento(original.complemento);
      setNumero(original.numero);
    } else {
      setCep('');
      setRua('');
      setBairro('');
      setCidade('');
      setNumero('');
    }
  };

  const hasChanges =
    original !== null &&
    (cep !== original.cep ||
      rua.trim() !== original.rua ||
      numero.trim() !== original.numero ||
      bairro.trim() !== original.bairro ||
      cidade.trim() !== original.cidade ||
      complemento.trim() !== original.complemento);

  const descartar = () => {
    if (original) {
      setCep(original.cep);
      setRua(original.rua);
      setNumero(original.numero);
      setBairro(original.bairro);
      setCidade(original.cidade);
      setComplemento(original.complemento);
    } else {
      setCep('');
      setRua('');
      setNumero('');
      setBairro('');
      setCidade('');
      setComplemento('');
    }
    setGpsCoords(null);
    setFieldErrors({});
    setErrorMsg('');
  };

  const tentarVoltar = useCallback(() => {
    if (hasChanges) {
      setShowDiscardModal(true);
    } else {
      onBack();
    }
  }, [hasChanges, onBack]);

  useEffect(() => {
    if (Platform.OS !== 'android') return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      tentarVoltar();
      return true;
    });
    return () => sub.remove();
  }, [tentarVoltar]);

  const salvar = async () => {
    if (!token) return;
    const erros: Record<string, string> = {};
    if (cep.replace(/\D/g, '').length < 8) erros.cep = 'CEP inválido';
    if (!rua.trim()) erros.rua = 'Informe a rua';
    if (!numero.trim()) erros.numero = 'Informe o número';
    if (!bairro.trim()) erros.bairro = 'Informe o bairro';
    if (!cidade.trim()) erros.cidade = 'Informe a cidade';
    if (Object.keys(erros).length > 0) {
      setFieldErrors(erros);
      return;
    }
    setFieldErrors({});

    if (
      original &&
      cep === original.cep &&
      rua.trim() === original.rua &&
      numero.trim() === original.numero &&
      bairro.trim() === original.bairro &&
      cidade.trim() === original.cidade &&
      complemento.trim() === original.complemento
    ) {
      setErrorMsg('Nenhuma alteração foi feita no endereço.');
      setTimeout(() => setErrorMsg(''), 4000);
      return;
    }
    setSaving(true);
    setErrorMsg('');
    setShowSuccess(false);
    const payload = {
      cep: cep.replace(/\D/g, ''),
      rua: rua.trim(),
      numero: numero.trim(),
      bairro: bairro.trim(),
      cidade: cidade.trim(),
      complemento: complemento.trim() || undefined,
      lat: gpsCoords?.lat,
      lng: gpsCoords?.lng,
    };
    const doSave = async (tk: string) => {
      await EntregadorService.atualizarEndereco(tk, payload);
    };
    try {
      let activeToken = token;
      try {
        await doSave(activeToken);
      } catch (e: any) {
        if (e?.message === 'Token inválido') {
          const ok = await refreshAccessToken();
          if (!ok) throw new Error('Sessão expirada. Faça login novamente.');
          activeToken = useAuthEntregadorStore.getState().token ?? '';
          if (!activeToken) throw new Error('Sessão expirada. Faça login novamente.');
          await doSave(activeToken);
        } else {
          throw e;
        }
      }
      setOriginal({
        cep,
        rua: rua.trim(),
        numero: numero.trim(),
        bairro: bairro.trim(),
        cidade: cidade.trim(),
        complemento: complemento.trim(),
      });
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        onBack();
      }, 2200);
    } catch (e: any) {
      setErrorMsg(e?.message ?? 'Não foi possível atualizar o endereço.');
      setTimeout(() => setErrorMsg(''), 5000);
    } finally {
      setSaving(false);
    }
  };

  return {
    cep,
    setCep,
    rua,
    setRua,
    numero,
    setNumero,
    bairro,
    setBairro,
    cidade,
    setCidade,
    complemento,
    setComplemento,
    loading,
    saving,
    locLoading,
    gpsCoords,
    locError,
    showSuccess,
    errorMsg,
    fieldErrors,
    setFieldErrors,
    showDiscardModal,
    setShowDiscardModal,
    formatCep,
    usarLocalizacao,
    handlePinMoved,
    limparGps,
    hasChanges,
    descartar,
    tentarVoltar,
    salvar,
  };
}
