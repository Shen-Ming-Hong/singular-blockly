import * as assert from 'assert';
import * as vscode from 'vscode';
import * as path from 'path';

const repositoryRoot = process.env.SINGULAR_BLOCKLY_TEST_ROOT;
if (!repositoryRoot || !path.isAbsolute(repositoryRoot)) {
	throw new Error('SINGULAR_BLOCKLY_TEST_ROOT must be an absolute path');
}

process.chdir(repositoryRoot);

process.stdout.write(
	`Test Extension Host: ${JSON.stringify({
		node: process.versions.node,
		electron: process.versions.electron,
		platform: process.platform,
		arch: process.arch,
	})}\n`
);

assert.ok(Number(process.versions.node.split('.')[0]) >= 24, 'Extension Host must provide Node 24 or newer');
const [editorMajor, editorMinor] = vscode.version.split('.').map(Number);
assert.ok(editorMajor > 1 || (editorMajor === 1 && editorMinor >= 126), 'Editor must provide VS Code API 1.126 or newer');
process.stdout.write(`Test editor: ${vscode.env.appName} ${vscode.version}\n`);
