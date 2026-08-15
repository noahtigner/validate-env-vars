import { z as zodClassic } from 'zod';
import * as zodMini from 'zod/mini';

import validateEnvVars from '../src/index';
import { validate } from '../src/validateInput';

const zodClassicSchema = zodClassic.object({
	VAR1: zodClassic.string(),
	VAR2: zodClassic.enum(['value1', 'value2']),
});

const zodMiniSchema = zodMini.object({
	VAR1: zodMini.string(),
	VAR2: zodMini.enum(['value1', 'value2']),
});

describe('Library is compatible with both Zod v4 and Zod Mini', () => {
	it('validates schemas', () => {
		const data = { VAR1: 'test', VAR2: 'value1' };
		expect(() =>
			validate({ schema: zodClassicSchema, vars: data, logVars: true })
		).not.toThrow();
		expect(() =>
			validate({ schema: zodMiniSchema, vars: data, logVars: true })
		).not.toThrow();
	});
	it('throws for invalid schemas', () => {
		const invalidData = { VAR1: 'test', VAR2: 'invalidValue' };
		expect(() =>
			validate({
				schema: zodClassicSchema,
				vars: invalidData,
				logVars: true,
			})
		).toThrow();
		expect(() =>
			validate({
				schema: zodMiniSchema,
				vars: invalidData,
				logVars: true,
			})
		).toThrow();
	});
	it('accepts a Zod Mini schema through the public API', () => {
		process.env.ZOD_MINI_PUBLIC_API_TEST = 'test';

		try {
			expect(() =>
				validateEnvVars({
					schema: zodMini.object({
						ZOD_MINI_PUBLIC_API_TEST: zodMini.literal('test'),
					}),
				})
			).not.toThrow();
		} finally {
			delete process.env.ZOD_MINI_PUBLIC_API_TEST;
		}
	});
});
