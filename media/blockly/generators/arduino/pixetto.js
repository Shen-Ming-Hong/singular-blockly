/**
 * @license
 * Copyright 2024 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

// 模組載入時自動註冊需要強制掃描的積木類型
(function () {
	// 確保 arduinoGenerator 已初始化
	if (window.arduinoGenerator && typeof window.arduinoGenerator.registerAlwaysGenerateBlock === 'function') {
		// 註冊 Pixetto 相關積木
		window.arduinoGenerator.registerAlwaysGenerateBlock('pixetto_init');
		window.arduinoGenerator.registerAlwaysGenerateBlock('pixetto_color_detect');
		window.arduinoGenerator.registerAlwaysGenerateBlock('pixetto_shape_detect');
		window.arduinoGenerator.registerAlwaysGenerateBlock('pixetto_face_detect');
		window.arduinoGenerator.registerAlwaysGenerateBlock('pixetto_apriltag_detect');
		window.arduinoGenerator.registerAlwaysGenerateBlock('pixetto_neural_network');
		window.arduinoGenerator.registerAlwaysGenerateBlock('pixetto_handwritten_digit');
		window.arduinoGenerator.registerAlwaysGenerateBlock('pixetto_get_position');
		window.arduinoGenerator.registerAlwaysGenerateBlock('pixetto_road_detect');
		window.arduinoGenerator.registerAlwaysGenerateBlock('pixetto_set_mode');
	} else {
		// 如果 arduinoGenerator 尚未初始化，則設置一個載入完成後執行的回調
		window.addEventListener('load', function () {
			if (window.arduinoGenerator && typeof window.arduinoGenerator.registerAlwaysGenerateBlock === 'function') {
				window.arduinoGenerator.registerAlwaysGenerateBlock('pixetto_init');
				window.arduinoGenerator.registerAlwaysGenerateBlock('pixetto_color_detect');
				window.arduinoGenerator.registerAlwaysGenerateBlock('pixetto_shape_detect');
				window.arduinoGenerator.registerAlwaysGenerateBlock('pixetto_face_detect');
				window.arduinoGenerator.registerAlwaysGenerateBlock('pixetto_apriltag_detect');
				window.arduinoGenerator.registerAlwaysGenerateBlock('pixetto_neural_network');
				window.arduinoGenerator.registerAlwaysGenerateBlock('pixetto_handwritten_digit');
				window.arduinoGenerator.registerAlwaysGenerateBlock('pixetto_get_position');
				window.arduinoGenerator.registerAlwaysGenerateBlock('pixetto_road_detect');
				window.arduinoGenerator.registerAlwaysGenerateBlock('pixetto_set_mode');
			}
		});
	}
})();

// Pixetto 初始化代碼生成
window.arduinoGenerator.forBlock['pixetto_init'] = function (block) {
	try {
		const rxPin = block.getFieldValue('RX_PIN');
		const txPin = block.getFieldValue('TX_PIN');
		log.info(`pixetto_init: 設定 Pixetto 智慧鏡頭，RX=${rxPin}, TX=${txPin}`);

		// 添加 Pixetto 相關函式庫
		window.arduinoGenerator.includes_['pixetto'] = '#include <Pixetto.h>';
		window.arduinoGenerator.includes_['softwareserial'] = '#include <SoftwareSerial.h>';

		// 在 lib_deps 中添加 Pixetto 庫
		if (!window.arduinoGenerator.lib_deps_) {
			window.arduinoGenerator.lib_deps_ = [];
		}
		if (!window.arduinoGenerator.lib_deps_.includes('pixetto/Pixetto@^1.6.6')) {
			window.arduinoGenerator.lib_deps_.push('pixetto/Pixetto@^1.6.6');
		}

		// 添加 Pixetto 所需的 build_flags
		if (!window.arduinoGenerator.build_flags_) {
			window.arduinoGenerator.build_flags_ = [];
		}
		const pixettoBuildFlag = '-I"$PROJECT_PACKAGES_DIR/framework-arduino-avr/libraries/SoftwareSerial/src"';
		if (!window.arduinoGenerator.build_flags_.includes(pixettoBuildFlag)) {
			window.arduinoGenerator.build_flags_.push(pixettoBuildFlag);
		}

		// 設定 lib_ldf_mode
		window.arduinoGenerator.lib_ldf_mode_ = 'deep+';

		// 定義全域變數
		window.arduinoGenerator.variables_['pixetto_vars'] = `
// Pixetto 智慧鏡頭變數
Pixetto pixetto(${rxPin}, ${txPin});  // 建立 Pixetto 物件，設定 RX 和 TX 腳位
`;
		// 在 setup() 函數中初始化
		if (!window.arduinoGenerator.setupCode_) {
			window.arduinoGenerator.setupCode_ = [];
		}

		const setupCodeComment = '// 初始化 Pixetto 智慧鏡頭';
		const setupCodeBegin = 'pixetto.begin();';
		const setupCodeDelay = 'delay(1000);  // 等待初始化完成';

		if (!window.arduinoGenerator.setupCode_.includes(setupCodeComment)) {
			window.arduinoGenerator.setupCode_.push(setupCodeComment);
			window.arduinoGenerator.setupCode_.push(setupCodeBegin);
			window.arduinoGenerator.setupCode_.push(setupCodeDelay);
		}

		return '';
	} catch (error) {
		log.error('pixetto_init 代碼生成錯誤:', error);
		return '';
	}
};

// Pixetto 顏色偵測代碼生成
window.arduinoGenerator.forBlock['pixetto_color_detect'] = function (block) {
	try {
		const color = block.getFieldValue('COLOR');

		// 顏色代碼對應
		const colorCodes = {
			RED: 'PIX_COLOR_RED',
			BLUE: 'PIX_COLOR_BLUE',
			GREEN: 'PIX_COLOR_GREEN',
			YELLOW: 'PIX_COLOR_YELLOW',
			ORANGE: 'PIX_COLOR_ORANGE',
			PURPLE: 'PIX_COLOR_PURPLE',
			BLACK: 'PIX_COLOR_BLACK',
			WHITE: 'PIX_COLOR_WHITE',
		};

		const code = `pixetto.isDetected(${colorCodes[color]})`;
		return [code, window.arduinoGenerator.ORDER_FUNCTION_CALL];
	} catch (error) {
		log.error('pixetto_color_detect 代碼生成錯誤:', error);
		return ['false', window.arduinoGenerator.ORDER_ATOMIC];
	}
};

// Pixetto 形狀偵測代碼生成
window.arduinoGenerator.forBlock['pixetto_shape_detect'] = function (block) {
	try {
		const shape = block.getFieldValue('SHAPE');

		// 形狀代碼對應
		const shapeCodes = {
			TRIANGLE: 'PIX_SHAPE_TRIANGLE',
			RECTANGLE: 'PIX_SHAPE_RECTANGLE',
			PENTAGON: 'PIX_SHAPE_PENTAGON',
			HEXAGON: 'PIX_SHAPE_HEXAGON',
			CIRCLE: 'PIX_SHAPE_CIRCLE',
		};

		const code = `pixetto.isDetected(${shapeCodes[shape]})`;
		return [code, window.arduinoGenerator.ORDER_FUNCTION_CALL];
	} catch (error) {
		log.error('pixetto_shape_detect 代碼生成錯誤:', error);
		return ['false', window.arduinoGenerator.ORDER_ATOMIC];
	}
};

// Pixetto 人臉偵測代碼生成
window.arduinoGenerator.forBlock['pixetto_face_detect'] = function (block) {
	try {
		const code = `pixetto.isDetected(PIX_FACE)`;
		return [code, window.arduinoGenerator.ORDER_FUNCTION_CALL];
	} catch (error) {
		log.error('pixetto_face_detect 代碼生成錯誤:', error);
		return ['false', window.arduinoGenerator.ORDER_ATOMIC];
	}
};

// Pixetto AprilTag 偵測代碼生成
window.arduinoGenerator.forBlock['pixetto_apriltag_detect'] = function (block) {
	try {
		const tagId = window.arduinoGenerator.valueToCode(block, 'TAG_ID', window.arduinoGenerator.ORDER_ATOMIC) || '0';
		const code = `(pixetto.isDetected(PIX_APRILTAG) && pixetto.getAprilTagID() == ${tagId})`;
		return [code, window.arduinoGenerator.ORDER_LOGICAL_AND];
	} catch (error) {
		log.error('pixetto_apriltag_detect 代碼生成錯誤:', error);
		return ['false', window.arduinoGenerator.ORDER_ATOMIC];
	}
};

// Pixetto 神經網路推論代碼生成
window.arduinoGenerator.forBlock['pixetto_neural_network'] = function (block) {
	try {
		const classId = window.arduinoGenerator.valueToCode(block, 'CLASS_ID', window.arduinoGenerator.ORDER_ATOMIC) || '0';
		const code = `(pixetto.isDetected(PIX_NEURAL_NETWORK) && pixetto.getNeuralNetworkClassID() == ${classId})`;
		return [code, window.arduinoGenerator.ORDER_LOGICAL_AND];
	} catch (error) {
		log.error('pixetto_neural_network 代碼生成錯誤:', error);
		return ['false', window.arduinoGenerator.ORDER_ATOMIC];
	}
};

// Pixetto 手寫數字辨識代碼生成
window.arduinoGenerator.forBlock['pixetto_handwritten_digit'] = function (block) {
	try {
		const digit = window.arduinoGenerator.valueToCode(block, 'DIGIT', window.arduinoGenerator.ORDER_ATOMIC) || '0';
		const code = `(pixetto.isDetected(PIX_HANDWRITTEN_DIGIT) && pixetto.getHandwrittenDigit() == ${digit})`;
		return [code, window.arduinoGenerator.ORDER_LOGICAL_AND];
	} catch (error) {
		log.error('pixetto_handwritten_digit 代碼生成錯誤:', error);
		return ['false', window.arduinoGenerator.ORDER_ATOMIC];
	}
};

// Pixetto 獲取位置資訊代碼生成
window.arduinoGenerator.forBlock['pixetto_get_position'] = function (block) {
	try {
		const positionType = block.getFieldValue('POSITION_TYPE');

		// 位置類型對應的函數
		const positionFunctions = {
			X: 'pixetto.getPosX()',
			Y: 'pixetto.getPosY()',
			WIDTH: 'pixetto.getWidth()',
			HEIGHT: 'pixetto.getHeight()',
		};

		const code = positionFunctions[positionType];
		return [code, window.arduinoGenerator.ORDER_FUNCTION_CALL];
	} catch (error) {
		log.error('pixetto_get_position 代碼生成錯誤:', error);
		return ['0', window.arduinoGenerator.ORDER_ATOMIC];
	}
};

// Pixetto 道路偵測代碼生成
window.arduinoGenerator.forBlock['pixetto_road_detect'] = function (block) {
	try {
		const roadInfo = block.getFieldValue('ROAD_INFO');

		// 道路資訊對應的函數
		const roadFunctions = {
			CENTER_X: 'pixetto.getRoadCenterX()',
			CENTER_Y: 'pixetto.getRoadCenterY()',
			LEFT_X: 'pixetto.getRoadLeftX()',
			RIGHT_X: 'pixetto.getRoadRightX()',
		};

		const code = roadFunctions[roadInfo];
		return [code, window.arduinoGenerator.ORDER_FUNCTION_CALL];
	} catch (error) {
		log.error('pixetto_road_detect 代碼生成錯誤:', error);
		return ['0', window.arduinoGenerator.ORDER_ATOMIC];
	}
};

// Pixetto 設定功能模式代碼生成
window.arduinoGenerator.forBlock['pixetto_set_mode'] = function (block) {
	try {
		const mode = block.getFieldValue('MODE');

		// 模式代碼對應
		const modeCodes = {
			COLOR_DETECTION: 'PIX_COLOR_DETECTION',
			SHAPE_DETECTION: 'PIX_SHAPE_DETECTION',
			FACE_DETECTION: 'PIX_FACE_DETECTION',
			APRILTAG_DETECTION: 'PIX_APRILTAG_DETECTION',
			NEURAL_NETWORK: 'PIX_NEURAL_NETWORK',
			HANDWRITTEN_DIGIT: 'PIX_HANDWRITTEN_DIGIT',
			ROAD_DETECTION: 'PIX_ROAD_DETECTION',
			BALL_DETECTION: 'PIX_BALL_DETECTION',
			TEMPLATE_MATCHING: 'PIX_TEMPLATE_MATCHING',
		};

		const code = `pixetto.setMode(${modeCodes[mode]});\n`;
		return code;
	} catch (error) {
		log.error('pixetto_set_mode 代碼生成錯誤:', error);
		return '';
	}
};
