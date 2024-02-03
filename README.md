<h1 align="center">validate-env-vars</h1>

<div align="center">

[![license](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/noahtigner/validate-env-vars/blob/HEAD/LICENSE)
[![latest](https://img.shields.io/npm/v/validate-env-vars/latest.svg)](https://www.npmjs.com/package/validate-env-vars)
[![last commit](https://img.shields.io/github/last-commit/noahtigner/validate-env-vars.svg)](https://github.com/noahtigner/validate-env-vars/)
[![npm downloads](https://img.shields.io/npm/dm/validate-env-vars.svg)](https://www.npmjs.com/package/validate-env-vars) \
[![Coverage](./badges/coverage.svg)](./badges/coverage.svg)
[![Code Quality](https://github.com/noahtigner/validate-env-vars/actions/workflows/quality.yml/badge.svg)](https://github.com/noahtigner/validate-env-vars/actions/workflows/quality.yml)
[![CodeQL](https://github.com/noahtigner/validate-env-vars/actions/workflows/codeql.yml/badge.svg)](https://github.com/noahtigner/validate-env-vars/actions/workflows/codeql.yml)
[![TypeScript Version](https://img.shields.io/github/package-json/dependency-version/rosswilliams/ts-case-convert/dev/typescript.svg)](https://github.com/noahtigner/validate-env-vars/blob/main/package.json#L112)

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

import { z } from 'zod';
import validateEnvVars from 'validate-env-vars';

const envSchema = z.object({
	PORT: z.string(),
	NODE_ENV: z.string(),
	API_URL: z.string(),
});

validateEnvVars(envSchema);
```

---

### Programmatically check an .env.production file against a Zod schema:

```javascript
import { z } from 'zod';
import validateEnvVars from 'validate-env-vars';

const envSchema = z.object({
    PORT: z.string(),
    NODE_ENV: z.string(),
    GITHUB_USERNAME: z.string(),
});

const prefilight() => {
    try {
        validateEnvVars(envSchema, '.env.production');
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
import { z } from 'zod';

// define the schema for the environment variables
const envSchema = z.object({
    PATH_PREFIX: z.string(),
    NODE_ENV: z.enum(['development', 'production', 'test']),
    API_URL: z.string().url(),
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
      buildStart: () => validateEnvVars(envConfigSchema),
    },
    // other plugins...
  ],
  // other options...
```
