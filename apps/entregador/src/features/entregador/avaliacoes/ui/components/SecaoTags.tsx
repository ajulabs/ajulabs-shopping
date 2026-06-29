import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { type TagAgregada } from '@ajulabs/types';
import { useMemo } from 'react';
import { useTheme } from '../../../../../shared/hooks';
import type { Theme } from '../../../../../shared/hooks/useTheme';

export function SecaoTags({
  titulo,
  iconName,
  iconColor,
  bgIcone,
  tags,
  vazio,
}: {
  titulo: string;
  iconName: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  bgIcone: string;
  tags: TagAgregada[];
  vazio: string;
}) {
  const theme = useTheme();
  const s = useMemo(() => makeStyles(theme), [theme]);
  return (
    <View style={s.section}>
      <View style={s.sectionHeader}>
        <View style={[s.sectionIcon, { backgroundColor: bgIcone }]}>
          <Ionicons name={iconName} size={14} color={iconColor} />
        </View>
        <Text style={s.sectionTitle}>{titulo}</Text>
      </View>
      {tags.length === 0 ? (
        <Text style={s.sectionEmpty}>{vazio}</Text>
      ) : (
        <View style={{ gap: 8 }}>
          {tags.map((t) => (
            <View key={t.tag.id} style={s.tagRow}>
              <Text style={s.tagLabel}>{t.tag.label}</Text>
              <View style={s.tagBadge}>
                <Text style={s.tagBadgeText}>
                  {t.count} mençã{t.count === 1 ? 'o' : 'ões'}
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

function makeStyles(theme: Theme) {
  return StyleSheet.create({
    section: {
      backgroundColor: theme.surf,
      borderRadius: 16,
      padding: 16,
      borderWidth: 1,
      borderColor: theme.border,
      marginBottom: 12,
    },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
    sectionIcon: {
      width: 26,
      height: 26,
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
    },
    sectionTitle: { fontSize: 14, fontWeight: '700', color: theme.text },
    sectionEmpty: { fontSize: 12, color: theme.textMut, lineHeight: 17 },

    tagRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    tagLabel: { fontSize: 13, color: theme.text, fontWeight: '600' },
    tagBadge: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 99,
      backgroundColor: theme.surf2,
    },
    tagBadgeText: { fontSize: 11, fontWeight: '700', color: theme.text },
  });
}
