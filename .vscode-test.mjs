import { defineConfig } from '@vscode/test-cli';
import path from 'path';
import os from 'os';

const testWorkspace = process.env.VSCODE_TEST_WORKSPACE || 'E:\\test\\debug_extension';
const extensionsDir = process.env.VSCODE_EXTENSIONS_DIR || path.join(os.homedir(), '.vscode', 'extensions');

export default defineConfig([
	{
		// Unit tests — opens test workspace for blockly editor tests
		label: 'unit',
		files: 'out/test/**/*.test.js',
		workspaceFolder: testWorkspace,
		launchArgs: [`--extensions-dir=${extensionsDir}`, '--disable-workspace-trust'],
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
		workspaceFolder: testWorkspace,
		launchArgs: [`--extensions-dir=${extensionsDir}`],
		mocha: {
			timeout: 120000,
		},
	},
]);
