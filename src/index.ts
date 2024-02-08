import { config } from 'dotenv';
import { expand } from 'dotenv-expand';

import { validateInputSchema, validateInputFile } from './validateInput';
import logParseResults from './logParseResults';
import { ERR_COLOR, OK_COLOR, RESET_COLOR } from './constants';
import type { EnvObject } from './schemaTypes';

/**
 * Validate environment variables against a Zod schema
 *
 * @param {EnvObject} schema - The Zod schema to validate against. Must be a z.object of z.strings or z.enums
 * @param {string} envPath - The path to the .env file to use (defaults to '.env')
 * @throws {Error} If any environment variables are missing or invalid, or if `envPath` is not found
 */
function validate(schema: EnvObject, envPath: string) {
	validateInputSchema(schema);
	validateInputFile(envPath);

	// use dotenv to parse the .env file (if provided) and prepare process.env
	const out = config({ path: envPath });
	if (out.error) {
		throw new Error(out.error.message);
	}

	// use dotenv-expand to expand variables
	expand(out);

	// validate the environment variables
	const parsed = schema.safeParse(process.env);

	// log the results for each variable & count the errors
	const errorCount = logParseResults(parsed, schema);

	// throw if parsing failed
	if (!parsed.success) {
		throw new Error(
			`${errorCount} missing or invalid environment variable${errorCount === 1 ? '' : 's'}`
		);
	}

	console.log(
		`${OK_COLOR}All required environment variables are valid${RESET_COLOR}`
	);
}

/**
 * Validate environment variables against a Zod schema
 *
 * @param {EnvObject} schema - The Zod schema to validate against. Must be a z.object of z.strings or z.enums
 * @param {string} envPath - The path to the .env file to use (defaults to '.env')
 * @param {boolean} exitOnError - Whether to exit the process if validation fails (defaults to false)
 */
function validateEnvVars(
	schema: EnvObject,
	envPath: string = '.env',
	exitOnError: boolean = false
) {
	try {
		validate(schema, envPath);
	} catch (err) {
		if (exitOnError) {
			console.error(
				`${ERR_COLOR}${(err as Error).message}${RESET_COLOR}`
			);
			process.exit(1);
		} else {
			throw err;
		}
	}
}

export default validateEnvVars;
export * from './schemaTypes';
