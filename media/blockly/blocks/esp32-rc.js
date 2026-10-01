/**
 * @license
 * Copyright 2026 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

(function () {
	const message = (key, fallback) => window.languageManager.getMessage(key, fallback);
	const joystickOptions = [['L1', '0'], ['L2', '1'], ['L3', '2'], ['R1', '3'], ['R2', '4'], ['R3', '5']];
	const buttonOptions = [['K1', '0'], ['K2', '1'], ['K3', '2'], ['K4', '3']];
	const experimental = type => window.registerExperimentalBlock(type);

	function updateOrphanWarning(event) {
		if (!this.workspace || this.workspace.isFlyout) return;
		if (event && event.type !== Blockly.Events.BLOCK_MOVE &&
			event.type !== Blockly.Events.BLOCK_CREATE && event.type !== Blockly.Events.FINISHED_LOADING) return;
		this.setWarningText(window.isInAllowedContext(this) ? null :
			message('ORPHAN_BLOCK_WARNING_ARDUINO', 'This block must be placed inside setup(), loop(), or a function to generate code.'),
			'esp32-rc-orphan');
	}

	Blockly.Blocks['esp32_rc_receiver_init'] = {
		onchange: updateOrphanWarning,
		init: function () {
			this.appendDummyInput().appendField(message('RC_SLAVE_INIT', '初始化 RC 接收端'))
				.appendField(message('RC_SLAVE_INIT_PAIR_ID', '配對 ID'));
			this.appendValueInput('PAIR_ID').setCheck('Number');
			this.appendDummyInput().appendField(message('RC_SLAVE_INIT_CHANNEL', '頻道'))
				.appendField(new Blockly.FieldNumber(1, 1, 11, 1), 'CHANNEL');
			this.setInputsInline(true);
			this.setPreviousStatement(true, null);
			this.setNextStatement(true, null);
			this.setColour(160);
			this.setTooltip(message('ESP32_RC_RECEIVER_INIT_TOOLTIP', '配對 ID 與頻道須與 CyberBrick 發射端相同；與 Wi-Fi/MQTT 混用可能發生頻道衝突。'));
			experimental(this.type);
		},
	};

	Blockly.Blocks['esp32_rc_wait_connection'] = {
		onchange: updateOrphanWarning,
		init: function () {
			this.appendDummyInput().appendField(message('RC_WAIT_CONNECTION', '等待配對'))
				.appendField(message('RC_WAIT_TIMEOUT', '超時'))
				.appendField(new Blockly.FieldNumber(30, 1, 60, 1), 'TIMEOUT')
				.appendField(message('RC_WAIT_SECONDS', '秒'));
			this.setPreviousStatement(true, null);
			this.setNextStatement(true, null);
			this.setColour(160);
			this.setTooltip(message('ESP32_RC_WAIT_TOOLTIP', '等待有效的 CyberBrick RC 訊號；逾時後繼續執行。'));
			experimental(this.type);
		},
	};

	Blockly.Blocks['esp32_rc_is_connected'] = {
		onchange: updateOrphanWarning,
		init: function () {
			this.appendDummyInput().appendField(message('RC_IS_CONNECTED', 'RC 已連線？'));
			this.setOutput(true, 'Boolean');
			this.setColour(160);
			this.setTooltip(message('RC_IS_CONNECTED_TOOLTIP', '1.5 秒內收到有效訊號才算已連線。'));
			experimental(this.type);
		},
	};

	Blockly.Blocks['esp32_rc_get_joystick'] = {
		onchange: updateOrphanWarning,
		init: function () {
			this.appendDummyInput().appendField(message('RC_GET_JOYSTICK_PREFIX', 'RC 搖桿'))
				.appendField(new Blockly.FieldDropdown(joystickOptions), 'CHANNEL');
			this.setOutput(true, 'Number');
			this.setColour(160);
			this.setTooltip(message('RC_GET_JOYSTICK_TOOLTIP', '讀取 0–4095 搖桿值；未連線時為 2048。'));
			experimental(this.type);
		},
	};

	Blockly.Blocks['esp32_rc_get_joystick_mapped'] = {
		onchange: updateOrphanWarning,
		init: function () {
			this.appendDummyInput().appendField(message('RC_GET_JOYSTICK_MAPPED_PREFIX', 'RC 搖桿'))
				.appendField(new Blockly.FieldDropdown(joystickOptions), 'CHANNEL')
				.appendField(message('RC_GET_JOYSTICK_MAPPED_MIN', '映射至'));
			this.appendValueInput('MIN').setCheck('Number');
			this.appendDummyInput().appendField('~');
			this.appendValueInput('MAX').setCheck('Number');
			this.setInputsInline(true);
			this.setOutput(true, 'Number');
			this.setColour(160);
			this.setTooltip(message('RC_GET_JOYSTICK_MAPPED_TOOLTIP', '將 0–4095 搖桿值映射至指定範圍。'));
			experimental(this.type);
		},
	};

	Blockly.Blocks['esp32_rc_is_button_pressed'] = {
		onchange: updateOrphanWarning,
		init: function () {
			this.appendDummyInput().appendField(message('RC_IS_BUTTON_PRESSED_PREFIX', 'RC 按鈕'))
				.appendField(new Blockly.FieldDropdown(buttonOptions), 'BUTTON')
				.appendField(message('RC_IS_BUTTON_PRESSED_SUFFIX', '已按下？'));
			this.setOutput(true, 'Boolean');
			this.setColour(160);
			this.setTooltip(message('RC_IS_BUTTON_PRESSED_TOOLTIP', '按下回傳 true；未連線時回傳 false。'));
			experimental(this.type);
		},
	};
})();
