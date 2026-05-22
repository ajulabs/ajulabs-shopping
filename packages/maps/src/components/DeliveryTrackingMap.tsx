import React, {
  useRef,
  useEffect,
  useState,
  useCallback,
  useMemo,
  memo,
} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  useColorScheme,
} from 'react-native';
import MapView, {
  UrlTile,
  Marker,
  Polyline,
  PROVIDER_DEFAULT,
} from 'react-native-maps';
import { fetchOsrmSimple } from '../utils/osrm';
import type { NavStep } from '@ajulabs/types';

// ─── Types ────────────────────────────────────────────────────────────────────

export type DeliveryStatus = 'pendente' | 'aceito' | 'coletado' | 'entregue' | 'cancelado';

export interface DeliveryTrackingMapProps {
  /** Entregador's live position — from useDeliveryMap (entregador) or useDeliveryTracking (consumer/lojista). */
  entregadorLocation: { lat: number; lng: number; heading?: number; speedKmh?: number } | null;
  /** Target destination (customer address for entregador; entregador's location for consumer). */
  destination: { lat: number; lng: number } | null;
  /** Pre-computed OSRM route. If omitted, the map fetches it internally. */
  routeCoords?: { lat: number; lng: number }[];
  /** Current delivery status — drives UI state and badge. */
  deliveryStatus?: DeliveryStatus;
  /** ETA in seconds. Shown in the top banner. */
  etaSeconds?: number;
  /** Distance remaining to destination in meters. */
  distanceRemaining?: number;
  /** Current navigation step (entregador / isNavigationMode only). */
  currentStep?: NavStep | null;
  /** Next navigation step for preview. */
  nextStep?: NavStep | null;
  /** Distance to next maneuver in meters. */
  distanceToStep?: number;
  /** Whether the entregador is off the computed route. */
  isOffRoute?: boolean;
  /** Speed in km/h (shown in navigation stats bar). */
  speedKmh?: number;
  /**
   * Navigation HUD mode (entregador view).
   * Shows turn-by-turn card, speed/ETA stats bar, and off-route banner.
   */
  isNavigationMode?: boolean;
  /**
   * Color theme. 'auto' follows the system setting (default).
   * Light tiles: OpenStreetMap. Dark tiles: CartoDB Dark Matter.
   */
  theme?: 'light' | 'dark' | 'auto';
  /**
   * Auto-follow the entregador's position on the map (default: true).
   * When the user pans the map, following stops. Tap the follow button to re-enable.
   */
  defaultFollowing?: boolean;
  /**
   * Increment this value to force the map to center on the entregador.
   * Useful when a parent button triggers re-centering.
   */
  centerTrigger?: number;
  /**
   * Increment this value to trigger fitToCoordinates (shows full route overview).
   * Fires automatically from useRideNavigation when route first becomes ready.
   */
  fitTrigger?: number;
  style?: object;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const DELTA = 0.01;
const FIT_PADDING = { top: 100, right: 60, bottom: 260, left: 60 };
// CartoDB Voyager: light, colourful, great contrast for blue/orange delivery UI.
const TILE_LIGHT = 'https://a.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png';
const TILE_DARK  = 'https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png';

const STATUS_CONFIG: Record<DeliveryStatus, { label: string; color: string }> = {
  pendente:  { label: 'Aguardando entregador', color: '#F2760F' },
  aceito:    { label: 'Entregador a caminho',  color: '#209CEF' },
  coletado:  { label: 'Saiu para entrega',     color: '#39FF89' },
  entregue:  { label: 'Entregue!',             color: '#39FF89' },
  cancelado: { label: 'Cancelado',             color: '#E14B3C' },
};

const STEP_ICONS: Record<string, string> = {
  left:          '←',
  right:         '→',
  'sharp left':  '↩',
  'sharp right': '↪',
  'slight left': '↖',
  'slight right':'↗',
  straight:      '↑',
  uturn:         '↩↩',
};

// ─── Sub-components (memoized) ────────────────────────────────────────────────

const EntregadorMarker = memo(function EntregadorMarker({ heading }: { heading: number }) {
  const accumRef = useRef(heading);
  const rotateAnim = useRef(new Animated.Value(heading)).current;

  useEffect(() => {
    let delta = heading - (accumRef.current % 360);
    if (delta > 180) delta -= 360;
    if (delta < -180) delta += 360;
    accumRef.current += delta;

    Animated.timing(rotateAnim, {
      toValue: accumRef.current,
      duration: 350,
      useNativeDriver: true,
    }).start();
  }, [heading]);

  const spin = rotateAnim.interpolate({
    inputRange: [-3600, 3600],
    outputRange: ['-3600deg', '3600deg'],
  });

  return (
    <Animated.View style={[mk.wrap, { transform: [{ rotate: spin }] }]}>
      <View style={mk.shadow} />
      <View style={mk.circle}>
        {/* white triangle arrow pointing forward (up) */}
        <View style={mk.arrow} />
      </View>
    </Animated.View>
  );
});

const mk = StyleSheet.create({
  wrap:   { width: 46, height: 46, alignItems: 'center', justifyContent: 'center' },
  shadow: {
    position: 'absolute',
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(32,156,239,0.18)',
  },
  circle: {
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: '#209CEF',
    borderWidth: 3, borderColor: '#FFFFFF',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3, shadowRadius: 6,
    elevation: 8,
  },
  arrow: {
    width: 0, height: 0,
    borderLeftWidth: 5, borderRightWidth: 5, borderBottomWidth: 10,
    borderLeftColor: 'transparent', borderRightColor: 'transparent',
    borderBottomColor: '#FFFFFF',
    marginTop: -3,
  },
});

const DestinationMarker = memo(function DestinationMarker() {
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.6, duration: 1000, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1,   duration: 1000, useNativeDriver: true }),
      ]),
    );
    anim.start();
    return () => anim.stop();
  }, []);

  const opacity = pulse.interpolate({ inputRange: [1, 1.6], outputRange: [0.45, 0] });

  return (
    <View style={dm.wrap}>
      <Animated.View style={[dm.ring, { transform: [{ scale: pulse }], opacity }]} />
      <View style={dm.pin} />
      <View style={dm.tail} />
    </View>
  );
});

