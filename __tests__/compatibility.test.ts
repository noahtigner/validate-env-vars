import { z as zodClassic } from 'zod';
import * as zodMini from 'zod/mini';

import validateEnvVars from '../src/index';
import { existsSync, writeFileSync, unlinkSync } from 'fs';

describe('Zod v4 Classic compatibility', () => {
	const testEnvPath = '.env.test-classic';

	beforeEach(() => {
		// Create a test env file
		writeFileSync(testEnvPath, 'TEST_VAR=test_value\nTEST_NUM=123\n');
	});

	afterEach(() => {
		// Clean up
		if (existsSync(testEnvPath)) {
			unlinkSync(testEnvPath);
		}
	});

	it('validates environment variables using Zod Classic', () => {
		// Import from 'zod' which is Zod 4 Classic
		const schema = zodClassic.object({
			TEST_VAR: zodClassic.string(),
			TEST_NUM: zodClassic.string(),
		});

		expect(() => {
			validateEnvVars({
				schema,
				envPath: testEnvPath,
				exitOnError: false,
				logVars: false,
			});
		}).not.toThrow();
	});

	it('supports Zod Classic schema with .optional()', () => {
		const schema = zodClassic.object({
			TEST_VAR: zodClassic.string(),
			OPTIONAL_VAR: zodClassic.string().optional(),
		});

		expect(() => {
			validateEnvVars({
				schema,
				envPath: testEnvPath,
				exitOnError: false,
				logVars: false,
			});
		}).not.toThrow();
	});

	it('supports Zod Classic schema with .meta()', () => {
		const schema = zodClassic.object({
			TEST_VAR: zodClassic.string().meta({
				description: 'A test variable',
				examples: ['example1', 'example2'],
			}),
		});

		expect(() => {
			validateEnvVars({
				schema,
				envPath: testEnvPath,
				exitOnError: false,
				logVars: false,
			});
		}).not.toThrow();
	});

	it('supports Zod Classic with enum types', () => {
		writeFileSync(testEnvPath, 'NODE_ENV=production\n');

		const schema = zodClassic.object({
			NODE_ENV: zodClassic.enum(['development', 'production', 'test']),
		});

		expect(() => {
			validateEnvVars({
				schema,
				envPath: testEnvPath,
				exitOnError: false,
				logVars: false,
			});
		}).not.toThrow();
	});

	it('supports Zod Classic with literal types', () => {
		writeFileSync(testEnvPath, 'APP_NAME=myapp\n');

		const schema = zodClassic.object({
			APP_NAME: zodClassic.literal('myapp'),
		});

		expect(() => {
			validateEnvVars({
				schema,
				envPath: testEnvPath,
				exitOnError: false,
				logVars: false,
			});
		}).not.toThrow();
	});

	it('throws validation errors with Zod Classic', () => {
		const schema = zodClassic.object({
			MISSING_VAR: zodClassic.string(),
		});

		expect(() => {
			validateEnvVars({
				schema,
				envPath: testEnvPath,
				exitOnError: false,
				logVars: false,
			});
		}).toThrow('1 missing or invalid environment variable');
	});
});

describe('Zod Mini compatibility', () => {
	const testEnvPath = '.env.test-mini';

	beforeEach(() => {
		// Create a test env file
		writeFileSync(testEnvPath, 'TEST_VAR=test_value\nTEST_NUM=123\n');
	});

	afterEach(() => {
		// Clean up
		if (existsSync(testEnvPath)) {
			unlinkSync(testEnvPath);
		}
	});

	it('validates environment variables using Zod Mini', () => {
		const schema = zodMini.object({
			TEST_VAR: zodMini.string(),
			TEST_NUM: zodMini.string(),
		});

		expect(() => {
			validateEnvVars({
				schema,
				envPath: testEnvPath,
				exitOnError: false,
				logVars: false,
			});
		}).not.toThrow();
	});

	it('supports Zod Mini with enum types', () => {
		writeFileSync(testEnvPath, 'NODE_ENV=test\n');

		const schema = zodMini.object({
			NODE_ENV: zodMini.enum(['development', 'production', 'test']),
		});

		expect(() => {
			validateEnvVars({
				schema,
				envPath: testEnvPath,
				exitOnError: false,
				logVars: false,
			});
		}).not.toThrow();
	});

	it('supports Zod Mini with union types', () => {
		writeFileSync(testEnvPath, 'VALUE=option1\n');

		const schema = zodMini.object({
			VALUE: zodMini.union([
				zodMini.literal('option1'),
				zodMini.literal('option2'),
			]),
		});

		expect(() => {
			validateEnvVars({
				schema,
				envPath: testEnvPath,
				exitOnError: false,
				logVars: false,
			});
		}).not.toThrow();
	});

	it('throws validation errors with Zod Mini', () => {
		const schema = zodMini.object({
			MISSING_VAR: zodMini.string(),
		});

		expect(() => {
			validateEnvVars({
				schema,
				envPath: testEnvPath,
				exitOnError: false,
				logVars: false,
			});
		}).toThrow('1 missing or invalid environment variable');
	});
});

describe('Cross-compatibility tests', () => {
	const testEnvPath = '.env.test-cross';

	beforeEach(() => {
		writeFileSync(testEnvPath, 'SHARED_VAR=shared_value\n');
	});

	afterEach(() => {
		if (existsSync(testEnvPath)) {
			unlinkSync(testEnvPath);
		}
	});

	it('handles schemas from both Zod Classic and Zod Mini in the same test suite', () => {
		const classicSchema = zodClassic.object({
			SHARED_VAR: zodClassic.string(),
		});

		const miniSchema = zodMini.object({
			SHARED_VAR: zodMini.string(),
		});

		// Both should work
		expect(() => {
			validateEnvVars({
				schema: classicSchema,
				envPath: testEnvPath,
				exitOnError: false,
				logVars: false,
			});
		}).not.toThrow();

		expect(() => {
			validateEnvVars({
				schema: miniSchema,
				envPath: testEnvPath,
				exitOnError: false,
				logVars: false,
			});
		}).not.toThrow();
	});

	it('validates complex schemas with unions from Zod Classic', () => {
		writeFileSync(testEnvPath, 'LOG_LEVEL=info\n');

		const schema = zodClassic.object({
			LOG_LEVEL: zodClassic.union([
				zodClassic.literal('debug'),
				zodClassic.literal('info'),
				zodClassic.literal('warn'),
				zodClassic.literal('error'),
			]),
		});

		expect(() => {
			validateEnvVars({
				schema,
				envPath: testEnvPath,
				exitOnError: false,
				logVars: false,
			});
		}).not.toThrow();
	});

	it('validates complex schemas with unions from Zod Mini', () => {
		writeFileSync(testEnvPath, 'LOG_LEVEL=warn\n');

		const schema = zodMini.object({
			LOG_LEVEL: zodMini.union([
				zodMini.literal('debug'),
				zodMini.literal('info'),
				zodMini.literal('warn'),
				zodMini.literal('error'),
			]),
		});

		expect(() => {
			validateEnvVars({
				schema,
				envPath: testEnvPath,
				exitOnError: false,
				logVars: false,
			});
		}).not.toThrow();
	});
});
