import fs from 'fs';
import path from 'path';
import process from 'process';

const ERR_SYMBOL = '\x1b[31m✖\x1b[0m';
const OK_SYMBOL = '\x1b[32m✔\x1b[0m';
const WARN_SYMBOL = '\x1b[33m⚠\x1b[0m';

const OPTIONAL_SUFFIX = ' (optional)';

/**
 * Checks if an environment variable is defined and has a non-empty value in a given line.
 *
 * @param {string} envVar - The name of the environment variable to check.
 * @param {string} line - The line from the .env file to check.
 * @returns {boolean} - Returns true if the environment variable is defined and has a non-empty value, false otherwise.
 */
const validateEnvVar = (envVar: string, line: string): boolean => {
	const [envVal, comment] = line.split(' ');
	// the ASCII range for all printable characters except spaces is from ! (33) to ~ (126)
	const regex = new RegExp(`^${envVar}=([!-~]+)$`);
	const valIsValid = regex.test(envVal);
	const commentIsValid = !comment || comment.startsWith('#');
	return valIsValid && commentIsValid;
};

/**
 * Validates that the specified environment variables are defined in the given .env file.
 *
 * @param {string[]} expectedEnvVars - A list of the names of the environment variables to check.
 * @param {string[]} receivedEnvVars - A list of the names of the environment variables that were found in the .env file.
 * @throws {Error} - If the .env file does not exist, or if any of the environment variables are missing or invalid.
 * @returns {void}
 */
const validateEnvVars = (
	expectedEnvVars: string[],
	receivedEnvVars: string[]
): void => {
	const expectedSet = new Set(expectedEnvVars);
	const missing = [];

	for (const envVar of expectedSet) {
		const isOptional = envVar.endsWith(OPTIONAL_SUFFIX);
		const strippedEnvVar = envVar.replace(OPTIONAL_SUFFIX, '');

		if (
			!receivedEnvVars.find((line) =>
				validateEnvVar(strippedEnvVar, line)
			)
		) {
			if (isOptional) {
				console.warn(`${WARN_SYMBOL} ${envVar}`);
				continue;
			}
			missing.push(envVar);
			console.error(`${ERR_SYMBOL} ${envVar}`);
		} else {
			console.log(`${OK_SYMBOL} ${envVar}`);
		}
	}

	if (missing.length > 0) {
		throw new Error(
			`Missing or invalid environment variable${
				missing.length === 1 ? '' : 's'
			}: ${missing.join(', ')}`
		);
	}
};

/**
 * Extracts the name of an environment variable from a given line; strips out any comments or whitespace.
 *
 * @param {string} line - The line from the .env file to check.
 * @returns {string} - The name of the environment variable. " (optional)" is appended to the name if the variable is optional.
 */
const parseTemplateEnvVar = (line: string): string => {
	const isOptional = line.toLowerCase().includes('# optional');
	const strippedLine = line.split('=')[0].split(' ')[0].split('#')[0].trim();
	return isOptional ? `${strippedLine}${OPTIONAL_SUFFIX}` : strippedLine;
};

/**
 * Returns each line from a given .env file as an array of strings.
 *
 * @param {string} envFilePath - The path to the .env file to parse.
 * @throws {Error} - If the .env file does not exist or cannot be read.
 * @returns {string[]} - An array of strings, where each string represents a line from the .env file.
 */
const parseEnvFile = (envFilePath: string): string[] => {
	const absoluteEnvFilePath = path.resolve(process.cwd(), envFilePath);

	if (!fs.existsSync(absoluteEnvFilePath)) {
		throw new Error(`File not found: ${absoluteEnvFilePath}`);
	}

	const envFileContent: string[] = fs
		.readFileSync(absoluteEnvFilePath, 'utf-8')
		.split('\n')
		.filter((line) => line.trim() !== '' && !line.trim().startsWith('#'));

	return envFileContent;
};

export { validateEnvVars, validateEnvVar, parseTemplateEnvVar, parseEnvFile };
