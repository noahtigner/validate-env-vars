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
    A lightweight utility for checking the presence and validity of environment variables, as specified by a Zod schema.
</p>

<p align="center">
   validate-env-vars supports Zod v4 and Zod Mini!
</p>

# Installation

Requires Node.js 20.12.0 or later and Zod v4. The package has no install-time scripts and supports npm, pnpm, Yarn, and Bun.

Using npm:

```bash
npm install --save-dev validate-env-vars zod
```

Using pnpm:

```bash
pnpm add --save-dev validate-env-vars zod
```

Using Yarn:

```bash
yarn add --dev validate-env-vars zod
```

Using Bun:

```bash
bun add --dev validate-env-vars zod
```

# Usage Examples

### Create an executable JS file to check an .env file against a Zod schema:

```javascript
#!/usr/bin/env node

import validateEnvVars from 'validate-env-vars';
import { z } from 'zod';

const envSchema = z.object({
	NODE_ENV: z.enum(['development', 'production', 'test']),
	API_BASE: z.url(),
	GITHUB_USERNAME: z.string().min(1),
});

validateEnvVars({ schema: envSchema, envPath: '.env' });
```

---

### Programmatically check an .env.production file against a Zod schema:

```javascript
import validateEnvVars from 'validate-env-vars';
import { z } from 'zod';

const envSchema = z.object({
	NODE_ENV: z.enum(['development', 'production', 'test']),
	API_BASE: z.url(),
	GITHUB_USERNAME: z.string().min(1),
});

const preflight = () => {
	try {
		validateEnvVars({ schema: envSchema, envPath: '.env.production' });
		// ... other code
	} catch (error) {
		console.error(error);
		// ... other code
	}
};
```

---

### Check env vars before Vite startup and build

1. Define a Zod schema in a .ts file at the root of your project

```javascript
import { z } from 'zod';

const envSchema = z.object({
	NODE_ENV: z.enum(['development', 'production', 'test']),
	VITE_API_BASE: z.url(),
	VITE_GITHUB_USERNAME: z.string().min(1),
});

// make the type of the environment variables available globally
declare global {
    type Env = z.infer<typeof envSchema>;
}

export default envSchema;
```

2. Import `validateEnvVars` and your schema and add a plugin to your Vite config to call `validateEnvVars` on `buildStart`

```javascript
import { defineConfig } from 'vite';
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
});
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

# Config Options

| Option                   | Type        | Description                                                                              | Default |
| ------------------------ | ----------- | ---------------------------------------------------------------------------------------- | ------- |
| `schema`                 | `EnvObject` | The schema to validate against (must use string-based types)                             |         |
| `envPath` (optional)     | `string`    | The path to load with Node's `process.loadEnvFile()` before validation                   |         |
| `exitOnError` (optional) | `boolean`   | Whether to exit the process or throw if validation fails                                 | `false` |
| `logVars` (optional)     | `boolean`   | Whether to output successfully parsed values. Do not enable this where logs are retained | `false` |

`envPath` loads variables into `process.env`, as Node's `process.loadEnvFile()` does. Call the validator during application bootstrap if you use this option.

**Security:** `logVars` defaults to `false`, so successful values are not printed. Leave it disabled for secrets, CI logs, shared terminals, and production. Set `logVars: true` only when it is safe to expose the values.

**Schema support:** `schema` must be a `z.object()` whose fields use string-based types, such as `z.string()`, `z.enum()`, `z.literal()`, or unions and optionals composed from those types. String refinements and formats such as `.min()`, `.max()`, `.url()`, `.email()`, `.regex()`, and `.refine()` are supported. Pipelines, transforms, preprocessors, and non-string types are rejected. Environment variables are always read as strings.

# Schema Recipes

Since environment variables are always read as strings, you'll need to validate them appropriately. Here are some common patterns:

```javascript
const envNonEmptyString = () =>
	z
		.string()
		.min(1, { message: 'Variable cannot be empty' })
		.refine((val) => val !== 'undefined', {
			message: "Variable cannot equal 'undefined'",
		});

// Integer from string (with stringFormat)
const envInteger = () =>
	z.stringFormat('int', (val) => z.int().safeParse(Number(val)).success);

// Integer from string (with refine)
const envIntegerRefine = () =>
	z.string().refine((val) => Number.isInteger(Number(val)), {
		message: 'Variable must be an integer',
	});

// Boolean from string
const envBoolean = () => z.enum(['true', 'false']);
```
