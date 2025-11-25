import { z, ZodError } from 'zod';
import logParseResults, { logMeta, parseMeta } from '../src/logParseResults';
import type { ZodSafeParseReturnType } from '../src/schemaTypes';
import {
	ERR_COLOR,
	ERR_SYMBOL,
	HINT_SYMBOL,
	OK_COLOR,
	OK_SYMBOL,
	RESET_COLOR,
	WARN_COLOR,
	WARN_SYMBOL,
} from '../src/constants';

const returnTypeExtraBits: Omit<ZodError<Record<string, unknown>>, 'issues'> = {
	flatten: () => ({ formErrors: [], fieldErrors: {} }),
	format: () => {
		throw new Error('Function not implemented.');
	},
	addIssue: () => {},
	addIssues: () => {},
	isEmpty: false,
	type: {},
	name: '',
	message: '',
	_zod: {
		output: {},
		def: [
			{
				code: 'custom',
				path: ['VAR1'],
				message: 'Invalid value',
			},
		],
	},
};

describe('logParseResults', () => {
	let logSpy: jest.SpyInstance;
	let errorSpy: jest.SpyInstance;

	beforeEach(() => {
		logSpy = jest.spyOn(console, 'log').mockImplementation();
		errorSpy = jest.spyOn(console, 'error').mockImplementation();
	});

	afterEach(() => {
		logSpy.mockRestore();
		errorSpy.mockRestore();
	});

	it('logs the results of a successful parse', () => {
		const schema = z.object({
			VAR1: z.string(),
			VAR2: z.enum(['value1', 'value2']),
		});
		const data = {
			VAR1: 'value1',
			VAR2: 'value2',
		};
		const parseResults = schema.safeParse(data);
		const errorCount = logParseResults(parseResults, schema, data, true);
		expect(logSpy).toHaveBeenCalledTimes(2);
		expect(logSpy).toHaveBeenNthCalledWith(
			1,
			`${OK_SYMBOL} VAR1 ${OK_COLOR}'value1'${RESET_COLOR}`
		);
		expect(logSpy).toHaveBeenNthCalledWith(
			2,
			`${OK_SYMBOL} VAR2 ${OK_COLOR}'value2'${RESET_COLOR}`
		);
		expect(errorCount).toBe(0);
	});
	it('logs the results of a successful parse (with optionals)', () => {
		const schema = z.object({
			VAR1: z.string().optional(),
			VAR2: z.enum(['value1', 'value2']),
			VAR3: z.string().optional(),
		});
		const data = {
			VAR2: 'value2',
			VAR3: 'value3',
		};
		const parseResults = schema.safeParse(data);
		const errorCount = logParseResults(parseResults, schema, data, true);
		expect(logSpy).toHaveBeenCalledTimes(3);
		expect(logSpy).toHaveBeenNthCalledWith(
			1,
			`${WARN_SYMBOL} VAR1 ${WARN_COLOR}undefined${RESET_COLOR}`
		);
		expect(logSpy).toHaveBeenNthCalledWith(
			2,
			`${OK_SYMBOL} VAR2 ${OK_COLOR}'value2'${RESET_COLOR}`
		);
		expect(logSpy).toHaveBeenNthCalledWith(
			3,
			`${OK_SYMBOL} VAR3 ${OK_COLOR}'value3'${RESET_COLOR}`
		);
		expect(errorCount).toBe(0);
	});
	it('logs the results of a failed parse', () => {
		const schema = z.object({
			VAR1: z.string(),
			VAR2: z.enum(['value1', 'value2']),
		});
		const data = {
			VAR2: 'value2',
		};
		const parseResults = schema.safeParse(data);
		const errorCount = logParseResults(parseResults, schema, data, true);

		expect(errorSpy).toHaveBeenCalledTimes(1);
		expect(logSpy).toHaveBeenCalledTimes(1);

		expect(errorSpy).toHaveBeenNthCalledWith(
			1,
			`${ERR_SYMBOL} VAR1: ${ERR_COLOR}Invalid input: expected string, received undefined${RESET_COLOR}`
		);
		expect(logSpy).toHaveBeenNthCalledWith(
			1,
			`${OK_SYMBOL} VAR2 ${OK_COLOR}'value2'${RESET_COLOR}`
		);
		expect(errorCount).toBe(1);
	});
	it('logs the results of a failed parse (with optionals)', () => {
		const schema = z.object({
			VAR1: z.string().optional(),
			VAR2: z.enum(['value1', 'value2']),
			VAR3: z.string().optional(),
		});
		const vars = {
			VAR3: 'value3',
		};
		const parseResults: ZodSafeParseReturnType = {
			success: false,
			error: {
				...returnTypeExtraBits,
				issues: [
					{
						code: 'custom',
						path: ['VAR2'],
						message: 'Invalid value',
					},
				],
			},
		} as unknown as ZodSafeParseReturnType;
		const errorCount = logParseResults(parseResults, schema, vars, true);

		expect(errorSpy).toHaveBeenCalledTimes(1);
		expect(logSpy).toHaveBeenCalledTimes(2);

		expect(errorSpy).toHaveBeenNthCalledWith(
			1,
			`${ERR_SYMBOL} VAR2: ${ERR_COLOR}Invalid value${RESET_COLOR}`
		);
		expect(logSpy).toHaveBeenNthCalledWith(
			1,
			`${WARN_SYMBOL} VAR1 ${WARN_COLOR}undefined${RESET_COLOR}`
		);
		expect(logSpy).toHaveBeenNthCalledWith(
			2,
			`${OK_SYMBOL} VAR3 ${OK_COLOR}'value3'${RESET_COLOR}`
		);
		expect(errorCount).toBe(1);
	});
	it('logs the results of a failed parse (with invalid optionals)', () => {
		const schema = z.object({
			VAR1: z.string().optional(),
			VAR2: z.enum(['value1', 'value2']),
			VAR3: z.url().optional(),
		});
		const vars = {
			VAR3: 'not a url',
		};
		const parseResults: ZodSafeParseReturnType = {
			success: false,
			error: {
				...returnTypeExtraBits,
				issues: [
					{
						code: 'custom',
						path: ['VAR2'],
						message: 'Invalid value',
					},
					{
						code: 'custom',
						path: ['VAR3'],
						message: 'Invalid URL',
					},
				],
			},
		} as unknown as ZodSafeParseReturnType;
		const errorCount = logParseResults(parseResults, schema, vars, true);

		expect(errorSpy).toHaveBeenCalledTimes(2);
		expect(logSpy).toHaveBeenCalledTimes(1);

		expect(errorSpy).toHaveBeenNthCalledWith(
			1,
			`${ERR_SYMBOL} VAR2: ${ERR_COLOR}Invalid value${RESET_COLOR}`
		);
		expect(errorSpy).toHaveBeenNthCalledWith(
			2,
			`${ERR_SYMBOL} VAR3: ${ERR_COLOR}Invalid URL${RESET_COLOR}`
		);
		expect(logSpy).toHaveBeenNthCalledWith(
			1,
			`${WARN_SYMBOL} VAR1 ${WARN_COLOR}undefined${RESET_COLOR}`
		);
		expect(errorCount).toBe(2);
	});
	it('post-validation transformations are handled correctly', () => {
		const schema = z.object({
			VAR1: z.string().transform((val) => val.toUpperCase()),
		});
		const data = {
			VAR1: 'value1',
		};
		const parseResults = schema.safeParse(data);
		const errorCount = logParseResults(parseResults, schema, data, true);
		expect(logSpy).toHaveBeenCalledTimes(1);
		expect(logSpy).toHaveBeenNthCalledWith(
			1,
			`${OK_SYMBOL} VAR1 ${OK_COLOR}'VALUE1'${RESET_COLOR}`
		);
		expect(errorCount).toBe(0);
	});
	describe('skips logging values if logVars is false', () => {
		it('required vars', () => {
			const schema = z.object({
				VAR1: z.string(),
				VAR2: z.enum(['value1', 'value2']),
			});
			const data = {
				VAR1: 'value1',
				VAR2: 'value2',
			};
			const parseResults = schema.safeParse(data);
			const errorCount = logParseResults(
				parseResults,
				schema,
				data,
				false
			);
			expect(logSpy).toHaveBeenCalledTimes(2);
			expect(logSpy).toHaveBeenNthCalledWith(1, `${OK_SYMBOL} VAR1`);
			expect(logSpy).toHaveBeenNthCalledWith(2, `${OK_SYMBOL} VAR2`);
			expect(errorCount).toBe(0);
		});
		it('optional vars', () => {
			const schema = z.object({
				VAR1: z.string().optional(),
				VAR2: z.enum(['value1', 'value2']).optional(),
			});
			const data = {};
			const parseResults = schema.safeParse(data);
			const errorCount = logParseResults(
				parseResults,
				schema,
				data,
				false
			);
			expect(logSpy).toHaveBeenCalledTimes(2);
			expect(logSpy).toHaveBeenNthCalledWith(1, `${WARN_SYMBOL} VAR1`);
			expect(logSpy).toHaveBeenNthCalledWith(2, `${WARN_SYMBOL} VAR2`);
			expect(errorCount).toBe(0);
		});
	});
	it('handles errors with empty error messages', () => {
		const schema = z.object({
			VAR1: z.string(),
		});
		const vars = {};
		const parseResults: ZodSafeParseReturnType = {
			success: false,
			error: {
				...returnTypeExtraBits,
				issues: [
					{
						code: 'custom',
						path: ['VAR1'],
						message: '',
					},
				],
			},
		} as unknown as ZodSafeParseReturnType;
		const errorCount = logParseResults(parseResults, schema, vars, true);

		expect(errorSpy).toHaveBeenCalledTimes(1);
		expect(errorSpy).toHaveBeenNthCalledWith(
			1,
			`${ERR_SYMBOL} VAR1: ${ERR_COLOR}${RESET_COLOR}`
		);
		expect(errorCount).toBe(1);
	});
	describe('logs the successfully parsed vars even when overall validation fails', () => {
		it('all validated vars are provided via vars arg', () => {
			const schema = z.object({
				VAR1: z.string(),
				VAR2: z.enum(['value1', 'value2']),
			});
			const data = {
				VAR1: 'value1',
			};
			const parseResults = schema.safeParse(data);
			const errorCount = logParseResults(
				parseResults,
				schema,
				data,
				true
			);

			expect(logSpy).toHaveBeenCalledTimes(1);
			expect(logSpy).toHaveBeenNthCalledWith(
				1,
				`${OK_SYMBOL} VAR1 ${OK_COLOR}'value1'${RESET_COLOR}`
			);
			expect(errorSpy).toHaveBeenCalledTimes(1);
			expect(errorSpy).toHaveBeenNthCalledWith(
				1,
				`${ERR_SYMBOL} VAR2: ${ERR_COLOR}Invalid option: expected one of "value1"|"value2"${RESET_COLOR}`
			);
			expect(errorCount).toBe(1);
		});
		it('falls back to undefined when not found in vars', () => {
			const schema = z.object({
				VAR1: z.string(),
				VAR2: z.enum(['value1', 'value2']),
			});
			const data = {
				VAR1: 'value1',
			};
			const parseResults = schema.safeParse(data);
			const errorCount = logParseResults(parseResults, schema, {}, true);

			expect(logSpy).toHaveBeenCalledTimes(1);
			expect(logSpy).toHaveBeenNthCalledWith(
				1,
				`${WARN_SYMBOL} VAR1 ${WARN_COLOR}undefined${RESET_COLOR}`
			);
			expect(errorSpy).toHaveBeenCalledTimes(1);
			expect(errorSpy).toHaveBeenNthCalledWith(
				1,
				`${ERR_SYMBOL} VAR2: ${ERR_COLOR}Invalid option: expected one of "value1"|"value2"${RESET_COLOR}`
			);
			expect(errorCount).toBe(1);
		});
	});
	it('logs empty string as empty string (not undefined) for optional vars', () => {
		const schema = z.object({
			VAR1: z.string().optional(),
		});
		const vars = {
			VAR1: '',
		};
		const parseResults = schema.safeParse(vars);
		const errorCount = logParseResults(parseResults, schema, vars, true);

		expect(logSpy).toHaveBeenCalledTimes(1);
		expect(logSpy).toHaveBeenNthCalledWith(
			1,
			`${WARN_SYMBOL} VAR1 ${WARN_COLOR}''${RESET_COLOR}`
		);
		expect(errorCount).toBe(0);
	});
});

