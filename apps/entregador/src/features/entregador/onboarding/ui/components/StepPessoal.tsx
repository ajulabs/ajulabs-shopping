import { View, Text, TouchableOpacity, Image, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { formatCPF } from '../../../../../shared/lib/formatCPF';
import { LocationPickerMap } from '../../../../../shared/ui/LocationPickerMap';
import { StepProps } from '../../model/constants';
import { PhoneInput } from '../PhoneInput';
import { Input } from './Input';
import { Field } from './Field';

export function StepPessoal({
  data,
  up,
  erros,
  photoUri,
  onPickPhoto,
  onGps,
  locLoading,
  gpsCoords,
  onPinMoved,
  onClearGps,
  onBlurCpf,
  onBlurEmail,
}: StepProps & {
  erros: Record<string, string>;
  photoUri: string | null;
  onPickPhoto: () => void;
  onGps: () => void;
  locLoading: boolean;
  gpsCoords: { lat: number; lng: number } | null;
  onPinMoved: (lat: number, lng: number) => void;
  onClearGps: () => void;
  onBlurCpf?: () => void;
  onBlurEmail?: () => void;
}) {
  return (
    <View>
      <TouchableOpacity
        style={[s.photoBtn, !!erros.foto && s.photoBtnError]}
        activeOpacity={0.8}
        onPress={onPickPhoto}
      >
        {photoUri ? (
          <Image
            source={{ uri: photoUri }}
            style={{ width: '100%', height: '100%', borderRadius: 55 }}
          />
        ) : (
          <>
            <Ionicons name="camera" size={26} color={erros.foto ? '#E24B4A' : '#F2760F'} />
            <Text style={[s.photoBtnText, !!erros.foto && { color: '#E24B4A' }]}>
              Foto de perfil
            </Text>
          </>
        )}
      </TouchableOpacity>
      {erros.foto ? (
        <Text style={[s.fieldError, { textAlign: 'center', marginTop: 4 }]}>{erros.foto}</Text>
      ) : (
        <Text style={s.photoHint}>Sua foto aparece para o cliente durante a entrega</Text>
      )}

      <Field label="Nome completo" error={erros.nome}>
        <Input
          value={data.nome || ''}
          onChange={(v) => up('nome', v)}
          placeholder="Nome e Sobrenome"
          autoCapitalize="words"
          autoComplete="name"
          textContentType="name"
        />
      </Field>
      <Field label="CPF" error={erros.cpf}>
        <Input
          value={data.cpf || ''}
          onChange={(v) => up('cpf', formatCPF(v))}
          placeholder="000.000.000-00"
          keyboardType="numeric"
          autoComplete="off"
          textContentType="none"
          onBlur={onBlurCpf}
        />
      </Field>
      <Field label="Celular" error={erros.celular}>
        <PhoneInput
          value={data.celular || ''}
          onChange={(local, full) => {
            up('celular', local);
            up('celularCompleto', full);
          }}
          error={undefined}
        />
      </Field>
      <Field label="Email" error={erros.email}>
        <Input
          value={data.email || ''}
          onChange={(v) => up('email', v)}
          placeholder="seu@email.com"
          keyboardType="email-address"
          autoCorrect={false}
          autoComplete="email"
          textContentType="emailAddress"
          onBlur={onBlurEmail}
        />
      </Field>
      <Field label="Senha" error={erros.senha}>
        <Input
          value={data.senha || ''}
          onChange={(v) => up('senha', v)}
          placeholder="Mínimo 6 caracteres"
          secureTextEntry
          autoComplete="new-password"
          textContentType="newPassword"
        />
      </Field>
      <Field label="Confirmar senha" error={erros.confirmarSenha}>
        <Input
          value={data.confirmarSenha || ''}
          onChange={(v) => up('confirmarSenha', v)}
          placeholder="Repita a senha"
          secureTextEntry
          autoComplete="new-password"
          textContentType="newPassword"
        />
      </Field>

      <View style={s.gpsSection}>
        <View style={s.gpsTitleRow}>
          <Text style={s.gpsSectionTitle}>LOCALIZAÇÃO</Text>
          <Text style={s.gpsSectionOpcional}>opcional</Text>
        </View>

        <View style={s.gpsBtnRow}>
          <TouchableOpacity
            style={[s.gpsBtn, !!gpsCoords && s.gpsBtnDone]}
            onPress={onGps}
            disabled={locLoading}
            activeOpacity={0.8}
          >
            {locLoading ? (
              <ActivityIndicator size="small" color="#F2760F" />
            ) : (
              <Ionicons
                name={gpsCoords ? 'checkmark-circle' : 'location'}
                size={16}
                color={gpsCoords ? '#039855' : '#F2760F'}
              />
            )}
            <Text style={[s.gpsBtnText, !!gpsCoords && { color: '#039855' }]}>
              {locLoading
                ? 'Obtendo localização...'
                : gpsCoords
                  ? 'Localização capturada'
                  : 'Usar minha localização'}
            </Text>
          </TouchableOpacity>

          {!!gpsCoords && !locLoading && (
            <TouchableOpacity style={s.clearBtn} onPress={onClearGps} activeOpacity={0.8}>
              <Ionicons name="close-circle-outline" size={15} color="#9099B3" />
              <Text style={s.clearBtnText}>Limpar</Text>
            </TouchableOpacity>
          )}
        </View>

        {erros.localizacao ? <Text style={s.fieldError}>{erros.localizacao}</Text> : null}

        {!!gpsCoords && (
          <View style={s.mapBox}>
            <LocationPickerMap
              lat={gpsCoords.lat}
              lng={gpsCoords.lng}
              onLocationChange={onPinMoved}
              style={{ flex: 1 }}
            />
          </View>
        )}

        <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
          <View style={{ flex: 1 }}>
            <Field label="CEP" error={undefined}>
              <Input
                value={data.cep || ''}
                onChange={(v) => up('cep', v.replace(/\D/g, '').slice(0, 8))}
                placeholder="49000000"
                keyboardType="numeric"
                autoComplete="off"
                textContentType="none"
              />
            </Field>
          </View>
          <View style={{ flex: 2 }}>
            <Field label="BAIRRO" error={undefined}>
              <Input
                value={data.bairro || ''}
                onChange={(v) => up('bairro', v)}
                placeholder="Atalaia"
              />
            </Field>
          </View>
        </View>

        <View style={{ flexDirection: 'row', gap: 8 }}>
          <View style={{ flex: 1 }}>
            <Field label="RUA / AV." error={undefined}>
              <Input
                value={data.rua || ''}
                onChange={(v) => up('rua', v)}
                placeholder="Av. Beira Mar"
              />
            </Field>
          </View>
          <View style={{ width: 76 }}>
            <Field label="Nº" error={undefined}>
              <Input
                value={data.numero || ''}
                onChange={(v) => up('numero', v.replace(/\D/g, '').slice(0, 7))}
                placeholder="100"
                keyboardType="numeric"
              />
            </Field>
          </View>
        </View>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  fieldError: { fontSize: 11, color: '#E24B4A', marginTop: 4, fontWeight: '500' },
  photoBtn: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 2,
    borderColor: '#F2760F',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    backgroundColor: '#FEF0E3',
    marginBottom: 20,
    gap: 4,
  },
  photoBtnText: { fontSize: 11, color: '#F2760F', fontWeight: '600' },
  photoBtnError: { borderColor: '#E24B4A', backgroundColor: 'rgba(226,75,74,0.06)' },
  photoHint: {
    fontSize: 11,
    color: '#9099B3',
    textAlign: 'center',
    marginTop: -12,
    marginBottom: 16,
    fontStyle: 'italic',
  },
  gpsSection: { marginTop: 6, marginBottom: 4 },
  gpsTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  gpsSectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#9099B3',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  gpsSectionOpcional: { fontSize: 11, color: '#B0B8CC', fontStyle: 'italic' },
  gpsBtnRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  gpsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#F2760F',
    backgroundColor: '#FEF0E3',
  },
  gpsBtnDone: { borderColor: '#039855', backgroundColor: 'rgba(3,152,85,0.07)' },
  gpsBtnText: { fontSize: 13, fontWeight: '600', color: '#F2760F' },
  clearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#E4E7F1',
  },
  clearBtnText: { fontSize: 13, fontWeight: '600', color: '#9099B3' },
  mapBox: { height: 200, borderRadius: 12, overflow: 'hidden', marginBottom: 10 },
});
