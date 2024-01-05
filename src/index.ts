#!/usr/bin/env node

import parseArgs from './parseArgs';
import { validateEnvVars } from './validate';

try {
	const [expectedEnvVars, receivedEnvVars] = parseArgs();
	validateEnvVars(expectedEnvVars, receivedEnvVars);
} catch (error) {
	console.error((error as Error).message);
	process.exit(1);
}
