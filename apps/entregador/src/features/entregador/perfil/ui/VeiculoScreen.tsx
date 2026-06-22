import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TIPOS, Tipo, useVeiculo } from '../model/useVeiculo';
import { VehicleIcon } from './components/VehicleIcon';
import { Header } from './components/VeiculoHeader';
import { DocUploadButton } from './components/DocUploadButton';
import { FieldRow } from './components/FieldRow';

interface Props {
  onBack: () => void;
}

export function VeiculoScreen({ onBack }: Props) {
  const {
    loading,
    submitting,
    mode,
    setMode,
    currentVehicle,
    currentTipo,
    pendingRequest,
    tipo,
    setTipo,
    modelo,
    setModelo,
    placa,
    setPlaca,
    cor,
    setCor,
    ano,
    setAno,
    cnhUri,
    setCnhUri,
    docUri,
    setDocUri,
    needsDocs,
    openRequest,
    pickImage,
    handleSubmit,
  } = useVeiculo(onBack);

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

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F6F7FB' },
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

  submitBtn: {
    backgroundColor: '#F2760F',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 24,
  },
  submitBtnText: { fontSize: 15, fontWeight: '700', color: '#FFFFFF' },
});
