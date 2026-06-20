import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../../../theme';
import { LocationPickerMap } from '../../../../../shared/ui/LocationPickerMap';
import { Field } from './Field';
import type { EnderecoLoja } from '../../lib/validateCadastro';

interface EnderecoSectionProps {
  endereco: EnderecoLoja;
  errors: Record<string, string>;
  locLoading: boolean;
  pinCoords: { lat: number; lng: number } | null;
  fieldPositions: React.MutableRefObject<Record<string, number>>;
  onUsarLocalizacao: () => void;
  onLimpar: () => void;
  onPinMoved: (lat: number, lng: number) => void;
  onChangeEndereco: (key: keyof EnderecoLoja, value: string) => void;
  clearError: (...keys: string[]) => void;
}

export function EnderecoSection({
  endereco,
  errors,
  locLoading,
  pinCoords,
  fieldPositions,
  onUsarLocalizacao,
  onLimpar,
  onPinMoved,
  onChangeEndereco,
  clearError,
}: EnderecoSectionProps) {
  return (
    <View style={styles.enderecoSection}>
      <View style={styles.enderecoTitleRow}>
        <Text style={styles.enderecoTitle}>ENDEREÇO DA LOJA</Text>
        <Text style={styles.enderecoOpcional}>obrigatório</Text>
      </View>

      <View style={styles.gpsBtnRow}>
        <TouchableOpacity
          style={styles.gpsBtn}
          onPress={onUsarLocalizacao}
          disabled={locLoading}
          activeOpacity={0.8}
        >
          {locLoading ? (
            <ActivityIndicator size="small" color={colors.orange} />
          ) : (
            <Ionicons name="location" size={15} color={colors.orange} />
          )}
          <Text style={styles.gpsBtnText}>
            {locLoading ? 'Obtendo localização...' : 'Usar minha localização'}
          </Text>
        </TouchableOpacity>

        {!!pinCoords && !locLoading && (
          <TouchableOpacity style={styles.clearBtn} onPress={onLimpar} activeOpacity={0.8}>
            <Ionicons name="close-circle-outline" size={15} color={colors.n600} />
            <Text style={styles.clearBtnText}>Limpar</Text>
          </TouchableOpacity>
        )}
      </View>

      {!!errors.localizacao && (
        <Text style={[styles.errorGeral, { textAlign: 'left', marginBottom: 8 }]}>
          {errors.localizacao}
        </Text>
      )}

      {pinCoords && (
        <View style={styles.mapContainer}>
          <LocationPickerMap
            lat={pinCoords.lat}
            lng={pinCoords.lng}
            onLocationChange={onPinMoved}
            style={{ flex: 1 }}
          />
        </View>
      )}

      <View style={{ flexDirection: 'row', gap: 8 }}>
        <View
          onLayout={(e) => {
            fieldPositions.current.cep = e.nativeEvent.layout.y;
          }}
          style={{ flex: 1 }}
        >
          <Field
            label="CEP"
            value={endereco.cep}
            onChange={(v) => {
              onChangeEndereco('cep', v.replace(/\D/g, '').slice(0, 8));
              clearError('cep');
            }}
            placeholder="49000000"
            keyboardType="numeric"
            autoComplete="off"
            textContentType="none"
            maxLength={8}
            error={errors.cep}
            isValid={!errors.cep && endereco.cep.length === 8}
          />
        </View>
        <View
          onLayout={(e) => {
            fieldPositions.current.bairro = e.nativeEvent.layout.y;
          }}
          style={{ flex: 2 }}
        >
          <Field
            label="BAIRRO"
            value={endereco.bairro}
            onChange={(v) => {
              onChangeEndereco('bairro', v);
              clearError('bairro');
            }}
            placeholder="Atalaia"
            error={errors.bairro}
            isValid={!errors.bairro && endereco.bairro.trim().length > 0}
          />
        </View>
      </View>

      <View style={{ flexDirection: 'row', gap: 8 }}>
        <View
          onLayout={(e) => {
            fieldPositions.current.rua = e.nativeEvent.layout.y;
          }}
          style={{ flex: 1 }}
        >
          <Field
            label="RUA / AV."
            value={endereco.rua}
            onChange={(v) => {
              onChangeEndereco('rua', v);
              clearError('rua');
            }}
            placeholder="Av. Beira Mar"
            error={errors.rua}
            isValid={!errors.rua && endereco.rua.trim().length > 0}
          />
        </View>
        <View style={{ width: 76, flexShrink: 0, overflow: 'hidden' }}>
          <Field
            label="Nº"
            value={endereco.numero}
            onChange={(v) => onChangeEndereco('numero', v.replace(/\D/g, '').slice(0, 7))}
            placeholder="100"
            keyboardType="numeric"
            maxLength={7}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  enderecoSection: {
    marginBottom: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.n100,
  },
  enderecoTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  enderecoTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.n600,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  enderecoOpcional: { fontSize: 11, color: colors.orange600, fontStyle: 'italic' },
  gpsBtnRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  gpsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 42,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: colors.orange,
    paddingHorizontal: 14,
  },
  gpsBtnText: { fontSize: 13, fontWeight: '600', color: colors.orange },
  clearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    height: 42,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: colors.n200,
    paddingHorizontal: 12,
  },
  clearBtnText: { fontSize: 13, fontWeight: '600', color: colors.n600 },
  mapContainer: { height: 200, borderRadius: 12, overflow: 'hidden', marginBottom: 10 },
  errorGeral: {
    fontSize: 13,
    color: '#E24B4A',
    textAlign: 'center',
    marginBottom: 10,
    fontWeight: '500',
  },
});
