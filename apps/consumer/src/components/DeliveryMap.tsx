import React, { useRef, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import MapView, { Marker, UrlTile, PROVIDER_DEFAULT } from 'react-native-maps';

interface DeliveryMapProps {
  entregadorLocation: { lat: number; lng: number } | null;
  destinoLocation: { lat: number; lng: number } | null;
  style?: object;
}

const DELTA = 0.018;
const ARACAJU = { latitude: -10.9167, longitude: -37.05 };

export function DeliveryMap({ entregadorLocation, destinoLocation, style }: DeliveryMapProps) {
  const mapRef = useRef<MapView>(null);

  const center = entregadorLocation
    ? { latitude: entregadorLocation.lat, longitude: entregadorLocation.lng }
    : destinoLocation
      ? { latitude: destinoLocation.lat, longitude: destinoLocation.lng }
      : ARACAJU;

  useEffect(() => {
    if (!entregadorLocation || !mapRef.current) return;
    mapRef.current.animateToRegion(
      { latitude: entregadorLocation.lat, longitude: entregadorLocation.lng, latitudeDelta: DELTA, longitudeDelta: DELTA },
      500
    );
  }, [entregadorLocation?.lat, entregadorLocation?.lng]);

  return (
    <MapView
      ref={mapRef}
      provider={PROVIDER_DEFAULT}
      style={[styles.map, style]}
      mapType="none"
      initialRegion={{ ...center, latitudeDelta: DELTA, longitudeDelta: DELTA }}
      showsCompass={false}
      showsScale={false}
    >
      <UrlTile urlTemplate="https://a.tile.openstreetmap.org/{z}/{x}/{y}.png" maximumZ={19} flipY={false} />

      {entregadorLocation && (
        <Marker
          coordinate={{ latitude: entregadorLocation.lat, longitude: entregadorLocation.lng }}
          anchor={{ x: 0.5, y: 0.5 }}
          tracksViewChanges={false}
          title="Entregador"
        >
          <View style={styles.entregadorDot} />
        </Marker>
      )}

      {destinoLocation && (
        <Marker
          coordinate={{ latitude: destinoLocation.lat, longitude: destinoLocation.lng }}
          anchor={{ x: 0.5, y: 0.5 }}
          tracksViewChanges={false}
          title="Destino"
        >
          <View style={styles.destinoDot} />
        </Marker>
      )}
    </MapView>
  );
}

const styles = StyleSheet.create({
  map: { flex: 1 },
  entregadorDot: {
    width: 18, height: 18,
    backgroundColor: '#209CEF',
    borderRadius: 9,
    borderWidth: 3,
    borderColor: '#fff',
  },
  destinoDot: {
    width: 14, height: 14,
    backgroundColor: '#F2760F',
    borderRadius: 7,
    borderWidth: 3,
    borderColor: '#fff',
  },
});
