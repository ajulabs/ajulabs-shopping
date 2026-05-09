import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Image,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { EntregadorService } from '@ajulabs/api-client';
import { useAuthEntregadorStore } from '../../auth/model/store';

const brl = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export const STAGES = ['to-store', 'at-store', 'to-customer', 'delivered'] as const;
export type Stage = typeof STAGES[number];

const STAGE_LABEL: Record<Stage, string> = {
  'to-store': 'A caminho da loja',
  'at-store': 'Coletando pedido',
  'to-customer': 'A caminho do cliente',
  delivered: 'Confirmando entrega',
};

interface ActiveRide {
  id: string;
  loja: { nome: string; endereco: string; bairro: string };
  cliente: { nome: string; endereco: string; bairro: string; complemento?: string };
  ganho: number;
  distancia: number;
  duracao: number;
  codigo: string;
}

interface ActiveScreenProps {
  ride: ActiveRide;
  initialStage?: Stage;
  onFinish: () => void;
  onBack?: (currentStage: Stage) => void;
}

function StageCard({
  icon,
  iconColor,
  primary,
  secondary,
  eta,
  distance,
  cta,
  onCta,
}: {
  icon: string;
  iconColor: string;
  primary: string;
  secondary: string;
  eta: string;
  distance: string;
  cta: string;
  onCta: () => void;
}) {
  return (
    <View>
      <View style={s.stageRow}>
        <View style={[s.stageIcon, { backgroundColor: iconColor }]}>
          <Ionicons name={icon as any} size={22} color="#FFFFFF" />
        </View>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={s.stagePrimary}>{primary}</Text>
          <Text style={s.stageSec}>{secondary}</Text>
        </View>
      </View>
      <View style={s.statsRow}>
        <View style={s.statBox}>
          <Text style={s.statLabel}>ETA</Text>
          <Text style={[s.statVal, { color: '#F2760F' }]}>{eta}</Text>
        </View>
        <View style={s.statBox}>
          <Text style={s.statLabel}>Distância</Text>
          <Text style={[s.statVal, { color: '#000933' }]}>{distance}</Text>
        </View>
        <TouchableOpacity style={s.navBtn} activeOpacity={0.8}>
          <Ionicons name="navigate" size={14} color="#000933" />
          <Text style={s.navBtnText}>Navegar</Text>
        </TouchableOpacity>
      </View>
      <TouchableOpacity style={s.ctaBtn} onPress={onCta} activeOpacity={0.85}>
        <Text style={s.ctaBtnText}>{cta}</Text>
        <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );
}

