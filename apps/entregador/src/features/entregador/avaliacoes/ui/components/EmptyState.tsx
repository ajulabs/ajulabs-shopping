import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { useTheme } from '../../../../../shared/hooks';
import type { Theme } from '../../../../../shared/hooks/useTheme';

export function EmptyState() {
  const theme = useTheme();
  const s = useMemo(() => makeStyles(theme), [theme]);
  return (
    <View style={s.emptyBox}>
      <View style={s.emptyIcon}>
        <Ionicons name="star-outline" size={32} color="#9099B3" />
      </View>
      <Text style={s.emptyTitle}>Ainda sem avaliações</Text>
      <Text style={s.emptyDesc}>
        Quando os clientes começarem a avaliar suas entregas, aparecerá aqui um resumo das notas e
        comentários.
      </Text>
    </View>
  );
}

function makeStyles(theme: Theme) {
  return StyleSheet.create({
    emptyBox: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 12 },
    emptyIcon: {
      width: 72,
      height: 72,
      borderRadius: 36,
      backgroundColor: theme.surf2,
      alignItems: 'center',
      justifyContent: 'center',
    },
    emptyTitle: { fontSize: 16, fontWeight: '700', color: theme.text },
    emptyDesc: {
      fontSize: 13,
      color: theme.textMut,
      textAlign: 'center',
      lineHeight: 19,
      maxWidth: 280,
    },
  });
}
