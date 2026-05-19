import { Platform } from 'react-native';
import { getSocket } from '@ajulabs/realtime';

export const BACKGROUND_LOCATION_TASK = 'BACKGROUND_LOCATION_TASK';

interface TaskData {
  pedidoId: string;
  apiUrl: string;
}

let _taskData: TaskData | null = null;

export function setBackgroundTaskData(data: TaskData | null) {
  _taskData = data;
}

// expo-task-manager and expo-location are native-only; skip entirely on web
if (Platform.OS !== 'web') {
  const TaskManager = require('expo-task-manager');
  const Location = require('expo-location');

  TaskManager.defineTask(BACKGROUND_LOCATION_TASK, ({ data, error }: any) => {
    if (error || !_taskData) return;
    const locations: any[] = data?.locations ?? [];
    if (locations.length === 0) return;

    const loc = locations[locations.length - 1];
    const { pedidoId, apiUrl } = _taskData;

    try {
      const socket = getSocket(apiUrl);
      socket.emit('localizacao:update', {
        pedidoId,
        lat: loc.coords.latitude,
        lng: loc.coords.longitude,
        heading: loc.coords.heading ?? undefined,
        speedKmh: loc.coords.speed != null ? loc.coords.speed * 3.6 : undefined,
      });
    } catch {}
  });
}

export async function startBackgroundTracking(data: TaskData): Promise<void> {
  if (Platform.OS === 'web') return;

  setBackgroundTaskData(data);

  const Location = require('expo-location');
  const TaskManager = require('expo-task-manager');

  const { status: fg } = await Location.requestForegroundPermissionsAsync();
  if (fg !== 'granted') return;

  const { status: bg } = await Location.requestBackgroundPermissionsAsync();
  if (bg !== 'granted') return;

  const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_LOCATION_TASK);
  if (!isRegistered) {
    await Location.startLocationUpdatesAsync(BACKGROUND_LOCATION_TASK, {
      accuracy: Location.Accuracy.BestForNavigation,
      distanceInterval: 10,
      timeInterval: 5000,
      showsBackgroundLocationIndicator: true,
      foregroundService: {
        notificationTitle: 'AjuLabs Entregador',
        notificationBody: 'Rastreando sua localização durante a entrega.',
        notificationColor: '#F2760F',
      },
    });
  }
}

export async function stopBackgroundTracking(): Promise<void> {
  if (Platform.OS === 'web') return;

  setBackgroundTaskData(null);

  const Location = require('expo-location');
  const TaskManager = require('expo-task-manager');

  const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_LOCATION_TASK);
  if (isRegistered) {
    await Location.stopLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
  }
}
