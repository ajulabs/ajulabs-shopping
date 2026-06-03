import React, { useRef, useEffect, useState, useMemo } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import {
  Map,
  Camera,
  GeoJSONSource,
  Layer,
  Marker,
  type CameraRef,
} from '@maplibre/maplibre-react-native';
import { fetchOsrmSimple } from '../utils/osrm';
import { rasterStyle, deltaToZoom, TILE_OSM } from '../native/rasterStyle';

export interface MapMarker {
  lat: number;
  lng: number;
  color: string;
  label?: string;
}

export interface BaseMapProps {
  center: { lat: number; lng: number };
  zoom?: number;
  userLocation?: { lat: number; lng: number } | null;
  markers?: MapMarker[];
  routeCoords?: { lat: number; lng: number }[];
  routeTo?: { lat: number; lng: number } | null;
  heading?: number;
  showUserMarker?: boolean;
  style?: object;
}

const DELTA = 0.012;
const ZOOM = deltaToZoom(DELTA);

export function BaseMap({
  center,
  userLocation,
  markers = [],
  routeCoords,
  routeTo,
  heading = 0,
  showUserMarker = true,
  style,
}: BaseMapProps) {
  const cameraRef = useRef<CameraRef>(null);
  const rotateAnim = useRef(new Animated.Value(heading)).current;
  const [fallbackRoute, setFallbackRoute] = useState<{ latitude: number; longitude: number }[]>([]);
  const lastFallbackKey = useRef('');

  const mapStyle = useMemo(() => rasterStyle(TILE_OSM, 256), []);

  useEffect(() => {
    Animated.timing(rotateAnim, {
      toValue: heading,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [heading]);

  useEffect(() => {
    if (!userLocation || !cameraRef.current) return;
    cameraRef.current.easeTo({
      center: [userLocation.lng, userLocation.lat],
      zoom: ZOOM,
      duration: 400,
    });
  }, [userLocation?.lat, userLocation?.lng]);

  useEffect(() => {
    if (!userLocation || !routeTo || (routeCoords && routeCoords.length > 0)) {
      setFallbackRoute([]);
      return;
    }
    const key = `${Math.round(userLocation.lat * 1000)},${Math.round(userLocation.lng * 1000)}->${routeTo.lat},${routeTo.lng}`;
    if (key === lastFallbackKey.current) return;
    lastFallbackKey.current = key;
    fetchOsrmSimple(userLocation, routeTo).then(setFallbackRoute);
  }, [
    userLocation ? Math.round(userLocation.lat * 1000) : null,
    userLocation ? Math.round(userLocation.lng * 1000) : null,
    routeTo?.lat,
    routeTo?.lng,
  ]);

  const routeCoordinates = useMemo<[number, number][]>(() => {
    const src =
      routeCoords && routeCoords.length > 1
        ? routeCoords.map((c) => ({ latitude: c.lat, longitude: c.lng }))
        : fallbackRoute;
    return src.map((p) => [p.longitude, p.latitude]);
  }, [routeCoords, fallbackRoute]);

  const routeFeature = useMemo<GeoJSON.Feature<GeoJSON.LineString>>(
    () => ({
      type: 'Feature',
      properties: {},
      geometry: { type: 'LineString', coordinates: routeCoordinates },
    }),
    [routeCoordinates],
  );

  const spin = rotateAnim.interpolate({
    inputRange: [0, 360],
    outputRange: ['0deg', '360deg'],
  });

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

      {routeCoordinates.length > 1 && (
        <GeoJSONSource id="route" data={routeFeature}>
          <Layer
            id="route-line"
            type="line"
            layout={{ 'line-cap': 'round', 'line-join': 'round' }}
            paint={{ 'line-color': '#209CEF', 'line-width': 5, 'line-opacity': 0.85 }}
          />
        </GeoJSONSource>
      )}

      {showUserMarker && userLocation && (
        <Marker id="user" lngLat={[userLocation.lng, userLocation.lat]} anchor="center">
          <Animated.View style={[styles.userMarkerWrap, { transform: [{ rotate: spin }] }]}>
            <View style={styles.userMarker} />
          </Animated.View>
        </Marker>
      )}

      {markers.map((m, i) => (
        <Marker key={i} id={`marker-${i}`} lngLat={[m.lng, m.lat]} anchor="center">
          <View style={[styles.markerDot, { backgroundColor: m.color }]} />
        </Marker>
      ))}
    </Map>
  );
}

const styles = StyleSheet.create({
  map: { flex: 1 },
  userMarkerWrap: { width: 28, height: 28, alignItems: 'center', justifyContent: 'center' },
  userMarker: {
    width: 22,
    height: 22,
    backgroundColor: '#209CEF',
    borderRadius: 11,
    borderBottomRightRadius: 2,
    borderWidth: 3,
    borderColor: '#fff',
    elevation: 6,
  },
  markerDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2.5,
    borderColor: '#fff',
    elevation: 4,
  },
});
