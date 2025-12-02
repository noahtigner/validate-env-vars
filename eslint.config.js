import { defineConfig } from 'eslint/config';
import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import jestPlugin from 'eslint-plugin-jest';
import importPlugin from 'eslint-plugin-import';
import eslintConfigPrettier from 'eslint-config-prettier/flat';

export default defineConfig(
	// extend recommended configs
	eslint.configs.recommended,
	eslintConfigPrettier,
	// general ignore patterns
	{ ignores: ['dist', 'node_modules', 'coverage', 'local.{js,ts}'] },
	// specify parser options for TypeScript source files
	{
		files: ['src/**/*.ts'],
		languageOptions: {
			parserOptions: {
				projectService: true,
			},
		},
		extends: [
			tseslint.configs.strictTypeChecked,
			importPlugin.flatConfigs.recommended,
			importPlugin.flatConfigs.typescript,
		],
	},
	// test files - apply Jest rules & skip lint-based type checking
	{
		files: ['__tests__/**'],
		extends: [
			jestPlugin.configs['flat/all'],
			tseslint.configs.disableTypeChecked,
		],
	}
);
