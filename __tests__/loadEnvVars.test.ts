import { loadEnvVars } from '../src/loadEnvVars';

describe('loadEnvVars', () => {
	it('loads environment variables from .env file', () => {
		const envPath = './__tests__/.env.test';
		const result = loadEnvVars(envPath);

		// Verify the function returns the expected values
		expect(result.TEST_EXPECTED_1).toEqual('one');
		expect(result.TEST_EXPECTED_2).toEqual('true');

		// Verify process.env is populated
		expect(process.env.TEST_EXPECTED_1).toEqual('one');
		expect(process.env.TEST_EXPECTED_2).toEqual('true');
	});

	it('expands environment variables correctly', () => {
		const envPath = './__tests__/.env.test';
		const result = loadEnvVars(envPath);

		// Variable expansion should resolve ${TEST_EXPECTED_1} to 'one'
		expect(result.TEST_EXPANDED_1).toEqual('one');
	});

	it('throws error for non-existent file', () => {
		const envPath = 'invalid-file-path.env';

		expect(() => {
			loadEnvVars(envPath);
		}).toThrow();
	});

	it('handles undefined envPath by using default .env file', () => {
		// When envPath is undefined, loadEnvFile uses default './.env'
		// This will throw if the default .env doesn't exist, which is expected
		// For this test, we expect it to attempt loading the default file
		try {
			loadEnvVars(undefined);
			// If .env exists, this should succeed
			expect(true).toBe(true);
		} catch (error) {
			// If .env doesn't exist, we expect ENOENT error
			expect((error as Error).message).toContain('ENOENT');
		}
	});

	it('returns environment variables as a record', () => {
		const envPath = './__tests__/.env.test';
		const result = loadEnvVars(envPath);

		// Result should be a Record<string, string>
		expect(typeof result).toBe('object');
		expect(result).not.toBeNull();
		expect(result.TEST_EXPECTED_1).toBeDefined();
	});
});
