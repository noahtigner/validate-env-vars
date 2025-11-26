import {
	resolveEscapeSequences,
	expandValue,
	expand,
	loadEnvVars,
} from '../src/loadEnvVars';

describe('resolveEscapeSequences', () => {
	it('converts escaped dollar signs to literal dollar signs', () => {
		expect(resolveEscapeSequences('\\$VAR')).toBe('$VAR');
		expect(resolveEscapeSequences('\\${VAR}')).toBe('${VAR}');
	});

	it('handles multiple escaped dollar signs', () => {
		expect(resolveEscapeSequences('\\$A \\$B \\$C')).toBe('$A $B $C');
	});

	it('returns empty string for empty input', () => {
		expect(resolveEscapeSequences('')).toBe('');
	});

	it('leaves unescaped dollar signs unchanged', () => {
		expect(resolveEscapeSequences('$VAR')).toBe('$VAR');
		expect(resolveEscapeSequences('${VAR}')).toBe('${VAR}');
	});

	it('handles mixed escaped and unescaped dollar signs', () => {
		expect(resolveEscapeSequences('$A \\$B $C')).toBe('$A $B $C');
	});
});

describe('expandValue', () => {
	describe('basic variable expansion', () => {
		it('expands ${VAR} syntax', () => {
			const env = { NAME: 'world' };
			expect(expandValue('hello ${NAME}', env)).toBe('hello world');
		});

		it('expands $VAR syntax (unbraced)', () => {
			const env = { NAME: 'world' };
			expect(expandValue('hello $NAME', env)).toBe('hello world');
		});

		it('returns original value when no variables to expand', () => {
			expect(expandValue('hello world', {})).toBe('hello world');
		});

		it('replaces undefined variables with empty string', () => {
			expect(expandValue('${UNDEFINED}', {})).toBe('');
		});

		it('expands multiple variables', () => {
			const env = { FIRST: 'hello', SECOND: 'world' };
			expect(expandValue('${FIRST} ${SECOND}', env)).toBe('hello world');
		});
	});

	describe('default value syntax', () => {
		it('uses default value when variable is unset (:-)', () => {
			expect(expandValue('${VAR:-default}', {})).toBe('default');
		});

		it('uses variable value when set, ignoring default (:-)', () => {
			const env = { VAR: 'value' };
			expect(expandValue('${VAR:-default}', env)).toBe('value');
		});

		it('uses default value when variable is unset (-)', () => {
			expect(expandValue('${VAR-default}', {})).toBe('default');
		});

		it('handles complex default values with colons', () => {
			expect(expandValue('${VAR:-http://localhost:3000}', {})).toBe(
				'http://localhost:3000'
			);
		});
	});

	describe('alternate value syntax', () => {
		it('uses alternate value when variable is set (:+)', () => {
			const env = { VAR: 'value' };
			expect(expandValue('${VAR:+alternate}', env)).toBe('alternate');
		});

		it('returns empty string when variable is unset (:+)', () => {
			expect(expandValue('${VAR:+alternate}', {})).toBe('');
		});

		it('uses alternate value when variable is set (+)', () => {
			const env = { VAR: 'value' };
			expect(expandValue('${VAR+alternate}', env)).toBe('alternate');
		});
	});

	describe('escaped dollar signs', () => {
		it('does not expand escaped ${} syntax', () => {
			const env = { VAR: 'value' };
			expect(expandValue('\\${VAR}', env)).toBe('\\${VAR}');
		});

		it('does not expand escaped $ syntax', () => {
			const env = { VAR: 'value' };
			expect(expandValue('\\$VAR', env)).toBe('\\$VAR');
		});
	});

	describe('infinite loop protection', () => {
		it('throws on direct self-reference (VAR=${VAR})', () => {
			const env = { VAR: '${VAR}' };
			expect(() => expandValue('${VAR}', env)).toThrow(
				'Possible self-reference detected during environment variable expansion'
			);
		});
	});
});

