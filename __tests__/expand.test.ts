import {
	resolveEscapeSequences,
	expandValue,
	expand,
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
			expect(expandValue('${FIRST} ${SECOND}', env)).toBe(
				'hello world'
			);
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

	describe('progressive expansion', () => {
		// it('uses runningParsed for values defined earlier in the file', () => {
		// 	const runningParsed = { FIRST: 'first' };
		// 	expect(expandValue('${FIRST}', {}, runningParsed)).toBe('first');
		// });

		// it('prefers env over runningParsed', () => {
		// 	const env = { VAR: 'from-env' };
		// 	const runningParsed = { VAR: 'from-parsed' };
		// 	expect(expandValue('${VAR}', env, runningParsed)).toBe('from-env');
		// });
	});

	describe('self-referential protection', () => {
		it('prevents infinite loop on self-reference', () => {
			const env = { VAR: '${VAR}' };
			// Should not hang, should return the default or empty
			expect(expandValue('${VAR}', env)).toBe('');
		});
	});

	describe('edge cases', () => {
		it('handles empty operator value for simple variables', () => {
			const env = { VAR: 'value' };
			// No operator, just a simple variable
			expect(expandValue('${VAR}', env)).toBe('value');
		});

		it('handles variables without operators joining correctly', () => {
			const env = { PORT: '3000' };
			// This tests that parts.slice(1).join works correctly when there's no operator
			expect(expandValue('port: ${PORT}', env)).toBe('port: 3000');
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
});
