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
		window.arduinoGenerator.registerAlwaysGenerateBlock('pixetto_is_detected');
		window.arduinoGenerator.registerAlwaysGenerateBlock('pixetto_get_type_id');
		window.arduinoGenerator.registerAlwaysGenerateBlock('pixetto_get_func_id');
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
				window.arduinoGenerator.registerAlwaysGenerateBlock('pixetto_is_detected');
				window.arduinoGenerator.registerAlwaysGenerateBlock('pixetto_get_type_id');
				window.arduinoGenerator.registerAlwaysGenerateBlock('pixetto_get_func_id');
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

// Pixetto 是否偵測到物體代碼生成
window.arduinoGenerator.forBlock['pixetto_is_detected'] = function (block) {
	try {
		const code = 'pixetto.isDetected()';
		return [code, window.arduinoGenerator.ORDER_ATOMIC];
	} catch (error) {
		log.error('pixetto_is_detected 代碼生成錯誤:', error);
		return ['false', window.arduinoGenerator.ORDER_ATOMIC];
	}
};

// Pixetto 取得偵測類型 ID 代碼生成
window.arduinoGenerator.forBlock['pixetto_get_type_id'] = function (block) {
	try {
		const code = 'pixetto.getTypeID()';
		return [code, window.arduinoGenerator.ORDER_ATOMIC];
	} catch (error) {
		log.error('pixetto_get_type_id 代碼生成錯誤:', error);
		return ['-1', window.arduinoGenerator.ORDER_ATOMIC];
	}
};

// Pixetto 取得功能 ID 代碼生成
window.arduinoGenerator.forBlock['pixetto_get_func_id'] = function (block) {
	try {
		const code = 'pixetto.getFuncID()';
		return [code, window.arduinoGenerator.ORDER_ATOMIC];
	} catch (error) {
		log.error('pixetto_get_func_id 代碼生成錯誤:', error);
		return ['-1', window.arduinoGenerator.ORDER_ATOMIC];
	}
};

// Pixetto 顏色偵測代碼生成
window.arduinoGenerator.forBlock['pixetto_color_detect'] = function (block) {
	try {
		const color = block.getFieldValue('COLOR');

		// 顏色代碼對應
		const colorCodes = {
			RED: 'COLOR_RED',
			BLUE: 'COLOR_BLUE',
			GREEN: 'COLOR_GREEN',
			YELLOW: 'COLOR_YELLOW',
			ORANGE: 'COLOR_ORANGE',
			PURPLE: 'COLOR_PURPLE',
			BLACK: 'COLOR_BLACK',
			WHITE: 'COLOR_WHITE',
		};

		const code = `(pixetto.isDetected() && pixetto.getFuncID() == Pixetto::FUNC_COLOR_DETECTION && pixetto.getTypeID() == Pixetto::${colorCodes[color]})`;
		return [code, window.arduinoGenerator.ORDER_LOGICAL_AND];
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
			TRIANGLE: 'SHAPE_TRIANGLE',
			RECTANGLE: 'SHAPE_RECTANGLE',
			PENTAGON: 'SHAPE_PENTAGON',
			HEXAGON: 'SHAPE_PENTAGON', // Pixetto library 沒有六邊形，使用五邊形
			CIRCLE: 'SHAPE_ROUND',
		};

		const code = `(pixetto.isDetected() && pixetto.getFuncID() == Pixetto::FUNC_SHAPE_DETECTION && pixetto.getTypeID() == Pixetto::${shapeCodes[shape]})`;
		return [code, window.arduinoGenerator.ORDER_LOGICAL_AND];
	} catch (error) {
		log.error('pixetto_shape_detect 代碼生成錯誤:', error);
		return ['false', window.arduinoGenerator.ORDER_ATOMIC];
	}
};

// Pixetto 人臉偵測代碼生成
window.arduinoGenerator.forBlock['pixetto_face_detect'] = function (block) {
	try {
		const code = `(pixetto.isDetected() && pixetto.getFuncID() == Pixetto::FUNC_FACE_DETECTION)`;
		return [code, window.arduinoGenerator.ORDER_LOGICAL_AND];
	} catch (error) {
		log.error('pixetto_face_detect 代碼生成錯誤:', error);
		return ['false', window.arduinoGenerator.ORDER_ATOMIC];
	}
};

// Pixetto AprilTag 偵測代碼生成
window.arduinoGenerator.forBlock['pixetto_apriltag_detect'] = function (block) {
	try {
		const tagId = window.arduinoGenerator.valueToCode(block, 'TAG_ID', window.arduinoGenerator.ORDER_ATOMIC) || '0';
		const code = `(pixetto.isDetected() && pixetto.getFuncID() == Pixetto::FUNC_APRILTAG && pixetto.getTypeID() == ${tagId})`;
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
		const code = `(pixetto.isDetected() && pixetto.getFuncID() == Pixetto::FUNC_NEURAL_NETWORK && pixetto.getTypeID() == ${classId})`;
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
		const code = `(pixetto.isDetected() && pixetto.getFuncID() == Pixetto::FUNC_HANDWRITTEN_DIGITS_DETECTION && pixetto.getTypeID() == ${digit})`;
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
		return [code, window.arduinoGenerator.ORDER_ATOMIC];
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
			CENTER_X: 'pixetto.getPosX()',
			CENTER_Y: 'pixetto.getPosY()',
			LEFT_X: 'pixetto.getLanesField(Pixetto::LANES_LX1)',
			RIGHT_X: 'pixetto.getLanesField(Pixetto::LANES_RX1)',
		};

		const code = roadFunctions[roadInfo];
		return [code, window.arduinoGenerator.ORDER_ATOMIC];
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
			COLOR_DETECTION: 'FUNC_COLOR_DETECTION',
			SHAPE_DETECTION: 'FUNC_SHAPE_DETECTION',
			FACE_DETECTION: 'FUNC_FACE_DETECTION',
			APRILTAG_DETECTION: 'FUNC_APRILTAG',
			NEURAL_NETWORK: 'FUNC_NEURAL_NETWORK',
			HANDWRITTEN_DIGIT: 'FUNC_HANDWRITTEN_DIGITS_DETECTION',
			ROAD_DETECTION: 'FUNC_LANES_DETECTION',
			BALL_DETECTION: 'FUNC_SPHERE_DETECTION',
			TEMPLATE_MATCHING: 'FUNC_TEMPLATE_MATCHING',
		};

		const code = `pixetto.enableFunc(Pixetto::${modeCodes[mode]});\n`;
		return code;
	} catch (error) {
		log.error('pixetto_set_mode 代碼生成錯誤:', error);
		return '';
	}
};
