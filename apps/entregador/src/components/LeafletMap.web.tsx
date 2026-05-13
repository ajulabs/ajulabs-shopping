/// <reference lib="dom" />
import React, { useRef, useEffect, useId } from 'react';

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
  style?: object;
}

function loadLeaflet(cb: () => void) {
  if ((window as any).L) { cb(); return; }
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

async function fetchOsrmSimple(from: { lat: number; lng: number }, to: { lat: number; lng: number }): Promise<[number, number][]> {
  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${from.lng},${from.lat};${to.lng},${to.lat}?overview=full&geometries=geojson`;
    const res = await fetch(url);
    const data = await res.json();
    const coords: number[][] = data.routes?.[0]?.geometry?.coordinates ?? [];
    return coords.map(c => [c[1], c[0]]);
  } catch { return []; }
}

function buildUserMarkerHtml(heading: number): string {
  // Arrow pointing in direction of travel
  return `
    <div style="
      position:relative;
      width:28px;height:28px;
      display:flex;align-items:center;justify-content:center;
    ">
      <div style="
        width:22px;height:22px;
        background:#209CEF;
        border:3px solid #fff;
        border-radius:50% 50% 50% 0;
        box-shadow:0 2px 10px rgba(0,0,0,.5);
        transform:rotate(${heading - 45}deg);
      "></div>
    </div>`;
}

export function LeafletMap({
  center, zoom = 15, userLocation, markers = [],
  routeCoords, routeTo, heading = 0, style,
}: LeafletMapProps) {
  const uid    = useId().replace(/:/g, '');
  const mapId  = `lmap-${uid}`;
  const mapRef            = useRef<any>(null);
  const userMarkerRef     = useRef<any>(null);
  const routePolylineRef  = useRef<any>(null);
  const lastRouteKeyRef   = useRef('');

  // ── Init map ─────────────────────────────────────────────
  useEffect(() => {
    loadLeaflet(() => {
      const el = document.getElementById(mapId);
      if (!el || mapRef.current) return;

      const L = (window as any).L;
      const map = L.map(el, { zoomControl: true, attributionControl: false })
        .setView([center.lat, center.lng], zoom);
      setTimeout(() => map.invalidateSize(), 100);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(map);

      // User (entregador) marker — directional arrow
      const icon = L.divIcon({
        className: '',
        html: buildUserMarkerHtml(0),
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });
      userMarkerRef.current = L.marker([center.lat, center.lng], { icon, zIndexOffset: 1000 }).addTo(map);

      // Static markers (loja, cliente)
      markers.forEach((m) => {
        L.circleMarker([m.lat, m.lng], {
          radius: 10, color: '#fff', weight: 2.5, fillColor: m.color, fillOpacity: 1,
        }).addTo(map);
      });

      mapRef.current = map;
    });

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
      routePolylineRef.current = null;
    };
  }, []);

  // ── Move & rotate user marker ─────────────────────────────
  useEffect(() => {
    if (!mapRef.current || !userLocation || !userMarkerRef.current) return;
    const L = (window as any).L;
    if (!L) return;

    userMarkerRef.current.setLatLng([userLocation.lat, userLocation.lng]);

    // Update icon rotation
    const icon = L.divIcon({
      className: '',
      html: buildUserMarkerHtml(heading),
      iconSize: [28, 28],
      iconAnchor: [14, 14],
    });
    userMarkerRef.current.setIcon(icon);

    // Auto-follow (smooth pan without changing zoom)
    mapRef.current.panTo([userLocation.lat, userLocation.lng], { animate: true, duration: 0.5 });
  }, [userLocation?.lat, userLocation?.lng, heading]);

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

    const latLngs: [number, number][] = routeCoords.map(c => [c.lat, c.lng]);

    if (routePolylineRef.current) {
      routePolylineRef.current.setLatLngs(latLngs);
    } else {
      routePolylineRef.current = L.polyline(latLngs, {
        color: '#209CEF', weight: 5, opacity: 0.85,
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

    fetchOsrmSimple(userLocation, routeTo).then(latLngs => {
      if (!mapRef.current || latLngs.length < 2) return;
      const L = (window as any).L;
      if (!L) return;
      if (routePolylineRef.current) {
        routePolylineRef.current.setLatLngs(latLngs);
      } else {
        routePolylineRef.current = L.polyline(latLngs, {
          color: '#209CEF', weight: 5, opacity: 0.85,
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
        top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: '#1C2340',
        pointerEvents: 'auto',
        zIndex: 0,
      }}
    />
  );
}
