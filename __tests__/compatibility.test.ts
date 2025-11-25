import { z as zod3 } from 'zod/v3';
import { z as zod4 } from 'zod/v4';
import * as zodMini from 'zod/mini';

import { validate } from '../src/validateInput';

const zod3Schema = zod3.object({
	VAR1: zod3.string(),
	VAR2: zod3.enum(['value1', 'value2']),
});

const zod4Schema = zod4.object({
	VAR1: zod4.string(),
	VAR2: zod4.enum(['value1', 'value2']),
});

const zodMiniSchema = zodMini.object({
	VAR1: zodMini.string(),
	VAR2: zodMini.enum(['value1', 'value2']),
});

describe('Library is compatible with Zod v3, Zod v4 Classic, and Zod Mini', () => {
	it('validates schemas from all Zod versions', () => {
		const data = { VAR1: 'test', VAR2: 'value1' };
		expect(() =>
			validate({ schema: zod3Schema, vars: data, logVars: false })
		).not.toThrow();
		expect(() =>
			validate({ schema: zod4Schema, vars: data, logVars: false })
		).not.toThrow();
		expect(() =>
			validate({ schema: zodMiniSchema, vars: data, logVars: false })
		).not.toThrow();
	});

	it('throws for invalid schemas from all Zod versions', () => {
		const invalidData = { VAR1: 'test', VAR2: 'invalidValue' };
		expect(() =>
			validate({ schema: zod3Schema, vars: invalidData, logVars: false })
		).toThrow();
		expect(() =>
			validate({ schema: zod4Schema, vars: invalidData, logVars: false })
		).toThrow();
		expect(() =>
			validate({
				schema: zodMiniSchema,
				vars: invalidData,
				logVars: false,
			})
		).toThrow();
	});

	it('validates optional fields from all Zod versions', () => {
		const zod3SchemaOptional = zod3.object({
			VAR1: zod3.string(),
			VAR2: zod3.string().optional(),
		});
		const zod4SchemaOptional = zod4.object({
			VAR1: zod4.string(),
			VAR2: zod4.string().optional(),
		});

		const data = { VAR1: 'test' };
		expect(() =>
			validate({ schema: zod3SchemaOptional, vars: data, logVars: false })
		).not.toThrow();
		expect(() =>
			validate({ schema: zod4SchemaOptional, vars: data, logVars: false })
		).not.toThrow();
	});
});
