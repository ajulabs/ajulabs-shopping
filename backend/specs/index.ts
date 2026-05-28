/**
 * AjuLabs Spec Kit — Exportação centralizada
 *
 * Uso:
 *   import { TOOL_SPECS, ENDPOINT_SPECS, WEBSOCKET_SPECS, VALIDATION_SPECS } from '../specs';
 */

export * from './tools/index';
export * from './endpoints/index';
export * from './websocket/index';
export * from './validations/index';

import { TOOL_SPECS } from './tools/index';
import { ENDPOINT_SPECS } from './endpoints/index';
import { WEBSOCKET_SPECS } from './websocket/index';
import { VALIDATION_SPECS } from './validations/index';

export const ALL_SPECS = {
  tools: TOOL_SPECS,
  endpoints: ENDPOINT_SPECS,
  websocket: WEBSOCKET_SPECS,
  validations: VALIDATION_SPECS,
} as const;

export { TOOL_SPECS, ENDPOINT_SPECS, WEBSOCKET_SPECS, VALIDATION_SPECS };
