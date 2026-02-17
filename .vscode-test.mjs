import { defineConfig } from '@vscode/test-cli';

export default defineConfig([
	{
		// Unit tests — opens test workspace for blockly editor tests
		label: 'unit',
		files: 'out/test/**/*.test.js',
		workspaceFolder: 'E:\\test\\debug_extension',
		launchArgs: [
			'--extensions-dir=C:\\Users\\User\\.vscode\\extensions',
			'--disable-workspace-trust',
		],
		// Exclude integration tests from unit test run
		mocha: {
			grep: '^(?!.*Integration)',
			timeout: 180000,
		},
	},
	{
		// Integration tests — opens real workspace with Copilot access
		// Shares user's extensions dir for Copilot, uses separate user-data-dir
		label: 'integration',
		files: 'out/test/integration/**/*.test.js',
		workspaceFolder: 'E:\\test\\debug_extension',
		launchArgs: [
			'--extensions-dir=C:\\Users\\User\\.vscode\\extensions',
		],
		mocha: {
			timeout: 120000,
		},
	},
]);
