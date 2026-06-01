import { useEffect, useRef } from 'react';
import { Animated, TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../hooks';

export interface ToastData {
  title: string;
  body: string;
  type: 'mensagem' | 'status';
  onPress?: () => void;
}

interface Props {
  toast: ToastData | null;
  onHide: () => void;
}

export function NotificationToast({ toast, onHide }: Props) {
  const { surf, text, textSec, borderL } = useTheme();
  const insets = useSafeAreaInsets();
  const slideY = useRef(new Animated.Value(-160)).current;
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    if (!toast) return;
    Animated.spring(slideY, {
      toValue: 0,
      useNativeDriver: true,
      tension: 80,
      friction: 10,
    }).start();
    timerRef.current = setTimeout(hide, 4000);
    return () => clearTimeout(timerRef.current);
  }, [toast]);

  function hide() {
    clearTimeout(timerRef.current);
    Animated.timing(slideY, {
      toValue: -160,
      duration: 220,
      useNativeDriver: true,
    }).start(() => onHide());
  }

  if (!toast) return null;

  const color = toast.type === 'mensagem' ? '#f97316' : '#2563EB';
  const icon: React.ComponentProps<typeof Ionicons>['name'] =
    toast.type === 'mensagem' ? 'chatbubble' : 'refresh-circle';

  return (
    <Animated.View
      style={[
        styles.wrapper,
        { paddingTop: insets.top + 8 },
        { transform: [{ translateY: slideY }] },
      ]}
    >
      <TouchableOpacity
        style={[styles.card, { backgroundColor: surf, borderColor: borderL }]}
        onPress={() => {
          toast.onPress?.();
          hide();
        }}
        activeOpacity={0.95}
      >
        <View style={[styles.iconWrap, { backgroundColor: color + '20' }]}>
          <Ionicons name={icon} size={20} color={color} />
        </View>
        <View style={styles.content}>
          <Text style={[styles.title, { color: text }]} numberOfLines={1}>
            {toast.title}
          </Text>
          <Text style={[styles.body, { color: textSec as string }]} numberOfLines={2}>
            {toast.body}
          </Text>
          {!!toast.onPress && (
            <Text style={[styles.tap, { color: color }]}>Toque para abrir →</Text>
          )}
        </View>
        <TouchableOpacity onPress={hide} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="close-outline" size={18} color={textSec as string} />
        </TouchableOpacity>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    paddingHorizontal: 16,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 8,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: { flex: 1 },
  title: { fontSize: 13, fontWeight: '700', marginBottom: 2 },
  body: { fontSize: 12, lineHeight: 17 },
  tap: { fontSize: 11, fontWeight: '600', marginTop: 4 },
});
