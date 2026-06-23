import { View, Text, StyleSheet } from 'react-native';
import { colors } from '@ajulabs/theme';

export function LoginFooter() {
  return (
    <View style={styles.footer}>
      <Text style={styles.footerText}>
        by <Text style={styles.footerBrand}>AjuLabs</Text>
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  footer: { paddingVertical: 16, alignItems: 'center', backgroundColor: colors.navy },
  footerText: { fontSize: 11, color: 'rgba(255,255,255,0.4)' },
  footerBrand: { color: 'rgba(255,255,255,0.65)', fontWeight: '600' },
});
