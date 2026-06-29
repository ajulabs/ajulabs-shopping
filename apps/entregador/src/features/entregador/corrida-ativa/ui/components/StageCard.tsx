import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { useTheme } from '../../../../../shared/hooks';
import type { Theme } from '../../../../../shared/hooks/useTheme';

interface Props {
  icon: string;
  iconColor: string;
  primary: string;
  secondary: string;
  cta: string;
  onCta: () => void;
  codigoEntrega?: string;
  logoUrl?: string;
}

export function StageCard({
  icon,
  iconColor,
  primary,
  secondary,
  cta,
  onCta,
  codigoEntrega,
  logoUrl,
}: Props) {
  const theme = useTheme();
  const s = useMemo(() => makeStyles(theme), [theme]);
  return (
    <View>
      <View style={s.row}>
        {logoUrl ? (
          <Image source={{ uri: logoUrl }} style={s.logoImg} resizeMode="cover" />
        ) : (
          <View style={[s.iconWrap, { backgroundColor: iconColor }]}>
            <Ionicons name={icon as any} size={22} color="#FFFFFF" />
          </View>
        )}
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={s.primary}>{primary}</Text>
          <Text style={s.secondary}>{secondary}</Text>
        </View>
      </View>

      {codigoEntrega && (
        <View style={s.codeBox}>
          <Ionicons name="keypad-outline" size={14} color="#F2760F" />
          <Text style={s.codeLabel}>Código da corrida:</Text>
          <Text style={s.codeValue}>{codigoEntrega}</Text>
        </View>
      )}

      <TouchableOpacity style={s.cta} onPress={onCta} activeOpacity={0.85}>
        <Text style={s.ctaTxt}>{cta}</Text>
        <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );
}

function makeStyles(theme: Theme) {
  return StyleSheet.create({
    row: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    iconWrap: {
      width: 44,
      height: 44,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
    logoImg: { width: 44, height: 44, borderRadius: 12 },
    primary: { fontSize: 15, fontWeight: '600', color: theme.text, lineHeight: 20 },
    secondary: { fontSize: 12, color: theme.textMut, marginTop: 2 },
    codeBox: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: '#FEF0E3',
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 8,
      marginBottom: 10,
    },
    codeLabel: { fontSize: 12, color: theme.textMut, fontWeight: '600', flex: 1 },
    codeValue: { fontSize: 18, fontWeight: '800', color: theme.text, letterSpacing: 6 },
    cta: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      backgroundColor: '#F2760F',
      borderRadius: 12,
      paddingVertical: 16,
    },
    ctaTxt: { fontSize: 14, fontWeight: '700', color: '#FFFFFF' },
  });
}
