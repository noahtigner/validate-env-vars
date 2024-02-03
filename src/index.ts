import { config } from 'dotenv';
import { expand } from 'dotenv-expand';
import { validateInputSchema, validateInputFile } from './validateInput';
import logParseResults from './logParseResults';
import type { ZodStringRecord } from './types';

async function validateEnvVars(
	schema: ZodStringRecord,
	envPath: string = '.env'
) {
	try {
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
	} catch (err) {
		console.error(`\x1b[31m${(err as Error).message}\x1b[0m`);
		process.exit(1);
	}
}

export default validateEnvVars;
