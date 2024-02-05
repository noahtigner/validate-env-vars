import { config } from 'dotenv';
import { expand } from 'dotenv-expand';

import { validateInputSchema, validateInputFile } from './validateInput';
import logParseResults from './logParseResults';
import { ERR_COLOR, OK_COLOR, RESET_COLOR } from './constants';
import type { ZodStringRecord } from './types';

/**
 * Validate environment variables against a Zod schema
 *
 * @param schema - The Zod schema to validate against. Must be a z.object of z.strings or z.enums
 * @param envPath - The path to the .env file to use (defaults to '.env')
 * @throws {Error} If any environment variables are missing or invalid, or if `envPath` is not found
 */
function validate(schema: ZodStringRecord, envPath: string) {
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
			`${errorCount} Missing or invalid environment variables`
		);
	}

	console.log(
		`${OK_COLOR}All required environment variables are valid${RESET_COLOR}`
	);
}

/**
 * Validate environment variables against a Zod schema
 *
 * @param schema - The Zod schema to validate against. Must be a z.object of z.strings or z.enums
 * @param envPath - The path to the .env file to use (defaults to '.env')
 * @param exitOnError - Whether to exit the process if validation fails (defaults to true)
 */
function validateEnvVars(
	schema: ZodStringRecord,
	envPath: string = '.env',
	exitOnError: boolean = true
) {
	try {
		validate(schema, envPath);
	} catch (err) {
		console.error(`${ERR_COLOR}${(err as Error).message}${RESET_COLOR}`);
		if (exitOnError) {
			process.exit(1);
		} else {
			throw err;
		}
	}
}

export default validateEnvVars;
export * from './schemaTypes';
