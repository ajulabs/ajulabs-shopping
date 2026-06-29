import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useMemo } from 'react';
import { useTheme } from '../../../../../shared/hooks';
import type { Theme } from '../../../../../shared/hooks/useTheme';

export function Field({
  label,
  children,
  error,
}: {
  label: string;
  children: React.ReactNode;
  error?: string;
}) {
  const theme = useTheme();
  const s = useMemo(() => makeStyles(theme), [theme]);
  return (
    <View style={s.field}>
      <Text style={[s.fieldLabel, !!error && { color: '#E14B3C' }]}>{label}</Text>
      {children}
      {!!error && <Text style={s.fieldError}>{error}</Text>}
    </View>
  );
}

function makeStyles(theme: Theme) {
  return StyleSheet.create({
    field: { marginBottom: 12 },
    fieldLabel: { fontSize: 12, fontWeight: '600', color: theme.text, marginBottom: 6 },
    fieldError: { fontSize: 11, color: '#E14B3C', fontWeight: '500', marginTop: 4 },
  });
}
