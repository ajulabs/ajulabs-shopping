import React, { useRef, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, NativeSyntheticEvent } from 'react-native';
import {
  Map,
  Camera,
  ViewAnnotation,
  type CameraRef,
  type ViewAnnotationEvent,
} from '@maplibre/maplibre-react-native';
import { rasterStyle, deltaToZoom, TILE_OSM } from '@ajulabs/maps';

interface LocationPickerMapProps {
  lat: number;
  lng: number;
  onLocationChange?: (lat: number, lng: number) => void;
  style?: any;
}

const DELTA = 0.003;
const ZOOM = deltaToZoom(DELTA);

export function LocationPickerMap({ lat, lng, onLocationChange, style }: LocationPickerMapProps) {
  const cameraRef = useRef<CameraRef>(null);
  const mapStyle = useMemo(() => rasterStyle(TILE_OSM, 256), []);

  useEffect(() => {
    cameraRef.current?.easeTo({ center: [lng, lat], zoom: ZOOM, duration: 300 });
  }, [lat, lng]);

  const handleDragEnd = (e: NativeSyntheticEvent<ViewAnnotationEvent>) => {
    const [newLng, newLat] = e.nativeEvent.lngLat;
    onLocationChange?.(newLat, newLng);
  };

  return (
    <View style={[styles.container, style]}>
      <Map
        style={styles.map}
        mapStyle={mapStyle}
        compass={false}
        attribution={false}
        logo={false}
        scaleBar={false}
      >
        <Camera ref={cameraRef} initialViewState={{ center: [lng, lat], zoom: ZOOM }} />
        <ViewAnnotation lngLat={[lng, lat]} anchor="bottom" draggable onDragEnd={handleDragEnd}>
          <View style={styles.pinWrap}>
            <View style={styles.pin} />
            <View style={styles.pinTail} />
          </View>
        </ViewAnnotation>
      </Map>
      <View style={styles.hint} pointerEvents="none">
        <Text style={styles.hintText}>Arraste o marcador para ajustar</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { position: 'relative', overflow: 'hidden', borderRadius: 12 },
  map: { flex: 1 },
  pinWrap: { alignItems: 'center' },
  pin: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#F2760F',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    elevation: 6,
  },
  pinTail: {
    width: 0,
    height: 0,
    borderLeftWidth: 5,
    borderRightWidth: 5,
    borderTopWidth: 9,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#F2760F',
    marginTop: -1,
  },
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
