import { z } from 'zod';
import { z as zod3 } from 'zod/v3';
import * as zodMini from 'zod/mini';
import {
	isZodV4Schema,
	isZodV3Schema,
	getSchemaShape,
	isZodV4Field,
	isZodV3Field,
	getFieldType,
	isOptionalField,
	getInnerType,
	getUnionOptions,
	isZodV4ParseResult,
	safeParse,
} from '../src/zodVersionHelpers';

describe('isZodV4Schema', () => {
	it('returns true for Zod v4 Classic schemas', () => {
		const schema = z.object({ field: z.string() });
		expect(isZodV4Schema(schema)).toBe(true);
	});
	it('returns true for Zod Mini schemas', () => {
		const schema = zodMini.object({ field: zodMini.string() });
		expect(isZodV4Schema(schema)).toBe(true);
	});
	it('returns false for Zod v3 schemas', () => {
		const schema = zod3.object({ field: zod3.string() });
		expect(isZodV4Schema(schema)).toBe(false);
	});
	it('returns false for invalid objects', () => {
		expect(isZodV4Schema({} as any)).toBe(false);
		expect(isZodV4Schema({ _zod: null } as any)).toBe(false);
		expect(isZodV4Schema({ _zod: { traits: null } } as any)).toBe(false);
		expect(
			isZodV4Schema({ _zod: { traits: new Set(['Other']) } } as any)
		).toBe(false);
	});
});

describe('isZodV3Schema', () => {
	it('returns true for Zod v3 schemas', () => {
		const schema = zod3.object({ field: zod3.string() });
		expect(isZodV3Schema(schema)).toBe(true);
	});
	it('returns false for Zod v4 schemas', () => {
		const schema = z.object({ field: z.string() });
		expect(isZodV3Schema(schema)).toBe(false);
	});
	it('returns false for invalid objects', () => {
		expect(isZodV3Schema({} as any)).toBe(false);
		expect(isZodV3Schema({ _def: null } as any)).toBe(false);
		expect(isZodV3Schema({ _def: { typeName: 'Other' } } as any)).toBe(
			false
		);
	});
});

describe('getSchemaShape', () => {
	it('returns shape for Zod v4 schemas', () => {
		const schema = z.object({ field: z.string() });
		const shape = getSchemaShape(schema);
		expect(shape).toHaveProperty('field');
	});
	it('returns shape for Zod v3 schemas', () => {
		const schema = zod3.object({ field: zod3.string() });
		const shape = getSchemaShape(schema);
		expect(shape).toHaveProperty('field');
	});
});

describe('isZodV4Field', () => {
	it('returns true for Zod v4 field types', () => {
		expect(isZodV4Field(z.string())).toBe(true);
		expect(isZodV4Field(z.string().optional())).toBe(true);
	});
	it('returns false for Zod v3 field types', () => {
		expect(isZodV4Field(zod3.string())).toBe(false);
	});
	it('returns false for non-objects', () => {
		expect(isZodV4Field(null)).toBe(false);
		expect(isZodV4Field('string')).toBe(false);
		expect(isZodV4Field(123)).toBe(false);
	});
	it('returns false for objects without Zod structure', () => {
		expect(isZodV4Field({})).toBe(false);
		expect(isZodV4Field({ _zod: null })).toBe(false);
		expect(isZodV4Field({ _zod: { traits: null } })).toBe(false);
	});
});

describe('isZodV3Field', () => {
	it('returns true for Zod v3 field types', () => {
		expect(isZodV3Field(zod3.string())).toBe(true);
		expect(isZodV3Field(zod3.string().optional())).toBe(true);
	});
	it('returns false for Zod v4 field types', () => {
		expect(isZodV3Field(z.string())).toBe(false);
	});
	it('returns false for non-objects', () => {
		expect(isZodV3Field(null)).toBe(false);
		expect(isZodV3Field('string')).toBe(false);
	});
	it('returns false for objects without _def', () => {
		expect(isZodV3Field({})).toBe(false);
		expect(isZodV3Field({ _zod: {} })).toBe(false);
	});
});

