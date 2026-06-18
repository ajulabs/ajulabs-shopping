import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../../../shared/hooks';

export function TranscricaoPreview({
  texto,
  onEnviar,
  onEditar,
  onDescartar,
}: {
  texto: string;
  onEnviar: () => void;
  onEditar: () => void;
  onDescartar: () => void;
}) {
  const { isDark, text, textSec } = useTheme();
  return (
    <View
      style={{
        marginHorizontal: 12,
        marginBottom: 8,
        backgroundColor: isDark ? 'rgba(249,115,22,0.12)' : '#fff7ed',
        borderWidth: 1,
        borderColor: isDark ? 'rgba(249,115,22,0.35)' : '#fed7aa',
        borderRadius: 14,
        padding: 12,
        gap: 8,
      }}
    >
      <Text style={{ fontSize: 12, color: textSec as string }}>🎤 Entendi:</Text>
      <Text style={{ fontSize: 14, color: text, fontWeight: '500' }}>"{texto}"</Text>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <TouchableOpacity
          onPress={onEnviar}
          style={{
            flex: 1,
            backgroundColor: '#f97316',
            borderRadius: 10,
            paddingVertical: 9,
            alignItems: 'center',
          }}
          activeOpacity={0.8}
        >
          <Text style={{ color: '#fff', fontSize: 13, fontWeight: '700' }}>Enviar</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={onEditar}
          style={{
            flex: 1,
            borderWidth: 1,
            borderColor: isDark ? 'rgba(255,255,255,0.2)' : '#d1d5db',
            borderRadius: 10,
            paddingVertical: 9,
            alignItems: 'center',
          }}
          activeOpacity={0.8}
        >
          <Text style={{ color: text, fontSize: 13, fontWeight: '600' }}>Editar</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={onDescartar}
          style={{
            paddingHorizontal: 12,
            paddingVertical: 9,
            alignItems: 'center',
            justifyContent: 'center',
          }}
          activeOpacity={0.8}
        >
          <Ionicons name="close" size={18} color={textSec as string} />
        </TouchableOpacity>
      </View>
    </View>
  );
}
