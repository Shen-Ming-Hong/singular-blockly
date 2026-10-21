/**
 * @license
 * Copyright 2025 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

// 模組載入時自動註冊需要強制掃描的積木類型
(function () {
	// 確保 arduinoGenerator 已初始化
	if (window.arduinoGenerator && typeof window.arduinoGenerator.registerAlwaysGenerateBlock === 'function') {
		// 註冊超音波相關積木
		window.arduinoGenerator.registerAlwaysGenerateBlock('ultrasonic_sensor');
		// 也註冊超音波觸發和讀取積木，確保它們能找到超音波感測器積木
		window.arduinoGenerator.registerAlwaysGenerateBlock('ultrasonic_trigger');
		window.arduinoGenerator.registerAlwaysGenerateBlock('ultrasonic_read');
	} else {
		// 如果 arduinoGenerator 尚未初始化，則設置一個載入完成後執行的回調
		window.addEventListener('load', function () {
			if (window.arduinoGenerator && typeof window.arduinoGenerator.registerAlwaysGenerateBlock === 'function') {
				window.arduinoGenerator.registerAlwaysGenerateBlock('ultrasonic_sensor');
				window.arduinoGenerator.registerAlwaysGenerateBlock('ultrasonic_trigger');
				window.arduinoGenerator.registerAlwaysGenerateBlock('ultrasonic_read');
			}
		});
	}
})();

window.arduinoGenerator.forBlock['ultrasonic_sensor'] = function (block) {
	try {
		const trigPin = block.getFieldValue('TRIG_PIN');
		const echoPin = block.getFieldValue('ECHO_PIN');
		const useInterrupt = block.getFieldValue('USE_INTERRUPT') === 'TRUE';

		log.info(`ultrasonic_sensor: 設定超音波感測器，Trig=${trigPin}, Echo=${echoPin}, 使用中斷=${useInterrupt}`);

		// 檢查腳位模式 - Trig 腳位需要 OUTPUT 模式、Echo 腳位需要 INPUT 模式
		window.arduinoGenerator.checkPinMode(trigPin, 'OUTPUT');
		window.arduinoGenerator.checkPinMode(echoPin, 'INPUT');

		// 定義全域變數
		window.arduinoGenerator.variables_['ultrasonic_vars'] = `
// Ultrasonic sensor variables
const int ultrasonic_trigPin = ${trigPin};  // Ultrasonic Trig pin
const int ultrasonic_echoPin = ${echoPin};  // Ultrasonic Echo pin
float ultrasonic_distance = 0;  // Last measured distance
`;
		// 如果使用中斷
		if (useInterrupt) {
			log.info('ultrasonic_sensor: 使用中斷模式，設定中斷相關變數和函數');
			window.arduinoGenerator.variables_['ultrasonic_interrupt_vars'] = `
// Ultrasonic interrupt-mode variables
volatile unsigned long ultrasonic_echoStart = 0;  // Echo start time
volatile unsigned long ultrasonic_echoEnd = 0;    // Echo end time
`;

			// 中斷處理函數
			window.arduinoGenerator.functions_['ultrasonic_echo_isr'] = `
void ultrasonicEchoISR() {
  if (digitalRead(ultrasonic_echoPin) == HIGH) {
    // Record echo start time
    ultrasonic_echoStart = micros();
  } else {
    // Record echo end time
    ultrasonic_echoEnd = micros();
    // Compute pulse duration
    unsigned long duration = ultrasonic_echoEnd - ultrasonic_echoStart;
    // Distance = (duration / 2) / 29.1 (speed of sound, cm/µs)
    ultrasonic_distance = (duration / 2.0) / 29.1;
  }
}
`;

			// 在 setup 區塊中添加中斷設定，不再重複 pinMode
			window.arduinoGenerator.setupCode_.push(`
  // Attach ultrasonic sensor interrupt
  attachInterrupt(digitalPinToInterrupt(${echoPin}), ultrasonicEchoISR, CHANGE);
`);
		} else {
			// 非中斷模式下，不需要在 setup 中重複設定腳位，因為已經由 pinModeTracker 處理
			// 添加測距函數
			log.info('ultrasonic_sensor: 使用非中斷模式，設定測距函數');
			window.arduinoGenerator.functions_['ultrasonic_measure'] = `
// Measure ultrasonic distance
float ultrasonicMeasureDistance() {
  // Send a 10 µs trigger pulse
  digitalWrite(ultrasonic_trigPin, LOW);
  delayMicroseconds(2);
  digitalWrite(ultrasonic_trigPin, HIGH);
  delayMicroseconds(10);
  digitalWrite(ultrasonic_trigPin, LOW);
  
  // Measure echo time
  unsigned long duration = pulseIn(ultrasonic_echoPin, HIGH);
  
  // Distance = (duration / 2) / 29.1 (speed of sound, cm/µs)
  return (duration / 2.0) / 29.1;
}
`;
		}

		log.info('ultrasonic_sensor: 完成超音波感測器設定');
		return '';
	} catch (e) {
		log.error('ultrasonic_sensor: 程式碼生成錯誤', e);
		return ''; // 發生錯誤時返回空字串
	}
};

window.arduinoGenerator.forBlock['ultrasonic_read'] = function (block) {
	try {
		let hasSensorBlock = false;

		// 檢查是否已經定義了變數
		if (window.arduinoGenerator.variables_['ultrasonic_vars']) {
			hasSensorBlock = true;
			log.info('ultrasonic_read: 已找到超音波變數，直接使用');
		} else {
			// 在工作區中搜索超音波感測器積木
			const workspace = block.workspace;
			if (workspace) {
				const sensorBlocks = workspace.getBlocksByType('ultrasonic_sensor', false);
				hasSensorBlock = sensorBlocks.length > 0;

				if (hasSensorBlock) {
					log.info(`ultrasonic_read: 找到 ${sensorBlocks.length} 個超音波感測器積木，但尚未設定變數`);

					// 嘗試調用 ultrasonic_sensor 的處理函式設定變數
					if (
						!window.arduinoGenerator.variables_['ultrasonic_vars'] &&
						typeof window.arduinoGenerator.forBlock['ultrasonic_sensor'] === 'function'
					) {
						try {
							log.info('ultrasonic_read: 嘗試調用超音波感測器積木處理函式');
							window.arduinoGenerator.forBlock['ultrasonic_sensor'](sensorBlocks[0]);
						} catch (err) {
							log.warn('ultrasonic_read: 調用處理函式失敗', err);
						}
					}

					// 確認變數是否已設定
					hasSensorBlock = !!window.arduinoGenerator.variables_['ultrasonic_vars'];
				}
			}
		}

		// 如果仍然沒有找到或設定感測器，顯示警告
		if (!hasSensorBlock) {
			window.arduinoGenerator.warnings_.push('Reading ultrasonic distance without an ultrasonic sensor setup block. Add the ultrasonic sensor setup block first.');
			log.warn('ultrasonic_read: 未能設定超音波感測器變數');
			return ['0', window.arduinoGenerator.ORDER_ATOMIC]; // 返回安全的默認值
		} // 判斷使用哪種模式讀取距離
		if (window.arduinoGenerator.variables_['ultrasonic_interrupt_vars']) {
			// 中斷模式直接返回變數
			log.info('ultrasonic_read: 使用中斷模式讀取距離');
			return ['ultrasonic_distance', window.arduinoGenerator.ORDER_ATOMIC];
		} else {
			// 非中斷模式調用測量函數
			log.info('ultrasonic_read: 使用測量函數讀取距離');
			return ['ultrasonicMeasureDistance()', window.arduinoGenerator.ORDER_ATOMIC];
		}
	} catch (e) {
		log.error('ultrasonic_read: 程式碼生成錯誤', e);
		return ['0', window.arduinoGenerator.ORDER_ATOMIC]; // 發生錯誤時返回安全的默認值
	}
};

// 新增獨立的超音波觸發積木
window.arduinoGenerator.forBlock['ultrasonic_trigger'] = function (block) {
	try {
		let hasSensorBlock = false;

		// 檢查是否已經定義了變數
		if (window.arduinoGenerator.variables_['ultrasonic_vars']) {
			hasSensorBlock = true;
			log.info('ultrasonic_trigger: 已找到超音波變數，直接使用');
		} else {
			// 在工作區中搜索超音波感測器積木
			const workspace = block.workspace;
			if (workspace) {
				const sensorBlocks = workspace.getBlocksByType('ultrasonic_sensor', false);
				hasSensorBlock = sensorBlocks.length > 0;

				if (hasSensorBlock) {
					log.info(`ultrasonic_trigger: 找到 ${sensorBlocks.length} 個超音波感測器積木，但尚未設定變數`);

					// 嘗試調用 ultrasonic_sensor 的處理函式設定變數
					if (
						!window.arduinoGenerator.variables_['ultrasonic_vars'] &&
						typeof window.arduinoGenerator.forBlock['ultrasonic_sensor'] === 'function'
					) {
						try {
							log.info('ultrasonic_trigger: 嘗試調用超音波感測器積木處理函式');
							window.arduinoGenerator.forBlock['ultrasonic_sensor'](sensorBlocks[0]);
						} catch (err) {
							log.warn('ultrasonic_trigger: 調用處理函式失敗', err);
						}
					}

					// 確認變數是否已設定
					hasSensorBlock = !!window.arduinoGenerator.variables_['ultrasonic_vars'];
				}
			}
		}

		// 如果仍然沒有找到或設定感測器，顯示警告
		if (!hasSensorBlock) {
			window.arduinoGenerator.warnings_.push('Triggering ultrasonic without an ultrasonic sensor setup block. Add the ultrasonic sensor setup block first.');
			log.warn('ultrasonic_trigger: 未能設定超音波感測器變數');
			return '// Error: ultrasonic sensor is not set up\n'; // 返回註解提示
		} // 確保函數定義只加入一次
		if (!window.arduinoGenerator.functions_['triggerUltrasonic']) {
			log.info('ultrasonic_trigger: 新增超音波觸發函數定義');
			window.arduinoGenerator.functions_['triggerUltrasonic'] = `
// Ultrasonic trigger function
void triggerUltrasonic() {
  // Send ultrasonic trigger pulse
  digitalWrite(ultrasonic_trigPin, LOW);
  delayMicroseconds(2);
  digitalWrite(ultrasonic_trigPin, HIGH);
  delayMicroseconds(10);
  digitalWrite(ultrasonic_trigPin, LOW);
}
`;
		}

		// 返回函數調用的程式碼
		log.debug('ultrasonic_trigger: 生成超音波觸發函數調用');
		return 'triggerUltrasonic();  // Send ultrasonic pulse\n';
	} catch (e) {
		log.error('ultrasonic_trigger: 程式碼生成錯誤', e);
		return ''; // 發生錯誤時返回空字串
	}
};
