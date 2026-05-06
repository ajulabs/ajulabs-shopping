import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const COURIER = {
  nome: 'Carlos Mendes',
  initials: 'CM',
  transporte: 'Moto Honda CG 160',
  placa: 'ABC-1234',
  rating: 4.9,
  entregas: 1248,
  aceitacao: 96,
  tempoMedio: 22,
  badges: ['Top Entregador', 'Sem Atrasos', '1000 Entregas', 'Cliente 5★'],
};

function Stars({ value }: { value: number }) {
  return (
    <View style={{ flexDirection: 'row', gap: 1 }}>
      {Array.from({ length: 5 }, (_, i) => (
        <Ionicons
          key={i}
          name={i < Math.floor(value) ? 'star' : 'star-outline'}
          size={12}
          color="#F2760F"
        />
      ))}
    </View>
  );
}

interface ProfileScreenProps {
  onLogout: () => void;
}

export function ProfileScreen({ onLogout }: ProfileScreenProps) {
  const menuItems = [
    { icon: 'document-text', label: 'Documentos', extra: 'Verificado', extraColor: '#039855' },
    { icon: 'wallet', label: 'Dados bancários' },
    { icon: 'notifications', label: 'Notificações' },
    { icon: 'shield-checkmark', label: 'Segurança' },
    { icon: 'help-circle', label: 'Ajuda e suporte' },
  ] as const;

  return (
    <SafeAreaView style={s.safeArea}>
      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
        <View style={s.hero}>
          <View style={s.heroRow}>
            <View style={s.avatar}>
              <Text style={s.avatarText}>{COURIER.initials}</Text>
            </View>
            <View style={{ flex: 1, marginLeft: 14 }}>
              <Text style={s.heroName}>{COURIER.nome}</Text>
              <Text style={s.heroTransporte}>
                🏍️ {COURIER.transporte} · {COURIER.placa}
              </Text>
            </View>
          </View>

          {/* Stats */}
          <View style={s.statsBox}>
            <View style={s.statCol}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Ionicons name="star" size={18} color="#F2760F" />
                <Text style={s.statVal}>{COURIER.rating}</Text>
              </View>
              <Text style={s.statLabel}>{COURIER.entregas} entregas</Text>
            </View>
            <View style={s.statDivider} />
            <View style={s.statCol}>
              <Text style={s.statVal}>{COURIER.aceitacao}%</Text>
              <Text style={s.statLabel}>Aceitação</Text>
            </View>
            <View style={s.statDivider} />
            <View style={s.statCol}>
              <Text style={s.statVal}>{COURIER.tempoMedio}m</Text>
              <Text style={s.statLabel}>Tempo médio</Text>
            </View>
          </View>
        </View>

        {/* Conquistas */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Conquistas</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={s.badgesRow}
          >
            {COURIER.badges.map((b) => (
              <View key={b} style={s.badgeCard}>
                <View style={s.badgeIcon}>
                  <Ionicons name="trophy" size={20} color="#F2760F" />
                </View>
                <Text style={s.badgeLabel}>{b}</Text>
              </View>
            ))}
          </ScrollView>
        </View>

        {/* Menu */}
        <View style={s.menuCard}>
          {menuItems.map((item, i) => (
            <TouchableOpacity
              key={item.label}
              style={[
                s.menuRow,
                i < menuItems.length - 1 && { borderBottomWidth: 1, borderBottomColor: '#E4E7F1' },
              ]}
              activeOpacity={0.7}
            >
              <View style={s.menuIcon}>
                <Ionicons name={item.icon as any} size={18} color="#000933" />
              </View>
              <Text style={s.menuLabel}>{item.label}</Text>
              {item.extra && (
                <View style={[s.extraBadge, { backgroundColor: 'rgba(3,152,85,0.1)' }]}>
                  <Text style={[s.extraText, { color: item.extraColor }]}>{item.extra}</Text>
                </View>
              )}
              <Ionicons name="chevron-forward" size={16} color="#9099B3" />
            </TouchableOpacity>
          ))}
        </View>

        {/* Logout */}
        <TouchableOpacity style={s.logoutBtn} onPress={onLogout} activeOpacity={0.8}>
          <Text style={s.logoutText}>Sair</Text>
        </TouchableOpacity>

        <Text style={s.version}>AjuLabs · Entregador v1.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F6F7FB' },
  scroll: { flex: 1 },
  content: { paddingBottom: 32 },
  hero: {
    backgroundColor: '#000933',
    padding: 20,
    paddingBottom: 24,
  },
  heroRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 18 },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#F2760F',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#F2760F',
  },
  avatarText: { fontSize: 24, fontWeight: '800', color: '#FFFFFF' },
  heroName: { fontSize: 20, fontWeight: '700', color: '#FFFFFF', letterSpacing: -0.3 },
  heroTransporte: { fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 3 },
  statsBox: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
  },
  statCol: { flex: 1, alignItems: 'center' },
  statVal: { fontSize: 22, fontWeight: '700', color: '#FFFFFF', lineHeight: 26 },
  statLabel: { fontSize: 10, color: 'rgba(255,255,255,0.6)', marginTop: 2, textAlign: 'center' },
  statDivider: { width: 1, height: 30, backgroundColor: 'rgba(255,255,255,0.15)' },
  section: { padding: 16, paddingBottom: 8 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#000933', marginBottom: 12 },
  badgesRow: { gap: 10, paddingRight: 4 },
  badgeCard: {
    width: 110,
    padding: 14,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E4E7F1',
    alignItems: 'center',
    gap: 8,
  },
  badgeIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FEF0E3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeLabel: { fontSize: 11, fontWeight: '600', color: '#000933', textAlign: 'center', lineHeight: 14 },
  menuCard: {
    marginHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E4E7F1',
    overflow: 'hidden',
    marginBottom: 16,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 14,
  },
  menuIcon: {
    width: 34,
    height: 34,
    borderRadius: 9,
    backgroundColor: '#F6F7FB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuLabel: { flex: 1, fontSize: 14, fontWeight: '500', color: '#000933' },
  extraBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 99 },
  extraText: { fontSize: 11, fontWeight: '600' },
  logoutBtn: {
    marginHorizontal: 16,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E4E7F1',
    alignItems: 'center',
    marginBottom: 16,
  },
  logoutText: { fontSize: 14, fontWeight: '600', color: '#E14B3C' },
  version: { textAlign: 'center', fontSize: 10, color: '#9099B3', letterSpacing: 0.5 },
});
