/// <reference lib="dom" />
import React, { useRef, useEffect, useId } from 'react';

const ARACAJU = { lat: -10.9167, lng: -37.05 };

interface Props {
  entregadorLocation: { lat: number; lng: number; heading?: number; speedKmh?: number } | null;
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

function buildMarkerHtml(heading: number): string {
  return `<div style="
    width:22px;height:22px;
    background:#DE6708;
    border:3px solid #fff;
    border-radius:50% 50% 50% 0;
    box-shadow:0 2px 10px rgba(0,0,0,.5);
    transform:rotate(${heading - 45}deg);
  "></div>`;
}

export function EntregaMap({ entregadorLocation }: Props) {
  const uid = useId().replace(/:/g, '');
  const mapId = `emap-${uid}`;
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);

  useEffect(() => {
    loadLeaflet(() => {
      const el = document.getElementById(mapId);
      if (!el || mapRef.current) return;
      const L = (window as any).L;
      const center = entregadorLocation ?? ARACAJU;
      const map = L.map(el, { zoomControl: true, attributionControl: false }).setView(
        [center.lat, center.lng],
        15,
      );
      setTimeout(() => map.invalidateSize(), 100);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(map);

      const icon = L.divIcon({
        className: '',
        html: buildMarkerHtml(entregadorLocation?.heading ?? 0),
        iconSize: [22, 22],
        iconAnchor: [11, 11],
      });
      markerRef.current = L.marker([center.lat, center.lng], { icon }).addTo(map);
      mapRef.current = map;
    });

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!mapRef.current || !entregadorLocation || !markerRef.current) return;
    const L = (window as any).L;
    if (!L) return;
    markerRef.current.setLatLng([entregadorLocation.lat, entregadorLocation.lng]);
    markerRef.current.setIcon(
      L.divIcon({
        className: '',
        html: buildMarkerHtml(entregadorLocation.heading ?? 0),
        iconSize: [22, 22],
        iconAnchor: [11, 11],
      }),
    );
    mapRef.current.panTo([entregadorLocation.lat, entregadorLocation.lng], {
      animate: true,
      duration: 0.5,
    });
  }, [entregadorLocation?.lat, entregadorLocation?.lng, entregadorLocation?.heading]);

  return (
    <div
      id={mapId}
      style={{ position: 'absolute', inset: 0, backgroundColor: '#1C2340', zIndex: 0 }}
    />
  );
}
