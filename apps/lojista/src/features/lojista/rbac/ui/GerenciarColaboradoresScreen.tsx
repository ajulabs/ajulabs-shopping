import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../../../theme';
import { useColaboradores } from '../model/useColaboradores';
import { ColaboradorCard } from './components/ColaboradorCard';
import { ColaboradorForm } from './components/ColaboradorForm';

interface Props {
  onVoltar: () => void;
}

export function GerenciarColaboradoresScreen({ onVoltar }: Props) {
  const insets = useSafeAreaInsets();
  const {
    colaboradores,
    loading,
    modalVisivel,
    setModalVisivel,
    editando,
    form,
    setForm,
    salvando,
    erro,
    abrirCriacao,
    abrirEdicao,
    salvar,
    alternarAtivo,
  } = useColaboradores();

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
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
            <ColaboradorCard
              key={col.id}
              colaborador={col}
              onEditar={abrirEdicao}
              onAlternarAtivo={alternarAtivo}
            />
          ))}
        </ScrollView>
      )}

      {/* Modal criar/editar */}
      <ColaboradorForm
        visible={modalVisivel}
        editando={editando}
        form={form}
        setForm={setForm}
        salvando={salvando}
        erro={erro}
        onSalvar={salvar}
        onFechar={() => setModalVisivel(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F1F5F9' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
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
});
