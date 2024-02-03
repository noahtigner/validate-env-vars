import { z } from 'zod';
import {
	envNonEmptyString,
	envEnum,
	envString,
	envObject,
} from '../src/schemaTypes';

describe('envNonEmptyString', () => {
	it('parses successfully for valid strings', () => {
		expect(() => envNonEmptyString().parse('valid string')).not.toThrow();
	});
	it('can be chained with refine', () => {
		expect(() =>
			envNonEmptyString()
				.refine((val) => val.includes('/api/'))
				.parse('/api/v3/items')
		).not.toThrow();
	});
	it('throws for undefined strings', () => {
		expect(() => {
			envNonEmptyString().parse('undefined');
		}).toThrow();
	});
	it('throws for empty strings', () => {
		expect(() => {
			envNonEmptyString().parse('');
		}).toThrow();
	});
});

describe('envEnum', () => {
	it('parses successfully for valid enum values', () => {
		expect(() =>
			envEnum(['value1', 'value2']).parse('value1')
		).not.toThrow();
	});
	it('throws for invalid enum values', () => {
		expect(() => {
			envEnum(['value1', 'value2']).parse('invalid');
		}).toThrow();
	});
});

describe('envString', () => {
	it('parses successfully for valid strings', () => {
		expect(() => envString().parse('valid string')).not.toThrow();
	});
	it('parses successfully for empty strings', () => {
		expect(() => envString().parse('')).not.toThrow();
	});
	it('parses successfully for undefined strings', () => {
		expect(() => envString().parse('undefined')).not.toThrow();
	});
	it('can be chained with other methods', () => {
		expect(() => envString().min(1).parse('valid string')).not.toThrow();
	});
});

describe('envObject', () => {
	it('parses successfully for valid objects', () => {
		expect(() =>
			envObject({
				VAR1: envString(),
				VAR2: envEnum(['value1', 'value2']),
			}).parse({
				VAR1: 'value1',
				VAR2: 'value2',
			})
		).not.toThrow();
	});
	it('throws for invalid objects', () => {
		expect(() =>
			envObject({
				VAR1: envString(),
				VAR2: envEnum(['value1', 'value2']),
			}).parse({
				VAR1: 'value1',
				VAR2: 'invalid',
			})
		).toThrow();
	});
	it('throws for missing properties', () => {
		expect(() =>
			envObject({
				VAR1: envString(),
				VAR2: envEnum(['value1', 'value2']),
			}).parse({
				VAR1: 'value1',
			})
		).toThrow();
	});
	it('does not throw for extra properties', () => {
		expect(() =>
			envObject({
				VAR1: envString(),
				VAR2: envEnum(['value1', 'value2']),
			}).parse({
				VAR1: 'value1',
				VAR2: 'value2',
				VAR3: 'value3',
			})
		).not.toThrow();
	});
	it('throws for incorrect value types', () => {
		expect(() =>
			envObject({
				VAR1: envString(),
				VAR2: envEnum(['value1', 'value2']),
			}).parse({
				VAR1: 'value1',
				VAR2: 123,
			})
		).toThrow();
	});
	it('throws a typeerror for incorrect property types', () => {
		envObject({
			// @ts-expect-error - testing invalid input
			VAR1: z.boolean(),
			VAR2: envEnum(['value1', 'value2']),
		});
	});
	it('accepts all valid types', () => {
		envObject({
			VAR1: envString(),
			VAR2: envEnum(['value1', 'value2']),
			VAR3: envNonEmptyString(),
		});
	});
});
