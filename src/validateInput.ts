import { existsSync } from 'fs';

import { OK_COLOR, RESET_COLOR } from './constants';
import logParseResults from './logParseResults';
import type { EnvObject, Config } from './schemaTypes';
import {
	isZodV4Schema,
	isZodV3Schema,
	isZodV4Field,
	isZodV3Field,
	getSchemaShape,
	getFieldType,
	getInnerType,
	getUnionOptions,
	safeParse,
} from './zodVersionHelpers';

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
export function isValidFieldType(field: unknown): boolean {
	const fieldType = getFieldType(field);
	const isBasicAllowedType = ALLOWED_TYPES.has(fieldType);
	if (isBasicAllowedType) {
		return true;
	}
	if (fieldType === 'union') {
		// For unions, ensure all options are valid
		const options = getUnionOptions(field);
		return options.every((option) => isValidFieldType(option));
	}
	if (fieldType === 'optional') {
		// For optionals, check the inner type
		const innerType = getInnerType(field);
		return isValidFieldType(innerType);
	}
	return false;
}

/**
 * Validates that a single schema field is a valid Zod type with string-based validation.
 *
 * Works with both Zod v3 and v4.
 *
 * @param fieldName - The name of the field being validated (for error messages)
 * @param field - The Zod type to validate
 * @throws {Error} If the field is not a Zod type or has an invalid type for environment variables
 */
export function validateInputField(fieldName: string, field: unknown): void {
	const isValidZodField = isZodV4Field(field) || isZodV3Field(field);
	if (!isValidZodField) {
		throw new Error(
			`The provided field must be a ZodType from Zod v3 or v4. Received: ${typeof field}`
		);
	}
	if (!isValidFieldType(field)) {
		const fieldType = getFieldType(field);
		throw new Error(
			`Field "${fieldName}" has invalid type "${fieldType}". Environment variables must be string-based types (string, enum, literal, etc.)`
		);
	}
}

/**
 * Validates the type of the Zod schema.
 *
 * Works with both Zod v3 and v4.
 *
 * @param {EnvObject} schema - The Zod schema to validate against. Must be a z.object with string-based field types
 * @throws {Error} If the schema is not the right type.
 */
export function validateInputSchema(schema: EnvObject): void {
	// Check if it's a valid Zod schema (v3 or v4)
	const isValidSchema = isZodV4Schema(schema) || isZodV3Schema(schema);
	if (!isValidSchema) {
		throw new Error(
			`The provided schema must be a ZodObject from Zod v3 or v4. Received: ${typeof schema}`
		);
	}
	// Validate that all fields are string-based types
	const shape = getSchemaShape(schema);
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

/**
 * Filters environment variables to only include those defined in the schema.
 *
 * Works with both Zod v3 and v4.
 *
 * @param options - Configuration object containing the schema and environment variables
 * @param options.schema - The Zod schema defining expected environment variables
 * @param options.vars - The environment variables object to filter
 * @returns An object containing only the environment variables that are defined in the schema
 */
function filterEnvVarsBySchema(options: Omit<InnerConfig, 'logVars'>) {
	const { schema, vars } = options;
	const shape = getSchemaShape(schema);
	const schemaKeys = Object.keys(shape);
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
 * Works with both Zod v3 and v4.
 *
 * @param options - The configuration object
 * @param options.schema - The Zod schema defining expected environment variables
 * @param options.vars - The environment variables to validate
 * @param options.logVars - Whether to log variable values (true) or just names (false)
 * @throws {Error} If any required variables are missing or invalid
 */
export function validate(options: InnerConfig) {
	const { schema, vars, logVars } = options;

	// filter out any env vars not included in the schema
	const filteredVars = filterEnvVarsBySchema({ schema, vars });

	// validate the environment variables using the appropriate version
	const parsed = safeParse(schema, filteredVars);

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
