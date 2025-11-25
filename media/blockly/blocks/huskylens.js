/**
 * @license
 * Copyright 2024 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * 開發板腳位對應表
 * 用於動態 tooltip 顯示各開發板的 I2C/UART 腳位資訊
 */
const HUSKYLENS_PIN_INFO = {
	i2c: {
		uno: 'A4(SDA)/A5(SCL)',
		nano: 'A4(SDA)/A5(SCL)',
		mega: 'D20(SDA)/D21(SCL)',
		esp32: 'GPIO21(SDA)/GPIO22(SCL)',
		supermini: 'GPIO8(SDA)/GPIO9(SCL)',
	},
	uart: {
		uno: null, // AVR 板使用 SoftwareSerial，可使用任意數位腳位
		nano: null,
		mega: null,
		esp32: 'GPIO16(RX2)/GPIO17(TX2)',
		supermini: 'GPIO20(RX)/GPIO21(TX)',
	},
};

/**
 * 取得目前開發板的 I2C 腳位資訊
 * @returns {string} 腳位描述
 */
function getHuskyLensI2CPinInfo() {
	const board = window.currentBoard || 'uno';
	return HUSKYLENS_PIN_INFO.i2c[board] || HUSKYLENS_PIN_INFO.i2c.uno;
}

/**
 * 取得目前開發板的 UART 腳位建議
 * @returns {string} 腳位描述或任意數位腳位提示
 */
function getHuskyLensUARTPinInfo() {
	const board = window.currentBoard || 'uno';
	const pins = HUSKYLENS_PIN_INFO.uart[board];
	if (pins) {
		return pins;
	}
	return window.languageManager.getMessage('HUSKYLENS_UART_ANY_DIGITAL', 'Any digital pin');
}

// HUSKYLENS 初始化積木 (I2C)
Blockly.Blocks['huskylens_init_i2c'] = {
	init: function () {
		this.appendDummyInput().appendField(window.languageManager.getMessage('HUSKYLENS_INIT_I2C', '初始化 HUSKYLENS (I2C)'));

		this.setInputsInline(false);
		this.setPreviousStatement(true, null);
		this.setNextStatement(true, null);
		this.setStyle('sensor_blocks');
		this.setTooltip(() => {
			const baseMsg = window.languageManager.getMessage('HUSKYLENS_INIT_I2C_TOOLTIP', '使用 I2C 初始化 HUSKYLENS 智慧鏡頭');
			const pinHint = window.languageManager.getMessage('HUSKYLENS_I2C_PIN_HINT', 'Wiring: ');
			const pinInfo = getHuskyLensI2CPinInfo();
			return baseMsg + '\n' + pinHint + pinInfo;
		});
		this.setHelpUrl('');

		// 標記為實驗積木
		window.potentialExperimentalBlocks.push('huskylens_init_i2c');
	},
};

// HUSKYLENS 初始化積木 (UART)
Blockly.Blocks['huskylens_init_uart'] = {
	init: function () {
		this.appendDummyInput().appendField(window.languageManager.getMessage('HUSKYLENS_INIT_UART', '初始化 HUSKYLENS (UART)'));

		this.appendDummyInput()
			.appendField(window.languageManager.getMessage('HUSKYLENS_RX_PIN', 'RX 腳位'))
			.appendField(
				new Blockly.FieldDropdown(function () {
					return window.getDigitalPinOptions();
				}),
				'RX_PIN'
			);

		this.appendDummyInput()
			.appendField(window.languageManager.getMessage('HUSKYLENS_TX_PIN', 'TX 腳位'))
			.appendField(
				new Blockly.FieldDropdown(function () {
					return window.getDigitalPinOptions();
				}),
				'TX_PIN'
			);

		this.setInputsInline(false);
		this.setPreviousStatement(true, null);
		this.setNextStatement(true, null);
		this.setStyle('sensor_blocks');
		this.setTooltip(() => {
			const baseMsg = window.languageManager.getMessage(
				'HUSKYLENS_INIT_UART_TOOLTIP',
				'使用 UART 初始化 HUSKYLENS 智慧鏡頭，設定 RX/TX 腳位'
			);
			const pinHint = window.languageManager.getMessage('HUSKYLENS_UART_PIN_HINT', 'Recommended pins: ');
			const pinInfo = getHuskyLensUARTPinInfo();
			return baseMsg + '\n' + pinHint + pinInfo;
		});
		this.setHelpUrl('');

		// 標記為實驗積木
		window.potentialExperimentalBlocks.push('huskylens_init_uart');
	},
};

