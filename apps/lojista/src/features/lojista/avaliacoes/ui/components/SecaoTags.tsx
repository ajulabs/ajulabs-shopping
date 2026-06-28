import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { type TagAgregada } from '@ajulabs/types';
import { useTheme } from '../../../../../shared/hooks';

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
  return (
    <View style={[s.section, { backgroundColor: theme.surf, borderColor: theme.border }]}>
      <View style={s.sectionHeader}>
        <View style={[s.sectionIcon, { backgroundColor: bgIcone }]}>
          <Ionicons name={iconName} size={14} color={iconColor} />
        </View>
        <Text style={[s.sectionTitle, { color: theme.text }]}>{titulo}</Text>
      </View>
      {tags.length === 0 ? (
        <Text style={[s.sectionEmpty, { color: theme.textMut }]}>{vazio}</Text>
      ) : (
        <View style={{ gap: 8 }}>
          {tags.map((t) => (
            <View key={t.tag.id} style={s.tagRow}>
              <Text style={[s.tagLabel, { color: theme.text }]}>{t.tag.label}</Text>
              <View style={[s.tagBadge, { backgroundColor: theme.surf2 }]}>
                <Text style={[s.tagBadgeText, { color: theme.text }]}>
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

const s = StyleSheet.create({
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E4E7F1',
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
  sectionTitle: { fontSize: 14, fontWeight: '700', color: '#000933' },
  sectionEmpty: { fontSize: 12, color: '#9099B3', lineHeight: 17 },

  tagRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  tagLabel: { fontSize: 13, color: '#000933', fontWeight: '600' },
  tagBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 99,
    backgroundColor: '#F0F1F5',
  },
  tagBadgeText: { fontSize: 11, fontWeight: '700', color: '#000933' },
});
