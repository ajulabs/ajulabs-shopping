import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Ticket, TicketStatus, STATUS_META } from '../../model/data';
import { useTheme } from '../../../../../shared/hooks';

interface Props {
  ticket: Ticket;
  meta: (typeof STATUS_META)[TicketStatus];
  proximoStatus: TicketStatus | null;
  proximoLabel: string | null;
  saving: boolean;
  onAvancar: () => void;
}

export function TicketStatusAction({
  ticket,
  meta,
  proximoStatus,
  proximoLabel,
  saving,
  onAvancar,
}: Props) {
  const theme = useTheme();
  return (
    <View style={[s.section, { backgroundColor: theme.surf, borderColor: theme.border }]}>
      <View style={s.statusRow}>
        <View style={[s.badge, { backgroundColor: meta.bg }]}>
          <Ionicons
            name={meta.icon as any}
            size={12}
            color={meta.color}
            style={{ marginRight: 4 }}
          />
          <Text style={[s.badgeText, { color: meta.color }]}>{meta.label}</Text>
        </View>
        {ticket.urgente && (
          <View style={s.urgentePill}>
            <Ionicons name="flame" size={11} color="#DC2626" />
            <Text style={s.urgentePillText}>Urgente</Text>
          </View>
        )}
      </View>

      {proximoStatus && (
        <TouchableOpacity
          style={[s.avancarBtn, theme.isDark && { backgroundColor: '#3A4170' }]}
          onPress={onAvancar}
          disabled={saving}
          activeOpacity={0.85}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Text style={s.avancarBtnText}>{proximoLabel}</Text>
              <Ionicons name="chevron-forward" size={15} color="#fff" />
            </>
          )}
        </TouchableOpacity>
      )}
      {!proximoStatus && (
        <View style={s.resolvidoBox}>
          <Ionicons name="checkmark-circle" size={16} color="#16A34A" />
          <Text style={s.resolvidoText}>Ticket resolvido</Text>
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  section: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E4E7F1',
  },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 99,
  },
  badgeText: { fontSize: 12, fontWeight: '700' },
  urgentePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 99,
    backgroundColor: '#FEE2E2',
  },
  urgentePillText: { fontSize: 11, fontWeight: '700', color: '#DC2626' },
  avancarBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#000933',
    borderRadius: 12,
    paddingVertical: 12,
  },
  avancarBtnText: { fontSize: 14, fontWeight: '600', color: '#fff' },
  resolvidoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    justifyContent: 'center',
    paddingVertical: 10,
  },
  resolvidoText: { fontSize: 14, fontWeight: '600', color: '#16A34A' },
});
