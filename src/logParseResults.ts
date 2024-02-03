import { ERR_COLOR, ERR_SYMBOL, OK_SYMBOL, RESET_COLOR } from './constants';
import type { ZodSafeParseReturnType, ZodStringRecord } from './types';

/**
 * Logs the results of a parsing operation.
 *
 * Logs a success message for each variable that was successfully parsed, and an error message for each variable that failed to parse.
 *
 * @param {SafeParseReturnType} parseResults - The result of a parsing operation.
 * @param {ZodStringRecord} schema - The schema used to parse the input.
 * @returns {number} The number of errors logged.
 */
function logParseResults(
	parseResults: ZodSafeParseReturnType,
	schema: ZodStringRecord
): number {
	// get the keys from the schema
	const schemaKeys: Record<string, string | null> = {};
	for (const key of Object.keys(schema.shape)) {
		schemaKeys[key] = null;
	}

	if (!parseResults.success) {
		for (const issue of parseResults.error.issues) {
			const varName = issue.path[0];
			const errorMessage = issue.message;
			schemaKeys[varName] = errorMessage;
		}
	}

	// loop over each variable and log the result
	Object.entries(schemaKeys).forEach(([varName, errorMessage]) => {
		if (errorMessage === null) {
			console.log(`${OK_SYMBOL} ${varName}`);
		} else {
			console.error(
				`${ERR_SYMBOL} ${varName}: ${ERR_COLOR}${errorMessage}${RESET_COLOR}`
			);
		}
	});

	return Object.values(schemaKeys).filter(Boolean).length;
}

export default logParseResults;
