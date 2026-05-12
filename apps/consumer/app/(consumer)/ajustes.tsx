import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert,
  Platform, Linking, Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@ajulabs/theme';
import { useThemeStore } from '../../src/store';

const APP_VERSION = '1.0.0';

function Toggle({ value, onToggle }: { value: boolean; onToggle: () => void }) {
  const anim = useRef(new Animated.Value(value ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: value ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [value]);

  const trackColor = anim.interpolate({ inputRange: [0, 1], outputRange: ['#CED3E2', colors.orange] });
  const thumbLeft  = anim.interpolate({ inputRange: [0, 1], outputRange: [2, 22] });

  return (
    <TouchableOpacity onPress={onToggle} activeOpacity={0.85}>
      <Animated.View style={[styles.toggleTrack, { backgroundColor: trackColor }]}>
        <Animated.View style={[styles.toggleThumb, { left: thumbLeft }]} />
      </Animated.View>
    </TouchableOpacity>
  );
}

export default function AjustesScreen() {
  const router = useRouter();
  const [historiocoLimpo, setHistoricoLimpo] = useState(false);
  const isDark = useThemeStore(s => s.isDark);
  const toggleDark = useThemeStore(s => s.toggleDark);

  const bg      = isDark ? colors.bgDark  : '#FAFBFE';
  const surf    = isDark ? colors.surfDark : colors.n0;
  const border  = isDark ? 'rgba(255,255,255,0.08)' : colors.n200;
  const borderL = isDark ? 'rgba(255,255,255,0.05)' : colors.n100;
  const text    = isDark ? colors.n0      : colors.navy;
  const textSec = isDark ? 'rgba(255,255,255,0.55)' : colors.n600;
  const iconBg  = isDark ? 'rgba(255,255,255,0.08)' : colors.orange100;
  const backBtn = isDark ? 'rgba(255,255,255,0.08)' : colors.n50;

  const handleLimparHistorico = () => {
    const confirmar = () => {
      setHistoricoLimpo(true);
      Alert.alert('Concluído', 'Histórico de busca limpo com sucesso.');
    };
    if (Platform.OS === 'web') {
      if (window.confirm('Limpar histórico de busca?')) confirmar();
    } else {
      Alert.alert('Limpar histórico', 'Deseja limpar seu histórico de busca?', [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Limpar', style: 'destructive', onPress: confirmar },
      ]);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: bg }]}>
      <View style={[styles.header, { backgroundColor: surf, borderBottomColor: borderL }]}>
        <TouchableOpacity onPress={() => router.navigate('/(consumer)/perfil')} style={[styles.btnBack, { backgroundColor: backBtn }]}>
          <Ionicons name="chevron-back" size={20} color={text} />
        </TouchableOpacity>
        <Text style={[styles.titulo, { color: text }]}>Ajustes</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Aparência */}
        <View style={[styles.card, { backgroundColor: surf, borderColor: border }]}>
          <View style={[styles.row, { borderBottomWidth: 0 }]}>
            <View style={[styles.iconBox, { backgroundColor: isDark ? 'rgba(255,200,80,0.15)' : '#FFF8E1' }]}>
              <Ionicons name="moon-outline" size={17} color={isDark ? '#FFCC44' : '#B8860B'} />
            </View>
            <Text style={[styles.rowLabel, { color: text }]}>Modo escuro</Text>
            <Toggle value={isDark} onToggle={toggleDark} />
          </View>
        </View>

        {/* Links legais */}
        <View style={[styles.card, { backgroundColor: surf, borderColor: border, marginTop: 14 }]}>
          <TouchableOpacity
            style={[styles.row, styles.rowBorder, { borderBottomColor: borderL }]}
            onPress={() => Linking.openURL('https://ajulabs.com/termos').catch(() => {})}
            activeOpacity={0.7}
          >
            <View style={[styles.iconBox, { backgroundColor: iconBg }]}>
              <Ionicons name="document-text-outline" size={17} color={colors.orange600} />
            </View>
            <Text style={[styles.rowLabel, { color: text }]}>Termos de uso</Text>
            <Ionicons name="open-outline" size={15} color={textSec as string} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.row}
            onPress={() => Linking.openURL('https://ajulabs.com/privacidade').catch(() => {})}
            activeOpacity={0.7}
          >
            <View style={[styles.iconBox, { backgroundColor: iconBg }]}>
              <Ionicons name="shield-checkmark-outline" size={17} color={colors.orange600} />
            </View>
            <Text style={[styles.rowLabel, { color: text }]}>Política de privacidade</Text>
            <Ionicons name="open-outline" size={15} color={textSec as string} />
          </TouchableOpacity>
        </View>

        {/* Histórico de busca */}
        <View style={[styles.card, { backgroundColor: surf, borderColor: border, marginTop: 14 }]}>
          <TouchableOpacity
            style={styles.row}
            onPress={handleLimparHistorico}
            disabled={historiocoLimpo}
            activeOpacity={0.7}
          >
            <View style={[styles.iconBox, { backgroundColor: isDark ? 'rgba(163,45,45,0.18)' : '#FCEBEB' }]}>
              <Ionicons name="trash-outline" size={17} color="#A32D2D" />
            </View>
            <Text style={[styles.rowLabel, { color: historiocoLimpo ? textSec : text }]}>
              Limpar histórico de busca
            </Text>
            {historiocoLimpo && (
              <View style={[styles.limpoBadge, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : colors.n100 }]}>
                <Text style={[styles.limpoBadgeTxt, { color: textSec as string }]}>Limpo</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Versão */}
        <View style={styles.versaoCard}>
          <View style={[styles.versaoLogo, { backgroundColor: iconBg }]}>
            <Ionicons name="storefront" size={24} color={colors.orange} />
          </View>
          <Text style={[styles.versaoApp, { color: text }]}>AjuLabs Shopping</Text>
          <Text style={[styles.versaoNum, { color: textSec as string }]}>Versão {APP_VERSION}</Text>
          <Text style={[styles.versaoDesc, { color: textSec as string }]}>Feito com carinho em Aracaju, SE</Text>
        </View>
      </ScrollView>
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
  scroll:         { padding: 16, paddingBottom: 40 },
  card:           { borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
  row:            { flexDirection: 'row', alignItems: 'center', gap: 14,
                    paddingHorizontal: 16, paddingVertical: 14 },
  rowBorder:      { borderBottomWidth: 1 },
  iconBox:        { width: 34, height: 34, borderRadius: 9,
                    alignItems: 'center', justifyContent: 'center' },
  rowLabel:       { flex: 1, fontSize: 14, fontWeight: '500' },
  limpoBadge:     { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 99 },
  limpoBadgeTxt:  { fontSize: 11, fontWeight: '600' },
  versaoCard:     { alignItems: 'center', marginTop: 32, paddingVertical: 24, gap: 4 },
  versaoLogo:     { width: 52, height: 52, borderRadius: 16,
                    alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  versaoApp:      { fontSize: 16, fontWeight: '700' },
  versaoNum:      { fontSize: 13, marginTop: 2 },
  versaoDesc:     { fontSize: 12, marginTop: 4 },

  toggleTrack:    { width: 46, height: 26, borderRadius: 13, justifyContent: 'center' },
  toggleThumb:    { position: 'absolute', width: 22, height: 22, borderRadius: 11,
                    backgroundColor: '#FFFFFF',
                    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.15, shadowRadius: 2, elevation: 2 },
});