// HUSKYLENS 設定演算法積木
Blockly.Blocks['huskylens_set_algorithm'] = {
	init: function () {
		this.appendDummyInput()
			.appendField(window.languageManager.getMessage('HUSKYLENS_SET_ALGORITHM', '設定 HUSKYLENS 演算法為'))
			.appendField(
				new Blockly.FieldDropdown([
					[window.languageManager.getMessage('HUSKYLENS_ALGORITHM_FACE_RECOGNITION', '人臉辨識'), 'ALGORITHM_FACE_RECOGNITION'],
					[window.languageManager.getMessage('HUSKYLENS_ALGORITHM_OBJECT_TRACKING', '物體追蹤'), 'ALGORITHM_OBJECT_TRACKING'],
					[
						window.languageManager.getMessage('HUSKYLENS_ALGORITHM_OBJECT_RECOGNITION', '物體辨識'),
						'ALGORITHM_OBJECT_RECOGNITION',
					],
					[window.languageManager.getMessage('HUSKYLENS_ALGORITHM_LINE_TRACKING', '線路追蹤'), 'ALGORITHM_LINE_TRACKING'],
					[window.languageManager.getMessage('HUSKYLENS_ALGORITHM_COLOR_RECOGNITION', '顏色辨識'), 'ALGORITHM_COLOR_RECOGNITION'],
					[window.languageManager.getMessage('HUSKYLENS_ALGORITHM_TAG_RECOGNITION', '標籤辨識'), 'ALGORITHM_TAG_RECOGNITION'],
					[
						window.languageManager.getMessage('HUSKYLENS_ALGORITHM_OBJECT_CLASSIFICATION', '物體分類'),
						'ALGORITHM_OBJECT_CLASSIFICATION',
					],
				]),
				'ALGORITHM'
			);

		this.setInputsInline(false);
		this.setPreviousStatement(true, null);
		this.setNextStatement(true, null);
		this.setStyle('sensor_blocks');
		this.setTooltip(window.languageManager.getMessage('HUSKYLENS_SET_ALGORITHM_TOOLTIP', '設定 HUSKYLENS 使用的辨識演算法'));
		this.setHelpUrl('');

		// 標記為實驗積木
		window.potentialExperimentalBlocks.push('huskylens_set_algorithm');
	},
};

// HUSKYLENS 請求資料積木
Blockly.Blocks['huskylens_request'] = {
	init: function () {
		this.appendDummyInput().appendField(window.languageManager.getMessage('HUSKYLENS_REQUEST', '請求 HUSKYLENS 辨識結果'));

		this.setInputsInline(false);
		this.setPreviousStatement(true, null);
		this.setNextStatement(true, null);
		this.setStyle('sensor_blocks');
		this.setTooltip(window.languageManager.getMessage('HUSKYLENS_REQUEST_TOOLTIP', '從 HUSKYLENS 請求最新的辨識結果'));
		this.setHelpUrl('');

		// 標記為實驗積木
		window.potentialExperimentalBlocks.push('huskylens_request');
	},
};

// HUSKYLENS 是否學習過積木
Blockly.Blocks['huskylens_is_learned'] = {
	init: function () {
		this.appendDummyInput().appendField(window.languageManager.getMessage('HUSKYLENS_IS_LEARNED', 'HUSKYLENS 已學習物體'));

		this.setInputsInline(true);
		this.setOutput(true, 'Boolean');
		this.setStyle('sensor_blocks');
		this.setTooltip(window.languageManager.getMessage('HUSKYLENS_IS_LEARNED_TOOLTIP', '檢測 HUSKYLENS 是否已學習任何物體'));
		this.setHelpUrl('');

		// 標記為實驗積木
		window.potentialExperimentalBlocks.push('huskylens_is_learned');
	},
};

// HUSKYLENS 方塊數量積木
Blockly.Blocks['huskylens_count_blocks'] = {
	init: function () {
		this.appendDummyInput().appendField(window.languageManager.getMessage('HUSKYLENS_COUNT_BLOCKS', 'HUSKYLENS 偵測到的方塊數量'));

		this.setInputsInline(true);
		this.setOutput(true, 'Number');
		this.setStyle('sensor_blocks');
		this.setTooltip(window.languageManager.getMessage('HUSKYLENS_COUNT_BLOCKS_TOOLTIP', '取得 HUSKYLENS 偵測到的方塊數量'));
		this.setHelpUrl('');

		// 標記為實驗積木
		window.potentialExperimentalBlocks.push('huskylens_count_blocks');
	},
};

