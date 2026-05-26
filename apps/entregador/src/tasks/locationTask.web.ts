export const BACKGROUND_LOCATION_TASK = 'BACKGROUND_LOCATION_TASK';
export const IDLE_LOCATION_TASK = 'IDLE_LOCATION_TASK';

export async function startBackgroundTracking(_data: {
  pedidoId: string;
  apiUrl: string;
}): Promise<void> {}
export async function stopBackgroundTracking(): Promise<void> {}

export async function startIdleTracking(_data: { token: string; apiUrl: string }): Promise<void> {}
export async function stopIdleTracking(): Promise<void> {}
