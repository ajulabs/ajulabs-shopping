import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Modal,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '@ajulabs/theme';
import { useTheme } from '../../../shared/hooks';
import { AddressMap } from '../../../shared/ui/AddressMap';
import { EnderecoFormController } from '../model/useEnderecoForm';
import { formatCEP } from '../lib/formatCEP';

interface Props {
  visible: boolean;
  controller: EnderecoFormController;
  onClose: () => void;
  showMapPreview?: boolean;
}

export function EnderecoFormModal({ visible, controller, onClose, showMapPreview = true }: Props) {
  const insets = useSafeAreaInsets();
  const { isDark, bg, surf, border, borderL, text, textSec, inputBg } = useTheme();
  const {
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
    salvar,
  } = controller;

  const mapAddress = form.rua && form.bairro ? `${form.rua}, ${form.bairro}` : '';
  const txtSec = textSec as string;

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={[styles.modal, { backgroundColor: bg }]}>
          <View
            style={[
              styles.modalHeader,
              { borderBottomColor: borderL, backgroundColor: surf, paddingTop: insets.top + 12 },
            ]}
          >
            <Text style={[styles.modalTitulo, { color: text }]}>
              {editandoId ? 'Editar Endereço' : 'Novo Endereço'}
            </Text>
            <TouchableOpacity onPress={onClose}>
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
              <View style={[styles.erroBox, isDark && { backgroundColor: 'rgba(163,45,45,0.18)' }]}>
                <Ionicons name="alert-circle-outline" size={15} color="#A32D2D" />
                <Text style={styles.erroTxt}>{erroLoc}</Text>
              </View>
            )}

            <Text style={[styles.fieldLabel, { color: txtSec }]}>Apelido *</Text>
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
              onChangeText={(v) => setCampo('apelido', v)}
              placeholder="Ex: Casa, Trabalho, Apartamento"
              placeholderTextColor={txtSec}
            />
            {!!errors.apelido && <Text style={styles.fieldError}>{errors.apelido}</Text>}

            <Text style={[styles.fieldLabel, { color: txtSec }]}>CEP *</Text>
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
                onChangeText={onChangeCep}
                placeholder="00000-000"
                placeholderTextColor={txtSec}
                keyboardType="numeric"
                maxLength={9}
              />
              {buscandoCep && (
                <ActivityIndicator size="small" color={colors.orange} style={styles.cepLoader} />
              )}
            </View>
            {!!errors.cep && <Text style={styles.fieldError}>{errors.cep}</Text>}

            <Text style={[styles.fieldLabel, { color: txtSec }]}>Rua / Avenida *</Text>
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
              onChangeText={(v) => setCampo('rua', v)}
              placeholder="Ex: Av. Ivo do Prado"
              placeholderTextColor={txtSec}
            />
            {!!errors.rua && <Text style={styles.fieldError}>{errors.rua}</Text>}

            <View style={styles.row2}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.fieldLabel, { color: txtSec }]}>Número *</Text>
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
                  onChangeText={(v) => setCampo('numero', v)}
                  placeholder="123"
                  placeholderTextColor={txtSec}
                  keyboardType="numeric"
                />
                {!!errors.numero && <Text style={styles.fieldError}>{errors.numero}</Text>}
              </View>
              <View style={{ flex: 2, marginLeft: 12 }}>
                <Text style={[styles.fieldLabel, { color: txtSec }]}>Complemento</Text>
                <TextInput
                  style={[
                    styles.input,
                    { backgroundColor: inputBg, borderColor: border, color: text },
                  ]}
                  value={form.complemento}
                  onChangeText={(v) => setCampo('complemento', v)}
                  placeholder="Apto, Bloco..."
                  placeholderTextColor={txtSec}
                />
              </View>
            </View>

            <Text style={[styles.fieldLabel, { color: txtSec }]}>Bairro *</Text>
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
              onChangeText={(v) => setCampo('bairro', v)}
              placeholder="Ex: Centro"
              placeholderTextColor={txtSec}
            />
            {!!errors.bairro && <Text style={styles.fieldError}>{errors.bairro}</Text>}

            <Text style={[styles.fieldLabel, { color: txtSec }]}>Cidade *</Text>
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
              onChangeText={(v) => setCampo('cidade', v)}
              placeholder="Aracaju"
              placeholderTextColor={txtSec}
            />
            {!!errors.cidade && <Text style={styles.fieldError}>{errors.cidade}</Text>}

            {showMapPreview && !!mapAddress && (
              <View style={[styles.mapPreview, { borderColor: border }]}>
                <Text style={[styles.mapLabel, { color: txtSec }]}>Preview do endereço</Text>
                <View style={styles.mapBox}>
                  <AddressMap address={mapAddress} />
                </View>
              </View>
            )}

            {!!erroGeral && (
              <View style={[styles.erroBox, isDark && { backgroundColor: 'rgba(163,45,45,0.18)' }]}>
                <Ionicons name="alert-circle-outline" size={15} color="#A32D2D" />
                <Text style={styles.erroTxt}>{erroGeral}</Text>
              </View>
            )}

            <TouchableOpacity
              style={[styles.saveBtn, saving && { opacity: 0.6 }]}
              onPress={salvar}
              disabled={saving}
              activeOpacity={0.85}
            >
              {saving ? (
                <ActivityIndicator color={colors.n0} />
              ) : (
                <Text style={styles.saveBtnTxt}>
                  {editandoId ? 'Salvar alterações' : 'Salvar endereço'}
                </Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
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
