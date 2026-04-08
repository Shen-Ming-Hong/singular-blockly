/**
 * @license
 * Copyright 2025 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 *
 * FootBot 擴展積木定義
 */

'use strict';

// === 足球車：馬達移動 ===
Blockly.Blocks['singular_footbot_motor_move'] = {
	init: function () {
		this.appendDummyInput().appendField(window.languageManager.getMessage('FOOTBOT_MOTOR_MOVE', '馬達移動'));
		this.appendValueInput('LEFT')
			.setCheck('Number')
			.appendField(window.languageManager.getMessage('FOOTBOT_LEFT_SPEED', '左輪速度(%)'));
		this.appendValueInput('RIGHT')
			.setCheck('Number')
			.appendField(window.languageManager.getMessage('FOOTBOT_RIGHT_SPEED', '右輪速度(%)'));
		this.setInputsInline(true);
		this.setPreviousStatement(true, null);
		this.setNextStatement(true, null);
		this.setColour(180);
		this.setTooltip(window.languageManager.getMessage('FOOTBOT_MOTOR_MOVE_TOOLTIP', '設定足球車雙輪速度（-100 到 100）'));
	},
};

// === 足球車：停止移動 ===
Blockly.Blocks['singular_footbot_stop'] = {
	init: function () {
		this.appendDummyInput().appendField(window.languageManager.getMessage('FOOTBOT_STOP', '停止移動'));
		this.setPreviousStatement(true, null);
		this.setNextStatement(true, null);
		this.setColour(180);
		this.setTooltip(window.languageManager.getMessage('FOOTBOT_STOP_TOOLTIP', '停止足球車雙輪和所有動作'));
	},
};

// === 足球車：後退 ===
Blockly.Blocks['singular_footbot_backward'] = {
	init: function () {
		this.appendDummyInput().appendField(window.languageManager.getMessage('FOOTBOT_BACKWARD_PREFIX', '後退'));
		this.appendValueInput('SPEED')
			.setCheck('Number')
			.appendField(window.languageManager.getMessage('FOOTBOT_BACKWARD_SPEED', '速度(%)'));
		this.setInputsInline(true);
		this.setPreviousStatement(true, null);
		this.setNextStatement(true, null);
		this.setColour(180);
		this.setTooltip(window.languageManager.getMessage('FOOTBOT_BACKWARD_TOOLTIP', '控制足球車直線後退'));
	},
};

// === 足球車：原地左轉 ===
Blockly.Blocks['singular_footbot_spin_left'] = {
	init: function () {
		this.appendDummyInput().appendField(window.languageManager.getMessage('FOOTBOT_SPIN_LEFT_PREFIX', '原地左轉'));
		this.appendValueInput('SPEED')
			.setCheck('Number')
			.appendField(window.languageManager.getMessage('FOOTBOT_SPIN_SPEED', '速度(%)'));
		this.setInputsInline(true);
		this.setPreviousStatement(true, null);
		this.setNextStatement(true, null);
		this.setColour(180);
		this.setTooltip(window.languageManager.getMessage('FOOTBOT_SPIN_LEFT_TOOLTIP', '控制足球車原地左轉'));
	},
};

// === 足球車：原地右轉 ===
Blockly.Blocks['singular_footbot_spin_right'] = {
	init: function () {
		this.appendDummyInput().appendField(window.languageManager.getMessage('FOOTBOT_SPIN_RIGHT_PREFIX', '原地右轉'));
		this.appendValueInput('SPEED')
			.setCheck('Number')
			.appendField(window.languageManager.getMessage('FOOTBOT_SPIN_SPEED', '速度(%)'));
		this.setInputsInline(true);
		this.setPreviousStatement(true, null);
		this.setNextStatement(true, null);
		this.setColour(180);
		this.setTooltip(window.languageManager.getMessage('FOOTBOT_SPIN_RIGHT_TOOLTIP', '控制足球車原地右轉'));
	},
};

// === 足球車：踢球 ===
Blockly.Blocks['singular_footbot_kick'] = {
	init: function () {
		this.appendDummyInput().appendField(window.languageManager.getMessage('FOOTBOT_KICK', '踢球'));
		this.setPreviousStatement(true, null);
		this.setNextStatement(true, null);
		this.setColour(180);
		this.setTooltip(window.languageManager.getMessage('FOOTBOT_KICK_TOOLTIP', '執行踢球動作'));
	},
};

// === 足球車：抬球 ===
Blockly.Blocks['singular_footbot_lift'] = {
	init: function () {
		this.appendDummyInput().appendField(window.languageManager.getMessage('FOOTBOT_LIFT', '抬球'));
		this.setPreviousStatement(true, null);
		this.setNextStatement(true, null);
		this.setColour(180);
		this.setTooltip(window.languageManager.getMessage('FOOTBOT_LIFT_TOOLTIP', '執行抬球動作'));
	},
};

// 記錄載入訊息
console.log('[blockly] FootBot 積木定義已載入');
