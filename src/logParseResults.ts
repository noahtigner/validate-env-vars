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

// Define the expected metadata structure
// We don't need a schema here since we're just extracting metadata
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
	({ error: string; data: null } | { error: null; data: string });

/**
 * Parses and validates metadata from a Zod field type.
 * Note: .meta() method is only available in Zod Classic/Mini, not in core.
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
		console.log(`  ${HINT_SYMBOL} ${WARN_COLOR}${key}${RESET_COLOR}: ${stringifiedValue}`);
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
 * Logs a success message for each variable that was successfully parsed, and an error message for each variable that failed to parse.
 *
 * @param {SafeParseReturnType} parseResults - The result of a parsing operation.
 * @param {EnvObject} schema - The schema used to parse the input.
 * @param {boolean} logVars - Whether to output successfully parsed variables to the console.
 * @returns {number} The number of errors logged.
 */
function logParseResults(
	parseResults: ZodSafeParseReturnType,
	schema: EnvObject,
	logVars: boolean
): number {
	// get the keys from the schema (v4 only - access via _zod.def.shape)
	const shape = schema._zod.def.shape;
	const schemaKeys: Record<string, FieldResult> = {};
	for (const key of Object.keys(shape)) {
		const fieldSchema = shape[key];
		schemaKeys[key] = {
			optional: isOptional(fieldSchema),
			error: null,
			meta: parseMeta(fieldSchema),
			// if any field fails parsing, parseResults.data will be null
			// pre-populate the data with the value from process.env
			data: process.env[key] || '',
		};
	}

	// if parsing failed, update the error message for missing/invalid variables
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
		// if parsing succeeded, update the data with the parsed values
	} else {
		for (const key of Object.keys(parseResults.data)) {
			schemaKeys[key].data = parseResults.data[key] as string;
		}
	}

	let error_count = 0;

	// loop over each variable and log the result
	Object.entries(schemaKeys).forEach(([varName, res]) => {
		// parsing succeeded
		if (res.error === null && res.data !== '' && res.data !== 'undefined') {
			const varValue = logVars
				? ` ${OK_COLOR}'${res.data}'${RESET_COLOR}`
				: '';
			console.log(`${OK_SYMBOL} ${varName}${varValue}`);
		}
		// no data, but parsing did not fail and the variable is optional
		else if (res.error === null && res.optional) {
			console.log(
				`${WARN_SYMBOL} ${varName} ${WARN_COLOR}'${res.data}'${RESET_COLOR}`
			);
			logMeta(res.meta);
		}
		// parsing failed
		else {
			console.error(
				`${ERR_SYMBOL} ${varName}: ${ERR_COLOR}${res.error || ''}${RESET_COLOR}`
			);
			logMeta(res.meta);
			error_count++;
		}
	});

	return error_count;
}

export default logParseResults;
