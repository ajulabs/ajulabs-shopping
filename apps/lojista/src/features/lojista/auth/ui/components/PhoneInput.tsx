import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  Modal, FlatList, StyleSheet, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../../../theme';

interface Country { code: string; name: string; dial: string; }

const COUNTRIES: Country[] = [
  { code: 'br', name: 'Brasil',         dial: '+55'  },
  { code: 'pt', name: 'Portugal',       dial: '+351' },
  { code: 'us', name: 'Estados Unidos', dial: '+1'   },
  { code: 'ar', name: 'Argentina',      dial: '+54'  },
  { code: 'uy', name: 'Uruguai',        dial: '+598' },
  { code: 'co', name: 'Colômbia',       dial: '+57'  },
  { code: 'cl', name: 'Chile',          dial: '+56'  },
  { code: 'mx', name: 'México',         dial: '+52'  },
  { code: 'py', name: 'Paraguai',       dial: '+595' },
  { code: 'bo', name: 'Bolívia',        dial: '+591' },
  { code: 'pe', name: 'Peru',           dial: '+51'  },
  { code: 've', name: 'Venezuela',      dial: '+58'  },
  { code: 'es', name: 'Espanha',        dial: '+34'  },
  { code: 'gb', name: 'Reino Unido',    dial: '+44'  },
  { code: 'de', name: 'Alemanha',       dial: '+49'  },
  { code: 'fr', name: 'França',         dial: '+33'  },
  { code: 'it', name: 'Itália',         dial: '+39'  },
  { code: 'jp', name: 'Japão',          dial: '+81'  },
  { code: 'cn', name: 'China',          dial: '+86'  },
];

function Flag({ code }: { code: string }) {
  return (
    <Image
      source={{ uri: `https://flagcdn.com/w40/${code}.png` }}
      style={st.flag}
      resizeMode="cover"
    />
  );
}

function formatBR(v: string): string {
  const d = v.replace(/\D/g, '').slice(0, 11);
  if (d.length <= 10) return d.replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{4})(\d)/, '$1-$2');
  return d.replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{1})(\d{4})(\d)/, '$1 $2-$3');
}

interface PhoneInputProps {
  value: string;
  onChange: (local: string, full: string) => void;
  error?: string;
}

export function PhoneInput({ value, onChange, error }: PhoneInputProps) {
  const [country, setCountry] = useState<Country>(COUNTRIES[0]);
  const [showPicker, setShowPicker] = useState(false);

  const handleText = (raw: string) => {
    const local = country.dial === '+55' ? formatBR(raw) : raw;
    onChange(local, `${country.dial}${raw.replace(/\D/g, '')}`);
  };

  const handleSelect = (c: Country) => {
    setCountry(c);
    setShowPicker(false);
    const digits = value.replace(/\D/g, '');
    const local = c.dial === '+55' ? formatBR(digits) : digits;
    onChange(local, `${c.dial}${digits}`);
  };

  return (
    <>
      <View style={[st.container, !!error && st.containerError]}>
        <TouchableOpacity style={st.prefix} onPress={() => setShowPicker(true)} activeOpacity={0.7}>
          <Flag code={country.code} />
          <Text style={st.dial}>{country.dial}</Text>
          <Ionicons name="chevron-down" size={12} color={colors.n600} />
        </TouchableOpacity>
        <View style={st.divider} />
        <TextInput
          style={st.input}
          value={value}
          onChangeText={handleText}
          placeholder={country.dial === '+55' ? '(79) 9 0000-0000' : '000 000 0000'}
          placeholderTextColor={colors.n600}
          keyboardType="phone-pad"
        />
      </View>
      {!!error && <Text style={st.errorText}>{error}</Text>}

      <Modal visible={showPicker} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={st.modal}>
          <View style={st.modalHeader}>
            <Text style={st.modalTitle}>Selecionar país</Text>
            <TouchableOpacity onPress={() => setShowPicker(false)}>
              <Ionicons name="close" size={22} color={colors.navy} />
            </TouchableOpacity>
          </View>
          <FlatList
            data={COUNTRIES}
            keyExtractor={item => item.code}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[st.item, item.code === country.code && st.itemSelected]}
                onPress={() => handleSelect(item)}
                activeOpacity={0.7}
              >
                <Flag code={item.code} />
                <Text style={st.itemName}>{item.name}</Text>
                <Text style={st.itemDial}>{item.dial}</Text>
                {item.code === country.code && <Ionicons name="checkmark" size={18} color={colors.orange} />}
              </TouchableOpacity>
            )}
          />
        </SafeAreaView>
      </Modal>
    </>
  );
}

const st = StyleSheet.create({
  container:      { flexDirection: 'row', alignItems: 'center', height: 46, borderRadius: 12,
                    borderWidth: 1.5, borderColor: colors.n200, backgroundColor: colors.n50 },
  containerError: { borderColor: '#E24B4A' },
  prefix:         { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12 },
  flag:           { width: 26, height: 18, borderRadius: 2 },
  dial:           { fontSize: 13, fontWeight: '600', color: colors.navy },
  divider:        { width: 1, height: 24, backgroundColor: colors.n200 },
  input:          { flex: 1, paddingHorizontal: 12, fontSize: 14, color: colors.navy },
  errorText:      { fontSize: 11, color: '#E24B4A', marginTop: 4, fontWeight: '500' },

  modal:          { flex: 1, backgroundColor: colors.n0 },
  modalHeader:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                    paddingHorizontal: 20, paddingVertical: 16,
                    borderBottomWidth: 1, borderBottomColor: colors.n100 },
  modalTitle:     { fontSize: 17, fontWeight: '700', color: colors.navy },
  item:           { flexDirection: 'row', alignItems: 'center', gap: 14,
                    paddingHorizontal: 20, paddingVertical: 14,
                    borderBottomWidth: 1, borderBottomColor: colors.n100 },
  itemSelected:   { backgroundColor: colors.orange100 },
  itemName:       { flex: 1, fontSize: 15, color: colors.navy },
  itemDial:       { fontSize: 13, color: colors.n600, fontWeight: '500' },
});
