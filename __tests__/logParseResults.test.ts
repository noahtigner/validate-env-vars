import { z } from 'zod';
import logParseResults from '../src/logParseResults';
import type { ZodSafeParseReturnType } from '../src/schemaTypes';
import {
	ERR_COLOR,
	ERR_SYMBOL,
	OK_COLOR,
	OK_SYMBOL,
	RESET_COLOR,
	WARN_COLOR,
	WARN_SYMBOL,
} from '../src/constants';

describe('logParseResults', () => {
	it('logs the results of a successful parse', () => {
		const schema = z.object({
			VAR1: z.string(),
			VAR2: z.enum(['value1', 'value2']),
		});
		const parseResults: ZodSafeParseReturnType = {
			success: true,
			data: {
				VAR1: 'value1',
				VAR2: 'value2',
			},
		};
		const logSpy = jest.spyOn(console, 'log').mockImplementation();
		const errorCount = logParseResults(parseResults, schema, true);
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
		logSpy.mockRestore();
	});
	it('logs the results of a successful parse (with optionals)', () => {
		const schema = z.object({
			VAR1: z.string().optional(),
			VAR2: z.enum(['value1', 'value2']),
			VAR3: z.string().optional(),
		});
		const parseResults: ZodSafeParseReturnType = {
			success: true,
			data: {
				VAR2: 'value2',
				VAR3: 'value3',
			},
		};
		const logSpy = jest.spyOn(console, 'log').mockImplementation();
		const errorCount = logParseResults(parseResults, schema, true);
		expect(logSpy).toHaveBeenCalledTimes(3);
		expect(logSpy).toHaveBeenNthCalledWith(
			1,
			`${WARN_SYMBOL} VAR1 ${WARN_COLOR}'undefined'${RESET_COLOR}`
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
		logSpy.mockRestore();
	});
	it('logs the results of a failed parse', () => {
		// mock process.env to include VAR2
		const before = { ...process.env };
		process.env.VAR2 = 'value2';

		const schema = z.object({
			VAR1: z.string(),
			VAR2: z.enum(['value1', 'value2']),
		});
		const parseResults: ZodSafeParseReturnType = {
			success: false,
			error: {
				issues: [
					{
						path: ['VAR1'],
						message: 'Invalid value',
					},
				],
			},
		};
		const errorSpy = jest.spyOn(console, 'error').mockImplementation();
		const logSpy = jest.spyOn(console, 'log').mockImplementation();

		const errorCount = logParseResults(parseResults, schema, true);

		expect(errorSpy).toHaveBeenCalledTimes(1);
		expect(logSpy).toHaveBeenCalledTimes(1);

		expect(errorSpy).toHaveBeenNthCalledWith(
			1,
			`${ERR_SYMBOL} VAR1: ${ERR_COLOR}Invalid value${RESET_COLOR}`
		);
		expect(logSpy).toHaveBeenNthCalledWith(
			1,
			`${OK_SYMBOL} VAR2 ${OK_COLOR}'value2'${RESET_COLOR}`
		);
		expect(errorCount).toBe(1);
		errorSpy.mockRestore();
		logSpy.mockRestore();

		// restore process.env
		process.env = before;
	});
	it('logs the results of a failed parse (with optionals)', () => {
		// mock process.env to include VAR2
		const before = { ...process.env };
		process.env.VAR3 = 'value3';

		const schema = z.object({
			VAR1: z.string().optional(),
			VAR2: z.enum(['value1', 'value2']),
			VAR3: z.string().optional(),
		});
		const parseResults: ZodSafeParseReturnType = {
			success: false,
			error: {
				issues: [
					{
						path: ['VAR2'],
						message: 'Invalid value',
					},
				],
			},
		};
		const errorSpy = jest.spyOn(console, 'error').mockImplementation();
		const logSpy = jest.spyOn(console, 'log').mockImplementation();

		const errorCount = logParseResults(parseResults, schema, true);

		expect(errorSpy).toHaveBeenCalledTimes(1);
		expect(logSpy).toHaveBeenCalledTimes(2);

		expect(errorSpy).toHaveBeenNthCalledWith(
			1,
			`${ERR_SYMBOL} VAR2: ${ERR_COLOR}Invalid value${RESET_COLOR}`
		);
		expect(logSpy).toHaveBeenNthCalledWith(
			1,
			`${WARN_SYMBOL} VAR1 ${WARN_COLOR}'undefined'${RESET_COLOR}`
		);
		expect(logSpy).toHaveBeenNthCalledWith(
			2,
			`${OK_SYMBOL} VAR3 ${OK_COLOR}'value3'${RESET_COLOR}`
		);
		expect(errorCount).toBe(1);
		errorSpy.mockRestore();
		logSpy.mockRestore();

		// restore process.env
		process.env = before;
	});
	it('logs the results of a failed parse (with invalid optionals)', () => {
		// mock process.env to include VAR2
		const before = { ...process.env };
		process.env.VAR3 = 'not a url';

		const schema = z.object({
			VAR1: z.string().optional(),
			VAR2: z.enum(['value1', 'value2']),
			VAR3: z.string().url().optional(),
		});
		const parseResults: ZodSafeParseReturnType = {
			success: false,
			error: {
				issues: [
					{
						path: ['VAR2'],
						message: 'Invalid value',
					},
					{
						path: ['VAR3'],
						message: 'Invalid URL',
					},
				],
			},
		};
		const errorSpy = jest.spyOn(console, 'error').mockImplementation();
		const logSpy = jest.spyOn(console, 'log').mockImplementation();

		const errorCount = logParseResults(parseResults, schema, true);

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
			`${WARN_SYMBOL} VAR1 ${WARN_COLOR}'undefined'${RESET_COLOR}`
		);
		expect(errorCount).toBe(2);
		errorSpy.mockRestore();
		logSpy.mockRestore();

		// restore process.env
		process.env = before;
	});
	it('skips logging values if logVars is false', () => {
		const schema = z.object({
			VAR1: z.string(),
			VAR2: z.enum(['value1', 'value2']),
		});
		const parseResults: ZodSafeParseReturnType = {
			success: true,
			data: {
				VAR1: 'value1',
				VAR2: 'value2',
			},
		};
		const logSpy = jest.spyOn(console, 'log').mockImplementation();
		const errorCount = logParseResults(parseResults, schema, false);
		expect(logSpy).toHaveBeenCalledTimes(2);
		expect(logSpy).toHaveBeenNthCalledWith(1, `${OK_SYMBOL} VAR1`);
		expect(logSpy).toHaveBeenNthCalledWith(2, `${OK_SYMBOL} VAR2`);
		expect(errorCount).toBe(0);
		logSpy.mockRestore();
	});
});
