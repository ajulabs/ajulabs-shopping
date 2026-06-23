import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export function Field({
  label,
  children,
  error,
}: {
  label: string;
  children: React.ReactNode;
  error?: string;
}) {
  return (
    <View style={s.field}>
      <Text style={[s.fieldLabel, !!error && { color: '#E14B3C' }]}>{label}</Text>
      {children}
      {!!error && <Text style={s.fieldError}>{error}</Text>}
    </View>
  );
}

const s = StyleSheet.create({
  field: { marginBottom: 12 },
  fieldLabel: { fontSize: 12, fontWeight: '600', color: '#2A3156', marginBottom: 6 },
  fieldError: { fontSize: 11, color: '#E14B3C', fontWeight: '500', marginTop: 4 },
});
