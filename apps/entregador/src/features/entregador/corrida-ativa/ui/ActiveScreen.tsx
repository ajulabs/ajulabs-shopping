import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Modal,
  TextInput,
  Alert,
  Image,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { EntregadorService } from '@ajulabs/api-client';
import { useAuthEntregadorStore } from '../../auth/model/store';

const brl = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const STAGES = ['to-store', 'at-store', 'to-customer', 'delivered'] as const;
type Stage = typeof STAGES[number];

const STAGE_LABEL: Record<Stage, string> = {
  'to-store': 'A caminho da loja',
  'at-store': 'Coletando pedido',
  'to-customer': 'A caminho do cliente',
  delivered: 'Entregando',
};

interface ActiveRide {
  id: string;
  loja: { nome: string; endereco: string; bairro: string; telefone?: string };
  cliente: { nome: string; endereco: string; bairro: string; complemento?: string; telefone?: string };
  ganho: number;
  distancia: number;
  duracao: number;
  codigo: string;
}

interface ActiveScreenProps {
  ride: ActiveRide;
  onFinish: () => void;
}

function openMaps(address: string) {
  const query = encodeURIComponent(address);
  Linking.openURL(`https://maps.google.com/?q=${query}`).catch(() =>
    Linking.openURL(`geo:0,0?q=${query}`)
  );
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
  mapsAddress,
}: {
  icon: string;
  iconColor: string;
  primary: string;
  secondary: string;
  eta: string;
  distance: string;
  cta: string;
  onCta: () => void;
  mapsAddress: string;
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
        <TouchableOpacity style={s.navBtn} onPress={() => openMaps(mapsAddress)} activeOpacity={0.8}>
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

function CodigoModal({
  visible,
  onClose,
  onConfirm,
}: {
  visible: boolean;
  onClose: () => void;
  onConfirm: (code: string) => void;
}) {
  const [code, setCode] = useState('');
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={s.modalOverlay}>
        <View style={s.modalBox}>
          <Text style={s.modalTitle}>Código de confirmação</Text>
          <Text style={s.modalSub}>Peça ao cliente para informar o código de 4 dígitos que ele recebeu.</Text>
          <TextInput
            style={s.modalInput}
            value={code}
            onChangeText={v => setCode(v.replace(/\D/g, '').slice(0, 4))}
            keyboardType="numeric"
            placeholder="0000"
            maxLength={4}
            textAlign="center"
          />
          <View style={s.modalBtns}>
            <TouchableOpacity style={s.modalBtnCancel} onPress={() => { setCode(''); onClose(); }} activeOpacity={0.8}>
              <Text style={s.modalBtnCancelText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.modalBtnOk, code.length !== 4 && { opacity: 0.5 }]}
              disabled={code.length !== 4}
              onPress={() => { onConfirm(code); setCode(''); }}
              activeOpacity={0.85}
            >
              <Text style={s.modalBtnOkText}>Confirmar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

export function ActiveScreen({ ride, onFinish }: ActiveScreenProps) {
  const token  = useAuthEntregadorStore(s => s.token);
  const insets = useSafeAreaInsets();
  const [stage, setStage] = useState<Stage>('to-store');
  const idx = STAGES.indexOf(stage);
  const [showCodigoModal, setShowCodigoModal] = useState(false);
  const [fotoUri, setFotoUri] = useState<string | null>(null);

  const advance = useCallback(async () => {
    const next = STAGES[idx + 1];
    if (!next) { onFinish(); return; }

    if (next === 'to-customer' && token) {
      await EntregadorService.atualizarStatusCorrida(token, ride.id, 'saiu_entrega').catch(() => {});
    } else if (next === 'delivered' && token) {
      await EntregadorService.atualizarStatusCorrida(token, ride.id, 'entregue').catch(() => {});
    }

    setStage(next);
  }, [idx, token, ride.id, onFinish]);

  const handleChamar = useCallback((telefone?: string) => {
    if (!telefone) {
      Alert.alert('Telefone não disponível', 'O número de telefone não está disponível nesta corrida.');
      return;
    }
    Linking.openURL(`tel:${telefone}`).catch(() =>
      Alert.alert('Erro', 'Não foi possível abrir o discador.')
    );
  }, []);

  const handleChat = useCallback(() => {
    Alert.alert(
      'Chat',
      'O chat em tempo real estará disponível em breve. Para entrar em contato, use o telefone.',
      [{ text: 'OK' }]
    );
  }, []);

  const handleNavegar = useCallback(() => {
    const currentStage = stage;
    if (currentStage === 'to-store' || currentStage === 'at-store') {
      openMaps(`${ride.loja.endereco}, ${ride.loja.bairro}`);
    } else {
      openMaps(`${ride.cliente.endereco}, ${ride.cliente.bairro}`);
    }
  }, [stage, ride]);

  const handleFoto = useCallback(async () => {
    try {
      const ImagePicker = await import('expo-image-picker');
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permissão necessária', 'Precisamos de acesso à câmera para tirar a foto.');
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: false,
        quality: 0.7,
      });
      if (!result.canceled && result.assets?.[0]) {
        setFotoUri(result.assets[0].uri);
        Alert.alert('Foto registrada!', 'A foto da entrega foi salva.');
      }
    } catch {
      Alert.alert('Erro', 'Não foi possível acessar a câmera.');
    }
  }, []);

  const handleConfirmarCodigo = useCallback((code: string) => {
    setShowCodigoModal(false);
    Alert.alert('Código confirmado!', `Entrega verificada com o código ${code}.`, [
      { text: 'Finalizar', onPress: onFinish },
    ]);
  }, [onFinish]);

  const lojaAddress    = `${ride.loja.endereco}, ${ride.loja.bairro}`;
  const clienteAddress = `${ride.cliente.endereco}, ${ride.cliente.bairro}`;

  return (
    <SafeAreaView style={s.safeArea}>
      <View style={s.mapBg}>
        <View style={{ opacity: 0.3 }}>
          <Ionicons name="map" size={80} color="#FFFFFF" />
        </View>
      </View>

      <View style={[s.progressCard, { top: Math.max(insets.top + 8, 60) }]}>
        <View style={s.progressBars}>
          {STAGES.map((_, i) => (
            <View
              key={i}
              style={[s.progressBar, { backgroundColor: i <= idx ? '#F2760F' : '#E4E7F1' }]}
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
        <View style={[s.fabs, { top: Math.max(insets.top + 108, 160) }]}>
          <TouchableOpacity
            style={[s.fab, { backgroundColor: '#39FF89' }]}
            onPress={() => handleChamar(
              stage === 'to-store' || stage === 'at-store'
                ? ride.loja.telefone
                : ride.cliente.telefone
            )}
            activeOpacity={0.8}
          >
            <Ionicons name="call" size={20} color="#002B12" />
          </TouchableOpacity>
          <TouchableOpacity
            style={[s.fab, { backgroundColor: '#FFFFFF' }]}
            onPress={handleChat}
            activeOpacity={0.8}
          >
            <Ionicons name="chatbubble" size={20} color="#000933" />
          </TouchableOpacity>
          <TouchableOpacity
            style={[s.fab, { backgroundColor: '#209CEF' }]}
            onPress={handleNavegar}
            activeOpacity={0.8}
          >
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
            onCta={advance}
            mapsAddress={lojaAddress}
          />
        )}

        {stage === 'at-store' && (
          <View>
            <Text style={s.codeLabel}>Código de retirada</Text>
            <View style={s.codeRow}>
              {ride.codigo.split('').map((d, i) => (
                <View key={i} style={s.codeDigit}>
                  <Text style={s.codeDigitText}>{d}</Text>
                </View>
              ))}
            </View>
            <View style={s.codeHint}>
              <Text style={s.codeHintText}>
                Mostre esse código ao lojista <Text style={{ fontWeight: '700' }}>{ride.loja.nome}</Text> pra confirmar a retirada.
              </Text>
            </View>
            <TouchableOpacity style={s.ctaBtn} onPress={advance} activeOpacity={0.85}>
              <Text style={s.ctaBtnText}>Confirmar coleta</Text>
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
            onCta={advance}
            mapsAddress={clienteAddress}
          />
        )}

        {stage === 'delivered' && (
          <View style={{ alignItems: 'center' }}>
            <View style={s.successCircle}>
              <Ionicons name="checkmark" size={32} color="#002B12" />
            </View>
            <Text style={s.successTitle}>Entrega confirmada!</Text>
            <Text style={s.successSub}>
              Tire uma foto do pacote entregue ou peça o código de confirmação.
            </Text>
            <View style={s.deliverOptions}>
              <TouchableOpacity style={s.deliverBtn} onPress={handleFoto} activeOpacity={0.8}>
                {fotoUri
                  ? <Image source={{ uri: fotoUri }} style={{ width: 28, height: 28, borderRadius: 6 }} />
                  : <Ionicons name="camera" size={22} color="#F2760F" />}
                <Text style={s.deliverBtnText}>{fotoUri ? 'Foto salva ✓' : 'Foto do pacote'}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.deliverBtn, { backgroundColor: 'rgba(32,156,239,0.12)' }]}
                onPress={() => setShowCodigoModal(true)}
                activeOpacity={0.8}
              >
                <Ionicons name="document-text" size={22} color="#209CEF" />
                <Text style={[s.deliverBtnText, { color: '#209CEF' }]}>Código do cliente</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={[s.ctaBtn, { marginTop: 12, width: '100%' }]}
              onPress={onFinish}
              activeOpacity={0.85}
            >
              <Ionicons name="checkmark" size={16} color="#FFFFFF" />
              <Text style={s.ctaBtnText}>Finalizar entrega · {brl(ride.ganho)}</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <CodigoModal
        visible={showCodigoModal}
        onClose={() => setShowCodigoModal(false)}
        onConfirm={handleConfirmarCodigo}
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#0B0F22' },
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
    paddingBottom: 32,
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
  codeRow: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  codeDigit: {
    flex: 1,
    aspectRatio: 0.9,
    backgroundColor: '#F2760F',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#F2760F',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 4,
  },
  codeDigitText: { fontSize: 32, fontWeight: '800', color: '#FFFFFF' },
  codeHint: {
    padding: 12,
    backgroundColor: '#F6F7FB',
    borderRadius: 10,
    marginBottom: 14,
  },
  codeHintText: { fontSize: 12.5, color: '#000933', lineHeight: 18 },
  successCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#39FF89',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  successTitle: { fontSize: 20, fontWeight: '700', color: '#000933', marginBottom: 6 },
  successSub: { fontSize: 13, color: '#9099B3', textAlign: 'center', marginBottom: 16 },
  deliverOptions: { flexDirection: 'row', gap: 10, width: '100%' },
  deliverBtn: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    backgroundColor: '#FEF0E3',
    alignItems: 'center',
    gap: 6,
  },
  deliverBtnText: { fontSize: 12, fontWeight: '600', color: '#F2760F' },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,9,51,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  modalBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 24,
    width: '100%',
    maxWidth: 340,
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#000933', marginBottom: 6 },
  modalSub: { fontSize: 13, color: '#9099B3', lineHeight: 19, marginBottom: 18 },
  modalInput: {
    height: 60,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E4E7F1',
    fontSize: 32,
    fontWeight: '800',
    color: '#000933',
    letterSpacing: 10,
    marginBottom: 18,
  },
  modalBtns: { flexDirection: 'row', gap: 10 },
  modalBtnCancel: {
    flex: 1,
    height: 46,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E4E7F1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBtnCancelText: { fontSize: 14, fontWeight: '600', color: '#9099B3' },
  modalBtnOk: {
    flex: 1,
    height: 46,
    borderRadius: 12,
    backgroundColor: '#F2760F',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBtnOkText: { fontSize: 14, fontWeight: '700', color: '#FFFFFF' },
});
