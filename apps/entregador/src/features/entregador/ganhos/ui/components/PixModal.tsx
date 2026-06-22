import { View, Text, TouchableOpacity, Modal, Alert } from 'react-native';

export function PixModal({
  visible,
  ganho,
  onClose,
}: {
  visible: boolean;
  ganho: number;
  onClose: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,9,51,0.6)', justifyContent: 'flex-end' }}>
        <View
          style={{
            backgroundColor: '#FFFFFF',
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            padding: 28,
            paddingBottom: 40,
          }}
        >
          <View
            style={{
              width: 36,
              height: 4,
              borderRadius: 2,
              backgroundColor: '#E4E7F1',
              alignSelf: 'center',
              marginBottom: 20,
            }}
          />
          <Text style={{ fontSize: 20, fontWeight: '700', color: '#000933', marginBottom: 6 }}>
            Sacar via Pix
          </Text>
          <Text style={{ fontSize: 13, color: '#9099B3', marginBottom: 20, lineHeight: 19 }}>
            O valor disponível para saque será transferido para a chave Pix cadastrada nos seus
            dados bancários.
          </Text>
          <View
            style={{
              backgroundColor: '#FEF0E3',
              borderRadius: 14,
              padding: 16,
              marginBottom: 20,
              alignItems: 'center',
            }}
          >
            <Text
              style={{
                fontSize: 12,
                color: '#9099B3',
                fontWeight: '600',
                textTransform: 'uppercase',
                letterSpacing: 0.5,
                marginBottom: 4,
              }}
            >
              Disponível para saque
            </Text>
            <Text style={{ fontSize: 36, fontWeight: '800', color: '#F2760F' }}>
              {ganho.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </Text>
          </View>
          <TouchableOpacity
            style={{
              height: 50,
              borderRadius: 14,
              backgroundColor: '#F2760F',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 10,
            }}
            onPress={() => {
              onClose();
              Alert.alert(
                'Saque solicitado!',
                'Seu saque foi processado e será creditado em até 1 dia útil na chave Pix cadastrada.',
              );
            }}
            activeOpacity={0.85}
          >
            <Text style={{ fontSize: 15, fontWeight: '700', color: '#FFFFFF' }}>
              Confirmar saque
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={{
              height: 44,
              borderRadius: 12,
              borderWidth: 1.5,
              borderColor: '#E4E7F1',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            onPress={onClose}
            activeOpacity={0.8}
          >
            <Text style={{ fontSize: 14, fontWeight: '600', color: '#9099B3' }}>Cancelar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
