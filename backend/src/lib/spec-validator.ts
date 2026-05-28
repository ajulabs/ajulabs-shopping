import type { Request, Response, NextFunction } from 'express';
import { logger } from './logger';

// ── Types ─────────────────────────────────────────────────────────────────────

export type FieldDef = {
  required: boolean;
  type?: string;
  constraints?: string[];
};

export type SpecShape = {
  name: string;
  input: Record<string, FieldDef | Record<string, unknown>>;
};

export type ValidationResult = {
  valid: boolean;
  specName: string;
  errors: string[];
};

// ── Core validator ─────────────────────────────────────────────────────────────

function isFieldDef(v: unknown): v is FieldDef {
  return (
    typeof v === 'object' &&
    v !== null &&
    'required' in v &&
    typeof (v as FieldDef).required === 'boolean'
  );
}

export function validateAgainstSpec(
  spec: SpecShape,
  body: Record<string, unknown>,
): ValidationResult {
  const errors: string[] = [];

  for (const [field, schema] of Object.entries(spec.input)) {
    if (!isFieldDef(schema)) continue;

    // Skip file/multipart fields — validated by multer, not by JSON body
    if (schema.type === 'file' || schema.type === 'file[]') continue;

    // Skip path params documented in the spec (they come from req.params, not body)
    if (schema.constraints?.some((c) => c.includes('path param'))) continue;

    const value = (body as Record<string, unknown>)[field];
    const absent = value === undefined || value === null;

    if (schema.required && absent) {
      errors.push(`Campo obrigatório ausente: "${field}"`);
    }
  }

  return { valid: errors.length === 0, specName: spec.name, errors };
}

// ── Express middleware factory ─────────────────────────────────────────────────

/**
 * Middleware that validates the request body against a spec's input schema.
 *
 * Behavior by environment:
 *   - test / development : strict — returns 422 if spec is violated
 *   - production         : non-blocking — logs warning and continues
 *
 * Override with `strict` param.
 */
export function specValidatorMiddleware(
  spec: SpecShape,
  strict = process.env.NODE_ENV !== 'production',
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = validateAgainstSpec(spec, (req.body ?? {}) as Record<string, unknown>);

    if (!result.valid) {
      if (strict) {
        res.status(422).json({
          error: 'Corpo da requisição não está em conformidade com a spec',
          spec: result.specName,
          campos_ausentes: result.errors,
        });
        return;
      }

      logger.warn(
        { spec: result.specName, errors: result.errors },
        '[spec-validator] body não conforme',
      );
    }

    next();
  };
}
