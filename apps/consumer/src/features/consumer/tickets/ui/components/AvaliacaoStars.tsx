import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@ajulabs/theme';

export function AvaliacaoStars({
  nota,
  onAvaliar,
}: {
  nota: number | null;
  onAvaliar: (n: number) => void;
}) {
  const [hover, setHover] = useState(0);
  if (nota !== null) {
    return (
      <View style={av.wrap}>
        <Text style={av.label}>Sua avaliação:</Text>
        <View style={av.stars}>
          {[1, 2, 3, 4, 5].map((n) => (
            <Ionicons key={n} name="star" size={22} color={n <= nota ? '#F59E0B' : colors.n200} />
          ))}
        </View>
      </View>
    );
  }
  return (
    <View style={av.wrap}>
      <Text style={av.label}>Como foi o atendimento?</Text>
      <View style={av.stars}>
        {[1, 2, 3, 4, 5].map((n) => (
          <TouchableOpacity
            key={n}
            onPress={() => {
              setHover(n);
              onAvaliar(n);
            }}
            activeOpacity={0.8}
            style={{ padding: 4 }}
          >
            <Ionicons name="star" size={28} color={n <= hover ? '#F59E0B' : colors.n200} />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const av = StyleSheet.create({
  wrap: { gap: 8 },
  label: { fontSize: 13, fontWeight: '600', color: colors.navy },
  stars: { flexDirection: 'row', gap: 4 },
});