describe('expand', () => {
	it('expands all variables in a parsed object', () => {
		const parsed = {
			BASE: 'value',
			EXPANDED: '${BASE}',
		};
		const result = expand(parsed);
		expect(result.BASE).toBe('value');
		expect(result.EXPANDED).toBe('value');
	});

	it('handles progressive expansion (later vars reference earlier ones)', () => {
		const parsed = {
			A: 'a',
			B: '${A}b',
			C: '${B}c',
		};
		const result = expand(parsed);
		expect(result.A).toBe('a');
		expect(result.B).toBe('ab');
		expect(result.C).toBe('abc');
	});

	it('resolves escape sequences after expansion', () => {
		const parsed = {
			ESCAPED: '\\$NOT_A_VAR',
		};
		const result = expand(parsed);
		expect(result.ESCAPED).toBe('$NOT_A_VAR');
	});

	it('handles empty input', () => {
		const result = expand({});
		expect(result).toEqual({});
	});

	it('handles undefined values gracefully', () => {
		const parsed = {
			DEFINED: 'value',
			USES_UNDEFINED: '${UNDEFINED_VAR}',
		};
		const result = expand(parsed);
		expect(result.DEFINED).toBe('value');
		expect(result.USES_UNDEFINED).toBe('');
	});

	it('skips keys with undefined values in the input', () => {
		const parsed: Record<string, string | undefined> = {
			DEFINED: 'value',
			UNDEFINED_KEY: undefined,
		};
		const result = expand(parsed);
		expect(result.DEFINED).toBe('value');
		expect(result.UNDEFINED_KEY).toBeUndefined();
	});

	describe('infinite loop protection', () => {
		it('throws on mutual circular references (A=${B}, B=${A})', () => {
			const parsed: Record<string, string | undefined> = {
				A: '${B}',
				B: '${A}',
			};
			expect(() => expand(parsed)).toThrow(
				'Possible self-reference detected during environment variable expansion'
			);
		});

		it('throws on deeply nested expansion that exceeds max depth', () => {
			// Create expansion where the result keeps having more variables
			// This creates exponential growth that hits maxDepth
			const parsed: Record<string, string | undefined> = {
				V1: '${V2}${V2}',
				V2: '${V3}${V3}',
				V3: '${V4}${V4}',
				V4: '${V5}${V5}',
				V5: '${V6}',
				V6: 'x',
			};
			expect(() => expand(parsed)).toThrow(
				'Possible circular reference detected during environment variable expansion'
			);
		});
	});
});

describe('loadEnvVars', () => {
	it('loads environment variables from .env file', () => {
		const envPath = './__tests__/.env.test';
		const result = loadEnvVars(envPath);

		// Verify the function returns the expected values
		expect(result.TEST_EXPECTED_1).toEqual('one');
		expect(result.TEST_EXPECTED_2).toEqual('true');
	});

	it('expands environment variables correctly', () => {
		const envPath = './__tests__/.env.test';
		const result = loadEnvVars(envPath);

		// Variable expansion should resolve ${TEST_EXPECTED_1} to 'one'
		expect(result.TEST_EXPANDED_1).toEqual('one');
	});

	it('throws error for non-existent file', () => {
		const envPath = 'invalid-file-path.env';

		expect(() => {
			loadEnvVars(envPath);
		}).toThrow();
	});

	it('handles undefined envPath by skipping loading .env file', () => {
		const loadEnvFileSpy = jest.spyOn(process, 'loadEnvFile');

		const result = loadEnvVars(undefined);

		expect(loadEnvFileSpy).not.toHaveBeenCalled();
		expect(typeof result).toBe('object');
	});

	it('returns environment variables as a record', () => {
		const envPath = './__tests__/.env.test';
		const result = loadEnvVars(envPath);

		// Result should be a Record<string, string>
		expect(typeof result).toBe('object');
		expect(result).not.toBeNull();
		expect(result.TEST_EXPECTED_1).toBeDefined();
	});
});
