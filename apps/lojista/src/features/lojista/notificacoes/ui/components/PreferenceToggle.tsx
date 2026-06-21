import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';

export function PreferenceToggle({
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
        s.toggleTrack,
        { backgroundColor: value ? '#DE6708' : '#E4E7F1' },
        disabled && { opacity: 0.5 },
      ]}
    >
      <View style={[s.toggleThumb, { transform: [{ translateX: value ? 22 : 2 }] }]} />
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
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
});
