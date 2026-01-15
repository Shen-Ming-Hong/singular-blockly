/**
 * @license
 * Copyright 2025 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 *
 * CyberBrick X12 發射端擴展板 MicroPython 程式碼生成器
 * 使用直接 ADC/GPIO 存取（不依賴 rc_module，可與 ESP-NOW 共存）
 *
 * 硬體映射:
 *   搖桿: L1=GPIO0, L2=GPIO1, L3=GPIO2, R1=GPIO3, R2=GPIO4, R3=GPIO5 (ADC)
 *   按鈕: K1=GPIO6, K2=GPIO7, K3=GPIO21, K4=GPIO20 (Digital, 按下=0)
 */

'use strict';

(function () {
	const generator = window.micropythonGenerator;
	if (!generator) {
		console.error('[blockly] MicroPython 生成器尚未載入 (x12.js)');
		return;
	}

	/**
	 * 添加 X12 驅動初始化程式碼
	 * 使用直接 ADC/GPIO 存取，不依賴 rc_module
	 */
	function ensureX12Init() {
		generator.addImport('from machine import Pin, ADC');
		generator.addHardwareInit(
			'x12_driver',
			`# X12 驅動初始化 (直接硬體存取)
_x12_adc = {}
for _i, _p in enumerate([0, 1, 2, 3, 4, 5]):
    _x12_adc[_i] = ADC(Pin(_p))
    _x12_adc[_i].atten(ADC.ATTN_11DB)
_x12_btn = {6: Pin(6, Pin.IN, Pin.PULL_UP), 7: Pin(7, Pin.IN, Pin.PULL_UP), 8: Pin(21, Pin.IN, Pin.PULL_UP), 9: Pin(20, Pin.IN, Pin.PULL_UP)}
def _x12_read():
    return tuple(_x12_adc[i].read() for i in range(6)) + tuple(_x12_btn[i].value() for i in [6,7,8,9])`
		);
	}

	// === 讀取本機搖桿值 ===
	generator.forBlock['x12_get_joystick'] = function (block) {
		// 確保 X12 初始化
		ensureX12Init();

		// 取得參數
		const channel = block.getFieldValue('CHANNEL');

		// 生成程式碼 (直接讀取 ADC)
		const code = `_x12_adc[${channel}].read()`;
		return [code, generator.ORDER_FUNCTION_CALL];
	};

	// === 讀取並映射本機搖桿值 ===
	generator.forBlock['x12_get_joystick_mapped'] = function (block) {
		// 確保 X12 初始化
		ensureX12Init();

		// 取得參數
		const channel = block.getFieldValue('CHANNEL');
		const min = generator.valueToCode(block, 'MIN', generator.ORDER_NONE) || '-100';
		const max = generator.valueToCode(block, 'MAX', generator.ORDER_NONE) || '100';

		// 生成程式碼 (線性映射: value * (max - min) // 4095 + min)
		const code = `(_x12_adc[${channel}].read() * (${max} - ${min}) // 4095 + ${min})`;
		return [code, generator.ORDER_ADDITIVE];
	};

	// === 檢查本機按鈕是否按下 ===
	generator.forBlock['x12_is_button_pressed'] = function (block) {
		// 確保 X12 初始化
		ensureX12Init();

		// 取得參數 (按鈕 index: 6=K1, 7=K2, 8=K3, 9=K4)
		const button = block.getFieldValue('BUTTON');

		// 生成程式碼 (0=按下 轉換為 True)
		const code = `(_x12_btn[${button}].value() == 0)`;
		return [code, generator.ORDER_RELATIONAL];
	};

	// === 讀取本機按鈕狀態 ===
	generator.forBlock['x12_get_button'] = function (block) {
		// 確保 X12 初始化
		ensureX12Init();

		// 取得參數 (按鈕 index: 6=K1, 7=K2, 8=K3, 9=K4)
		const button = block.getFieldValue('BUTTON');

		// 生成程式碼 (原始狀態: 0=按下, 1=放開)
		const code = `_x12_btn[${button}].value()`;
		return [code, generator.ORDER_FUNCTION_CALL];
	};

	// 記錄載入訊息
	console.log('[blockly] X12 MicroPython 生成器已載入 (直接硬體存取)');
})();
