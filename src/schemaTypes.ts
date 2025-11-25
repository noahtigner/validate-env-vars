// Import from zod/v3 and zod/v4/core to support Zod 3, Zod 4 Classic, and Zod 4 Mini
import type * as z3 from 'zod/v3';
import type * as z4 from 'zod/v4/core';

// Helper types for Zod v4 internal structure
export interface ZodV4Internal {
	traits: Set<string>;
	def: {
		type: string;
		shape: Record<string, unknown>;
		options?: unknown[];
		innerType?: unknown;
	};
}

// Helper types for Zod v3 internal structure
// Zod v3 uses ZodTypeDef and specific def types for each Zod type
// Reference: node_modules/zod/v3/types.d.ts
export interface ZodV3Internal {
	typeName: z3.ZodFirstPartyTypeKind;
	shape?: () => Record<string, unknown>;
	options?: unknown[];
	innerType?: unknown;
	[key: string]: unknown; 
}

// Environment variable schemas must be objects with string-based field types
// Support both Zod 3 and Zod 4 schemas
export type EnvObjectV3 = z3.ZodObject<{
	[k: string]: z3.ZodTypeAny;
}>;

export type EnvObjectV4 = z4.$ZodObject<{
	[k: string]: z4.$ZodType<string | undefined>;
}>;

// Union type that accepts schemas from Zod 3, Zod 4 Classic, and Zod 4 Mini
export type EnvObject = EnvObjectV3 | EnvObjectV4;

// Helper type for accessing internal v4 structure
export type EnvObjectV4WithInternal = EnvObjectV4 & {
	_zod: ZodV4Internal;
};

// Helper type for accessing internal v3 structure
export type EnvObjectV3WithInternal = EnvObjectV3 & {
	_def: ZodV3Internal;
};

// Field types with internal structures
export type ZodV4FieldWithInternal = z4.$ZodType & {
	_zod: ZodV4Internal;
};

export type ZodV3FieldWithInternal = z3.ZodTypeAny & {
	_def: ZodV3Internal;
};

// Safe parse return types for both v3 and v4
export type ZodSafeParseReturnTypeV3 = z3.SafeParseReturnType<
	Record<string, unknown>,
	Record<string, unknown>
>;

export type ZodSafeParseReturnTypeV4 = z4.util.SafeParseResult<
	Record<string, unknown>
>;

// Union type for safe parse results
export type ZodSafeParseReturnType =
	| ZodSafeParseReturnTypeV3
	| ZodSafeParseReturnTypeV4;

// Use generic constraint to preserve schema type information
export interface Config {
	schema: EnvObject;
	envPath?: string;
	exitOnError?: boolean;
	logVars?: boolean;
}
