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

## Introduction

**env-safe-plus** helps you ship reliable Node.js / TypeScript applications with a small, focused API.

## Why this package exists

Popular stacks need small, trustworthy utilities with excellent DX. **env-safe-plus** exists to solve one problem well: clear APIs, strong typing, minimal dependencies, and production-ready defaults — without the overhead of larger frameworks.

## Installation

```bash
npm install env-safe-plus
# or
pnpm add env-safe-plus
yarn add env-safe-plus
```

Requires Node.js 18+.

## API Reference

See the exports from `env-safe-plus` and the inline TypeScript types for the full surface area. Primary entry points are documented in **Quick Start** and **Examples** above.

## Examples

Minimal usage is shown in **Quick Start**. Prefer copying those snippets first, then expand into your app’s error handling and configuration patterns.

## Advanced Examples

- Combine with environment validation, logging, and health checks in production services
- Prefer dependency injection / custom `fetch` / client injection in tests
- Keep configuration explicit; avoid hidden global state

## Framework Integration

Works with Express, Fastify, Hono, NestJS, and plain Node HTTP servers. Import ESM (or CJS where published) and call the documented APIs from route handlers, middleware, or background jobs.

## TypeScript Usage

```ts
import { /* symbols */ } from "env-safe-plus";
```

Types ship with the package (`types` / `exports.types`). Enable `strict` in your `tsconfig` for the best DX.

## Error Handling

- Fail fast with typed / named errors where provided
- Never swallow errors silently in production paths
- Prefer returning structured error payloads in HTTP layers
- Surface actionable messages (what failed + how to fix)

## Performance

- Minimal runtime work on the hot path
- Avoid unnecessary allocations and dependencies
- Tree-shakeable ESM entry points
- Prefer streaming / lazy work when dealing with large payloads

## Best Practices

- Pin major versions with SemVer ranges you trust
- Validate configuration at process startup
- Add health checks and observability around I/O
- Write tests for failure modes (timeouts, bad input, missing credentials)

## FAQ

**Does it work with ESM and CommonJS?**  
Yes where the package publishes dual exports. Prefer ESM for new projects.

**Is it production-ready?**  
Yes — tests, types, and SemVer releases are part of the maintenance model.

**How do I report a bug?**  
Open a GitHub issue using the bug template.

## Migration Guide

### From 0.x / early drafts
This package follows SemVer. Breaking changes land in major releases and are called out in `CHANGELOG.md`.

### Upgrading patch/minor
Patch and minor releases are backward compatible. Run your test suite after upgrading.

## Troubleshooting

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| `ERR_MODULE_NOT_FOUND` | Wrong Node version / bad import path | Use Node 18+ and package `exports` |
| Types not resolving | Old moduleResolution | Use `bundler` or `node16`+ |
| Auth / network failures | Missing env or blocked egress | Check credentials and firewall |
| Unexpected runtime errors | Invalid input | Validate options; read error message |

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md). PRs with tests and docs are welcome.

