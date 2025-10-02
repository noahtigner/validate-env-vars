import { existsSync } from 'fs';
import { ZodObject } from 'zod';
import { ALLOWED_TYPE_NAMES } from './constants';
import type { EnvObject } from './schemaTypes';

/**
 * Validates the type of the Zod schema.
 *
 * @param {EnvObject} schema - The Zod schema to validate against. Must be a z.object of z.strings, z.enums, and z.literals
 * @throws {Error} If the schema is not the right type.
 */
function validateInputSchema(schema: EnvObject) {
	if (!(schema instanceof ZodObject)) {
		throw new Error(
			`The provided schema must be a ZodObject. Received: ${typeof schema}`
		);
	}
	Object.values(schema.shape).forEach((field) => {
		const typeName: Set<string> = field._zod.traits;
		let containsTypeName = false;
		typeName.forEach(element => {
			if (ALLOWED_TYPE_NAMES.includes(element)) {
				containsTypeName = true;
			}
		});
		if (!containsTypeName) {
			throw new Error(
				`All fields in the schema must be Zod strings, Zod literals, or Zod enums. Received: ${typeName}`
			);
		}
	});
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
