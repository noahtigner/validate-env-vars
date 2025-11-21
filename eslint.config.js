import { defineConfig } from 'eslint/config';
import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import jestPlugin from 'eslint-plugin-jest';
import importPlugin from 'eslint-plugin-import';
import eslintConfigPrettier from 'eslint-config-prettier/flat';

export default defineConfig(
	// extend recommended configs
	eslint.configs.recommended,
	tseslint.configs.strictTypeChecked,
	eslintConfigPrettier,
	// general ignore patterns
	{ ignores: ['dist', 'node_modules', 'coverage'] },
	// specify parser options for TypeScript
	{
		languageOptions: {
			parserOptions: {
				projectService: {
					allowDefaultProject: ['*.js', '*.ts', '__tests__/*.ts'],
				},
			},
		},
	},
	// only apply TypeScript rules to TypeScript files
	{
		files: ['**/*.{ts,tsx}'],
		extends: [
			importPlugin.flatConfigs.recommended,
			importPlugin.flatConfigs.typescript,
		],
	},
	// only apply jest rules to test files
	{
		files: ['test/**'],
		...jestPlugin.configs['flat/all'],
	}
);
