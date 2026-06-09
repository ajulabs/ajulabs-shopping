import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Platform,
  Modal,
  BackHandler,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import { EntregadorService } from '../../../../lib/authServices';
import { useAuthEntregadorStore } from '../../auth/model/store';
import { LocationPickerMap } from '../../../../components/LocationPickerMap';

const LAPI =
  (process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000').replace(/\/$/, '') + '/v1';

interface Props {
  onBack: () => void;
}

function Field({
  label,
  children,
  error,
}: {
  label: string;
  children: React.ReactNode;
  error?: string;
}) {
  return (
    <View style={s.field}>
      <Text style={[s.fieldLabel, !!error && { color: '#E14B3C' }]}>{label}</Text>
      {children}
      {!!error && <Text style={s.fieldError}>{error}</Text>}
    </View>
  );
}

function PlainInput({
  value,
  onChange,
  placeholder,
  keyboard = 'default',
  maxLength,
  autoCapitalize = 'none',
  autoCorrect = false,
  hasError = false,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  keyboard?: any;
  maxLength?: number;
  autoCapitalize?: 'none' | 'words' | 'sentences' | 'characters';
  autoCorrect?: boolean;
  hasError?: boolean;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={[s.input, focused && s.inputFocused, hasError && s.inputError]}>
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor="#9099B3"
        keyboardType={keyboard}
        maxLength={maxLength}
        autoCapitalize={autoCapitalize}
        autoCorrect={autoCorrect}
        style={s.inputInner}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />
    </View>
  );
}

type EnderecoOriginal = {
  cep: string;
  rua: string;
  numero: string;
  bairro: string;
  cidade: string;
  complemento: string;
};

export function EnderecoScreen({ onBack }: Props) {
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
          activeToken = useAuthEntregadorStore.getState().token;
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

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={tentarVoltar} activeOpacity={0.8}>
          <Ionicons name="chevron-back" size={20} color="#000933" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Endereço</Text>
      </View>

      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color="#F2760F" />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={s.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={s.section}>
            <View style={s.sectionHeader}>
              <View style={s.sectionIcon}>
                <Ionicons name="location" size={16} color="#F2760F" />
              </View>
              <Text style={s.sectionTitle}>Localização</Text>
            </View>

            {/* Botão GPS */}
            <View style={s.gpsBtnRow}>
              <TouchableOpacity
                style={[s.gpsBtn, !!gpsCoords && s.gpsBtnDone]}
                onPress={usarLocalizacao}
                disabled={locLoading}
                activeOpacity={0.8}
              >
                {locLoading ? (
                  <ActivityIndicator size="small" color="#F2760F" />
                ) : (
                  <Ionicons
                    name={gpsCoords ? 'checkmark-circle' : 'location'}
                    size={16}
                    color={gpsCoords ? '#039855' : '#F2760F'}
                  />
                )}
                <Text style={[s.gpsBtnText, !!gpsCoords && { color: '#039855' }]}>
                  {locLoading
                    ? 'Obtendo localização...'
                    : gpsCoords
                      ? 'Localização capturada'
                      : 'Usar minha localização'}
                </Text>
              </TouchableOpacity>

              {!!gpsCoords && !locLoading && (
                <TouchableOpacity style={s.clearBtn} onPress={limparGps} activeOpacity={0.8}>
                  <Ionicons name="close-circle-outline" size={15} color="#9099B3" />
                  <Text style={s.clearBtnText}>Limpar</Text>
                </TouchableOpacity>
              )}
            </View>

            {!!locError && <Text style={s.locError}>{locError}</Text>}

            {!!gpsCoords && (
              <View style={s.mapBox}>
                <LocationPickerMap
                  lat={gpsCoords.lat}
                  lng={gpsCoords.lng}
                  onLocationChange={handlePinMoved}
                  style={{ flex: 1 }}
                />
              </View>
            )}
          </View>

          <View style={[s.section, { marginTop: 12 }]}>
            <View style={s.sectionHeader}>
              <View style={s.sectionIcon}>
                <Ionicons name="home" size={16} color="#F2760F" />
              </View>
              <Text style={s.sectionTitle}>Dados do endereço</Text>
            </View>

            <View style={s.row}>
              <View style={{ flex: 1 }}>
                <Field label="CEP" error={fieldErrors.cep}>
                  <PlainInput
                    value={cep}
                    onChange={(v) => {
                      setCep(formatCep(v));
                      setFieldErrors((e) => ({ ...e, cep: '' }));
                    }}
                    placeholder="00000-000"
                    keyboard="numeric"
                    maxLength={9}
                    hasError={!!fieldErrors.cep}
                  />
                </Field>
              </View>
              <View style={{ width: 12 }} />
              <View style={{ flex: 2 }}>
                <Field label="Bairro" error={fieldErrors.bairro}>
                  <PlainInput
                    value={bairro}
                    onChange={(v) => {
                      setBairro(v.replace(/\d/g, ''));
                      setFieldErrors((e) => ({ ...e, bairro: '' }));
                    }}
                    placeholder="Ex: Centro"
                    autoCapitalize="words"
                    autoCorrect={false}
                    hasError={!!fieldErrors.bairro}
                  />
                </Field>
              </View>
            </View>

            <Field label="Rua / Avenida" error={fieldErrors.rua}>
              <PlainInput
                value={rua}
                onChange={(v) => {
                  setRua(v.replace(/\d/g, ''));
                  setFieldErrors((e) => ({ ...e, rua: '' }));
                }}
                placeholder="Ex: Rua das Flores"
                autoCapitalize="words"
                autoCorrect={false}
                hasError={!!fieldErrors.rua}
              />
            </Field>

            <View style={s.row}>
              <View style={{ flex: 1 }}>
                <Field label="Número" error={fieldErrors.numero}>
                  <PlainInput
                    value={numero}
                    onChange={(v) => {
                      setNumero(v.replace(/\D/g, '').slice(0, 7));
                      setFieldErrors((e) => ({ ...e, numero: '' }));
                    }}
                    placeholder="Ex: 123"
                    keyboard="numeric"
                    maxLength={7}
                    hasError={!!fieldErrors.numero}
                  />
                </Field>
              </View>
              <View style={{ width: 12 }} />
              <View style={{ flex: 2 }}>
                <Field label="Complemento (opcional)">
                  <PlainInput
                    value={complemento}
                    onChange={setComplemento}
                    placeholder="Ex: Apto 301, Bloco B"
                    autoCapitalize="sentences"
                    autoCorrect={false}
                    maxLength={60}
                  />
                </Field>
              </View>
            </View>

            <Field label="Cidade" error={fieldErrors.cidade}>
              <PlainInput
                value={cidade}
                onChange={(v) => {
                  setCidade(v.replace(/\d/g, ''));
                  setFieldErrors((e) => ({ ...e, cidade: '' }));
                }}
                placeholder="Ex: Aracaju"
                autoCapitalize="words"
                autoCorrect={false}
                hasError={!!fieldErrors.cidade}
              />
            </Field>

            {hasChanges && (
              <View style={s.unsavedBanner}>
                <Ionicons name="pencil" size={13} color="#F2760F" />
                <Text style={s.unsavedTxt}>Você tem alterações não salvas</Text>
                <TouchableOpacity onPress={descartar} style={s.discardBtn} activeOpacity={0.7}>
                  <Text style={s.discardTxt}>Descartar</Text>
                </TouchableOpacity>
              </View>
            )}

            <TouchableOpacity
              style={[
                s.saveBtn,
                saving && { opacity: 0.7 },
                !hasChanges && !saving && s.saveBtnDisabled,
              ]}
              onPress={salvar}
              activeOpacity={0.85}
              disabled={saving || !hasChanges}
            >
              {saving ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={s.saveBtnText}>Salvar endereço</Text>
              )}
            </TouchableOpacity>

            {!!errorMsg && (
              <View style={s.errorBanner}>
                <Ionicons name="alert-circle" size={16} color="#E14B3C" />
                <Text style={s.errorBannerTxt}>{errorMsg}</Text>
              </View>
            )}
          </View>
        </ScrollView>
      )}

      <Modal
        visible={showDiscardModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDiscardModal(false)}
      >
        <View style={s.modalOverlay}>
          <View style={s.modalBox}>
            <View style={[s.modalIconWrap, { backgroundColor: 'rgba(225,75,60,0.1)' }]}>
              <Ionicons name="warning-outline" size={36} color="#E14B3C" />
            </View>
            <Text style={s.modalTitle}>Alterações não salvas</Text>
            <Text style={s.modalMsg}>
              Você tem alterações que ainda não foram salvas. Deseja descartá-las?
            </Text>
            <TouchableOpacity
              style={s.modalBtnDanger}
              onPress={() => {
                descartar();
                setShowDiscardModal(false);
                onBack();
              }}
              activeOpacity={0.85}
            >
              <Text style={s.modalBtnDangerTxt}>Descartar e sair</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={s.modalBtnCancel}
              onPress={() => setShowDiscardModal(false)}
              activeOpacity={0.85}
            >
              <Text style={s.modalBtnCancelTxt}>Continuar editando</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={showSuccess} transparent animationType="fade">
        <View style={s.modalOverlay}>
          <View style={s.modalBox}>
            <View style={s.modalIconWrap}>
              <Ionicons name="checkmark-circle" size={40} color="#039855" />
            </View>
            <Text style={s.modalTitle}>Endereço salvo!</Text>
            <Text style={s.modalMsg}>Sua localização foi salva ou editada com sucesso.</Text>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F6F7FB' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E4E7F1',
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F6F7FB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#000933' },
  content: { padding: 16, paddingBottom: 40 },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E4E7F1',
    padding: 16,
  },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 },
  sectionIcon: {
    width: 34,
    height: 34,
    borderRadius: 9,
    backgroundColor: '#FEF0E3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#000933' },
  row: { flexDirection: 'row' },
  field: { marginBottom: 12 },
  fieldLabel: { fontSize: 12, fontWeight: '600', color: '#2A3156', marginBottom: 6 },
  input: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 13,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E4E7F1',
    backgroundColor: '#F6F7FB',
  },
  inputInner: { flex: 1, fontSize: 15, color: '#000933' },
  inputFocused: { borderColor: '#F2760F' },
  inputError: { borderColor: '#E14B3C', backgroundColor: '#FFF5F5' },
  fieldError: { fontSize: 11, color: '#E14B3C', fontWeight: '500', marginTop: 4 },
  gpsBtnRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  gpsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#F2760F',
    backgroundColor: '#FEF0E3',
  },
  gpsBtnDone: { borderColor: '#039855', backgroundColor: 'rgba(3,152,85,0.07)' },
  gpsBtnText: { fontSize: 13, fontWeight: '600', color: '#F2760F' },
  clearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#E4E7F1',
  },
  clearBtnText: { fontSize: 13, fontWeight: '600', color: '#9099B3' },
  locError: { fontSize: 11, color: '#E24B4A', marginBottom: 8, fontWeight: '500' },
  mapBox: { height: 200, borderRadius: 12, overflow: 'hidden', marginTop: 4 },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
    backgroundColor: '#F2760F',
    borderRadius: 12,
    paddingVertical: 14,
  },
  saveBtnDisabled: { backgroundColor: '#C8CDD8' },
  saveBtnText: { fontSize: 14, fontWeight: '700', color: '#FFFFFF' },
  unsavedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: '#FEF0E3',
    borderWidth: 1,
    borderColor: '#F2760F33',
  },
  unsavedTxt: { flex: 1, fontSize: 12, fontWeight: '600', color: '#F2760F' },
  discardBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#F2760F',
  },
  discardTxt: { fontSize: 12, fontWeight: '700', color: '#F2760F' },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: 'rgba(225,75,60,0.07)',
    borderWidth: 1,
    borderColor: 'rgba(225,75,60,0.25)',
  },
  errorBannerTxt: { fontSize: 13, fontWeight: '600', color: '#E14B3C', flex: 1 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  modalBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 28,
    width: '100%',
    alignItems: 'center',
  },
  modalIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(3,152,85,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  modalTitle: { fontSize: 20, fontWeight: '800', color: '#000933', marginBottom: 8 },
  modalMsg: { fontSize: 13, color: '#9099B3', textAlign: 'center', lineHeight: 19 },
  modalBtnDanger: {
    width: '100%',
    backgroundColor: '#E14B3C',
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 20,
  },
  modalBtnDangerTxt: { fontSize: 15, fontWeight: '700', color: '#FFFFFF' },
  modalBtnCancel: {
    width: '100%',
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#E4E7F1',
  },
  modalBtnCancelTxt: { fontSize: 15, fontWeight: '600', color: '#000933' },
});
