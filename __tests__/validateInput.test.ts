import { z } from 'zod';
import * as z4 from 'zod/v4/core';
import {
	isValidFieldType,
	validateInputField,
	validateInputSchema,
	validate,
} from '../src/validateInput';

const expectedFieldValidationTable: [string, z4.$ZodType, boolean][] = [
	// basic string types
	['string', z.string(), true],
	['enum', z.enum(['value1', 'value2']), true],
	['literal', z.literal('value1'), true],
	// string types with refinements
	['string with min', z.string().min(1), true],
	['string with max', z.string().max(10), true],
	['email', z.email(), true],
	['uuid', z.uuid(), true],
	['url', z.url(), true],
	['url with protocol', z.url({ protocol: /^https$/ }), true],
	['iso', z.iso.datetime(), true],
	['ipv4', z.ipv4(), true],
	[
		'custom formats',
		z.stringFormat('vite-env-var', (val) => val.startsWith('VITE_')),
		true,
	],
	// optional strings
	['optional string', z.string().optional(), true],
	['optional enum', z.enum(['value1', 'value2']).optional(), true],
	['optional literal', z.literal('value1').optional(), true],
	// unions of strings
	['union of strings', z.union([z.string(), z.string()]), true],
	[
		'union of optional string and url',
		z.union([z.string().optional(), z.url()]),
		true,
	],
	[
		'optional union of strings',
		z.union([z.string(), z.string().optional()]).optional(),
		true,
	],
	// invalid primitive types
	['number', z.number(), false],
	['integer', z.int(), false],
	['boolean', z.boolean(), false],
	// invalid complex types
	['object', z.object({}), false],
	['array', z.array(z.string()), false],
	['promise', z.promise(z.string()), false],
	[
		'string with transform',
		z.string().transform((val) => val.toUpperCase()),
		false,
	],
	[
		'string with preprocess',
		z.preprocess((val) => String(val).trim(), z.string()),
		false,
	],
	['date object', z.date(), false],
	['stringbool', z.stringbool(), false],
];

describe('isValidFieldType', () => {
	expectedFieldValidationTable.forEach(
		([description, fieldType, expectedResult]) => {
			it(`correctly ${expectedResult ? 'allows' : 'disallows'} field type ${description}`, () => {
				const result = isValidFieldType(fieldType);
				expect(result).toBe(expectedResult);
			});
		}
	);
});

describe('validateInputField', () => {
	it(`throws for non-v4 fields`, () => {
		expect(() => {
			// @ts-expect-error - testing invalid input
			validateInputField('NON_V4_FIELD', {});
		}).toThrow(/must be a ZodType from Zod v4/);
	});
	it('throws for invalid field types', () => {
		const invalidField = z.number();
		expect(() => {
			validateInputField('INVALID_FIELD', invalidField);
		}).toThrow(/has invalid type/);
	});
	it('does not throw for valid field types', () => {
		const validField = z.string();
		expect(() => {
			validateInputField('VALID_FIELD', validField);
		}).not.toThrow();
	});
});

describe('validateInputSchema', () => {
	it('throws if not passed a v4 zodObject', () => {
		expect(() => {
			// @ts-expect-error - testing invalid input
			validateInputSchema({});
		}).toThrow();
		const invalidSchema = {
			_zod: {
				traits: new Set(['SomethingElse']),
			},
		};
		expect(() => {
			// @ts-expect-error - testing invalid input
			validateInputSchema(invalidSchema);
		}).toThrow(/must be a ZodObject from Zod v4/);
	});
	it('throws if passed a zodObject with invalid types', () => {
		const schema = z.object({
			VAR2: z.number(),
		});
		expect(() => {
			// @ts-expect-error - testing invalid input
			validateInputSchema(schema);
		}).toThrow();
	});
	it('does not throw if passed a zodObject of strings', () => {
		const schema = z.object({
			VAR1: z.string(),
			VAR2: z.string(),
		});
		expect(() => {
			validateInputSchema(schema);
		}).not.toThrow();
	});
	it('does not throw if passed a zodObject of enums', () => {
		const schema = z.object({
			VAR1: z.string(),
			VAR2: z.enum(['value1', 'value2']),
		});
		expect(() => {
			validateInputSchema(schema);
		}).not.toThrow();
	});
	it('does not throw if passed a zodObject of literals', () => {
		const schema = z.object({
			VAR1: z.string(),
			VAR2: z.literal('value1'),
		});
		expect(() => {
			validateInputSchema(schema);
		}).not.toThrow();
	});
	it('does not throw if passed a zodObject of mixed types', () => {
		const schema = z.object({
			VAR1: z.string(),
			VAR2: z.enum(['value1', 'value2']),
			VAR3: z.literal('value1'),
			VAR4: z.union([z.url(), z.string()]).optional(),
			VAR5: z.union([z.url(), z.string().optional()]),
		});
		expect(() => {
			validateInputSchema(schema);
		}).not.toThrow();
	});
});

describe('validate', () => {
	it('throws an error if parsing fails (single issue)', () => {
		const schema = z.object({
			REQUIRED_VAR: z.string(),
		});
		const vars = {
			OPTIONAL_VAR: 'optional_value',
		};

		expect(() => {
			validate({ schema, vars, logVars: false });
		}).toThrow('1 missing or invalid environment variable');
	});
	it('throws an error if parsing fails (multiple issues)', () => {
		const schema = z.object({
			REQUIRED_1: z.string(),
			REQUIRED_2: z.string(),
		});
		const vars = {
			OPTIONAL_VAR: 'optional_value',
		};

		expect(() => {
			validate({ schema, vars, logVars: false });
		}).toThrow('2 missing or invalid environment variables');
	});
	it('does not throw if all variables are valid', () => {
		const schema = z.object({
			REQUIRED_VAR: z.string(),
			OPTIONAL_VAR: z.string().optional(),
		});
		const vars = {
			REQUIRED_VAR: 'required_value',
			OPTIONAL_VAR: 'optional_value',
		};

		expect(() => {
			validate({ schema, vars, logVars: false });
		}).not.toThrow();
	});
});
