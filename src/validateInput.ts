import { existsSync } from 'fs';
import { ZodObject } from 'zod';
import type { ZodStringRecord } from './types';

/**
 * Validates the type of the Zod schema.
 * 
 * @param schema - The Zod schema to validate against. Must be a z.object of z.strings or z.enums
 * @throws {Error} If the schema is not the right type.
 */
function validateInputSchema(schema: ZodStringRecord) {
	if (!(schema instanceof ZodObject)) {
		throw new Error(
			`The provided schema must be a ZodObject. Received: ${typeof schema}`
		);
	}
}

/**
 * Validates that the input file exists.
 * 
 * @param path - The path to the input file.
 * @throws {Error} If the file does not exist.
 */
function validateInputFile(path: string) {
	if (!existsSync(path)) {
		throw new Error(`File not found: ${path}`);
	}
}

export { validateInputSchema, validateInputFile };
