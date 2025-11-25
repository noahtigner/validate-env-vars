import { config } from 'dotenv';
import { expand } from 'dotenv-expand';

/**
 * Loads and expands environment variables from a .env file.
 * 
 * Uses dotenv to parse the .env file and dotenv-expand to handle variable expansion.
 * The loaded variables are merged into process.env.
 *
 * @param envPath - The path to the .env file to load
 * @returns The environment variables as a key-value object
 * @throws {Error} If the .env file cannot be read or parsed
 */
export function loadEnvVars(envPath: string): Record<string, string> {
	// use dotenv to parse the .env file and prepare process.env
	const out = config({ path: envPath });
	if (out.error) {
		throw new Error(out.error.message);
	}

	// use dotenv-expand to expand variables
	expand(out);

	return process.env as Record<string, string>;
}
