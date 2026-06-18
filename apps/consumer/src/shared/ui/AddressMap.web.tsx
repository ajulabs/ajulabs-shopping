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

const ARACAJU = [-10.9167, -37.05];

async function geocode(address: string): Promise<[number, number] | null> {
  try {
    const q = encodeURIComponent(`${address}, Aracaju, SE, Brasil`);
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${q}&format=json&limit=1`,
      { headers: { 'User-Agent': 'AjuLabs-Consumer/1.0' } },
    );
    const data = await res.json();
    if (data.length > 0) return [parseFloat(data[0].lat), parseFloat(data[0].lon)];
  } catch {}
  return null;
}

export function AddressMap({ address, style, zoom = 15 }: AddressMapProps) {
  const uid = useId().replace(/:/g, '');
  const mapId = `amap-${uid}`;
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!address) return;
    setLoading(true);
    setNotFound(false);

    loadLeaflet(async () => {
      const coords = await geocode(address);
      setLoading(false);

      const el = document.getElementById(mapId);
      if (!el) return;

      if (!coords) {
        setNotFound(true);
        return;
      }

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
      {notFound && !loading && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#F6F7FB',
            borderRadius: 'inherit',
            gap: 6,
          }}
        >
          <div style={{ fontSize: 20 }}>📍</div>
          <div style={{ fontSize: 12, color: '#9099B3' }}>Endereço não localizado</div>
        </div>
      )}
    </div>
  );
}
