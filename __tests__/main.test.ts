import process from 'process';

describe('index.ts (real files)', () => {
	let originalCwd: string;
	let processExitSpy: jest.SpyInstance;

	beforeEach(() => {
		originalCwd = process.cwd();
		process.chdir('__tests__');
		processExitSpy = jest.spyOn(process, 'exit').mockImplementation();
	});

	afterEach(() => {
		process.chdir(originalCwd);
	});

	it('validates environment variables using -l', () => {
		process.argv = [
			'node',
			'index.js',
			'-e',
			'.env.test',
			'-l',
			'EXPECTED_1,OPTIONAL_1',
		];
		jest.isolateModules(() => {
			require('../src/index');
		});
		expect(processExitSpy).not.toHaveBeenCalled();
	});

	it('validates environment variables using -t', () => {
		process.argv = [
			'node',
			'index.js',
			'-e',
			'.env.test',
			'-t',
			'.env.template',
		];
		jest.isolateModules(() => {
			require('../src/index');
		});
		expect(processExitSpy).not.toHaveBeenCalled();
	});
});
