/// <reference lib="dom" />
import React, { useRef, useEffect, useId, useState, useCallback } from 'react';
import type { NavStep } from '@ajulabs/types';

// URL do PNG do entregador servido pela pasta public/ do app (raiz no web).
const ENTREGADOR_ICON_URL = '/entregador-marker.png';

// ─── Types (mirrored from native version) ────────────────────────────────────

export type DeliveryStatus = 'pendente' | 'aceito' | 'coletado' | 'entregue' | 'cancelado';

export interface DeliveryTrackingMapProps {
  entregadorLocation: { lat: number; lng: number; heading?: number; speedKmh?: number } | null;
  destination: { lat: number; lng: number } | null;
  routeCoords?: { lat: number; lng: number }[];
  deliveryStatus?: DeliveryStatus;
  etaSeconds?: number;
  distanceRemaining?: number;
  currentStep?: NavStep | null;
  nextStep?: NavStep | null;
  distanceToStep?: number;
  isOffRoute?: boolean;
  speedKmh?: number;
  isNavigationMode?: boolean;
  theme?: 'light' | 'dark' | 'auto';
  defaultFollowing?: boolean;
  centerTrigger?: number;
  fitTrigger?: number;
  style?: object;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const TILE_LIGHT = 'https://a.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png';
const TILE_DARK = 'https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png';

const STATUS_CONFIG: Record<DeliveryStatus, { label: string; color: string }> = {
  pendente: { label: 'Aguardando entregador', color: '#F2760F' },
  aceito: { label: 'Entregador a caminho', color: '#209CEF' },
  coletado: { label: 'Saiu para entrega', color: '#39FF89' },
  entregue: { label: 'Entregue!', color: '#39FF89' },
  cancelado: { label: 'Cancelado', color: '#E14B3C' },
};

const STEP_ICONS: Record<string, string> = {
  left: '←',
  right: '→',
  'sharp left': '↩',
  'sharp right': '↪',
  'slight left': '↖',
  'slight right': '↗',
  straight: '↑',
  uturn: '↩↩',
};

// ─── Leaflet loader ───────────────────────────────────────────────────────────

function loadLeaflet(cb: () => void) {
  if ((window as any).L) {
    cb();
    return;
  }
  if (!document.querySelector('link[data-leaflet-css]')) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    link.setAttribute('data-leaflet-css', '');
    document.head.appendChild(link);
  }
  const script = document.createElement('script');
  script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
  script.onload = cb;
  document.head.appendChild(script);
}

