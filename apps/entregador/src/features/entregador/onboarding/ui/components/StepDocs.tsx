import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface StepDocsProps {
  frenteUri: string | null;
  versoUri: string | null;
  onPickDoc: (lado: 'frente' | 'verso') => void;
  tipoTransporte: string;
}

export function StepDocs({ frenteUri, versoUri, onPickDoc, tipoTransporte }: StepDocsProps) {
  const needsCnh = tipoTransporte !== 'bike';
  const docNome = needsCnh ? 'CNH' : 'RG';
  const docs = [
    { key: 'frente' as const, label: `${docNome} — Frente`, uri: frenteUri },
    { key: 'verso' as const, label: `${docNome} — Verso`, uri: versoUri },
  ];
  return (
    <View>
      <View style={s.infoBox}>
        <Ionicons name={needsCnh ? 'card' : 'id-card'} size={16} color="#209CEF" />
        <Text style={s.infoText}>
          {needsCnh
            ? 'Para moto ou carro é obrigatório enviar a CNH (frente e verso).'
            : 'Para bicicleta, envie uma foto do seu RG (frente e verso).'}
        </Text>
      </View>
      {docs.map((doc) => (
        <TouchableOpacity
          key={doc.key}
          style={s.docBtn}
          activeOpacity={0.8}
          onPress={() => onPickDoc(doc.key)}
        >
          {doc.uri ? (
            <Image source={{ uri: doc.uri }} style={s.docThumb} />
          ) : (
            <View style={s.docIcon}>
              <Ionicons name="camera" size={20} color="#F2760F" />
            </View>
          )}
          <View style={{ flex: 1 }}>
            <Text style={s.docTitle}>{doc.label}</Text>
            <Text style={s.docSub}>
              {doc.uri ? 'Toque para trocar' : 'Toque para tirar foto ou escolher da galeria'}
            </Text>
          </View>
          {doc.uri && <Ionicons name="checkmark-circle" size={20} color="#039855" />}
        </TouchableOpacity>
      ))}
      <View style={[s.infoBox, { marginTop: 8 }]}>
        <Ionicons name="shield-checkmark" size={16} color="#209CEF" />
        <Text style={s.infoText}>Análise em até 24h. Seus dados são criptografados.</Text>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  docBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#E4E7F1',
    borderStyle: 'dashed',
    backgroundColor: '#F6F7FB',
    marginBottom: 10,
  },
  docIcon: {
    width: 42,
    height: 42,
    borderRadius: 10,
    backgroundColor: '#FEF0E3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  docThumb: { width: 42, height: 42, borderRadius: 10 },
  docTitle: { fontSize: 14, fontWeight: '600', color: '#000933' },
  docSub: { fontSize: 11, color: '#9099B3', marginTop: 2 },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    padding: 12,
    backgroundColor: 'rgba(32,156,239,0.08)',
    borderRadius: 10,
    marginTop: 8,
  },
  infoText: { flex: 1, fontSize: 12, color: '#000933', lineHeight: 18 },
});
