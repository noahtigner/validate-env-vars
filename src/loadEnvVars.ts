import { loadEnvFile } from 'node:process';

type EnvRecord = Record<string, string>;
type EnvRecordRaw = Record<string, string | undefined>;

/**
 * Resolves escape sequences in a string by converting `\$` to `$`.
 * This allows literal dollar signs in environment variable values.
 *
 * @param value - The string containing potential escape sequences
 * @returns The string with escape sequences resolved
 *
 * @example
 * resolveEscapeSequences('\\$VAR') // Returns '$VAR'
 * resolveEscapeSequences('price: \\$100') // Returns 'price: $100'
 *
 * Loosely based on dotenv-expand
 * @link https://github.com/motdotla/dotenv-expand
 */
export function resolveEscapeSequences(value: string): string {
	return value.replace(/\\\$/g, '$');
}

/**
 * Expands environment variable references in a string value.
 *
 * Supports the following syntaxes:
 * - `${VAR}` - Braced variable reference
 * - `$VAR` - Unbraced variable reference
 * - `${VAR:-default}` - Default value if VAR is unset or empty
 * - `${VAR-default}` - Default value if VAR is unset
 * - `${VAR:+alternate}` - Alternate value if VAR is set and non-empty
 * - `${VAR+alternate}` - Alternate value if VAR is set
 *
 * Escaped dollar signs (`\$`) are not expanded.
 *
 * @param value - The string containing variable references to expand
 * @param env - Primary environment variables (takes precedence)
 * @param runningParsed - Previously parsed variables for progressive expansion
 * @returns The string with all variable references expanded
 *
 * @example
 * expandValue('Hello ${NAME}', { NAME: 'World' }, {}) // 'Hello World'
 * expandValue('${PORT:-3000}', {}, {}) // '3000'
 *
 * Loosely based on dotenv-expand
 * @link https://github.com/motdotla/dotenv-expand
 */
export function expandValue(
	value: string,
	env: EnvRecordRaw,
	runningParsed: EnvRecord
): string {
	// Merge environments: env takes precedence over runningParsed
	const mergedEnv: EnvRecordRaw = { ...runningParsed, ...env };

	// Match ${VAR} or $VAR, but not escaped \${VAR} or \$VAR
	const variableRegex =
		/(?<!\\)\${([^{}]+)}|(?<!\\)\$([A-Za-z_][A-Za-z0-9_]*)/g;

	let result = value;
	let match: RegExpExecArray | null;
	const seen = new Set<string>(); // Track seen values to prevent infinite loops

	while ((match = variableRegex.exec(result)) !== null) {
		// Add current result to seen set to detect self-references
		seen.add(result);

		const [template, bracedExpr, unbracedExpr] = match;
		const expression = bracedExpr || unbracedExpr;

		// Parse operators: :+ (alternate if set), + (alternate), :- (default if empty), - (default)
		const operatorMatch = expression.match(/(:\+|\+|:-|-)/);
		const operator = operatorMatch?.[0] ?? null;

		// Split expression by operator to get key and default/alternate value
		const parts = operator ? expression.split(operator) : [expression];
		const key = parts[0];
		const operatorValue = parts.slice(1).join(operator ?? '');

		let replacement: string;

		if (operator === ':+' || operator === '+') {
			// Alternate value: use operatorValue if variable is set
			replacement = mergedEnv[key] ? operatorValue : '';
		} else {
			// Default value (or no operator): use variable value or operatorValue
			const envValue = mergedEnv[key];

			if (envValue !== undefined && envValue !== '') {
				// Variable is set - check for self-reference
				if (seen.has(envValue)) {
					// Self-reference detected, use default/empty
					replacement = operatorValue;
				} else {
					replacement = envValue;
				}
			} else {
				// Variable is unset or empty, use default
				replacement = operatorValue;
			}
		}

		result = result.replace(template, replacement);

		// Stop if result matches a known parsed value (optimization)
		if (result === runningParsed[key]) {
			break;
		}

		// Reset regex to re-evaluate from start after replacement
		variableRegex.lastIndex = 0;
	}

	return result;
}

/**
 * Expands all environment variable references in a parsed .env object.
 *
 * Processes variables in order, allowing later variables to reference earlier ones
 * (progressive expansion). Also resolves escape sequences after expansion.
 *
 * @param env - The parsed environment variables to expand
 * @returns The expanded environment variables (mutates and returns the input object)
 *
 * @example
 * expand({ A: 'hello', B: '${A} world' }) // { A: 'hello', B: 'hello world' }
 *
 * Loosely based on dotenv-expand
 * @link https://github.com/motdotla/dotenv-expand
 */
export function expand(env: EnvRecordRaw): EnvRecord {
	// Track already-expanded values for progressive expansion
	const runningParsed: EnvRecord = {};

	for (const key of Object.keys(env)) {
		const originalValue = env[key];

		// Skip undefined values
		if (originalValue === undefined) {
			continue;
		}

		// Expand variable references
		const expandedValue = expandValue(originalValue, env, runningParsed);

		// Resolve escape sequences and store
		const finalValue = resolveEscapeSequences(expandedValue);
		runningParsed[key] = finalValue;
	}

	return runningParsed;
}

/**
 * Loads and expands environment variables from a .env file.
 *
 * Uses Node's built-in loadEnvFile to parse the .env file
 * and expands variable references like ${VAR}.
 * The loaded variables are merged into process.env.
 *
 * @param envPath - The path to the .env file to load (optional)
 * @returns The environment variables as a key-value object
 * @throws {Error} If the .env file cannot be read or parsed
 */
export function loadEnvVars(envPath: string | undefined): EnvRecord {
	if (envPath) {
		loadEnvFile(envPath);
	}
	return expand(process.env as EnvRecordRaw);
}
