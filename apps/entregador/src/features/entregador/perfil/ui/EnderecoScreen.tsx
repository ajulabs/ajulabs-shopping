import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LocationPickerMap } from '../../../../shared/ui/LocationPickerMap';
import { useEndereco } from '../model/useEndereco';
import { Field } from './components/EnderecoField';
import { PlainInput } from './components/EnderecoPlainInput';
import { DiscardModal, SuccessModal } from './components/EnderecoModals';

interface Props {
  onBack: () => void;
}

export function EnderecoScreen({ onBack }: Props) {
  const {
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
  } = useEndereco(onBack);

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

      <DiscardModal
        visible={showDiscardModal}
        onRequestClose={() => setShowDiscardModal(false)}
        onDiscard={() => {
          descartar();
          setShowDiscardModal(false);
          onBack();
        }}
        onCancel={() => setShowDiscardModal(false)}
      />

      <SuccessModal visible={showSuccess} />
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
});
