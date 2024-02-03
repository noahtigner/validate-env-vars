import { string as envString, enum as envEnum, z } from 'zod';

const envNonEmptyString = () =>
	z
		.string()
		.min(1, { message: 'String cannot be empty' })
		.refine((val) => val != 'undefined', {
			message: `String cannot equal 'undefined'`,
		});

const envObject = z.object<
	Record<
		string,
		| z.ZodString
		| z.ZodEnum<[string, ...string[]]>
		| z.ZodEffects<z.ZodString, string, string>
	>
>;

export { envNonEmptyString, envString, envEnum, envObject };
