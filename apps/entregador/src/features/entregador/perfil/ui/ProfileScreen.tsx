import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { EntregadorService } from '@ajulabs/api-client';
import { useAuthEntregadorStore } from '../../auth/model/store';

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
  const token = useAuthEntregadorStore(s => s.token);
  const nomeStore = useAuthEntregadorStore(s => s.nome);

  const [loading, setLoading] = useState(true);
  const [perfil, setPerfil] = useState<any>(null);
  const [ganhos, setGanhos] = useState<any>(null);

  useEffect(() => {
    if (!token) { setLoading(false); return; }
    Promise.all([
      EntregadorService.buscarPerfil(token),
      EntregadorService.buscarGanhos(token),
    ]).then(([p, g]) => {
      setPerfil(p);
      setGanhos(g);
    }).finally(() => setLoading(false));
  }, [token]);

  const menuItems = [
    { icon: 'document-text', label: 'Documentos', extra: perfil?.onboarding?.documentosAprovados ? 'Verificado' : undefined, extraColor: '#039855' },
    { icon: 'wallet', label: 'Dados bancários' },
    { icon: 'notifications', label: 'Notificações' },
    { icon: 'shield-checkmark', label: 'Segurança' },
    { icon: 'help-circle', label: 'Ajuda e suporte' },
  ] as const;

  const nome = perfil?.entregador?.nome ?? nomeStore ?? 'Entregador';
  const initials = nome.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase();
  const veiculo = perfil?.entregador?.veiculo;
  const veiculoStr = veiculo ? `${veiculo.modelo} · ${veiculo.placa}` : 'Veículo não cadastrado';
  const totalEntregas = ganhos?.allTime?.corridas ?? 0;

  return (
    <SafeAreaView style={s.safeArea}>
      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={s.hero}>
          <View style={s.heroRow}>
            <View style={s.avatar}>
              <Text style={s.avatarText}>{initials}</Text>
            </View>
            <View style={{ flex: 1, marginLeft: 14 }}>
              <Text style={s.heroName}>{nome}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 }}>
                <Ionicons name="car-sport" size={12} color="rgba(255,255,255,0.7)" />
                <Text style={s.heroTransporte}>{veiculoStr}</Text>
              </View>
            </View>
          </View>

          {loading ? (
            <View style={[s.statsBox, { justifyContent: 'center', paddingVertical: 20 }]}>
              <ActivityIndicator color="#F2760F" />
            </View>
          ) : (
            <View style={s.statsBox}>
              <View style={s.statCol}>
                <Text style={s.statVal}>{totalEntregas}</Text>
                <Text style={s.statLabel}>Entregas</Text>
              </View>
              <View style={s.statDivider} />
              <View style={s.statCol}>
                <Text style={s.statVal}>{ganhos?.semana?.corridas ?? 0}</Text>
                <Text style={s.statLabel}>Esta semana</Text>
              </View>
              <View style={s.statDivider} />
              <View style={s.statCol}>
                <Text style={s.statVal}>
                  {ganhos?.allTime?.total ? `R$${Number(ganhos.allTime.total).toFixed(0)}` : 'R$0'}
                </Text>
                <Text style={s.statLabel}>Total ganho</Text>
              </View>
            </View>
          )}
        </View>

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
  heroTransporte: { fontSize: 12, color: 'rgba(255,255,255,0.7)' },
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
  menuCard: {
    marginHorizontal: 16,
    marginTop: 16,
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
