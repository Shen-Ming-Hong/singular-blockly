/**
 * @license
 * Copyright 2025 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 *
 * CyberBrick RC 遙控通訊 MicroPython 程式碼生成器
 */

'use strict';

(function () {
	const generator = window.micropythonGenerator;
	if (!generator) {
		console.error('[blockly] MicroPython 生成器尚未載入 (rc.js)');
		return;
	}

	// === RC Master 初始化 (發射端) ===
	generator.forBlock['rc_master_init'] = function (block) {
		// 添加 import
		generator.addImport('import rc_module');

		// 生成程式碼
		return 'rc_module.rc_master_init()\n';
	};

	// === RC Slave 初始化 (接收端) ===
	generator.forBlock['rc_slave_init'] = function (block) {
		// 添加 import
		generator.addImport('import rc_module');

		// 生成程式碼
		return 'rc_module.rc_slave_init()\n';
	};

	// === 讀取遠端搖桿值 ===
	generator.forBlock['rc_get_joystick'] = function (block) {
		// 添加 import
		generator.addImport('import rc_module');

		// 確保 Slave 模式已初始化
		generator.addHardwareInit('rc_slave', 'rc_module.rc_slave_init()');

		// 取得參數
		const channel = block.getFieldValue('CHANNEL');

		// 生成程式碼 (含安全預設值 - 搖桿中點 2048，按鈕放開 1)
		const code = `(rc_module.rc_slave_data() or (2048,)*6 + (1,)*4)[${channel}]`;
		return [code, generator.ORDER_MEMBER];
	};

	// === 讀取並映射遠端搖桿值 ===
	generator.forBlock['rc_get_joystick_mapped'] = function (block) {
		// 添加 import
		generator.addImport('import rc_module');

		// 確保 Slave 模式已初始化
		generator.addHardwareInit('rc_slave', 'rc_module.rc_slave_init()');

		// 取得參數
		const channel = block.getFieldValue('CHANNEL');
		const min = generator.valueToCode(block, 'MIN', generator.ORDER_NONE) || '-100';
		const max = generator.valueToCode(block, 'MAX', generator.ORDER_NONE) || '100';

		// 生成程式碼 (線性映射: value * (max - min) // 4095 + min)
		const code = `((rc_module.rc_slave_data() or (2048,)*10)[${channel}] * (${max} - ${min}) // 4095 + ${min})`;
		return [code, generator.ORDER_ADDITIVE];
	};

	// === 檢查遠端按鈕是否按下 ===
	generator.forBlock['rc_is_button_pressed'] = function (block) {
		// 添加 import
		generator.addImport('import rc_module');

		// 確保 Slave 模式已初始化
		generator.addHardwareInit('rc_slave', 'rc_module.rc_slave_init()');

		// 取得參數
		const button = block.getFieldValue('BUTTON');

		// 生成程式碼 (0=按下 轉換為 True)
		const code = `((rc_module.rc_slave_data() or (2048,)*6 + (1,)*4)[${button}] == 0)`;
		return [code, generator.ORDER_RELATIONAL];
	};

	// === 讀取遠端按鈕狀態 ===
	generator.forBlock['rc_get_button'] = function (block) {
		// 添加 import
		generator.addImport('import rc_module');

		// 確保 Slave 模式已初始化
		generator.addHardwareInit('rc_slave', 'rc_module.rc_slave_init()');

		// 取得參數
		const button = block.getFieldValue('BUTTON');

		// 生成程式碼 (原始狀態: 0=按下, 1=放開)
		const code = `(rc_module.rc_slave_data() or (2048,)*6 + (1,)*4)[${button}]`;
		return [code, generator.ORDER_MEMBER];
	};

	// === 檢查是否已連線 ===
	generator.forBlock['rc_is_connected'] = function (block) {
		// 添加 import
		generator.addImport('import rc_module');

		// 確保 Slave 模式已初始化
		generator.addHardwareInit('rc_slave', 'rc_module.rc_slave_init()');

		// 生成程式碼
		const code = '(rc_module.rc_slave_data() is not None)';
		return [code, generator.ORDER_RELATIONAL];
	};

	// === 取得配對索引 ===
	generator.forBlock['rc_get_rc_index'] = function (block) {
		// 添加 import
		generator.addImport('import rc_module');

		// 確保 Slave 模式已初始化 (rc_index 主要用於接收端查詢配對狀態)
		generator.addHardwareInit('rc_slave', 'rc_module.rc_slave_init()');

		// 生成程式碼
		const code = 'rc_module.rc_index()';
		return [code, generator.ORDER_FUNCTION_CALL];
	};

	// 記錄載入訊息
	console.log('[blockly] RC MicroPython 生成器已載入');
})();
