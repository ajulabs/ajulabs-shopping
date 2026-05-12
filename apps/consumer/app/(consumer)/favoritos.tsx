import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@ajulabs/theme';
import { useThemeStore } from '../../src/store';

type Aba = 'produtos' | 'lojas';

export default function FavoritosScreen() {
  const router = useRouter();
  const [aba, setAba] = useState<Aba>('produtos');
  const isDark = useThemeStore(s => s.isDark);

  const bg      = isDark ? colors.bgDark  : '#FAFBFE';
  const surf    = isDark ? colors.surfDark : colors.n0;
  const borderL = isDark ? 'rgba(255,255,255,0.05)' : colors.n100;
  const text    = isDark ? colors.n0      : colors.navy;
  const textSec = isDark ? 'rgba(255,255,255,0.55)' : colors.n600;
  const textMuted = isDark ? 'rgba(255,255,255,0.3)' : colors.n300;
  const backBtn = isDark ? 'rgba(255,255,255,0.08)' : colors.n50;

  return (
    <View style={[styles.container, { backgroundColor: bg }]}>
      <View style={[styles.header, { backgroundColor: surf, borderBottomColor: borderL }]}>
        <TouchableOpacity onPress={() => router.navigate('/(consumer)/perfil')} style={[styles.btnBack, { backgroundColor: backBtn }]}>
          <Ionicons name="chevron-back" size={20} color={text} />
        </TouchableOpacity>
        <Text style={[styles.titulo, { color: text }]}>Favoritos</Text>
      </View>

      <View style={[styles.tabs, { backgroundColor: surf, borderBottomColor: borderL }]}>
        {(['produtos', 'lojas'] as Aba[]).map(t => (
          <TouchableOpacity
            key={t}
            style={[styles.tab, aba === t && styles.tabActive]}
            onPress={() => setAba(t)}
            activeOpacity={0.75}
          >
            <Text style={[
              styles.tabTxt,
              { color: aba === t ? colors.orange : (textSec as string) },
            ]}>
              {t === 'produtos' ? 'Produtos' : 'Lojas'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.vazio}>
        <Ionicons name="heart-outline" size={56} color={textMuted as string} />
        <Text style={[styles.vazioTitulo, { color: text }]}>
          Nenhum{aba === 'lojas' ? 'a' : ''} {aba === 'produtos' ? 'produto' : 'loja'} favoritad{aba === 'lojas' ? 'a' : 'o'}
        </Text>
        <Text style={[styles.vazioTxt, { color: textSec as string }]}>
          Toque no coração {aba === 'produtos' ? 'de um produto' : 'de uma loja'} para salvar aqui
        </Text>
        <TouchableOpacity
          style={styles.btnExplorar}
          onPress={() => router.push('/(consumer)/vitrines')}
          activeOpacity={0.85}
        >
          <Text style={styles.btnExplorarTxt}>Explorar vitrines</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container:      { flex: 1 },
  header:         { flexDirection: 'row', alignItems: 'center', gap: 12,
                    paddingHorizontal: 16, paddingTop: 52, paddingBottom: 14,
                    borderBottomWidth: 1 },
  btnBack:        { width: 38, height: 38, borderRadius: 19,
                    alignItems: 'center', justifyContent: 'center' },
  titulo:         { fontSize: 20, fontWeight: '700' },
  tabs:           { flexDirection: 'row', borderBottomWidth: 1 },
  tab:            { flex: 1, paddingVertical: 14, alignItems: 'center',
                    borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabActive:      { borderBottomColor: colors.orange },
  tabTxt:         { fontSize: 14, fontWeight: '600' },
  vazio:          { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 10 },
  vazioTitulo:    { fontSize: 18, fontWeight: '700', marginTop: 8 },
  vazioTxt:       { fontSize: 13, textAlign: 'center', lineHeight: 20 },
  btnExplorar:    { marginTop: 12, paddingHorizontal: 28, paddingVertical: 13,
                    backgroundColor: colors.orange, borderRadius: 14 },
  btnExplorarTxt: { color: colors.n0, fontSize: 14, fontWeight: '700' },
});
