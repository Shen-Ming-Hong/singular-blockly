/**
 * @license
 * Copyright 2025 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';
import * as sinon from 'sinon';
import { WebViewMessageHandler } from '../../webview/messageHandler';
import { LocaleService } from '../../services/localeService';
import { FileService } from '../../services/fileService';
import { SettingsManager } from '../../services/settingsManager';
import {
	TxtVirtualControlsDocument,
	buildTxtVirtualControlsRuntimeFile,
} from '../../types/txtVirtualControls';

suite('TXT Virtual Controls Identity Tests', () => {
	const PROJECT_ROOT = path.join(__dirname, '..', '..', '..');
	const BLOCKLY_EDIT_SOURCE_PATH = path.join(PROJECT_ROOT, 'media', 'js', 'blocklyEdit.js');

	function stripComments(source: string): string {
		return source
			.replace(/\/\*[\s\S]*?\*\//g, '')
			.replace(/^\s*\/\/.*$/gm, '');
	}

	function createMessageHandler(): WebViewMessageHandler {
		const panelMock = {
			webview: {
				postMessage: sinon.stub().resolves(),
			},
			reveal: sinon.stub(),
		};
		const localeServiceStub = sinon.createStubInstance(LocaleService);
		const fileServiceStub = sinon.createStubInstance(FileService);
		const settingsManagerStub = sinon.createStubInstance(SettingsManager);

		return new WebViewMessageHandler(
			{ extensionPath: '/mock/extension' } as any,
			panelMock as any,
			localeServiceStub as any,
			fileServiceStub as any,
			settingsManagerStub as any
		);
	}

	test('identifier builder contract should normalize unsafe names and resolve collisions', () => {
		const strippedSource = stripComments(fs.readFileSync(BLOCKLY_EDIT_SOURCE_PATH, 'utf8'));

		assert.ok(
			strippedSource.includes("function buildTxtVirtualControlIdentifier(displayName, stableId)"),
			'WebView should keep a dedicated identifier builder for TXT virtual controls'
		);
		assert.ok(strippedSource.includes(".normalize('NFKD')"), 'identifier builder should normalize unicode input');
		assert.ok(
			strippedSource.includes(".replace(/[\\u0300-\\u036f]/g, '')"),
			'identifier builder should strip combining marks after unicode normalization'
		);
		assert.ok(strippedSource.includes('.toLowerCase()'), 'identifier builder should lowercase display names');
		assert.ok(
			strippedSource.includes(".replace(/[^a-z0-9_]+/g, '_')"),
			'identifier builder should replace non identifier characters with underscores'
		);
		assert.ok(
			strippedSource.includes(".replace(/^_+|_+$/g, '')"),
			'identifier builder should trim leading and trailing underscores'
		);
		assert.ok(
			strippedSource.includes("if (/^[0-9]/.test(baseIdentifier))"),
			'identifier builder should guard against identifiers starting with digits'
		);
		assert.ok(
			strippedSource.includes('TXT_VIRTUAL_CONTROL_RESERVED_IDENTIFIERS.has(baseIdentifier)'),
			'identifier builder should avoid reserved names'
		);
		assert.ok(
			strippedSource.includes('filter(control => control.stableId !== stableId)'),
			'collision handling should ignore the currently edited control when renaming'
		);
		assert.ok(
			strippedSource.includes('while (existingIdentifiers.has(identifier))'),
			'identifier builder should suffix duplicate identifiers until a unique value is found'
		);
	});

	test('rename refresh contract should stay bound to stableId and rerender the dropdown text', () => {
		const strippedSource = stripComments(fs.readFileSync(BLOCKLY_EDIT_SOURCE_PATH, 'utf8'));

		assert.ok(
			strippedSource.includes(
				"const stableId = block.getFieldValue('BUTTON_ID') === '__none__' ? '' : block.getFieldValue('BUTTON_ID');"
			),
			'the TXT virtual button field should resolve references from the saved stableId value'
		);
		assert.ok(
			strippedSource.includes('const referencedControl = stableId ? getTxtVirtualControlByStableId(stableId) : null;'),
			'rename refresh should resolve the current control from stableId, not displayName'
		);
		assert.ok(
			strippedSource.includes('displayNameSnapshot: referencedControl.displayName'),
			'valid references should refresh the display-name snapshot after rename'
		);
		assert.ok(
			strippedSource.includes('identifierSnapshot: referencedControl.identifier'),
			'valid references should refresh the identifier snapshot after rename'
		);
		assert.ok(
			strippedSource.includes('field.doValueUpdate_(stableId);'),
			'the dropdown field should refresh its internal value from the stableId when labels change'
		);
		assert.ok(
			strippedSource.includes('field.forceRerender();'),
			'the dropdown field should force a rerender so the block label updates immediately after rename'
		);
	});

	test('runtime state file should remain keyed by stableId even if display names are student-facing', () => {
		const document: TxtVirtualControlsDocument = {
			schemaVersion: 1,
			canvas: { mode: 'editing' },
			controls: [
				{
					stableId: 'btn-stable-1',
					displayName: '左邊按鈕',
					identifier: 'left_button',
					kind: 'button',
					position: { x: 20, y: 24 },
					size: { width: 120, height: 48 },
					style: { backgroundColor: '#0288d1', textColor: '#ffffff' },
				},
			],
		};

		const runtimeFile = buildTxtVirtualControlsRuntimeFile('session-1', document.controls, {
			'btn-stable-1': true,
		});

		assert.deepStrictEqual(Object.keys(runtimeFile.controls), ['btn-stable-1']);
		assert.strictEqual(runtimeFile.controls['btn-stable-1'].identifier, 'left_button');
		assert.strictEqual(runtimeFile.controls['btn-stable-1'].pressed, true);
	});

	test('host preflight should preserve missing-control diagnostics for stableId based references', () => {
		const handler = createMessageHandler();
		const document: TxtVirtualControlsDocument = {
			schemaVersion: 1,
			canvas: { mode: 'editing' },
			controls: [
				{
					stableId: 'btn-existing',
					displayName: '開始',
					identifier: 'start',
					kind: 'button',
					position: { x: 24, y: 32 },
					size: { width: 120, height: 48 },
					style: { backgroundColor: '#0288d1', textColor: '#ffffff' },
				},
			],
		};

		const preflight = (handler as any).buildTxtVirtualControlPreflight(
			{
				code: "value = _txt_virtual_button_state('btn-missing')",
				virtualControlPreflight: {
					valid: true,
					invalidReferences: [
						{
							blockId: '',
							stableId: 'btn-missing',
							lastKnownDisplayName: '舊按鈕名稱',
							reason: 'missing-control',
						},
					],
				},
			},
			document
		) as {
			valid: boolean;
			invalidReferences: Array<{
				blockId: string;
				stableId: string;
				lastKnownDisplayName?: string;
				reason: 'missing-control';
			}>;
		};

		assert.strictEqual(preflight.valid, false);
		assert.deepStrictEqual(preflight.invalidReferences, [
			{
				blockId: '',
				stableId: 'btn-missing',
				lastKnownDisplayName: '舊按鈕名稱',
				reason: 'missing-control',
			},
		]);
	});
});
