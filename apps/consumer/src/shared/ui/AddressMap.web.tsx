/// <reference lib="dom" />
import React, { useRef, useEffect, useId, useState } from 'react';

interface AddressMapProps {
  address: string;
  style?: React.CSSProperties;
  zoom?: number;
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

const ARACAJU: [number, number] = [-10.9167, -37.05];

async function geocode(address: string): Promise<[number, number] | null> {
  // Tenta o endereço completo; se não achar, tenta só o bairro (parte após a
  // última vírgula) + cidade. Nominatim limita ~1 req/s e é sensível ao formato.
  const bairro = address.split(',').pop()?.trim();
  const queries = [
    `${address}, Aracaju, SE, Brasil`,
    ...(bairro && bairro !== address ? [`${bairro}, Aracaju, SE, Brasil`] : []),
  ];
  for (const q of queries) {
    try {
      // Sem header User-Agent: no browser é um header proibido e é ignorado/bloqueado.
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=1&countrycodes=br`,
      );
      const data = await res.json();
      if (data.length > 0) return [parseFloat(data[0].lat), parseFloat(data[0].lon)];
    } catch {}
  }
  return null;
}

export function AddressMap({ address, style, zoom = 15 }: AddressMapProps) {
  const uid = useId().replace(/:/g, '');
  const mapId = `amap-${uid}`;
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const [loading, setLoading] = useState(true);
  const [aproximado, setAproximado] = useState(false);

  useEffect(() => {
    if (!address) return;
    setLoading(true);
    setAproximado(false);

    loadLeaflet(async () => {
      const exato = await geocode(address);
      // Nunca deixa a preview "quebrada": sem ponto exato, centraliza em Aracaju
      // e sinaliza que a localização é aproximada.
      const coords = exato ?? ARACAJU;
      setAproximado(!exato);
      setLoading(false);

      const el = document.getElementById(mapId);
      if (!el) return;

      if (mapRef.current) {
        mapRef.current.setView(coords, zoom);
        if (markerRef.current) markerRef.current.setLatLng(coords);
        return;
      }

      const L = (window as any).L;
      const map = L.map(el, {
        zoomControl: false,
        attributionControl: false,
        dragging: false,
        scrollWheelZoom: false,
      }).setView(coords, zoom);
      setTimeout(() => map.invalidateSize(), 100);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(map);

      const icon = L.divIcon({
        className: '',
        html: `<div style="
          width:24px;height:24px;
          background:#F2760F;
          border:3px solid #fff;
          border-radius:50% 50% 50% 0;
          box-shadow:0 2px 10px rgba(0,0,0,.4);
          transform:rotate(-45deg);
        "></div>`,
        iconSize: [24, 24],
        iconAnchor: [12, 24],
      });

      markerRef.current = L.marker(coords, { icon }).addTo(map);
      mapRef.current = map;
    });

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
  }, [address]);

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
      {loading && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(248,249,252,0.85)',
            borderRadius: 'inherit',
          }}
        >
          <div style={{ fontSize: 12, color: '#9099B3' }}>Carregando mapa...</div>
        </div>
      )}
      {aproximado && !loading && (
        <div
          style={{
            position: 'absolute',
            top: 8,
            left: 8,
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            background: 'rgba(0,0,0,0.6)',
            color: '#fff',
            borderRadius: 8,
            padding: '4px 8px',
            fontSize: 11,
            fontWeight: 600,
          }}
        >
          📍 Localização aproximada
        </div>
      )}
    </div>
  );
}
