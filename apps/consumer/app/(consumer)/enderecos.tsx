import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { colors } from '@ajulabs/theme';
import { EnderecoService } from '@ajulabs/api-client';
import { EnderecoSalvo } from '@ajulabs/types';
import { useAuthStore } from '../../src/store';
import { useTheme, useHardwareBack, useGoBack } from '../../src/hooks';
import { AddressMap } from '../../src/components/AddressMap';

interface EnderecoForm {
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

const FORM_VAZIO: EnderecoForm = {
  apelido: '',
  rua: '',
  numero: '',
  bairro: '',
  cep: '',
  cidade: 'Aracaju',
  complemento: '',
};

function formatCEP(value: string): string {
  const d = value.replace(/\D/g, '').slice(0, 8);
  return d.length > 5 ? `${d.slice(0, 5)}-${d.slice(5)}` : d;
}

function iconeApelido(apelido: string): string {
  const a = apelido.toLowerCase();
  if (a.includes('casa') || a.includes('home')) return 'home';
  if (a.includes('trabalho') || a.includes('work') || a.includes('emprego')) return 'briefcase';
  return 'location';
}

export default function EnderecosScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const token = useAuthStore((s) => s.token);
  const { isDark, bg, surf, border, borderL, text, textSec, backBtn, inputBg, iconBg } = useTheme();

  const [enderecos, setEnderecos] = useState<EnderecoSalvo[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [enderecoEditandoId, setEnderecoEditandoId] = useState<string | null>(null);
  const [form, setForm] = useState<EnderecoForm>(FORM_VAZIO);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [erroGeral, setErroGeral] = useState('');
  const [buscandoCep, setBuscandoCep] = useState(false);
  const [buscandoLoc, setBuscandoLoc] = useState(false);
  const [erroLoc, setErroLoc] = useState('');
  const [coords, setCoords] = useState<EnderecoCoords | null>(null);

  const carregar = useCallback(() => {
    if (!token) {
      setLoading(false);
      return;
    }
    setLoading(true);
    EnderecoService.listar(token)
      .then(setEnderecos)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const clearError = (field: string) => setErrors((e) => ({ ...e, [field]: '' }));

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
        // P0: enableHighAccuracy: true para máxima precisão
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
        // P0: BestForNavigation para máxima precisão no nativo
        const loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.BestForNavigation,
        });
        latitude = loc.coords.latitude;
        longitude = loc.coords.longitude;
      }

