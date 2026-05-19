import React, { useRef, useEffect } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import MapView, { UrlTile, Marker, PROVIDER_DEFAULT } from 'react-native-maps';

const ARACAJU = { lat: -10.9167, lng: -37.0500 };
const DELTA = 0.015;

interface Props {
  entregadorLocation: { lat: number; lng: number; heading?: number; speedKmh?: number } | null;
}

export function EntregaMap({ entregadorLocation }: Props) {
  const mapRef = useRef<MapView>(null);
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(rotateAnim, {
      toValue: entregadorLocation?.heading ?? 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [entregadorLocation?.heading]);

  useEffect(() => {
    if (!entregadorLocation || !mapRef.current) return;
    mapRef.current.animateToRegion(
      { latitude: entregadorLocation.lat, longitude: entregadorLocation.lng, latitudeDelta: DELTA, longitudeDelta: DELTA },
      400
    );
  }, [entregadorLocation?.lat, entregadorLocation?.lng]);

  const center = entregadorLocation ?? ARACAJU;
  const spin = rotateAnim.interpolate({
    inputRange: [0, 360],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <MapView
      ref={mapRef}
      provider={PROVIDER_DEFAULT}
      style={StyleSheet.absoluteFillObject}
      mapType="none"
      initialRegion={{ latitude: center.lat, longitude: center.lng, latitudeDelta: DELTA, longitudeDelta: DELTA }}
      showsCompass={false}
    >
      <UrlTile urlTemplate="https://a.tile.openstreetmap.org/{z}/{x}/{y}.png" maximumZ={19} flipY={false} />

      {entregadorLocation && (
        <Marker
          coordinate={{ latitude: entregadorLocation.lat, longitude: entregadorLocation.lng }}
          anchor={{ x: 0.5, y: 0.5 }}
          tracksViewChanges={true}
        >
          <Animated.View style={[styles.markerWrap, { transform: [{ rotate: spin }] }]}>
            <View style={styles.marker} />
          </Animated.View>
        </Marker>
      )}
    </MapView>
  );
}

const styles = StyleSheet.create({
  markerWrap: { width: 28, height: 28, alignItems: 'center', justifyContent: 'center' },
  marker: {
    width: 22, height: 22,
    backgroundColor: '#DE6708',
    borderRadius: 11,
    borderBottomRightRadius: 2,
    borderWidth: 3,
    borderColor: '#fff',
    elevation: 6,
  },
});
