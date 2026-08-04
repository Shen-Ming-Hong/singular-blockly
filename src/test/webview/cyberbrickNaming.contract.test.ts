import assert = require('assert');
import { describe, it } from 'mocha';
import { assertContainsAll, readWorkspaceFile } from './cyberbrickUploadTestUtils';

const htmlPath = 'media/html/blocklyEdit.html';
const functionsPath = 'media/blockly/blocks/functions.js';
const editorPath = 'media/js/blocklyEdit.js';

describe('CyberBrick naming WebView contract', () => {
	it('loads the pure helper before function blocks', () => {
		const html = readWorkspaceFile(htmlPath);
		const helperIndex = html.indexOf('{cyberbrickNameValidationUri}');
		const functionsIndex = html.indexOf('{functionBlocksUri}');
		assert(helperIndex >= 0, 'name validation helper placeholder should exist');
		assert(functionsIndex >= 0, 'function blocks placeholder should exist');
		assert(helperIndex < functionsIndex, 'name validation helper must load before function blocks');
	});

	it('attaches CyberBrick-only FieldTextInput validators with a dedicated warning id', () => {
		const source = readWorkspaceFile(functionsPath);
		assertContainsAll(
			source,
			[
				"const CYBERBRICK_NAMING_WARNING_ID = 'cyberbrick-naming'",
				'createCyberBrickNameFieldValidator',
				"window.getCurrentBoard() !== 'cyberbrick'",
				"createCyberBrickNameFieldValidator('function')",
				"createCyberBrickNameFieldValidator('parameter')",
				'api.isHydrating()',
				'return newValue',
				"result.severity === 'error'",
				'return null',
				'result.normalizedName',
				'setWarningText(message, CYBERBRICK_NAMING_WARNING_ID)',
			],
			'CyberBrick inline name validators'
		);
	});

	it('wraps every workspace deserialization path in the shared try/finally hydration scope', () => {
		const source = readWorkspaceFile(editorPath);
		const loadCalls = source.match(/Blockly\.serialization\.workspaces\.load\(/g) || [];
		const scopedCalls = source.match(/withCyberBrickNameHydrationScope\(\(\) =>/g) || [];
		assert.strictEqual(loadCalls.length, 3, 'contract assumes the three current workspace load paths');
		assert.strictEqual(scopedCalls.length, loadCalls.length, 'every load path must enter the shared hydration scope');
		assertContainsAll(
			source,
			['function withCyberBrickNameHydrationScope', 'try {', 'finally {', 'api.beginHydration()', 'api.endHydration()', 'refreshCyberBrickNamingIssues()'],
			'workspace hydration scope'
		);
	});

	it('keeps serialized names unchanged and blocks only CyberBrick upload errors at preflight', () => {
		const source = readWorkspaceFile(editorPath);
		assertContainsAll(
			source,
			[
				'CYBERBRICK_NAMING_WARNING_ID',
				'collectWorkspaceIssues',
				'applyCyberBrickNamingIssues',
				'clearCyberBrickNamingWarnings',
				'runCyberBrickNamingUploadPreflight',
				"getCurrentBoardId() !== 'cyberbrick'",
				"CYBERBRICK_NAME_UPLOAD_BLOCKED",
				'workspace.centerOnBlock',
			],
			'CyberBrick naming issue refresh and upload preflight'
		);
		assert(!source.includes('renameInvalidCyberBrick'), 'legacy names must never be auto-renamed');
	});
});
