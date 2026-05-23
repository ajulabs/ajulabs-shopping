import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Switch,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@ajulabs/theme';
import {
  NotificationPreferencesService,
  type NotificationPreference,
} from '@ajulabs/api-client';
import { useTheme } from '../../src/hooks';
import { useAuthStore } from '../../src/store';

export default function NotificacoesScreen() {
  const router = useRouter();
  const token = useAuthStore((s) => s.token);
  const { isDark, bg, surf, border, borderL, text, textSec, backBtn } = useTheme();

  const [preferencias, setPreferencias] = useState<NotificationPreference[]>([]);
  const [loading, setLoading] = useState(true);
  // Categorias com toggle em voo — desativa o Switch só na que está salvando
  const [salvando, setSalvando] = useState<Set<string>>(new Set());
  const [erro, setErro] = useState('');

  const carregar = useCallback(async () => {
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const lista = await NotificationPreferencesService.listar(token);
      setPreferencias(lista);
      setErro('');
    } catch {
      setErro('Não foi possível carregar suas preferências.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const toggle = useCallback(
    async (categoria: string, ativo: boolean) => {
      if (!token) return;
      // Otimista: atualiza UI imediatamente
      setPreferencias((prev) =>
        prev.map((p) => (p.categoria === categoria ? { ...p, ativo } : p)),
      );
      setSalvando((prev) => new Set(prev).add(categoria));
      try {
        await NotificationPreferencesService.atualizar(token, categoria, ativo);
      } catch {
        // Rollback em caso de falha
        setPreferencias((prev) =>
          prev.map((p) => (p.categoria === categoria ? { ...p, ativo: !ativo } : p)),
        );
        setErro('Não foi possível salvar a preferência. Tente novamente.');
      } finally {
        setSalvando((prev) => {
          const next = new Set(prev);
          next.delete(categoria);
          return next;
        });
      }
    },
    [token],
  );

  return (
    <View style={[styles.container, { backgroundColor: bg }]}>
      <View style={[styles.header, { backgroundColor: surf, borderBottomColor: borderL }]}>
        <TouchableOpacity
          onPress={() => router.navigate('/(consumer)/perfil')}
          style={[styles.btnBack, { backgroundColor: backBtn }]}
        >
          <Ionicons name="chevron-back" size={20} color={text} />
        </TouchableOpacity>
        <Text style={[styles.titulo, { color: text }]}>Notificações</Text>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.orange} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <Text style={[styles.descricao, { color: textSec as string }]}>
            Escolha quais notificações você quer receber do AjuLabs Shopping.
          </Text>

          {!!erro && (
            <View style={[styles.erroBox, isDark && { backgroundColor: 'rgba(163,45,45,0.18)' }]}>
              <Ionicons name="alert-circle-outline" size={15} color="#A32D2D" />
              <Text style={styles.erroTxt}>{erro}</Text>
            </View>
          )}

          {preferencias.length === 0 && !erro ? (
            <Text style={[styles.descricao, { color: textSec as string, textAlign: 'center' }]}>
              Nenhuma preferência disponível.
            </Text>
          ) : (
            <View style={[styles.card, { backgroundColor: surf, borderColor: border }]}>
              {preferencias.map((p, i) => (
                <View
                  key={p.categoria}
                  style={[
                    styles.row,
                    i < preferencias.length - 1 && [styles.rowBorder, { borderBottomColor: borderL }],
                  ]}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.rowLabel, { color: text }]}>{p.label}</Text>
                    <Text style={[styles.rowDesc, { color: textSec as string }]}>{p.descricao}</Text>
                  </View>
                  <Switch
                    value={p.ativo}
                    disabled={salvando.has(p.categoria)}
                    onValueChange={(v) => toggle(p.categoria, v)}
                    trackColor={{
                      false: isDark ? 'rgba(255,255,255,0.15)' : colors.n200,
                      true: colors.orange,
                    }}
                    thumbColor={colors.n0}
                  />
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 52,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  btnBack: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titulo: { fontSize: 20, fontWeight: '700' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: { padding: 16, paddingBottom: 40 },
  descricao: { fontSize: 13, marginBottom: 16, lineHeight: 20 },
  card: { borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 16, paddingVertical: 14 },
  rowBorder: { borderBottomWidth: 1 },
  rowLabel: { fontSize: 14, fontWeight: '600' },
  rowDesc: { fontSize: 12, marginTop: 2, lineHeight: 16 },
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
});
