import {
	string as envString,
	enum as envEnum,
	literal as envLiteral,
	z,
} from 'zod';

const nonEmpty = () =>
	z.string().min(1, { message: 'Variable cannot be empty' });

const envNonEmptyString = () =>
	nonEmpty().refine((val) => val != 'undefined', {
		message: `Variable cannot equal 'undefined'`,
	});

const envInteger = () =>
	nonEmpty().regex(/^-?\d+$/, {
		message: 'Variable must be a valid integer',
	});

type ZodEnvTypes =
	| z.ZodString
	| z.ZodEnum<[string, ...string[]]>
	| z.ZodLiteral<string>
	| ReturnType<typeof envNonEmptyString>
	| ReturnType<typeof envInteger>;

type ZodEnvTypesWithEffects = ZodEnvTypes | z.ZodEffects<ZodEnvTypes>;

type ZodEnvTypesWithUnion =
	| ZodEnvTypes
	| z.ZodUnion<[ZodEnvTypes, ...ZodEnvTypes[]]>;

type ZodEnvTypesOptional = ZodEnvTypes | z.ZodOptional<ZodEnvTypesWithUnion>;

type ZodEnvTypesAll =
	| ZodEnvTypes
	| ZodEnvTypesWithEffects
	| ZodEnvTypesWithUnion
	| ZodEnvTypesOptional
	| z.ZodUnion<[ZodEnvTypesOptional, ...ZodEnvTypesOptional[]]>;

type SchemaType<T extends Record<string, ZodEnvTypesAll>> = {
	[K in keyof T]: T[K];
};

const envObject = <T extends Record<string, ZodEnvTypesAll>>(obj: T) =>
	z.object<SchemaType<T>>(obj);

type EnvObject = ReturnType<typeof envObject>;

type ZodSafeParseReturnType = z.SafeParseReturnType<
	Record<string, unknown>,
	Record<string, unknown>
>;

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
