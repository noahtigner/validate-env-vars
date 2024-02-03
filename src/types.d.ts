import { ZodObject, type ZodType, type SafeParseReturnType } from 'zod';

export type ZodStringRecord = ZodObject<Record<string, ZodType<string>>>;
export type ZodSafeParseReturnType = SafeParseReturnType<
	Record<string, unknown>,
	Record<string, unknown>
>;
