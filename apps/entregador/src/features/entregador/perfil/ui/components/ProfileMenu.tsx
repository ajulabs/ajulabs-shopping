import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface MenuItem {
  icon: string;
  label: string;
  extra?: string;
  extraColor?: string;
}

interface ProfileMenuProps {
  items: readonly MenuItem[];
  onPress: (label: string) => void;
}

export function ProfileMenu({ items, onPress }: ProfileMenuProps) {
  return (
    <View style={s.menuCard}>
      {items.map((item, i) => (
        <TouchableOpacity
          key={item.label}
          style={[
            s.menuRow,
            i < items.length - 1 && { borderBottomWidth: 1, borderBottomColor: '#E4E7F1' },
          ]}
          onPress={() => onPress(item.label)}
          activeOpacity={0.7}
        >
          <View style={s.menuIcon}>
            <Ionicons name={item.icon as any} size={18} color="#000933" />
          </View>
          <Text style={s.menuLabel}>{item.label}</Text>
          {'extra' in item && item.extra && (
            <View style={[s.extraBadge, { backgroundColor: 'rgba(3,152,85,0.1)' }]}>
              <Text style={[s.extraText, { color: (item as any).extraColor }]}>{item.extra}</Text>
            </View>
          )}
          <Ionicons name="chevron-forward" size={16} color="#9099B3" />
        </TouchableOpacity>
      ))}
    </View>
  );
}

const s = StyleSheet.create({
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
});
