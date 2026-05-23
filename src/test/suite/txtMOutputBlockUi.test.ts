/**
 * @license
 * Copyright 2026 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';

function readTxtBlockSource(): string {
	return fs.readFileSync(
		path.join(__dirname, '..', '..', '..', 'media', 'blockly', 'blocks', 'txt.js'),
		'utf8'
	);
}

function extractBlockDefinition(source: string, blockType: string): string {
	const start = source.indexOf(`Blockly.Blocks['${blockType}']`);
	assert.ok(start >= 0, `應定義 ${blockType} block`);

	const nextBlock = source.indexOf("Blockly.Blocks['", start + 1);
	return nextBlock >= 0 ? source.slice(start, nextBlock) : source.slice(start);
}

suite('TXT M Output Block UI Tests', () => {
	test('txt_motor_speed 應提供 COMPONENT dropdown 並預設 MOTOR', () => {
		const source = extractBlockDefinition(readTxtBlockSource(), 'txt_motor_speed');

		assert.match(source, /new Blockly\.FieldDropdown\([^\n]+component/i, '應以 metadata 建立 component dropdown options');
		assert.match(source, /['"]COMPONENT['"]/, '應序列化 COMPONENT field');
		assert.match(source, /COMPONENT_KEYS\.MOTOR|['"]MOTOR['"]/, 'COMPONENT 預設應為 MOTOR');
	});

	test('txt_motor_speed dynamic shape 應由 metadata 控制方向欄位與亮度欄位', () => {
		const fullSource = readTxtBlockSource();
		const source = `${extractBlockDefinition(fullSource, 'txt_motor_speed')}\n${fullSource}`;

		assert.match(source, /updateShape_\s*:\s*function|updateTxtMOutputShape/i, '應提供 dynamic shape update helper');
		assert.match(source, /requiresDirection/, '方向欄位顯示應消費 component metadata');
		assert.match(source, /removeInput\(['"]DIRECTION_ROW['"]|removeInput\(['"]DIRECTION['"]/, 'LAMP 模式應能移除方向欄位');
		assert.match(source, /['"]TXT_LAMP_BRIGHTNESS['"]/, 'LAMP 模式應使用亮度文字 key');
		assert.match(source, /targetConnection|reconnect/i, '切換 shape 時應保留 SPEED input connection');
	});

	test('txt_motor_speed dynamic shape 應為 SPEED 放入預設數字 shadow 且可替換為數值輸出積木', () => {
		const fullSource = readTxtBlockSource();
		const source = `${extractBlockDefinition(fullSource, 'txt_motor_speed')}\n${fullSource}`;

		assert.match(source, /TXT_M_OUTPUT_DEFAULT_VALUE\s*=\s*512/, '預設數字應為 512');
		assert.match(source, /setTxtMOutputDefaultNumberShadow\(valueInput, shadowValue\)/, '重建 SPEED input 時應補上預設數字 shadow');
		assert.match(source, /setShadowDom\(createTxtMOutputDefaultNumberShadow\(value\)\)/, '應透過 Blockly shadow DOM 顯示預設數字積木');
		assert.match(source, /math_number/, '預設 shadow 應使用 math_number');
		assert.match(source, /field name=["']NUM["']/, '預設 shadow 應設定 NUM 欄位');
		assert.match(source, /\.setCheck\(['"]Number['"]\)/, 'SPEED 仍應是 Number value input，可接受數字或數值型輸出積木');
	});

	test('txt_motor_speed 重建 SPEED input 時不得把 toolbox shadow 當成真實積木重接', () => {
		const fullSource = readTxtBlockSource();
		const source = `${extractBlockDefinition(fullSource, 'txt_motor_speed')}\n${fullSource}`;

		assert.match(source, /targetBlock\s*=\s*speedInput\?\.connection\?\.targetBlock\?\.\(\)/, '應先取得目前 target block');
		assert.match(source, /targetBlock\s*&&\s*!targetBlock\.isShadow\(\)\s*\?\s*targetBlock\.outputConnection/, '只應保留非 shadow 的真實數值積木連線');
		assert.match(source, /targetBlock\s*&&\s*targetBlock\.isShadow\(\)\s*\?\s*getTxtMOutputShadowValue\(targetBlock\)/, 'shadow 數字應保留數值後重建，不應重接已移除的 shadow connection');
	});

	test('txt_motor_speed toolbox/flyout 中不得排程延遲重建 dynamic shape', () => {
		const source = extractBlockDefinition(readTxtBlockSource(), 'txt_motor_speed');

		assert.match(source, /sourceBlock\?\.workspace\?\.isFlyout/, 'dropdown validator 應辨識 toolbox/flyout block');
		assert.match(source, /if \(sourceBlock\?\.workspace\?\.isFlyout\) \{\s*return normalizedComponent;\s*\}/s, 'flyout block 應直接回傳 component，不應排程 setTimeout 重建');
	});

	test('legacy txt_motor_speed 缺少 COMPONENT 時應以 MOTOR 載入', () => {
		const fullSource = readTxtBlockSource();
		const source = `${extractBlockDefinition(fullSource, 'txt_motor_speed')}\n${fullSource}`;

		assert.match(source, /normalizeTxtMOutputComponent|normalizeComponent/, 'block load-time shape update 應透過 normalizeComponent fallback');
		assert.match(source, /FINISHED_LOADING|BLOCK_CHANGE/, '載入或 field 變更時應更新 dynamic shape');
	});

	test('txt_motor_stop 應使用通用停止輸出文案且不得新增 COMPONENT field', () => {
		const source = extractBlockDefinition(readTxtBlockSource(), 'txt_motor_stop');

		assert.match(source, /TXT_M_OUTPUT_STOP|停止輸出/, '停止積木應使用通用「停止輸出」語意');
		assert.doesNotMatch(source, /['"]COMPONENT['"]/, '停止積木不得有 COMPONENT field');
	});
});