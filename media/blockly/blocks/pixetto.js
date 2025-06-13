/**
 * @license
 * Copyright 2024 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

// Pixetto 初始化積木
Blockly.Blocks['pixetto_init'] = {
	init: function () {
		this.appendDummyInput().appendField(window.languageManager.getMessage('PIXETTO_INIT', '初始化 Pixetto 智慧鏡頭'));

		this.appendDummyInput()
			.appendField(window.languageManager.getMessage('PIXETTO_RX_PIN', 'RX 腳位'))
			.appendField(
				new Blockly.FieldDropdown(function () {
					return window.getDigitalPinOptions();
				}),
				'RX_PIN'
			);

		this.appendDummyInput()
			.appendField(window.languageManager.getMessage('PIXETTO_TX_PIN', 'TX 腳位'))
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
		this.setTooltip(window.languageManager.getMessage('PIXETTO_INIT_TOOLTIP', '初始化 Pixetto 智慧鏡頭，設定 UART 通訊腳位'));
		this.setHelpUrl('');

		// 標記為實驗積木
		window.potentialExperimentalBlocks.push('pixetto_init');
	},
};

// Pixetto 是否偵測到物體積木
Blockly.Blocks['pixetto_is_detected'] = {
	init: function () {
		this.appendDummyInput().appendField(window.languageManager.getMessage('PIXETTO_IS_DETECTED', 'Pixetto 偵測到物體'));

		this.setInputsInline(true);
		this.setOutput(true, 'Boolean');
		this.setStyle('sensor_blocks');
		this.setTooltip(window.languageManager.getMessage('PIXETTO_IS_DETECTED_TOOLTIP', '檢測 Pixetto 是否偵測到任何物體'));
		this.setHelpUrl('');

		// 標記為實驗積木
		window.potentialExperimentalBlocks.push('pixetto_is_detected');
	},
};

// Pixetto 取得偵測類型 ID 積木
Blockly.Blocks['pixetto_get_type_id'] = {
	init: function () {
		this.appendDummyInput().appendField(window.languageManager.getMessage('PIXETTO_GET_TYPE_ID', 'Pixetto 取得偵測類型 ID'));

		this.setInputsInline(true);
		this.setOutput(true, 'Number');
		this.setStyle('sensor_blocks');
		this.setTooltip(window.languageManager.getMessage('PIXETTO_GET_TYPE_ID_TOOLTIP', '取得 Pixetto 偵測到的物體類型 ID'));
		this.setHelpUrl('');

		// 標記為實驗積木
		window.potentialExperimentalBlocks.push('pixetto_get_type_id');
	},
};

// Pixetto 取得功能 ID 積木
Blockly.Blocks['pixetto_get_func_id'] = {
	init: function () {
		this.appendDummyInput().appendField(window.languageManager.getMessage('PIXETTO_GET_FUNC_ID', 'Pixetto 取得功能 ID'));

		this.setInputsInline(true);
		this.setOutput(true, 'Number');
		this.setStyle('sensor_blocks');
		this.setTooltip(window.languageManager.getMessage('PIXETTO_GET_FUNC_ID_TOOLTIP', '取得 Pixetto 目前使用的功能 ID'));
		this.setHelpUrl('');

		// 標記為實驗積木
		window.potentialExperimentalBlocks.push('pixetto_get_func_id');
	},
};

// Pixetto 顏色偵測積木
Blockly.Blocks['pixetto_color_detect'] = {
	init: function () {
		this.appendDummyInput().appendField(window.languageManager.getMessage('PIXETTO_COLOR_DETECT', 'Pixetto 偵測顏色'));

		this.appendDummyInput()
			.appendField(window.languageManager.getMessage('PIXETTO_COLOR', '顏色'))
			.appendField(
				new Blockly.FieldDropdown([
					[window.languageManager.getMessage('PIXETTO_COLOR_RED', '紅色'), 'RED'],
					[window.languageManager.getMessage('PIXETTO_COLOR_BLUE', '藍色'), 'BLUE'],
					[window.languageManager.getMessage('PIXETTO_COLOR_GREEN', '綠色'), 'GREEN'],
					[window.languageManager.getMessage('PIXETTO_COLOR_YELLOW', '黃色'), 'YELLOW'],
					[window.languageManager.getMessage('PIXETTO_COLOR_ORANGE', '橙色'), 'ORANGE'],
					[window.languageManager.getMessage('PIXETTO_COLOR_PURPLE', '紫色'), 'PURPLE'],
					[window.languageManager.getMessage('PIXETTO_COLOR_BLACK', '黑色'), 'BLACK'],
					[window.languageManager.getMessage('PIXETTO_COLOR_WHITE', '白色'), 'WHITE'],
				]),
				'COLOR'
			);

		this.setInputsInline(true);
		this.setOutput(true, 'Boolean');
		this.setStyle('sensor_blocks');
		this.setTooltip(window.languageManager.getMessage('PIXETTO_COLOR_DETECT_TOOLTIP', '檢測 Pixetto 是否偵測到指定顏色的物體'));
		this.setHelpUrl('');

		// 標記為實驗積木
		window.potentialExperimentalBlocks.push('pixetto_color_detect');
	},
};

// Pixetto 形狀偵測積木
Blockly.Blocks['pixetto_shape_detect'] = {
	init: function () {
		this.appendDummyInput().appendField(window.languageManager.getMessage('PIXETTO_SHAPE_DETECT', 'Pixetto 偵測形狀'));

		this.appendDummyInput()
			.appendField(window.languageManager.getMessage('PIXETTO_SHAPE', '形狀'))
			.appendField(
				new Blockly.FieldDropdown([
					[window.languageManager.getMessage('PIXETTO_SHAPE_TRIANGLE', '三角形'), 'TRIANGLE'],
					[window.languageManager.getMessage('PIXETTO_SHAPE_RECTANGLE', '四邊形'), 'RECTANGLE'],
					[window.languageManager.getMessage('PIXETTO_SHAPE_PENTAGON', '五邊形'), 'PENTAGON'],
					[window.languageManager.getMessage('PIXETTO_SHAPE_HEXAGON', '六邊形'), 'HEXAGON'],
					[window.languageManager.getMessage('PIXETTO_SHAPE_CIRCLE', '圓形'), 'CIRCLE'],
				]),
				'SHAPE'
			);

		this.setInputsInline(true);
		this.setOutput(true, 'Boolean');
		this.setStyle('sensor_blocks');
		this.setTooltip(window.languageManager.getMessage('PIXETTO_SHAPE_DETECT_TOOLTIP', '檢測 Pixetto 是否偵測到指定形狀的物體'));
		this.setHelpUrl('');

		// 標記為實驗積木
		window.potentialExperimentalBlocks.push('pixetto_shape_detect');
	},
};

// Pixetto 人臉偵測積木
Blockly.Blocks['pixetto_face_detect'] = {
	init: function () {
		this.appendDummyInput().appendField(window.languageManager.getMessage('PIXETTO_FACE_DETECT', 'Pixetto 偵測到人臉'));

		this.setInputsInline(true);
		this.setOutput(true, 'Boolean');
		this.setStyle('sensor_blocks');
		this.setTooltip(window.languageManager.getMessage('PIXETTO_FACE_DETECT_TOOLTIP', '檢測 Pixetto 是否偵測到人臉'));
		this.setHelpUrl('');

		// 標記為實驗積木
		window.potentialExperimentalBlocks.push('pixetto_face_detect');
	},
};

// Pixetto AprilTag 偵測積木
Blockly.Blocks['pixetto_apriltag_detect'] = {
	init: function () {
		this.appendDummyInput().appendField(window.languageManager.getMessage('PIXETTO_APRILTAG_DETECT', 'Pixetto 偵測 AprilTag'));

		this.appendValueInput('TAG_ID').setCheck('Number').appendField(window.languageManager.getMessage('PIXETTO_TAG_ID', '標籤 ID'));

		this.setInputsInline(true);
		this.setOutput(true, 'Boolean');
		this.setStyle('sensor_blocks');
		this.setTooltip(window.languageManager.getMessage('PIXETTO_APRILTAG_DETECT_TOOLTIP', '檢測 Pixetto 是否偵測到指定 ID 的 AprilTag'));
		this.setHelpUrl('');

		// 標記為實驗積木
		window.potentialExperimentalBlocks.push('pixetto_apriltag_detect');
	},
};

// Pixetto 神經網路推論積木
Blockly.Blocks['pixetto_neural_network'] = {
	init: function () {
		this.appendDummyInput().appendField(window.languageManager.getMessage('PIXETTO_NEURAL_NETWORK', 'Pixetto 神經網路辨識'));

		this.appendValueInput('CLASS_ID').setCheck('Number').appendField(window.languageManager.getMessage('PIXETTO_CLASS_ID', '類別 ID'));

		this.setInputsInline(true);
		this.setOutput(true, 'Boolean');
		this.setStyle('sensor_blocks');
		this.setTooltip(
			window.languageManager.getMessage('PIXETTO_NEURAL_NETWORK_TOOLTIP', '檢測 Pixetto 神經網路是否辨識出指定類別的物體')
		);
		this.setHelpUrl('');

		// 標記為實驗積木
		window.potentialExperimentalBlocks.push('pixetto_neural_network');
	},
};

// Pixetto 手寫數字辨識積木
Blockly.Blocks['pixetto_handwritten_digit'] = {
	init: function () {
		this.appendDummyInput().appendField(window.languageManager.getMessage('PIXETTO_HANDWRITTEN_DIGIT', 'Pixetto 辨識手寫數字'));

		this.appendValueInput('DIGIT').setCheck('Number').appendField(window.languageManager.getMessage('PIXETTO_DIGIT', '數字'));

		this.setInputsInline(true);
		this.setOutput(true, 'Boolean');
		this.setStyle('sensor_blocks');
		this.setTooltip(window.languageManager.getMessage('PIXETTO_HANDWRITTEN_DIGIT_TOOLTIP', '檢測 Pixetto 是否辨識出指定的手寫數字'));
		this.setHelpUrl('');

		// 標記為實驗積木
		window.potentialExperimentalBlocks.push('pixetto_handwritten_digit');
	},
};

// Pixetto 獲取物體位置積木
Blockly.Blocks['pixetto_get_position'] = {
	init: function () {
		this.appendDummyInput().appendField(window.languageManager.getMessage('PIXETTO_GET_POSITION', 'Pixetto 獲取偵測物體'));

		this.appendDummyInput()
			.appendField(window.languageManager.getMessage('PIXETTO_COORDINATE', '座標'))
			.appendField(
				new Blockly.FieldDropdown([
					[window.languageManager.getMessage('PIXETTO_POSITION_X', 'X 座標'), 'X'],
					[window.languageManager.getMessage('PIXETTO_POSITION_Y', 'Y 座標'), 'Y'],
					[window.languageManager.getMessage('PIXETTO_POSITION_WIDTH', '寬度'), 'WIDTH'],
					[window.languageManager.getMessage('PIXETTO_POSITION_HEIGHT', '高度'), 'HEIGHT'],
				]),
				'POSITION_TYPE'
			);

		this.setInputsInline(true);
		this.setOutput(true, 'Number');
		this.setStyle('sensor_blocks');
		this.setTooltip(window.languageManager.getMessage('PIXETTO_GET_POSITION_TOOLTIP', '獲取 Pixetto 偵測到的物體位置或尺寸資訊'));
		this.setHelpUrl('');

		// 標記為實驗積木
		window.potentialExperimentalBlocks.push('pixetto_get_position');
	},
};

// Pixetto 道路偵測積木
Blockly.Blocks['pixetto_road_detect'] = {
	init: function () {
		this.appendDummyInput().appendField(window.languageManager.getMessage('PIXETTO_ROAD_DETECT', 'Pixetto 道路偵測'));

		this.appendDummyInput()
			.appendField(window.languageManager.getMessage('PIXETTO_ROAD_INFO', '資訊'))
			.appendField(
				new Blockly.FieldDropdown([
					[window.languageManager.getMessage('PIXETTO_ROAD_CENTER_X', '中心點 X'), 'CENTER_X'],
					[window.languageManager.getMessage('PIXETTO_ROAD_CENTER_Y', '中心點 Y'), 'CENTER_Y'],
					[window.languageManager.getMessage('PIXETTO_ROAD_LEFT_X', '左邊界 X'), 'LEFT_X'],
					[window.languageManager.getMessage('PIXETTO_ROAD_RIGHT_X', '右邊界 X'), 'RIGHT_X'],
				]),
				'ROAD_INFO'
			);

		this.setInputsInline(true);
		this.setOutput(true, 'Number');
		this.setStyle('sensor_blocks');
		this.setTooltip(window.languageManager.getMessage('PIXETTO_ROAD_DETECT_TOOLTIP', '獲取 Pixetto 道路偵測的相關資訊'));
		this.setHelpUrl('');

		// 標記為實驗積木
		window.potentialExperimentalBlocks.push('pixetto_road_detect');
	},
};

// Pixetto 設定功能模式積木
Blockly.Blocks['pixetto_set_mode'] = {
	init: function () {
		this.appendDummyInput().appendField(window.languageManager.getMessage('PIXETTO_SET_MODE', '設定 Pixetto 功能模式'));

		this.appendDummyInput()
			.appendField(window.languageManager.getMessage('PIXETTO_MODE', '模式'))
			.appendField(
				new Blockly.FieldDropdown([
					[window.languageManager.getMessage('PIXETTO_MODE_COLOR_DETECTION', '顏色偵測'), 'COLOR_DETECTION'],
					[window.languageManager.getMessage('PIXETTO_MODE_SHAPE_DETECTION', '形狀偵測'), 'SHAPE_DETECTION'],
					[window.languageManager.getMessage('PIXETTO_MODE_FACE_DETECTION', '人臉偵測'), 'FACE_DETECTION'],
					[window.languageManager.getMessage('PIXETTO_MODE_APRILTAG_DETECTION', 'AprilTag 偵測'), 'APRILTAG_DETECTION'],
					[window.languageManager.getMessage('PIXETTO_MODE_NEURAL_NETWORK', '神經網路'), 'NEURAL_NETWORK'],
					[window.languageManager.getMessage('PIXETTO_MODE_HANDWRITTEN_DIGIT', '手寫數字'), 'HANDWRITTEN_DIGIT'],
					[window.languageManager.getMessage('PIXETTO_MODE_ROAD_DETECTION', '道路偵測'), 'ROAD_DETECTION'],
					[window.languageManager.getMessage('PIXETTO_MODE_BALL_DETECTION', '球體偵測'), 'BALL_DETECTION'],
					[window.languageManager.getMessage('PIXETTO_MODE_TEMPLATE_MATCHING', '模板比對'), 'TEMPLATE_MATCHING'],
				]),
				'MODE'
			);

		this.setInputsInline(false);
		this.setPreviousStatement(true, null);
		this.setNextStatement(true, null);
		this.setStyle('sensor_blocks');
		this.setTooltip(window.languageManager.getMessage('PIXETTO_SET_MODE_TOOLTIP', '設定 Pixetto 智慧鏡頭的功能模式'));
		this.setHelpUrl('');

		// 標記為實驗積木
		window.potentialExperimentalBlocks.push('pixetto_set_mode');
	},
};
