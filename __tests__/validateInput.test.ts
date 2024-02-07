import { z } from 'zod';
import { validateInputSchema, validateInputFile } from '../src/validateInput';

describe('validateInputSchema', () => {
	it('throws if not passed a zodObject', () => {
		expect(() => {
			// @ts-expect-error - testing invalid input
			validateInputSchema({});
		}).toThrow();
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
			VAR4: z.union([z.string().url(), z.string()]).optional(),
			VAR5: z.union([z.string().url(), z.string().optional()]),
		});
		expect(() => {
			validateInputSchema(schema);
		}).not.toThrow();
	});
});

describe('validateInputFile', () => {
	it('throws if the file does not exist', () => {
		expect(() => {
			validateInputFile('nonexistent-file');
		}).toThrow();
	});
	it('does not throw if the file exists', () => {
		expect(() => {
			validateInputFile('./__tests__/.env.test');
		}).not.toThrow();
	});
});
