import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Modal, TextInput,
  StyleSheet, ActivityIndicator, Alert, Platform, KeyboardAvoidingView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { colors } from '@ajulabs/theme';
import { EnderecoService } from '@ajulabs/api-client';
import { EnderecoSalvo } from '@ajulabs/types';
import { useAuthStore } from '../../src/store';

interface EnderecoForm {
  apelido: string;
  rua: string;
  numero: string;
  bairro: string;
  cep: string;
  cidade: string;
  complemento: string;
}

const FORM_VAZIO: EnderecoForm = {
  apelido: '', rua: '', numero: '', bairro: '',
  cep: '', cidade: 'Aracaju', complemento: '',
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
  const router = useRouter();
  const token = useAuthStore(s => s.token);

  const [enderecos, setEnderecos] = useState<EnderecoSalvo[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<EnderecoForm>(FORM_VAZIO);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [erroGeral, setErroGeral] = useState('');
  const [buscandoCep, setBuscandoCep] = useState(false);
  const [buscandoLoc, setBuscandoLoc] = useState(false);
  const [erroLoc, setErroLoc] = useState('');

  const carregar = useCallback(() => {
    if (!token) { setLoading(false); return; }
    setLoading(true);
    EnderecoService.listar(token)
      .then(setEnderecos)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token]);

  useEffect(() => { carregar(); }, [carregar]);

  const clearError = (field: string) =>
    setErrors(e => ({ ...e, [field]: '' }));

  const buscarCep = useCallback(async (digits: string) => {
    if (digits.length !== 8) return;
    setBuscandoCep(true);
    clearError('cep');
    try {
      const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
      const data = await res.json();
      if (data.erro) {
        setErrors(e => ({ ...e, cep: 'CEP não encontrado.' }));
        return;
      }
      setForm(f => ({
        ...f,
        rua: data.logradouro || f.rua,
        bairro: data.bairro || f.bairro,
        cidade: data.localidade || f.cidade,
      }));
    } catch {
      setErrors(e => ({ ...e, cep: 'Erro ao buscar CEP. Verifique sua conexão.' }));
    } finally {
      setBuscandoCep(false);
    }
  }, []);

  const usarLocalizacao = async () => {
    setBuscandoLoc(true);
    setErroLoc('');
    try {
      let latitude: number;
      let longitude: number;

      if (Platform.OS === 'web') {
        if (!navigator?.geolocation) {
          setErroLoc('Geolocalização não suportada neste navegador.');
          return;
        }
        const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000, enableHighAccuracy: false }),
        );
        latitude = pos.coords.latitude;
        longitude = pos.coords.longitude;
      } else {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setErroLoc('Permita o acesso à localização nas configurações.');
          return;
        }
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        latitude = loc.coords.latitude;
        longitude = loc.coords.longitude;
      }

      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`,
        { headers: { 'User-Agent': 'AjuLabsShopping/1.0' } },
      );
      const data = await res.json();
      const addr = data.address ?? {};
      const cepRaw = (addr.postcode ?? '').replace(/\D/g, '').slice(0, 8);
      setForm(f => ({
        ...f,
        rua: addr.road || addr.pedestrian || addr.street || f.rua,
        bairro: addr.suburb || addr.neighbourhood || addr.city_district || f.bairro,
        cidade: addr.city || addr.town || addr.village || f.cidade,
        cep: cepRaw || f.cep,
      }));
      setErrors({});
    } catch (e: any) {
      const msg = e?.code === 1 ? 'Permissão de localização negada pelo navegador.'
        : e?.code === 2 ? 'Localização indisponível. Tente novamente.'
        : e?.code === 3 ? 'Tempo esgotado. Tente novamente.'
        : 'Não foi possível obter sua localização.';
      setErroLoc(msg);
    } finally {
      setBuscandoLoc(false);
    }
  };

  const handleRemover = (id: string) => {
    const confirmar = () => {
      if (!token) return;
      EnderecoService.remover(token, id).then(carregar).catch(() =>
        Alert.alert('Erro', 'Não foi possível remover o endereço'),
      );
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
    EnderecoService.definirPadrao(token, id).then(carregar).catch(() => {});
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

    setSaving(true);
    try {
      await EnderecoService.criar(token, {
        ...form,
        cep: form.cep.replace(/\D/g, ''),
        complemento: form.complemento || undefined,
      });
      setShowModal(false);
      setForm(FORM_VAZIO);
      setErrors({});
      carregar();
    } catch (e: any) {
      setErroGeral(e?.message ?? 'Não foi possível salvar o endereço.');
    } finally {
      setSaving(false);
    }
  };

  const fecharModal = () => {
    setShowModal(false);
    setForm(FORM_VAZIO);
    setErrors({});
    setErroGeral('');
    setErroLoc('');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.btnBack}>
          <Ionicons name="chevron-back" size={20} color={colors.navy} />
        </TouchableOpacity>
        <Text style={styles.titulo}>Meus Endereços</Text>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.orange} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {enderecos.length === 0 && (
            <View style={styles.vazio}>
              <Ionicons name="location-outline" size={52} color={colors.n300} />
              <Text style={styles.vazioTitulo}>Nenhum endereço salvo</Text>
              <Text style={styles.vazioTxt}>Adicione um endereço para receber seus pedidos</Text>
            </View>
          )}

          {enderecos.map(addr => (
            <View key={addr.id} style={styles.card}>
              <View style={styles.cardIconBox}>
                <Ionicons name={iconeApelido(addr.apelido) as any} size={18} color={colors.orange} />
              </View>
              <View style={{ flex: 1 }}>
                <View style={styles.cardTitleRow}>
                  <Text style={styles.cardApelido}>{addr.apelido}</Text>
                  {addr.padrao && (
                    <View style={styles.badgePadrao}>
                      <Text style={styles.badgePadraoTxt}>Padrão</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.cardRua}>{addr.rua}</Text>
                <Text style={styles.cardBairro}>{addr.bairro} · CEP {addr.cep}</Text>
              </View>
              <View style={styles.cardActions}>
                {!addr.padrao && (
                  <TouchableOpacity onPress={() => handleDefinirPadrao(addr.id)} style={styles.actionBtn}>
                    <Ionicons name="star-outline" size={18} color={colors.orange} />
                  </TouchableOpacity>
                )}
                {!addr.padrao && (
                  <TouchableOpacity onPress={() => handleRemover(addr.id)} style={styles.actionBtn}>
                    <Ionicons name="trash-outline" size={18} color="#A32D2D" />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ))}

          <TouchableOpacity style={styles.addBtn} onPress={() => setShowModal(true)} activeOpacity={0.85}>
            <Ionicons name="add-circle-outline" size={20} color={colors.orange} />
            <Text style={styles.addBtnTxt}>Adicionar novo endereço</Text>
          </TouchableOpacity>
        </ScrollView>
      )}

      <Modal visible={showModal} animationType="slide" presentationStyle="pageSheet">
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.modal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitulo}>Novo Endereço</Text>
              <TouchableOpacity onPress={fecharModal}>
                <Ionicons name="close" size={24} color={colors.navy} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.modalScroll} showsVerticalScrollIndicator={false}>

              {/* Botão usar localização */}
              <TouchableOpacity
                style={[styles.locBtn, buscandoLoc && { opacity: 0.6 }]}
                onPress={usarLocalizacao}
                disabled={buscandoLoc}
                activeOpacity={0.8}
              >
                {buscandoLoc
                  ? <ActivityIndicator size="small" color={colors.orange} />
                  : <Ionicons name="navigate-outline" size={16} color={colors.orange} />
                }
                <Text style={styles.locBtnTxt}>
                  {buscandoLoc ? 'Buscando localização...' : 'Usar minha localização'}
                </Text>
              </TouchableOpacity>
              {!!erroLoc && (
                <View style={styles.erroBox}>
                  <Ionicons name="alert-circle-outline" size={15} color="#A32D2D" />
                  <Text style={styles.erroTxt}>{erroLoc}</Text>
                </View>
              )}

              <Text style={styles.fieldLabel}>Apelido *</Text>
              <TextInput
                style={[styles.input, !!errors.apelido && styles.inputError]}
                value={form.apelido}
                onChangeText={v => { setForm(f => ({ ...f, apelido: v })); clearError('apelido'); }}
                placeholder="Ex: Casa, Trabalho, Apartamento"
                placeholderTextColor={colors.n500}
              />
              {!!errors.apelido && <Text style={styles.fieldError}>{errors.apelido}</Text>}

              <Text style={styles.fieldLabel}>CEP *</Text>
              <View style={styles.cepRow}>
                <TextInput
                  style={[styles.input, styles.cepInput, !!errors.cep && styles.inputError]}
                  value={formatCEP(form.cep)}
                  onChangeText={v => {
                    const digits = v.replace(/\D/g, '').slice(0, 8);
                    setForm(f => ({ ...f, cep: digits }));
                    clearError('cep');
                    if (digits.length === 8) buscarCep(digits);
                  }}
                  placeholder="00000-000"
                  placeholderTextColor={colors.n500}
                  keyboardType="numeric"
                  maxLength={9}
                />
                {buscandoCep && (
                  <ActivityIndicator size="small" color={colors.orange} style={styles.cepLoader} />
                )}
              </View>
              {!!errors.cep && <Text style={styles.fieldError}>{errors.cep}</Text>}

              <Text style={styles.fieldLabel}>Rua / Avenida *</Text>
              <TextInput
                style={[styles.input, !!errors.rua && styles.inputError]}
                value={form.rua}
                onChangeText={v => { setForm(f => ({ ...f, rua: v })); clearError('rua'); }}
                placeholder="Ex: Av. Ivo do Prado"
                placeholderTextColor={colors.n500}
              />
              {!!errors.rua && <Text style={styles.fieldError}>{errors.rua}</Text>}

              <View style={styles.row2}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.fieldLabel}>Número *</Text>
                  <TextInput
                    style={[styles.input, !!errors.numero && styles.inputError]}
                    value={form.numero}
                    onChangeText={v => { setForm(f => ({ ...f, numero: v })); clearError('numero'); }}
                    placeholder="123"
                    placeholderTextColor={colors.n500}
                    keyboardType="numeric"
                  />
                  {!!errors.numero && <Text style={styles.fieldError}>{errors.numero}</Text>}
                </View>
                <View style={{ flex: 2, marginLeft: 12 }}>
                  <Text style={styles.fieldLabel}>Complemento</Text>
                  <TextInput
                    style={styles.input}
                    value={form.complemento}
                    onChangeText={v => setForm(f => ({ ...f, complemento: v }))}
                    placeholder="Apto, Bloco..."
                    placeholderTextColor={colors.n500}
                  />
                </View>
              </View>

              <Text style={styles.fieldLabel}>Bairro *</Text>
              <TextInput
                style={[styles.input, !!errors.bairro && styles.inputError]}
                value={form.bairro}
                onChangeText={v => { setForm(f => ({ ...f, bairro: v })); clearError('bairro'); }}
                placeholder="Ex: Centro"
                placeholderTextColor={colors.n500}
              />
              {!!errors.bairro && <Text style={styles.fieldError}>{errors.bairro}</Text>}

              <Text style={styles.fieldLabel}>Cidade *</Text>
              <TextInput
                style={[styles.input, !!errors.cidade && styles.inputError]}
                value={form.cidade}
                onChangeText={v => { setForm(f => ({ ...f, cidade: v })); clearError('cidade'); }}
                placeholder="Aracaju"
                placeholderTextColor={colors.n500}
              />
              {!!errors.cidade && <Text style={styles.fieldError}>{errors.cidade}</Text>}

              {!!erroGeral && (
                <View style={styles.erroBox}>
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
                {saving
                  ? <ActivityIndicator color={colors.n0} />
                  : <Text style={styles.saveBtnTxt}>Salvar endereço</Text>}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container:      { flex: 1, backgroundColor: '#FAFBFE' },
  header:         { flexDirection: 'row', alignItems: 'center', gap: 12,
                    paddingHorizontal: 16, paddingTop: 52, paddingBottom: 14,
                    backgroundColor: colors.n0, borderBottomWidth: 1, borderBottomColor: colors.n100 },
  btnBack:        { width: 38, height: 38, borderRadius: 19, backgroundColor: colors.n50,
                    alignItems: 'center', justifyContent: 'center' },
  titulo:         { fontSize: 20, fontWeight: '700', color: colors.navy },
  center:         { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll:         { padding: 16, paddingBottom: 40 },
  vazio:          { alignItems: 'center', paddingVertical: 56, gap: 10 },
  vazioTitulo:    { fontSize: 17, fontWeight: '700', color: colors.navy },
  vazioTxt:       { fontSize: 13, color: colors.n600, textAlign: 'center' },
  card:           { flexDirection: 'row', gap: 12, alignItems: 'flex-start', padding: 14,
                    backgroundColor: colors.n0, borderRadius: 14, marginBottom: 12,
                    borderWidth: 1, borderColor: colors.n200 },
  cardIconBox:    { width: 40, height: 40, borderRadius: 12, backgroundColor: colors.orange100,
                    alignItems: 'center', justifyContent: 'center' },
  cardTitleRow:   { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardApelido:    { fontSize: 15, fontWeight: '700', color: colors.navy },
  cardRua:        { fontSize: 13, color: colors.n600, marginTop: 3 },
  cardBairro:     { fontSize: 12, color: colors.n600 },
  badgePadrao:    { backgroundColor: colors.orange100, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 99 },
  badgePadraoTxt: { fontSize: 10, fontWeight: '600', color: colors.orange600 },
  cardActions:    { gap: 8 },
  actionBtn:      { width: 34, height: 34, borderRadius: 9, backgroundColor: colors.n50,
                    alignItems: 'center', justifyContent: 'center' },
  addBtn:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
                    paddingVertical: 14, borderRadius: 14, borderWidth: 1.5, borderStyle: 'dashed',
                    borderColor: colors.orange, marginTop: 4 },
  addBtnTxt:      { fontSize: 14, fontWeight: '600', color: colors.orange },
  modal:          { flex: 1, backgroundColor: '#FAFBFE' },
  modalHeader:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                    paddingHorizontal: 20, paddingTop: 20, paddingBottom: 16,
                    borderBottomWidth: 1, borderBottomColor: colors.n100, backgroundColor: colors.n0 },
  modalTitulo:    { fontSize: 18, fontWeight: '700', color: colors.navy },
  modalScroll:    { padding: 20 },
  locBtn:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
                    paddingVertical: 12, borderRadius: 12, borderWidth: 1.5,
                    borderColor: colors.orange, backgroundColor: colors.orange100, marginBottom: 8 },
  locBtnTxt:      { fontSize: 13, fontWeight: '600', color: colors.orange },
  fieldLabel:     { fontSize: 12, fontWeight: '600', color: colors.n600, marginBottom: 6, marginTop: 14 },
  input:          { backgroundColor: colors.n0, borderRadius: 12, borderWidth: 1, borderColor: colors.n200,
                    paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: colors.navy },
  inputError:     { borderColor: '#E24B4A' },
  fieldError:     { fontSize: 11, color: '#E24B4A', marginTop: 4, fontWeight: '500' },
  cepRow:         { flexDirection: 'row', alignItems: 'center' },
  cepInput:       { flex: 1 },
  cepLoader:      { marginLeft: 10 },
  row2:           { flexDirection: 'row' },
  erroBox:        { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 14,
                    padding: 12, backgroundColor: '#FCEBEB', borderRadius: 10 },
  erroTxt:        { flex: 1, fontSize: 13, color: '#A32D2D' },
  saveBtn:        { backgroundColor: colors.orange, height: 52, borderRadius: 14, marginTop: 24,
                    alignItems: 'center', justifyContent: 'center',
                    shadowColor: colors.orange, shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.3, shadowRadius: 14, elevation: 4 },
  saveBtnTxt:     { color: colors.n0, fontSize: 15, fontWeight: '700' },
});
