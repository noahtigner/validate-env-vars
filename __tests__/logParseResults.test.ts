import { z } from 'zod';
import logParseResults, { ERR_SYMBOL, OK_SYMBOL } from '../src/logParseResults';

describe('logParseResults', () => {
	it('logs the results of a successful parse', () => {
		const schema = z.object({
			VAR1: z.string(),
			VAR2: z.enum(['value1', 'value2']),
		});
		const parseResults = {
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
		const parseResults = {
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

		const errorCount = logParseResults(parseResults, schema);

		expect(errorSpy).toHaveBeenCalledTimes(1);
		expect(logSpy).toHaveBeenCalledTimes(1);

		expect(errorSpy).toHaveBeenNthCalledWith(
			1,
			`${ERR_SYMBOL} VAR1: \x1b[31mInvalid value\x1b[0m`
		);
		expect(logSpy).toHaveBeenNthCalledWith(1, `${OK_SYMBOL} VAR2`);
		expect(errorCount).toBe(1);
		errorSpy.mockRestore();
		logSpy.mockRestore();
	});
});
