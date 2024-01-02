import fs from 'fs';
import {
	validateEnvVar,
	validateEnvVars,
	parseTemplateEnvVar,
	parseEnvFile,
} from '../src/validate';

describe('validateEnvVar', () => {
	it('returns false for special characters', async () => {
		const special = [
			'$',
			'%',
			'&',
			'*',
			'(',
			')',
			'+',
			'=',
			'[',
			']',
			'{',
			'}',
			'|',
			'\\',
			';',
			':',
			"'",
			'"',
			',',
			'<',
			'>',
			'/',
			'?',
			' ',
		];
		for (const char of special) {
			const result = validateEnvVar('TEST', `TEST=abc${char}123`);
			expect(result).toBe(false);
		}
	});

	it('returns false for missing environment variable', async () => {
		const result = validateEnvVar('TEST', '');
		expect(result).toBe(false);
	});

	it('returns false for mismatched environment variable name', async () => {
		const result = validateEnvVar('TEST', 'DIFFERENT=abc123');
		expect(result).toBe(false);
	});

	it('returns true for valid environment variable', async () => {
		const result = validateEnvVar('TEST', 'TEST=abc123');
		expect(result).toBe(true);
	});

	it('returns true for value with variable substitution', async () => {
		const result = validateEnvVar('TEST', 'TEST=${ABC}');
		expect(result).toBe(true);
	});
});

describe('validateEnvVars', () => {
	it('throws for invalid environment variable', () => {
		const expectedEnvVars = ['TEST1', 'TEST2'];
		const receivedEnvVars = ['TEST1=abc123', 'TEST2=def$%'];
		expect(() =>
			validateEnvVars(expectedEnvVars, receivedEnvVars)
		).toThrow();
	});

	it('throws for missing environment variable', () => {
		const expectedEnvVars = ['TEST1', 'TEST2'];
		const receivedEnvVars = ['TEST1=abc123'];
		expect(() => validateEnvVars(expectedEnvVars, receivedEnvVars)).toThrow(
			'Missing or invalid environment variable: TEST2'
		);
	});

	it('throws for missing environment variables', () => {
		const expectedEnvVars = ['TEST1', 'TEST2'];
		const receivedEnvVars: string[] = [];
		expect(() => validateEnvVars(expectedEnvVars, receivedEnvVars)).toThrow(
			'Missing or invalid environment variables: TEST1, TEST2'
		);
	});

	it('does not throw for valid environment variables', () => {
		const expectedEnvVars = ['TEST1', 'TEST2'];
		const receivedEnvVars = ['TEST1=abc123', 'TEST2=def456'];
		expect(() =>
			validateEnvVars(expectedEnvVars, receivedEnvVars)
		).not.toThrow();
	});

	it('does not throw for valid environment variable (IP Address)', () => {
		const expectedEnvVars = ['IP'];
		const receivedEnvVars = ['IP=127.0.0.1'];
		expect(() =>
			validateEnvVars(expectedEnvVars, receivedEnvVars)
		).not.toThrow();
	});

	it('does not throw for optional environment variable', () => {
		const expectedEnvVars = ['TEST1', 'TEST2 (optional)'];
		const receivedEnvVars = ['TEST1=abc123'];
		expect(() =>
			validateEnvVars(expectedEnvVars, receivedEnvVars)
		).not.toThrow();
	});
});

describe('parseTemplateEnvVar', () => {
	it('returns the correct environment variable name', () => {
		const line = 'TEST=abc123';
		const result = parseTemplateEnvVar(line);
		expect(result).toBe('TEST');
	});

	it('returns the correct environment variable name for optional variables', () => {
		const line = 'TEST=abc123 # optional';
		const result = parseTemplateEnvVar(line);
		expect(result).toBe('TEST (optional)');
	});
});

describe('parseEnvFile', () => {
	let readFileSyncSpy: jest.SpyInstance;
	let existSyncSpy: jest.SpyInstance;

	beforeEach(() => {
		readFileSyncSpy = jest.spyOn(fs, 'readFileSync');
		existSyncSpy = jest.spyOn(fs, 'existsSync');
	});

	it('throws an error if the .env file does not exist', () => {
		expect(() => parseEnvFile('path/to/.env')).toThrow();
	});

	it('throws an error if the .env file cannot be read', () => {
		existSyncSpy.mockReturnValue(true);
		readFileSyncSpy.mockImplementation(() => {
			throw new Error('Test error');
		});
		expect(() => parseEnvFile('path/to/.env')).toThrow();
	});

	it('returns an array of lines from the .env file', () => {
		const mockFileContent = 'TEST1=abc123\nTEST2=def456';
		existSyncSpy.mockReturnValue(true);
		readFileSyncSpy.mockReturnValue(mockFileContent);

		const result = parseEnvFile('path/to/.env');
		expect(result).toEqual(mockFileContent.split('\n'));
	});

	afterEach(() => {
		readFileSyncSpy.mockRestore();
		existSyncSpy.mockRestore();
	});
});
