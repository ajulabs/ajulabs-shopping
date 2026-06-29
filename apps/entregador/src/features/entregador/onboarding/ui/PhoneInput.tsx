import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  FlatList,
  StyleSheet,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { useTheme } from '../../../../shared/hooks';
import type { Theme } from '../../../../shared/hooks/useTheme';

const ORANGE = '#F2760F';
const NAVY = '#000933';
const N600 = '#9099B3';
const BORDER = '#E4E7F1';
const BG = '#F6F7FB';
const WHITE = '#FFFFFF';

interface Country {
  code: string;
  name: string;
  dial: string;
}

const COUNTRIES: Country[] = [
  { code: 'br', name: 'Brasil', dial: '+55' },
  { code: 'pt', name: 'Portugal', dial: '+351' },
  { code: 'us', name: 'Estados Unidos', dial: '+1' },
  { code: 'ar', name: 'Argentina', dial: '+54' },
  { code: 'uy', name: 'Uruguai', dial: '+598' },
  { code: 'co', name: 'Colômbia', dial: '+57' },
  { code: 'cl', name: 'Chile', dial: '+56' },
  { code: 'mx', name: 'México', dial: '+52' },
  { code: 'py', name: 'Paraguai', dial: '+595' },
  { code: 'bo', name: 'Bolívia', dial: '+591' },
  { code: 'pe', name: 'Peru', dial: '+51' },
  { code: 've', name: 'Venezuela', dial: '+58' },
  { code: 'es', name: 'Espanha', dial: '+34' },
  { code: 'gb', name: 'Reino Unido', dial: '+44' },
  { code: 'de', name: 'Alemanha', dial: '+49' },
  { code: 'fr', name: 'França', dial: '+33' },
  { code: 'it', name: 'Itália', dial: '+39' },
  { code: 'jp', name: 'Japão', dial: '+81' },
  { code: 'cn', name: 'China', dial: '+86' },
];

function Flag({ code }: { code: string }) {
  const [failed, setFailed] = useState(false);
  const theme = useTheme();
  const st = useMemo(() => makeStyles(theme), [theme]);
  if (failed) {
    return (
      <View style={st.flagFallback}>
        <Text style={st.flagFallbackText}>{code.toUpperCase()}</Text>
      </View>
    );
  }
  return (
    <Image
      source={{ uri: `https://flagcdn.com/w80/${code}.png` }}
      style={st.flag}
      resizeMode="cover"
      onError={() => setFailed(true)}
    />
  );
}

function formatBR(v: string): string {
  const d = v.replace(/\D/g, '').slice(0, 11);
  if (d.length <= 2) return d;
  if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d[2]} ${d.slice(3, 7)}-${d.slice(7)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
}

interface PhoneInputProps {
  value: string;
  onChange: (local: string, full: string) => void;
  onBlur?: () => void;
  error?: string;
}

export function PhoneInput({ value, onChange, onBlur, error }: PhoneInputProps) {
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

  const theme = useTheme();
  const st = useMemo(() => makeStyles(theme), [theme]);

  return (
    <>
      <View style={[st.container, !!error && st.containerError]}>
        <TouchableOpacity style={st.prefix} onPress={() => setShowPicker(true)} activeOpacity={0.7}>
          <Flag code={country.code} />
          <Text style={st.dial}>{country.dial}</Text>
          <Ionicons name="chevron-down" size={12} color={N600} />
        </TouchableOpacity>
        <View style={st.divider} />
        <TextInput
          style={st.input}
          value={value}
          onChangeText={handleText}
          placeholder={country.dial === '+55' ? '(79) 9 0000-0000' : '000 000 0000'}
          placeholderTextColor={N600}
          keyboardType="phone-pad"
          autoComplete="tel"
          textContentType="telephoneNumber"
          onBlur={onBlur}
        />
      </View>
      {!!error && <Text style={st.errorText}>{error}</Text>}

      <Modal visible={showPicker} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={st.modal}>
          <View style={st.modalHeader}>
            <Text style={st.modalTitle}>Selecionar país</Text>
            <TouchableOpacity onPress={() => setShowPicker(false)}>
              <Ionicons name="close" size={22} color={NAVY} />
            </TouchableOpacity>
          </View>
          <FlatList
            data={COUNTRIES}
            keyExtractor={(item) => item.code}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[st.item, item.code === country.code && st.itemSelected]}
                onPress={() => handleSelect(item)}
                activeOpacity={0.7}
              >
                <Flag code={item.code} />
                <Text style={st.itemName}>{item.name}</Text>
                <Text style={st.itemDial}>{item.dial}</Text>
                {item.code === country.code && (
                  <Ionicons name="checkmark" size={18} color={ORANGE} />
                )}
              </TouchableOpacity>
            )}
          />
        </SafeAreaView>
      </Modal>
    </>
  );
}

function makeStyles(theme: Theme) {
  return StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      borderRadius: 12,
      borderWidth: 1.5,
      borderColor: BORDER,
      backgroundColor: BG,
    },
    containerError: { borderColor: '#E24B4A' },
    prefix: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 12,
      paddingVertical: 13,
    },
    flag: { width: 26, height: 18, borderRadius: 2 },
    flagFallback: {
      width: 26,
      height: 18,
      borderRadius: 2,
      backgroundColor: BORDER,
      alignItems: 'center',
      justifyContent: 'center',
    },
    flagFallbackText: { fontSize: 9, fontWeight: '800', color: N600 },
    dial: { fontSize: 13, fontWeight: '600', color: NAVY },
    divider: { width: 1, height: 24, backgroundColor: BORDER },
    input: { flex: 1, paddingHorizontal: 12, fontSize: 15, color: NAVY },
    errorText: { fontSize: 11, color: '#E24B4A', marginTop: 4, fontWeight: '500' },

    modal: { flex: 1, backgroundColor: WHITE },
    modalHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: BORDER,
    },
    modalTitle: { fontSize: 17, fontWeight: '700', color: NAVY },
    item: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
      paddingHorizontal: 20,
      paddingVertical: 14,
      borderBottomWidth: 1,
      borderBottomColor: BORDER,
    },
    itemSelected: { backgroundColor: 'rgba(242,118,15,0.08)' },
    itemName: { flex: 1, fontSize: 15, color: NAVY },
    itemDial: { fontSize: 13, color: N600, fontWeight: '500' },
  });
}
