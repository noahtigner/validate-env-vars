import { ERR_COLOR, RESET_COLOR } from './constants';
import {
	validateInputSchema,
	validateInputFile,
	validate,
} from './validateInput';
import { loadEnvVars } from './loadEnvVars';
import type { Config } from './schemaTypes';

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
		const envVars = loadEnvVars(envPath);
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
