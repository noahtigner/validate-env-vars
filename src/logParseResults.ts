import type { ZodSafeParseReturnType, ZodStringRecord } from './types';

const ERR_SYMBOL = '\x1b[31m✕\x1b[0m';
const OK_SYMBOL = '\x1b[32m✔\x1b[0m';

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
				`${ERR_SYMBOL} ${varName}: \x1b[31m${errorMessage}\x1b[0m`
			);
		}
	});

	return Object.values(schemaKeys).filter(Boolean).length;
}

export default logParseResults;
export { ERR_SYMBOL, OK_SYMBOL };
