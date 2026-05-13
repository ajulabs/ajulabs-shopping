import React, { useRef, useEffect, useState } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import MapView, { UrlTile, Marker, Polyline, PROVIDER_DEFAULT } from 'react-native-maps';

export interface MapMarker {
  lat: number;
  lng: number;
  color: string;
  label?: string;
}

interface LeafletMapProps {
  center: { lat: number; lng: number };
  zoom?: number;
  userLocation?: { lat: number; lng: number } | null;
  markers?: MapMarker[];
  /** Pre-computed route (from useNavigation). Takes priority over routeTo. */
  routeCoords?: { lat: number; lng: number }[];
  /** Fallback: fetch route internally from userLocation → routeTo. */
  routeTo?: { lat: number; lng: number } | null;
  /** Heading in degrees (0 = north). Rotates the user marker. */
  heading?: number;
  style?: object;
}

const DELTA = 0.012;

async function fetchOsrmSimple(
  from: { lat: number; lng: number },
  to: { lat: number; lng: number },
): Promise<{ latitude: number; longitude: number }[]> {
  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${from.lng},${from.lat};${to.lng},${to.lat}?overview=full&geometries=geojson`;
    const res = await fetch(url);
    const data = await res.json();
    const coords: number[][] = data.routes?.[0]?.geometry?.coordinates ?? [];
    return coords.map(c => ({ latitude: c[1], longitude: c[0] }));
  } catch { return []; }
}

export function LeafletMap({
  center, userLocation, markers = [],
  routeCoords, routeTo, heading = 0, style,
}: LeafletMapProps) {
  const mapRef = useRef<MapView>(null);
  const rotateAnim = useRef(new Animated.Value(heading)).current;
  const [fallbackRoute, setFallbackRoute] = useState<{ latitude: number; longitude: number }[]>([]);
  const lastFallbackKey = useRef('');

  // Animate heading rotation on the marker
  useEffect(() => {
    Animated.timing(rotateAnim, {
      toValue: heading,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [heading]);

  // Follow user location
  useEffect(() => {
    if (!userLocation || !mapRef.current) return;
    mapRef.current.animateToRegion(
      {
        latitude: userLocation.lat,
        longitude: userLocation.lng,
        latitudeDelta: DELTA,
        longitudeDelta: DELTA,
      },
      400
    );
  }, [userLocation?.lat, userLocation?.lng]);

  // Fallback: fetch route when routeTo set and no pre-computed routeCoords
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

  // Choose which route to display
  const displayRoute: { latitude: number; longitude: number }[] =
    routeCoords && routeCoords.length > 1
      ? routeCoords.map(c => ({ latitude: c.lat, longitude: c.lng }))
      : fallbackRoute;

  const spin = rotateAnim.interpolate({
    inputRange: [0, 360],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <MapView
      ref={mapRef}
      provider={PROVIDER_DEFAULT}
      style={[styles.map, style]}
      mapType="none"
      initialRegion={{
        latitude: center.lat,
        longitude: center.lng,
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

      {displayRoute.length > 1 && (
        <Polyline coordinates={displayRoute} strokeColor="#209CEF" strokeWidth={5} />
      )}

      {userLocation && (
        <Marker
          coordinate={{ latitude: userLocation.lat, longitude: userLocation.lng }}
          anchor={{ x: 0.5, y: 0.5 }}
          tracksViewChanges={true}
        >
          <Animated.View style={[styles.userMarkerWrap, { transform: [{ rotate: spin }] }]}>
            <View style={styles.userMarker} />
          </Animated.View>
        </Marker>
      )}

      {markers.map((m, i) => (
        <Marker
          key={i}
          coordinate={{ latitude: m.lat, longitude: m.lng }}
          title={m.label}
          anchor={{ x: 0.5, y: 0.5 }}
          tracksViewChanges={false}
        >
          <View style={[styles.markerDot, { backgroundColor: m.color }]} />
        </Marker>
      ))}
    </MapView>
  );
}

const styles = StyleSheet.create({
  map: { flex: 1 },
  userMarkerWrap: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
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
