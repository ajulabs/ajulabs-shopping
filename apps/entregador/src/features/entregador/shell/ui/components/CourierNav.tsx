import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { Tab } from '../../model/useCourierShell';

export function CourierNav({
  tab,
  onChange,
  activeCount,
}: {
  tab: Tab;
  onChange: (t: Tab) => void;
  activeCount: number;
}) {
  const insets = useSafeAreaInsets();
  const items = [
    { id: 'home' as Tab, icon: 'map', label: 'Corridas' },
    { id: 'entregas' as Tab, icon: 'bicycle', label: 'Entregas' },
    { id: 'ganhos' as Tab, icon: 'wallet', label: 'Ganhos' },
    { id: 'perfil' as Tab, icon: 'person', label: 'Perfil' },
  ] as const;

  return (
    <View style={[nav.bar, { paddingBottom: insets.bottom + 10 }]}>
      {items.map((it) => {
        const active = tab === it.id;
        const showBadge = it.id === 'entregas' && activeCount > 0;
        return (
          <TouchableOpacity
            key={it.id}
            style={nav.item}
            onPress={() => onChange(it.id)}
            activeOpacity={0.7}
          >
            <View style={[nav.iconWrap, active && { backgroundColor: 'rgba(242,118,15,0.12)' }]}>
              <Ionicons
                name={active ? (it.icon as any) : (`${it.icon}-outline` as any)}
                size={22}
                color={active ? '#F2760F' : '#9099B3'}
              />
              {showBadge && (
                <View style={nav.badge}>
                  <Text style={nav.badgeText}>{activeCount}</Text>
                </View>
              )}
            </View>
            <Text style={[nav.label, active && { color: '#F2760F', fontWeight: '600' }]}>
              {it.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const nav = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E4E7F1',
    paddingTop: 8,
  },
  item: { flex: 1, alignItems: 'center', gap: 3 },
  iconWrap: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 99,
    position: 'relative',
  },
  label: { fontSize: 10.5, fontWeight: '500', color: '#9099B3', letterSpacing: 0.1 },
  badge: {
    position: 'absolute',
    top: -2,
    right: 4,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#F2760F',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: { fontSize: 9, fontWeight: '800', color: '#fff' },
});
