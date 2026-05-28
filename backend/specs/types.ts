export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export type AuthRole = 'none' | 'usuario' | 'lojista' | 'entregador' | 'any';

export type ErrorSpec = {
  code: string;
  statusCode: number;
  message: string;
};

export type SpecExample<I = unknown, O = unknown> = {
  description: string;
  input: I;
  output: O;
};

export type FieldSchema = {
  type: string;
  required: boolean;
  constraints?: string[];
  description?: string;
};

export type EndpointSpec<I = unknown, O = unknown> = {
  name: string;
  method: HttpMethod;
  path: string;
  description: string;
  auth: AuthRole;
  preconditions: string[];
  input: Record<string, FieldSchema | Record<string, unknown>>;
  output: Record<string, unknown>;
  examples: SpecExample<I, O>[];
  errors: ErrorSpec[];
  sideEffects: string[];
};

export type ToolSpec<I = unknown, O = unknown> = {
  name: string;
  description: string;
  preconditions: string[];
  input: Record<string, FieldSchema | Record<string, unknown>>;
  output: Record<string, unknown>;
  examples: SpecExample<I, O>[];
  errors: ErrorSpec[];
  sideEffects: string[];
};

export type WebSocketDirection = 'server→client' | 'client→server';

export type WebSocketSpec = {
  name: string;
  event: string;
  direction: WebSocketDirection;
  description: string;
  room: string;
  payload: Record<string, unknown>;
  examples: Array<{ description: string; payload: unknown }>;
  preconditions: string[];
  sideEffects: string[];
};

export type ValidationRule = {
  field: string;
  type: string;
  required: boolean;
  constraints: string[];
};

export type ValidationSpec = {
  name: string;
  description: string;
  rules: ValidationRule[];
  examples: Array<{
    description: string;
    valid?: unknown;
    invalid?: unknown;
    error?: string;
  }>;
};
