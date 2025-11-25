import type * as z3 from 'zod/v3';
import { ZodFirstPartyTypeKind as ZodV3TypeKind } from 'zod/v3';
import type * as z4 from 'zod/v4/core';
import type {
	EnvObject,
	EnvObjectV3WithInternal,
	EnvObjectV4WithInternal,
	ZodSafeParseReturnType,
	ZodV3FieldWithInternal,
	ZodV4FieldWithInternal,
} from './schemaTypes';

/**
 * Type guard to check if a schema is a Zod v4 schema.
 * Zod v4 schemas have a `_zod` property, while v3 schemas have `_def`.
 *
 * @param schema - The schema to check
 * @returns `true` if the schema is a Zod v4 schema
 */
export function isZodV4Schema(
	schema: EnvObject
): schema is EnvObjectV4WithInternal {
	if (!('_zod' in schema)) return false;
	const zodProp = (schema as EnvObjectV4WithInternal)._zod;
	// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
	if (!zodProp || typeof zodProp !== 'object') return false;
	return (
		zodProp.traits instanceof Set &&
		(zodProp.traits.has('ZodObject') || zodProp.traits.has('ZodMiniObject'))
	);
}

/**
 * Type guard to check if a schema is a Zod v3 schema.
 *
 * @param schema - The schema to check
 * @returns `true` if the schema is a Zod v3 schema
 */
export function isZodV3Schema(
	schema: EnvObject
): schema is EnvObjectV3WithInternal {
	if ('_zod' in schema) return false; // If it has _zod, it's v4
	if (!('_def' in schema)) return false;
	const defProp = (schema as { _def: unknown })._def;
	if (!defProp || typeof defProp !== 'object') return false;
	return (
		(defProp as { typeName: unknown }).typeName === ZodV3TypeKind.ZodObject
	);
}

/**
 * Gets the shape (field definitions) from either a v3 or v4 schema.
 *
 * @param schema - The schema to extract the shape from
 * @returns The shape object containing field definitions
 */
export function getSchemaShape(schema: EnvObject): Record<string, unknown> {
	if (isZodV4Schema(schema)) {
		return schema._zod.def.shape;
	} else {
		// For v3, _def.shape is a function that returns the shape
		const v3Schema = schema as EnvObjectV3WithInternal;
		const shape = v3Schema._def.shape;
		return typeof shape === 'function' ? shape() : {};
	}
}

/**
 * Type guard to check if a field is a Zod v4 type.
 *
 * @param field - The field to check
 * @returns `true` if the field is a Zod v4 type
 */
export function isZodV4Field(field: unknown): field is ZodV4FieldWithInternal {
	if (typeof field !== 'object' || field === null) return false;
	if (!('_zod' in field)) return false;
	const zodProp = (field as Record<string, unknown>)._zod;
	return (
		typeof zodProp === 'object' &&
		zodProp !== null &&
		'traits' in zodProp &&
		(zodProp as Record<string, unknown>).traits instanceof Set
	);
}

/**
 * Type guard to check if a field is a Zod v3 type.
 *
 * @param field - The field to check
 * @returns `true` if the field is a Zod v3 type
 */
export function isZodV3Field(field: unknown): field is ZodV3FieldWithInternal {
	return (
		typeof field === 'object' &&
		field !== null &&
		'_def' in field &&
		!('_zod' in field)
	);
}

/**
 * Gets the type name from a field, works with both v3 and v4.
 *
 * For v3, converts the typeName (e.g., "ZodString") to v4 format (e.g., "string").
 *
 * @param field - The field to get the type from
 * @returns The type name as a string
 */
export function getFieldType(field: unknown): string {
	if (isZodV4Field(field)) {
		return field._zod.def.type;
	} else if (isZodV3Field(field)) {
		// Type assertion needed because ZodTypeAny has _def typed as any
		const typeName = field._def.typeName as z3.ZodFirstPartyTypeKind;
		// Convert v3 typeName format (ZodString) to v4 format (string)
		// Remove "Zod" prefix and lowercase the first letter
		if (typeName.startsWith('Zod')) {
			const withoutPrefix = typeName.slice(3); // Remove "Zod"
			return (
				withoutPrefix.charAt(0).toLowerCase() + withoutPrefix.slice(1)
			);
		}
		return typeName;
	}
	return 'unknown';
}

/**
 * Checks if a field is optional in both v3 and v4.
 *
 * @param field - The field to check
 * @returns `true` if the field is optional
 */
export function isOptionalField(field: unknown): boolean {
	if (isZodV4Field(field)) {
		const traits = field._zod.traits;
		return traits instanceof Set && traits.has('ZodOptional');
	} else if (isZodV3Field(field)) {
		// Type assertion needed because ZodTypeAny has _def typed as any
		// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
		return (
			(field._def.typeName as z3.ZodFirstPartyTypeKind) ===
			ZodV3TypeKind.ZodOptional
		);
	}
	return false;
}

/**
 * Gets the inner type of an optional field for both v3 and v4.
 *
 * @param field - The optional field
 * @returns The inner type, or the field itself if not optional
 */
export function getInnerType(field: unknown): unknown {
	if (isZodV4Field(field) && isOptionalField(field)) {
		return field._zod.def.innerType;
	} else if (isZodV3Field(field) && isOptionalField(field)) {
		return (field._def as z3.ZodOptionalDef).innerType;
	}
	return field;
}

/**
 * Gets the options from a union type for both v3 and v4.
 *
 * @param field - The union field
 * @returns Array of option types
 */
export function getUnionOptions(field: unknown): unknown[] {
	if (isZodV4Field(field)) {
		return field._zod.def.options ?? [];
	} else if (isZodV3Field(field)) {
		const def = field._def as { typeName: unknown; options?: unknown };
		if (def.typeName === ZodV3TypeKind.ZodUnion) {
			const options = (field._def as z3.ZodUnionDef).options;
			return Array.from(options);
		}
	}
	return [];
}

/**
 * Type guard to check if a parse result is from Zod v4.
 *
 * @param result - The parse result to check
 * @returns `true` if the result is from Zod v4
 */
export function isZodV4ParseResult(
	result: ZodSafeParseReturnType
): result is z4.util.SafeParseResult<Record<string, unknown>> {
	// In v4, errors have a different structure
	if (!result.success) {
		return 'issues' in result.error;
	}
	return true;
}

/**
 * Parses data using the appropriate safeParse method based on schema version.
 *
 * @param schema - The Zod schema (v3 or v4)
 * @param data - The data to parse
 * @returns The parse result from the appropriate Zod version
 */
export function safeParse(
	schema: EnvObject,
	data: Record<string, unknown>
): ZodSafeParseReturnType {
	if (isZodV4Schema(schema)) {
		return (
			schema as unknown as {
				safeParse: (data: unknown) => ZodSafeParseReturnType;
			}
		).safeParse(data);
	} else {
		const v3Schema = schema as z3.ZodObject<z3.ZodRawShape>;
		return v3Schema.safeParse(data) as ZodSafeParseReturnType;
	}
}
