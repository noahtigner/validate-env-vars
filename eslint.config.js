import { defineConfig } from 'eslint/config';
import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';

export default defineConfig(
	eslint.configs.recommended,
	tseslint.configs.strictTypeChecked,
	{
		ignores: ['dist/**', 'node_modules/**', 'coverage/**'],
	},
	{
		languageOptions: {
			parserOptions: {
				projectService: {
					allowDefaultProject: ['*.js', '*.ts', '__tests__/*.ts'],
				},
			},
		},
	}
);
