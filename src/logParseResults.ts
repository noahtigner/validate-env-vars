import {
	ERR_COLOR,
	ERR_SYMBOL,
	OK_COLOR,
	OK_SYMBOL,
	RESET_COLOR,
	WARN_COLOR,
	WARN_SYMBOL,
} from './constants';
import type { EnvObject, ZodSafeParseReturnType } from './schemaTypes';
import { z, type ZodType } from 'zod';

type FieldResult =
	| { optional: boolean; error: string; data: null }
	| { optional: boolean; error: null; data: string };

const fieldMetaSchema = z.object({
	title: z.string().optional(),
	description: z.string().optional(),
	examples: z.array(z.string()).optional(),
});

/**
 * Parses and validates metadata from a Zod field type.
 * 
 * @param field - The Zod type to extract metadata from
 * @returns The parsed and validated metadata object if successful, otherwise null
 */
export function parseMeta(field: ZodType): z.infer<typeof fieldMetaSchema> | Record<string, never> {
	const fieldMeta = field.meta();
	if (!fieldMeta) return {};
	const parsed = fieldMetaSchema.safeParse(fieldMeta);
	if (!parsed.success) return {};
	return parsed.data;
}

/**
 * Logs metadata information for a Zod field to the console.
 * 
 * @param field - The Zod type to extract and log metadata from
 */
export function logMeta(field: ZodType) {
	const meta = parseMeta(field);
	Object.entries(meta).forEach(([key, value]) => {
		const stringifiedValue = typeof value === 'string' ? value : JSON.stringify(value);
		console.log(`  - ${key}: ${stringifiedValue}`);
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
	const traits = (zodType as { _zod?: { traits?: Set<string> } })._zod?.traits;
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
	// get the keys from the schema
	const schemaKeys: Record<string, FieldResult> = {};
	for (const key of Object.keys(schema.shape)) {
		const fieldSchema = schema.shape[key];
		schemaKeys[key] = {
			optional: isOptional(fieldSchema),
			error: null,
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
			logMeta(schema.shape[varName] as ZodType);
		}
		// parsing failed
		else {
			console.error(
				`${ERR_SYMBOL} ${varName}: ${ERR_COLOR}${res.error || ''}${RESET_COLOR}`
			);
			logMeta(schema.shape[varName] as ZodType);
			error_count++;
		}
	});

	return error_count;
}

export default logParseResults;