describe('getFieldType', () => {
	it('returns type for Zod v4 fields', () => {
		expect(getFieldType(z.string())).toBe('string');
		expect(getFieldType(z.enum(['a', 'b']))).toBe('enum');
		expect(getFieldType(z.literal('value'))).toBe('literal');
		expect(getFieldType(z.string().optional())).toBe('optional');
	});
	it('returns normalized type for Zod v3 fields', () => {
		expect(getFieldType(zod3.string())).toBe('string');
		expect(getFieldType(zod3.enum(['a', 'b']))).toBe('enum');
		expect(getFieldType(zod3.literal('value'))).toBe('literal');
		expect(getFieldType(zod3.string().optional())).toBe('optional');
	});
	it('returns typeName as-is for v3 fields without Zod prefix', () => {
		const mockField = { _def: { typeName: 'CustomType' } };
		expect(getFieldType(mockField)).toBe('CustomType');
	});
	it('returns unknown for invalid fields', () => {
		expect(getFieldType({})).toBe('unknown');
		expect(getFieldType(null)).toBe('unknown');
	});
});

describe('isOptionalField', () => {
	it('returns true for optional Zod v4 types', () => {
		const optionalString = z.string().optional();
		expect(isOptionalField(optionalString)).toBe(true);
	});
	it('returns true for optional Zod v3 types', () => {
		const optionalString = zod3.string().optional();
		expect(isOptionalField(optionalString)).toBe(true);
	});
	it('returns false for non-optional Zod v4 types', () => {
		const regularString = z.string();
		expect(isOptionalField(regularString)).toBe(false);
	});
	it('returns false for non-optional Zod v3 types', () => {
		const regularString = zod3.string();
		expect(isOptionalField(regularString)).toBe(false);
	});
	it('returns false for null', () => {
		expect(isOptionalField(null)).toBe(false);
	});
	it('returns false for non-object types', () => {
		expect(isOptionalField('string')).toBe(false);
		expect(isOptionalField(123)).toBe(false);
		expect(isOptionalField(undefined)).toBe(false);
		expect(isOptionalField(true)).toBe(false);
	});
	it('returns false for objects without Zod traits', () => {
		expect(isOptionalField({})).toBe(false);
		expect(isOptionalField({ _zod: {} })).toBe(false);
		expect(isOptionalField({ _zod: { traits: null } })).toBe(false);
	});
});

describe('getInnerType', () => {
	it('returns inner type for optional Zod v4 fields', () => {
		const optional = z.string().optional();
		const inner = getInnerType(optional);
		expect(getFieldType(inner)).toBe('string');
	});
	it('returns inner type for optional Zod v3 fields', () => {
		const optional = zod3.string().optional();
		const inner = getInnerType(optional);
		expect(getFieldType(inner)).toBe('string');
	});
	it('returns the field itself for non-optional fields', () => {
		const field = z.string();
		expect(getInnerType(field)).toBe(field);
	});
});

describe('getUnionOptions', () => {
	it('returns options for Zod v4 union types', () => {
		const union = z.union([z.literal('a'), z.literal('b')]);
		const options = getUnionOptions(union);
		expect(options).toHaveLength(2);
	});
	it('returns options for Zod v3 union types', () => {
		const union = zod3.union([zod3.literal('a'), zod3.literal('b')]);
		const options = getUnionOptions(union);
		expect(options).toHaveLength(2);
	});
	it('returns empty array for non-union fields', () => {
		expect(getUnionOptions(z.string())).toEqual([]);
		expect(getUnionOptions(zod3.string())).toEqual([]);
	});
	it('returns empty array for invalid fields', () => {
		expect(getUnionOptions(null)).toEqual([]);
		expect(getUnionOptions({})).toEqual([]);
	});
});

describe('isZodV4ParseResult', () => {
	it('returns true for successful Zod v4 parse results', () => {
		const result = z.string().safeParse('test');
		expect(isZodV4ParseResult(result as any)).toBe(true);
	});
	it('returns true for failed Zod v4 parse results', () => {
		const result = z.string().safeParse(123);
		expect(isZodV4ParseResult(result as any)).toBe(true);
	});
});

describe('safeParse', () => {
	it('parses data with Zod v4 schemas', () => {
		const schema = z.object({ field: z.string() });
		const result = safeParse(schema, { field: 'value' });
		expect(result.success).toBe(true);
	});
	it('parses data with Zod v3 schemas', () => {
		const schema = zod3.object({ field: zod3.string() });
		const result = safeParse(schema as any, { field: 'value' });
		expect(result.success).toBe(true);
	});
	it('returns errors for invalid data with v4 schemas', () => {
		const schema = z.object({ field: z.string() });
		const result = safeParse(schema, { field: 123 });
		expect(result.success).toBe(false);
	});
	it('returns errors for invalid data with v3 schemas', () => {
		const schema = zod3.object({ field: zod3.string() });
		const result = safeParse(schema as any, { field: 123 });
		expect(result.success).toBe(false);
	});
});
