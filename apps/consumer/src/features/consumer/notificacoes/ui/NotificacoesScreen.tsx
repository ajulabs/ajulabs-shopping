import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@ajulabs/theme';
import { useTheme, useSmartBack } from '../../../../shared/hooks';
import { useNotificacoes } from '../model/useNotificacoes';

function Toggle({
  value,
  onValueChange,
  disabled,
}: {
  value: boolean;
  onValueChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <TouchableOpacity
      onPress={() => !disabled && onValueChange(!value)}
      activeOpacity={0.85}
      style={[
        styles.toggleTrack,
        { backgroundColor: value ? colors.orange : colors.n300 },
        disabled && { opacity: 0.5 },
      ]}
    >
      <View style={[styles.toggleThumb, { transform: [{ translateX: value ? 22 : 2 }] }]} />
    </TouchableOpacity>
  );
}

export function NotificacoesScreen() {
  const insets = useSafeAreaInsets();
  // Voltar (físico + visual) segue a pilha; fallback para o perfil
  const goBack = useSmartBack('/(consumer)/perfil');
  const { isDark, bg, surf, border, borderL, text, textSec, backBtn } = useTheme();

  const { preferencias, loading, salvando, erro, toggle } = useNotificacoes();

  return (
    <View style={[styles.container, { backgroundColor: bg }]}>
      <View
        style={[
          styles.header,
          { backgroundColor: surf, borderBottomColor: borderL, paddingTop: insets.top + 12 },
        ]}
      >
        <TouchableOpacity
          onPress={() => goBack()}
          style={[styles.btnBack, { backgroundColor: backBtn }]}
        >
          <Ionicons name="chevron-back" size={20} color={text} />
        </TouchableOpacity>
        <Text style={[styles.titulo, { color: text }]}>Notificações</Text>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.orange} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <Text style={[styles.descricao, { color: textSec as string }]}>
            Escolha quais notificações você quer receber do AjuLabs Shopping.
          </Text>

          {!!erro && (
            <View style={[styles.erroBox, isDark && { backgroundColor: 'rgba(163,45,45,0.18)' }]}>
              <Ionicons name="alert-circle-outline" size={15} color="#A32D2D" />
              <Text style={styles.erroTxt}>{erro}</Text>
            </View>
          )}

          {preferencias.length === 0 && !erro ? (
            <Text style={[styles.descricao, { color: textSec as string, textAlign: 'center' }]}>
              Nenhuma preferência disponível.
            </Text>
          ) : (
            <View style={[styles.card, { backgroundColor: surf, borderColor: border }]}>
              {preferencias.map((p, i) => (
                <View
                  key={p.categoria}
                  style={[
                    styles.row,
                    i < preferencias.length - 1 && [
                      styles.rowBorder,
                      { borderBottomColor: borderL },
                    ],
                  ]}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.rowLabel, { color: text }]}>{p.label}</Text>
                    <Text style={[styles.rowDesc, { color: textSec as string }]}>
                      {p.descricao}
                    </Text>
                  </View>
                  <Toggle
                    value={p.ativo}
                    disabled={salvando.has(p.categoria)}
                    onValueChange={(v) => toggle(p.categoria, v)}
                  />
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      )}
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
  descricao: { fontSize: 13, marginBottom: 16, lineHeight: 20 },
  card: { borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  rowBorder: { borderBottomWidth: 1 },
  rowLabel: { fontSize: 14, fontWeight: '600' },
  rowDesc: { fontSize: 12, marginTop: 2, lineHeight: 16 },
  toggleTrack: { width: 48, height: 28, borderRadius: 14, justifyContent: 'center' },
  toggleThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  erroBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 14,
    padding: 12,
    backgroundColor: '#FCEBEB',
    borderRadius: 10,
  },
  erroTxt: { flex: 1, fontSize: 13, color: '#A32D2D' },
});
