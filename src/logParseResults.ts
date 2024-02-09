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

type FieldResult =
	| { optional: boolean; error: string; data: null }
	| { optional: boolean; error: null; data: string };

/**
 * Logs the results of a parsing operation.
 *
 * Logs a success message for each variable that was successfully parsed, and an error message for each variable that failed to parse.
 *
 * @param {SafeParseReturnType} parseResults - The result of a parsing operation.
 * @param {EnvObject} schema - The schema used to parse the input.
 * @returns {number} The number of errors logged.
 */
function logParseResults(
	parseResults: ZodSafeParseReturnType,
	schema: EnvObject
): number {
	// get the keys from the schema
	const schemaKeys: Record<string, FieldResult> = {};
	for (const key of Object.keys(schema.shape)) {
		schemaKeys[key] = {
			optional: schema.shape[key].isOptional(),
			error: null,
			// if any field fails parsing, parseResults.data will be null
			// pre-populate the data with the value from process.env
			data: `${process.env[key]}`,
		};
	}

	if (!parseResults.success) {
		// if parsing failed, update the error message for missing/invalid variables
		for (const issue of parseResults.error.issues) {
			const varName = issue.path[0];
			const error = issue.message;
			schemaKeys[varName] = {
				...schemaKeys[varName],
				data: null,
				error,
			};
		}
	} else {
		// if parsing succeeded, update the data with the parsed values
		for (const key of Object.keys(parseResults.data)) {
			schemaKeys[key].data = parseResults.data[key] as string;
		}
	}

	let error_count = 0;

	// loop over each variable and log the result
	Object.entries(schemaKeys).forEach(([varName, res]) => {
		// parsing succeeded
		if (res.error === null && res.data !== '' && res.data !== 'undefined') {
			console.log(
				`${OK_SYMBOL} ${varName} ${OK_COLOR}'${res.data}'${RESET_COLOR}`
			);
		}
		// no data, but parsing did not fail and the variable is optional
		else if (res.error === null && res.optional) {
			console.log(
				`${WARN_SYMBOL} ${varName} ${WARN_COLOR}'${res.data}'${RESET_COLOR}`
			);
		}
		// parsing failed
		else {
			console.error(
				`${ERR_SYMBOL} ${varName}: ${ERR_COLOR}${res.error}${RESET_COLOR}`
			);
			error_count++;
		}
	});

	return error_count;
}

export default logParseResults;
