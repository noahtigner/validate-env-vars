// Import from zod/v4/core to support both Zod 4 Classic and Zod 4 Mini
import type * as z4 from 'zod/v4/core';

// Environment variable schemas must be objects with string-based field types
// Using $ZodObject from zod/v4/core ensures compatibility with both Classic and Mini
// type EnvObject = z4.$ZodObject;
type EnvObject = z4.$ZodObject<{ [k: string]: z4.$ZodType<string | undefined>; }>;

// Safe parse return type
type ZodSafeParseReturnType = z4.util.SafeParseResult<Record<string, unknown>>;

export { type EnvObject, type ZodSafeParseReturnType };
