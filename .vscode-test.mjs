import { defineConfig } from '@vscode/test-cli';
import fs from 'fs';
import path from 'path';
import os from 'os';

const ciTempRoot = process.env.VSCODE_TEST_TEMP_DIR;
const extensionDevelopmentPath = process.cwd();
const testWorkspace =
	process.env.VSCODE_TEST_WORKSPACE ||
	(ciTempRoot ? path.join(ciTempRoot, 'workspace') : path.join(os.homedir(), 'test', 'debug_extension'));
const extensionsDir =
	process.env.VSCODE_EXTENSIONS_DIR ||
	(ciTempRoot ? path.join(ciTempRoot, 'extensions') : path.join(os.homedir(), '.vscode', 'extensions'));
const userDataDir =
	process.env.VSCODE_TEST_USER_DATA_DIR ||
	(ciTempRoot ? path.join(ciTempRoot, 'user-data') : path.join(process.cwd(), '.vscode-test', 'user-data-unit'));

if (ciTempRoot) {
	for (const directory of [testWorkspace, extensionsDir, userDataDir]) {
		fs.mkdirSync(directory, { recursive: true });
	}
}

export default defineConfig([
	{
		// Unit tests — opens test workspace for blockly editor tests
		label: 'unit',
		version: '1.109.0',
		files: 'out/test/**/*.test.js',
		extensionDevelopmentPath,
		workspaceFolder: testWorkspace,
		launchArgs: [`--extensions-dir=${extensionsDir}`, `--user-data-dir=${userDataDir}`, '--disable-workspace-trust'],
		env: { NODE_ENV: 'test', SINGULAR_BLOCKLY_TEST_ROOT: extensionDevelopmentPath },
		// Exclude integration tests from unit test run
		mocha: {
			grep: '^(?!.*Integration)',
			require: './out/test/setup.js',
			timeout: 180000,
		},
	},
	{
		// Integration tests — opens real workspace with Copilot access
		// Shares user's extensions dir for Copilot, uses separate user-data-dir
		label: 'integration',
		version: '1.109.0',
		files: 'out/test/integration/**/*.test.js',
		workspaceFolder: testWorkspace,
		launchArgs: [`--extensions-dir=${extensionsDir}`],
		mocha: {
			timeout: 120000,
		},
	},
]);
