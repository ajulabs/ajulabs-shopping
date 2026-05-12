import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@ajulabs/theme';

interface MenuItem {
  icon: string;
  label: string;
  badge?: string;
  onPress?: () => void;
}

interface Props {
  items: MenuItem[];
  isDark?: boolean;
}

export function ProfileMenu({ items, isDark = false }: Props) {
  const surf    = isDark ? colors.surfDark : colors.n0;
  const border  = isDark ? 'rgba(255,255,255,0.08)' : colors.n200;
  const borderL = isDark ? 'rgba(255,255,255,0.05)' : colors.n100;
  const text    = isDark ? colors.n0      : colors.navy;
  const textSec = isDark ? 'rgba(255,255,255,0.4)' : colors.n500;
  const iconBg  = isDark ? 'rgba(255,255,255,0.08)' : colors.orange100;

  return (
    <View style={[styles.card, { backgroundColor: surf, borderColor: border }]}>
      {items.map((item, i) => (
        <TouchableOpacity
          key={item.label}
          style={[
            styles.row,
            i < items.length - 1 && [styles.rowBorder, { borderBottomColor: borderL }],
          ]}
          onPress={item.onPress}
          activeOpacity={0.7}
        >
          <View style={[styles.iconBox, { backgroundColor: iconBg }]}>
            <Ionicons name={item.icon as any} size={17} color={colors.orange600} />
          </View>

          <Text style={[styles.label, { color: text }]}>{item.label}</Text>

          {item.badge && (
            <View style={styles.badge}>
              <Text style={styles.badgeTxt}>{item.badge}</Text>
            </View>
          )}

          <Ionicons name="chevron-forward" size={16} color={textSec as string} />
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card:       { borderRadius: 16, overflow: 'hidden', borderWidth: 1 },

  row:        { flexDirection: 'row', alignItems: 'center', gap: 14,
                paddingHorizontal: 16, paddingVertical: 14 },
  rowBorder:  { borderBottomWidth: 1 },

  iconBox:    { width: 34, height: 34, borderRadius: 9,
                alignItems: 'center', justifyContent: 'center' },

  label:      { flex: 1, fontSize: 14, fontWeight: '500' },

  badge:      { backgroundColor: colors.orange100, paddingHorizontal: 8, paddingVertical: 2,
                borderRadius: 99, marginRight: 4 },
  badgeTxt:   { fontSize: 11, fontWeight: '600', color: colors.orange600 },
});
