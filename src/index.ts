import process from 'process';
import { validateEnvVars, parseEnvFile, parseTemplateEnvVar } from './validate';

try {
	// parse command line arguments
	const args = process.argv.slice(2);

	let expectedEnvVars: string[] = [];
	let envFilePath = '.env';

	for (let i = 0; i < args.length; i++) {
		if (args[i] === '-l' || args[i] === '--list') {
			expectedEnvVars = args[i + 1].split(',');
			i++;
		} else if (args[i] === '-t' || args[i] === '--template') {
			expectedEnvVars = parseEnvFile(args[i + 1]).map(
				parseTemplateEnvVar
			);
			i++;
		} else if (args[i] === '-f' || args[i] === '--file') {
			envFilePath = args[i + 1];
			i++;
		} else {
			throw new Error(`Unknown argument: ${args[i]}`);
		}
	}

	if (!expectedEnvVars || expectedEnvVars.length === 0) {
		throw new Error(
			'You must provide either a list of environment variables with -l or --list, or a template file with -t or --template.'
		);
	}

	const receivedEnvVars = parseEnvFile(envFilePath);

	// validate environment variables
	validateEnvVars(expectedEnvVars, receivedEnvVars);
} catch (error) {
	console.error(
		Object.hasOwnProperty.call(error, 'message')
			? (error as Error).message
			: error
	);
	process.exit(1);
}
