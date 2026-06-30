import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { useTheme } from '../../../../../shared/hooks';
import type { Theme } from '../../../../../shared/hooks/useTheme';

export function Header({ onBack, title }: { onBack: () => void; title: string }) {
  const theme = useTheme();
  const s = useMemo(() => makeStyles(theme), [theme]);
  return (
    <View style={s.header}>
      <TouchableOpacity style={s.backBtn} onPress={onBack} activeOpacity={0.8}>
        <Ionicons name="chevron-back" size={20} color={theme.text} />
      </TouchableOpacity>
      <Text style={s.headerTitle}>{title}</Text>
    </View>
  );
}

function makeStyles(theme: Theme) {
  return StyleSheet.create({
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      padding: 16,
      backgroundColor: theme.surf,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    backBtn: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: theme.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerTitle: { fontSize: 18, fontWeight: '700', color: theme.text },
  });
}
