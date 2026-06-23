import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

export function ApprovalScreen({ onContinue }: { onContinue: () => void }) {
  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: '#FFFFFF',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 30,
      }}
    >
      <View
        style={{
          width: 100,
          height: 100,
          borderRadius: 50,
          backgroundColor: '#39FF89',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 20,
        }}
      >
        <Ionicons name="checkmark" size={48} color="#002B12" />
      </View>
      <Text
        style={{
          fontSize: 26,
          fontWeight: '800',
          color: '#000933',
          marginBottom: 10,
          textAlign: 'center',
        }}
      >
        Cadastro enviado!
      </Text>
      <View style={{ alignItems: 'center', maxWidth: 280, marginBottom: 28, gap: 4 }}>
        <Text style={{ fontSize: 14, color: '#9099B3', textAlign: 'center', lineHeight: 21 }}>
          Análise em até 24h. Como essa é uma demo, já liberamos tudo — bora começar a rodar
        </Text>
        <Ionicons name="car-sport" size={18} color="#9099B3" />
      </View>
      <TouchableOpacity
        style={{
          backgroundColor: '#F2760F',
          borderRadius: 14,
          paddingVertical: 16,
          paddingHorizontal: 40,
        }}
        onPress={onContinue}
        activeOpacity={0.85}
      >
        <Text style={{ color: '#FFFFFF', fontSize: 15, fontWeight: '700' }}>Começar a rodar</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}
