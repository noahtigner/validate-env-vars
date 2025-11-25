#!/usr/bin/env node

import { z as zod4 } from 'zod/v4';
import { z as zod3 } from 'zod/v3';
import * as zodMini from 'zod/mini';
import validateEnvVars, { type EnvObject } from './dist/index.js';

// inferSchema(zod4.object({ SAMPLE_VAR: zod4.string() }));

// const fieldTypes = [
// 	// zod4.string(),
// 	// zod4.enum(['option1', 'option2']),
// 	// zod4.url(),
// 	zod4.literal('fixedValue'),
// 	// zod4.literal('fixedValue').or(zod4.literal('anotherValue')),
// 	// zod4.stringFormat(
// 	//     "int",
// 	//     (val) => zod4.number().safeParse(Number(val)).success
// 	// ),
// 	// // zod4.promise(zod4.string()),
// 	zod4.stringbool(),
// 	// zod4.number().int().or(zod4.number().min(0)),
// 	// zod4.array(zod4.string()),
// 	// zod4.optional(zod4.string()),
// 	// zod4.string().optional(),
// ];

// fieldTypes.forEach((type, index) => {
// 	console.log({
// 		traits: type._zod.traits,
// 		'def.type': type._zod.def.type,
// 		'def.in.type': type._zod.def.in?.type,
// 		...type._zod,
// 	});
// });

// const schema = zod4.object({
// 	VAR1: zod4.string(),
// 	VAR2: zod4.enum(['value1', 'value2']),
// });
// const data = {
// 	VAR2: 'value2',
// };

// console.log(schema.safeParse(data));

const schemaV4: EnvObject = zod4.object({
	EXPECTED_1: zod4.string().optional(),
	EXPECTED_2: zod4.string(),
	// NODE_ENV: zod4.string(),
	URL_OPTIONAL: zod4.url().optional(),
	// UNDEFINED: zod4.string()
	// 	.min(1)
	// 	.meta({
	// 		description: 'This variable is required and cannot be empty',
	// 		examples: ['some_value', 'another_value'],
	// 	}),
	EXPANDED_1: zod4.string().optional(),
	EXPANDED_2: zod4.string().optional(),
	// NUMBER: zod4.number(),
	EXPECTED_URL: zod4.url(),
	EXPECTED_INT: zod4.stringFormat(
		'int',
		(val) => zod4.number().safeParse(Number(val)).success
	),
});

const schemaMini = zodMini.object({
	EXPECTED_1: zodMini.optional(zodMini.string()),
	EXPECTED_2: zodMini.optional(zodMini.string()),
});

const schemaV3 = zod3.object({
    EXPECTED_1: zod3.string().optional(),
    // EXPECTED_2: zod3.string(),
    // EXPANDED_1: zod3.string().optional(),
    // EXPANDED_2: zod3.string().optional(),
    // EXPECTED_URL: zod3.string().url(),
});

schemaV3._def

try {
	// validateEnvVars({
	// 	schema: schemaV4,
	// 	envPath: './__tests__/.env.test',
	// 	logVars: true,
	// });
	validateEnvVars({
		schema: schemaV3,
		envPath: './__tests__/.env.test',
		logVars: true,
	});
	// validateEnvVars({
	// 	schema: schemaMini,
	// 	envPath: './__tests__/.env.test',
	// 	logVars: true,
	// });
} catch (error) {
	// eslint-disable-next-line no-undef
	console.log('Error validating environment variables:', error);
}

// try {
//     schemaV4.parse({EXPECTED_1: process.env.EXPECTED_1});
// } catch (error) {
//     console.log('Error parsing environment variables with schema:', error);
// }
