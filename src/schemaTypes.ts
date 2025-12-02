// Import from zod/v4/core to support both Zod 4 Classic and Zod 4 Mini
import type * as z4 from 'zod/v4/core';

// Environment variable schemas must be objects with string-based field types
// Using $ZodObject from zod/v4/core ensures compatibility with both Classic and Mini
export type EnvObject = z4.$ZodObject<{
	[k: string]: z4.$ZodType<string | undefined>;
}>;

// Safe parse return type from z4.safeParse
// This matches the return type of z4.safeParse(schema, data) which can be used with
// schemas from both Zod Classic and Zod Mini
export type ZodSafeParseReturnType = z4.util.SafeParseResult<
	Record<string, unknown>
>;

// Use generic constraint to preserve schema type information
export interface Config {
	schema: EnvObject;
	envPath?: string;
	exitOnError?: boolean;
	logVars?: boolean;
}

export interface InnerConfig
	extends Required<Omit<Config, 'exitOnError' | 'envPath'>> {
	vars: Record<string, string>;
}
