import { z } from 'zod';
import validateEnvVars, {
	envEnum,
	envNonEmptyString,
	envObject,
} from '../src/index';
import { validateInputFile } from '../src/validateInput';
import { ERR_COLOR, ERR_SYMBOL, RESET_COLOR } from '../src/constants';

jest.mock('../src/validateInput');

describe('validateEnvVars', () => {
	let processExitSpy: jest.SpyInstance;
	let consoleErrorSpy: jest.SpyInstance;
	let consoleLogSpy: jest.SpyInstance;

	beforeEach(() => {
		consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
		consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
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

		validateEnvVars({ schema, envPath });

		expect(process.env.EXPECTED_1).toEqual('one');
		expect(process.env.EXPECTED_2).toEqual('true');
	});

	it('process.env is prepared by dotenv-expand', () => {
		const schema = z.object({
			EXPANDED_1: z.string(),
		});
		const envPath = './__tests__/.env.test';

		validateEnvVars({ schema, envPath });

		expect(process.env.EXPANDED_1).toEqual('one');
	});

	it('variables that fail to expand are handled', () => {
		const schema = z.object({
			EXPANDED_2: z.string().min(5),
		});
		const envPath = './__tests__/.env.test';

		validateEnvVars({ schema, envPath, exitOnError: true });

		expect(processExitSpy).toHaveBeenCalledWith(1);
	});

	it('defaults to .env if no path is provided', () => {
		// assert that validateInputFile is called with the default path
		expect(() => validateEnvVars({ schema: z.object({}) })).toThrow(
			`ENOENT: no such file or directory, open '.env'`
		);
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

		validateEnvVars({ schema, envPath, exitOnError: true });

		expect(processExitSpy).toHaveBeenCalledWith(1);

		(validateInputFile as jest.Mock).mockRestore();
	});

	it('exits with 1 if the env file cannot be found', () => {
		const schema = z.object({
			VAR1: z.string(),
			VAR2: z.string(),
		});
		const envPath = 'nonexistent-file';

		validateEnvVars({ schema, envPath, exitOnError: true });

		expect(processExitSpy).toHaveBeenCalledWith(1);
	});

	it('exits with 1 if the schema is invalid', () => {
		const schema = z.object({
			UNDEF_1: z.string(),
			UNDEF_2: z.enum(['value1', 'value2']),
		});
		const envPath = './__tests__/.env.test';

		validateEnvVars({ schema, envPath, exitOnError: true });

		expect(processExitSpy).toHaveBeenCalledWith(1);
		expect(consoleErrorSpy).toHaveBeenCalledTimes(3);
		expect(consoleErrorSpy).toHaveBeenNthCalledWith(
			1,
			`${ERR_SYMBOL} UNDEF_1: ${ERR_COLOR}Invalid input: expected string, received undefined${RESET_COLOR}`
		);
		expect(consoleErrorSpy).toHaveBeenNthCalledWith(
			2,
			`${ERR_SYMBOL} UNDEF_2: ${ERR_COLOR}Invalid option: expected one of "value1"|"value2"${RESET_COLOR}`
		);
		expect(consoleErrorSpy).toHaveBeenNthCalledWith(
			3,
			`${ERR_COLOR}2 missing or invalid environment variables${RESET_COLOR}`
		);
	});

	it('throws error instead of exiting if exitOnError is false', () => {
		const schema = z.object({
			UNDEF_1: z.string(),
			UNDEF_2: z.string(),
		});
		const envPath = './__tests__/.env.test';

		expect(() => {
			validateEnvVars({ schema, envPath, exitOnError: false });
		}).toThrow('2 missing or invalid environment variables');
	});

	it('accepts an envObject', () => {
		const schema = envObject({
			EXPECTED_1: envNonEmptyString(),
			EXPECTED_2: envEnum(['true', 'false']),
			OPT_UNION: z
				.union([envNonEmptyString(), envEnum(['true', 'false'])])
				.optional(),
		});
		const envPath = './__tests__/.env.test';

		expect(() => {
			validateEnvVars({ schema, envPath });
		}).not.toThrow();
	});

	it('descriptions are logged on console warning', () => {
		const schema = z.object({
			OPTIONAL_1: z
				.string()
				.meta({ description: 'This is an optional variable' })
				.optional(),
			EXPECTED_2: z.string(),
		});
		const envPath = './__tests__/.env.test';

		validateEnvVars({ schema, envPath });

		expect(consoleLogSpy).toHaveBeenCalledTimes(3);
		expect(consoleLogSpy).toHaveBeenNthCalledWith(
			1,
			expect.stringContaining('This is an optional variable')
		);
		expect(consoleLogSpy).toHaveBeenNthCalledWith(
			2,
			expect.not.stringContaining('This is an optional variable')
		);
	});
});