async function fetchRouteWeb(
  from: { lat: number; lng: number },
  to: { lat: number; lng: number },
): Promise<[number, number][]> {
  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${from.lng},${from.lat};${to.lng},${to.lat}?overview=full&geometries=geojson`;
    const res = await fetch(url);
    const data = await res.json();
    const coords: number[][] = data.routes?.[0]?.geometry?.coordinates ?? [];
    return coords.map((c: number[]) => [c[1], c[0]]);
  } catch {
    return [];
  }
}

// ─── Marker HTML builders ─────────────────────────────────────────────────────

function entregadorMarkerHtml(): string {
  // Ilustração do entregador (o mesmo PNG usado no nativo).
  return `<img src="${ENTREGADOR_ICON_URL}" style="width:55px;height:55px;object-fit:contain;display:block;" />`;
}

function destinationMarkerHtml(): string {
  return `
    <div style="display:flex;flex-direction:column;align-items:center">
      <div style="
        width:26px;height:26px;border-radius:50%;
        background:#F2760F;border:3px solid #fff;
        box-shadow:0 3px 8px rgba(0,0,0,.35);
        animation:dtm-pulse 2s ease-in-out infinite;
      "></div>
      <div style="
        width:0;height:0;
        border-left:5px solid transparent;
        border-right:5px solid transparent;
        border-top:9px solid #F2760F;
        margin-top:-1px;
      "></div>
    </div>`;
}

function injectPulseCSS() {
  if (document.getElementById('dtm-pulse-style')) return;
  const style = document.createElement('style');
  style.id = 'dtm-pulse-style';
  style.textContent = `
    @keyframes dtm-pulse {
      0%,100% { box-shadow: 0 3px 8px rgba(0,0,0,.35), 0 0 0 0 rgba(242,118,15,.4); }
      50%      { box-shadow: 0 3px 8px rgba(0,0,0,.35), 0 0 0 12px rgba(242,118,15,0); }
    }`;
  document.head.appendChild(style);
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDist(m?: number): string {
  if (m == null) return '';
  return m >= 1000 ? `${(m / 1000).toFixed(1)} km` : `${Math.round(m)} m`;
}

function fmtEta(s?: number): string {
  if (s == null || s <= 0) return '—';
  const m = Math.ceil(s / 60);
  return m >= 60 ? `${Math.floor(m / 60)}h ${m % 60}min` : `${m} min`;
}

function useIsDark(theme: 'light' | 'dark' | 'auto'): boolean {
  const [dark, setDark] = useState(() => {
    if (theme === 'auto' && typeof window !== 'undefined')
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    return theme === 'dark';
  });

  useEffect(() => {
    if (theme !== 'auto') {
      setDark(theme === 'dark');
      return;
    }
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => setDark(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [theme]);

  return dark;
}

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
  const isDark = useIsDark(theme);
  const uid = useId().replace(/:/g, '');
  const mapId = `dtm-${uid}`;

  const mapRef = useRef<any>(null);
  const entregadorMarkerRef = useRef<any>(null);
  const destinationMarkerRef = useRef<any>(null);
  const routePolyRef = useRef<any>(null);
  const tileLayerRef = useRef<any>(null);
  const lastRouteKeyRef = useRef('');

  // isReady flips to true once Leaflet has mounted the map.
  // Marker/route effects depend on it so they re-run after the async init.
  const [isReady, setIsReady] = useState(false);
  const [following, setFollowing] = useState(defaultFollowing);

  // ── Init map ─────────────────────────────────────────────────────────────
  useEffect(() => {
    loadLeaflet(() => {
      const el = document.getElementById(mapId);
      if (!el || mapRef.current) return;
      injectPulseCSS();

      const L = (window as any).L;
      const center = entregadorLocation ?? destination ?? { lat: -10.9167, lng: -37.05 };

      const map = L.map(el, { zoomControl: false, attributionControl: false }).setView(
        [center.lat, center.lng],
        15,
      );
      setTimeout(() => map.invalidateSize(), 80);

      L.control.zoom({ position: 'topright' }).addTo(map);

      tileLayerRef.current = L.tileLayer(isDark ? TILE_DARK : TILE_LIGHT, { maxZoom: 19 }).addTo(
        map,
      );

      map.on('dragstart', () => setFollowing(false));
      mapRef.current = map;

      // Signal that the map is ready — marker/route effects will now fire.
      setIsReady(true);
    });

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
      entregadorMarkerRef.current = null;
      destinationMarkerRef.current = null;
      routePolyRef.current = null;
      tileLayerRef.current = null;
      setIsReady(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapId]);

  // ── Swap tile layer on theme change ──────────────────────────────────────
  useEffect(() => {
    if (!isReady || !mapRef.current || !tileLayerRef.current) return;
    const L = (window as any).L;
    if (!L) return;
    tileLayerRef.current.remove();
    tileLayerRef.current = L.tileLayer(isDark ? TILE_DARK : TILE_LIGHT, { maxZoom: 19 }).addTo(
      mapRef.current,
    );
    tileLayerRef.current.bringToBack();
  }, [isReady, isDark]);

  // ── Update entregador marker ──────────────────────────────────────────────
  useEffect(() => {
    if (!isReady || !mapRef.current || !entregadorLocation) return;
    const L = (window as any).L;
    if (!L) return;

    const latlng = [entregadorLocation.lat, entregadorLocation.lng];

    if (entregadorMarkerRef.current) {
      try {
        entregadorMarkerRef.current.setLatLng(latlng as any);
        entregadorMarkerRef.current.setIcon(
          L.divIcon({
            className: '',
            html: entregadorMarkerHtml(),
            iconSize: [55, 55],
            iconAnchor: [28, 28],
          }),
        );
      } catch {
        entregadorMarkerRef.current = null;
      }
    }
    if (!entregadorMarkerRef.current) {
      entregadorMarkerRef.current = L.marker(latlng as any, {
        icon: L.divIcon({
          className: '',
          html: entregadorMarkerHtml(),
          iconSize: [55, 55],
          iconAnchor: [28, 28],
        }),
        zIndexOffset: 1000,
      }).addTo(mapRef.current);
    }

    if (following) {
      mapRef.current.panTo(latlng as any, { animate: true, duration: 0.5 });
    }
  }, [
    isReady,
    entregadorLocation?.lat,
    entregadorLocation?.lng,
    entregadorLocation?.heading,
    following,
  ]);

  // ── Update destination marker ─────────────────────────────────────────────
  useEffect(() => {
    if (!isReady || !mapRef.current || !destination) return;
    const L = (window as any).L;
    if (!L) return;

    const latlng = [destination.lat, destination.lng];
    const icon = L.divIcon({
      className: '',
      html: destinationMarkerHtml(),
      iconSize: [36, 45],
      iconAnchor: [18, 44],
    });

    if (destinationMarkerRef.current) {
      try {
        destinationMarkerRef.current.setLatLng(latlng as any);
      } catch {
        destinationMarkerRef.current = null;
      }
    }
    if (!destinationMarkerRef.current) {
      destinationMarkerRef.current = L.marker(latlng as any, { icon }).addTo(mapRef.current);
    }
  }, [isReady, destination?.lat, destination?.lng]);

  // ── Route polyline ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isReady || !mapRef.current) return;
    const L = (window as any).L;
    if (!L) return;

    const useProvided = routeCoords && routeCoords.length > 1;

    if (useProvided) {
      const latLngs = routeCoords!.map((c) => [c.lat, c.lng] as [number, number]);
      if (routePolyRef.current) routePolyRef.current.setLatLngs(latLngs);
      else
        routePolyRef.current = L.polyline(latLngs, {
          color: '#209CEF',
          weight: 5,
          opacity: 0.9,
          lineCap: 'round',
        }).addTo(mapRef.current);
      routePolyRef.current.bringToBack();
      return;
    }

    if (!entregadorLocation || !destination) return;
    const key = `${entregadorLocation.lat.toFixed(3)},${entregadorLocation.lng.toFixed(3)}→${destination.lat.toFixed(3)},${destination.lng.toFixed(3)}`;
    if (key === lastRouteKeyRef.current) return;
    lastRouteKeyRef.current = key;

    fetchRouteWeb(entregadorLocation, destination).then((latLngs) => {
      if (key !== lastRouteKeyRef.current || !mapRef.current) return;
      const L2 = (window as any).L;
      if (!L2 || latLngs.length < 2) return;
      if (routePolyRef.current) routePolyRef.current.setLatLngs(latLngs);
      else
        routePolyRef.current = L2.polyline(latLngs, {
          color: '#209CEF',
          weight: 5,
          opacity: 0.9,
          lineCap: 'round',
        }).addTo(mapRef.current);
      routePolyRef.current.bringToBack();
    });
  }, [
    isReady,
    entregadorLocation ? Math.round(entregadorLocation.lat * 300) : null,
    entregadorLocation ? Math.round(entregadorLocation.lng * 300) : null,
    destination?.lat,
    destination?.lng,
    routeCoords?.length,
  ]);

  // ── Center trigger (re-follows driver) ───────────────────────────────────
  useEffect(() => {
    if (!isReady || centerTrigger === 0 || !mapRef.current || !entregadorLocation) return;
    setFollowing(true);
    mapRef.current.setView([entregadorLocation.lat, entregadorLocation.lng], 16, { animate: true });
  }, [isReady, centerTrigger]);

  // ── Fit trigger (route overview — auto-fires when route first loads) ──────
  useEffect(() => {
    if (!isReady || fitTrigger === 0) return;
    fitRoute();
  }, [isReady, fitTrigger]);

  // ── Fit both markers ──────────────────────────────────────────────────────
  const fitRoute = useCallback(() => {
    if (!mapRef.current || !entregadorLocation || !destination) return;
    const L = (window as any).L;
    if (!L) return;
    const bounds = L.latLngBounds([
      [entregadorLocation.lat, entregadorLocation.lng],
      [destination.lat, destination.lng],
    ]);
    mapRef.current.fitBounds(bounds, { padding: [60, 60] });
  }, [entregadorLocation, destination]);

  // ── Follow button ─────────────────────────────────────────────────────────
  const handleFollow = useCallback(() => {
    setFollowing(true);
    if (!mapRef.current || !entregadorLocation) return;
    mapRef.current.panTo([entregadorLocation.lat, entregadorLocation.lng], { animate: true });
  }, [entregadorLocation]);

  const isFinished = deliveryStatus === 'entregue' || deliveryStatus === 'cancelado';
  const statusCfg = deliveryStatus ? STATUS_CONFIG[deliveryStatus] : null;
  const stepIcon = currentStep ? (STEP_ICONS[currentStep.modifier ?? ''] ?? '↑') : '↑';
  const isUrgent = (distanceToStep ?? Infinity) < 80;

  // ── Overlay styles ────────────────────────────────────────────────────────
  const bg = isDark ? '#131836' : '#FFFFFF';
  const textPrimary = isDark ? '#FFFFFF' : '#000933';
  const textMuted = isDark ? '#6B7280' : '#9099B3';

  return (
    /*
     * zIndex: 0 creates an explicit stacking context for this container.
     * This scopes Leaflet's internal z-indices (200-700) inside the container,
     * preventing them from covering the parent's overlays (ActiveScreen's
     * progress card, bottom sheet etc. at z-index 20).
     */
    <div
      style={{ position: 'relative', flex: 1, overflow: 'hidden', zIndex: 0, ...(style as any) }}
    >
      {/* Map container — Leaflet mounts here */}
      <div
        id={mapId}
        style={{ position: 'absolute', inset: 0, background: isDark ? '#1C2340' : '#e8e0d8' }}
      />

      {/* ETA banner */}
      {!isFinished && etaSeconds != null && etaSeconds > 0 && (
        <div
          style={{
            position: 'absolute',
            top: 14,
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            background: bg,
            borderRadius: 99,
            padding: '10px 18px',
            boxShadow: '0 4px 16px rgba(0,0,0,.22)',
            zIndex: 500,
            whiteSpace: 'nowrap',
          }}
        >
          <span style={{ fontSize: 18, fontWeight: 800, color: textPrimary }}>
            {fmtEta(etaSeconds)}
          </span>
          {distanceRemaining != null && distanceRemaining > 0 && (
            <>
              <div style={{ width: 1, height: 18, background: isDark ? '#2E3555' : '#E4E7F1' }} />
              <span style={{ fontSize: 14, fontWeight: 600, color: textMuted }}>
                {fmtDist(distanceRemaining)}
              </span>
            </>
          )}
        </div>
      )}

      {/* Turn-by-turn step card */}
      {isNavigationMode && currentStep && (
        <div
          style={{
            position: 'absolute',
            top: 70,
            left: 14,
            right: 14,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            background: isUrgent ? '#F2760F' : isDark ? '#131836' : '#000933',
            borderRadius: 16,
            padding: 14,
            boxShadow: '0 6px 20px rgba(0,0,0,.4)',
            zIndex: 500,
          }}
        >
          <div
            style={{
              width: 46,
              height: 46,
              borderRadius: '50%',
              background: isUrgent ? 'rgba(255,255,255,0.25)' : '#209CEF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 22,
              color: '#fff',
              flexShrink: 0,
            }}
          >
            {stepIcon}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: 14,
                fontWeight: 700,
                color: '#fff',
                lineHeight: '19px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {currentStep.instruction}
            </div>
            {nextStep && (
              <div
                style={{
                  fontSize: 11,
                  color: 'rgba(255,255,255,0.6)',
                  marginTop: 2,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                Depois · {nextStep.instruction}
              </div>
            )}
          </div>
          <span style={{ fontSize: 16, fontWeight: 800, color: '#fff', flexShrink: 0 }}>
            {fmtDist(distanceToStep)}
          </span>
        </div>
      )}

      {/* Navigation stats bar */}
      {isNavigationMode && (
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            display: 'flex',
            alignItems: 'center',
            background: bg,
            padding: '12px 0 20px',
            boxShadow: '0 -4px 16px rgba(0,0,0,.12)',
            zIndex: 500,
          }}
        >
          {[
            { label: 'VELOCIDADE', value: `${Math.round(speedKmh)} km/h`, color: textPrimary },
            { label: 'CHEGADA', value: fmtEta(etaSeconds), color: '#F2760F' },
            { label: 'DISTÂNCIA', value: fmtDist(distanceRemaining), color: textPrimary },
          ].map((stat, i) => (
            <React.Fragment key={stat.label}>
              {i > 0 && (
                <div style={{ width: 1, height: 28, background: isDark ? '#2E3555' : '#E4E7F1' }} />
              )}
              <div style={{ flex: 1, textAlign: 'center' }}>
                <div
                  style={{
                    fontSize: 9,
                    fontWeight: 700,
                    color: textMuted,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                  }}
                >
                  {stat.label}
                </div>
                <div style={{ fontSize: 16, fontWeight: 800, color: stat.color, marginTop: 3 }}>
                  {stat.value}
                </div>
              </div>
            </React.Fragment>
          ))}
        </div>
      )}

      {/* Off-route banner */}
      {isOffRoute && (
        <div
          style={{
            position: 'absolute',
            top: 70,
            left: '50%',
            transform: 'translateX(-50%)',
            background: '#EF4444',
            borderRadius: 99,
            padding: '7px 14px',
            zIndex: 500,
            whiteSpace: 'nowrap',
          }}
        >
          <span style={{ fontSize: 12, fontWeight: 700, color: '#fff' }}>
            ↺ Recalculando rota...
          </span>
        </div>
      )}

      {/* Status badge */}
      {statusCfg && (
        <div
          style={{
            position: 'absolute',
            bottom: isNavigationMode ? 90 : 24,
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            alignItems: 'center',
            gap: 7,
            background: bg,
            border: `1.5px solid ${statusCfg.color}`,
            borderRadius: 99,
            padding: '8px 14px',
            boxShadow: '0 3px 10px rgba(0,0,0,.15)',
            zIndex: 500,
            whiteSpace: 'nowrap',
          }}
        >
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: statusCfg.color }} />
          <span style={{ fontSize: 12.5, fontWeight: 700, color: statusCfg.color }}>
            {statusCfg.label}
          </span>
        </div>
      )}

      {/* FAB: follow */}
      {!following && (
        <button
          onClick={handleFollow}
          style={{
            position: 'absolute',
            bottom: isNavigationMode ? 100 : 70,
            right: 16,
            width: 46,
            height: 46,
            borderRadius: '50%',
            background: bg,
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 5px 16px rgba(0,0,0,.25)',
            fontSize: 22,
            color: isDark ? '#fff' : '#209CEF',
            zIndex: 500,
          }}
        >
          ⊕
        </button>
      )}

      {/* FAB: fit route (overview mode) */}
      {!isNavigationMode && entregadorLocation && destination && (
        <button
          onClick={fitRoute}
          style={{
            position: 'absolute',
            bottom: 126,
            right: 16,
            width: 42,
            height: 42,
            borderRadius: '50%',
            background: bg,
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(0,0,0,.2)',
            fontSize: 18,
            color: isDark ? '#fff' : '#000933',
            zIndex: 500,
          }}
        >
          ⊞
        </button>
      )}
    </div>
  );
}
