/// <reference lib="dom" />
import React, { useRef, useEffect, useId } from 'react';

interface LocationPickerMapProps {
  lat: number;
  lng: number;
  onLocationChange?: (lat: number, lng: number) => void;
  style?: React.CSSProperties;
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

const PIN_HTML = `
  <div style="
    width:24px;height:24px;
    background:#F2760F;
    border:3px solid #fff;
    border-radius:50% 50% 50% 0;
    box-shadow:0 2px 10px rgba(0,0,0,.4);
    transform:rotate(-45deg);
    cursor:grab;
  "></div>`;

export function LocationPickerMap({ lat, lng, onLocationChange, style }: LocationPickerMapProps) {
  const uid = useId().replace(/:/g, '');
  const mapId = `lpmap-${uid}`;
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);

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
        [lat, lng],
        17,
      );

      sizeTimer = setTimeout(() => {
        if (!cancelled && mapRef.current) map.invalidateSize();
      }, 150);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(map);

      const icon = L.divIcon({
        className: '',
        html: PIN_HTML,
        iconSize: [24, 24],
        iconAnchor: [12, 24],
      });
      const marker = L.marker([lat, lng], { icon, draggable: true }).addTo(map);

      marker.on('dragend', () => {
        const pos = marker.getLatLng();
        onLocationChange?.(pos.lat, pos.lng);
      });

      markerRef.current = marker;
      mapRef.current = map;
    });

    return () => {
      cancelled = true;
      if (sizeTimer !== null) clearTimeout(sizeTimer);
      mapRef.current?.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
  }, []);

  // ── Sync pin when lat/lng prop changes ────────────────────
  useEffect(() => {
    if (!mapRef.current || !markerRef.current) return;
    markerRef.current.setLatLng([lat, lng]);
    mapRef.current.setView([lat, lng], 17, { animate: true });
  }, [lat, lng]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', ...style }}>
      <div
        id={mapId}
        style={{
          width: '100%',
          height: '100%',
          backgroundColor: '#e8f4f8',
          borderRadius: 'inherit',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: 10,
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(0,0,0,0.55)',
          color: '#fff',
          fontSize: 11,
          fontWeight: 500,
          padding: '4px 12px',
          borderRadius: 99,
          pointerEvents: 'none',
          whiteSpace: 'nowrap',
        }}
      >
        Arraste o marcador para ajustar
      </div>
    </div>
  );
}
