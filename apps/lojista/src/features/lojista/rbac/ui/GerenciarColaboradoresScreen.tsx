import { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Modal,
  Alert,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RBACService } from '@ajulabs/api-client';
import type { Colaborador, PapelColaborador } from '@ajulabs/types';
import { colors } from '../../../../theme';
import { useAuthLojistaStore } from '../../auth/model/store';

interface Props {
  onVoltar: () => void;
}

const PAPEL_LABEL: Record<PapelColaborador, string> = {
  admin: 'Administrador',
  gerente: 'Gerente',
  funcionario: 'Funcionário',
};

const PAPEL_COLOR: Record<PapelColaborador, string> = {
  admin: '#7C3AED',
  gerente: '#2563EB',
  funcionario: '#059669',
};

interface FormState {
  nome: string;
  email: string;
  senha: string;
  papel: PapelColaborador;
}

const FORM_INICIAL: FormState = { nome: '', email: '', senha: '', papel: 'funcionario' };

export function GerenciarColaboradoresScreen({ onVoltar }: Props) {
  const lojaId = useAuthLojistaStore((s) => s.lojaId);
  const token = useAuthLojistaStore((s) => s.token);

  const [colaboradores, setColaboradores] = useState<Colaborador[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisivel, setModalVisivel] = useState(false);
  const [editando, setEditando] = useState<Colaborador | null>(null);
  const [form, setForm] = useState<FormState>(FORM_INICIAL);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');

  const carregar = useCallback(async () => {
    if (!lojaId || !token) return;
    setLoading(true);
    try {
      const lista = await RBACService.listarColaboradores(lojaId, token);
      setColaboradores(lista);
    } catch {
      Alert.alert('Erro', 'Não foi possível carregar os colaboradores.');
    } finally {
      setLoading(false);
    }
  }, [lojaId, token]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const abrirCriacao = useCallback(() => {
    setEditando(null);
    setForm(FORM_INICIAL);
    setErro('');
    setModalVisivel(true);
  }, []);

  const abrirEdicao = useCallback((col: Colaborador) => {
    setEditando(col);
    setForm({ nome: col.nome, email: col.email, senha: '', papel: col.papel });
    setErro('');
    setModalVisivel(true);
  }, []);

  const salvar = useCallback(async () => {
    if (!form.nome.trim() || !form.email.trim()) {
      setErro('Nome e email são obrigatórios.');
      return;
    }
    if (!editando && !form.senha.trim()) {
      setErro('Senha é obrigatória para novo colaborador.');
      return;
    }
    if (!lojaId || !token) return;
    setSalvando(true);
    setErro('');
    try {
      if (editando) {
        await RBACService.atualizarColaborador(editando.id, lojaId, token, {
          nome: form.nome.trim(),
          papel: form.papel,
          ativo: true,
          ...(form.senha.trim() ? { senha: form.senha.trim() } : {}),
        });
      } else {
        await RBACService.criarColaborador(lojaId, token, {
          nome: form.nome.trim(),
          email: form.email.trim(),
          senha: form.senha.trim(),
          papel: form.papel,
        });
      }
      setModalVisivel(false);
      carregar();
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao salvar.');
    } finally {
      setSalvando(false);
    }
  }, [form, editando, lojaId, token, carregar]);

  const alternarAtivo = useCallback(
    async (col: Colaborador) => {
      if (!lojaId || !token) return;
      try {
        await RBACService.atualizarColaborador(col.id, lojaId, token, { ativo: !col.ativo });
        carregar();
      } catch {
        Alert.alert('Erro', 'Não foi possível alterar o status.');
      }
    },
    [lojaId, token, carregar],
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onVoltar} hitSlop={12} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.navy} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Colaboradores</Text>
        <TouchableOpacity style={styles.addBtn} onPress={abrirCriacao}>
          <Ionicons name="add" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.orange} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.lista}>
          {colaboradores.length === 0 && (
            <Text style={styles.emptyText}>Nenhum colaborador cadastrado.</Text>
          )}
          {colaboradores.map((col) => (
            <View key={col.id} style={[styles.card, !col.ativo && styles.cardInativo]}>
              <View style={styles.cardMain}>
                <View
                  style={[styles.avatarCircle, { backgroundColor: PAPEL_COLOR[col.papel] + '22' }]}
                >
                  <Text style={[styles.avatarLetter, { color: PAPEL_COLOR[col.papel] }]}>
                    {col.nome.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={styles.cardInfo}>
                  <Text style={styles.cardNome}>{col.nome}</Text>
                  <Text style={styles.cardEmail}>{col.email}</Text>
                  <View
                    style={[styles.papelBadge, { backgroundColor: PAPEL_COLOR[col.papel] + '18' }]}
                  >
                    <Text style={[styles.papelText, { color: PAPEL_COLOR[col.papel] }]}>
                      {PAPEL_LABEL[col.papel]}
                    </Text>
                  </View>
                </View>
              </View>
              <View style={styles.cardActions}>
                <TouchableOpacity style={styles.actionBtn} onPress={() => abrirEdicao(col)}>
                  <Ionicons name="pencil-outline" size={18} color={colors.n600} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionBtn, { marginLeft: 6 }]}
                  onPress={() => alternarAtivo(col)}
                >
                  <Ionicons
                    name={col.ativo ? 'toggle' : 'toggle-outline'}
                    size={22}
                    color={col.ativo ? colors.orange : colors.n300}
                  />
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </ScrollView>
      )}

      {/* Modal criar/editar */}
      <Modal
        visible={modalVisivel}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisivel(false)}
      >
        <Pressable style={styles.overlay} onPress={() => setModalVisivel(false)}>
          <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
            <View style={styles.handle} />
            <Text style={styles.sheetTitle}>
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
            <Text style={styles.selectorLabel}>PAPEL</Text>
            <View style={styles.papelRow}>
              {(['admin', 'gerente', 'funcionario'] as PapelColaborador[]).map((p) => (
                <TouchableOpacity
                  key={p}
                  style={[
                    styles.papelOption,
                    form.papel === p && {
                      backgroundColor: PAPEL_COLOR[p] + '18',
                      borderColor: PAPEL_COLOR[p],
                    },
                  ]}
                  onPress={() => setForm((f) => ({ ...f, papel: p }))}
                >
                  <Text
                    style={[
                      styles.papelOptionText,
                      form.papel === p && { color: PAPEL_COLOR[p], fontWeight: '700' },
                    ]}
                  >
                    {PAPEL_LABEL[p]}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {erro ? <Text style={styles.erroText}>{erro}</Text> : null}

            <TouchableOpacity
              style={[styles.salvarBtn, salvando && { opacity: 0.7 }]}
              onPress={salvar}
              disabled={salvando}
            >
              {salvando ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.salvarBtnText}>Salvar</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelarBtn} onPress={() => setModalVisivel(false)}>
              <Text style={styles.cancelarText}>Cancelar</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
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
  return (
    <View style={styles.campo}>
      <Text style={styles.campoLabel}>{label}</Text>
      <TextInput
        style={[styles.campoInput, !editable && { opacity: 0.5 }]}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={colors.n300}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType ?? 'default'}
        autoCapitalize="none"
        editable={editable}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F1F5F9' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 52,
    paddingBottom: 16,
    paddingHorizontal: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backBtn: { padding: 4, marginRight: 12 },
  headerTitle: { flex: 1, fontSize: 18, fontWeight: '700', color: colors.navy },
  addBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.orange,
    alignItems: 'center',
    justifyContent: 'center',
  },

  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  lista: { padding: 16, gap: 12 },
  emptyText: { textAlign: 'center', color: colors.n600, marginTop: 40, fontSize: 14 },

  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cardInativo: { opacity: 0.55 },
  cardMain: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarLetter: { fontSize: 20, fontWeight: '700' },
  cardInfo: { flex: 1 },
  cardNome: { fontSize: 15, fontWeight: '600', color: colors.navy },
  cardEmail: { fontSize: 12, color: colors.n600, marginTop: 2 },
  papelBadge: {
    alignSelf: 'flex-start',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginTop: 6,
  },
  papelText: { fontSize: 11, fontWeight: '700' },
  cardActions: { flexDirection: 'row', alignItems: 'center' },
  actionBtn: { padding: 6 },

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

  selectorLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.n600,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 8,
  },
  papelRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  papelOption: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    alignItems: 'center',
  },
  papelOptionText: { fontSize: 12, fontWeight: '600', color: colors.n600 },

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
