import { existsSync } from 'fs';
import { ZodObject } from 'zod';
import type { ZodStringRecord } from './types';

function validateInputSchema(schema: ZodStringRecord) {
	if (!(schema instanceof ZodObject)) {
		throw new Error(
			`The provided schema must be a ZodObject. Received: ${typeof schema}`
		);
	}
}

function validateInputFile(path: string) {
	if (!existsSync(path)) {
		throw new Error(`File not found: ${path}`);
	}
}

export { validateInputSchema, validateInputFile };
