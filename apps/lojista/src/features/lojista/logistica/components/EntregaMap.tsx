import React, { useRef, useEffect, useMemo } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { Map, Camera, Marker, type CameraRef } from '@maplibre/maplibre-react-native';
import { rasterStyle, deltaToZoom, TILE_OSM } from '@ajulabs/maps';

const ARACAJU = { lat: -10.9167, lng: -37.05 };
const DELTA = 0.015;
const ZOOM = deltaToZoom(DELTA);

interface Props {
  entregadorLocation: { lat: number; lng: number; heading?: number; speedKmh?: number } | null;
}

export function EntregaMap({ entregadorLocation }: Props) {
  const cameraRef = useRef<CameraRef>(null);
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const mapStyle = useMemo(() => rasterStyle(TILE_OSM, 256), []);

  useEffect(() => {
    Animated.timing(rotateAnim, {
      toValue: entregadorLocation?.heading ?? 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [entregadorLocation?.heading]);

  useEffect(() => {
    if (!entregadorLocation || !cameraRef.current) return;
    cameraRef.current.easeTo({
      center: [entregadorLocation.lng, entregadorLocation.lat],
      zoom: ZOOM,
      duration: 400,
    });
  }, [entregadorLocation?.lat, entregadorLocation?.lng]);

  const center = entregadorLocation ?? ARACAJU;
  const spin = rotateAnim.interpolate({
    inputRange: [0, 360],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Map
      style={StyleSheet.absoluteFillObject}
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
          <Animated.View style={[styles.markerWrap, { transform: [{ rotate: spin }] }]}>
            <View style={styles.marker} />
          </Animated.View>
        </Marker>
      )}
    </Map>
  );
}

const styles = StyleSheet.create({
  markerWrap: { width: 28, height: 28, alignItems: 'center', justifyContent: 'center' },
  marker: {
    width: 22,
    height: 22,
    backgroundColor: '#DE6708',
    borderRadius: 11,
    borderBottomRightRadius: 2,
    borderWidth: 3,
    borderColor: '#fff',
    elevation: 6,
  },
});
