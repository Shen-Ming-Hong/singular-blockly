/**
 * @license
 * Copyright 2026 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';

const ROOT = path.join(__dirname, '..', '..', '..');

suite('Legacy MCP Retirement Contract', () => {
	test('package contributions and dependencies expose no legacy server or user Node setup', () => {
		const packageJson = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
		assert.strictEqual(packageJson.engines.vscode, '^1.109.0');
		assert.strictEqual(packageJson.engines.node, '>=22.16.0', 'contributor/build Node baseline remains allowed');
		assert.ok(!packageJson.contributes.mcpServerDefinitionProviders);
		assert.ok(!packageJson.contributes.commands.some((command: any) => /mcp/i.test(command.command)));
		assert.ok(!Object.keys(packageJson.contributes.configuration.properties).some(key => /mcp|nodePath/i.test(key)));
		assert.ok(!Object.keys(packageJson.dependencies).some(key => /modelcontextprotocol|^zod$/i.test(key)));
		const retiredOverrides = [
			'hono', '@hono/node-server', 'body-parser', 'ws', 'express-rate-limit', 'ip-address', 'path-to-regexp',
		];
		for (const dependency of retiredOverrides) {
			assert.ok(!Object.prototype.hasOwnProperty.call(packageJson.overrides, dependency), `${dependency} override must retire with MCP`);
		}
	});

	test('production source, scripts, and webpack config contain no legacy implementation entry', () => {
		const forbidden = /modelcontextprotocol|block-dictionary|mcp-server|singularBlockly\.mcp|checkMcpStatus|nodeDetectionService/i;
		const roots = ['src', 'scripts'];
		for (const relativeRoot of roots) {
			const walk = (directory: string): void => {
				for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
					const fullPath = path.join(directory, entry.name);
					if (entry.isDirectory()) {
						if (fullPath.includes(`${path.sep}test${path.sep}`) || fullPath.endsWith(`${path.sep}test`)) {continue;}
						walk(fullPath);
					} else if (/\.(?:ts|js|json)$/.test(entry.name)) {
						assert.doesNotMatch(fs.readFileSync(fullPath, 'utf8'), forbidden, path.relative(ROOT, fullPath));
					}
				}
			};
			walk(path.join(ROOT, relativeRoot));
		}
		assert.doesNotMatch(fs.readFileSync(path.join(ROOT, 'webpack.config.js'), 'utf8'), forbidden);
	});
});
