import process from 'process';
import parseArgs from '../src/parseArgs';
import { validateEnvVars } from '../src/validate';

jest.mock('../src/parseArgs');
jest.mock('../src/validate');

describe('index.ts', () => {
	let consoleErrorSpy: jest.SpyInstance;
	let processExitSpy: jest.SpyInstance;

	beforeEach(() => {
		consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
		processExitSpy = jest.spyOn(process, 'exit').mockImplementation();
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	it('calls validateEnvVars with the result of parseArgs', () => {
		const mockArgs = [
			['VAR1', 'VAR2'],
			['VAR1=value1', 'VAR2=value2'],
		];
		(parseArgs as jest.Mock).mockReturnValue(mockArgs);

		// isolate the require and import statements in a callback function so that modules are not shared between tests
		jest.isolateModules(() => {
			require('../src/index');
		});

		expect(validateEnvVars).toHaveBeenCalledWith(...mockArgs);
	});

	it('logs the error message and exits the process with 1 when an error is thrown', () => {
		const mockError = new Error('Test error');
		(parseArgs as jest.Mock).mockImplementation(() => {
			throw mockError;
		});

		// isolate the require and import statements in a callback function so that modules are not shared between tests
		jest.isolateModules(() => {
			require('../src/index');
		});

		expect(consoleErrorSpy).toHaveBeenCalledWith(mockError.message);
		expect(processExitSpy).toHaveBeenCalledWith(1);
	});
});
