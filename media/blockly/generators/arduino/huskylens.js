/**
 * @license
 * Copyright 2025 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

// 此檔案依賴 WebView 環境中的全域 log 物件進行日誌記錄
// log 物件在 blocklyEdit.js 和 blocklyPreview.js 中定義

// 模組載入時自動註冊需要強制掃描的積木類型
(function () {
	// 延遲註冊，等待 arduinoGenerator 完全載入
	function registerBlocks() {
		if (window.arduinoGenerator && typeof window.arduinoGenerator.registerAlwaysGenerateBlock === 'function') {
			// 註冊 HUSKYLENS 相關積木
			window.arduinoGenerator.registerAlwaysGenerateBlock('huskylens_init_i2c');
			window.arduinoGenerator.registerAlwaysGenerateBlock('huskylens_init_uart');
			window.arduinoGenerator.registerAlwaysGenerateBlock('huskylens_set_algorithm');
			window.arduinoGenerator.registerAlwaysGenerateBlock('huskylens_request');
			window.arduinoGenerator.registerAlwaysGenerateBlock('huskylens_is_learned');
			window.arduinoGenerator.registerAlwaysGenerateBlock('huskylens_count_blocks');
			window.arduinoGenerator.registerAlwaysGenerateBlock('huskylens_get_block_info');
			window.arduinoGenerator.registerAlwaysGenerateBlock('huskylens_count_arrows');
			window.arduinoGenerator.registerAlwaysGenerateBlock('huskylens_get_arrow_info');
			window.arduinoGenerator.registerAlwaysGenerateBlock('huskylens_learn');
			window.arduinoGenerator.registerAlwaysGenerateBlock('huskylens_forget');
			return true;
		}
		return false;
	}

	// 嘗試立即註冊
	if (!registerBlocks()) {
		// 如果立即註冊失敗，設置多種監聽器
		window.addEventListener('load', registerBlocks);

		// 設置定時器作為備用機制
		let retryCount = 0;
		const maxRetries = 10;
		const retryInterval = setInterval(() => {
			if (registerBlocks() || retryCount >= maxRetries) {
				clearInterval(retryInterval);
			}
			retryCount++;
		}, 100);
	}
})();

// HUSKYLENS I2C 初始化代碼生成
window.arduinoGenerator.forBlock['huskylens_init_i2c'] = function (block) {
	try {
		// 確保 arduinoGenerator 存在且完全初始化
		if (!window.arduinoGenerator || typeof window.arduinoGenerator !== 'object') {
			log.error('Arduino generator not initialized');
			return '// Error: Arduino generator not available\n';
		}

		// 確保各種屬性存在，使用安全的方式
		try {
			if (!window.arduinoGenerator.includes_) {
				window.arduinoGenerator.includes_ = {};
			}
			if (!window.arduinoGenerator.variables_) {
				window.arduinoGenerator.variables_ = {};
			}
			if (!window.arduinoGenerator.setupCode_) {
				window.arduinoGenerator.setupCode_ = [];
			}
			if (!window.arduinoGenerator.lib_deps_) {
				window.arduinoGenerator.lib_deps_ = [];
			}
		} catch (initError) {
			log.error('Error initializing arduinoGenerator properties:', initError);
			return '// Error: Failed to initialize generator properties\n';
		}

		// 添加必要的函式庫,並抑制第三方庫的警告 (避免重複添加)
		if (!window.arduinoGenerator.includes_['huskylens_pragma_start']) {
			window.arduinoGenerator.includes_['huskylens_pragma_start'] =
				'#pragma GCC diagnostic push\n#pragma GCC diagnostic ignored "-Wreturn-type"\n#pragma GCC diagnostic ignored "-Wunused-variable"';
		}
		if (!window.arduinoGenerator.includes_['huskylens']) {
			window.arduinoGenerator.includes_['huskylens'] = '#include <HUSKYLENS.h>';
		}
		if (!window.arduinoGenerator.includes_['huskylens_pragma_end']) {
			window.arduinoGenerator.includes_['huskylens_pragma_end'] = '#pragma GCC diagnostic pop';
		}
		if (!window.arduinoGenerator.includes_['wire']) {
			window.arduinoGenerator.includes_['wire'] = '#include "Wire.h"';
		}

		// 在 lib_deps 中添加 HUSKYLENS 庫 (已有去重檢查)
		if (!window.arduinoGenerator.lib_deps_.includes('https://github.com/HuskyLens/HUSKYLENSArduino/archive/refs/heads/master.zip')) {
			window.arduinoGenerator.lib_deps_.push('https://github.com/HuskyLens/HUSKYLENSArduino/archive/refs/heads/master.zip');
		}

		// 全域變數宣告 (避免重複宣告)
		if (!window.arduinoGenerator.variables_['huskylens_obj']) {
			window.arduinoGenerator.variables_['huskylens_obj'] = 'HUSKYLENS huskylens;';
		}

		// 初始化代碼
		const initCode = `  // 初始化 HUSKYLENS (I2C)
  Serial.begin(9600);
  Wire.begin();
  while (!huskylens.begin(Wire)) {
    Serial.println(F("HUSKYLENS 初始化失敗，請檢查連線！"));
    Serial.println(F("1. 檢查接線是否正確？"));
    Serial.println(F("2. 檢查 HUSKYLENS 是否正常工作？"));
    delay(100);
  }
  Serial.println(F("HUSKYLENS 初始化成功！"));`;

		// 確保 setupCode_ 存在
		if (!window.arduinoGenerator.setupCode_) {
			window.arduinoGenerator.setupCode_ = [];
		}

		// 加入初始化代碼，避免重複
		if (!window.arduinoGenerator.setupCode_.includes(initCode)) {
			window.arduinoGenerator.setupCode_.push(initCode);
		}
		return '';
	} catch (error) {
		log.error('Error generating huskylens_init_i2c code:', error);
		return '// Error: ' + error.message + '\n';
	}
};

// HUSKYLENS UART 初始化代碼生成
window.arduinoGenerator.forBlock['huskylens_init_uart'] = function (block) {
	try {
		const rxPin = block.getFieldValue('RX_PIN');
		const txPin = block.getFieldValue('TX_PIN');
		// 確保 arduinoGenerator 存在且完全初始化
		if (!window.arduinoGenerator || typeof window.arduinoGenerator !== 'object') {
			log.error('Arduino generator not initialized');
			return '// Error: Arduino generator not available\n';
		}

		// 確保各種屬性存在，使用安全的方式
		try {
			if (!window.arduinoGenerator.includes_) {
				window.arduinoGenerator.includes_ = {};
			}
			if (!window.arduinoGenerator.variables_) {
				window.arduinoGenerator.variables_ = {};
			}
			if (!window.arduinoGenerator.setupCode_) {
				window.arduinoGenerator.setupCode_ = [];
			}
			if (!window.arduinoGenerator.lib_deps_) {
				window.arduinoGenerator.lib_deps_ = [];
			}
		} catch (initError) {
			log.error('Error initializing arduinoGenerator properties:', initError);
			return '// Error: Failed to initialize generator properties\n';
		}

		// 添加必要的函式庫,並抑制第三方庫的警告 (避免重複添加)
		if (!window.arduinoGenerator.includes_['huskylens_pragma_start']) {
			window.arduinoGenerator.includes_['huskylens_pragma_start'] =
				'#pragma GCC diagnostic push\n#pragma GCC diagnostic ignored "-Wreturn-type"\n#pragma GCC diagnostic ignored "-Wunused-variable"';
		}
		if (!window.arduinoGenerator.includes_['huskylens']) {
			window.arduinoGenerator.includes_['huskylens'] = '#include <HUSKYLENS.h>';
		}
		if (!window.arduinoGenerator.includes_['huskylens_pragma_end']) {
			window.arduinoGenerator.includes_['huskylens_pragma_end'] = '#pragma GCC diagnostic pop';
		}

		// 在 lib_deps 中添加 HUSKYLENS 庫 (已有去重檢查)
		if (!window.arduinoGenerator.lib_deps_.includes('https://github.com/HuskyLens/HUSKYLENSArduino/archive/refs/heads/master.zip')) {
			window.arduinoGenerator.lib_deps_.push('https://github.com/HuskyLens/HUSKYLENSArduino/archive/refs/heads/master.zip');
		}

		// 檢測開發板類型以使用正確的串列埠實作
		const currentBoard = window.currentBoard || 'uno';
		const isESP32 = currentBoard.includes('esp32');

		let initCode;

		if (isESP32) {
			// ESP32 使用 HardwareSerial (不支援 SoftwareSerial) - 避免重複宣告
			if (!window.arduinoGenerator.variables_['huskylens_serial']) {
				window.arduinoGenerator.variables_['huskylens_serial'] = 'HardwareSerial huskySerial(1);';
			}
			if (!window.arduinoGenerator.variables_['huskylens_obj']) {
				window.arduinoGenerator.variables_['huskylens_obj'] = 'HUSKYLENS huskylens;';
			}

			initCode = `  // 初始化 HUSKYLENS (UART - ESP32 使用 HardwareSerial)
  Serial.begin(9600);
  huskySerial.begin(9600, SERIAL_8N1, ${rxPin}, ${txPin});
  while (!huskylens.begin(huskySerial)) {
    Serial.println(F("HUSKYLENS 初始化失敗，請檢查連線！"));
    Serial.println(F("1. 檢查接線是否正確？"));
    Serial.println(F("2. 檢查 HUSKYLENS 是否正常工作？"));
    delay(100);
  }
  Serial.println(F("HUSKYLENS 初始化成功！"));`;
		} else {
			// Arduino AVR 使用 SoftwareSerial - 避免重複添加/宣告
			if (!window.arduinoGenerator.includes_['softwareserial']) {
				window.arduinoGenerator.includes_['softwareserial'] = '#include <SoftwareSerial.h>';
			}
			if (!window.arduinoGenerator.variables_['huskylens_serial']) {
				window.arduinoGenerator.variables_['huskylens_serial'] = `SoftwareSerial huskySerial(${rxPin}, ${txPin});`;
			}
			if (!window.arduinoGenerator.variables_['huskylens_obj']) {
				window.arduinoGenerator.variables_['huskylens_obj'] = 'HUSKYLENS huskylens;';
			}

			initCode = `  // 初始化 HUSKYLENS (UART - Arduino AVR 使用 SoftwareSerial)
  Serial.begin(9600);
  huskySerial.begin(9600);
  while (!huskylens.begin(huskySerial)) {
    Serial.println(F("HUSKYLENS 初始化失敗，請檢查連線！"));
    Serial.println(F("1. 檢查接線是否正確？"));
    Serial.println(F("2. 檢查 HUSKYLENS 是否正常工作？"));
    delay(100);
  }
  Serial.println(F("HUSKYLENS 初始化成功！"));`;
		}

		// 確保 setupCode_ 存在
		if (!window.arduinoGenerator.setupCode_) {
			window.arduinoGenerator.setupCode_ = [];
		}

		// 加入初始化代碼，避免重複
		if (!window.arduinoGenerator.setupCode_.includes(initCode)) {
			window.arduinoGenerator.setupCode_.push(initCode);
		}
		return '';
	} catch (error) {
		log.error('Error generating huskylens_init_uart code:', error);
		return '// Error: ' + error.message + '\n';
	}
};

// HUSKYLENS 設定演算法代碼生成
window.arduinoGenerator.forBlock['huskylens_set_algorithm'] = function (block) {
	try {
		const algorithm = block.getFieldValue('ALGORITHM');
		const code = `huskylens.writeAlgorithm(${algorithm});\n`;
		return code;
	} catch (error) {
		log.error('Error generating huskylens_set_algorithm code:', error);
		return '// Error: ' + error.message + '\n';
	}
};

// HUSKYLENS 請求資料代碼生成
window.arduinoGenerator.forBlock['huskylens_request'] = function (block) {
	try {
		const code = `huskylens.request();\n`;
		return code;
	} catch (error) {
		log.error('Error generating huskylens_request code:', error);
		return '// Error: ' + error.message + '\n';
	}
};

// HUSKYLENS 是否學習過代碼生成
window.arduinoGenerator.forBlock['huskylens_is_learned'] = function (block) {
	try {
		const code = `huskylens.isLearned()`;
		return [code, window.arduinoGenerator.ORDER_ATOMIC];
	} catch (error) {
		log.error('Error generating huskylens_is_learned code:', error);
		return ['false', window.arduinoGenerator.ORDER_ATOMIC];
	}
};

// HUSKYLENS 方塊數量代碼生成
window.arduinoGenerator.forBlock['huskylens_count_blocks'] = function (block) {
	try {
		const code = `huskylens.countBlocks()`;
		return [code, window.arduinoGenerator.ORDER_ATOMIC];
	} catch (error) {
		log.error('Error generating huskylens_count_blocks code:', error);
		return ['0', window.arduinoGenerator.ORDER_ATOMIC];
	}
};

// HUSKYLENS 方塊資訊代碼生成
window.arduinoGenerator.forBlock['huskylens_get_block_info'] = function (block) {
	try {
		const index = window.arduinoGenerator.valueToCode(block, 'INDEX', window.arduinoGenerator.ORDER_ATOMIC) || '0';
		const infoType = block.getFieldValue('INFO_TYPE');
		// 注意: HUSKYLENSArduino 函式庫使用 .ID (大寫) 而非 .id
		const code = `huskylens.getBlock(${index}).${infoType}`;
		return [code, window.arduinoGenerator.ORDER_ATOMIC];
	} catch (error) {
		log.error('Error generating huskylens_get_block_info code:', error);
		return ['0', window.arduinoGenerator.ORDER_ATOMIC];
	}
};

// HUSKYLENS 箭頭數量代碼生成
window.arduinoGenerator.forBlock['huskylens_count_arrows'] = function (block) {
	try {
		const code = `huskylens.countArrows()`;
		return [code, window.arduinoGenerator.ORDER_ATOMIC];
	} catch (error) {
		log.error('Error generating huskylens_count_arrows code:', error);
		return ['0', window.arduinoGenerator.ORDER_ATOMIC];
	}
};

// HUSKYLENS 箭頭資訊代碼生成
window.arduinoGenerator.forBlock['huskylens_get_arrow_info'] = function (block) {
	try {
		const index = window.arduinoGenerator.valueToCode(block, 'INDEX', window.arduinoGenerator.ORDER_ATOMIC) || '0';
		const infoType = block.getFieldValue('INFO_TYPE');
		// 注意: HUSKYLENSArduino 函式庫使用 .ID (大寫) 而非 .id
		const code = `huskylens.getArrow(${index}).${infoType}`;
		return [code, window.arduinoGenerator.ORDER_ATOMIC];
	} catch (error) {
		log.error('Error generating huskylens_get_arrow_info code:', error);
		return ['0', window.arduinoGenerator.ORDER_ATOMIC];
	}
};

// HUSKYLENS 學習物體代碼生成
window.arduinoGenerator.forBlock['huskylens_learn'] = function (block) {
	try {
		const id = window.arduinoGenerator.valueToCode(block, 'ID', window.arduinoGenerator.ORDER_ATOMIC) || '1';
		const code = `huskylens.writeLearn(${id});\n`;
		return code;
	} catch (error) {
		log.error('Error generating huskylens_learn code:', error);
		return '// Error: ' + error.message + '\n';
	}
};

// HUSKYLENS 忘記所有代碼生成
window.arduinoGenerator.forBlock['huskylens_forget'] = function (block) {
	try {
		const code = `huskylens.writeForget();\n`;
		return code;
	} catch (error) {
		log.error('Error generating huskylens_forget code:', error);
		return '// Error: ' + error.message + '\n';
	}
};