describe('parseMeta', () => {
	it('returns an empty object if no metadata is present', () => {
		const field = z.string();
		const result = parseMeta(field);
		expect(result).toEqual({});
	});
	it('returns an empty object if metadata is invalid', () => {
		// @ts-expect-error testing invalid metadata
		const field = z.string().meta({ title: 123 });
		const result = parseMeta(field);
		expect(result).toEqual({});
	});
	it('returns metadata if valid metadata is present', () => {
		const metadata = {
			title: 'A test variable',
			description: 'A test variable for testing things',
			examples: ['example1', 'example2'],
		};
		const field = z.string().meta(metadata);
		const result = parseMeta(field);
		expect(result).toEqual(metadata);
	});
	it('ignores extra fields in metadata', () => {
		const metadata = {
			extraField: 123,
		};
		const field = z.string().meta(metadata);
		const result = parseMeta(field);
		expect(result).toEqual({});
	});
});

describe('logMeta', () => {
	it('does not log anything if no metadata is present', () => {
		const field = z.string();
		const metadata = parseMeta(field);
		const logSpy = jest.spyOn(console, 'log').mockImplementation();
		logMeta(metadata);
		expect(logSpy).not.toHaveBeenCalled();
		logSpy.mockRestore();
	});
	it('logs metadata if present', () => {
		const metadata = {
			description: 'A test variable',
			examples: ['example1', 'example2'],
		};
		const field = z.string().meta(metadata);
		const parsedMeta = parseMeta(field);
		const logSpy = jest.spyOn(console, 'log').mockImplementation();

		logMeta(parsedMeta);

		expect(logSpy).toHaveBeenCalledTimes(2);
		expect(logSpy).toHaveBeenNthCalledWith(
			1,
			`  ${HINT_SYMBOL} ${WARN_COLOR}description${RESET_COLOR}: A test variable`
		);
		expect(logSpy).toHaveBeenNthCalledWith(
			2,
			`  ${HINT_SYMBOL} ${WARN_COLOR}examples${RESET_COLOR}: ["example1","example2"]`
		);
		logSpy.mockRestore();
	});
});
