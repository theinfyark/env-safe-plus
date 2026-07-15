import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { env, safeEnv, EnvError } from '../src/index.js';

describe('env()', () => {
  it('validates and coerces shorthand types', () => {
    const config = env(
      {
        PORT: 'number',
        DB_URL: 'string',
        JWT_SECRET: 'string',
        DEBUG: 'boolean',
      },
      {
        source: {
          PORT: '3000',
          DB_URL: 'postgres://localhost/app',
          JWT_SECRET: 'secret',
          DEBUG: 'true',
        },
      },
    );

    assert.deepEqual(config, {
      PORT: 3000,
      DB_URL: 'postgres://localhost/app',
      JWT_SECRET: 'secret',
      DEBUG: true,
    });
  });

  it('applies default values when missing', () => {
    const config = env(
      {
        PORT: { type: 'number', default: 8080 },
        DEBUG: { type: 'boolean', default: false },
      },
      { source: {} },
    );

    assert.deepEqual(config, { PORT: 8080, DEBUG: false });
  });

  it('treats empty and whitespace as missing', () => {
    assert.throws(
      () => env({ DB_URL: 'string' }, { source: { DB_URL: '   ' } }),
      (err) =>
        err instanceof EnvError &&
        err.issues.some((i) => /DB_URL is missing or empty/.test(i)),
    );
  });

  it('rejects wrong number types', () => {
    assert.throws(
      () => env({ PORT: 'number' }, { source: { PORT: 'abc' } }),
      (err) =>
        err instanceof EnvError && /PORT must be a number/.test(err.message),
    );
  });

  it('rejects null-like invalid boolean values', () => {
    assert.throws(
      () => env({ FLAG: 'boolean' }, { source: { FLAG: 'null' } }),
      (err) =>
        err instanceof EnvError && /FLAG must be a boolean/.test(err.message),
    );
  });

  it('supports optional fields', () => {
    const config = env(
      {
        REQUIRED: 'string',
        OPTIONAL: { type: 'string', optional: true },
      },
      { source: { REQUIRED: 'ok' } },
    );

    assert.equal(config.REQUIRED, 'ok');
    assert.equal(config.OPTIONAL, undefined);
  });

  it('validates url, email, json, and enum', () => {
    const config = env(
      {
        SITE: 'url',
        MAIL: 'email',
        META: 'json',
        NODE_ENV: { type: 'enum', values: ['development', 'production'] },
      },
      {
        source: {
          SITE: 'https://example.com',
          MAIL: 'a@b.com',
          META: '{"a":1}',
          NODE_ENV: 'production',
        },
      },
    );

    assert.equal(config.SITE, 'https://example.com');
    assert.equal(config.MAIL, 'a@b.com');
    assert.deepEqual(config.META, { a: 1 });
    assert.equal(config.NODE_ENV, 'production');
  });

  it('collects multiple issues in one error', () => {
    assert.throws(
      () =>
        env(
          {
            PORT: 'number',
            DB_URL: 'string',
          },
          { source: { PORT: 'nope' } },
        ),
      (err) => {
        assert.ok(err instanceof EnvError);
        assert.equal(err.issues.length, 2);
        return true;
      },
    );
  });

  it('supports transform hooks', () => {
    const config = env(
      {
        HOST: {
          type: 'string',
          transform: (v) => String(v).toUpperCase(),
        },
      },
      { source: { HOST: 'localhost' } },
    );

    assert.equal(config.HOST, 'LOCALHOST');
  });

  it('uses process.env by default', () => {
    const key = '__ENV_SAFE_PLUS_TEST__';
    process.env[key] = '42';
    try {
      const config = env({ [key]: 'number' });
      assert.equal(config[key], 42);
    } finally {
      delete process.env[key];
    }
  });
});

describe('safeEnv()', () => {
  it('returns ok/data on success', () => {
    const result = safeEnv({ PORT: 'number' }, { source: { PORT: '1' } });
    assert.equal(result.ok, true);
    if (result.ok) assert.deepEqual(result.data, { PORT: 1 });
  });

  it('returns ok/error on failure', () => {
    const result = safeEnv({ PORT: 'number' }, { source: {} });
    assert.equal(result.ok, false);
    if (!result.ok) assert.ok(result.error instanceof EnvError);
  });
});
