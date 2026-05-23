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
	normalizeTxtVirtualControlsDocument,
	normalizeTxtVirtualControlsForSave,
} from '../../types/txtVirtualControls';

suite('TXT Virtual Controls Persistence Tests', () => {
	function createMessageHandlerHarness() {
		const webviewPostMessage = sinon.stub().resolves();
		const panelMock = {
			webview: {
				postMessage: webviewPostMessage,
			},
			reveal: sinon.stub(),
		};
		const localeServiceStub = sinon.createStubInstance(LocaleService);
		const fileServiceStub = sinon.createStubInstance(FileService);
		const settingsManagerStub = sinon.createStubInstance(SettingsManager);

		settingsManagerStub.getTheme.resolves('dark');
		settingsManagerStub.getLanguage.resolves('auto');
		settingsManagerStub.resolveLanguage.returns('en');
		settingsManagerStub.readSetting.resolves('__unset__');
		settingsManagerStub.getAutoBackupInterval.resolves(5);

		const handler = new WebViewMessageHandler(
			{ extensionPath: '/mock/extension' } as any,
			panelMock as any,
			localeServiceStub as any,
			fileServiceStub as any,
			settingsManagerStub as any
		);

		return {
			handler,
			webviewPostMessage,
			fileServiceStub,
			settingsManagerStub,
		};
	}

	test('normalizeTxtVirtualControlsDocument should recover malformed persisted data and fallback to schema version 1', () => {
		const normalizedDocument = normalizeTxtVirtualControlsDocument({
			schemaVersion: 99,
			canvas: {
				mode: 'running',
				lastViewport: {
					scrollX: 'oops',
					scrollY: 12,
					zoom: 'oops',
				},
			},
			controls: [
				null,
				{ displayName: 'missing stable id' },
				{
					stableId: 'btn-keep',
					displayName: 123,
					identifier: '',
					position: { x: 'oops', y: 48 },
					size: { width: 20, height: 10 },
					style: { backgroundColor: 42, textColor: null },
				},
			],
		});

		assert.deepStrictEqual(normalizedDocument, {
			schemaVersion: 1,
			canvas: {
				mode: 'running',
				lastViewport: {
					scrollX: 0,
					scrollY: 12,
					zoom: 1,
				},
			},
			controls: [
				{
					stableId: 'btn-keep',
					displayName: 'btn-keep',
					identifier: 'btn-keep',
					kind: 'button',
					position: { x: 24, y: 48 },
					size: { width: 72, height: 40 },
					style: { backgroundColor: '#005a9e', textColor: '#ffffff' },
				},
			],
		});
	});

	test('normalizeTxtVirtualControlsForSave should force editing mode while preserving recoverable controls', () => {
		const normalizedDocument = normalizeTxtVirtualControlsForSave({
			schemaVersion: 1,
			canvas: { mode: 'running' },
			controls: [
				{
					stableId: 'btn-1',
					displayName: '開始',
					identifier: 'start',
					kind: 'button',
					position: { x: 32, y: 44 },
					size: { width: 120, height: 48 },
					style: { backgroundColor: '#ff8f00', textColor: '#ffffff' },
				},
			],
		});

		assert.strictEqual(normalizedDocument.schemaVersion, 1);
		assert.strictEqual(normalizedDocument.canvas.mode, 'editing');
		assert.deepStrictEqual(normalizedDocument.controls, [
			{
				stableId: 'btn-1',
				displayName: '開始',
				identifier: 'start',
				kind: 'button',
				position: { x: 32, y: 44 },
				size: { width: 120, height: 48 },
				style: { backgroundColor: '#ff8f00', textColor: '#ffffff' },
			},
		]);
	});

	test('normalizeTxtVirtualControlsForSave should preserve theme color records without obsolete warning metadata', () => {
		const normalizedDocument = normalizeTxtVirtualControlsForSave({
			schemaVersion: 1,
			canvas: { mode: 'editing' },
			controls: [
				{
					stableId: 'btn-theme-style',
					displayName: 'Theme Style',
					identifier: 'theme_style',
					kind: 'button',
					position: { x: 10, y: 20 },
					size: { width: 120, height: 48 },
					style: {
						backgroundColor: '#f57c00',
						textColor: '#1f1f1f',
						themeStyles: {
							light: { backgroundColor: '#f57c00', textColor: '#1f1f1f', customized: true },
							dark: { backgroundColor: '#ffca28', textColor: '#1f1f1f', customized: true },
						},
					},
					obsoleteUiWarning: {
						code: 'obsolete-warning',
						reason: 'transient-ui-state',
					},
					previewWarnings: [{ code: 'obsolete-warning' }],
				},
			],
		} as any);

		assert.deepStrictEqual(normalizedDocument.controls[0], {
			stableId: 'btn-theme-style',
			displayName: 'Theme Style',
			identifier: 'theme_style',
			kind: 'button',
			position: { x: 10, y: 20 },
			size: { width: 120, height: 48 },
			style: {
				backgroundColor: '#f57c00',
				textColor: '#1f1f1f',
				themeStyles: {
					light: { backgroundColor: '#f57c00', textColor: '#1f1f1f', customized: true },
					dark: { backgroundColor: '#ffca28', textColor: '#1f1f1f', customized: true },
				},
			},
		});
		assert.strictEqual('obsoleteUiWarning' in normalizedDocument.controls[0], false);
		assert.strictEqual('previewWarnings' in normalizedDocument.controls[0], false);
	});

	test('blocklyEdit should not write theme effective styles back during render', () => {
		const source = fs.readFileSync(path.join(process.cwd(), 'media/js/blocklyEdit.js'), 'utf8');

		assert.ok(
			source.includes('function getTxtVirtualControlEffectiveStyleForControl'),
			'edit renderer should resolve effective styles with a read-only helper'
		);
		assert.ok(
			!source.includes('function syncTxtVirtualControlStyleToTheme'),
			'edit renderer should not expose a sync helper that mutates persisted style fields'
		);
		assert.ok(
			!source.includes('control.style.backgroundColor = effectiveStyle.backgroundColor'),
			'theme rendering must not rewrite persisted backgroundColor'
		);
		assert.ok(
			!source.includes('control.style.textColor = effectiveStyle.textColor'),
			'theme rendering must not rewrite persisted textColor'
		);
	});

	test('requestInitialState should recover malformed txtVirtualControls and send a normalized init payload', async () => {
		const { handler, webviewPostMessage, fileServiceStub } = createMessageHandlerHarness();
		const mainJsonPath = path.join('blockly', 'main.json');
		const savedState = {
			workspace: { blocks: [] },
			board: 'txt',
			txtVirtualControls: {
				schemaVersion: 7,
				canvas: {
					mode: 'running',
					lastViewport: {
						scrollX: 'bad',
						scrollY: 18,
						zoom: 'bad',
					},
				},
				controls: [
					{
						stableId: 'btn-restore',
						displayName: '',
						identifier: '',
						position: { x: 'bad', y: 60 },
						size: { width: 10, height: 20 },
						style: { backgroundColor: 1, textColor: null },
					},
					{
						displayName: 'missing stable id',
					},
				],
			},
		};

		fileServiceStub.fileExists.callsFake((filePath: string) => filePath === mainJsonPath);
		fileServiceStub.readJsonFile.resolves(savedState as any);

		await handler.handleMessage({ command: 'requestInitialState' });

		const initCall = webviewPostMessage
			.getCalls()
			.find((call: any) => call.args[0].command === 'init');
		assert.ok(initCall, 'requestInitialState should post an init payload to the WebView');

		const initPayload = initCall.args[0] as {
			board: string;
			workspace: unknown;
			txtVirtualControls: TxtVirtualControlsDocument;
		};
		assert.strictEqual(initPayload.board, 'txt');
		assert.deepStrictEqual(initPayload.workspace, { blocks: [] });
		assert.deepStrictEqual(initPayload.txtVirtualControls, {
			schemaVersion: 1,
			canvas: {
				mode: 'editing',
				lastViewport: {
					scrollX: 0,
					scrollY: 18,
					zoom: 1,
				},
			},
			controls: [
				{
					stableId: 'btn-restore',
					displayName: 'btn-restore',
					identifier: 'btn-restore',
					kind: 'button',
					position: { x: 24, y: 60 },
					size: { width: 72, height: 40 },
					style: { backgroundColor: '#005a9e', textColor: '#ffffff' },
				},
			],
		});
	});
});
