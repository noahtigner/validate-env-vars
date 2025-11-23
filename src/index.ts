import { config } from 'dotenv';
import { expand } from 'dotenv-expand';
import * as z4 from 'zod/v4/core';

import { validateInputSchema, validateInputFile } from './validateInput';
import logParseResults from './logParseResults';
import { ERR_COLOR, OK_COLOR, RESET_COLOR } from './constants';
import type { EnvObject } from './schemaTypes';

// Use generic constraint to preserve schema type information
interface Config {
	schema: EnvObject;
	envPath?: string;
	exitOnError?: boolean;
	logVars?: boolean;
}
interface InnerConfig
	extends Required<Omit<Config, 'exitOnError' | 'envPath'>> {
	vars: Record<string, string>;
}

/**
 * Validate environment variables against a Zod schema
 *
 * @param {Config} options - The configuration object
 */
function validate(options: InnerConfig) {
	const { schema, vars, logVars } = options;

	// validate the environment variables using Zod 4 top-level safeParse
	const parsed = z4.safeParse(schema, vars);

	// log the results for each variable & count the errors
	const errorCount = logParseResults(parsed, schema, logVars);

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

function extractEnvVars(envPath: string): Record<string, string> {
	// use dotenv to parse the .env file (if provided) and prepare process.env
	const out = config({ path: envPath });
	if (out.error) {
		throw new Error(out.error.message);
	}

	// use dotenv-expand to expand variables
	expand(out);

	return process.env as Record<string, string>;
}

/**
 * Validate environment variables against a Zod schema
 *
 * @param {Config} options The configuration object
 * @property {EnvObject} schema The schema to validate against (must be z.object with string-based fields)
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
		validateInputSchema(schema);
		validateInputFile(envPath);
		const envVars = extractEnvVars(envPath);
		validate({ schema, vars: envVars, logVars });
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