const dm = StyleSheet.create({
  wrap: { alignItems: 'center' },
  ring: {
    position: 'absolute', top: -6,
    width: 40, height: 40, borderRadius: 20,
    borderWidth: 2, borderColor: '#F2760F',
  },
  pin: {
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: '#F2760F',
    borderWidth: 3, borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3, shadowRadius: 6,
    elevation: 7,
  },
  tail: {
    width: 0, height: 0,
    borderLeftWidth: 5, borderRightWidth: 5, borderTopWidth: 9,
    borderLeftColor: 'transparent', borderRightColor: 'transparent',
    borderTopColor: '#F2760F',
    marginTop: -1,
  },
});

// ─── Main component ───────────────────────────────────────────────────────────

export function DeliveryTrackingMap({
  entregadorLocation,
  destination,
  routeCoords,
  deliveryStatus,
  etaSeconds,
  distanceRemaining,
  currentStep,
  nextStep,
  distanceToStep,
  isOffRoute = false,
  speedKmh = 0,
  isNavigationMode = false,
  theme = 'auto',
  defaultFollowing = true,
  centerTrigger = 0,
  fitTrigger = 0,
  style,
}: DeliveryTrackingMapProps) {
  const systemTheme = useColorScheme();
  const isDark = theme === 'auto' ? systemTheme === 'dark' : theme === 'dark';

  const mapRef = useRef<MapView>(null);
  const [following, setFollowing] = useState(defaultFollowing);
  const [internalRoute, setInternalRoute] = useState<{ latitude: number; longitude: number }[]>([]);
  const internalRouteKeyRef = useRef('');

  // ── Auto-follow ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!following || !entregadorLocation || !mapRef.current) return;
    mapRef.current.animateToRegion(
      {
        latitude: entregadorLocation.lat,
        longitude: entregadorLocation.lng,
        latitudeDelta: DELTA,
        longitudeDelta: DELTA,
      },
      450,
    );
  }, [following, entregadorLocation?.lat, entregadorLocation?.lng]);

  // ── External center trigger (re-follows driver) ──────────────────────────
  useEffect(() => {
    if (centerTrigger === 0 || !entregadorLocation || !mapRef.current) return;
    setFollowing(true);
    mapRef.current.animateToRegion(
      {
        latitude: entregadorLocation.lat,
        longitude: entregadorLocation.lng,
        latitudeDelta: 0.004,
        longitudeDelta: 0.004,
      },
      400,
    );
  }, [centerTrigger]);

  // ── External fit trigger (route overview — fires when route first loads) ──
  useEffect(() => {
    if (fitTrigger === 0 || !mapRef.current) return;
    const pts: { latitude: number; longitude: number }[] = [];
    if (entregadorLocation)
      pts.push({ latitude: entregadorLocation.lat, longitude: entregadorLocation.lng });
    if (destination)
      pts.push({ latitude: destination.lat, longitude: destination.lng });
    if (pts.length >= 2) {
      setFollowing(false);
      mapRef.current.fitToCoordinates(pts, { edgePadding: FIT_PADDING, animated: true });
    }
  }, [fitTrigger]);

  // ── Internal route fetch (when routeCoords not provided) ─────────────────
  useEffect(() => {
    if (!entregadorLocation || !destination) { setInternalRoute([]); return; }
    if (routeCoords && routeCoords.length > 1) { setInternalRoute([]); return; }

    const key = `${entregadorLocation.lat.toFixed(3)},${entregadorLocation.lng.toFixed(3)}→${destination.lat.toFixed(3)},${destination.lng.toFixed(3)}`;
    if (key === internalRouteKeyRef.current) return;
    internalRouteKeyRef.current = key;

    fetchOsrmSimple(entregadorLocation, destination).then(coords => {
      if (key === internalRouteKeyRef.current) setInternalRoute(coords);
    });
  }, [
    entregadorLocation ? Math.round(entregadorLocation.lat * 300) : null,
    entregadorLocation ? Math.round(entregadorLocation.lng * 300) : null,
    destination?.lat,
    destination?.lng,
    routeCoords?.length,
  ]);

  // ── Fit both markers (manual FAB) ────────────────────────────────────────
  const fitRoute = useCallback(() => {
    if (!mapRef.current) return;
    const pts: { latitude: number; longitude: number }[] = [];
    if (entregadorLocation)
      pts.push({ latitude: entregadorLocation.lat, longitude: entregadorLocation.lng });
    if (destination)
      pts.push({ latitude: destination.lat, longitude: destination.lng });
    if (pts.length >= 2) {
      setFollowing(false);
      mapRef.current.fitToCoordinates(pts, { edgePadding: FIT_PADDING, animated: true });
    }
  }, [entregadorLocation, destination]);

  // ── Computed polyline ─────────────────────────────────────────────────────
  const polyline = useMemo(() => {
    if (routeCoords && routeCoords.length > 1)
      return routeCoords.map(c => ({ latitude: c.lat, longitude: c.lng }));
    return internalRoute;
  }, [routeCoords, internalRoute]);

  // ── Pan handler (stop following) ─────────────────────────────────────────
  const handlePan = useCallback(() => {
    if (following) setFollowing(false);
  }, [following]);

  // ── Follow button ─────────────────────────────────────────────────────────
  const handleFollow = useCallback(() => {
    setFollowing(true);
    if (!entregadorLocation || !mapRef.current) return;
    mapRef.current.animateToRegion(
      {
        latitude: entregadorLocation.lat,
        longitude: entregadorLocation.lng,
        latitudeDelta: DELTA,
        longitudeDelta: DELTA,
      },
      450,
    );
  }, [entregadorLocation]);

  // ── Helpers ───────────────────────────────────────────────────────────────
  const fmtDist = (m?: number) => {
    if (m == null) return '';
    return m >= 1000 ? `${(m / 1000).toFixed(1)} km` : `${Math.round(m)} m`;
  };

  const fmtEta = (s?: number) => {
    if (s == null || s <= 0) return '—';
    const m = Math.ceil(s / 60);
    return m >= 60 ? `${Math.floor(m / 60)}h ${m % 60}min` : `${m} min`;
  };

  const center = entregadorLocation ?? destination ?? { lat: -10.9167, lng: -37.05 };
  const isFinished = deliveryStatus === 'entregue' || deliveryStatus === 'cancelado';
  const statusCfg = deliveryStatus ? STATUS_CONFIG[deliveryStatus] : null;
  const stepIcon = currentStep ? (STEP_ICONS[currentStep.modifier ?? ''] ?? '↑') : '↑';
  const distToStepStr = fmtDist(distanceToStep);
  const isUrgent = (distanceToStep ?? Infinity) < 80;

  return (
    <View style={[s.container, style]}>
      {/* ── Map ─────────────────────────────────────────────────────────── */}
      <MapView
        ref={mapRef}
        provider={PROVIDER_DEFAULT}
        style={s.map}
        mapType="none"
        initialRegion={{
          latitude: center.lat,
          longitude: center.lng,
          latitudeDelta: DELTA,
          longitudeDelta: DELTA,
        }}
        showsCompass={false}
        showsScale={false}
        onPanDrag={handlePan}
        moveOnMarkerPress={false}
      >
        <UrlTile
          urlTemplate={isDark ? TILE_DARK : TILE_LIGHT}
          maximumZ={19}
          flipY={false}
        />

        {/* Route polyline — white border underneath + blue on top (Uber/iFood style) */}
        {polyline.length > 1 && (
          <Polyline
            coordinates={polyline}
            strokeColor="rgba(255,255,255,0.85)"
            strokeWidth={9}
            lineCap="round"
            lineJoin="round"
            zIndex={1}
          />
        )}
        {polyline.length > 1 && (
          <Polyline
            coordinates={polyline}
            strokeColor="#209CEF"
            strokeWidth={5}
            lineCap="round"
            lineJoin="round"
            zIndex={2}
          />
        )}

        {/* Entregador marker */}
        {entregadorLocation && (
          <Marker
            coordinate={{ latitude: entregadorLocation.lat, longitude: entregadorLocation.lng }}
            anchor={{ x: 0.5, y: 0.5 }}
            tracksViewChanges
            flat
          >
            <EntregadorMarker heading={entregadorLocation.heading ?? 0} />
          </Marker>
        )}

        {/* Destination marker */}
        {destination && !isFinished && (
          <Marker
            coordinate={{ latitude: destination.lat, longitude: destination.lng }}
            anchor={{ x: 0.5, y: 1 }}
            tracksViewChanges={false}
          >
            <DestinationMarker />
          </Marker>
        )}
      </MapView>

      {/* ── ETA banner (top) ─────────────────────────────────────────────── */}
      {!isFinished && (etaSeconds != null && etaSeconds > 0) && (
        <View style={[s.etaBanner, isDark && s.etaBannerDark]}>
          <Text style={[s.etaTime, isDark && s.textWhite]}>{fmtEta(etaSeconds)}</Text>
          {distanceRemaining != null && distanceRemaining > 0 && (
            <>
              <View style={[s.etaSep, isDark && s.etaSepDark]} />
              <Text style={[s.etaDist, isDark && s.textMuted]}>{fmtDist(distanceRemaining)}</Text>
            </>
          )}
        </View>
      )}

      {/* ── Navigation HUD ───────────────────────────────────────────────── */}
      {isNavigationMode && currentStep && (
        <View style={[s.stepCard, isDark && s.stepCardDark, isUrgent && s.stepCardUrgent]}>
          <View style={[s.stepIconBox, isUrgent ? s.stepIconUrgent : (isDark ? s.stepIconDark : s.stepIconLight)]}>
            <Text style={s.stepIconText}>{stepIcon}</Text>
          </View>
          <View style={s.stepTextBox}>
            <Text style={[s.stepInstruction, isDark && s.textWhite]} numberOfLines={2}>
              {currentStep.instruction}
            </Text>
            {nextStep && (
              <Text style={[s.stepNext, isDark && s.textMuted]} numberOfLines={1}>
                Depois · {nextStep.instruction}
              </Text>
            )}
          </View>
          <Text style={[s.stepDist, isDark && s.textWhite, isUrgent && s.stepDistUrgent]}>
            {distToStepStr}
          </Text>
        </View>
      )}

      {/* ── Navigation stats bar ─────────────────────────────────────────── */}
      {isNavigationMode && (
        <View style={[s.statsBar, isDark && s.statsBarDark]}>
          <View style={s.statCell}>
            <Text style={[s.statLabel, isDark && s.textMuted]}>VELOCIDADE</Text>
            <Text style={[s.statValue, isDark && s.textWhite]}>{Math.round(speedKmh)} km/h</Text>
          </View>
          <View style={[s.statDivider, isDark && s.statDividerDark]} />
          <View style={s.statCell}>
            <Text style={[s.statLabel, isDark && s.textMuted]}>CHEGADA</Text>
            <Text style={[s.statValue, { color: '#F2760F' }]}>{fmtEta(etaSeconds)}</Text>
          </View>
          <View style={[s.statDivider, isDark && s.statDividerDark]} />
          <View style={s.statCell}>
            <Text style={[s.statLabel, isDark && s.textMuted]}>DISTÂNCIA</Text>
            <Text style={[s.statValue, isDark && s.textWhite]}>{fmtDist(distanceRemaining)}</Text>
          </View>
        </View>
      )}

      {/* ── Off-route banner ─────────────────────────────────────────────── */}
      {isOffRoute && (
        <View style={s.offRoute}>
          <Text style={s.offRouteTxt}>↺  Recalculando rota...</Text>
        </View>
      )}

      {/* ── Status badge ─────────────────────────────────────────────────── */}
      {statusCfg && (
        <View style={[s.statusBadge, { borderColor: statusCfg.color }]}>
          <View style={[s.statusDot, { backgroundColor: statusCfg.color }]} />
          <Text style={[s.statusLabel, { color: statusCfg.color }]}>{statusCfg.label}</Text>
        </View>
      )}

      {/* ── FAB: follow entregador ────────────────────────────────────────── */}
      {!following && (
        <TouchableOpacity
          style={[s.fab, isDark && s.fabDark]}
          onPress={handleFollow}
          activeOpacity={0.85}
        >
          <Text style={[s.fabIcon, { color: isDark ? '#FFFFFF' : '#209CEF' }]}>⊕</Text>
        </TouchableOpacity>
      )}

      {/* ── FAB: fit route (overview / consumer mode) ─────────────────────── */}
      {!isNavigationMode && entregadorLocation && destination && (
        <TouchableOpacity
          style={[s.fabFit, isDark && s.fabDark]}
          onPress={fitRoute}
          activeOpacity={0.85}
        >
          <Text style={[s.fabIcon, { color: isDark ? '#FFFFFF' : '#000933', fontSize: 16 }]}>⊞</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  container: { flex: 1, overflow: 'hidden' },
  map:       { flex: 1 },

  // ETA banner
  etaBanner: {
    position: 'absolute', top: 14, alignSelf: 'center',
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 18, paddingVertical: 10,
    borderRadius: 99,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22, shadowRadius: 12, elevation: 8,
  },
  etaBannerDark: { backgroundColor: '#1A1F3A' },
  etaTime:  { fontSize: 18, fontWeight: '800', color: '#000933' },
  etaDist:  { fontSize: 14, fontWeight: '600', color: '#9099B3' },
  etaSep:   { width: 1, height: 18, backgroundColor: '#E4E7F1' },
  etaSepDark: { backgroundColor: '#2E3555' },

  // Step card (turn-by-turn)
  stepCard: {
    position: 'absolute', top: 70, left: 14, right: 14,
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#000933',
    borderRadius: 16, padding: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4, shadowRadius: 16, elevation: 10,
  },
  stepCardDark:   { backgroundColor: '#131836' },
  stepCardUrgent: { backgroundColor: '#F2760F' },
  stepIconBox:  { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center' },
  stepIconLight:  { backgroundColor: '#209CEF' },
  stepIconDark:   { backgroundColor: '#209CEF' },
  stepIconUrgent: { backgroundColor: 'rgba(255,255,255,0.25)' },
  stepIconText: { fontSize: 22, color: '#FFFFFF' },
  stepTextBox:  { flex: 1 },
  stepInstruction: { fontSize: 14, fontWeight: '700', color: '#FFFFFF', lineHeight: 19 },
  stepNext:        { fontSize: 11, color: '#9099B3', marginTop: 2 },
  stepDist:        { fontSize: 16, fontWeight: '800', color: '#FFFFFF', minWidth: 54, textAlign: 'right' },
  stepDistUrgent:  { color: '#FFFFFF' },

  // Stats bar
  statsBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 12, paddingBottom: 24,
    shadowColor: '#000', shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12, shadowRadius: 12, elevation: 6,
  },
  statsBarDark: { backgroundColor: '#131836' },
  statCell:     { flex: 1, alignItems: 'center' },
  statLabel:    { fontSize: 9, color: '#9099B3', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  statValue:    { fontSize: 16, fontWeight: '800', color: '#000933', marginTop: 3 },
  statDivider:  { width: 1, height: 28, backgroundColor: '#E4E7F1' },
  statDividerDark: { backgroundColor: '#2E3555' },

  // Off-route
  offRoute: {
    position: 'absolute', top: 70, alignSelf: 'center',
    backgroundColor: '#EF4444',
    paddingHorizontal: 14, paddingVertical: 7,
    borderRadius: 99,
    shadowColor: '#000', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25, shadowRadius: 8, elevation: 6,
  },
  offRouteTxt: { fontSize: 12, fontWeight: '700', color: '#FFFFFF' },

  // Status badge
  statusBadge: {
    position: 'absolute', bottom: 90, alignSelf: 'center',
    flexDirection: 'row', alignItems: 'center', gap: 7,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 99, borderWidth: 1.5,
    shadowColor: '#000', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15, shadowRadius: 8, elevation: 4,
  },
  statusDot:   { width: 8, height: 8, borderRadius: 4 },
  statusLabel: { fontSize: 12.5, fontWeight: '700' },

  // FABs
  fab: {
    position: 'absolute', bottom: 100, right: 16,
    width: 46, height: 46, borderRadius: 23,
    backgroundColor: '#FFFFFF',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.25, shadowRadius: 14, elevation: 7,
  },
  fabFit: {
    position: 'absolute', bottom: 156, right: 16,
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: '#FFFFFF',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2, shadowRadius: 10, elevation: 5,
  },
  fabDark: { backgroundColor: '#1A1F3A' },
  fabIcon: { fontSize: 22, fontWeight: '700' },

  // Text helpers
  textWhite: { color: '#FFFFFF' },
  textMuted: { color: '#6B7280' },
});
