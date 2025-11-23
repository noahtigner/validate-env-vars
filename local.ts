#!/usr/bin/env node

import { z } from 'zod';
import * as zodMini from 'zod/mini';
import validateEnvVars, { type EnvObject } from './dist/index.js';

// inferSchema(z.object({ SAMPLE_VAR: z.string() }));

// const fieldTypes = [
// 	// z.string(),
// 	// z.enum(['option1', 'option2']),
// 	// z.url(),
// 	z.literal('fixedValue'),
// 	// z.literal('fixedValue').or(z.literal('anotherValue')),
// 	// z.stringFormat(
// 	//     "int",
// 	//     (val) => z.number().safeParse(Number(val)).success
// 	// ),
// 	// // z.promise(z.string()),
// 	z.stringbool(),
// 	// z.number().int().or(z.number().min(0)),
// 	// z.array(z.string()),
// 	// z.optional(z.string()),
// 	// z.string().optional(),
// ];

// fieldTypes.forEach((type, index) => {
// 	console.log({
// 		traits: type._zod.traits,
// 		'def.type': type._zod.def.type,
// 		'def.in.type': type._zod.def.in?.type,
// 		...type._zod,
// 	});
// });

const schemaClassic: EnvObject = z.object({
    EXPECTED_1: z.string().optional(),
    EXPECTED_2: z.string().optional(),
    NODE_ENV: z.string().optional(),
    URL_OPTIONAL: z.url().optional(),
    UNDEFINED: z.string()
    	.min(1)
    	.meta({
    		description: 'This variable is required and cannot be empty',
    		examples: ['some_value', 'another_value'],
    	}),
    EXPANDED_1: z.string().optional(),
    EXPANDED_2: z.string().optional(),
    // NUMBER: z.number(),
    EXPECTED_URL: z.url(),
    EXPECTED_INT: z.stringFormat(
        "int",
        (val) => z.number().safeParse(Number(val)).success
    ),
});

const schemaMini = zodMini.object({
    EXPECTED_1: zodMini.optional(zodMini.string()),
    EXPECTED_2: zodMini.optional(zodMini.string()),
});

try {
    validateEnvVars({
        schema: schemaClassic,
        envPath: './__tests__/.env.test',
        logVars: true,
    });
    validateEnvVars({
        schema: schemaMini,
        envPath: './__tests__/.env.test',
        logVars: true,
    });
} catch (error) {
    // eslint-disable-next-line no-undef
    console.log('Error validating environment variables:', error);
}

// try {
//     schemaClassic.parse({EXPECTED_1: process.env.EXPECTED_1});
// } catch (error) {
//     console.log('Error parsing environment variables with schema:', error);
// }
