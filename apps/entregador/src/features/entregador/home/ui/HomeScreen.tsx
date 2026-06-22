import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Animated,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { Ride } from '../../../../entities/corrida';
import { LeafletMap } from '../../../../shared/ui/LeafletMap';
import { useHome } from '../model/useHome';
import { OfferSheet } from './components/OfferSheet';

import { brl } from '../../../../shared/lib/format';

const SCREEN_H = Dimensions.get('window').height;
const SHEET_EXPANDED_H = Math.round(SCREEN_H * 0.65);

interface HomeScreenProps {
  onAcceptRide: (ride: Ride) => void;
  activeRidesCount?: number;
  online: boolean;
  onToggleOnline: (v: boolean) => void;
  /** True quando a aba "Corridas" está visível. Ao voltar a ficar visível, a tela
   *  atualiza os dados e remonta o mapa (a view nativa colapsa sob display:none). */
  isFocused?: boolean;
}

export function HomeScreen({
  onAcceptRide,
  activeRidesCount = 0,
  online,
  onToggleOnline,
  isFocused = true,
}: HomeScreenProps) {
  const {
    offer,
    offerCoords,
    countdown,
    ganhoHoje,
    corridasHoje,
    waitingRides,
    acceptingId,
    userLocation,
    mapKey,
    aracaju,
    sheetExpanded,
    sheetTranslateY,
    sheetIsExpanded,
    sheetPanResponder,
    snapSheet,
    toggleOnline,
    handleAccept,
    handleAcceptWaiting,
    dismissOffer,
  } = useHome({ onAcceptRide, activeRidesCount, online, onToggleOnline, isFocused });

  return (
    <SafeAreaView style={s.safeArea}>
      <LeafletMap
        key={mapKey}
        center={userLocation ?? aracaju}
        userLocation={userLocation}
        zoom={15}
        style={s.map}
      />

      <View style={s.topBar}>
        <TouchableOpacity
          style={[s.onlineToggle, { backgroundColor: online ? '#39FF89' : '#FFFFFF' }]}
          onPress={() => toggleOnline(!online)}
          activeOpacity={0.85}
        >
          <View
            style={[
              s.onlineIcon,
              { backgroundColor: online ? 'rgba(255,255,255,0.3)' : '#F0F1F5' },
            ]}
          >
            <Ionicons name="power" size={18} color={online ? '#002B12' : '#9099B3'} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[s.onlineTitle, { color: online ? '#002B12' : '#2A3156' }]}>
              {online ? 'Você está online' : 'Você está offline'}
            </Text>
            <Text style={[s.onlineSub, { color: online ? '#046C2E' : '#9099B3' }]}>
              {online ? 'Recebendo corridas' : 'Toque para ficar online'}
            </Text>
          </View>
          <View
            style={[s.toggleTrack, { backgroundColor: online ? 'rgba(0,43,18,0.25)' : '#D0D4E0' }]}
          >
            <View style={[s.toggleThumb, { transform: [{ translateX: online ? 20 : 0 }] }]} />
          </View>
        </TouchableOpacity>
      </View>

      {!online && (
        <TouchableOpacity
          style={s.offlineOverlay}
          onPress={() => toggleOnline(true)}
          activeOpacity={0.8}
        >
          <View style={s.offlineIcon}>
            <Ionicons name="power" size={32} color="#FFFFFF" />
          </View>
          <Text style={s.offlineTitle}>Em standby</Text>
          <Text style={s.offlineSub}>
            Fique <Text style={{ color: '#F2760F', fontWeight: '700' }}>online</Text> pra começar a
            receber corridas.
          </Text>
        </TouchableOpacity>
      )}

      {online && activeRidesCount >= 2 && (
        <View style={s.limitBanner}>
          <Ionicons name="lock-closed" size={16} color="#fff" />
          <Text style={s.limitBannerText}>
            Limite atingido · Finalize uma entrega para receber novas corridas
          </Text>
        </View>
      )}

      {online && !offer && activeRidesCount < 2 && (
        <Animated.View style={[s.bottomPanel, { transform: [{ translateY: sheetTranslateY }] }]}>
          <View {...sheetPanResponder.panHandlers}>
            <View style={s.sheetHandleRow}>
              <View style={s.sheetHandleBar} />
            </View>

            <TouchableOpacity
              style={s.summarySection}
              onPress={() => snapSheet(!sheetIsExpanded.current)}
              activeOpacity={0.85}
            >
              <View style={s.summaryHeader}>
                <Text style={s.summaryLabel}>Esta semana</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  {waitingRides.length > 0 && !sheetExpanded && (
                    <View style={s.waitingBadge}>
                      <Text style={s.waitingBadgeText}>{waitingRides.length}</Text>
                    </View>
                  )}
                  <View style={s.liveBadge}>
                    <View style={s.liveDot} />
                    <Text style={s.liveBadgeText}>Procurando corridas</Text>
                  </View>
                  <Ionicons
                    name={sheetExpanded ? 'chevron-down' : 'chevron-up'}
                    size={14}
                    color="#9099B3"
                  />
                </View>
              </View>
              <View style={s.summaryRow}>
                <View style={{ flex: 1 }}>
                  <Text style={s.summaryAmount}>{brl(ganhoHoje)}</Text>
                  <Text style={s.summarySub}>Ganho da semana</Text>
                </View>
                <View style={s.dividerV} />
                <View style={s.summaryCol}>
                  <Text style={s.summaryColVal}>{corridasHoje}</Text>
                  <Text style={s.summaryColLabel}>Corridas</Text>
                </View>
              </View>
            </TouchableOpacity>
          </View>

          <View style={s.waitingSection}>
            <View style={s.waitingHeader}>
              <Text style={s.waitingTitle}>Entregas em espera</Text>
              {waitingRides.length > 0 && (
                <View style={s.waitingBadge}>
                  <Text style={s.waitingBadgeText}>{waitingRides.length}</Text>
                </View>
              )}
            </View>

            {waitingRides.length === 0 && (
              <Text style={s.waitingEmpty}>Nenhuma entrega disponível agora.</Text>
            )}

            <ScrollView contentContainerStyle={s.waitingList} showsVerticalScrollIndicator={false}>
              {waitingRides.map((ride) => (
                <View key={ride.id} style={s.waitingCard}>
                  <View style={s.waitingCardBody}>
                    <View style={s.waitingRoute}>
                      <View style={s.waitingRouteRow}>
                        <View style={[s.routeDot, { backgroundColor: '#000933' }]} />
                        <View style={{ flex: 1 }}>
                          <Text style={s.waitingRouteMain}>{ride.loja.nome}</Text>
                          <Text style={s.waitingRouteSub}>{ride.loja.bairro}</Text>
                        </View>
                      </View>
                      <View style={s.routeDash} />
                      <View style={s.waitingRouteRow}>
                        <View style={[s.routeDot, { backgroundColor: '#209CEF' }]} />
                        <View style={{ flex: 1 }}>
                          <Text style={s.waitingRouteMain}>{ride.cliente.bairro}</Text>
                          <Text style={s.waitingRouteSub}>{ride.cliente.endereco}</Text>
                        </View>
                      </View>
                    </View>

                    <View style={s.waitingCardRight}>
                      <Text style={s.waitingGanho}>{brl(ride.ganho)}</Text>
                      <Text style={s.waitingDuracao}>~{ride.duracao} min</Text>
                      <TouchableOpacity
                        style={[s.btnWaitingAccept, acceptingId === ride.id && { opacity: 0.6 }]}
                        onPress={() => handleAcceptWaiting(ride)}
                        disabled={acceptingId !== null}
                        activeOpacity={0.8}
                      >
                        {acceptingId === ride.id ? (
                          <ActivityIndicator size="small" color="#fff" />
                        ) : (
                          <Text style={s.btnWaitingAcceptText}>Aceitar</Text>
                        )}
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>
        </Animated.View>
      )}

      {offer && (
        <OfferSheet
          ride={offer}
          countdown={countdown}
          userLocation={userLocation}
          lojaCoords={offerCoords.loja}
          clienteCoords={offerCoords.cliente}
          onAccept={handleAccept}
          onReject={dismissOffer}
        />
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#0B0F22', position: 'relative' as const },
  map: { flex: 1 },
  topBar: { position: 'absolute', top: 60, left: 14, right: 14, zIndex: 20 },
  onlineToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 18,
    elevation: 8,
  },
  onlineIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  onlineTitle: { fontSize: 15, fontWeight: '700' },
  onlineSub: { fontSize: 11, marginTop: 1 },
  toggleTrack: { width: 46, height: 26, borderRadius: 13, padding: 3, justifyContent: 'center' },
  toggleThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  offlineOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(11,15,34,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
    zIndex: 20,
  },
  offlineIcon: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  offlineTitle: { fontSize: 22, fontWeight: '700', color: '#FFFFFF', marginBottom: 8 },
  offlineSub: { fontSize: 13, color: 'rgba(255,255,255,0.65)', textAlign: 'center', maxWidth: 240 },
  limitBanner: {
    position: 'absolute',
    bottom: 14,
    left: 14,
    right: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 14,
    borderRadius: 14,
    backgroundColor: '#B34D00',
    zIndex: 20,
  },
  limitBannerText: { fontSize: 12.5, fontWeight: '600', color: '#fff', flex: 1 },
  bottomPanel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: SHEET_EXPANDED_H,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 16,
    zIndex: 20,
  },
  sheetHandleRow: {
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 6,
  },
  sheetHandleBar: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#D0D4E0',
  },
  summarySection: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F1F7',
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 11,
    color: '#9099B3',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: 'rgba(57,255,137,0.15)',
    borderRadius: 99,
  },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#39FF89' },
  liveBadgeText: { fontSize: 11, fontWeight: '700', color: '#046C2E' },
  summaryRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  summaryAmount: { fontSize: 28, fontWeight: '800', color: '#000933' },
  summarySub: { fontSize: 11, color: '#9099B3', marginTop: 3 },
  dividerV: { width: 1, height: 36, backgroundColor: '#E4E7F1' },
  summaryCol: { flex: 1, alignItems: 'center' },
  summaryColVal: { fontSize: 20, fontWeight: '700', color: '#000933' },
  summaryColLabel: { fontSize: 10, color: '#9099B3', marginTop: 4 },
  waitingSection: { flex: 1 },
  waitingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 10,
  },
  waitingTitle: { fontSize: 14, fontWeight: '700', color: '#000933' },
  waitingBadge: {
    minWidth: 22,
    height: 22,
    paddingHorizontal: 6,
    borderRadius: 11,
    backgroundColor: '#F2760F',
    alignItems: 'center',
    justifyContent: 'center',
  },
  waitingBadgeText: { fontSize: 11, fontWeight: '700', color: '#fff' },
  waitingEmpty: {
    fontSize: 12,
    color: '#9099B3',
    textAlign: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  waitingList: { paddingHorizontal: 14, paddingBottom: 24 },
  waitingCard: { backgroundColor: '#F8F9FC', borderRadius: 12, padding: 12, marginBottom: 10 },
  waitingCardBody: { flexDirection: 'row', gap: 10 },
  waitingRoute: { flex: 1 },
  waitingRouteRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  waitingRouteMain: { fontSize: 13, fontWeight: '600', color: '#000933' },
  waitingRouteSub: { fontSize: 11, color: '#9099B3', marginTop: 1 },
  waitingCardRight: { alignItems: 'flex-end', justifyContent: 'space-between', gap: 4 },
  waitingGanho: { fontSize: 16, fontWeight: '800', color: '#000933' },
  waitingDuracao: { fontSize: 10, color: '#9099B3' },
  btnWaitingAccept: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#F2760F',
    minWidth: 72,
    alignItems: 'center',
  },
  btnWaitingAcceptText: { fontSize: 12, fontWeight: '700', color: '#fff' },
  routeDot: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  routeDash: {
    borderLeftWidth: 2,
    borderLeftColor: '#E4E7F1',
    borderStyle: 'dashed',
    height: 14,
    marginLeft: 16,
    marginVertical: 4,
  },
});
