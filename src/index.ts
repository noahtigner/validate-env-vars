import { config } from 'dotenv';
import { expand } from 'dotenv-expand';

import { validateInputSchema, validateInputFile } from './validateInput';
import logParseResults from './logParseResults';
import { ERR_COLOR, OK_COLOR, RESET_COLOR } from './constants';
import type { EnvObject } from './schemaTypes';

interface Config {
	schema: EnvObject;
	envPath?: string;
	exitOnError?: boolean;
	logVars?: boolean;
}

/**
 * Validate environment variables against a Zod schema
 *
 * @param {Config} options - The configuration object
 */
function validate(options: Required<Omit<Config, 'exitOnError'>>) {
	const { schema, envPath, logVars } = options;

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
	const errorCount = logParseResults(parsed, schema, logVars);

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
 * @param {Config} options The configuration object
 * @property {EnvObject} schema The schema to validate against
 * @property {string} envPath - The path to the .env file. Defaults to `'.env'`
 * @property {boolean} exitOnError - Whether to exit the process or throw if validation fails. Defaults to `false`
 * @property {boolean} logVars - Whether to output successfully parsed variables to the console. Defaults to `true`
 * @throws {Error} If a required environment variable is missing or invalid and `exitOnError` is `false`
 */
function validateEnvVars({
	schema,
	envPath = '.env',
	exitOnError = false,
	logVars = true,
}: Config) {
	try {
		validate({ schema, envPath, logVars });
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
