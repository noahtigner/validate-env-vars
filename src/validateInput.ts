import { existsSync } from 'fs';
import * as z4 from 'zod/v4/core';
import type { EnvObject } from './schemaTypes';

const ALLOWED_TYPES = new Set(['string', 'enum', 'literal']);

export function isValidFieldType(field: z4.$ZodType): boolean {
	const fieldType = field._zod.def.type;
	const isBasicAllowedType = ALLOWED_TYPES.has(fieldType);
	if (isBasicAllowedType) {
		return true;
	}
	if (fieldType === 'union' && field instanceof z4.$ZodUnion) {
		// For unions, ensure all options are valid
		const options = field._zod.def.options;
		return options.every((option) => isValidFieldType(option));
		// console.log(field._zod.def.options)
	}
	if (fieldType === 'optional' && field instanceof z4.$ZodOptional) {
		// For optionals, check the inner type
		const innerType = field._zod.def.innerType;
		return isValidFieldType(innerType);
	}
	return false;
}

export function validateInputField(
	fieldName: string,
	field: z4.$ZodType
): void {
	const isV4Field =
		'_zod' in field &&
		'traits' in field._zod &&
		field._zod.traits instanceof Set;
	if (!isV4Field) {
		throw new Error(
			`The provided field must be a ZodType from Zod v4. Received: ${typeof field}`
		);
	}
	if (!isValidFieldType(field)) {
		const fieldType = field._zod.def.type;
		throw new Error(
			`Field "${fieldName}" has invalid type "${fieldType}". Environment variables must be string-based types (string, enum, literal, etc.)`
		);
	}
}

/**
 * Validates the type of the Zod schema.
 *
 * @param {EnvObject} schema - The Zod schema to validate against. Must be a z.object with string-based field types
 * @throws {Error} If the schema is not the right type.
 */
export function validateInputSchema(schema: EnvObject): void {
	// Check if it's a ZodObject (v4 Classic or Mini)
	const isV4Object =
		'_zod' in schema &&
		'traits' in schema._zod &&
		schema._zod.traits instanceof Set &&
		(schema._zod.traits.has('ZodObject') ||
			schema._zod.traits.has('ZodMiniObject'));
	if (!isV4Object) {
		throw new Error(
			`The provided schema must be a ZodObject from Zod v4. Received: ${typeof schema}`
		);
	}
	// Validate that all fields are string-based types
	const shape = schema._zod.def.shape;
	Object.entries(shape).forEach(([key, field]) => {
		validateInputField(key, field);
	});
}

/**
 * Validates that the input file exists.
 *
 * @param path - The path to the input file.
 * @throws {Error} If the file does not exist.
 */
export function validateInputFile(path: string) {
	if (!existsSync(path)) {
		throw new Error(`File not found: ${path}`);
	}
}
