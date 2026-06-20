import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { Colaborador } from '@ajulabs/types';
import { colors } from '../../../../../theme';
import { PAPEIS, PAPEL_CFG, type FormColaborador } from '../../lib/equipe';

export function EquipeFormModal({
  visible,
  onClose,
  editandoCol,
  formCol,
  setFormCol,
  salvandoCol,
  erroCol,
  senhaVisivel,
  setSenhaVisivel,
  onSalvar,
}: {
  visible: boolean;
  onClose: () => void;
  editandoCol: Colaborador | null;
  formCol: FormColaborador;
  setFormCol: React.Dispatch<React.SetStateAction<FormColaborador>>;
  salvandoCol: boolean;
  erroCol: string;
  senhaVisivel: boolean;
  setSenhaVisivel: React.Dispatch<React.SetStateAction<boolean>>;
  onSalvar: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={styles.sheetOverlay} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity style={styles.sheetContainer} activeOpacity={1} onPress={() => {}}>
          <View style={styles.sheetHandle} />

          <Text style={styles.sheetTitle}>
            {editandoCol ? 'Editar colaborador' : 'Novo colaborador'}
          </Text>

          {/* Nome */}
          <View style={styles.sheetField}>
            <Text style={styles.sheetFieldLabel}>NOME</Text>
            <TextInput
              style={styles.sheetInput}
              value={formCol.nome}
              onChangeText={(v) => setFormCol((f) => ({ ...f, nome: v }))}
              placeholder="Nome completo"
              placeholderTextColor={colors.n500}
            />
          </View>

          {/* Email (só na criação) */}
          {!editandoCol && (
            <View style={styles.sheetField}>
              <Text style={styles.sheetFieldLabel}>EMAIL</Text>
              <TextInput
                style={styles.sheetInput}
                value={formCol.email}
                onChangeText={(v) => setFormCol((f) => ({ ...f, email: v }))}
                placeholder="email@colaborador.com"
                placeholderTextColor={colors.n500}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          )}

          {/* Senha */}
          <View style={styles.sheetField}>
            <Text style={styles.sheetFieldLabel}>
              {editandoCol ? 'NOVA SENHA (opcional)' : 'SENHA'}
            </Text>
            <View style={styles.sheetInputRow}>
              <TextInput
                style={styles.sheetInputInner}
                value={formCol.senha}
                onChangeText={(v) => setFormCol((f) => ({ ...f, senha: v }))}
                placeholder="••••••••"
                placeholderTextColor={colors.n500}
                secureTextEntry={!senhaVisivel}
                autoCapitalize="none"
              />
              <TouchableOpacity onPress={() => setSenhaVisivel((s) => !s)} hitSlop={10}>
                <Ionicons
                  name={senhaVisivel ? 'eye-off-outline' : 'eye-outline'}
                  size={18}
                  color={colors.n500}
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Seletor de papel */}
          <Text style={[styles.sheetFieldLabel, { marginBottom: 8 }]}>NÍVEL DE ACESSO</Text>
          <View style={styles.papelGrid}>
            {PAPEIS.map((p) => {
              const cfg = PAPEL_CFG[p];
              const ativo = formCol.papel === p;
              return (
                <TouchableOpacity
                  key={p}
                  style={[
                    styles.papelCard,
                    ativo && { borderColor: cfg.cor, backgroundColor: cfg.bg },
                  ]}
                  onPress={() => setFormCol((f) => ({ ...f, papel: p }))}
                  activeOpacity={0.8}
                >
                  <View style={styles.papelCardTop}>
                    <Text style={[styles.papelCardLabel, ativo && { color: cfg.cor }]}>
                      {cfg.label}
                    </Text>
                    {ativo && <Ionicons name="checkmark-circle" size={16} color={cfg.cor} />}
                  </View>
                  <Text style={styles.papelCardDesc}>
                    {p === 'admin'
                      ? 'Acesso total, gerencia equipe e preços'
                      : p === 'gerente'
                        ? 'Gerencia produtos e aprova preços'
                        : 'Operacional, solicita mudança de preço'}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {!!erroCol && <Text style={styles.sheetErro}>{erroCol}</Text>}

          <TouchableOpacity
            style={[styles.sheetSalvarBtn, salvandoCol && { opacity: 0.7 }]}
            onPress={onSalvar}
            disabled={salvandoCol}
            activeOpacity={0.85}
          >
            {salvandoCol ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.sheetSalvarText}>
                {editandoCol ? 'Salvar alterações' : 'Criar colaborador'}
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.sheetCancelarBtn} onPress={onClose} activeOpacity={0.8}>
            <Text style={styles.sheetCancelarText}>Cancelar</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  sheetOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,9,51,0.55)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.n200,
    alignSelf: 'center',
    marginBottom: 20,
  },
  sheetTitle: { fontSize: 19, fontWeight: '800', color: colors.navy, marginBottom: 20 },

  sheetField: { marginBottom: 14 },
  sheetFieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.n600,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 5,
  },
  sheetInput: {
    height: 46,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.n200,
    backgroundColor: colors.n50,
    paddingHorizontal: 14,
    fontSize: 14,
    color: colors.navy,
  },
  sheetInputRow: {
    height: 46,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.n200,
    backgroundColor: colors.n50,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
  },
  sheetInputInner: { flex: 1, fontSize: 14, color: colors.navy },

  papelGrid: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  papelCard: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.n200,
    backgroundColor: colors.n50,
    padding: 10,
  },
  papelCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  papelCardLabel: { fontSize: 12, fontWeight: '800', color: colors.navy },
  papelCardDesc: { fontSize: 10, color: colors.n600, lineHeight: 14 },

  sheetErro: { fontSize: 12, color: '#E24B4A', marginBottom: 10, fontWeight: '500' },

  sheetSalvarBtn: {
    height: 50,
    borderRadius: 14,
    backgroundColor: colors.orange,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetSalvarText: { fontSize: 15, fontWeight: '700', color: '#fff' },
  sheetCancelarBtn: {
    height: 44,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.n200,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  sheetCancelarText: { fontSize: 14, fontWeight: '600', color: colors.n600 },
});
