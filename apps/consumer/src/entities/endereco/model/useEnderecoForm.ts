import { useState, useCallback } from 'react';
import { Platform } from 'react-native';
import * as Location from 'expo-location';
import { EnderecoService } from '@ajulabs/api-client';
import { EnderecoSalvo } from '@ajulabs/types';

export interface EnderecoForm {
  apelido: string;
  rua: string;
  numero: string;
  bairro: string;
  cep: string;
  cidade: string;
  complemento: string;
}

interface EnderecoCoords {
  lat: number;
  lng: number;
  geoSource: 'gps';
}

export const FORM_VAZIO: EnderecoForm = {
  apelido: '',
  rua: '',
  numero: '',
  bairro: '',
  cep: '',
  cidade: 'Aracaju',
  complemento: '',
};

const API_URL =
  (process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000').replace(/\/$/, '') + '/v1';

/**
 * Lógica de formulário de endereço compartilhada entre o carrinho e a tela de
 * endereços: estado, busca por CEP (ViaCEP), geolocalização (GPS + geocode
 * reverso no backend), validação e persistência (criar/atualizar).
 */
export function useEnderecoForm(
  token: string | null,
  onSaved?: (endereco: EnderecoSalvo) => void,
  enderecosExistentes: EnderecoSalvo[] = [],
) {
  const [form, setForm] = useState<EnderecoForm>(FORM_VAZIO);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [erroGeral, setErroGeral] = useState('');
  const [buscandoCep, setBuscandoCep] = useState(false);
  const [buscandoLoc, setBuscandoLoc] = useState(false);
  const [erroLoc, setErroLoc] = useState('');
  const [coords, setCoords] = useState<EnderecoCoords | null>(null);

  const clearError = (field: string) => setErrors((e) => ({ ...e, [field]: '' }));

  const setCampo = (campo: keyof EnderecoForm, valor: string) => {
    setForm((f) => ({ ...f, [campo]: valor }));
    clearError(campo);
  };

  const buscarCep = useCallback(async (digits: string) => {
    if (digits.length !== 8) return;
    setBuscandoCep(true);
    clearError('cep');
    try {
      const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
      const data = await res.json();
      if (data.erro) {
        setErrors((e) => ({ ...e, cep: 'CEP não encontrado.' }));
        return;
      }
      setForm((f) => ({
        ...f,
        rua: data.logradouro || f.rua,
        bairro: data.bairro || f.bairro,
        cidade: data.localidade || f.cidade,
      }));
    } catch {
      setErrors((e) => ({ ...e, cep: 'Erro ao buscar CEP. Verifique sua conexão.' }));
    } finally {
      setBuscandoCep(false);
    }
  }, []);

  const onChangeCep = (v: string) => {
    const digits = v.replace(/\D/g, '').slice(0, 8);
    setForm((f) => ({ ...f, cep: digits }));
    clearError('cep');
    if (digits.length === 8) buscarCep(digits);
  };

  const usarLocalizacao = async () => {
    setBuscandoLoc(true);
    setErroLoc('');
    setCoords(null);
    try {
      let latitude: number;
      let longitude: number;

      if (Platform.OS === 'web') {
        if (!navigator?.geolocation) {
          setErroLoc('Geolocalização não suportada neste navegador.');
          return;
        }
        const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            timeout: 15000,
            enableHighAccuracy: true,
            maximumAge: 0,
          }),
        );
        latitude = pos.coords.latitude;
        longitude = pos.coords.longitude;
      } else {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setErroLoc('Permita o acesso à localização nas configurações.');
          return;
        }
        const loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.BestForNavigation,
        });
        latitude = loc.coords.latitude;
        longitude = loc.coords.longitude;
      }

      const res = await fetch(`${API_URL}/geocode/by-coords?lat=${latitude}&lng=${longitude}`);
      if (!res.ok) {
        setErroLoc('Não foi possível identificar seu endereço. Preencha manualmente.');
        return;
      }
      const data = await res.json();
      setForm((f) => ({
        ...f,
        rua: data.rua || f.rua,
        bairro: data.bairro || f.bairro,
        cidade: data.cidade || f.cidade,
        cep: data.cep || f.cep,
      }));
      setCoords({ lat: latitude, lng: longitude, geoSource: 'gps' });
      setErrors({});
    } catch (e: any) {
      const msg =
        e?.code === 1
          ? 'Permissão de localização negada pelo navegador.'
          : e?.code === 2
            ? 'Localização indisponível. Tente novamente.'
            : e?.code === 3
              ? 'Tempo esgotado. Tente novamente.'
              : 'Não foi possível obter sua localização.';
      setErroLoc(msg);
    } finally {
      setBuscandoLoc(false);
    }
  };

  const resetar = () => {
    setForm(FORM_VAZIO);
    setEditandoId(null);
    setErrors({});
    setErroGeral('');
    setErroLoc('');
    setCoords(null);
  };

  const preencherParaEdicao = (addr: EnderecoSalvo) => {
    setEditandoId(addr.id);
    setForm({
      apelido: addr.apelido,
      rua: addr.ruaRaw ?? addr.rua,
      numero: addr.numero ?? '',
      bairro: addr.bairroRaw ?? addr.bairro,
      cep: addr.cep,
      cidade: addr.cidade ?? 'Aracaju',
      complemento: addr.complemento ?? '',
    });
    setErrors({});
    setErroGeral('');
    setErroLoc('');
    setCoords(null);
  };

  const validar = () => {
    const newErrors: Record<string, string> = {};
    const apelidoNorm = form.apelido.trim().toLowerCase();
    if (!form.apelido.trim()) {
      newErrors.apelido = 'Campo obrigatório.';
    } else if (
      enderecosExistentes.some(
        (e) => e.id !== editandoId && e.apelido.trim().toLowerCase() === apelidoNorm,
      )
    ) {
      newErrors.apelido = 'Você já tem um endereço com esse apelido.';
    }
    if (!form.rua.trim()) newErrors.rua = 'Campo obrigatório.';
    if (!form.numero.trim()) newErrors.numero = 'Campo obrigatório.';
    if (!form.bairro.trim()) newErrors.bairro = 'Campo obrigatório.';
    if (!form.cidade.trim()) newErrors.cidade = 'Campo obrigatório.';
    if (form.cep.replace(/\D/g, '').length !== 8) newErrors.cep = 'CEP inválido.';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const salvar = async () => {
    setErroGeral('');
    if (!token) return;
    if (!validar()) return;

    const dados = {
      ...form,
      cep: form.cep.replace(/\D/g, ''),
      complemento: form.complemento || undefined,
      ...(coords ? { lat: coords.lat, lng: coords.lng, geoSource: coords.geoSource } : {}),
    };

    setSaving(true);
    try {
      const salvo = editandoId
        ? await EnderecoService.atualizar(token, editandoId, dados)
        : await EnderecoService.criar(token, dados);
      onSaved?.(salvo);
    } catch (e: any) {
      setErroGeral(e?.message ?? 'Não foi possível salvar o endereço.');
    } finally {
      setSaving(false);
    }
  };

  return {
    form,
    setCampo,
    editandoId,
    saving,
    errors,
    erroGeral,
    buscandoCep,
    buscandoLoc,
    erroLoc,
    onChangeCep,
    usarLocalizacao,
    resetar,
    preencherParaEdicao,
    salvar,
  };
}

export type EnderecoFormController = ReturnType<typeof useEnderecoForm>;
