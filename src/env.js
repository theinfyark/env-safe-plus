import { EnvError } from './types.js';

const TRUE_VALUES = new Set(['true', '1', 'yes', 'y', 'on']);
const FALSE_VALUES = new Set(['false', '0', 'no', 'n', 'off']);

/**
 * @param {import('./types.js').EnvField} field
 * @returns {import('./types.js').EnvFieldOptions}
 */
function normalizeField(field) {
  if (typeof field === 'string') {
    return { type: field };
  }
  if (!field || typeof field !== 'object' || !field.type) {
    throw new EnvError([
      'schema fields must be a type string or { type, ... } object',
    ]);
  }
  return field;
}

/**
 * @param {string | undefined} raw
 * @returns {boolean}
 */
function isEmpty(raw) {
  return raw === undefined || raw === null || String(raw).trim() === '';
}

/**
 * @param {string} key
 * @param {string} raw
 * @param {import('./types.js').EnvFieldOptions} field
 * @returns {unknown}
 */
function coerce(key, raw, field) {
  const value = raw.trim();

  switch (field.type) {
    case 'string':
      return value;

    case 'number': {
      const num = Number(value);
      if (!Number.isFinite(num)) {
        throw `${key} must be a number (got "${raw}")`;
      }
      return num;
    }

    case 'boolean': {
      const lower = value.toLowerCase();
      if (TRUE_VALUES.has(lower)) return true;
      if (FALSE_VALUES.has(lower)) return false;
      throw `${key} must be a boolean (got "${raw}")`;
    }

    case 'url': {
      try {
        new URL(value);
        return value;
      } catch {
        throw `${key} must be a valid URL (got "${raw}")`;
      }
    }

    case 'email': {
      // Practical email check (not full RFC).
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        throw `${key} must be a valid email (got "${raw}")`;
      }
      return value;
    }

    case 'json': {
      try {
        return JSON.parse(value);
      } catch {
        throw `${key} must be valid JSON (got "${raw}")`;
      }
    }

    case 'enum': {
      const values = field.values;
      if (!Array.isArray(values) || values.length === 0) {
        throw `${key} enum schema is missing a non-empty "values" array`;
      }
      if (!values.includes(value)) {
        throw `${key} must be one of: ${values.join(', ')} (got "${raw}")`;
      }
      return value;
    }

    default:
      throw `${key} has unsupported type "${field.type}"`;
  }
}

/**
 * Validate and coerce `process.env` (or a custom source) against a schema.
 *
 * @template {import('./types.js').EnvSchema} S
 * @param {S} schema
 * @param {{ source?: Record<string, string | undefined> }} [options]
 * @returns {Record<string, unknown>}
 *
 * @example
 * ```js
 * import { env } from "env-safe-plus";
 *
 * const config = env({
 *   PORT: "number",
 *   DB_URL: "string",
 *   JWT_SECRET: "string",
 *   DEBUG: { type: "boolean", default: false },
 * });
 * ```
 */
export function env(schema, options = {}) {
  if (!schema || typeof schema !== 'object' || Array.isArray(schema)) {
    throw new EnvError(['schema must be a non-null object']);
  }

  const source = options.source ?? process.env;
  /** @type {Record<string, unknown>} */
  const result = {};
  /** @type {string[]} */
  const issues = [];

  for (const [key, rawField] of Object.entries(schema)) {
    let field;
    try {
      field = normalizeField(rawField);
    } catch (err) {
      if (err instanceof EnvError) {
        issues.push(...err.issues.map((i) => `${key}: ${i}`));
        continue;
      }
      throw err;
    }

    const raw = source[key];
    const empty = isEmpty(raw);
    const hasDefault = Object.prototype.hasOwnProperty.call(field, 'default');

    if (empty) {
      if (hasDefault) {
        result[key] = field.default;
        continue;
      }
      if (field.optional) {
        result[key] = undefined;
        continue;
      }
      issues.push(`${key} is missing or empty`);
      continue;
    }

    try {
      let value = coerce(key, /** @type {string} */ (raw), field);
      if (typeof field.transform === 'function') {
        value = field.transform(value);
      }
      result[key] = value;
    } catch (err) {
      issues.push(typeof err === 'string' ? err : String(err));
    }
  }

  if (issues.length > 0) {
    throw new EnvError(issues);
  }

  return result;
}

/**
 * Same as `env()`, but returns `{ ok, data, error }` instead of throwing.
 *
 * @template {import('./types.js').EnvSchema} S
 * @param {S} schema
 * @param {{ source?: Record<string, string | undefined> }} [options]
 * @returns {{ ok: true, data: Record<string, unknown> } | { ok: false, error: EnvError }}
 */
export function safeEnv(schema, options = {}) {
  try {
    return { ok: true, data: env(schema, options) };
  } catch (error) {
    if (error instanceof EnvError) {
      return { ok: false, error };
    }
    throw error;
  }
}
