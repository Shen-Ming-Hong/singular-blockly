/**
 * @license
 * Copyright 2024 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

window.arduinoGenerator.forBlock['ultrasonic_sensor'] = function (block) {
	try {
		const trigPin = block.getFieldValue('TRIG_PIN');
		const echoPin = block.getFieldValue('ECHO_PIN');
		const useInterrupt = block.getFieldValue('USE_INTERRUPT') === 'TRUE';

		// 檢查腳位模式 - Trig 腳位需要 OUTPUT 模式、Echo 腳位需要 INPUT 模式
		window.arduinoGenerator.checkPinMode(trigPin, 'OUTPUT');
		window.arduinoGenerator.checkPinMode(echoPin, 'INPUT');

		// 定義全域變數
		window.arduinoGenerator.variables_['ultrasonic_vars'] = `
// 超音波感測器變數
const int ultrasonic_trigPin = ${trigPin};  // 超音波 Trig 腳位
const int ultrasonic_echoPin = ${echoPin};  // 超音波 Echo 腳位
float ultrasonic_distance = 0;  // 儲存測量的距離
`;
		// 如果使用中斷
		if (useInterrupt) {
			window.arduinoGenerator.variables_['ultrasonic_interrupt_vars'] = `
// 超音波中斷模式變數
volatile unsigned long ultrasonic_echoStart = 0;  // 開始時間
volatile unsigned long ultrasonic_echoEnd = 0;    // 結束時間
`;

			// 中斷處理函數
			window.arduinoGenerator.functions_['ultrasonic_echo_isr'] = `
void ultrasonicEchoISR() {
  if (digitalRead(ultrasonic_echoPin) == HIGH) {
    // 記錄回波信號開始時間
    ultrasonic_echoStart = micros();
  } else {
    // 記錄回波信號結束時間
    ultrasonic_echoEnd = micros();
    // 計算持續時間
    unsigned long duration = ultrasonic_echoEnd - ultrasonic_echoStart;
    // 計算距離 (聲音速度 / 2) = 29.1 cm/µs
    ultrasonic_distance = (duration / 2.0) / 29.1;
  }
}
`;

			// 在 setup 區塊中添加中斷設定，不再重複 pinMode
			window.arduinoGenerator.setupCode_.push(`
  // 設定超音波感測器中斷
  attachInterrupt(digitalPinToInterrupt(${echoPin}), ultrasonicEchoISR, CHANGE);
`);
		} else {
			// 非中斷模式下，不需要在 setup 中重複設定腳位，因為已經由 pinModeTracker 處理
			// 這裡只加入註解，表示超音波感測器已設定
			window.arduinoGenerator.setupCode_.push(`
  // 超音波感測器已設定
`);

			// 添加測距函數
			window.arduinoGenerator.functions_['ultrasonic_measure'] = `
// 測量超音波距離的函數
float ultrasonicMeasureDistance() {
  // 先發送 10 微秒的觸發訊號
  digitalWrite(ultrasonic_trigPin, LOW);
  delayMicroseconds(2);
  digitalWrite(ultrasonic_trigPin, HIGH);
  delayMicroseconds(10);
  digitalWrite(ultrasonic_trigPin, LOW);
  
  // 測量回波時間
  unsigned long duration = pulseIn(ultrasonic_echoPin, HIGH);
  
  // 計算距離 (聲音速度 / 2) = 29.1 cm/µs
  return (duration / 2.0) / 29.1;
}
`;
		}

		return '// 超音波感測器已設定\n';
	} catch (e) {
		console.log('Ultrasonic sensor setup code generation error:', e);
		return ''; // 發生錯誤時返回空字串
	}
};

window.arduinoGenerator.forBlock['ultrasonic_read'] = function (block) {
	try {
		// 檢查是否有定義超音波變數，如果沒有，給出錯誤提示
		if (!window.arduinoGenerator.variables_['ultrasonic_vars']) {
			window.arduinoGenerator.warnings_.push('嘗試讀取超音波距離，但未設定超音波感測器。請先在程式中添加超音波感測器設定積木。');
			return ['0', window.arduinoGenerator.ORDER_ATOMIC]; // 返回安全的默認值
		}

		// 判斷使用哪種模式讀取距離
		if (window.arduinoGenerator.variables_['ultrasonic_interrupt_vars']) {
			// 中斷模式直接返回變數
			return ['ultrasonic_distance', window.arduinoGenerator.ORDER_ATOMIC];
		} else {
			// 非中斷模式調用測量函數
			return ['ultrasonicMeasureDistance()', window.arduinoGenerator.ORDER_ATOMIC];
		}
	} catch (e) {
		console.log('Ultrasonic read code generation error:', e);
		return ['0', window.arduinoGenerator.ORDER_ATOMIC]; // 發生錯誤時返回安全的默認值
	}
};

// 新增獨立的超音波觸發積木
window.arduinoGenerator.forBlock['ultrasonic_trigger'] = function (block) {
	try {
		// 檢查是否有定義超音波變數，如果沒有，給出錯誤提示
		if (!window.arduinoGenerator.variables_['ultrasonic_vars']) {
			window.arduinoGenerator.warnings_.push('嘗試觸發超音波，但未設定超音波感測器。請先在程式中添加超音波感測器設定積木。');
			log.warn('嘗試觸發超音波，但未設定超音波感測器');
			return '// 錯誤：未設定超音波感測器\n'; // 返回註解提示
		}

		// 確保函數定義只加入一次
		if (!window.arduinoGenerator.functions_['triggerUltrasonic']) {
			log.info('新增超音波觸發函數定義');
			window.arduinoGenerator.functions_['triggerUltrasonic'] = `
void triggerUltrasonic() {
  // 發送超音波觸發信號
  digitalWrite(ultrasonic_trigPin, LOW);
  delayMicroseconds(2);
  digitalWrite(ultrasonic_trigPin, HIGH);
  delayMicroseconds(10);
  digitalWrite(ultrasonic_trigPin, LOW);
}
`;
		}

		// 返回函數調用的程式碼
		log.debug('生成超音波觸發函數調用');
		return 'triggerUltrasonic();  // 發送超音波訊號\n';
	} catch (e) {
		log.error('超音波觸發程式碼生成錯誤:', e);
		return ''; // 發生錯誤時返回空字串
	}
};
