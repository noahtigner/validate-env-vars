import {
	string as envString,
	enum as envEnum,
	literal as envLiteral,
	z,
	core,
} from 'zod';

const nonEmpty = (params?: string | core.$ZodStringParams) =>
	z.string(params).min(1, {
		message: 'Variable cannot be empty',
	});

const envNonEmptyString = () =>
	nonEmpty().refine((val) => val != 'undefined', {
		message: `Variable cannot equal 'undefined'`,
	});

const envInteger = (params?: string | core.$ZodStringParams) =>
	nonEmpty(params).regex(/^-?\d+$/, {
		message: 'Variable must be a valid integer',
	});

type ZodEnvTypes =
	| z.ZodString
	| z.ZodEnum
	| z.ZodLiteral<string>
	| ReturnType<typeof envNonEmptyString>
	| ReturnType<typeof envInteger>;

type ZodEnvTypesWithUnion =
	| ZodEnvTypes
	| z.ZodUnion<[ZodEnvTypes, ...ZodEnvTypes[]]>;

type ZodEnvTypesOptional = ZodEnvTypes | z.ZodOptional<ZodEnvTypesWithUnion>;

type ZodEnvTypesAll =
	| ZodEnvTypes
	| ZodEnvTypesWithUnion
	| ZodEnvTypesOptional
	| z.ZodUnion<[ZodEnvTypesOptional, ...ZodEnvTypesOptional[]]>;

type SchemaType<T extends Record<string, ZodEnvTypesAll>> = {
	[K in keyof T]: T[K];
};

const envObject = <T extends Record<string, ZodEnvTypesAll>>(obj: T) =>
	z.object<SchemaType<T>>(obj);

type EnvObject = ReturnType<typeof envObject>;

type ZodSafeParseReturnType = z.ZodSafeParseResult<Record<string, unknown>>;

export {
	envString,
	envNonEmptyString,
	envInteger,
	envEnum,
	envLiteral,
	envObject,
	type EnvObject,
	type ZodSafeParseReturnType,
};
