import typescriptEslint from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';

export default [
	{
		// Global ignores (applies to all configurations)
		ignores: [
			'node_modules/**',
			'dist/**',
			'out/**',
			'build/**',
			'coverage/**',
			'.nyc_output/**',
			'*.min.js',
			'*.bundle.js',
			'webpack.config.js',
			// WebView assets (browser context, different linting rules)
			'media/js/**',
			'media/blockly/**',
		],
	},
	{
		files: ['**/*.ts'],
	},
	{
		plugins: {
			'@typescript-eslint': typescriptEslint,
		},

		languageOptions: {
			parser: tsParser,
			ecmaVersion: 2023,
			sourceType: 'module',
		},

		rules: {
			'@typescript-eslint/naming-convention': [
				'warn',
				{
					selector: 'import',
					format: ['camelCase', 'PascalCase'],
				},
			],

			curly: 'warn',
			eqeqeq: 'warn',
			'no-throw-literal': 'warn',
			semi: 'warn',
		},
	},
];
