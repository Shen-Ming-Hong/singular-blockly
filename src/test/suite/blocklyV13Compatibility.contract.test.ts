/**
 * @license
 * Copyright 2026 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';

type Rule = {
	pattern: RegExp;
};

const PROJECT_ROOT = path.join(__dirname, '..', '..', '..');
const MEDIA_ROOT = path.join(PROJECT_ROOT, 'media');

const RULES: Record<string, Rule> = {
	removedProcedureVariableApi: {
		pattern: /\.getVars\(/g,
	},
	removedWorkspaceVariableWrapper: {
		pattern: /\.(?:renameVariableById|deleteVariableById)\(/g,
	},
	legacyBlockEventAlias: {
		pattern: /Blockly\.Events\.(?:CREATE|CHANGE|MOVE|DELETE)\b/g,
	},
	mainWorkspaceLookup: {
		pattern: /Blockly\.getMainWorkspace\(/g,
	},
	privateBlocklyField: {
		pattern: /\.(?:toolbox_|flyout_|workspace_|pathObject)\b/g,
	},
	corePrototypePatch: {
		pattern:
			/(?:Blockly\.(?:WorkspaceSvg|FieldVariable|Flyout|BlockSvg|ToolboxCategory)\.prototype\.[A-Za-z0-9_$]+\s*=|Blockly\.Variables\.createVariable\s*=|fieldInputPrototype\.onHtmlInputKeyDown_\s*=)/g,
	},
};

const APPROVED_LEGACY_INTEGRATIONS: Record<string, { pattern: RegExp; exactMatches: Record<string, number> }> = {
	previewXmlImport: {
		pattern: /Blockly\.Xml\.(?:textToDom|domToWorkspace)\(/g,
		exactMatches: {
			'media/js/blocklyPreview.js': 2,
		},
	},
	legacyMutationHooks: {
		pattern: /(?:mutationToDom|domToMutation)\s*:/g,
		exactMatches: {
			'media/blockly/blocks/arduino.js': 2,
			'media/blockly/blocks/functions.js': 4,
			'media/blockly/blocks/motors.js': 16,
		},
	},
};

function collectJavaScriptFiles(directory: string): string[] {
	return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
		const entryPath = path.join(directory, entry.name);
		if (entry.isDirectory()) {
			return collectJavaScriptFiles(entryPath);
		}
		return entry.isFile() && entry.name.endsWith('.js') ? [entryPath] : [];
	});
}

suite('Blockly 13 Compatibility Contract', () => {
	for (const [ruleName, rule] of Object.entries(RULES)) {
		test(`${ruleName} 必須為零`, () => {
			const matches: string[] = [];
			for (const filePath of collectJavaScriptFiles(MEDIA_ROOT)) {
				const relativePath = path.relative(PROJECT_ROOT, filePath).replace(/\\/g, '/');
				const source = fs.readFileSync(filePath, 'utf8');
				const count = (source.match(rule.pattern) || []).length;
				if (count > 0) {
					matches.push(`${relativePath}: ${count}`);
				}
			}
			assert.deepStrictEqual(matches, [], `${ruleName} detected forbidden Blockly integration:\n${matches.join('\n')}`);
		});
	}

	for (const [ruleName, rule] of Object.entries(APPROVED_LEGACY_INTEGRATIONS)) {
		test(`${ruleName} 僅允許契約核准位置`, () => {
			const actualMatches: Record<string, number> = {};
			for (const filePath of collectJavaScriptFiles(MEDIA_ROOT)) {
				const relativePath = path.relative(PROJECT_ROOT, filePath).replace(/\\/g, '/');
				const source = fs.readFileSync(filePath, 'utf8');
				const count = (source.match(rule.pattern) || []).length;
				if (count > 0) {
					actualMatches[relativePath] = count;
				}
			}
			assert.deepStrictEqual(actualMatches, rule.exactMatches);
		});
	}

	test('runtime 應建立唯一 app-owned workspace accessor', () => {
		const source = fs.readFileSync(path.join(MEDIA_ROOT, 'js', 'blocklyRuntime.js'), 'utf8');
		assert.match(source, /window\.getBlocklyWorkspace = getWorkspace/);
		assert.match(source, /canonicalWorkspace = Blockly\.inject/);
		assert.match(source, /canonicalWorkspace = null;[\s\S]*workspace\.dispose\(\)/);
		assert.doesNotMatch(source, /Blockly\.getMainWorkspace\(/);
	});
});
