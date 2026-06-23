/// <reference lib="dom" />
import React, { useRef, useEffect, useId } from 'react';

// URL do PNG do entregador servido pela pasta public/ do app (raiz no web).
const ENTREGADOR_ICON_URL = '/entregador-marker.png';

export interface MapMarker {
  lat: number;
  lng: number;
  color: string;
  label?: string;
}

interface LeafletMapProps {
  center: { lat: number; lng: number };
  zoom?: number;
  userLocation?: { lat: number; lng: number } | null;
  markers?: MapMarker[];
  /** Pre-computed route coords (from useNavigation). Takes priority over routeTo. */
  routeCoords?: { lat: number; lng: number }[];
  /** Fallback: fetch route internally from userLocation → routeTo (simple mode). */
  routeTo?: { lat: number; lng: number } | null;
  /** Heading in degrees (0 = north). Rotates the user marker. */
  heading?: number;
  centerTrigger?: number;
  style?: object;
}

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

async function fetchOsrmSimple(
  from: { lat: number; lng: number },
  to: { lat: number; lng: number },
): Promise<[number, number][]> {
  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${from.lng},${from.lat};${to.lng},${to.lat}?overview=full&geometries=geojson`;
    const res = await fetch(url);
    const data = await res.json();
    const coords: number[][] = data.routes?.[0]?.geometry?.coordinates ?? [];
    return coords.map((c) => [c[1], c[0]]);
  } catch {
    return [];
  }
}

function buildUserMarkerHtml(): string {
  // Ilustração do entregador (o mesmo PNG usado no nativo).
  return `<img src="${ENTREGADOR_ICON_URL}" style="width:55px;height:55px;object-fit:contain;display:block;" />`;
}

export function LeafletMap({
  center,
  zoom = 15,
  userLocation,
  markers = [],
  routeCoords,
  routeTo,
  heading = 0,
  centerTrigger = 0,
  style,
}: LeafletMapProps) {
  const uid = useId().replace(/:/g, '');
  const mapId = `lmap-${uid}`;
  const mapRef = useRef<any>(null);
  const userMarkerRef = useRef<any>(null);
  const routePolylineRef = useRef<any>(null);
  const lastRouteKeyRef = useRef('');

  // ── Init map ─────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    let sizeTimer: ReturnType<typeof setTimeout> | null = null;

    loadLeaflet(() => {
      if (cancelled) return;
      const el = document.getElementById(mapId);
      if (!el || mapRef.current) return;

      const L = (window as any).L;
      const map = L.map(el, { zoomControl: true, attributionControl: false }).setView(
        [center.lat, center.lng],
        zoom,
      );

      // Guard: only call invalidateSize if the map hasn't been removed yet
      sizeTimer = setTimeout(() => {
        if (!cancelled && mapRef.current) map.invalidateSize();
      }, 150);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(map);

      // User (entregador) marker — scooter icon
      const icon = L.divIcon({
        className: '',
        html: buildUserMarkerHtml(),
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });
      userMarkerRef.current = L.marker([center.lat, center.lng], {
        icon,
        zIndexOffset: 1000,
      }).addTo(map);

      // Static markers (loja, cliente)
      markers.forEach((m) => {
        L.circleMarker([m.lat, m.lng], {
          radius: 10,
          color: '#fff',
          weight: 2.5,
          fillColor: m.color,
          fillOpacity: 1,
        }).addTo(map);
      });

      mapRef.current = map;
    });

    return () => {
      cancelled = true;
      if (sizeTimer !== null) clearTimeout(sizeTimer);
      mapRef.current?.remove();
      mapRef.current = null;
      userMarkerRef.current = null;
      routePolylineRef.current = null;
    };
  }, []);

  // ── Move & rotate user marker ─────────────────────────────
  useEffect(() => {
    if (!mapRef.current || !userLocation || !userMarkerRef.current) return;
    const L = (window as any).L;
    if (!L) return;

    userMarkerRef.current.setLatLng([userLocation.lat, userLocation.lng]);

    // Atualiza o ícone (mantém o marcador sincronizado)
    const icon = L.divIcon({
      className: '',
      html: buildUserMarkerHtml(),
      iconSize: [55, 55],
      iconAnchor: [28, 28],
    });
    userMarkerRef.current.setIcon(icon);

    // Auto-follow (smooth pan without changing zoom)
    mapRef.current.panTo([userLocation.lat, userLocation.lng], { animate: true, duration: 0.5 });
  }, [userLocation?.lat, userLocation?.lng, heading]);

  useEffect(() => {
    if (!mapRef.current || !userLocation || centerTrigger === 0) return;
    mapRef.current.setView([userLocation.lat, userLocation.lng], 17, { animate: true });
  }, [centerTrigger]);

  // ── Draw route from pre-computed coords ───────────────────
  useEffect(() => {
    if (!mapRef.current) return;
    const L = (window as any).L;
    if (!L) return;

    if (!routeCoords || routeCoords.length < 2) {
      routePolylineRef.current?.remove();
      routePolylineRef.current = null;
      return;
    }

    const latLngs: [number, number][] = routeCoords.map((c) => [c.lat, c.lng]);

    if (routePolylineRef.current) {
      routePolylineRef.current.setLatLngs(latLngs);
    } else {
      routePolylineRef.current = L.polyline(latLngs, {
        color: '#209CEF',
        weight: 5,
        opacity: 0.85,
      }).addTo(mapRef.current);
      routePolylineRef.current.bringToBack();
    }
  }, [routeCoords]);

  // ── Fallback: fetch route internally when routeTo set and no routeCoords ──
  useEffect(() => {
    if (!userLocation || !routeTo || (routeCoords && routeCoords.length > 0)) return;
    if (!mapRef.current) return;

    const key = `${userLocation.lat.toFixed(3)},${userLocation.lng.toFixed(3)}->${routeTo.lat},${routeTo.lng}`;
    if (key === lastRouteKeyRef.current) return;
    lastRouteKeyRef.current = key;

    fetchOsrmSimple(userLocation, routeTo).then((latLngs) => {
      if (!mapRef.current || latLngs.length < 2) return;
      const L = (window as any).L;
      if (!L) return;
      if (routePolylineRef.current) {
        routePolylineRef.current.setLatLngs(latLngs);
      } else {
        routePolylineRef.current = L.polyline(latLngs, {
          color: '#209CEF',
          weight: 5,
          opacity: 0.85,
        }).addTo(mapRef.current);
        routePolylineRef.current.bringToBack();
      }
    });
  }, [
    userLocation ? Math.round(userLocation.lat * 1000) : null,
    userLocation ? Math.round(userLocation.lng * 1000) : null,
    routeTo?.lat,
    routeTo?.lng,
  ]);

  return (
    <div
      id={mapId}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: '#1C2340',
        pointerEvents: 'auto',
        zIndex: 0,
      }}
    />
  );
}
