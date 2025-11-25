import {
	ERR_COLOR,
	ERR_SYMBOL,
	HINT_SYMBOL,
	OK_COLOR,
	OK_SYMBOL,
	RESET_COLOR,
	WARN_COLOR,
	WARN_SYMBOL,
} from './constants';
import type { EnvObject, ZodSafeParseReturnType } from './schemaTypes';

// we don't need a schema here since we're just extracting metadata
type FieldMeta = {
	title?: string;
	description?: string;
	examples?: string[];
};

type FieldResultBase = {
	optional: boolean;
	meta: FieldMeta;
};
type FieldResult = FieldResultBase &
	({ error: string; data: null } | { error: null; data: string | undefined });

/**
 * Parses and validates metadata from a Zod field type.
 *
 * @param field - The Zod type to extract metadata from
 * @returns The parsed and validated metadata object if successful, otherwise empty object
 */
export function parseMeta(field: unknown): FieldMeta {
	// Access meta if available (works with Zod Classic/Mini)
	const fieldMeta = (field as { meta?: () => unknown }).meta?.();
	if (!fieldMeta || typeof fieldMeta !== 'object') {
		return {};
	}

	// Extract only the fields we care about
	const meta = fieldMeta as Record<string, unknown>;
	const result: FieldMeta = {};

	if (typeof meta.title === 'string') {
		result.title = meta.title;
	}
	if (typeof meta.description === 'string') {
		result.description = meta.description;
	}
	if (
		Array.isArray(meta.examples) &&
		meta.examples.every((e) => typeof e === 'string')
	) {
		result.examples = meta.examples;
	}

	return result;
}

/**
 * Logs metadata information for a Zod field to the console.
 *
 * @param meta - The parsed metadata object to log
 */
export function logMeta(meta: FieldMeta) {
	// Only log if there are actual metadata fields
	const entries = Object.entries(meta);
	if (entries.length === 0) return;

	entries.forEach(([key, value]) => {
		const stringifiedValue =
			typeof value === 'string' ? value : JSON.stringify(value);
		const out =
			`  ${HINT_SYMBOL} ${WARN_COLOR}${key}${RESET_COLOR}: ${stringifiedValue}`.trimEnd();
		console.log(out);
	});
}

/**
 * Checks if a Zod type is optional by examining its internal traits.
 *
 * This function inspects the internal `_zod.traits` structure of a Zod type
 * to determine if it has been marked as optional using `z.optional()`.
 *
 * @param zodType - The Zod type object to check for optionality
 * @returns `true` if the type is a ZodOptional type, `false` otherwise
 */
export function isOptional(zodType: unknown): boolean {
	if (typeof zodType !== 'object' || zodType === null) return false;
	const traits = (zodType as { _zod?: { traits?: Set<string> } })._zod
		?.traits;
	return traits instanceof Set && traits.has('ZodOptional');
}

/**
 * Logs the results of a parsing operation.
 *
 * Outputs different messages based on the validation result:
 * - Success (✔): Variable validated successfully with its value
 * - Warning (⚠): Optional variable is undefined or empty
 * - Error (✕): Variable failed validation with the error message
 *
 * Also displays metadata (description, examples) when available for optional or failed variables.
 *
 * @param parseResults - The result from Zod's safeParse operation
 * @param schema - The Zod schema used for validation
 * @param vars - The environment variables object (for displaying values)
 * @param logVars - Whether to include variable values in the output (false shows only variable names)
 * @returns The number of validation errors encountered
 */
function logParseResults(
	parseResults: ZodSafeParseReturnType,
	schema: EnvObject,
	vars: Record<string, string>,
	logVars: boolean
): number {
	// Extract the schema shape to get all field definitions
	const shape = schema._zod.def.shape;
	const schemaKeys: Record<string, FieldResult> = {};
	for (const [key, fieldSchema] of Object.entries(shape)) {
		schemaKeys[key] = {
			optional: isOptional(fieldSchema),
			error: null,
			meta: parseMeta(fieldSchema),
			// Pre-populate with the raw value from vars (will be replaced if parsing succeeded)
			data: key in vars ? vars[key] : undefined,
		};
	}

	// If parsing failed, populate error messages for each failed field
	if (!parseResults.success) {
		for (const issue of parseResults.error.issues) {
			const varName = issue.path[0] as number | string;
			const error = issue.message;
			schemaKeys[varName] = {
				...schemaKeys[varName],
				data: null,
				error,
			};
		}
		// If parsing succeeded, update with the validated/transformed values
	} else {
		const { data } = parseResults;
		for (const [key, val] of Object.entries(data)) {
			schemaKeys[key].data = val as string;
		}
	}

	let error_count = 0;

	// Log the result for each schema field
	Object.entries(schemaKeys).forEach(([varName, res]) => {
		// Validation succeeded and variable has a non-empty value
		if (res.error === null && res.data !== undefined && res.data !== '') {
			const varValue = logVars
				? ` ${OK_COLOR}'${res.data}'${RESET_COLOR}`
				: '';
			const out = `${OK_SYMBOL} ${varName}${varValue}`.trim();
			console.log(out);
		}
		// Variable is undefined or empty, but validation didn't fail (optional field)
		else if (res.error === null) {
			const varValue =
				res.data === undefined ? 'undefined' : `'${res.data}'`;
			const dataString = logVars
				? `${WARN_COLOR}${varValue}${RESET_COLOR}`
				: '';
			const out = `${WARN_SYMBOL} ${varName} ${dataString}`.trim();
			console.log(out);
			logMeta(res.meta);
		}
		// Validation failed for this variable
		else {
			const out =
				`${ERR_SYMBOL} ${varName}: ${ERR_COLOR}${res.error || ''}${RESET_COLOR}`.trim();
			console.error(out);
			logMeta(res.meta);
			error_count++;
		}
	});

	return error_count;
}

export default logParseResults;
