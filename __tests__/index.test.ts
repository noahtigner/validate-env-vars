import { z } from 'zod';
import validateEnvVars from '../src/index';
import { validateInputFile } from '../src/validateInput';
import { ERR_SYMBOL } from '../src/logParseResults';

jest.mock('../src/validateInput');

describe('validateEnvVars', () => {
	let processExitSpy: jest.SpyInstance;
	let consoleErrorSpy: jest.SpyInstance;

	beforeEach(() => {
		consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
		processExitSpy = jest.spyOn(process, 'exit').mockImplementation();
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	it('process.env is prepared by dotenv', () => {
		const schema = z.object({
			EXPECTED_1: z.string(),
			EXPECTED_2: z.string(),
		});
		const envPath = './__tests__/.env.test';

		validateEnvVars(schema, envPath);

		expect(process.env.EXPECTED_1).toEqual('one');
		expect(process.env.EXPECTED_2).toEqual('true');
	});

	it('process.env is prepared by dotenv-expand', () => {
		const schema = z.object({
			EXPANDED_1: z.string(),
		});
		const envPath = './__tests__/.env.test';

		validateEnvVars(schema, envPath);

		expect(process.env.EXPANDED_1).toEqual('one');
	});

	it('variables that fail to expand are handled', () => {
		const schema = z.object({
			EXPANDED_2: z.string().min(5),
		});
		const envPath = './__tests__/.env.test';

		validateEnvVars(schema, envPath);

		console.log(process.env);

		expect(processExitSpy).toHaveBeenCalledWith(1);
	});

	it('defaults to .env if no path is provided', () => {
		// assert that validateInputFile is called with the default path
		validateEnvVars(z.object({}));
		expect(validateInputFile).toHaveBeenCalledWith('.env');
	});

	it('exits with 1 if dotenv encounters an error', () => {
		const schema = z.object({
			VAR1: z.string(),
			VAR2: z.string(),
		});
		const envPath = 'invalid-file';

		// mock validateInputFile to not throw
		(validateInputFile as jest.Mock).mockReturnValue(true);

		validateEnvVars(schema, envPath);

		expect(processExitSpy).toHaveBeenCalledWith(1);

		(validateInputFile as jest.Mock).mockRestore();
	});

	it('exits with 1 if the env file cannot be found', () => {
		const schema = z.object({
			VAR1: z.string(),
			VAR2: z.string(),
		});
		const envPath = 'nonexistent-file';

		validateEnvVars(schema, envPath);

		expect(processExitSpy).toHaveBeenCalledWith(1);
	});

	it('exits with 1 if the schema is invalid', () => {
		const schema = z.object({
			UNDEF_1: z.string(),
			UNDEF_2: z.enum(['value1', 'value2']),
		});
		const envPath = './__tests__/.env.test';

		validateEnvVars(schema, envPath);

		expect(processExitSpy).toHaveBeenCalledWith(1);
		expect(consoleErrorSpy).toHaveBeenCalledTimes(3);
		expect(consoleErrorSpy).toHaveBeenNthCalledWith(
			1,
			`${ERR_SYMBOL} UNDEF_1: \x1b[31mRequired\x1b[0m`
		);
		expect(consoleErrorSpy).toHaveBeenNthCalledWith(
			2,
			`${ERR_SYMBOL} UNDEF_2: \x1b[31mRequired\x1b[0m`
		);
		expect(consoleErrorSpy).toHaveBeenNthCalledWith(
			3,
			`\x1b[31m2 Missing or invalid environment variables\x1b[0m`
		);
	});
});
