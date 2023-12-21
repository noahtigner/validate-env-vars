// FILEPATH: /Users/noahtigner/Development/validate-env-vars/__tests__/parseArgs.test.ts

import fs from 'fs';
import process from 'process';
import { parseEnvFile, parseTemplateEnvVar } from '../src/validate';
import parseArgs from '../src/parseArgs';

// jest.mock('../src/validate', () => ({
// 	parseEnvFile: jest.fn(),
// 	parseTemplateEnvVar: jest.fn(),
// }));

describe('parseArgs', () => {
	let originalArgv: string[];
	let readFileSyncSpy: jest.SpyInstance;
	let existSyncSpy: jest.SpyInstance;

	beforeEach(() => {
		originalArgv = process.argv;
		readFileSyncSpy = jest.spyOn(fs, 'readFileSync');
		existSyncSpy = jest.spyOn(fs, 'existsSync');
		const mockFileContent = 'TEST1=abc123\nTEST2=def456';
		existSyncSpy.mockReturnValue(true);
		readFileSyncSpy.mockReturnValue(mockFileContent);
	});

	afterEach(() => {
		process.argv = originalArgv;
		readFileSyncSpy.mockRestore();
		existSyncSpy.mockRestore();
	});

	it('parses -l argument correctly', () => {
		process.argv = ['node', 'index.js', '-l', 'TEST1,TEST2'];
		const [expectedEnvVars, receivedEnvVars] = parseArgs();

		expect(expectedEnvVars).toEqual(['TEST1', 'TEST2']);
		expect(receivedEnvVars).toEqual(parseEnvFile('.env'));
	});

	it('parses --list argument correctly', () => {
		process.argv = ['node', 'index.js', '--list', 'TEST1,TEST2'];
		const [expectedEnvVars, receivedEnvVars] = parseArgs();

		expect(expectedEnvVars).toEqual(['TEST1', 'TEST2']);
		expect(receivedEnvVars).toEqual(parseEnvFile('.env'));
	});

	it('parses -t argument correctly', () => {
		process.argv = ['node', 'index.js', '-t', 'template.env'];

		const [expectedEnvVars, receivedEnvVars] = parseArgs();

		expect(expectedEnvVars).toEqual(
			parseEnvFile('template.env').map(parseTemplateEnvVar)
		);
		expect(receivedEnvVars).toEqual(parseEnvFile('.env'));
	});

	it('parses --template argument correctly', () => {
		process.argv = ['node', 'index.js', '--template', 'template.env'];
		const [expectedEnvVars, receivedEnvVars] = parseArgs();

		expect(expectedEnvVars).toEqual(
			parseEnvFile('template.env').map(parseTemplateEnvVar)
		);
		expect(receivedEnvVars).toEqual(parseEnvFile('.env'));
	});

	it('parses -e argument correctly', () => {
		readFileSyncSpy.mockReturnValue('');
		process.argv = [
			'node',
			'index.js',
			'-e',
			'.env.local',
			'-l',
			'TEST1,TEST2',
		];
		const [expectedEnvVars, receivedEnvVars] = parseArgs();

		expect(expectedEnvVars).toEqual(['TEST1', 'TEST2']);
		expect(receivedEnvVars).toEqual(parseEnvFile('.env.local'));
	});

	it('parses --env argument correctly', () => {
		readFileSyncSpy.mockReturnValue('');
		process.argv = [
			'node',
			'index.js',
			'--env',
			'.env.local',
			'-l',
			'TEST1,TEST2',
		];
		const [expectedEnvVars, receivedEnvVars] = parseArgs();

		expect(expectedEnvVars).toEqual(['TEST1', 'TEST2']);
		expect(receivedEnvVars).toEqual(parseEnvFile('.env.local'));
	});

	it('throws an error for unknown arguments', () => {
		process.argv = ['node', 'index.js', '-x'];
		expect(() => parseArgs()).toThrow('Unknown argument: -x');
	});

	it('throws an error if neither -l or -t is specified', () => {
		process.argv = ['node', 'index.js'];
		expect(() => parseArgs()).toThrow(
			'You must provide either a list of environment variables with -l or --list, or a template file with -t or --template.'
		);
	});
});
