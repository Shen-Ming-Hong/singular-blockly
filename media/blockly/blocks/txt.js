/**
 * @license
 * Copyright 2025 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 *
 * TXT Controller 專用積木定義
 */

'use strict';

/** TXT Controller 積木色相 (200 = 青藍色) */
const TXT_COLOR = 200;

// === 頂層容器積木 ===

/**
 * TXT 初始化積木 — 頂層初始化容器
 * 負責建立 shared ftrobopy 連線與一次性初始化程式碼
 */
Blockly.Blocks['txt_setup'] = {
	init: function () {
		this.appendStatementInput('DO')
			.setCheck(null)
			.appendField(window.languageManager.getMessage('TXT_SETUP', 'TXT Setup'));
		this.setStyle('procedure_blocks');
		this.setTooltip(
			window.languageManager.getMessage(
				'TXT_SETUP_TOOLTIP',
				'Initialize the TXT Controller once and prepare shared hardware resources for all TXT processes.'
			)
		);
		this.setHelpUrl('');
		this.setMovable(true);
	},
};

/**
 * TXT 流程積木 — 頂層流程容器
 * 可選名稱欄位僅供顯示與診斷用途
 */
Blockly.Blocks['txt_process'] = {
	init: function () {
		this.appendDummyInput()
			.appendField(window.languageManager.getMessage('TXT_PROCESS_PREFIX', 'TXT Process:'))
			.appendField(new Blockly.FieldTextInput(''), 'NAME');
		this.appendStatementInput('DO').setCheck(null);
		this.setStyle('procedure_blocks');
		this.setTooltip(
			window.languageManager.getMessage(
				'TXT_PROCESS_TOOLTIP',
				'Define one TXT process. The name is optional and only used for display or diagnostics.'
			)
		);
		this.setHelpUrl('');
		this.setMovable(true);
	},
};

// === 馬達積木 ===

/**
 * 設定馬達速度
 */
Blockly.Blocks['txt_motor_speed'] = {
	init: function () {
		this.appendDummyInput()
			.appendField(window.languageManager.getMessage('TXT_MOTOR_SPEED', '馬達'))
			.appendField(
				new Blockly.FieldDropdown([
					['M1', '1'],
					['M2', '2'],
					['M3', '3'],
					['M4', '4'],
				]),
				'MOTOR'
			)
			.appendField(
				new Blockly.FieldDropdown([
					[window.languageManager.getMessage('TXT_DIRECTION_FORWARD', '正轉'), 'FORWARD'],
					[window.languageManager.getMessage('TXT_DIRECTION_BACKWARD', '反轉'), 'BACKWARD'],
				]),
				'DIRECTION'
			)
			.appendField(window.languageManager.getMessage('TXT_MOTOR_SPEED_SET', '設定速度'));
		this.appendValueInput('SPEED').setCheck('Number');
		this.setInputsInline(true);
		this.setPreviousStatement(true, null);
		this.setNextStatement(true, null);
		this.setColour(TXT_COLOR);
		this.setTooltip(window.languageManager.getMessage('TXT_MOTOR_SPEED_TOOLTIP', '設定指定馬達的速度 (0~512) 與方向'));
		this.setHelpUrl('');
	},
};

/**
 * 停止馬達
 */
Blockly.Blocks['txt_motor_stop'] = {
	init: function () {
		this.appendDummyInput()
			.appendField(window.languageManager.getMessage('TXT_MOTOR_STOP', '停止馬達'))
			.appendField(
				new Blockly.FieldDropdown([
					['M1', '1'],
					['M2', '2'],
					['M3', '3'],
					['M4', '4'],
				]),
				'MOTOR'
			);
		this.setPreviousStatement(true, null);
		this.setNextStatement(true, null);
		this.setColour(TXT_COLOR);
		this.setTooltip(window.languageManager.getMessage('TXT_MOTOR_STOP_TOOLTIP', '停止指定馬達（速度設為 0）'));
		this.setHelpUrl('');
	},
};

// === 輸出積木 ===

/**
 * 設定數位輸出
 */
Blockly.Blocks['txt_output'] = {
	init: function () {
		this.appendDummyInput()
			.appendField(window.languageManager.getMessage('TXT_OUTPUT', '輸出'))
			.appendField(
				new Blockly.FieldDropdown([
					['O1', '1'],
					['O2', '2'],
					['O3', '3'],
					['O4', '4'],
					['O5', '5'],
					['O6', '6'],
					['O7', '7'],
					['O8', '8'],
				]),
				'OUTPUT'
			)
			.appendField(window.languageManager.getMessage('TXT_OUTPUT_SET', '設為'))
			.appendField(
				new Blockly.FieldDropdown([
					[window.languageManager.getMessage('TXT_STATE_ON', '開'), 'ON'],
					[window.languageManager.getMessage('TXT_STATE_OFF', '關'), 'OFF'],
				]),
				'STATE'
			);
		this.setPreviousStatement(true, null);
		this.setNextStatement(true, null);
		this.setColour(TXT_COLOR);
		this.setTooltip(window.languageManager.getMessage('TXT_OUTPUT_TOOLTIP', '設定數位輸出腳位 O1~O8 的狀態'));
		this.setHelpUrl('');
	},
};

