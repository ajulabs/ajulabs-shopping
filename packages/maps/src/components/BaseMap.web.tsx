/// <reference lib="dom" />
import React, { useRef, useEffect, useId } from 'react';

export interface MapMarker {
  lat: number;
  lng: number;
  color: string;
  label?: string;
}

export interface BaseMapProps {
  center: { lat: number; lng: number };
  zoom?: number;
  userLocation?: { lat: number; lng: number } | null;
  markers?: MapMarker[];
  routeCoords?: { lat: number; lng: number }[];
  routeTo?: { lat: number; lng: number } | null;
  heading?: number;
  showUserMarker?: boolean;
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

async function fetchOsrmSimpleWeb(from: { lat: number; lng: number }, to: { lat: number; lng: number }): Promise<[number, number][]> {
  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${from.lng},${from.lat};${to.lng},${to.lat}?overview=full&geometries=geojson`;
    const res = await fetch(url);
    const data = await res.json();
    const coords: number[][] = data.routes?.[0]?.geometry?.coordinates ?? [];
    return coords.map((c: number[]) => [c[1], c[0]]);
  } catch { return []; }
}

function buildUserMarkerHtml(heading: number): string {
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

export function BaseMap({
  center, zoom = 15, userLocation, markers = [],
  routeCoords, routeTo, heading = 0, showUserMarker = true,
}: BaseMapProps) {
  const uid   = useId().replace(/:/g, '');
  const mapId = `lmap-${uid}`;
  const mapRef           = useRef<any>(null);
  const userMarkerRef    = useRef<any>(null);
  const routePolyRef     = useRef<any>(null);
  const lastRouteKeyRef  = useRef('');

  useEffect(() => {
    loadLeaflet(() => {
      const el = document.getElementById(mapId);
      if (!el || mapRef.current) return;

      const L = (window as any).L;
      const map = L.map(el, { zoomControl: true, attributionControl: false })
        .setView([center.lat, center.lng], zoom);
      setTimeout(() => map.invalidateSize(), 100);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(map);

      if (showUserMarker) {
        const icon = L.divIcon({
          className: '',
          html: buildUserMarkerHtml(0),
          iconSize: [28, 28],
          iconAnchor: [14, 14],
        });
        userMarkerRef.current = L.marker([center.lat, center.lng], { icon, zIndexOffset: 1000 }).addTo(map);
      }

      markers.forEach((m) => {
        const markerIcon = m.label
          ? L.divIcon({
              className: '',
              html: `<div style="display:flex;flex-direction:column;align-items:center">
                <div style="width:14px;height:14px;background:${m.color};border:2.5px solid #fff;border-radius:50%;box-shadow:0 2px 6px rgba(0,0,0,.4)"></div>
                <span style="font-size:9px;font-weight:700;color:#fff;background:${m.color};padding:1px 4px;border-radius:4px;margin-top:2px;white-space:nowrap">${m.label}</span>
              </div>`,
              iconSize: [60, 36],
              iconAnchor: [30, 10],
            })
          : undefined;

        if (markerIcon) {
          L.marker([m.lat, m.lng], { icon: markerIcon }).addTo(map);
        } else {
          L.circleMarker([m.lat, m.lng], {
            radius: 10, color: '#fff', weight: 2.5, fillColor: m.color, fillOpacity: 1,
          }).addTo(map);
        }
      });

      mapRef.current = map;
    });

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
      routePolyRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!mapRef.current || !userLocation || !userMarkerRef.current) return;
    const L = (window as any).L;
    if (!L) return;
    userMarkerRef.current.setLatLng([userLocation.lat, userLocation.lng]);
    const icon = L.divIcon({
      className: '',
      html: buildUserMarkerHtml(heading),
      iconSize: [28, 28],
      iconAnchor: [14, 14],
    });
    userMarkerRef.current.setIcon(icon);
    mapRef.current.panTo([userLocation.lat, userLocation.lng], { animate: true, duration: 0.5 });
  }, [userLocation?.lat, userLocation?.lng, heading]);

  useEffect(() => {
    if (!mapRef.current) return;
    const L = (window as any).L;
    if (!L) return;

    if (!routeCoords || routeCoords.length < 2) {
      routePolyRef.current?.remove();
      routePolyRef.current = null;
      return;
    }

    const latLngs: [number, number][] = routeCoords.map(c => [c.lat, c.lng]);
    if (routePolyRef.current) {
      routePolyRef.current.setLatLngs(latLngs);
    } else {
      routePolyRef.current = L.polyline(latLngs, { color: '#209CEF', weight: 5, opacity: 0.85 }).addTo(mapRef.current);
      routePolyRef.current.bringToBack();
    }
  }, [routeCoords]);

  useEffect(() => {
    if (!userLocation || !routeTo || (routeCoords && routeCoords.length > 0)) return;
    if (!mapRef.current) return;

    const key = `${userLocation.lat.toFixed(3)},${userLocation.lng.toFixed(3)}->${routeTo.lat},${routeTo.lng}`;
    if (key === lastRouteKeyRef.current) return;
    lastRouteKeyRef.current = key;

    fetchOsrmSimpleWeb(userLocation, routeTo).then(latLngs => {
      if (!mapRef.current || latLngs.length < 2) return;
      const L = (window as any).L;
      if (!L) return;
      if (routePolyRef.current) {
        routePolyRef.current.setLatLngs(latLngs);
      } else {
        routePolyRef.current = L.polyline(latLngs, { color: '#209CEF', weight: 5, opacity: 0.85 }).addTo(mapRef.current);
        routePolyRef.current.bringToBack();
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
