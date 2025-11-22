// import { z } from 'zod';

// // Helper functions for testing
// const envNonEmptyString = () =>
// 	z
// 		.string()
// 		.min(1, { message: 'Variable cannot be empty' })
// 		.refine((val) => val !== 'undefined', {
// 			message: "Variable cannot equal 'undefined'",
// 		});

// const envInteger = () =>
// 	z.string().regex(/^-?\d+$/, {
// 		message: 'Variable must be a valid integer',
// 	});

// describe('envNonEmptyString', () => {
// 	it('parses successfully for valid strings', () => {
// 		expect(() => envNonEmptyString().parse('valid string')).not.toThrow();
// 	});
// 	it('can be chained with refine', () => {
// 		expect(() =>
// 			envNonEmptyString()
// 				.refine((val) => val.includes('/api/'))
// 				.parse('/api/v3/items')
// 		).not.toThrow();
// 	});
// 	it('throws for undefined strings', () => {
// 		expect(() => {
// 			envNonEmptyString().parse('undefined');
// 		}).toThrow();
// 	});
// 	it('throws for empty strings', () => {
// 		expect(() => {
// 			envNonEmptyString().parse('');
// 		}).toThrow();
// 	});
// });

// describe('envInteger', () => {
// 	it('parses successfully for valid integers', () => {
// 		expect(() => envInteger().parse('123')).not.toThrow();
// 	});
// 	it('throws for invalid integers', () => {
// 		expect(() => {
// 			envInteger().parse('invalid');
// 		}).toThrow();
// 	});
// 	it('throws for floats/doubles', () => {
// 		expect(() => {
// 			envInteger().parse('123.01');
// 		}).toThrow();
// 	});
// });

// describe('z.enum', () => {
// 	it('parses successfully for valid enum values', () => {
// 		expect(() =>
// 			z.enum(['value1', 'value2']).parse('value1')
// 		).not.toThrow();
// 	});
// 	it('throws for invalid enum values', () => {
// 		expect(() => {
// 			z.enum(['value1', 'value2']).parse('invalid');
// 		}).toThrow();
// 	});
// });

// describe('z.literal', () => {
// 	it('parses successfully for valid literal values', () => {
// 		expect(() => z.literal('value1').parse('value1')).not.toThrow();
// 	});
// 	it('throws for invalid literal values', () => {
// 		expect(() => {
// 			z.literal('value1').parse('invalid');
// 		}).toThrow();
// 	});
// });

// describe('z.string', () => {
// 	it('parses successfully for valid strings', () => {
// 		expect(() => z.string().parse('valid string')).not.toThrow();
// 	});
// 	it('parses successfully for empty strings', () => {
// 		expect(() => z.string().parse('')).not.toThrow();
// 	});
// 	it('parses successfully for undefined strings', () => {
// 		expect(() => z.string().parse('undefined')).not.toThrow();
// 	});
// 	it('can be chained with other methods', () => {
// 		expect(() => z.string().min(1).parse('valid string')).not.toThrow();
// 	});
// });

// describe('z.object', () => {
// 	it('parses successfully for valid objects', () => {
// 		expect(() =>
// 			z.object({
// 				VAR1: z.string(),
// 				VAR2: z.enum(['value1', 'value2']),
// 				VAR3: envNonEmptyString(),
// 				VAR4: envInteger(),
// 				VAR5: z.literal('value1'),
// 			}).parse({
// 				VAR1: 'value1',
// 				VAR2: 'value2',
// 				VAR3: '/api/v3/items',
// 				VAR4: '123',
// 				VAR5: 'value1',
// 			})
// 		).not.toThrow();
// 	});
// 	it('throws for invalid objects', () => {
// 		expect(() =>
// 			z.object({
// 				VAR1: z.string(),
// 				VAR2: z.enum(['value1', 'value2']),
// 			}).parse({
// 				VAR1: 'value1',
// 				VAR2: 'invalid',
// 			})
// 		).toThrow();
// 	});
// 	it('throws for missing properties', () => {
// 		expect(() =>
// 			z.object({
// 				VAR1: z.string(),
// 				VAR2: z.enum(['value1', 'value2']),
// 			}).parse({
// 				VAR1: 'value1',
// 			})
// 		).toThrow();
// 	});
// 	it('does not throw for extra properties', () => {
// 		expect(() =>
// 			z.object({
// 				VAR1: z.string(),
// 				VAR2: z.enum(['value1', 'value2']),
// 			}).parse({
// 				VAR1: 'value1',
// 				VAR2: 'value2',
// 				VAR3: 'value3',
// 			})
// 		).not.toThrow();
// 	});
// 	it('throws for incorrect value types', () => {
// 		expect(() =>
// 			z.object({
// 				VAR1: z.string(),
// 				VAR2: z.enum(['value1', 'value2']),
// 			}).parse({
// 				VAR1: 'value1',
// 				VAR2: 123,
// 			})
// 		).toThrow();
// 	});
// 	it('accepts all valid types', () => {
// 		z.object({
// 			VAR1: z.string(),
// 			VAR2: z.enum(['value1', 'value2']),
// 			VAR3: envNonEmptyString(),
// 			VAR4: envInteger(),
// 			VAR5: z.literal('value1'),
// 		});
// 	});
// 	it('accepts optional properties', () => {
// 		z.object({
// 			VAR1: z.string().optional(),
// 			VAR2: z.enum(['value1', 'value2']).optional(),
// 			VAR3: envNonEmptyString().optional(),
// 			VAR4: envInteger().optional(),
// 			VAR5: z.literal('value1').optional(),
// 		});
// 	});
// 	it('accepts union types', () => {
// 		z.object({
// 			VAR1: z.union([z.string(), envNonEmptyString()]),
// 		});
// 	});
// 	it('accepts effects', () => {
// 		z.object({
// 			VAR1: z.string().min(1),
// 		});
// 	});
// 	it('accepts unions with effects', () => {
// 		z.object({
// 			VAR1: z.union([z.string().min(1), z.string().url(), envNonEmptyString()]),
// 		});
// 	});
// });
