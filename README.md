# env-safe-plus

Tiny zero-dependency **environment variable validator** for Node.js.

Instead of poking at `process.env` and hoping values exist:

```js
import { env } from 'env-safe-plus';

const config = env({
  PORT: 'number',
  DB_URL: 'string',
  JWT_SECRET: 'string',
});

config.PORT; // number
config.DB_URL; // string
```

Automatically checks for:

- missing / empty / null-like values
- wrong types
- default values
- optional fields
- enums, URLs, emails, JSON

```bash
npm install env-safe-plus
```

## Quick start

```js
import { env } from 'env-safe-plus';

const config = env({
  PORT: { type: 'number', default: 3000 },
  DB_URL: 'string',
  JWT_SECRET: 'string',
  DEBUG: { type: 'boolean', default: false },
  NODE_ENV: {
    type: 'enum',
    values: ['development', 'test', 'production'],
    default: 'development',
  },
});

console.log(config.PORT);
```

If validation fails, it throws `EnvError` with every issue listed:

```
Invalid environment:
  - DB_URL is missing or empty
  - PORT must be a number (got "abc")
```

## Schema shapes

### Shorthand

```js
env({
  PORT: 'number',
  DB_URL: 'string',
});
```

### Full options

```js
env({
  PORT: {
    type: 'number',
    default: 3000,
  },
  REDIS_URL: {
    type: 'url',
    optional: true,
  },
  NAME: {
    type: 'string',
    transform: (v) => v.trim().toLowerCase(),
  },
});
```

## Supported types

| Type      | Coerces to | Notes                                   |
| --------- | ---------- | --------------------------------------- |
| `string`  | `string`   | trimmed non-empty                       |
| `number`  | `number`   | finite numbers only                     |
| `boolean` | `boolean`  | `true/false`, `1/0`, `yes/no`, `on/off` |
| `url`     | `string`   | must parse with `URL`                   |
| `email`   | `string`   | basic email shape                       |
| `json`    | `any`      | `JSON.parse`                            |
| `enum`    | `string`   | requires `values: string[]`             |

## Safe mode (no throw)

```js
import { safeEnv } from 'env-safe-plus';

const result = safeEnv({ PORT: 'number' });

if (!result.ok) {
  console.error(result.error.issues);
  process.exit(1);
}

console.log(result.data.PORT);
```

## Custom source (tests)

```js
import { env } from 'env-safe-plus';

const config = env({ PORT: 'number' }, { source: { PORT: '4000' } });
```

## Requirements

- Node.js 18+
- Zero runtime dependencies

## License

MIT
