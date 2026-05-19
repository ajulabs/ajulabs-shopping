/// <reference lib="dom" />
import React, { useRef, useEffect, useId } from 'react';

interface DeliveryMapProps {
  entregadorLocation: { lat: number; lng: number } | null;
  destinoLocation: { lat: number; lng: number } | null;
  style?: React.CSSProperties;
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

const ARACAJU = [-10.9167, -37.05];

export function DeliveryMap({ entregadorLocation, destinoLocation, style }: DeliveryMapProps) {
  const uid = useId().replace(/:/g, '');
  const mapId = `dmap-${uid}`;
  const mapRef = useRef<any>(null);
  const entregadorMarkerRef = useRef<any>(null);
  const destinoMarkerRef = useRef<any>(null);

  useEffect(() => {
    loadLeaflet(() => {
      const el = document.getElementById(mapId);
      if (!el || mapRef.current) return;

      const L = (window as any).L;
      const center = entregadorLocation
        ? [entregadorLocation.lat, entregadorLocation.lng]
        : destinoLocation
          ? [destinoLocation.lat, destinoLocation.lng]
          : ARACAJU;

      const map = L.map(el, { zoomControl: false, attributionControl: false })
        .setView(center, 14);
      setTimeout(() => map.invalidateSize(), 100);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(map);

      const entregadorIcon = L.divIcon({
        className: '',
        html: `<div style="
          width:18px;height:18px;
          background:#209CEF;
          border:3px solid #fff;
          border-radius:50%;
          box-shadow:0 2px 8px rgba(0,0,0,.5);
          position:relative;
        "><div style="
          position:absolute;top:-6px;left:50%;transform:translateX(-50%);
          background:#209CEF;color:#fff;
          font-size:9px;font-weight:700;white-space:nowrap;
          padding:2px 4px;border-radius:4px;
        ">Entregador</div></div>`,
        iconSize: [18, 18],
        iconAnchor: [9, 9],
      });

      if (entregadorLocation) {
        entregadorMarkerRef.current = L.marker(
          [entregadorLocation.lat, entregadorLocation.lng],
          { icon: entregadorIcon, zIndexOffset: 1000 }
        ).addTo(map);
      }

      if (destinoLocation) {
        const destinoIcon = L.divIcon({
          className: '',
          html: '<div style="width:14px;height:14px;background:#F2760F;border:3px solid #fff;border-radius:50%;box-shadow:0 2px 8px rgba(0,0,0,.5)"></div>',
          iconSize: [14, 14],
          iconAnchor: [7, 7],
        });
        destinoMarkerRef.current = L.marker(
          [destinoLocation.lat, destinoLocation.lng],
          { icon: destinoIcon }
        ).addTo(map);
      }

      mapRef.current = map;
    });

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
      entregadorMarkerRef.current = null;
      destinoMarkerRef.current = null;
    };
  }, []);

  // Update / add entregador marker
  useEffect(() => {
    if (!mapRef.current) return;
    const L = (window as any).L;
    if (!L) return;

    if (!entregadorLocation) return;

    if (entregadorMarkerRef.current) {
      entregadorMarkerRef.current.setLatLng([entregadorLocation.lat, entregadorLocation.lng]);
    } else {
      const entregadorIcon = L.divIcon({
        className: '',
        html: `<div style="
          width:22px;height:22px;
          background:#209CEF;
          border:3px solid #fff;
          border-radius:50% 50% 50% 0;
          box-shadow:0 2px 10px rgba(0,0,0,.5);
          transform:rotate(-45deg);
        "></div>`,
        iconSize: [22, 22],
        iconAnchor: [11, 11],
      });
      entregadorMarkerRef.current = L.marker(
        [entregadorLocation.lat, entregadorLocation.lng],
        { icon: entregadorIcon, zIndexOffset: 1000 }
      ).addTo(mapRef.current);
    }

    mapRef.current.panTo(
      [entregadorLocation.lat, entregadorLocation.lng],
      { animate: true, duration: 0.5 }
    );
  }, [entregadorLocation?.lat, entregadorLocation?.lng]);

  // Update / add destino marker when geocoding completes
  useEffect(() => {
    if (!mapRef.current || !destinoLocation) return;
    const L = (window as any).L;
    if (!L) return;

    if (destinoMarkerRef.current) return; // already plotted in init

    const destinoIcon = L.divIcon({
      className: '',
      html: '<div style="width:14px;height:14px;background:#F2760F;border:3px solid #fff;border-radius:50%;box-shadow:0 2px 8px rgba(0,0,0,.5)"></div>',
      iconSize: [14, 14],
      iconAnchor: [7, 7],
    });
    destinoMarkerRef.current = L.marker(
      [destinoLocation.lat, destinoLocation.lng],
      { icon: destinoIcon }
    ).addTo(mapRef.current);

    if (!entregadorLocation) {
      mapRef.current.setView([destinoLocation.lat, destinoLocation.lng], 14, { animate: true });
    }
  }, [destinoLocation?.lat, destinoLocation?.lng]);

  return (
    <div
      id={mapId}
      style={{
        width: '100%',
        height: '100%',
        backgroundColor: '#e8f4f8',
        pointerEvents: 'auto',
        ...style,
      }}
    />
  );
}
