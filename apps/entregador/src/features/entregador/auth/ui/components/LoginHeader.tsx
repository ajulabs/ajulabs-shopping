import { View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, AjuLogo } from '@ajulabs/theme';

export function LoginHeader() {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.top, { paddingTop: insets.top + 12 }]}>
      <View style={{ marginBottom: 16 }}>
        <AjuLogo size={52} />
      </View>
      <Text style={styles.topTitle}>AjuLabs Entregador</Text>
      <Text style={styles.topSub}>Entregue com agilidade em Aracaju.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  top: { paddingBottom: 28, paddingHorizontal: 24, alignItems: 'center' },
  topTitle: { fontSize: 26, fontWeight: '800', color: '#fff', letterSpacing: -0.5 },
  topSub: { fontSize: 14, color: 'rgba(255,255,255,0.6)', marginTop: 6 },
});
