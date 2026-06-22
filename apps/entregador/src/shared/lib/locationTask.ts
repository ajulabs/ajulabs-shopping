import { Platform } from 'react-native';
import { getSocket } from '@ajulabs/realtime';

export const BACKGROUND_LOCATION_TASK = 'BACKGROUND_LOCATION_TASK';
export const IDLE_LOCATION_TASK = 'IDLE_LOCATION_TASK';

interface TaskData {
  pedidoId: string;
  apiUrl: string;
}

interface IdleTaskData {
  token: string;
  apiUrl: string;
}

let _taskData: TaskData | null = null;
let _idleTaskData: IdleTaskData | null = null;

export function setBackgroundTaskData(data: TaskData | null) {
  _taskData = data;
}

export function setIdleTaskData(data: IdleTaskData | null) {
  _idleTaskData = data;
}

// expo-task-manager and expo-location are native-only; skip entirely on web
if (Platform.OS !== 'web') {
  const TaskManager = require('expo-task-manager');
  const Location = require('expo-location');

  // Task ativa durante uma corrida — envia GPS a cada 5s via socket
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

  // Task idle (online sem corrida) — envia heartbeat HTTP a cada ~1 min.
  // Mais leve que socket: não exige conexão persistente, sobrevive a
  // sleep do sistema operacional.
  TaskManager.defineTask(IDLE_LOCATION_TASK, ({ data, error }: any) => {
    if (error || !_idleTaskData) return;
    const locations: any[] = data?.locations ?? [];
    if (locations.length === 0) return;

    const loc = locations[locations.length - 1];
    const { token, apiUrl } = _idleTaskData;

    // POST direto via fetch — sem dependência de socket. Best-effort.
    fetch(`${apiUrl}/v1/entregador/heartbeat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        lat: loc.coords.latitude,
        lng: loc.coords.longitude,
      }),
    }).catch(() => {});
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

/**
 * Inicia o tracking "idle" — entregador online aguardando corridas.
 *
 * Differente do background tracking de corrida:
 * - Frequência muito menor (1 min) para economizar bateria
 * - Accuracy balanceada (precisão ~30m é suficiente pra ofertar corridas)
 * - Envia heartbeat HTTP em vez de socket (sobrevive a sleep do SO)
 *
 * Quando o entregador aceita uma corrida, este tracking deve ser
 * parado e o `startBackgroundTracking` (pesado) assume.
 */
export async function startIdleTracking(data: IdleTaskData): Promise<void> {
  if (Platform.OS === 'web') return;

  setIdleTaskData(data);

  const Location = require('expo-location');
  const TaskManager = require('expo-task-manager');

  const { status: fg } = await Location.requestForegroundPermissionsAsync();
  if (fg !== 'granted') return;

  const { status: bg } = await Location.requestBackgroundPermissionsAsync();
  if (bg !== 'granted') return;

  const isRegistered = await TaskManager.isTaskRegisteredAsync(IDLE_LOCATION_TASK);
  if (!isRegistered) {
    await Location.startLocationUpdatesAsync(IDLE_LOCATION_TASK, {
      accuracy: Location.Accuracy.Balanced,
      distanceInterval: 50,
      timeInterval: 60000, // 1 min
      showsBackgroundLocationIndicator: true,
      foregroundService: {
        notificationTitle: 'AjuLabs Entregador',
        notificationBody: 'Online — aguardando corridas.',
        notificationColor: '#F2760F',
      },
    });
  }
}

export async function stopIdleTracking(): Promise<void> {
  if (Platform.OS === 'web') return;

  setIdleTaskData(null);

  const Location = require('expo-location');
  const TaskManager = require('expo-task-manager');

  const isRegistered = await TaskManager.isTaskRegisteredAsync(IDLE_LOCATION_TASK);
  if (isRegistered) {
    await Location.stopLocationUpdatesAsync(IDLE_LOCATION_TASK);
  }
}
