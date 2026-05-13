import { buildInstruction } from './geo';
import type { NavStep } from '@ajulabs/types';

export async function fetchOsrmFull(
  from: { lat: number; lng: number },
  to: { lat: number; lng: number },
): Promise<{
  coords: { lat: number; lng: number }[];
  steps: NavStep[];
  totalDuration: number;
  totalDistance: number;
}> {
  const url =
    `https://router.project-osrm.org/route/v1/driving/` +
    `${from.lng},${from.lat};${to.lng},${to.lat}` +
    `?overview=full&geometries=geojson&steps=true`;

  const res = await fetch(url);
  const data = await res.json();
  const route = data.routes?.[0];
  if (!route) throw new Error('Rota não encontrada');

  const coords: { lat: number; lng: number }[] =
    (route.geometry.coordinates as number[][]).map((c: number[]) => ({ lat: c[1], lng: c[0] }));

  const steps: NavStep[] = [];
  for (const leg of route.legs ?? []) {
    for (const step of leg.steps ?? []) {
      steps.push({
        instruction: buildInstruction(step.maneuver.type, step.maneuver.modifier, step.name),
        distance: step.distance,
        duration: step.duration,
        modifier: step.maneuver.modifier,
        location: { lat: step.maneuver.location[1], lng: step.maneuver.location[0] },
      });
    }
  }

  return {
    coords,
    steps,
    totalDuration: route.duration as number,
    totalDistance: route.distance as number,
  };
}

export async function fetchOsrmSimple(
  from: { lat: number; lng: number },
  to: { lat: number; lng: number },
): Promise<{ latitude: number; longitude: number }[]> {
  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${from.lng},${from.lat};${to.lng},${to.lat}?overview=full&geometries=geojson`;
    const res = await fetch(url);
    const data = await res.json();
    const coords: number[][] = data.routes?.[0]?.geometry?.coordinates ?? [];
    return coords.map((c: number[]) => ({ latitude: c[1], longitude: c[0] }));
  } catch { return []; }
}
