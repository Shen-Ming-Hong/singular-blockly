/**
 * @license
 * Copyright 2025 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import * as assert from 'assert';
import * as fs from 'fs';

export function readWorkspaceFile(filePath: string): string {
	return fs.readFileSync(filePath, 'utf8');
}

export function assertContainsAll(content: string, snippets: string[], label = 'content'): void {
	for (const snippet of snippets) {
		assert.ok(content.includes(snippet), `${label} should contain ${snippet}`);
	}
}

export function assertDoesNotContainAny(content: string, snippets: string[], label = 'content'): void {
	for (const snippet of snippets) {
		assert.ok(!content.includes(snippet), `${label} should not contain ${snippet}`);
	}
}

export function extractFunctionBody(content: string, functionName: string): string {
	const startPattern = new RegExp(`function\\s+${functionName}\\s*\\([^)]*\\)\\s*\\{`);
	const match = startPattern.exec(content);
	assert.ok(match, `function ${functionName} should exist`);

	let depth = 0;
	let start = match.index;
	let bodyStart = content.indexOf('{', start);
	for (let index = bodyStart; index < content.length; index++) {
		const char = content[index];
		if (char === '{') {
			depth++;
		} else if (char === '}') {
			depth--;
			if (depth === 0) {
				return content.slice(start, index + 1);
			}
		}
	}

	assert.fail(`function ${functionName} body should be balanced`);
}