      // P1: Chama backend /by-coords que enriquece o CEP via ViaCEP
      const API_URL =
        (process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000').replace(/\/$/, '') + '/v1';
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

      // Armazena coords para enviar ao salvar (P1: persistir no banco)
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

  const handleEditar = (addr: EnderecoSalvo) => {
    setEnderecoEditandoId(addr.id);
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
    setShowModal(true);
  };

  const handleRemover = (addr: EnderecoSalvo) => {
    if (addr.padrao) {
      const outro = enderecos.find((e) => e.id !== addr.id);
      if (!outro) {
        if (Platform.OS === 'web') {
          window.alert('Não é possível remover o único endereço cadastrado.');
        } else {
          Alert.alert('Atenção', 'Não é possível remover o único endereço cadastrado.');
        }
        return;
      }
      const confirmar = async () => {
        if (!token) return;
        try {
          await EnderecoService.definirPadrao(token, outro.id);
          await EnderecoService.remover(token, addr.id);
          carregar();
        } catch {
          Alert.alert('Erro', 'Não foi possível remover o endereço');
        }
      };
      if (Platform.OS === 'web') {
        if (
          window.confirm(
            `"${outro.apelido}" será definido como padrão e "${addr.apelido}" será removido. Continuar?`,
          )
        )
          confirmar();
      } else {
        Alert.alert(
          'Remover endereço padrão',
          `"${outro.apelido}" será definido como padrão e "${addr.apelido}" será removido. Continuar?`,
          [
            { text: 'Cancelar', style: 'cancel' },
            { text: 'Remover', style: 'destructive', onPress: confirmar },
          ],
        );
      }
      return;
    }

    const confirmar = () => {
      if (!token) return;
      EnderecoService.remover(token, addr.id)
        .then(carregar)
        .catch(() => Alert.alert('Erro', 'Não foi possível remover o endereço'));
    };
    if (Platform.OS === 'web') {
      if (window.confirm('Remover este endereço?')) confirmar();
    } else {
      Alert.alert('Remover endereço', 'Deseja remover este endereço?', [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Remover', style: 'destructive', onPress: confirmar },
      ]);
    }
  };

  const handleDefinirPadrao = (id: string) => {
    if (!token) return;
    const anterior = enderecos;
    setEnderecos((prev) => prev.map((e) => ({ ...e, padrao: e.id === id })));
    EnderecoService.definirPadrao(token, id).catch(() => setEnderecos(anterior));
  };

  const handleSalvar = async () => {
    setErroGeral('');
    if (!token) return;

    const newErrors: Record<string, string> = {};
    if (!form.apelido.trim()) newErrors.apelido = 'Campo obrigatório.';
    if (!form.rua.trim()) newErrors.rua = 'Campo obrigatório.';
    if (!form.numero.trim()) newErrors.numero = 'Campo obrigatório.';
    if (!form.bairro.trim()) newErrors.bairro = 'Campo obrigatório.';
    if (!form.cidade.trim()) newErrors.cidade = 'Campo obrigatório.';
    if (form.cep.replace(/\D/g, '').length !== 8) newErrors.cep = 'CEP inválido.';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const dados = {
      ...form,
      cep: form.cep.replace(/\D/g, ''),
      complemento: form.complemento || undefined,
      // P1: envia coords capturadas via GPS para persistir no banco
      ...(coords ? { lat: coords.lat, lng: coords.lng, geoSource: coords.geoSource } : {}),
    };

    setSaving(true);
    try {
      if (enderecoEditandoId) {
        await EnderecoService.atualizar(token, enderecoEditandoId, dados);
      } else {
        await EnderecoService.criar(token, dados);
      }
      fecharModal();
      carregar();
    } catch (e: any) {
      setErroGeral(e?.message ?? 'Não foi possível salvar o endereço.');
    } finally {
      setSaving(false);
    }
  };

  const fecharModal = () => {
    setShowModal(false);
    setEnderecoEditandoId(null);
    setForm(FORM_VAZIO);
    setErrors({});
    setErroGeral('');
    setErroLoc('');
    setCoords(null);
  };

  const mapAddress = form.rua && form.bairro ? `${form.rua}, ${form.bairro}` : '';

  // Voltar segue a pilha; fallback para o perfil
  const goBack = useGoBack('/(consumer)/perfil');

  // Botão físico de voltar: fecha o modal se aberto, senão volta na pilha
  useHardwareBack(() => {
    if (showModal) {
      fecharModal();
      return true;
    }
    goBack();
    return true;
  });

  return (
    <View style={[styles.container, { backgroundColor: bg }]}>
      <View
        style={[
          styles.header,
          { backgroundColor: surf, borderBottomColor: borderL, paddingTop: insets.top + 12 },
        ]}
      >
        <TouchableOpacity
          onPress={() => router.navigate('/(consumer)/perfil')}
          style={[styles.btnBack, { backgroundColor: backBtn }]}
        >
          <Ionicons name="chevron-back" size={20} color={text} />
        </TouchableOpacity>
        <Text style={[styles.titulo, { color: text }]}>Meus Endereços</Text>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.orange} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {enderecos.length === 0 && (
            <View style={styles.vazio}>
              <Ionicons
                name="location-outline"
                size={52}
                color={isDark ? 'rgba(255,255,255,0.2)' : colors.n300}
              />
              <Text style={[styles.vazioTitulo, { color: text }]}>Nenhum endereço salvo</Text>
              <Text style={[styles.vazioTxt, { color: textSec as string }]}>
                Adicione um endereço para receber seus pedidos
              </Text>
            </View>
          )}

          {enderecos.map((addr) => (
            <View
              key={addr.id}
              style={[styles.card, { backgroundColor: surf, borderColor: border }]}
            >
              <View style={[styles.cardIconBox, { backgroundColor: iconBg }]}>
                <Ionicons
                  name={iconeApelido(addr.apelido) as any}
                  size={18}
                  color={colors.orange}
                />
              </View>
              <View style={{ flex: 1 }}>
                <View style={styles.cardTitleRow}>
                  <Text style={[styles.cardApelido, { color: text }]}>{addr.apelido}</Text>
                  {addr.padrao && (
                    <View style={styles.badgePadrao}>
                      <Text style={styles.badgePadraoTxt}>Padrão</Text>
                    </View>
                  )}
                </View>
                <Text style={[styles.cardRua, { color: textSec as string }]}>{addr.rua}</Text>
                <Text style={[styles.cardBairro, { color: textSec as string }]}>
                  {addr.bairro} · CEP {addr.cep}
                </Text>
              </View>
              <View style={styles.cardActions}>
                <TouchableOpacity
                  onPress={() => handleEditar(addr)}
                  style={[styles.actionBtn, { backgroundColor: backBtn }]}
                >
                  <Ionicons name="pencil-outline" size={17} color={colors.orange} />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => !addr.padrao && handleDefinirPadrao(addr.id)}
                  style={[
                    styles.actionBtn,
                    { backgroundColor: addr.padrao ? colors.orange100 : backBtn },
                  ]}
                  activeOpacity={addr.padrao ? 1 : 0.7}
                >
                  <Ionicons
                    name={addr.padrao ? 'star' : 'star-outline'}
                    size={17}
                    color={colors.orange}
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleRemover(addr)}
                  style={[
                    styles.actionBtn,
                    { backgroundColor: isDark ? 'rgba(163,45,45,0.18)' : '#FCEBEB' },
                  ]}
                >
                  <Ionicons name="trash-outline" size={17} color="#A32D2D" />
                </TouchableOpacity>
              </View>
            </View>
          ))}

          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => setShowModal(true)}
            activeOpacity={0.85}
          >
            <Ionicons name="add-circle-outline" size={20} color={colors.orange} />
            <Text style={styles.addBtnTxt}>Adicionar novo endereço</Text>
          </TouchableOpacity>
        </ScrollView>
      )}

      <Modal visible={showModal} animationType="slide" onRequestClose={fecharModal}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={[styles.modal, { backgroundColor: bg }]}>
            <View
              style={[
                styles.modalHeader,
                {
                  borderBottomColor: borderL,
                  backgroundColor: surf,
                  paddingTop: insets.top + 12,
                },
              ]}
            >
              <Text style={[styles.modalTitulo, { color: text }]}>
                {enderecoEditandoId ? 'Editar Endereço' : 'Novo Endereço'}
              </Text>
              <TouchableOpacity onPress={fecharModal}>
                <Ionicons name="close" size={24} color={text} />
              </TouchableOpacity>
            </View>

            <ScrollView
              contentContainerStyle={styles.modalScroll}
              showsVerticalScrollIndicator={false}
            >
              <TouchableOpacity
                style={[styles.locBtn, buscandoLoc && { opacity: 0.6 }]}
                onPress={usarLocalizacao}
                disabled={buscandoLoc}
                activeOpacity={0.8}
              >
                {buscandoLoc ? (
                  <ActivityIndicator size="small" color={colors.orange} />
                ) : (
                  <Ionicons name="navigate-outline" size={16} color={colors.orange} />
                )}
                <Text style={styles.locBtnTxt}>
                  {buscandoLoc ? 'Buscando localização...' : 'Usar minha localização'}
                </Text>
              </TouchableOpacity>
              {!!erroLoc && (
                <View
                  style={[styles.erroBox, isDark && { backgroundColor: 'rgba(163,45,45,0.18)' }]}
                >
                  <Ionicons name="alert-circle-outline" size={15} color="#A32D2D" />
                  <Text style={styles.erroTxt}>{erroLoc}</Text>
                </View>
              )}

              <Text style={[styles.fieldLabel, { color: textSec as string }]}>Apelido *</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: inputBg,
                    borderColor: errors.apelido ? '#E24B4A' : border,
                    color: text,
                  },
                ]}
                value={form.apelido}
                onChangeText={(v) => {
                  setForm((f) => ({ ...f, apelido: v }));
                  clearError('apelido');
                }}
                placeholder="Ex: Casa, Trabalho, Apartamento"
                placeholderTextColor={textSec as string}
              />
              {!!errors.apelido && <Text style={styles.fieldError}>{errors.apelido}</Text>}

              <Text style={[styles.fieldLabel, { color: textSec as string }]}>CEP *</Text>
              <View style={styles.cepRow}>
                <TextInput
                  style={[
                    styles.input,
                    styles.cepInput,
                    {
                      backgroundColor: inputBg,
                      borderColor: errors.cep ? '#E24B4A' : border,
                      color: text,
                    },
                  ]}
                  value={formatCEP(form.cep)}
                  onChangeText={(v) => {
                    const digits = v.replace(/\D/g, '').slice(0, 8);
                    setForm((f) => ({ ...f, cep: digits }));
                    clearError('cep');
                    if (digits.length === 8) buscarCep(digits);
                  }}
                  placeholder="00000-000"
                  placeholderTextColor={textSec as string}
                  keyboardType="numeric"
                  maxLength={9}
                />
                {buscandoCep && (
                  <ActivityIndicator size="small" color={colors.orange} style={styles.cepLoader} />
                )}
              </View>
              {!!errors.cep && <Text style={styles.fieldError}>{errors.cep}</Text>}

              <Text style={[styles.fieldLabel, { color: textSec as string }]}>Rua / Avenida *</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: inputBg,
                    borderColor: errors.rua ? '#E24B4A' : border,
                    color: text,
                  },
                ]}
                value={form.rua}
                onChangeText={(v) => {
                  setForm((f) => ({ ...f, rua: v }));
                  clearError('rua');
                }}
                placeholder="Ex: Av. Ivo do Prado"
                placeholderTextColor={textSec as string}
              />
              {!!errors.rua && <Text style={styles.fieldError}>{errors.rua}</Text>}

              <View style={styles.row2}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.fieldLabel, { color: textSec as string }]}>Número *</Text>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        backgroundColor: inputBg,
                        borderColor: errors.numero ? '#E24B4A' : border,
                        color: text,
                      },
                    ]}
                    value={form.numero}
                    onChangeText={(v) => {
                      setForm((f) => ({ ...f, numero: v }));
                      clearError('numero');
                    }}
                    placeholder="123"
                    placeholderTextColor={textSec as string}
                    keyboardType="numeric"
                  />
                  {!!errors.numero && <Text style={styles.fieldError}>{errors.numero}</Text>}
                </View>
                <View style={{ flex: 2, marginLeft: 12 }}>
                  <Text style={[styles.fieldLabel, { color: textSec as string }]}>Complemento</Text>
                  <TextInput
                    style={[
                      styles.input,
                      { backgroundColor: inputBg, borderColor: border, color: text },
                    ]}
                    value={form.complemento}
                    onChangeText={(v) => setForm((f) => ({ ...f, complemento: v }))}
                    placeholder="Apto, Bloco..."
                    placeholderTextColor={textSec as string}
                  />
                </View>
              </View>

              <Text style={[styles.fieldLabel, { color: textSec as string }]}>Bairro *</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: inputBg,
                    borderColor: errors.bairro ? '#E24B4A' : border,
                    color: text,
                  },
                ]}
                value={form.bairro}
                onChangeText={(v) => {
                  setForm((f) => ({ ...f, bairro: v }));
                  clearError('bairro');
                }}
                placeholder="Ex: Centro"
                placeholderTextColor={textSec as string}
              />
              {!!errors.bairro && <Text style={styles.fieldError}>{errors.bairro}</Text>}

              <Text style={[styles.fieldLabel, { color: textSec as string }]}>Cidade *</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: inputBg,
                    borderColor: errors.cidade ? '#E24B4A' : border,
                    color: text,
                  },
                ]}
                value={form.cidade}
                onChangeText={(v) => {
                  setForm((f) => ({ ...f, cidade: v }));
                  clearError('cidade');
                }}
                placeholder="Aracaju"
                placeholderTextColor={textSec as string}
              />
              {!!errors.cidade && <Text style={styles.fieldError}>{errors.cidade}</Text>}

              {!!mapAddress && (
                <View style={[styles.mapPreview, { borderColor: border }]}>
                  <Text style={[styles.mapLabel, { color: textSec as string }]}>
                    Preview do endereço
                  </Text>
                  <View style={styles.mapBox}>
                    <AddressMap address={mapAddress} />
                  </View>
                </View>
              )}

              {!!erroGeral && (
                <View
                  style={[styles.erroBox, isDark && { backgroundColor: 'rgba(163,45,45,0.18)' }]}
                >
                  <Ionicons name="alert-circle-outline" size={15} color="#A32D2D" />
                  <Text style={styles.erroTxt}>{erroGeral}</Text>
                </View>
              )}

              <TouchableOpacity
                style={[styles.saveBtn, saving && { opacity: 0.6 }]}
                onPress={handleSalvar}
                disabled={saving}
                activeOpacity={0.85}
              >
                {saving ? (
                  <ActivityIndicator color={colors.n0} />
                ) : (
                  <Text style={styles.saveBtnTxt}>
                    {enderecoEditandoId ? 'Salvar alterações' : 'Salvar endereço'}
                  </Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  btnBack: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titulo: { fontSize: 20, fontWeight: '700' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: { padding: 16, paddingBottom: 40 },
  vazio: { alignItems: 'center', paddingVertical: 56, gap: 10 },
  vazioTitulo: { fontSize: 17, fontWeight: '700' },
  vazioTxt: { fontSize: 13, textAlign: 'center' },
  card: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
    padding: 14,
    borderRadius: 14,
    marginBottom: 12,
    borderWidth: 1,
  },
  cardIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardApelido: { fontSize: 15, fontWeight: '700' },
  cardRua: { fontSize: 13, marginTop: 3 },
  cardBairro: { fontSize: 12 },
  badgePadrao: {
    backgroundColor: colors.orange100,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 99,
  },
  badgePadraoTxt: { fontSize: 10, fontWeight: '600', color: colors.orange600 },
  cardActions: { gap: 8 },
  actionBtn: {
    width: 34,
    height: 34,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.orange,
    marginTop: 4,
  },
  addBtnTxt: { fontSize: 14, fontWeight: '600', color: colors.orange },
  modal: { flex: 1 },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  modalTitulo: { fontSize: 18, fontWeight: '700' },
  modalScroll: { padding: 20 },
  locBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.orange,
    backgroundColor: colors.orange100,
    marginBottom: 8,
  },
  locBtnTxt: { fontSize: 13, fontWeight: '600', color: colors.orange },
  fieldLabel: { fontSize: 12, fontWeight: '600', marginBottom: 6, marginTop: 14 },
  input: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
  },
  fieldError: { fontSize: 11, color: '#E24B4A', marginTop: 4, fontWeight: '500' },
  cepRow: { flexDirection: 'row', alignItems: 'center' },
  cepInput: { flex: 1 },
  cepLoader: { marginLeft: 10 },
  row2: { flexDirection: 'row' },
  erroBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 14,
    padding: 12,
    backgroundColor: '#FCEBEB',
    borderRadius: 10,
  },
  erroTxt: { flex: 1, fontSize: 13, color: '#A32D2D' },
  mapPreview: { marginTop: 16, borderRadius: 12, borderWidth: 1, overflow: 'hidden' },
  mapLabel: {
    fontSize: 11,
    fontWeight: '600',
    paddingHorizontal: 12,
    paddingVertical: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  mapBox: { height: 150 },
  saveBtn: {
    backgroundColor: colors.orange,
    height: 52,
    borderRadius: 14,
    marginTop: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.orange,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 14,
    elevation: 4,
  },
  saveBtnTxt: { color: colors.n0, fontSize: 15, fontWeight: '700' },
});
