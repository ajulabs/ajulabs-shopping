import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Ticket } from '../../model/data';
import { dataCompleta } from '../../lib/format';

interface Props {
  ticket: Ticket;
  nota: string;
  setNota: (v: string) => void;
  addingNota: boolean;
  onEnviar: () => void;
  onInputFocus?: () => void;
}

export function TicketNotas({ ticket, nota, setNota, addingNota, onEnviar, onInputFocus }: Props) {
  return (
    <View style={s.section}>
      <Text style={s.sectionTitle}>Notas internas</Text>
      {ticket.notas.length === 0 && <Text style={s.semNotas}>Nenhuma nota ainda.</Text>}
      {ticket.notas.map((n) => (
        <View key={n.id} style={s.notaCard}>
          <Text style={s.notaTexto}>{n.texto}</Text>
          <Text style={s.notaData}>{dataCompleta(n.criadoEm)}</Text>
        </View>
      ))}

      <View style={s.notaInputRow}>
        <TextInput
          style={s.notaInput}
          value={nota}
          onChangeText={setNota}
          onFocus={onInputFocus}
          placeholder="Adicionar nota interna..."
          placeholderTextColor="#C8CDE0"
          multiline
        />
        <TouchableOpacity
          style={[s.notaEnviarBtn, (!nota.trim() || addingNota) && { opacity: 0.4 }]}
          onPress={onEnviar}
          disabled={!nota.trim() || addingNota}
          activeOpacity={0.8}
        >
          {addingNota ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Ionicons name="send" size={16} color="#fff" />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  section: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E4E7F1',
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#9099B3',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  semNotas: { fontSize: 13, color: '#C8CDE0', marginBottom: 14 },
  notaCard: { backgroundColor: '#F6F7FB', borderRadius: 10, padding: 12, marginBottom: 8 },
  notaTexto: { fontSize: 13, color: '#000933', lineHeight: 19, marginBottom: 4 },
  notaData: { fontSize: 11, color: '#9099B3' },
  notaInputRow: { flexDirection: 'row', gap: 8, alignItems: 'flex-end', marginTop: 4 },
  notaInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E4E7F1',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: '#000933',
    maxHeight: 100,
    backgroundColor: '#fff',
  },
  notaEnviarBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#000933',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
