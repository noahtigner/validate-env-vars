// Mock console methods
global.console = {
	...global.console,
	// log: jest.fn(),
	info: jest.fn(),
	error: jest.fn(),
	warn: jest.fn(),
	debug: jest.fn(),
};

// Store original process.env to restore between tests
const originalEnv = { ...process.env };

// Mock process.loadEnvFile to work properly in Jest environment
// Jest's VM context doesn't persist the native loadEnvFile changes
import { readFileSync } from 'fs';

process.loadEnvFile = function (path?: string): void {
	const envPath = path || './.env';
	const content = readFileSync(envPath, 'utf-8');
	const lines = content.split('\n');

	for (const line of lines) {
		const trimmed = line.trim();
		if (!trimmed || trimmed.startsWith('#')) continue;

		const match = trimmed.match(/^([^=]+)=(.*)$/);
		if (match) {
			const key = match[1].trim();
			let value = match[2].trim();

			// Remove surrounding quotes
			if (
				(value.startsWith('"') && value.endsWith('"')) ||
				(value.startsWith("'") && value.endsWith("'"))
			) {
				value = value.slice(1, -1);
			}

			process.env[key] = value;
		}
	}
};

// Reset process.env before each test
beforeEach(() => {
	// Clear only test-specific env vars, keep system vars
	const testEnvVars = [
		'TEST_EXPECTED_1',
		'TEST_EXPECTED_2',
		'TEST_EXPECTED_NUMBER',
		'TEST_EXPECTED_INT',
		'TEST_EXPECTED_URL',
		'TEST_EXPANDED_1',
		'TEST_EXPANDED_2',
	];
	testEnvVars.forEach((key) => {
		delete process.env[key];
	});
});

// Restore original env after all tests
afterAll(() => {
	Object.keys(process.env).forEach((key) => {
		if (!(key in originalEnv)) {
			delete process.env[key];
		}
	});
	Object.assign(process.env, originalEnv);
});
