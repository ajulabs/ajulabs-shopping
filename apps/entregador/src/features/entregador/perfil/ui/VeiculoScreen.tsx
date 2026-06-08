import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { EntregadorService } from '@ajulabs/api-client';
import { useAuthEntregadorStore } from '../../auth/model/store';

const TIPOS = [
  { id: 'moto' as const, label: 'Moto', icon: 'motorbike', lib: 'mci', needsDocs: true },
  { id: 'carro' as const, label: 'Carro', icon: 'car', lib: 'ion', needsDocs: true },
  { id: 'bike' as const, label: 'Bicicleta', icon: 'bicycle', lib: 'ion', needsDocs: false },
];

type Tipo = 'moto' | 'carro' | 'bike';

const TIPO_ICON: Record<Tipo, { icon: string; lib: string }> = {
  moto: { icon: 'motorbike', lib: 'mci' },
  carro: { icon: 'car', lib: 'ion' },
  bike: { icon: 'bicycle', lib: 'ion' },
};

function VehicleIcon({ tipo, size, color }: { tipo: Tipo; size: number; color: string }) {
  const { icon, lib } = TIPO_ICON[tipo] ?? TIPO_ICON.moto;
  if (lib === 'mci') return <MaterialCommunityIcons name={icon as any} size={size} color={color} />;
  return <Ionicons name={icon as any} size={size} color={color} />;
}

interface Props {
  onBack: () => void;
}

type Mode = 'view' | 'request';

