import { existsSync } from 'fs';
import * as z4 from 'zod/v4/core';

import { OK_COLOR, RESET_COLOR } from './constants';
import logParseResults from './logParseResults';
import type { EnvObject, Config } from './schemaTypes';

interface InnerConfig
	extends Required<Omit<Config, 'exitOnError' | 'envPath'>> {
	vars: Record<string, string>;
}

const ALLOWED_TYPES = new Set(['string', 'enum', 'literal']);

/**
 * Checks if a Zod field type is valid for environment variable validation.
 *
 * Environment variables are always strings, so this validates that the field type
 * is string-based (string, enum, literal) or a composition of string-based types
 * (union, optional).
 *
 * @param field - The Zod type to validate
 * @returns `true` if the field type is valid for environment variables, `false` otherwise
 */
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

/**
 * Validates that a single schema field is a valid Zod v4 type with string-based validation.
 *
 * @param fieldName - The name of the field being validated (for error messages)
 * @param field - The Zod type to validate
 * @throws {Error} If the field is not a Zod v4 type or has an invalid type for environment variables
 */
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
export function validateInputFile(path: string | undefined): void {
	if (path && !existsSync(path)) {
		throw new Error(`File not found: ${path}`);
	}
}

/**
 * Filters environment variables to only include those defined in the schema.
 *
 * @param options - Configuration object containing the schema and environment variables
 * @param options.schema - The Zod schema defining expected environment variables
 * @param options.vars - The environment variables object to filter
 * @returns An object containing only the environment variables that are defined in the schema
 */
function filterEnvVarsBySchema(options: Omit<InnerConfig, 'logVars'>) {
	const { schema, vars } = options;
	const schemaKeys = Object.keys(schema._zod.def.shape);
	const filteredVars = Object.fromEntries(
		Object.entries(vars).filter(([key]) => schemaKeys.includes(key))
	);
	return filteredVars;
}

/**
 * Validates environment variables against a Zod schema and logs the results.
 *
 * Filters the provided variables to only those defined in the schema, validates them,
 * and logs detailed results for each variable. Throws an error if validation fails.
 *
 * @param options - The configuration object
 * @param options.schema - The Zod schema defining expected environment variables
 * @param options.vars - The environment variables to validate
 * @param options.logVars - Whether to log variable values (true) or just names (false)
 * @throws {Error} If any required variables are missing or invalid
 */
export function validate(options: InnerConfig) {
	const { schema, vars, logVars } = options;
	console.log(vars);

	// filter out any env vars not included in the schema
	const filteredVars = filterEnvVarsBySchema({ schema, vars });

	// validate the environment variables using Zod 4 top-level safeParse
	const parsed = z4.safeParse(schema, filteredVars);

	// log the results for each variable & count the errors
	const errorCount = logParseResults(parsed, schema, vars, logVars);

	// throw if parsing failed
	if (!parsed.success) {
		const plural = errorCount === 1 ? '' : 's';
		throw new Error(
			`${errorCount.toString()} missing or invalid environment variable${plural}`
		);
	}

	console.log(
		`${OK_COLOR}All required environment variables are valid${RESET_COLOR}`
	);
}
