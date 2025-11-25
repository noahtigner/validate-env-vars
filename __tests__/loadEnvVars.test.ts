import { z } from 'zod';
import { loadEnvVars } from '../src/loadEnvVars';

describe('loadEnvVars', () => {
	it('process.env is prepared by dotenv', () => {
		const schema = z.object({
			EXPECTED_1: z.string(),
			EXPECTED_2: z.string(),
		});
		const envPath = './__tests__/.env.test';

		loadEnvVars(envPath);

		expect(process.env.EXPECTED_1).toEqual('one');
		expect(process.env.EXPECTED_2).toEqual('true');
	});
	it('process.env is prepared by dotenv-expand', () => {
		const schema = z.object({
			EXPANDED_1: z.string(),
		});
		const envPath = './__tests__/.env.test';

		loadEnvVars(envPath);

		expect(process.env.EXPANDED_1).toEqual('one');
	});
	it('throws if dotenv encounters an error', () => {
		const schema = z.object({
			VAR1: z.string(),
			VAR2: z.string(),
		});
		const envPath = 'invalid-file';

		expect(() => {
			loadEnvVars(envPath);
		}).toThrow();
	});
});
