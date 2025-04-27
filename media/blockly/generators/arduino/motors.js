/**
 * @license
 * Copyright 2025 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

// 模組載入時自動註冊需要強制掃描的積木類型
(function () {
	// 確保 arduinoGenerator 已初始化
	if (window.arduinoGenerator && typeof window.arduinoGenerator.registerAlwaysGenerateBlock === 'function') {
		// 註冊 servo_setup 積木
		window.arduinoGenerator.registerAlwaysGenerateBlock('servo_setup');
	} else {
		// 如果 arduinoGenerator 尚未初始化，則設置一個載入完成後執行的回調
		window.addEventListener('load', function () {
			if (window.arduinoGenerator && typeof window.arduinoGenerator.registerAlwaysGenerateBlock === 'function') {
				window.arduinoGenerator.registerAlwaysGenerateBlock('servo_setup');
			}
		});
	}
})();

window.arduinoGenerator.forBlock['servo_setup'] = function (block) {
	try {
		const varName = block.getFieldValue('VAR');
		const pin = block.getFieldValue('PIN');
		const currentBoard = window.getCurrentBoard();

		// 添加對伺服馬達引腳的註釋說明
		window.arduinoGenerator.comments_['servo_pin'] = '// 注意：伺服馬達需要PWM（脈衝寬度調變）輸出腳位\n';

		// 根據開發板選擇適當的伺服馬達庫
		if (currentBoard === 'esp32') {
			// 使用 ESP32 專用的伺服馬達庫
			window.arduinoGenerator.includes_['servo'] = '#include <ESP32Servo.h>';

			// 需要為 ESP32 設置定時器
			window.arduinoGenerator.setupCode_.unshift('// 允許分配所有定時器');
			window.arduinoGenerator.setupCode_.unshift('ESP32PWM::allocateTimer(0);');
			window.arduinoGenerator.setupCode_.unshift('ESP32PWM::allocateTimer(1);');
			window.arduinoGenerator.setupCode_.unshift('ESP32PWM::allocateTimer(2);');
			window.arduinoGenerator.setupCode_.unshift('ESP32PWM::allocateTimer(3);');

			// 在 lib_deps 中添加 ESP32Servo 庫
			if (!window.arduinoGenerator.lib_deps_) {
				window.arduinoGenerator.lib_deps_ = [];
			}
			if (!window.arduinoGenerator.lib_deps_.includes('madhephaestus/ESP32Servo@^3.0.6')) {
				window.arduinoGenerator.lib_deps_.push('madhephaestus/ESP32Servo@^3.0.6');
			}
		} else {
			// 標準 Arduino 開發板的伺服馬達庫
			window.arduinoGenerator.includes_['servo'] = '#include <Servo.h>';

			// 在 lib_deps 中添加標準 Servo 庫
			if (!window.arduinoGenerator.lib_deps_) {
				window.arduinoGenerator.lib_deps_ = [];
			}
			if (!window.arduinoGenerator.lib_deps_.includes('arduino-libraries/Servo@^1.2.2')) {
				window.arduinoGenerator.lib_deps_.push('arduino-libraries/Servo@^1.2.2');
			}
		}

		// Declare servo variable (相同適用於所有開發板)
		window.arduinoGenerator.variables_['servo_' + varName] = `Servo ${varName};`;

		// 根據開發板設置伺服馬達
		if (currentBoard === 'esp32') {
			// ESP32 需要設置 PWM 頻率
			window.arduinoGenerator.setupCode_.push(`${varName}.setPeriodHertz(50);  // 標準 50hz 伺服馬達`);
			window.arduinoGenerator.setupCode_.push(
				`${varName}.attach(${pin}, 500, 2400);  // 使用 SG90 伺服馬達的最小/最大值 500us 和 2400us`
			);
		} else {
			// 標準 Arduino 設置
			window.arduinoGenerator.setupCode_.push(`${varName}.attach(${pin});`);
		}

		return '';
	} catch (e) {
		log.error('Servo setup code generation error:', e);
		return '';
	}
};

window.arduinoGenerator.forBlock['servo_move'] = function (block) {
	try {
		const varName = block.getFieldValue('VAR');
		const angle = block.getFieldValue('ANGLE');
		const currentBoard = window.getCurrentBoard();

		// 根據開發板選擇適當的伺服馬達庫
		if (currentBoard === 'esp32') {
			window.arduinoGenerator.includes_['servo'] = '#include <ESP32Servo.h>';
		} else {
			window.arduinoGenerator.includes_['servo'] = '#include <Servo.h>';
		}

		// 移動伺服馬達的程式碼對所有開發板都相同
		return `${varName}.write(${angle});\n`;
	} catch (e) {
		log.error('Servo move code generation error:', e);
		return '';
	}
};

// 新增伺服馬達停止積木的程式碼生成器
window.arduinoGenerator.forBlock['servo_stop'] = function (block) {
	try {
		const varName = block.getFieldValue('VAR');
		const currentBoard = window.getCurrentBoard();

		// 根據開發板選擇適當的伺服馬達庫
		if (currentBoard === 'esp32') {
			window.arduinoGenerator.includes_['servo'] = '#include <ESP32Servo.h>';
		} else {
			window.arduinoGenerator.includes_['servo'] = '#include <Servo.h>';
		}

		// 停止伺服馬達輸出的程式碼對所有開發板都相同
		return `${varName}.detach();\n`;
	} catch (e) {
		log.error('Servo stop code generation error:', e);
		return '';
	}
};
