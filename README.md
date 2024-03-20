<h1 align="center">validate-env-vars</h1>

<div align="center">

[![license](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/noahtigner/validate-env-vars/blob/HEAD/LICENSE)
[![latest](https://img.shields.io/npm/v/validate-env-vars/latest.svg)](https://www.npmjs.com/package/validate-env-vars)
[![last commit](https://img.shields.io/github/last-commit/noahtigner/validate-env-vars.svg)](https://github.com/noahtigner/validate-env-vars/)
[![npm downloads](https://img.shields.io/npm/dm/validate-env-vars.svg)](https://www.npmjs.com/package/validate-env-vars) \
[![Coverage](./badges/coverage.svg)](./badges/coverage.svg)
[![Code Quality](https://github.com/noahtigner/validate-env-vars/actions/workflows/quality.yml/badge.svg)](https://github.com/noahtigner/validate-env-vars/actions/workflows/quality.yml)
[![CodeQL](https://github.com/noahtigner/validate-env-vars/actions/workflows/codeql.yml/badge.svg)](https://github.com/noahtigner/validate-env-vars/actions/workflows/codeql.yml)

</div>

<p align="center">
    A lightweight utility to check the presence and validity of environment variables, as specified by a Zod schema
</p>

# Installation

Using npm:

```bash
npm install validate-env-vars --save-dev
```

# Usage Examples

### Create an executable JS file to check an .env file against a Zod schema:

```javascript
#!/usr/bin/env node

import validateEnvVars, {
	envEnum,
	envString,
	envNonEmptyString,
} from 'validate-env-vars';

const envSchema = envObject({
	NODE_ENV: envEnum(['development', 'production', 'test']),
	API_BASE: envString().url(),
	GITHUB_USERNAME: envNonEmptyString(),
});

validateEnvVars({ schema: envSchema });
```

You may use the predefined `env*` functions, or create your own using Zod

---

### Programmatically check an .env.production file against a Zod schema:

```javascript
import validateEnvVars, {
    envEnum,
    envString,
    envNonEmptyString,
} from 'validate-env-vars';

const envSchema = envObject({
	NODE_ENV: envEnum(['development', 'production', 'test']),
	API_BASE: envString().url(),
	GITHUB_USERNAME: envNonEmptyString(),
});

const prefilight() => {
    try {
        validateEnvVars({ schema: envSchema, envPath: '.env.production' })
        // ... other code
    }
    catch (error) {
        console.error(error);
        // ... other code
    }
}
```

---

### Check env vars before Vite startup and build:

1. Define a Zod schema in a .ts file at the root of your project

```javascript
import validateEnvVars, {
    envEnum,
    envString,
    envNonEmptyString,
} from 'validate-env-vars';

const envSchema = envObject({
	NODE_ENV: envEnum(['development', 'production', 'test']),
	VITE_API_BASE: envString().url(),
	VITE_GITHUB_USERNAME: envNonEmptyString(),
});

// make the type of the environment variables available globally
declare global {
    type Env = z.infer<typeof envSchema>;
}

export default envSchema;
```

2. Import `validateEnvVars` and your schema and add a plugin to your Vite config to call `validateEnvVars` on `buildStart`

```javascript
import { defineConfig } from 'vitest/config';
import envConfigSchema from './env.config';
import validateEnvVars from 'validate-env-vars';

export default defineConfig({
  plugins: [
    {
      name: 'validate-env-vars',
      buildStart: () => validateEnvVars({ schema: envConfigSchema }),
    },
    // other plugins...
  ],
  // other options...
```

3. Enable typehints and intellisense for the environment variables in your `vite-env.d.ts`

```javascript
/// <reference types="vite/client" />

interface ImportMetaEnv extends globalThis.Env {}

interface ImportMeta {
	readonly env: ImportMetaEnv;
}
```

4. Add your schema configuration file to your tsconfig's `include`

# Tips:

- If you don't have a `.env` file, you can pass an empty file. This is useful for testing and CI/CD environments, where environment variables may be set programmatically.

# Config Options

| Option                   | Type        | Description                                                    | Default |
| ------------------------ | ----------- | -------------------------------------------------------------- | ------- |
| `schema`                 | `EnvObject` | The schema to validate against                                 |         |
| `envPath` (optional)     | `string`    | The path to the .env file                                      | `.env`  |
| `exitOnError` (optional) | `boolean`   | Whether to exit the process or throw if validation fails       | `false` |
| `logVars` (optional)     | `boolean`   | Whether to output successfully parsed variables to the console | `true`  |