// === 輸入積木 ===

/**
 * 感測器輸入積木 — 支援按鈕、光柵、超音波
 * 下拉選感測器類型；生成 Python 程式碼時自動處理 setConfig 差異
 */
Blockly.Blocks['txt_input_sensor'] = {
	init: function () {
		this.appendDummyInput()
			.appendField(window.languageManager.getMessage('TXT_INPUT_SENSOR_PREFIX', '讀取'))
			.appendField(
				new Blockly.FieldDropdown([
					[window.languageManager.getMessage('TXT_SENSOR_BUTTON', '按鈕'), 'BUTTON'],
					[window.languageManager.getMessage('TXT_SENSOR_GATE', '光柵'), 'GATE'],
					[window.languageManager.getMessage('TXT_SENSOR_ULTRASONIC', '超音波'), 'ULTRASONIC'],
				]),
				'SENSOR_TYPE'
			)
			.appendField(
				new Blockly.FieldDropdown([
					['I1', '1'],
					['I2', '2'],
					['I3', '3'],
					['I4', '4'],
					['I5', '5'],
					['I6', '6'],
					['I7', '7'],
					['I8', '8'],
				]),
				'INPUT'
			);
		this.setOutput(true, 'Number');
		this.setColour(TXT_COLOR);
		this.setTooltip(window.languageManager.getMessage('TXT_INPUT_SENSOR_TOOLTIP', '選擇感測器類型並讀取輸入值（按鈕/光柵回傳 0 或 1，超音波回傳距離 cm）'));
		this.setHelpUrl('');
	},
};

// === 延遲積木 ===

/**
 * 延遲等待
 */
Blockly.Blocks['txt_wait'] = {
	init: function () {
		this.appendDummyInput()
			.appendField(window.languageManager.getMessage('TXT_WAIT', '等待'));
		this.appendValueInput('MS').setCheck('Number');
		this.appendDummyInput().appendField(window.languageManager.getMessage('TXT_WAIT_UNIT', '毫秒'));
		this.setInputsInline(true);
		this.setPreviousStatement(true, null);
		this.setNextStatement(true, null);
		this.setColour(TXT_COLOR);
		this.setTooltip(window.languageManager.getMessage('TXT_WAIT_TOOLTIP', '等待指定的毫秒數'));
		this.setHelpUrl('');
	},
};

// === 全部停止積木 ===

/**
 * 停止所有馬達與輸出
 */
Blockly.Blocks['txt_stop_all'] = {
	init: function () {
		this.appendDummyInput().appendField(window.languageManager.getMessage('TXT_STOP_ALL', '停止所有馬達與輸出'));
		this.setPreviousStatement(true, null);
		this.setNextStatement(true, null);
		this.setColour(TXT_COLOR);
		this.setTooltip(window.languageManager.getMessage('TXT_STOP_ALL_TOOLTIP', '停止 TXT Controller 上所有馬達與數位輸出'));
		this.setHelpUrl('');
	},
};

// ============================================================
// 孤立積木保護 — 所有 TXT 積木
// ============================================================

/**
 * TXT 孤立積木警告回呼
 * 積木移動或建立時檢查是否在 TXT 合法容器或函式容器內
 */
function txtOrphanOnchange(e) {
	if (!this.workspace || this.workspace.isFlyout) { return; }
	if (e && e.type !== Blockly.Events.BLOCK_MOVE &&
		e.type !== Blockly.Events.BLOCK_CREATE &&
		e.type !== Blockly.Events.FINISHED_LOADING) { return; }

	const isInContext = window.isInAllowedContext(this);
	if (isInContext) {
		this.setWarningText(null);
	} else {
		this.setWarningText(
			window.languageManager.getMessage('TXT_ORPHAN_WARNING_MULTI') ||
			'This block must be placed inside a "TXT Setup" or "TXT Process" block'
		);
	}
}

// 為所有 TXT statement 積木加入孤立警告
['txt_motor_speed', 'txt_motor_stop', 'txt_output', 'txt_wait', 'txt_stop_all'].forEach(function (blockType) {
	if (Blockly.Blocks[blockType]) {
		Blockly.Blocks[blockType].onchange = txtOrphanOnchange;
	}
});

// value blocks（有輸出）也加入孤立警告
['txt_input_sensor'].forEach(function (blockType) {
	if (Blockly.Blocks[blockType]) {
		Blockly.Blocks[blockType].onchange = txtOrphanOnchange;
	}
});
