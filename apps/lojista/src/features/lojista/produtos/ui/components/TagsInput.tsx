import { View, Text, TouchableOpacity, TextInput, StyleSheet } from 'react-native';
import { colors } from '../../../../../theme';
import { useTheme } from '../../../../../shared/hooks';

export function TagsInput({
  tags,
  newTag,
  onChangeNewTag,
  onAddTag,
  onRemoveTag,
}: {
  tags: string[];
  newTag: string;
  onChangeNewTag: (v: string) => void;
  onAddTag: () => void;
  onRemoveTag: (tag: string) => void;
}) {
  const theme = useTheme();
  return (
    <View style={styles.fieldGroup}>
      <Text style={[styles.fieldLabel, { color: theme.textSec }]}>Tags sugeridas</Text>
      <View style={styles.tagsWrap}>
        {tags.map((tag) => (
          <TouchableOpacity
            key={tag}
            style={styles.tag}
            onPress={() => onRemoveTag(tag)}
            activeOpacity={0.7}
          >
            <Text style={styles.tagText}>#{tag}</Text>
            <Text style={styles.tagRemove}>×</Text>
          </TouchableOpacity>
        ))}
        <View style={[styles.tagInput, { borderColor: theme.border }]}>
          <TextInput
            style={[styles.tagInputField, { color: theme.text }]}
            value={newTag}
            onChangeText={onChangeNewTag}
            onSubmitEditing={onAddTag}
            placeholder="+ tag"
            placeholderTextColor={theme.textMut}
            returnKeyType="done"
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fieldGroup: { gap: 6 },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7390',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  tagsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFEAD4',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 99,
  },
  tagText: { fontSize: 12, fontWeight: '600', color: '#DE6708' },
  tagRemove: { fontSize: 14, color: '#DE6708', opacity: 0.6 },
  tagInput: {
    borderWidth: 1,
    borderColor: '#E4E7F1',
    borderStyle: 'dashed',
    borderRadius: 99,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  tagInputField: { fontSize: 12, color: '#000933', minWidth: 50 },
});
