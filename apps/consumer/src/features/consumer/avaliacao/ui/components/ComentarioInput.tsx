import { View, TextInput, StyleSheet } from 'react-native';
import { colors } from '@ajulabs/theme';
import { useTheme } from '../../../../../shared/hooks';

export function ComentarioInput({
  placeholder,
  value,
  onChange,
}: {
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const { text, textSec, borderL } = useTheme();

  return (
    <View
      style={[
        styles.comentarioWrap,
        { borderColor: borderL, backgroundColor: `${colors.orange}06` },
      ]}
    >
      <TextInput
        style={[styles.comentario, { color: text }]}
        placeholder={placeholder}
        placeholderTextColor={textSec as string}
        multiline
        maxLength={500}
        value={value}
        onChangeText={onChange}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  comentarioWrap: {
    borderWidth: 1,
    borderRadius: 10,
    marginBottom: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minHeight: 60,
  },
  comentario: { fontSize: 12, lineHeight: 18, textAlignVertical: 'top' },
});
