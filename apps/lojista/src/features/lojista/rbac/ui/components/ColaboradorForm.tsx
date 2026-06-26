import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  Modal,
  Pressable,
} from 'react-native';
import type { Colaborador } from '@ajulabs/types';
import { colors } from '../../../../../theme';
import { FormState } from '../../lib/colaboradores';
import { RoleSelectMenu } from './RoleSelectMenu';
import { useTheme } from '../../../../../shared/hooks';

interface Props {
  visible: boolean;
  editando: Colaborador | null;
  form: FormState;
  setForm: React.Dispatch<React.SetStateAction<FormState>>;
  salvando: boolean;
  erro: string;
  onSalvar: () => void;
  onFechar: () => void;
}

export function ColaboradorForm({
  visible,
  editando,
  form,
  setForm,
  salvando,
  erro,
  onSalvar,
  onFechar,
}: Props) {
  const theme = useTheme();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onFechar}>
      <Pressable style={styles.overlay} onPress={onFechar}>
        <Pressable
          style={[styles.sheet, { backgroundColor: theme.surf }]}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={[styles.handle, { backgroundColor: theme.border }]} />
          <Text style={[styles.sheetTitle, { color: theme.text }]}>
            {editando ? 'Editar colaborador' : 'Novo colaborador'}
          </Text>

          <CampoTexto
            label="NOME"
            value={form.nome}
            onChange={(v) => setForm((f) => ({ ...f, nome: v }))}
            placeholder="Nome completo"
          />
          <CampoTexto
            label="EMAIL"
            value={form.email}
            onChange={(v) => setForm((f) => ({ ...f, email: v }))}
            placeholder="email@loja.com"
            keyboardType="email-address"
            editable={!editando}
          />
          <CampoTexto
            label={editando ? 'NOVA SENHA (opcional)' : 'SENHA'}
            value={form.senha}
            onChange={(v) => setForm((f) => ({ ...f, senha: v }))}
            placeholder="••••••••"
            secureTextEntry
          />

          {/* Papel selector */}
          <RoleSelectMenu
            value={form.papel}
            onChange={(p) => setForm((f) => ({ ...f, papel: p }))}
          />

          {erro ? <Text style={styles.erroText}>{erro}</Text> : null}

          <TouchableOpacity
            style={[styles.salvarBtn, salvando && { opacity: 0.7 }]}
            onPress={onSalvar}
            disabled={salvando}
          >
            {salvando ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.salvarBtnText}>Salvar</Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.cancelarBtn, { borderColor: theme.border }]}
            onPress={onFechar}
          >
            <Text style={[styles.cancelarText, { color: theme.textSec }]}>Cancelar</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function CampoTexto({
  label,
  value,
  onChange,
  placeholder,
  secureTextEntry,
  keyboardType,
  editable = true,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address';
  editable?: boolean;
}) {
  const theme = useTheme();
  return (
    <View style={styles.campo}>
      <Text style={[styles.campoLabel, { color: theme.textSec }]}>{label}</Text>
      <TextInput
        style={[
          styles.campoInput,
          { backgroundColor: theme.inputBg, borderColor: theme.border, color: theme.text },
          !editable && { opacity: 0.5 },
        ]}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={theme.textMut}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType ?? 'default'}
        autoCapitalize="none"
        editable={editable}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,9,51,0.6)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: '#fff',
    borderRadius: 24,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    padding: 24,
    paddingBottom: 40,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E2E8F0',
    alignSelf: 'center',
    marginBottom: 20,
  },
  sheetTitle: { fontSize: 18, fontWeight: '700', color: colors.navy, marginBottom: 20 },

  campo: { marginBottom: 14 },
  campoLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.n600,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 5,
  },
  campoInput: {
    height: 46,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 14,
    fontSize: 14,
    color: colors.navy,
  },

  erroText: { fontSize: 12, color: '#E24B4A', marginBottom: 10, fontWeight: '500' },

  salvarBtn: {
    height: 50,
    borderRadius: 14,
    backgroundColor: colors.orange,
    alignItems: 'center',
    justifyContent: 'center',
  },
  salvarBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
  cancelarBtn: {
    height: 44,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  cancelarText: { fontSize: 14, fontWeight: '600', color: colors.n600 },
});