export function VeiculoScreen({ onBack }: Props) {
  const token = useAuthEntregadorStore((s) => s.token);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [mode, setMode] = useState<Mode>('view');

  // Current data
  const [currentVehicle, setCurrentVehicle] = useState<any>(null);
  const [currentTipo, setCurrentTipo] = useState<Tipo>('moto');
  const [pendingRequest, setPendingRequest] = useState<any>(null);

  // Form state
  const [tipo, setTipo] = useState<Tipo>('moto');
  const [modelo, setModelo] = useState('');
  const [placa, setPlaca] = useState('');
  const [cor, setCor] = useState('');
  const [ano, setAno] = useState(String(new Date().getFullYear()));
  const [cnhUri, setCnhUri] = useState<string | null>(null);
  const [docUri, setDocUri] = useState<string | null>(null);

  const needsDocs = TIPOS.find((t) => t.id === tipo)?.needsDocs ?? false;

  const fetchData = useCallback(async () => {
    if (!token) {
      setLoading(false);
      return;
    }
    const [perfil, solicitacao] = await Promise.all([
      EntregadorService.buscarPerfil(token).catch(() => null),
      EntregadorService.buscarSolicitacaoTrocaVeiculo(token).catch(() => null),
    ]);
    setCurrentVehicle(perfil?.entregador?.veiculo ?? null);
    setCurrentTipo((perfil?.entregador?.tipoTransporte ?? 'moto') as Tipo);
    setPendingRequest(solicitacao);
  }, [token]);

  useEffect(() => {
    fetchData().finally(() => setLoading(false));
  }, [fetchData]);

  const openRequest = () => {
    setTipo(currentTipo);
    setModelo(currentVehicle?.modelo ?? '');
    setPlaca(currentVehicle?.placa === 'BICICLETA' ? '' : (currentVehicle?.placa ?? ''));
    setCor(currentVehicle?.cor ?? '');
    setAno(currentVehicle?.ano ? String(currentVehicle.ano) : String(new Date().getFullYear()));
    setCnhUri(null);
    setDocUri(null);
    setMode('request');
  };

  const pickImage = async (setter: (u: string) => void) => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permissão necessária', 'Permita o acesso à galeria para enviar a foto.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) setter(result.assets[0].uri);
  };

  const handleSubmit = async () => {
    if (tipo !== 'bike') {
      if (!modelo.trim()) {
        Alert.alert('Erro', 'Informe o modelo do veículo.');
        return;
      }
      if (!placa.trim()) {
        Alert.alert('Erro', 'Informe a placa do veículo.');
        return;
      }
      if (!cnhUri) {
        Alert.alert('Erro', 'Envie a foto da sua CNH.');
        return;
      }
      if (!docUri) {
        Alert.alert('Erro', 'Envie o documento do veículo.');
        return;
      }
    }
    if (!token) return;

    setSubmitting(true);
    try {
      const result = await EntregadorService.solicitarTrocaVeiculo(
        token,
        {
          tipoTransporte: tipo,
          modelo: tipo === 'bike' ? 'Bicicleta' : modelo.trim(),
          placa: tipo === 'bike' ? 'BICICLETA' : placa.trim().toUpperCase(),
          cor: cor.trim() || 'Não informado',
          ano: parseInt(ano) || new Date().getFullYear(),
        },
        tipo !== 'bike' ? { cnhUri: cnhUri!, docVeiculoUri: docUri! } : undefined,
      );

      if (result.status === 'aprovado') {
        Alert.alert('Veículo atualizado!', 'Seu veículo foi atualizado com sucesso.', [
          {
            text: 'OK',
            onPress: async () => {
              await fetchData();
              setMode('view');
            },
          },
        ]);
      } else {
        Alert.alert(
          'Solicitação enviada!',
          'Seus documentos estão em análise. Em até 24h seu veículo será atualizado.',
          [
            {
              text: 'OK',
              onPress: async () => {
                await fetchData();
                setMode('view');
              },
            },
          ],
        );
      }
    } catch (e: any) {
      Alert.alert('Erro', e?.message ?? 'Não foi possível enviar a solicitação.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={s.safe}>
        <Header onBack={onBack} title="Meu Veículo" />
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color="#F2760F" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.safe}>
      <Header
        onBack={mode === 'view' ? onBack : () => setMode('view')}
        title={mode === 'view' ? 'Meu Veículo' : 'Solicitar troca'}
      />

      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        {mode === 'view' ? (
          <>
            {/* Veículo atual */}
            <Text style={s.sectionLabel}>Veículo cadastrado</Text>
            {currentVehicle ? (
              <View style={s.vehicleCard}>
                <View style={s.vehicleIconWrap}>
                  <VehicleIcon tipo={currentTipo} size={28} color="#F2760F" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.vehicleModel}>{currentVehicle.modelo}</Text>
                  {currentVehicle.placa !== 'BICICLETA' && (
                    <Text style={s.vehiclePlate}>{currentVehicle.placa}</Text>
                  )}
                  <Text style={s.vehicleMeta}>
                    {currentVehicle.cor} · {currentVehicle.ano}
                  </Text>
                </View>
                <View style={s.activeBadge}>
                  <Text style={s.activeBadgeText}>Ativo</Text>
                </View>
              </View>
            ) : (
              <View
                style={[
                  s.vehicleCard,
                  { alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 24 },
                ]}
              >
                <VehicleIcon tipo={currentTipo} size={32} color="#9099B3" />
                <Text style={{ fontSize: 13, color: '#9099B3', textAlign: 'center' }}>
                  Nenhum veículo cadastrado
                </Text>
              </View>
            )}

            {/* Solicitação pendente */}
            {pendingRequest && (
              <>
                <Text style={[s.sectionLabel, { marginTop: 20 }]}>Solicitação em análise</Text>
                <View style={s.pendingCard}>
                  <View style={s.pendingHeader}>
                    <Ionicons name="time" size={18} color="#F2760F" />
                    <Text style={s.pendingTitle}>Aguardando aprovação</Text>
                  </View>
                  <View style={s.pendingRow}>
                    <VehicleIcon
                      tipo={pendingRequest.tipoTransporte as Tipo}
                      size={20}
                      color="#9099B3"
                    />
                    <Text style={s.pendingModel}>{pendingRequest.modelo}</Text>
                    {pendingRequest.placa !== 'BICICLETA' && (
                      <Text style={s.pendingPlate}>{pendingRequest.placa}</Text>
                    )}
                  </View>
                  <Text style={s.pendingInfo}>
                    Seus documentos estão em análise. Em até 24h o veículo será atualizado.
                  </Text>
                </View>
              </>
            )}

            {/* Botão solicitar troca */}
            <TouchableOpacity
              style={[s.requestBtn, !!pendingRequest && { opacity: 0.5 }]}
              onPress={openRequest}
              disabled={!!pendingRequest}
              activeOpacity={0.85}
            >
              <Ionicons name="swap-horizontal" size={18} color="#F2760F" />
              <Text style={s.requestBtnText}>
                {pendingRequest
                  ? 'Troca em análise'
                  : currentVehicle
                    ? 'Solicitar troca de veículo'
                    : 'Cadastrar veículo'}
              </Text>
            </TouchableOpacity>

            {pendingRequest && (
              <Text style={s.pendingNote}>
                Uma solicitação já está em análise. Aguarde a aprovação antes de enviar outra.
              </Text>
            )}
          </>
        ) : (
          <>
            {/* Tipo de transporte */}
            <Text style={s.sectionLabel}>Tipo de transporte</Text>
            <View style={s.tipoRow}>
              {TIPOS.map((t) => {
                const ativo = tipo === t.id;
                return (
                  <TouchableOpacity
                    key={t.id}
                    style={[s.tipoBtn, ativo && s.tipoBtnActive]}
                    onPress={() => {
                      setTipo(t.id);
                      setModelo('');
                      setPlaca('');
                      setCnhUri(null);
                      setDocUri(null);
                    }}
                    activeOpacity={0.8}
                  >
                    {t.lib === 'mci' ? (
                      <MaterialCommunityIcons
                        name={t.icon as any}
                        size={22}
                        color={ativo ? '#F2760F' : '#9099B3'}
                      />
                    ) : (
                      <Ionicons
                        name={t.icon as any}
                        size={22}
                        color={ativo ? '#F2760F' : '#9099B3'}
                      />
                    )}
                    <Text style={[s.tipoBtnText, ativo && s.tipoBtnTextActive]}>{t.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Dados do veículo */}
            {tipo !== 'bike' ? (
              <>
                <Text style={s.sectionLabel}>Dados do veículo</Text>
                <View style={s.card}>
                  <FieldRow
                    label="Modelo"
                    value={modelo}
                    onChange={setModelo}
                    placeholder="Ex: Honda CG 160"
                  />
                  <View style={s.divider} />
                  <FieldRow
                    label="Placa"
                    value={placa}
                    onChange={(v) => setPlaca(v.toUpperCase())}
                    placeholder="ABC-1234"
                  />
                  <View style={s.divider} />
                  <FieldRow label="Cor" value={cor} onChange={setCor} placeholder="Ex: Vermelho" />
                  <View style={s.divider} />
                  <FieldRow
                    label="Ano"
                    value={ano}
                    onChange={setAno}
                    placeholder={String(new Date().getFullYear())}
                    keyboard="numeric"
                  />
                </View>
              </>
            ) : (
              <>
                <Text style={s.sectionLabel}>Dados da bicicleta</Text>
                <View style={s.card}>
                  <FieldRow label="Cor" value={cor} onChange={setCor} placeholder="Ex: Azul" />
                  <View style={s.divider} />
                  <FieldRow
                    label="Ano"
                    value={ano}
                    onChange={setAno}
                    placeholder={String(new Date().getFullYear())}
                    keyboard="numeric"
                  />
                </View>
              </>
            )}

            {/* Documentos (apenas moto/carro) */}
            {needsDocs && (
              <>
                <Text style={s.sectionLabel}>Documentos obrigatórios</Text>
                <View style={s.docsHint}>
                  <Ionicons name="information-circle" size={16} color="#209CEF" />
                  <Text style={s.docsHintText}>
                    Para moto/carro é necessário enviar CNH e documento do veículo para análise.
                  </Text>
                </View>

                <DocUploadButton
                  label="CNH (frente)"
                  uri={cnhUri}
                  onPick={() => pickImage(setCnhUri)}
                />
                <DocUploadButton
                  label="Documento do veículo"
                  uri={docUri}
                  onPick={() => pickImage(setDocUri)}
                />
              </>
            )}

            <TouchableOpacity
              style={[s.submitBtn, submitting && { opacity: 0.7 }]}
              onPress={handleSubmit}
              disabled={submitting}
              activeOpacity={0.85}
            >
              {submitting ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={s.submitBtnText}>
                  {needsDocs ? 'Enviar para análise' : 'Salvar veículo'}
                </Text>
              )}
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function Header({ onBack, title }: { onBack: () => void; title: string }) {
  return (
    <View style={s.header}>
      <TouchableOpacity style={s.backBtn} onPress={onBack} activeOpacity={0.8}>
        <Ionicons name="chevron-back" size={20} color="#000933" />
      </TouchableOpacity>
      <Text style={s.headerTitle}>{title}</Text>
    </View>
  );
}

function DocUploadButton({
  label,
  uri,
  onPick,
}: {
  label: string;
  uri: string | null;
  onPick: () => void;
}) {
  return (
    <TouchableOpacity style={s.docBtn} onPress={onPick} activeOpacity={0.85}>
      {uri ? (
        <Image source={{ uri }} style={s.docThumb} resizeMode="cover" />
      ) : (
        <View style={s.docPlaceholder}>
          <Ionicons name="cloud-upload-outline" size={24} color="#F2760F" />
        </View>
      )}
      <View style={{ flex: 1, marginLeft: 12 }}>
        <Text style={s.docLabel}>{label}</Text>
        <Text style={[s.docStatus, uri ? { color: '#039855' } : { color: '#9099B3' }]}>
          {uri ? 'Foto selecionada' : 'Toque para selecionar'}
        </Text>
      </View>
      <Ionicons
        name={uri ? 'checkmark-circle' : 'chevron-forward'}
        size={18}
        color={uri ? '#039855' : '#9099B3'}
      />
    </TouchableOpacity>
  );
}

function FieldRow({
  label,
  value,
  onChange,
  placeholder,
  keyboard = 'default',
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  keyboard?: any;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 14,
        paddingVertical: 12,
      }}
    >
      <Text style={sr.label}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor="#9099B3"
        keyboardType={keyboard}
        style={[sr.input, focused && sr.inputFocused]}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />
    </View>
  );
}

const sr = StyleSheet.create({
  label: { width: 70, fontSize: 13, fontWeight: '600', color: '#9099B3' },
  input: {
    flex: 1,
    fontSize: 14,
    color: '#000933',
    textAlign: 'right',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  inputFocused: { backgroundColor: 'rgba(242,118,15,0.06)' },
});

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F6F7FB' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E4E7F1',
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F6F7FB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#000933' },
  content: { padding: 16, paddingBottom: 48 },

  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#9099B3',
    textTransform: 'uppercase',
    letterSpacing: 0.7,
    marginBottom: 10,
    marginTop: 6,
  },

  vehicleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E4E7F1',
    padding: 16,
  },
  vehicleIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: 'rgba(242,118,15,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  vehicleModel: { fontSize: 16, fontWeight: '700', color: '#000933' },
  vehiclePlate: { fontSize: 13, color: '#F2760F', fontWeight: '600', marginTop: 2 },
  vehicleMeta: { fontSize: 12, color: '#9099B3', marginTop: 2 },
  activeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 99,
    backgroundColor: 'rgba(3,152,85,0.1)',
  },
  activeBadgeText: { fontSize: 11, fontWeight: '700', color: '#039855' },

  pendingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(242,118,15,0.3)',
    padding: 16,
    marginTop: 6,
  },
  pendingHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  pendingTitle: { fontSize: 14, fontWeight: '700', color: '#F2760F' },
  pendingRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  pendingModel: { fontSize: 14, fontWeight: '600', color: '#000933', flex: 1 },
  pendingPlate: { fontSize: 13, color: '#9099B3', fontWeight: '500' },
  pendingInfo: { fontSize: 12, color: '#9099B3', lineHeight: 18 },
  pendingNote: { fontSize: 11, color: '#9099B3', textAlign: 'center', marginTop: 10 },

  requestBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 16,
    padding: 15,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(242,118,15,0.4)',
    backgroundColor: 'rgba(242,118,15,0.06)',
  },
  requestBtnText: { fontSize: 14, fontWeight: '700', color: '#F2760F' },

  tipoRow: { flexDirection: 'row', gap: 10 },
  tipoBtn: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#E4E7F1',
    backgroundColor: '#FFFFFF',
  },
  tipoBtnActive: { borderColor: '#F2760F', backgroundColor: 'rgba(242,118,15,0.06)' },
  tipoBtnText: { fontSize: 12, fontWeight: '600', color: '#9099B3' },
  tipoBtnTextActive: { color: '#F2760F' },

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E4E7F1',
    overflow: 'hidden',
    marginTop: 6,
  },
  divider: { height: 1, backgroundColor: '#E4E7F1', marginHorizontal: 14 },

  docsHint: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    padding: 12,
    backgroundColor: 'rgba(32,156,239,0.08)',
    borderRadius: 12,
    marginTop: 6,
    marginBottom: 10,
  },
  docsHintText: { flex: 1, fontSize: 12, color: '#209CEF', lineHeight: 18 },

  docBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E4E7F1',
    padding: 14,
    marginBottom: 8,
  },
  docThumb: { width: 48, height: 48, borderRadius: 10 },
  docPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 10,
    backgroundColor: 'rgba(242,118,15,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  docLabel: { fontSize: 14, fontWeight: '600', color: '#000933' },
  docStatus: { fontSize: 12, marginTop: 2 },

  submitBtn: {
    backgroundColor: '#F2760F',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 24,
  },
  submitBtnText: { fontSize: 15, fontWeight: '700', color: '#FFFFFF' },
});
