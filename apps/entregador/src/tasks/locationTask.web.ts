export const BACKGROUND_LOCATION_TASK = 'BACKGROUND_LOCATION_TASK';

export function setBackgroundTaskData(_data: { pedidoId: string; apiUrl: string } | null): void {}

export async function startBackgroundTracking(_data: { pedidoId: string; apiUrl: string }): Promise<void> {}

export async function stopBackgroundTracking(): Promise<void> {}
