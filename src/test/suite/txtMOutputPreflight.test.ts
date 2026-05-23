/**
 * @license
 * Copyright 2026 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';
import { txtMOutputBlock, txtOutputBlock, txtProcessBlock, txtSetupBlock, txtWorkspace } from '../helpers/txtWorkspaceBuilder';

type TxtMOutputValidationApi = {
	buildPreflightSummary(source: unknown): {
		conflicts: Array<{ kind: string; mPort: string; relatedOPorts: string[]; blockIds: string[] }>;
		warnings: string[];
		canUpload: boolean;
		canExport: boolean;
	};
};

const validation = require(path.join(
	__dirname,
	'..',
	'..',
	'..',
	'media',
	'js',
	'txtMOutputValidation.js'
)) as TxtMOutputValidationApi;

suite('TXT M Output Preflight Tests', () => {
	test('preflight summary 應同時阻擋上傳／執行與匯出／程式碼輸出入口', () => {
		const workspace = txtWorkspace([
			txtSetupBlock(),
			txtProcessBlock([
				txtMOutputBlock({ id: 'm1-output', port: 'M1', component: 'MOTOR' }),
				txtOutputBlock({ id: 'o1-output', port: 'O1' }),
			]),
		]);

		const summary = validation.buildPreflightSummary(workspace);

		assert.strictEqual(summary.canUpload, false);
		assert.strictEqual(summary.canExport, false);
		assert.strictEqual(summary.conflicts.length, 1);
		assert.strictEqual(summary.conflicts[0].kind, 'M_O_SHARED_PIN_CONFLICT');
		assert.deepStrictEqual(summary.conflicts[0].blockIds.sort(), ['m1-output', 'o1-output']);
		assert.ok(summary.warnings[0].includes('M1'));
		assert.ok(summary.warnings[0].includes('O1'));
	});

	test('blocklyEdit.js 應在送出 TXT upload/updateCode 前使用 M output validation', () => {
		const blocklyEditSource = fs.readFileSync(path.join(__dirname, '..', '..', '..', 'media', 'js', 'blocklyEdit.js'), 'utf8');

		assert.match(blocklyEditSource, /txtMOutputValidation/, 'WebView 應使用 TXT M output validation helper');
		assert.match(blocklyEditSource, /validateTxtMOutputPreflight|buildTxtMOutputPreflightSummary/, 'WebView 應建立 preflight summary');
		assert.match(blocklyEditSource, /command:\s*['"]txtUpload['"][\s\S]*mOutputValidation|mOutputValidation[\s\S]*command:\s*['"]txtUpload['"]/, 'txtUpload message 應包含 validation summary');
		assert.match(blocklyEditSource, /canExport|canGenerate/, '程式碼輸出入口應檢查 canExport/canGenerate');
	});

	test('messageHandler.ts 應拒絕標示 blocking conflicts 的 TXT upload message', () => {
		const messageHandlerSource = fs.readFileSync(path.join(__dirname, '..', '..', '..', 'src', 'webview', 'messageHandler.ts'), 'utf8');

		assert.match(messageHandlerSource, /mOutputValidation/, 'TXT upload message handler 應讀取 mOutputValidation summary');
		assert.match(messageHandlerSource, /canUpload\s*===\s*false|!.*canUpload/, 'blocking summary 應拒絕 upload');
		assert.match(messageHandlerSource, /TXT_M_OUTPUT_UPLOAD_BLOCKED|M output/, '拒絕時應提供 M output conflict 訊息');
	});
});