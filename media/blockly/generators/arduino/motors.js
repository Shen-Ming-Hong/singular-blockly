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
		// 註冊 encoder_setup 和 encoder_pid_setup 積木
		window.arduinoGenerator.registerAlwaysGenerateBlock('encoder_setup');
		window.arduinoGenerator.registerAlwaysGenerateBlock('encoder_pid_setup');
	} else {
		// 如果 arduinoGenerator 尚未初始化，則設置一個載入完成後執行的回調
		window.addEventListener('load', function () {
			if (window.arduinoGenerator && typeof window.arduinoGenerator.registerAlwaysGenerateBlock === 'function') {
				window.arduinoGenerator.registerAlwaysGenerateBlock('servo_setup');
				window.arduinoGenerator.registerAlwaysGenerateBlock('encoder_setup');
				window.arduinoGenerator.registerAlwaysGenerateBlock('encoder_pid_setup');
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

// 編碼馬達設定積木的程式碼生成器
window.arduinoGenerator.forBlock['encoder_setup'] = function (block) {
	try {
		const varName = block.getFieldValue('VAR');
		const pinA = block.getFieldValue('PIN_A');
		const pinB = block.getFieldValue('PIN_B');
		const useInterrupt = block.getFieldValue('USE_INTERRUPT') === 'TRUE';
		const currentBoard = window.getCurrentBoard();
		// 添加對編碼馬達引腳的註釋說明
		if (useInterrupt) {
			window.arduinoGenerator.comments_['encoder_pin'] = '// 注意：編碼馬達已設定使用支援硬體中斷的引腳\n';
		} else {
			window.arduinoGenerator.comments_['encoder_pin'] = '// 注意：建議將編碼馬達連接到支援硬體中斷的引腳以獲得更好的效能\n';
		}

		// 根據開發板選擇適當的編碼馬達庫
		if (currentBoard === 'esp32') {			// 使用 ESP32 專用的編碼馬達庫
			window.arduinoGenerator.includes_['encoder'] = '#include <ESP32Encoder.h>';

			// 在 lib_deps 中添加 ESP32Encoder 庫
			if (!window.arduinoGenerator.lib_deps_) {
				window.arduinoGenerator.lib_deps_ = [];
			}
			if (!window.arduinoGenerator.lib_deps_.includes('madhephaestus/ESP32Encoder@^0.11.7')) {
				window.arduinoGenerator.lib_deps_.push('madhephaestus/ESP32Encoder@^0.11.7');
			}

			// 宣告編碼馬達變數
			window.arduinoGenerator.variables_['encoder_' + varName] = `ESP32Encoder ${varName};`;			// 設置 ESP32 編碼馬達
			window.arduinoGenerator.setupCode_.push(`// 設定編碼馬達 ${varName}`);
			window.arduinoGenerator.setupCode_.push(`ESP32Encoder::useInternalWeakPullResistors=puType::up;`);
			window.arduinoGenerator.setupCode_.push(`${varName}.attachHalfQuad(${pinA}, ${pinB});`);
			window.arduinoGenerator.setupCode_.push(`${varName}.clearCount();`);
		} else {// 標準 Arduino 開發板的編碼馬達庫
			window.arduinoGenerator.includes_['encoder'] = '#include <Encoder.h>';

			// 在 lib_deps 中添加標準 Encoder 庫
			if (!window.arduinoGenerator.lib_deps_) {
				window.arduinoGenerator.lib_deps_ = [];
			}
			if (!window.arduinoGenerator.lib_deps_.includes('paulstoffregen/Encoder@^1.4.4')) {
				window.arduinoGenerator.lib_deps_.push('paulstoffregen/Encoder@^1.4.4');
			}

			// 宣告編碼馬達變數
			window.arduinoGenerator.variables_['encoder_' + varName] = `Encoder ${varName}(${pinA}, ${pinB});`;
		}

		return '';
	} catch (e) {
		log.error('Encoder setup code generation error:', e);
		return '';
	}
};

// 讀取編碼馬達位置積木的程式碼生成器
window.arduinoGenerator.forBlock['encoder_read'] = function (block) {
	try {
		const varName = block.getFieldValue('VAR');
		const currentBoard = window.getCurrentBoard();

		// 根據開發板選擇適當的編碼馬達庫
		if (currentBoard === 'esp32') {
			window.arduinoGenerator.includes_['encoder'] = '#include <ESP32Encoder.h>';
			return [`${varName}.getCount()`, window.arduinoGenerator.ORDER_FUNCTION_CALL];
		} else {
			window.arduinoGenerator.includes_['encoder'] = '#include <Encoder.h>';
			return [`${varName}.read()`, window.arduinoGenerator.ORDER_FUNCTION_CALL];
		}
	} catch (e) {
		log.error('Encoder read code generation error:', e);
		return ['0', window.arduinoGenerator.ORDER_ATOMIC];
	}
};

// 重設編碼馬達積木的程式碼生成器
window.arduinoGenerator.forBlock['encoder_reset'] = function (block) {
	try {
		const varName = block.getFieldValue('VAR');
		const currentBoard = window.getCurrentBoard();

		// 根據開發板選擇適當的編碼馬達庫
		if (currentBoard === 'esp32') {
			window.arduinoGenerator.includes_['encoder'] = '#include <ESP32Encoder.h>';
			return `${varName}.clearCount();\n`;
		} else {
			window.arduinoGenerator.includes_['encoder'] = '#include <Encoder.h>';
			return `${varName}.write(0);\n`;
		}
	} catch (e) {
		log.error('Encoder reset code generation error:', e);
		return '';
	}
};

// PID控制器設定積木的程式碼生成器
window.arduinoGenerator.forBlock['encoder_pid_setup'] = function (block) {
	try {
		const pidVarName = block.getFieldValue('PID_VAR');
		const encoderVarName = block.getFieldValue('VAR');
		const kp = block.getFieldValue('KP');
		const ki = block.getFieldValue('KI');
		const kd = block.getFieldValue('KD');
		const currentBoard = window.getCurrentBoard();

		// 添加 QuickPID 庫
		window.arduinoGenerator.includes_['quickpid'] = '#include <QuickPID.h>';
		// 在 lib_deps 中添加 QuickPID 庫
		if (!window.arduinoGenerator.lib_deps_) {
			window.arduinoGenerator.lib_deps_ = [];
		}
		if (!window.arduinoGenerator.lib_deps_.includes('Dlloydev/QuickPID@^3.1.9')) {
			window.arduinoGenerator.lib_deps_.push('Dlloydev/QuickPID@^3.1.9');
		}

		// 宣告 PID 控制器變數和所需的輸入輸出變數
		window.arduinoGenerator.variables_[`pid_input_${pidVarName}`] = `float ${pidVarName}_input = 0;`;
		window.arduinoGenerator.variables_[`pid_setpoint_${pidVarName}`] = `float ${pidVarName}_setpoint = 0;`;
		window.arduinoGenerator.variables_[`pid_output_${pidVarName}`] = `float ${pidVarName}_output = 0;`;
		window.arduinoGenerator.variables_[`pid_${pidVarName}`] = `QuickPID ${pidVarName}(&${pidVarName}_input, &${pidVarName}_output, &${pidVarName}_setpoint, ${kp}, ${ki}, ${kd}, QuickPID::DIRECT);`;

		// 設置 PID 控制器
		window.arduinoGenerator.setupCode_.push(`// 設定PID控制器 ${pidVarName} 用於編碼馬達 ${encoderVarName}`);
		window.arduinoGenerator.setupCode_.push(`${pidVarName}.SetMode(QuickPID::AUTOMATIC);`);
		window.arduinoGenerator.setupCode_.push(`${pidVarName}.SetOutputLimits(-255, 255);`);
		window.arduinoGenerator.setupCode_.push(`${pidVarName}.SetSampleTimeUs(10000);  // 10ms 更新頻率`);

		return '';
	} catch (e) {
		log.error('Encoder PID setup code generation error:', e);
		return '';
	}
};

// 計算PID積木的程式碼生成器
window.arduinoGenerator.forBlock['encoder_pid_compute'] = function (block) {
	try {
		const pidVarName = block.getFieldValue('PID_VAR');
		const targetValue = window.arduinoGenerator.valueToCode(block, 'TARGET', window.arduinoGenerator.ORDER_NONE) || '0';
		
		// 生成 PID 計算代碼
		let code = `// 更新PID設定點和輸入值\n`;
		code += `${pidVarName}_setpoint = ${targetValue};\n`;
		code += `// 此處需要根據實際情況取得當前馬達位置的輸入值\n`;
		code += `// (由於無法直接從積木中獲取對應的編碼馬達名稱，用戶需要自行更新此行)\n`;
		code += `// ${pidVarName}_input = encoderName.read() 或 encoderName.getCount();\n`;
		code += `// 計算PID輸出\n`;
		code += `${pidVarName}.Compute();\n`;
		
		// 返回PID計算的輸出值
		return [`${pidVarName}_output`, window.arduinoGenerator.ORDER_ATOMIC];
	} catch (e) {
		log.error('Encoder PID compute code generation error:', e);
		return ['0', window.arduinoGenerator.ORDER_ATOMIC];
	}
};
