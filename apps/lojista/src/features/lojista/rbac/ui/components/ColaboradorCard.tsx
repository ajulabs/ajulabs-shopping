import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { Colaborador } from '@ajulabs/types';
import { colors } from '../../../../../theme';
import { PAPEL_LABEL, PAPEL_COLOR } from '../../lib/colaboradores';
import { useTheme } from '../../../../../shared/hooks';

interface Props {
  colaborador: Colaborador;
  onEditar: (col: Colaborador) => void;
  onAlternarAtivo: (col: Colaborador) => void;
}

export function ColaboradorCard({ colaborador: col, onEditar, onAlternarAtivo }: Props) {
  const theme = useTheme();
  return (
    <View
      style={[
        styles.card,
        { backgroundColor: theme.surf, borderColor: theme.border },
        !col.ativo && styles.cardInativo,
      ]}
    >
      <View style={styles.cardMain}>
        <View style={[styles.avatarCircle, { backgroundColor: PAPEL_COLOR[col.papel] + '22' }]}>
          <Text style={[styles.avatarLetter, { color: PAPEL_COLOR[col.papel] }]}>
            {col.nome.charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={styles.cardInfo}>
          <Text style={[styles.cardNome, { color: theme.text }]}>{col.nome}</Text>
          <Text style={[styles.cardEmail, { color: theme.textMut }]}>{col.email}</Text>
          <View style={[styles.papelBadge, { backgroundColor: PAPEL_COLOR[col.papel] + '18' }]}>
            <Text style={[styles.papelText, { color: PAPEL_COLOR[col.papel] }]}>
              {PAPEL_LABEL[col.papel]}
            </Text>
          </View>
        </View>
      </View>
      <View style={styles.cardActions}>
        <TouchableOpacity style={styles.actionBtn} onPress={() => onEditar(col)}>
          <Ionicons name="pencil-outline" size={18} color={theme.textMut} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionBtn, { marginLeft: 6 }]}
          onPress={() => onAlternarAtivo(col)}
        >
          <Ionicons
            name={col.ativo ? 'toggle' : 'toggle-outline'}
            size={22}
            color={col.ativo ? colors.orange : colors.n300}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
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
});
