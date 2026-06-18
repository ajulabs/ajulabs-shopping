import React, { useRef, useEffect, useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { Map, Camera, Marker, type CameraRef } from '@maplibre/maplibre-react-native';
import { rasterStyle, deltaToZoom, TILE_OSM } from '@ajulabs/maps';

interface DeliveryMapProps {
  entregadorLocation: { lat: number; lng: number } | null;
  destinoLocation: { lat: number; lng: number } | null;
  style?: object;
}

const DELTA = 0.018;
const ZOOM = deltaToZoom(DELTA);
const ARACAJU = { lat: -10.9167, lng: -37.05 };

export function DeliveryMap({ entregadorLocation, destinoLocation, style }: DeliveryMapProps) {
  const cameraRef = useRef<CameraRef>(null);
  const mapStyle = useMemo(() => rasterStyle(TILE_OSM, 256), []);

  const center = entregadorLocation ?? destinoLocation ?? ARACAJU;

  useEffect(() => {
    if (!entregadorLocation || !cameraRef.current) return;
    cameraRef.current.easeTo({
      center: [entregadorLocation.lng, entregadorLocation.lat],
      zoom: ZOOM,
      duration: 500,
    });
  }, [entregadorLocation?.lat, entregadorLocation?.lng]);

  return (
    <Map
      style={[styles.map, style]}
      mapStyle={mapStyle}
      compass={false}
      attribution={false}
      logo={false}
      scaleBar={false}
    >
      <Camera ref={cameraRef} initialViewState={{ center: [center.lng, center.lat], zoom: ZOOM }} />

      {entregadorLocation && (
        <Marker
          id="entregador"
          lngLat={[entregadorLocation.lng, entregadorLocation.lat]}
          anchor="center"
        >
          <View style={styles.entregadorDot} />
        </Marker>
      )}

      {destinoLocation && (
        <Marker id="destino" lngLat={[destinoLocation.lng, destinoLocation.lat]} anchor="center">
          <View style={styles.destinoDot} />
        </Marker>
      )}
    </Map>
  );
}

const styles = StyleSheet.create({
  map: { flex: 1 },
  entregadorDot: {
    width: 18,
    height: 18,
    backgroundColor: '#209CEF',
    borderRadius: 9,
    borderWidth: 3,
    borderColor: '#fff',
  },
  destinoDot: {
    width: 14,
    height: 14,
    backgroundColor: '#F2760F',
    borderRadius: 7,
    borderWidth: 3,
    borderColor: '#fff',
  },
});
