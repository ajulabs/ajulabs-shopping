import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@ajulabs/theme';
import { useTheme } from '../../../../../shared/hooks';

export function StarRow({
  label,
  sublabel,
  nota,
  onChange,
  iconName,
  noBorder,
}: {
  label: string;
  sublabel?: string;
  nota: number;
  onChange: (n: number) => void;
  iconName: keyof typeof Ionicons.glyphMap;
  noBorder?: boolean;
}) {
  const { text, textSec, borderL } = useTheme();

  return (
    <View
      style={[styles.starRow, !noBorder && { borderBottomColor: borderL, borderBottomWidth: 1 }]}
    >
      <View style={styles.starRowLeft}>
        <View style={[styles.starIconBox, { backgroundColor: `${colors.orange}18` }]}>
          <Ionicons name={iconName} size={18} color={colors.orange} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.starLabel, { color: text }]}>{label}</Text>
          {sublabel ? (
            <Text style={[styles.starSublabel, { color: textSec as string }]}>{sublabel}</Text>
          ) : null}
        </View>
      </View>
      <View style={styles.stars}>
        {[1, 2, 3, 4, 5].map((n) => (
          <TouchableOpacity key={n} onPress={() => onChange(n)} activeOpacity={0.7} hitSlop={6}>
            <Ionicons
              name={n <= nota ? 'star' : 'star-outline'}
              size={26}
              color={n <= nota ? '#F59E0B' : '#D1D5DB'}
            />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  starRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    gap: 8,
  },
  starRowLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  starIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  starLabel: { fontSize: 13, fontWeight: '600' },
  starSublabel: { fontSize: 11, marginTop: 1 },
  stars: { flexDirection: 'row', gap: 2 },
});