export function ActiveScreen({ ride, initialStage, onFinish, onBack }: ActiveScreenProps) {
  const token = useAuthEntregadorStore(s => s.token);
  const [stage, setStage] = useState<Stage>(initialStage ?? 'to-store');
  const idx = STAGES.indexOf(stage);

  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [loadingRetirada, setLoadingRetirada] = useState(false);
  const [codigoEntrega, setCodigoEntrega] = useState('');
  const [loadingEntrega, setLoadingEntrega] = useState(false);

  const advanceStage = useCallback(() => {
    const next = STAGES[idx + 1];
    if (next) setStage(next);
  }, [idx]);

  const handleTakePhoto = useCallback(async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permissão necessária', 'Permita o acesso à câmera para tirar a foto do produto.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      quality: 0.7,
      allowsEditing: false,
    });
    if (!result.canceled && result.assets[0]) {
      setPhotoUri(result.assets[0].uri);
    }
  }, []);

  const handleConfirmarRetirada = useCallback(async () => {
    if (!token) return;
    setLoadingRetirada(true);
    try {
      await EntregadorService.confirmarRetirada(token, ride.id);
      setStage('to-customer');
    } catch (err) {
      console.error('[ActiveScreen] confirmarRetirada error:', err);
      Alert.alert('Erro', 'Não foi possível confirmar a retirada. Tente novamente.');
    } finally {
      setLoadingRetirada(false);
    }
  }, [token, ride.id]);

  const handleConfirmarEntrega = useCallback(async () => {
    if (!token || codigoEntrega.length < 4) return;
    setLoadingEntrega(true);
    try {
      await EntregadorService.confirmarEntrega(token, ride.id, codigoEntrega);
      onFinish();
    } catch (err: any) {
      console.error('[ActiveScreen] confirmarEntrega error:', err);
      const msg = err?.message?.includes('incorreto')
        ? 'Código incorreto. Peça ao cliente para verificar.'
        : 'Erro ao confirmar. Tente novamente.';
      Alert.alert('Erro', msg);
    } finally {
      setLoadingEntrega(false);
    }
  }, [token, ride.id, codigoEntrega, onFinish]);

  return (
    <SafeAreaView style={s.safeArea}>
      <View style={s.mapBg}>
        <View style={{ opacity: 0.3 }}>
          <Ionicons name="map" size={80} color="#FFFFFF" />
        </View>
      </View>

      {onBack && (
        <TouchableOpacity style={s.backBtn} onPress={() => onBack(stage)} activeOpacity={0.8}>
          <Ionicons name="chevron-back" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      )}

      <View style={s.progressCard}>
        <View style={s.progressBars}>
          {STAGES.map((_, i) => (
            <View
              key={i}
              style={[
                s.progressBar,
                { backgroundColor: i <= idx ? '#F2760F' : '#E4E7F1' },
              ]}
            />
          ))}
        </View>
        <View style={s.progressInfo}>
          <View>
            <Text style={s.progressStep}>Passo {idx + 1}/4</Text>
            <Text style={s.progressLabel}>{STAGE_LABEL[stage]}</Text>
          </View>
          <Text style={s.progressGanho}>{brl(ride.ganho)}</Text>
        </View>
      </View>

      {stage !== 'delivered' && (
        <View style={s.fabs}>
          <TouchableOpacity style={[s.fab, { backgroundColor: '#39FF89' }]} activeOpacity={0.8}>
            <Ionicons name="call" size={20} color="#002B12" />
          </TouchableOpacity>
          <TouchableOpacity style={[s.fab, { backgroundColor: '#FFFFFF' }]} activeOpacity={0.8}>
            <Ionicons name="chatbubble" size={20} color="#000933" />
          </TouchableOpacity>
          <TouchableOpacity style={[s.fab, { backgroundColor: '#209CEF' }]} activeOpacity={0.8}>
            <Ionicons name="navigate" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      )}

      <View style={s.bottomSheet}>
        {stage === 'to-store' && (
          <StageCard
            icon="storefront"
            iconColor="#000933"
            primary={ride.loja.nome}
            secondary={`${ride.loja.endereco} · ${ride.loja.bairro}`}
            eta={ride.duracao > 0 ? `${Math.round(ride.duracao * 0.4)} min` : '–'}
            distance={ride.distancia > 0 ? `${(ride.distancia * 0.4).toFixed(1)} km` : '–'}
            cta="Cheguei na loja"
            onCta={advanceStage}
          />
        )}

        {stage === 'at-store' && (
          <View>
            <Text style={s.codeLabel}>Foto do produto</Text>

            {!photoUri ? (
              <TouchableOpacity style={s.photoBtn} onPress={handleTakePhoto} activeOpacity={0.8}>
                <Ionicons name="camera" size={28} color="#F2760F" />
                <Text style={s.photoBtnText}>Tirar foto do produto</Text>
                <Text style={s.photoBtnSub}>Obrigatório para confirmar a retirada</Text>
              </TouchableOpacity>
            ) : (
              <View style={s.photoPreview}>
                <Image source={{ uri: photoUri }} style={s.photoImage} resizeMode="cover" />
                <TouchableOpacity style={s.photoRetake} onPress={handleTakePhoto} activeOpacity={0.8}>
                  <Ionicons name="refresh" size={14} color="#fff" />
                  <Text style={s.photoRetakeTxt}>Tirar outra</Text>
                </TouchableOpacity>
              </View>
            )}

            <View style={s.codeHint}>
              <Text style={s.codeHintText}>
                Tire uma foto do pedido antes de sair de{' '}
                <Text style={{ fontWeight: '700' }}>{ride.loja.nome}</Text>.
              </Text>
            </View>

            <TouchableOpacity
              style={[s.ctaBtn, (!photoUri || loadingRetirada) && { opacity: 0.5 }]}
              onPress={photoUri ? handleConfirmarRetirada : undefined}
              disabled={!photoUri || loadingRetirada}
              activeOpacity={0.85}
            >
              {loadingRetirada ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Text style={s.ctaBtnText}>Confirmar retirada</Text>
                  <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
                </>
              )}
            </TouchableOpacity>
          </View>
        )}

        {stage === 'to-customer' && (
          <StageCard
            icon="home"
            iconColor="#209CEF"
            primary={`${ride.cliente.nome} · ${ride.cliente.bairro}`}
            secondary={`${ride.cliente.endereco}${ride.cliente.complemento ? ` · ${ride.cliente.complemento}` : ''}`}
            eta={ride.duracao > 0 ? `${Math.round(ride.duracao * 0.6)} min` : '–'}
            distance={ride.distancia > 0 ? `${(ride.distancia * 0.6).toFixed(1)} km` : '–'}
            cta="Cheguei no destino"
            onCta={advanceStage}
          />
        )}

        {stage === 'delivered' && (
          <View>
            <Text style={s.codeLabel}>Código de entrega</Text>
            <View style={[s.codeHint, { flexDirection: 'row', gap: 8, alignItems: 'flex-start' }]}>
              <Ionicons name="information-circle-outline" size={16} color="#F2760F" style={{ marginTop: 1 }} />
              <Text style={[s.codeHintText, { flex: 1 }]}>
                Peça ao cliente os 4 últimos dígitos do telefone cadastrado e digite abaixo.
              </Text>
            </View>
            <TextInput
              style={s.codeInput}
              placeholder="0000"
              placeholderTextColor="#9099B3"
              keyboardType="numeric"
              maxLength={4}
              value={codigoEntrega}
              onChangeText={setCodigoEntrega}
            />
            <TouchableOpacity
              style={[s.ctaBtn, { marginTop: 12 }, (codigoEntrega.length < 4 || loadingEntrega) && { opacity: 0.5 }]}
              onPress={codigoEntrega.length === 4 ? handleConfirmarEntrega : undefined}
              disabled={codigoEntrega.length < 4 || loadingEntrega}
              activeOpacity={0.85}
            >
              {loadingEntrega ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                  <Text style={s.ctaBtnText}>Confirmar entrega · {brl(ride.ganho)}</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#0B0F22' },
  backBtn: { position: 'absolute', top: 60, left: 14, width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center', zIndex: 10 },
  mapBg: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0B0F22',
  },
  progressCard: {
    position: 'absolute',
    top: 60,
    left: 14,
    right: 14,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 18,
    elevation: 8,
  },
  progressBars: { flexDirection: 'row', gap: 6, marginBottom: 8 },
  progressBar: { flex: 1, height: 5, borderRadius: 99 },
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressStep: { fontSize: 10, color: '#9099B3', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.4 },
  progressLabel: { fontSize: 15, fontWeight: '700', color: '#000933' },
  progressGanho: { fontSize: 14, fontWeight: '700', color: '#F2760F' },
  fabs: {
    position: 'absolute',
    top: 160,
    right: 14,
    gap: 8,
  },
  fab: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 18,
    elevation: 6,
  },
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    padding: 18,
    paddingBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -12 },
    shadowOpacity: 0.25,
    shadowRadius: 30,
    elevation: 14,
  },
  stageRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  stageIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stagePrimary: { fontSize: 15, fontWeight: '600', color: '#000933', lineHeight: 20 },
  stageSec: { fontSize: 12, color: '#9099B3', marginTop: 2 },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  statBox: {
    flex: 1,
    padding: 10,
    backgroundColor: '#F6F7FB',
    borderRadius: 10,
    alignItems: 'center',
  },
  statLabel: { fontSize: 10, color: '#9099B3', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.4 },
  statVal: { fontSize: 15, fontWeight: '700', marginTop: 2 },
  navBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#E4E7F1',
  },
  navBtnText: { fontSize: 11.5, fontWeight: '600', color: '#000933' },
  ctaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#F2760F',
    borderRadius: 12,
    paddingVertical: 16,
  },
  ctaBtnText: { fontSize: 14, fontWeight: '700', color: '#FFFFFF' },
  codeLabel: { fontSize: 11, color: '#9099B3', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 },
  codeHint: {
    padding: 12,
    backgroundColor: '#F6F7FB',
    borderRadius: 10,
    marginBottom: 14,
  },
  codeHintText: { fontSize: 12.5, color: '#000933', lineHeight: 18 },
  photoBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 24,
    borderRadius: 14,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#F2760F',
    backgroundColor: '#FEF0E3',
    marginBottom: 12,
  },
  photoBtnText: { fontSize: 14, fontWeight: '700', color: '#F2760F' },
  photoBtnSub: { fontSize: 11, color: '#9099B3' },
  photoPreview: {
    height: 160,
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 12,
    position: 'relative',
  },
  photoImage: { width: '100%', height: '100%' },
  photoRetake: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 99,
  },
  photoRetakeTxt: { fontSize: 11, color: '#fff', fontWeight: '600' },
  codeInput: {
    fontSize: 32,
    fontWeight: '800',
    color: '#000933',
    textAlign: 'center',
    letterSpacing: 12,
    backgroundColor: '#F6F7FB',
    borderRadius: 14,
    paddingVertical: 16,
    borderWidth: 2,
    borderColor: '#E4E7F1',
  },
});
