import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../../../shared/hooks';

const QUICK_ACTIONS: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  msg: string;
  color: string;
}[] = [
  { icon: 'search-outline', label: 'Buscar', msg: 'Quero buscar produtos', color: '#f97316' },
  { icon: 'receipt-outline', label: 'Pedidos', msg: 'Quero rastrear meu pedido', color: '#2563EB' },
  {
    icon: 'alert-circle-outline',
    label: 'Reclamar',
    msg: 'Tive um problema com meu pedido',
    color: '#DC2626',
  },
  { icon: 'help-circle-outline', label: 'Dúvidas', msg: 'Tenho uma dúvida', color: '#7C3AED' },
];

export function QuickActions({
  onAction,
  disabled,
}: {
  onAction: (msg: string) => void;
  disabled: boolean;
}) {
  const { bg, surf, borderL, text } = useTheme();
  return (
    <View style={[styles.quickRow, { backgroundColor: bg }]}>
      {QUICK_ACTIONS.map((a) => (
        <TouchableOpacity
          key={a.label}
          onPress={() => onAction(a.msg)}
          disabled={disabled}
          style={[
            styles.quickBtn,
            { backgroundColor: surf, borderColor: borderL },
            disabled && { opacity: 0.4 },
          ]}
          activeOpacity={0.65}
        >
          <View style={[styles.quickIconWrap, { backgroundColor: a.color + '18' }]}>
            <Ionicons name={a.icon} size={13} color={a.color} />
          </View>
          <Text style={[styles.quickLabel, { color: text }]}>{a.label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  quickRow: { flexDirection: 'row', paddingHorizontal: 12, paddingVertical: 8, gap: 6 },
  quickBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    borderRadius: 10,
    paddingVertical: 8,
    borderWidth: 1,
  },
  quickIconWrap: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickLabel: { fontSize: 11.5, fontWeight: '600' },
});
