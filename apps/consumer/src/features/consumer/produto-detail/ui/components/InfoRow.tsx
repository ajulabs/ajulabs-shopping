import { View, Text, StyleSheet } from 'react-native';

export function InfoRow({
  label,
  value,
  text,
  textSec,
  borderL,
}: {
  label: string;
  value: string;
  text: string;
  textSec: string;
  borderL: string;
}) {
  return (
    <View style={[styles.infoRow, { borderTopColor: borderL }]}>
      <Text style={[styles.infoLabel, { color: textSec }]}>{label}</Text>
      <Text style={[styles.infoValue, { color: text }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 10,
    borderTopWidth: 1,
  },
  infoLabel: { fontSize: 13, fontWeight: '500', flex: 1 },
  infoValue: { fontSize: 13, fontWeight: '600', flex: 2, textAlign: 'right' },
});
