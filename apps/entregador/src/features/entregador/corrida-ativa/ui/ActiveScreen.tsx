import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  TextInput,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DeliveryTrackingMap } from '@ajulabs/maps';
import { STAGES, STAGE_LABEL, type Stage, type ActiveRide } from '../model/types';
import { fmtDist, fmtEta, fmtSpeed, maneuverIcon, brl } from '../lib/formatters';
import { StageCard } from './components/StageCard';
import { NavigationChoiceModal, ExternalNavBadge } from './components/NavigationChoiceModal';
import { CancelCorridaModal } from './components/CancelCorridaModal';
import { CancelamentoCorridaOverlay } from './components/CancelamentoCorridaOverlay';
import { EntregaSucessoOverlay } from './components/EntregaSucessoOverlay';
import { useActiveRide } from '../model/useActiveRide';
import { useMemo } from 'react';
import { useTheme } from '../../../../shared/hooks';
import type { Theme } from '../../../../shared/hooks/useTheme';

interface ActiveScreenProps {
  ride: ActiveRide;
  initialStage?: Stage;
  onFinish: () => void;
  onBack?: (currentStage: Stage) => void;
  onOpenChat?: (pedidoId: string) => void;
}

export function ActiveScreen({
  ride,
  initialStage,
  onFinish,
  onBack,
  onOpenChat,
}: ActiveScreenProps) {
  const {
    stage,
    idx,
    setStage,
    photoUri,
    loadingRetirada,
    loadingCancelamento,
    cancelModalVisible,
    setCancelModalVisible,
    codigoEntrega,
    setCodigoEntrega,
    loadingEntrega,
    entregaError,
    setEntregaError,
    sucessoVisivel,
    cancelamentoConfirmado,
    navMode,
    setNavMode,
    setNavChoiceOpen,
    extNavTypeRef,
    runGeocode,
    isMoving,
    destination,
    destName,
    destAddress,
    destLabel,
    showNavChoiceModal,
    handleOpenExternalNav,
    handleReopenExtNav,
    navUserLocation,
    currentStep,
    nextStep,
    distanceToStep,
    distanceRemaining,
    etaSeconds,
    speedKmh,
    heading,
    isOffRoute,
    navigationStarted,
    centerTrigger,
    fitTrigger,
    centerMap,
    isNavigating,
    advanceStage,
    handleTakePhoto,
    handleCancelarCorrida,
    handleConfirmarCancelamento,
    handleConfirmarRetirada,
    handleConfirmarEntrega,
    remainingRoute,
    hasArrived,
    isArrivingSoon,
    geocodeError,
  } = useActiveRide({ ride, initialStage, onFinish });

  const theme = useTheme();
  const s = useMemo(() => makeStyles(theme), [theme]);
  return (
    <SafeAreaView style={s.safeArea}>
      <DeliveryTrackingMap
        entregadorLocation={
          navUserLocation
            ? { lat: navUserLocation.lat, lng: navUserLocation.lng, heading, speedKmh }
            : null
        }
        destination={destination}
        routeCoords={remainingRoute}
        defaultFollowing={true}
        headingUp={navMode === 'internal'}
        theme="light"
        centerTrigger={centerTrigger}
        fitTrigger={fitTrigger}
        style={s.mapBg}
      />

      <View style={s.topOverlay}>
        <View style={s.topRow}>
          {onBack && (
            <TouchableOpacity style={s.backBtn} onPress={() => onBack(stage)} activeOpacity={0.8}>
              <Ionicons name="chevron-back" size={20} color={theme.text} />
            </TouchableOpacity>
          )}
          <View style={[s.progressCard, onBack ? { marginLeft: 8 } : {}]}>
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
        </View>

        {isNavigating && currentStep && (
          <View style={s.instructionCard}>
            <View style={[s.instructionIcon, distanceToStep < 100 && s.instructionIconUrgent]}>
              <Ionicons name={maneuverIcon(currentStep.modifier) as any} size={22} color="#fff" />
            </View>
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={s.instructionText} numberOfLines={1}>
                {currentStep.instruction}
              </Text>
              {nextStep && (
                <Text style={s.instructionNext} numberOfLines={1}>
                  Depois: {nextStep.instruction}
                </Text>
              )}
            </View>
            <Text style={[s.instructionDist, distanceToStep < 100 && s.instructionDistUrgent]}>
              {fmtDist(distanceToStep)}
            </Text>
          </View>
        )}

        {isOffRoute && (
          <View style={s.offRouteCard}>
            <Ionicons name="refresh" size={14} color="#fff" />
            <Text style={s.offRouteTxt}>Recalculando rota...</Text>
          </View>
        )}
      </View>

      {stage !== 'delivered' && (
        <View style={s.fabs}>
          {isNavigating && (
            <TouchableOpacity
              style={[s.fab, { backgroundColor: '#209CEF' }]}
              onPress={centerMap}
              activeOpacity={0.8}
            >
              <Ionicons name="locate" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[
              s.fab,
              { backgroundColor: '#39FF89' },
              !ride.cliente.telefone && { opacity: 0.4 },
            ]}
            activeOpacity={0.8}
            onPress={() => {
              if (ride.cliente.telefone) Linking.openURL(`tel:${ride.cliente.telefone}`);
            }}
          >
            <Ionicons name="call" size={20} color="#002B12" />
          </TouchableOpacity>
          <TouchableOpacity
            style={[s.fab, { backgroundColor: theme.surf }, !onOpenChat && { opacity: 0.4 }]}
            activeOpacity={0.8}
            onPress={() => onOpenChat?.(ride.id)}
            disabled={!onOpenChat}
          >
            <Ionicons name="chatbubble" size={20} color={theme.text} />
          </TouchableOpacity>
        </View>
      )}

      <View style={s.bottomSheet}>
        {isMoving && navMode !== 'external' && !navigationStarted && (
          <View>
            <View style={s.preNavRow}>
              <View
                style={[
                  s.preNavIcon,
                  { backgroundColor: stage === 'to-store' ? '#000933' : '#209CEF' },
                ]}
              >
                <Ionicons
                  name={stage === 'to-store' ? 'storefront' : 'home'}
                  size={20}
                  color="#fff"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.preNavPrimary}>
                  {stage === 'to-store' ? ride.loja.nome : ride.cliente.nome}
                </Text>
                <Text style={s.preNavSecondary} numberOfLines={1}>
                  {stage === 'to-store'
                    ? `${ride.loja.endereco} · ${ride.loja.bairro}`
                    : `${ride.cliente.endereco}${ride.cliente.complemento ? ` · ${ride.cliente.complemento}` : ''}`}
                </Text>
              </View>
            </View>
            {geocodeError ? (
              <View style={s.geocodeErrorRow}>
                <Ionicons name="warning-outline" size={16} color="#EF4444" />
                <Text style={s.geocodeErrorText}>Endereço não encontrado no mapa.</Text>
                <TouchableOpacity onPress={runGeocode} style={s.retryBtn} activeOpacity={0.7}>
                  <Text style={s.retryBtnText}>Tentar novamente</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={s.calculatingRow}>
                <ActivityIndicator color="#F2760F" size="small" />
                <Text style={s.calculatingText}>Calculando melhor rota...</Text>
              </View>
            )}
          </View>
        )}

        {isMoving && navMode === 'external' && (
          <View>
            <View style={s.preNavRow}>
              <View
                style={[
                  s.preNavIcon,
                  { backgroundColor: stage === 'to-store' ? '#000933' : '#209CEF' },
                ]}
              >
                <Ionicons
                  name={stage === 'to-store' ? 'storefront' : 'home'}
                  size={20}
                  color="#fff"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.preNavPrimary}>
                  {stage === 'to-store' ? ride.loja.nome : ride.cliente.nome}
                </Text>
                <Text style={s.preNavSecondary} numberOfLines={1}>
                  {stage === 'to-store'
                    ? `${ride.loja.endereco} · ${ride.loja.bairro}`
                    : `${ride.cliente.endereco}${ride.cliente.complemento ? ` · ${ride.cliente.complemento}` : ''}`}
                </Text>
              </View>
            </View>
            <View style={s.extNavRow}>
              <ExternalNavBadge type={extNavTypeRef.current} />
              <View style={s.extNavActions}>
                <TouchableOpacity
                  style={s.extNavSwitchBtn}
                  onPress={() => setNavChoiceOpen(true)}
                  activeOpacity={0.8}
                >
                  <Ionicons name="swap-horizontal" size={14} color={theme.textMut} />
                  <Text style={s.extNavSwitchText}>Trocar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={s.extNavReopenBtn}
                  onPress={handleReopenExtNav}
                  activeOpacity={0.8}
                >
                  <Ionicons name="open-outline" size={14} color="#209CEF" />
                  <Text style={s.extNavReopenText}>Reabrir</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {isNavigating && (
          <View style={s.navStats}>
            <View style={s.navStat}>
              <Text style={s.navStatLabel}>VELOCIDADE</Text>
              <Text style={s.navStatVal}>{fmtSpeed(speedKmh)}</Text>
            </View>
            <View style={s.navStatDivider} />
            <View style={s.navStat}>
              <Text style={s.navStatLabel}>CHEGADA</Text>
              <Text style={[s.navStatVal, { color: '#F2760F' }]}>{fmtEta(etaSeconds)}</Text>
            </View>
            <View style={s.navStatDivider} />
            <View style={s.navStat}>
              <Text style={s.navStatLabel}>DISTÂNCIA</Text>
              <Text style={s.navStatVal}>{fmtDist(distanceRemaining)}</Text>
            </View>
          </View>
        )}

        {isMoving && navMode === 'internal' && (
          <TouchableOpacity
            style={s.switchNavBtn}
            onPress={() => setNavChoiceOpen(true)}
            activeOpacity={0.7}
          >
            <Ionicons name="swap-horizontal" size={15} color="#209CEF" />
            <Text style={s.switchNavText}>Trocar navegação</Text>
          </TouchableOpacity>
        )}

        {stage === 'to-store' && (navigationStarted || navMode === 'external') && (
          <>
            {navMode === 'internal' && hasArrived ? (
              <View style={s.arrivedBanner}>
                <Ionicons name="checkmark-circle" size={16} color="#002B12" />
                <Text style={s.arrivedText}>Você chegou até a loja!</Text>
              </View>
            ) : navMode === 'internal' && isArrivingSoon ? (
              <View style={s.arrivingBanner}>
                <Ionicons name="location" size={14} color="#39FF89" />
                <Text style={s.arrivingText}>Você está chegando ao estabelecimento!</Text>
              </View>
            ) : null}
            <StageCard
              icon="storefront"
              iconColor="#000933"
              logoUrl={ride.loja.logoUrl}
              primary={ride.loja.nome}
              secondary={`${ride.loja.endereco} · ${ride.loja.bairro}`}
              cta="Cheguei ao estabelecimento"
              onCta={advanceStage}
            />
            <TouchableOpacity
              style={s.cancelCorridaBtn}
              onPress={handleCancelarCorrida}
              disabled={loadingCancelamento}
              activeOpacity={0.7}
            >
              {loadingCancelamento ? (
                <ActivityIndicator size="small" color="#9B2727" />
              ) : (
                <>
                  <Ionicons name="close-circle-outline" size={15} color="#9B2727" />
                  <Text style={s.cancelCorridaTxt}>Cancelar corrida</Text>
                </>
              )}
            </TouchableOpacity>
          </>
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
                <TouchableOpacity
                  style={s.photoRetake}
                  onPress={handleTakePhoto}
                  activeOpacity={0.8}
                >
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

        {stage === 'to-customer' && (navigationStarted || navMode === 'external') && (
          <>
            {navMode === 'internal' && hasArrived ? (
              <View style={s.arrivedBanner}>
                <Ionicons name="checkmark-circle" size={16} color="#002B12" />
                <Text style={s.arrivedText}>Você chegou até o local da entrega!</Text>
              </View>
            ) : navMode === 'internal' && isArrivingSoon ? (
              <View style={s.arrivingBanner}>
                <Ionicons name="location" size={14} color="#39FF89" />
                <Text style={s.arrivingText}>Você está chegando ao destino do cliente!</Text>
              </View>
            ) : null}
            <StageCard
              icon="home"
              iconColor="#209CEF"
              primary={ride.cliente.nome}
              secondary={`${ride.cliente.endereco}${ride.cliente.complemento ? ` · ${ride.cliente.complemento}` : ''}`}
              cta="Registrar chegada"
              onCta={advanceStage}
              codigoEntrega={ride.id.slice(0, 8).toUpperCase()}
            />
          </>
        )}

        {stage === 'delivered' && (
          <View>
            <TouchableOpacity
              style={s.stageBackBtn}
              onPress={() => {
                setStage('to-customer');
                setCodigoEntrega('');
                setEntregaError(null);
              }}
              activeOpacity={0.7}
            >
              <Ionicons name="chevron-back" size={18} color={theme.text} />
              <Text style={s.stageBackText}>Voltar</Text>
            </TouchableOpacity>
            <Text style={s.codeLabel}>Código de entrega</Text>
            <View style={[s.codeHint, { flexDirection: 'row', gap: 8, alignItems: 'flex-start' }]}>
              <Ionicons
                name="information-circle-outline"
                size={16}
                color="#F2760F"
                style={{ marginTop: 1 }}
              />
              <Text style={[s.codeHintText, { flex: 1 }]}>
                Peça ao cliente os 4 últimos dígitos do telefone cadastrado e digite abaixo.
              </Text>
            </View>
            <TextInput
              style={[s.codeInput, entregaError && s.codeInputError]}
              placeholder="0000"
              placeholderTextColor={theme.textMut}
              keyboardType="numeric"
              maxLength={4}
              value={codigoEntrega}
              onChangeText={(v) => {
                setCodigoEntrega(v.replace(/\D/g, '').slice(0, 4));
                if (entregaError) setEntregaError(null);
              }}
            />
            {entregaError && (
              <View style={s.entregaErrorRow}>
                <Ionicons name="alert-circle" size={16} color="#EF4444" />
                <Text style={s.entregaErrorText}>{entregaError}</Text>
              </View>
            )}
            <TouchableOpacity
              style={[
                s.ctaBtn,
                { marginTop: 12 },
                (codigoEntrega.length < 4 || loadingEntrega) && { opacity: 0.5 },
              ]}
              onPress={codigoEntrega.length === 4 ? handleConfirmarEntrega : undefined}
              disabled={codigoEntrega.length < 4 || loadingEntrega}
              activeOpacity={0.85}
            >
              {loadingEntrega ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                  <Text style={s.ctaBtnText}>Pedido entregue · {brl(ride.ganho)}</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}
      </View>

      <CancelCorridaModal
        visible={cancelModalVisible}
        loading={loadingCancelamento}
        onConfirm={handleConfirmarCancelamento}
        onClose={() => setCancelModalVisible(false)}
      />

      <EntregaSucessoOverlay
        visible={sucessoVisivel}
        ganho={ride.ganho}
        clienteNome={ride.cliente.nome}
        onClose={onFinish}
      />

      <CancelamentoCorridaOverlay
        visible={cancelamentoConfirmado !== null}
        motivo={cancelamentoConfirmado}
        onClose={onFinish}
      />

      <NavigationChoiceModal
        visible={showNavChoiceModal}
        destinationName={destName}
        destinationAddress={destAddress}
        destinationLabel={destLabel}
        onInternal={() => {
          setNavMode('internal');
          setNavChoiceOpen(false);
        }}
        onGoogleMaps={() => handleOpenExternalNav('gmaps')}
        onWaze={() => handleOpenExternalNav('waze')}
        onClose={navMode !== null ? () => setNavChoiceOpen(false) : undefined}
      />
    </SafeAreaView>
  );
}

function makeStyles(theme: Theme) {
  return StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#0B0F22', position: 'relative' as const },
    mapBg: { flex: 1 },

    topOverlay: { position: 'absolute', top: 52, left: 14, right: 14, zIndex: 20 },
    topRow: { flexDirection: 'row', alignItems: 'flex-start' },
    backBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.surf,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 2,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 6,
      elevation: 4,
    },
    progressCard: {
      flex: 1,
      backgroundColor: theme.surf,
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
    progressInfo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    progressStep: {
      fontSize: 10,
      color: theme.textMut,
      fontWeight: '600',
      textTransform: 'uppercase',
      letterSpacing: 0.4,
    },
    progressLabel: { fontSize: 15, fontWeight: '700', color: theme.text },
    progressGanho: { fontSize: 14, fontWeight: '700', color: '#F2760F' },

    instructionCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.isDark ? '#1C2348' : '#000933',
      borderRadius: 14,
      padding: 12,
      marginTop: 8,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.4,
      shadowRadius: 12,
      elevation: 8,
    },
    instructionIcon: {
      width: 42,
      height: 42,
      borderRadius: 21,
      backgroundColor: '#209CEF',
      alignItems: 'center',
      justifyContent: 'center',
    },
    instructionIconUrgent: { backgroundColor: '#F2760F' },
    instructionText: { fontSize: 14, fontWeight: '700', color: '#FFFFFF', lineHeight: 18 },
    instructionNext: { fontSize: 11, color: theme.textMut, marginTop: 2 },
    instructionDist: {
      fontSize: 15,
      fontWeight: '800',
      color: '#FFFFFF',
      marginLeft: 8,
      minWidth: 52,
      textAlign: 'right',
    },
    instructionDistUrgent: { color: '#F2760F' },

    offRouteCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: '#EF4444',
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 6,
      marginTop: 6,
      alignSelf: 'flex-start',
    },
    offRouteTxt: { fontSize: 12, color: '#fff', fontWeight: '600' },

    fabs: { position: 'absolute', top: 220, right: 14, gap: 8, zIndex: 20 },
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
      backgroundColor: theme.surf,
      borderTopLeftRadius: 22,
      borderTopRightRadius: 22,
      padding: 18,
      paddingBottom: 24,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: -12 },
      shadowOpacity: 0.25,
      shadowRadius: 30,
      elevation: 14,
      zIndex: 20,
    },

    preNavRow: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 12 },
    preNavIcon: {
      width: 46,
      height: 46,
      borderRadius: 13,
      alignItems: 'center',
      justifyContent: 'center',
    },
    preNavPrimary: { fontSize: 16, fontWeight: '700', color: theme.text, lineHeight: 21 },
    preNavSecondary: { fontSize: 12, color: theme.textMut, marginTop: 2 },
    calculatingRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 10,
      paddingVertical: 12,
    },
    extNavRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: '#F0F7FF',
      borderRadius: 12,
      paddingHorizontal: 14,
      paddingVertical: 10,
    },
    extNavActions: { flexDirection: 'row', alignItems: 'center', gap: 16 },
    extNavSwitchBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    extNavSwitchText: { fontSize: 13, fontWeight: '700', color: theme.textMut },
    extNavReopenBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    extNavReopenText: { fontSize: 13, fontWeight: '700', color: '#209CEF' },
    switchNavBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      alignSelf: 'center',
      paddingVertical: 6,
      paddingHorizontal: 14,
      marginBottom: 12,
    },
    switchNavText: { fontSize: 13, fontWeight: '700', color: '#209CEF' },
    calculatingText: { fontSize: 13, color: theme.textMut, fontWeight: '600' },
    geocodeErrorRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      backgroundColor: '#FEF2F2',
      borderRadius: 10,
      padding: 12,
    },
    geocodeErrorText: { fontSize: 12, color: '#EF4444', fontWeight: '600', flex: 1 },
    retryBtn: {
      paddingHorizontal: 10,
      paddingVertical: 5,
      backgroundColor: '#EF4444',
      borderRadius: 8,
    },
    retryBtnText: { fontSize: 11, color: '#fff', fontWeight: '700' },
    arrivingBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      backgroundColor: 'rgba(57,255,137,0.10)',
      borderWidth: 1,
      borderColor: '#39FF89',
      borderRadius: 10,
      padding: 10,
      marginBottom: 10,
    },
    arrivingText: { fontSize: 13, color: '#39FF89', fontWeight: '700', flex: 1 },
    arrivedBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      backgroundColor: '#39FF89',
      borderRadius: 10,
      padding: 12,
      marginBottom: 10,
    },
    arrivedText: { fontSize: 13.5, color: '#002B12', fontWeight: '800', flex: 1 },

    navStats: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.bg,
      borderRadius: 14,
      paddingVertical: 10,
      marginBottom: 14,
    },
    navStat: { flex: 1, alignItems: 'center' },
    navStatLabel: {
      fontSize: 9,
      color: theme.textMut,
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    navStatVal: { fontSize: 16, fontWeight: '800', color: theme.text, marginTop: 2 },
    navStatDivider: { width: 1, height: 28, backgroundColor: theme.border },

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

    stageBackBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      alignSelf: 'flex-start',
      marginBottom: 14,
    },
    stageBackText: { fontSize: 13, fontWeight: '600', color: theme.text },

    codeLabel: {
      fontSize: 11,
      color: theme.textMut,
      fontWeight: '600',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginBottom: 10,
    },
    codeHint: { padding: 12, backgroundColor: theme.bg, borderRadius: 10, marginBottom: 14 },
    codeHintText: { fontSize: 12.5, color: theme.text, lineHeight: 18 },
    codeInput: {
      fontSize: 32,
      fontWeight: '800',
      color: theme.text,
      textAlign: 'center',
      letterSpacing: 12,
      backgroundColor: theme.bg,
      borderRadius: 14,
      paddingVertical: 16,
      borderWidth: 2,
      borderColor: theme.border,
    },
    codeInputError: { borderColor: '#EF4444', backgroundColor: '#FEF2F2' },
    entregaErrorRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginTop: 10,
    },
    entregaErrorText: {
      flex: 1,
      fontSize: 12.5,
      color: '#EF4444',
      fontWeight: '600',
      lineHeight: 17,
    },

    cancelCorridaBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      marginTop: 12,
      paddingVertical: 10,
      borderTopWidth: 1,
      borderTopColor: theme.border,
    },
    cancelCorridaTxt: { fontSize: 12, fontWeight: '600', color: '#9B2727' },

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
    photoBtnSub: { fontSize: 11, color: theme.textMut },
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
  });
}
