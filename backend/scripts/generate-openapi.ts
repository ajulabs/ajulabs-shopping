/**
 * FASE 4 — OpenAPI 3.0 Generator
 *
 * Reads ENDPOINT_SPECS and generates backend/openapi.json.
 *
 * Usage:
 *   npx tsx scripts/generate-openapi.ts
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ENDPOINT_SPECS } from '../specs/endpoints/index';
import type { EndpointSpec, FieldSchema } from '../specs/types';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_FILE = path.resolve(__dirname, '../openapi.json');

function isFieldSchema(v: unknown): v is FieldSchema {
  return typeof v === 'object' && v !== null && 'required' in v;
}

function fieldTypeToOpenAPI(def: FieldSchema): Record<string, unknown> {
  const type = def.type ?? 'string';
  if (type === 'number') return { type: 'number' };
  if (type === 'boolean') return { type: 'boolean' };
  if (type === 'array') return { type: 'array', items: {} };
  if (type === 'object') return { type: 'object' };
  if (type === 'file') return { type: 'string', format: 'binary' };
  if (type === 'enum' && def.constraints?.[0]) {
    const raw = def.constraints[0];
    const values = raw.split('|').map((v) => v.trim().replace(/^'|'$/g, ''));
    return { type: 'string', enum: values };
  }
  const schema: Record<string, unknown> = { type: 'string' };
  if (def.constraints) {
    const c = def.constraints.join(', ');
    if (c.includes('uuid')) schema.format = 'uuid';
    if (c.includes('email')) schema.format = 'email';
    if (c.includes('url') || c.includes('URL')) schema.format = 'uri';
  }
  return schema;
}

function normalizePath(p: string): string {
  return p.replace(/:([a-zA-Z]+)/g, '{$1}');
}

function specToOperation(spec: EndpointSpec): Record<string, unknown> {
  const method = spec.method.toLowerCase();
  const isBody = ['post', 'put', 'patch'].includes(method);

  const bodyFields = Object.entries(spec.input).filter(
    ([, def]) =>
      isFieldSchema(def) &&
      !def.constraints?.some((c) => c.includes('path param')) &&
      !def.constraints?.some((c) => c.includes('query param')) &&
      def.type !== 'file' &&
      def.type !== 'file[]',
  ) as [string, FieldSchema][];

  const pathParams = Object.entries(spec.input)
    .filter(([, def]) => isFieldSchema(def) && def.constraints?.some((c) => c.includes('path param')))
    .map(([name]) => ({
      name,
      in: 'path',
      required: true,
      schema: { type: 'string', format: 'uuid' },
    }));

  const queryParams = Object.entries(spec.input)
    .filter(([, def]) => isFieldSchema(def) && def.constraints?.some((c) => c.includes('query param')))
    .map(([name, def]) => {
      const d = def as FieldSchema;
      return {
        name,
        in: 'query',
        required: d.required,
        schema: fieldTypeToOpenAPI(d),
      };
    });

  const requiredFields = bodyFields.filter(([, def]) => def.required).map(([k]) => k);
  const properties = Object.fromEntries(
    bodyFields.map(([k, def]) => [
      k,
      { ...fieldTypeToOpenAPI(def), description: def.description ?? def.constraints?.join(', ') },
    ]),
  );

  const responses: Record<string, unknown> = {
    '200': { description: 'Sucesso' },
    '201': { description: 'Criado com sucesso' },
  };
  for (const err of spec.errors ?? []) {
    responses[String(err.statusCode)] = { description: `${err.code}: ${err.message}` };
  }
  if (isBody && bodyFields.some(([, d]) => d.required)) {
    responses['422'] = { description: 'Campos obrigatórios ausentes (spec-validator)' };
  }
  if (spec.auth !== 'none') {
    responses['401'] = { description: 'Token ausente ou inválido' };
  }

  const security = spec.auth !== 'none' ? [{ bearerAuth: [] }] : [];

  const tag = spec.path.split('/').filter(Boolean)[0] ?? 'misc';

  const operation: Record<string, unknown> = {
    operationId: spec.name,
    summary: spec.description?.split('.')[0] ?? spec.name.replace(/_/g, ' '),
    description: spec.description,
    tags: [tag],
    security,
    parameters: [...pathParams, ...queryParams],
    responses,
  };

  if (isBody && bodyFields.length > 0) {
    const isMultipart = bodyFields.some(([, d]) => d.type === 'file' || d.type === 'file[]');
    const contentType = isMultipart ? 'multipart/form-data' : 'application/json';
    operation.requestBody = {
      required: requiredFields.length > 0,
      content: {
        [contentType]: {
          schema: {
            type: 'object',
            required: requiredFields.length > 0 ? requiredFields : undefined,
            properties,
          },
          ...(spec.examples?.[0]?.input ? { example: spec.examples[0].input } : {}),
        },
      },
    };
  }

  return { [method]: operation };
}

function main() {
  const paths: Record<string, unknown> = {};

  for (const spec of ENDPOINT_SPECS) {
    const normalizedPath = normalizePath(spec.path);
    const key = `/v1${normalizedPath}`;
    if (!paths[key]) paths[key] = {};
    Object.assign(paths[key] as Record<string, unknown>, specToOperation(spec as EndpointSpec));
  }

  const openapi = {
    openapi: '3.0.3',
    info: {
      title: 'AjuLabs Shopping API',
      version: '1.0.0',
      description:
        'Marketplace local de Aracaju/SE — consumidores, lojistas e entregadores.\n\n' +
        'Autenticação via Bearer JWT obtido em /v1/auth/*/login.',
      contact: { name: 'AjuLabs', email: 'contato@ajulabs.com' },
      license: { name: 'MIT' },
    },
    servers: [
      { url: 'http://localhost:3000', description: 'Local' },
      { url: 'https://ajulabs-shopping-sit.up.railway.app', description: 'SIT' },
      { url: 'https://prolific-happiness-prod.up.railway.app', description: 'Produção' },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Token JWT obtido via /v1/auth/*/login',
        },
      },
    },
    paths,
  };

  fs.writeFileSync(OUT_FILE, JSON.stringify(openapi, null, 2));
  console.log(`\nOpenAPI spec written to ${OUT_FILE} (${Object.keys(paths).length} paths)\n`);
}

main();
