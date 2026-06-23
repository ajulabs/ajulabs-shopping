import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Switch,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNotificacoes } from '../model/useNotificacoes';

interface Props {
  onBack: () => void;
}

export function NotificacoesScreen({ onBack }: Props) {
  const { preferencias, loading, salvando, erro, saved, toggle } = useNotificacoes();

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={onBack} activeOpacity={0.8}>
          <Ionicons name="chevron-back" size={20} color="#000933" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Notificações</Text>
        {saved && (
          <View style={s.savedBadge}>
            <Ionicons name="checkmark" size={12} color="#039855" />
            <Text style={s.savedText}>Salvo</Text>
          </View>
        )}
      </View>

      {loading ? (
        <View style={s.centerLoader}>
          <ActivityIndicator color="#F2760F" />
        </View>
      ) : (
        <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
          <Text style={s.desc}>
            Escolha quais notificações deseja receber. Você pode alterar a qualquer momento.
          </Text>

          {!!erro && (
            <View style={s.erroBox}>
              <Ionicons name="alert-circle-outline" size={15} color="#A32D2D" />
              <Text style={s.erroTxt}>{erro}</Text>
            </View>
          )}

          {preferencias.length === 0 && !erro ? (
            <Text style={[s.desc, { textAlign: 'center' }]}>Nenhuma preferência disponível.</Text>
          ) : (
            <View style={s.card}>
              {preferencias.map((p, i) => (
                <View
                  key={p.categoria}
                  style={[
                    s.row,
                    i < preferencias.length - 1 && {
                      borderBottomWidth: 1,
                      borderBottomColor: '#F0F1F5',
                    },
                  ]}
                >
                  <View style={s.rowIcon}>
                    <Ionicons name="notifications" size={18} color="#F2760F" />
                  </View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={s.rowTitle}>{p.label}</Text>
                    <Text style={s.rowSub}>{p.descricao}</Text>
                  </View>
                  <Switch
                    value={p.ativo}
                    disabled={salvando.has(p.categoria)}
                    onValueChange={(v) => toggle(p.categoria, v)}
                    trackColor={{ false: '#E4E7F1', true: 'rgba(242,118,15,0.35)' }}
                    thumbColor={p.ativo ? '#F2760F' : '#FFFFFF'}
                  />
                </View>
              ))}
            </View>
          )}

          <View style={s.infoBox}>
            <Ionicons name="information-circle" size={16} color="#209CEF" />
            <Text style={s.infoText}>
              Recomendamos manter ativadas — você pode perder corridas se desligar.
            </Text>
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F6F7FB' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E4E7F1',
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F6F7FB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#000933', flex: 1 },
  savedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: 'rgba(3,152,85,0.1)',
    borderRadius: 99,
  },
  savedText: { fontSize: 11, fontWeight: '700', color: '#039855' },
  centerLoader: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { padding: 16, paddingBottom: 40 },
  desc: { fontSize: 13, color: '#9099B3', lineHeight: 19, marginBottom: 16 },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E4E7F1',
    overflow: 'hidden',
    marginBottom: 16,
  },
  row: { flexDirection: 'row', alignItems: 'center', padding: 14 },
  rowIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#FEF0E3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowTitle: { fontSize: 14, fontWeight: '600', color: '#000933', marginBottom: 2 },
  rowSub: { fontSize: 11, color: '#9099B3', lineHeight: 15 },
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
  infoBox: {
    flexDirection: 'row',
    gap: 8,
    padding: 14,
    backgroundColor: 'rgba(32,156,239,0.08)',
    borderRadius: 12,
  },
  infoText: { flex: 1, fontSize: 12, color: '#2A3156', lineHeight: 18 },
});
