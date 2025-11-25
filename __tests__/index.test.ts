import { z } from 'zod';
import validateEnvVars from '../src/index';
import * as validateInput from '../src/validateInput';
import { ERR_COLOR, ERR_SYMBOL, RESET_COLOR } from '../src/constants';

const envNonEmptyString = () =>
	z
		.string()
		.min(1, { message: 'Variable cannot be empty' })
		.refine((val) => val !== 'undefined', {
			message: "Variable cannot equal 'undefined'",
		});

describe('validateEnvVars', () => {
	let processExitSpy: jest.SpyInstance;
	let consoleErrorSpy: jest.SpyInstance;

	beforeEach(() => {
		consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
		jest.spyOn(console, 'log').mockImplementation();
		processExitSpy = jest.spyOn(process, 'exit').mockImplementation();
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	it('defaults to .env if no path is provided', () => {
		const validateInputFile = jest.spyOn(
			validateInput,
			'validateInputFile'
		);

		// assert that validateInputFile is called with the default path
		expect(() => {
			validateEnvVars({ schema: z.object({}) });
		}).toThrow(`File not found: .env`);
		expect(validateInputFile).toHaveBeenCalledWith('.env');
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
	it('accepts a z.object', () => {
		const schema = z.object({
			EXPECTED_1: envNonEmptyString(),
			EXPECTED_2: z.enum(['true', 'false']),
			OPT_OR: z
				.union([envNonEmptyString(), z.enum(['true', 'false'])])
				.optional(),
		});
		const envPath = './__tests__/.env.test';

		expect(() => {
			validateEnvVars({ schema, envPath });
		}).not.toThrow();
	});
});
