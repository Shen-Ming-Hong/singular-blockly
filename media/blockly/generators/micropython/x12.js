/**
 * @license
 * Copyright 2025 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 *
 * CyberBrick X12 發射端擴展板 MicroPython 程式碼生成器
 */

'use strict';

(function () {
	const generator = window.micropythonGenerator;
	if (!generator) {
		console.error('[blockly] MicroPython 生成器尚未載入 (x12.js)');
		return;
	}

	// === 讀取本機搖桿值 ===
	generator.forBlock['x12_get_joystick'] = function (block) {
		// 添加 import
		generator.addImport('import rc_module');

		// 確保 Master 模式已初始化
		generator.addHardwareInit('rc_master', 'rc_module.rc_master_init()');

		// 取得參數
		const channel = block.getFieldValue('CHANNEL');

		// 生成程式碼 (使用 rc_master_data 讀取本機資料，含安全預設值)
		const code = `(rc_module.rc_master_data() or (2048,)*10)[${channel}]`;
		return [code, generator.ORDER_MEMBER];
	};

	// === 讀取並映射本機搖桿值 ===
	generator.forBlock['x12_get_joystick_mapped'] = function (block) {
		// 添加 import
		generator.addImport('import rc_module');

		// 確保 Master 模式已初始化
		generator.addHardwareInit('rc_master', 'rc_module.rc_master_init()');

		// 取得參數
		const channel = block.getFieldValue('CHANNEL');
		const min = generator.valueToCode(block, 'MIN', generator.ORDER_NONE) || '-100';
		const max = generator.valueToCode(block, 'MAX', generator.ORDER_NONE) || '100';

		// 生成程式碼 (線性映射: value * (max - min) // 4095 + min)
		const code = `((rc_module.rc_master_data() or (2048,)*10)[${channel}] * (${max} - ${min}) // 4095 + ${min})`;
		return [code, generator.ORDER_ADDITIVE];
	};

	// === 檢查本機按鈕是否按下 ===
	generator.forBlock['x12_is_button_pressed'] = function (block) {
		// 添加 import
		generator.addImport('import rc_module');

		// 確保 Master 模式已初始化
		generator.addHardwareInit('rc_master', 'rc_module.rc_master_init()');

		// 取得參數
		const button = block.getFieldValue('BUTTON');

		// 生成程式碼 (0=按下 轉換為 True)
		const code = `((rc_module.rc_master_data() or (2048,)*6 + (1,)*4)[${button}] == 0)`;
		return [code, generator.ORDER_RELATIONAL];
	};

	// === 讀取本機按鈕狀態 ===
	generator.forBlock['x12_get_button'] = function (block) {
		// 添加 import
		generator.addImport('import rc_module');

		// 確保 Master 模式已初始化
		generator.addHardwareInit('rc_master', 'rc_module.rc_master_init()');

		// 取得參數
		const button = block.getFieldValue('BUTTON');

		// 生成程式碼 (原始狀態: 0=按下, 1=放開)
		const code = `(rc_module.rc_master_data() or (2048,)*6 + (1,)*4)[${button}]`;
		return [code, generator.ORDER_MEMBER];
	};

	// 記錄載入訊息
	console.log('[blockly] X12 MicroPython 生成器已載入');
})();
