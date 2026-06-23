import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { STATUS_CONFIG, type StatusDoc } from '../../model/useDocumentos';

export function StatusBadge({ status }: { status: StatusDoc }) {
  if (!status) return null;
  const cfg = STATUS_CONFIG[status];
  return (
    <View style={[sb.badge, { backgroundColor: cfg.bg }]}>
      <Ionicons name={cfg.icon as any} size={12} color={cfg.color} />
      <Text style={[sb.text, { color: cfg.color }]}>{cfg.label}</Text>
    </View>
  );
}

const sb = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 99,
  },
  text: { fontSize: 11, fontWeight: '700' },
});

export function DocCard({
  title,
  subtitle,
  imageUrl,
  status,
  onPreview,
}: {
  title: string;
  subtitle: string;
  imageUrl: string | null;
  status: StatusDoc;
  onPreview: (url: string) => void;
}) {
  return (
    <View style={s.docCard}>
      <TouchableOpacity
        style={[s.docThumbWrap, !imageUrl && s.docThumbEmpty]}
        onPress={() => imageUrl && onPreview(imageUrl)}
        activeOpacity={imageUrl ? 0.8 : 1}
        disabled={!imageUrl}
      >
        {imageUrl ? (
          <Image source={{ uri: imageUrl }} style={s.docThumb} resizeMode="cover" />
        ) : (
          <Ionicons name="document-outline" size={28} color="#9099B3" />
        )}
        {imageUrl && (
          <View style={s.previewOverlay}>
            <Ionicons name="expand-outline" size={16} color="#FFFFFF" />
          </View>
        )}
      </TouchableOpacity>
      <View style={{ flex: 1 }}>
        <Text style={s.docTitle}>{title}</Text>
        <Text style={s.docSubtitle}>{subtitle}</Text>
        <View style={{ marginTop: 6 }}>
          {imageUrl ? (
            <StatusBadge status={status} />
          ) : (
            <View style={[sb.badge, { backgroundColor: '#F6F7FB' }]}>
              <Ionicons name="alert-circle-outline" size={12} color="#9099B3" />
              <Text style={[sb.text, { color: '#9099B3' }]}>Não enviado</Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  docCard: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14 },
  docThumbWrap: {
    width: 60,
    height: 60,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#F6F7FB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  docThumbEmpty: { borderWidth: 1.5, borderColor: '#E4E7F1', borderStyle: 'dashed' },
  docThumb: { width: 60, height: 60 },
  previewOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 22,
    height: 22,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    borderTopLeftRadius: 6,
  },
  docTitle: { fontSize: 14, fontWeight: '700', color: '#000933' },
  docSubtitle: { fontSize: 12, color: '#9099B3', marginTop: 1 },
});
