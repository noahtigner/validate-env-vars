import { z } from 'zod';
import logParseResults from '../src/logParseResults';
import type { ZodSafeParseReturnType } from '../src/schemaTypes';
import {
	ERR_COLOR,
	ERR_SYMBOL,
	OK_SYMBOL,
	RESET_COLOR,
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
		const errorCount = logParseResults(parseResults, schema);
		expect(logSpy).toHaveBeenCalledTimes(2);
		expect(logSpy).toHaveBeenNthCalledWith(1, `${OK_SYMBOL} VAR1`);
		expect(logSpy).toHaveBeenNthCalledWith(2, `${OK_SYMBOL} VAR2`);
		expect(errorCount).toBe(0);
		logSpy.mockRestore();
	});
	it('logs the results of a failed parse', () => {
		const schema = z.object({
			VAR1: z.string(),
			VAR2: z.enum(['value1', 'value2']),
		});
		const parseResults: ZodSafeParseReturnType = {
			success: false,
			error: {
				issues: [
					// @ts-expect-error - shortcut for testing
					{
						path: ['VAR1'],
						message: 'Invalid value',
					},
				],
			},
		};
		const errorSpy = jest.spyOn(console, 'error').mockImplementation();
		const logSpy = jest.spyOn(console, 'log').mockImplementation();

		const errorCount = logParseResults(parseResults, schema);

		expect(errorSpy).toHaveBeenCalledTimes(1);
		expect(logSpy).toHaveBeenCalledTimes(1);

		expect(errorSpy).toHaveBeenNthCalledWith(
			1,
			`${ERR_SYMBOL} VAR1: ${ERR_COLOR}Invalid value${RESET_COLOR}`
		);
		expect(logSpy).toHaveBeenNthCalledWith(1, `${OK_SYMBOL} VAR2`);
		expect(errorCount).toBe(1);
		errorSpy.mockRestore();
		logSpy.mockRestore();
	});
});