// HUSKYLENS 方塊資訊積木
Blockly.Blocks['huskylens_get_block_info'] = {
	init: function () {
		this.appendDummyInput()
			.appendField(window.languageManager.getMessage('HUSKYLENS_GET_BLOCK_INFO', '取得方塊'))
			.appendField(new Blockly.FieldNumber(0, 0), 'INDEX')
			.appendField(window.languageManager.getMessage('HUSKYLENS_BLOCK_INFO_TYPE', '的'))
			.appendField(
				new Blockly.FieldDropdown([
					[window.languageManager.getMessage('HUSKYLENS_X_CENTER', 'X 中心'), 'xCenter'],
					[window.languageManager.getMessage('HUSKYLENS_Y_CENTER', 'Y 中心'), 'yCenter'],
					[window.languageManager.getMessage('HUSKYLENS_WIDTH', '寬度'), 'width'],
					[window.languageManager.getMessage('HUSKYLENS_HEIGHT', '高度'), 'height'],
					[window.languageManager.getMessage('HUSKYLENS_ID', 'ID'), 'ID'],
				]),
				'INFO_TYPE'
			);

		this.setInputsInline(true);
		this.setOutput(true, 'Number');
		this.setStyle('sensor_blocks');
		this.setTooltip(window.languageManager.getMessage('HUSKYLENS_GET_BLOCK_INFO_TOOLTIP', '取得指定方塊的資訊（位置、大小或 ID）'));
		this.setHelpUrl('');

		// 標記為實驗積木
		window.potentialExperimentalBlocks.push('huskylens_get_block_info');
	},
};

// HUSKYLENS 箭頭數量積木
Blockly.Blocks['huskylens_count_arrows'] = {
	init: function () {
		this.appendDummyInput().appendField(window.languageManager.getMessage('HUSKYLENS_COUNT_ARROWS', 'HUSKYLENS 偵測到的箭頭數量'));

		this.setInputsInline(true);
		this.setOutput(true, 'Number');
		this.setStyle('sensor_blocks');
		this.setTooltip(window.languageManager.getMessage('HUSKYLENS_COUNT_ARROWS_TOOLTIP', '取得 HUSKYLENS 偵測到的箭頭數量'));
		this.setHelpUrl('');

		// 標記為實驗積木
		window.potentialExperimentalBlocks.push('huskylens_count_arrows');
	},
};

// HUSKYLENS 箭頭資訊積木
Blockly.Blocks['huskylens_get_arrow_info'] = {
	init: function () {
		this.appendDummyInput()
			.appendField(window.languageManager.getMessage('HUSKYLENS_GET_ARROW_INFO', '取得箭頭'))
			.appendField(new Blockly.FieldNumber(0, 0), 'INDEX')
			.appendField(window.languageManager.getMessage('HUSKYLENS_ARROW_INFO_TYPE', '的'))
			.appendField(
				new Blockly.FieldDropdown([
					[window.languageManager.getMessage('HUSKYLENS_X_ORIGIN', 'X 起點'), 'xOrigin'],
					[window.languageManager.getMessage('HUSKYLENS_Y_ORIGIN', 'Y 起點'), 'yOrigin'],
					[window.languageManager.getMessage('HUSKYLENS_X_TARGET', 'X 終點'), 'xTarget'],
					[window.languageManager.getMessage('HUSKYLENS_Y_TARGET', 'Y 終點'), 'yTarget'],
					[window.languageManager.getMessage('HUSKYLENS_ID', 'ID'), 'ID'],
				]),
				'INFO_TYPE'
			);

		this.setInputsInline(true);
		this.setOutput(true, 'Number');
		this.setStyle('sensor_blocks');
		this.setTooltip(window.languageManager.getMessage('HUSKYLENS_GET_ARROW_INFO_TOOLTIP', '取得指定箭頭的資訊（起點、終點或 ID）'));
		this.setHelpUrl('');

		// 標記為實驗積木
		window.potentialExperimentalBlocks.push('huskylens_get_arrow_info');
	},
};

// HUSKYLENS 學習物體積木
Blockly.Blocks['huskylens_learn'] = {
	init: function () {
		this.appendValueInput('ID')
			.setCheck('Number')
			.appendField(window.languageManager.getMessage('HUSKYLENS_LEARN', '讓 HUSKYLENS 學習 ID'));

		this.setInputsInline(false);
		this.setPreviousStatement(true, null);
		this.setNextStatement(true, null);
		this.setStyle('sensor_blocks');
		this.setTooltip(
			window.languageManager.getMessage('HUSKYLENS_LEARN_TOOLTIP', '讓 HUSKYLENS 學習指定 ID 的物體（僅適用於物體分類模式）')
		);
		this.setHelpUrl('');

		// 標記為實驗積木
		window.potentialExperimentalBlocks.push('huskylens_learn');
	},
};

// HUSKYLENS 忘記所有積木
Blockly.Blocks['huskylens_forget'] = {
	init: function () {
		this.appendDummyInput().appendField(window.languageManager.getMessage('HUSKYLENS_FORGET', '讓 HUSKYLENS 忘記所有學習'));

		this.setInputsInline(false);
		this.setPreviousStatement(true, null);
		this.setNextStatement(true, null);
		this.setStyle('sensor_blocks');
		this.setTooltip(
			window.languageManager.getMessage('HUSKYLENS_FORGET_TOOLTIP', '清除 HUSKYLENS 所有學習的物體（僅適用於物體分類模式）')
		);
		this.setHelpUrl('');

		// 標記為實驗積木
		window.potentialExperimentalBlocks.push('huskylens_forget');
	},
};
