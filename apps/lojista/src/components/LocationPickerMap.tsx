import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import MapView, { Marker, PROVIDER_DEFAULT, UrlTile } from 'react-native-maps';

interface LocationPickerMapProps {
  lat: number;
  lng: number;
  onLocationChange?: (lat: number, lng: number) => void;
  style?: any;
}

const DELTA = 0.003;

export function LocationPickerMap({ lat, lng, onLocationChange, style }: LocationPickerMapProps) {
  const mapRef = useRef<MapView>(null);

  useEffect(() => {
    mapRef.current?.animateToRegion(
      { latitude: lat, longitude: lng, latitudeDelta: DELTA, longitudeDelta: DELTA },
      300,
    );
  }, [lat, lng]);

  return (
    <View style={[styles.container, style]}>
      <MapView
        ref={mapRef}
        provider={PROVIDER_DEFAULT}
        style={styles.map}
        mapType="none"
        initialRegion={{
          latitude: lat,
          longitude: lng,
          latitudeDelta: DELTA,
          longitudeDelta: DELTA,
        }}
        showsCompass={false}
        showsScale={false}
      >
        <UrlTile
          urlTemplate="https://a.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maximumZ={19}
          flipY={false}
        />
        <Marker
          coordinate={{ latitude: lat, longitude: lng }}
          draggable
          onDragEnd={(e) => {
            const { latitude, longitude } = e.nativeEvent.coordinate;
            onLocationChange?.(latitude, longitude);
          }}
          anchor={{ x: 0.5, y: 1 }}
        />
      </MapView>
      <View style={styles.hint} pointerEvents="none">
        <Text style={styles.hintText}>Arraste o marcador para ajustar</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { position: 'relative', overflow: 'hidden', borderRadius: 12 },
  map: { flex: 1 },
  hint: {
    position: 'absolute',
    bottom: 10,
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 99,
  },
  hintText: { color: '#fff', fontSize: 11, fontWeight: '500' },
});
