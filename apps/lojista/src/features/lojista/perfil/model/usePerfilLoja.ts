import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { LojistaService } from '@ajulabs/api-client';
import {
  buscarEnderecoPorCep,
  obterCoordenadasAtuais,
  reverseGeocode,
} from '../../../../entities/endereco';
import { useAuthLojistaStore } from '../../../../store';
import { HORARIOS_INICIAIS, type HorarioDia } from '../lib/horarios';

interface LojaData {
  nome: string;
  categoria: string;
  descricao: string;
  telefone: string;
  rua: string;
  numero: string;
  complemento: string;
  bairro: string;
  cep: string;
  cidade: string;
  aceitaAgendamento: boolean;
  antecedenciaMinima: string;
}

export function usePerfilLoja() {
  const token = useAuthLojistaStore((s) => s.token);
  const lojaId = useAuthLojistaStore((s) => s.lojaId);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const originalLojaRef = useRef<LojaData | null>(null);
  const originalHorariosRef = useRef<HorarioDia[]>(HORARIOS_INICIAIS);
  const [uploading, setUploading] = useState<'logo' | 'banner' | null>(null);
  const [logoutVisible, setLogoutVisible] = useState(false);
  const [horarios, setHorarios] = useState<HorarioDia[]>(HORARIOS_INICIAIS);
  const [logoUri, setLogoUri] = useState<string | null>(null);
  const [bannerUri, setBannerUri] = useState<string | null>(null);
  const [loja, setLoja] = useState<LojaData>({
    nome: '',
    categoria: '',
    descricao: '',
    telefone: '',
    rua: '',
    numero: '',
    complemento: '',
    bairro: '',
    cep: '',
    cidade: '',
    aceitaAgendamento: false,
    antecedenciaMinima: '120',
  });

  useEffect(() => {
    if (!token || !lojaId) {
      setLoading(false);
      return;
    }
    LojistaService.buscarLojaDetalhes(lojaId, token)
      .then((raw) => {
        if (!raw) return;
        const lojaData: LojaData = {
          nome: raw.nome ?? '',
          categoria: raw.categoria ?? '',
          descricao: raw.descricao ?? '',
          telefone: raw.telefone ?? '',
          rua: raw.endereco?.rua ?? '',
          numero: raw.endereco?.numero ?? '',
          complemento: raw.endereco?.complemento ?? '',
          bairro: raw.endereco?.bairro ?? '',
          cep: raw.endereco?.cep ?? '',
          cidade: raw.endereco?.cidade ?? '',
          aceitaAgendamento: raw.aceitaAgendamento ?? false,
          antecedenciaMinima: String(raw.antecedenciaMinima ?? 120),
        };
        setLoja(lojaData);
        originalLojaRef.current = lojaData;
        if (raw.logoUrl) setLogoUri(raw.logoUrl);
        if (raw.bannerUrl) setBannerUri(raw.bannerUrl);
        if (raw.horarios && raw.horarios.length > 0) {
          const horariosData = HORARIOS_INICIAIS.map((h, i) => {
            const bh = raw.horarios.find((x: any) => x.diaSemana === i);
            if (!bh) return h;
            return { ...h, ativo: bh.ativo, abertura: bh.abertura, fechamento: bh.fechamento };
          });
          setHorarios(horariosData);
          originalHorariosRef.current = horariosData;
        } else {
          originalHorariosRef.current = [...HORARIOS_INICIAIS];
        }
      })
      .finally(() => setLoading(false));
  }, [token, lojaId]);

  const [buscandoCep, setBuscandoCep] = useState(false);
  const [buscandoLoc, setBuscandoLoc] = useState(false);
  const [erroLoc, setErroLoc] = useState('');

  const updateLoja = useCallback((key: keyof LojaData, value: string | boolean) => {
    setLoja((prev) => ({ ...prev, [key]: value }));
  }, []);

  const buscarCep = useCallback(async (raw: string) => {
    const digits = raw.replace(/\D/g, '');
    if (digits.length !== 8) return;
    setBuscandoCep(true);
    try {
      const data = await buscarEnderecoPorCep(digits);
      if (!data) {
        Alert.alert('CEP não encontrado');
        return;
      }
      setLoja((prev) => ({
        ...prev,
        rua: data.rua || prev.rua,
        bairro: data.bairro || prev.bairro,
        cidade: data.cidade || prev.cidade,
      }));
    } catch {
      Alert.alert('Erro', 'Não foi possível buscar o CEP.');
    } finally {
      setBuscandoCep(false);
    }
  }, []);

  const usarLocalizacao = async () => {
    setBuscandoLoc(true);
    setErroLoc('');
    try {
      const { latitude, longitude } = await obterCoordenadasAtuais();
      const data = await reverseGeocode(latitude, longitude);
      setLoja((prev) => ({
        ...prev,
        rua: data.rua || prev.rua,
        bairro: data.bairro || prev.bairro,
        cidade: data.cidade || prev.cidade,
        cep: data.cep || prev.cep,
      }));
    } catch (e: any) {
      const msg =
        e?.code === 1
          ? 'Permissão negada.'
          : e?.code === 3
            ? 'Tempo esgotado.'
            : e?.message === 'Geolocalização não suportada.'
              ? 'Geolocalização não suportada.'
              : 'Não foi possível obter localização.';
      setErroLoc(msg);
    } finally {
      setBuscandoLoc(false);
    }
  };

  const updateHorario = useCallback((index: number, updated: HorarioDia) => {
    setHorarios((prev) => prev.map((h, i) => (i === index ? updated : h)));
  }, []);

  const handleLogout = useCallback(() => {
    setLogoutVisible(true);
  }, []);

  const pickAndUpload = useCallback(
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

      // preview local imediato
      if (tipo === 'logo') setLogoUri(uri);
      else setBannerUri(uri);

      setUploading(tipo);
      try {
        await LojistaService.atualizarImagemLoja(lojaId, token, tipo, uri);
      } catch (err) {
        const msg =
          err instanceof Error ? err.message : 'Não foi possível fazer o upload. Tente novamente.';
        Alert.alert('Erro ao enviar imagem', msg);
        if (tipo === 'logo') setLogoUri(null);
        else setBannerUri(null);
      } finally {
        setUploading(null);
      }
    },
    [token, lojaId],
  );

  const [savedVersion, setSavedVersion] = useState(0);

  const isDirty = useMemo(() => {
    if (!originalLojaRef.current) return false;
    return (
      JSON.stringify(loja) !== JSON.stringify(originalLojaRef.current) ||
      JSON.stringify(horarios) !== JSON.stringify(originalHorariosRef.current)
    );
    // savedVersion força re-execução do memo após salvar, sem alterar loja/horarios
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loja, horarios, savedVersion]);

  const handleDescartar = useCallback(() => {
    if (!originalLojaRef.current) return;
    setLoja({ ...originalLojaRef.current });
    setHorarios(originalHorariosRef.current.map((h) => ({ ...h })));
  }, []);

  const handleSalvar = useCallback(async () => {
    if (!token || !lojaId) {
      Alert.alert('Erro', 'Sessão inválida.');
      return;
    }
    setSaving(true);
    try {
      await LojistaService.atualizarLoja(lojaId, token, {
        nome: loja.nome,
        descricao: loja.descricao,
        categoria: loja.categoria,
        telefone: loja.telefone,
        aceitaAgendamento: loja.aceitaAgendamento,
        antecedenciaMinima: parseInt(loja.antecedenciaMinima, 10) || 120,
        horarios: horarios.map((h, i) => ({
          diaSemana: i,
          ativo: h.ativo,
          abertura: h.abertura,
          fechamento: h.fechamento,
        })),
        ...(loja.bairro || loja.cep || loja.cidade
          ? {
              endereco: {
                rua: loja.rua,
                numero: loja.numero,
                complemento: loja.complemento,
                bairro: loja.bairro,
                cep: loja.cep,
                cidade: loja.cidade,
              },
            }
          : {}),
      });
      originalLojaRef.current = { ...loja };
      originalHorariosRef.current = horarios.map((h) => ({ ...h }));
      setSavedVersion((v) => v + 1);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Erro ao salvar.';
      Alert.alert('Erro', msg);
    } finally {
      setSaving(false);
    }
  }, [token, lojaId, loja, horarios]);

  const hoje = new Date();
  const diaSemana = hoje.getDay();
  const mapDia = [6, 0, 1, 2, 3, 4, 5];
  const horarioHoje = horarios[mapDia[diaSemana]];
  const agoraMin = hoje.getHours() * 60 + hoje.getMinutes();
  const [aH, aM] = (horarioHoje?.abertura || '00:00').split(':').map(Number);
  const [fH, fM] = (horarioHoje?.fechamento || '00:00').split(':').map(Number);
  const abertaAgora = horarioHoje?.ativo && agoraMin >= aH * 60 + aM && agoraMin < fH * 60 + fM;

  return {
    loja,
    horarios,
    logoUri,
    bannerUri,
    loading,
    saving,
    saveSuccess,
    uploading,
    logoutVisible,
    setLogoutVisible,
    buscandoCep,
    buscandoLoc,
    erroLoc,
    isDirty,
    abertaAgora,
    updateLoja,
    updateHorario,
    buscarCep,
    usarLocalizacao,
    handleLogout,
    handleDescartar,
    handleSalvar,
    pickAndUpload,
  };
}
