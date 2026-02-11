/**
 * @license
 * Copyright 2025 Singular Blockly Contributors
 * Copyright 2012 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * 與循環相關的區塊定義
 * 包含控制流程語句和特殊循環區塊
 */

/**
 * 合併的合法容器清單（Arduino + MicroPython）
 * 供 block.onchange 警告使用，因 onchange 無法預知當前 generator 模式
 */
const ALLOWED_CONTAINERS = [
	'arduino_setup_loop',
	'arduino_function',
	'procedures_defnoreturn',
	'procedures_defreturn',
	'micropython_main',
];

/**
 * 全域 isInAllowedContext helper
 * 使用合併的容器清單，供 block.onchange 回呼使用
 * @param {!Blockly.Block} block - 要檢查的積木
 * @returns {boolean} true 表示在任一 generator 的合法容器內
 */
window.isInAllowedContext = function (block) {
	let current = block;
	while (current) {
		current = current.getSurroundParent();
		if (!current) return false;
		if (ALLOWED_CONTAINERS.includes(current.type)) return true;
	}
	return false;
};

Blockly.Blocks['controls_duration'] = {
	init: function () {
		this.appendDummyInput().appendField(window.languageManager.getMessage('DURATION_REPEAT'));
		this.appendValueInput('DURATION')
			.setCheck('Number')
			.appendField(window.languageManager.getMessage('DURATION_TIME'))
			.setShadowDom(Blockly.utils.xml.textToDom('<shadow type="math_number"><field name="NUM">1000</field></shadow>'));
		this.appendDummyInput().appendField(window.languageManager.getMessage('DURATION_MS'));
		this.appendStatementInput('DO').setCheck(null).appendField(window.languageManager.getMessage('DURATION_DO'));
		this.setInputsInline(true);
		this.setPreviousStatement(true, null);
		this.setNextStatement(true, null);
		this.setStyle('loop_blocks');
		this.setTooltip('在指定的時間內重複執行程式');
		this.setHelpUrl('');
	},

	// 孤立積木警告：檢查是否在合法容器內
	onchange: function (e) {
		if (!this.workspace || this.workspace.isFlyout) return;
		if (e && e.type !== Blockly.Events.BLOCK_MOVE &&
			e.type !== Blockly.Events.BLOCK_CREATE &&
			e.type !== Blockly.Events.FINISHED_LOADING) return;

		const isInContext = window.isInAllowedContext(this);
		const warningKey = window.currentProgrammingLanguage === 'micropython'
			? 'ORPHAN_BLOCK_WARNING_MICROPYTHON'
			: 'ORPHAN_BLOCK_WARNING_ARDUINO';

		if (isInContext) {
			this.setWarningText(null);
		} else {
			this.setWarningText(
				window.languageManager.getMessage(warningKey) ||
				'This block must be placed inside setup(), loop(), or a function to generate code.'
			);
		}
	},
};

Blockly.Blocks['singular_flow_statements'] = {
	init: function () {
		this.jsonInit({
			message0: '%1',
			args0: [
				{
					type: 'field_dropdown',
					name: 'FLOW',
					options: [
						[window.languageManager.getMessage('CONTROLS_FLOW_STATEMENTS_OPERATOR_BREAK') || 'break', 'BREAK'],
						[window.languageManager.getMessage('CONTROLS_FLOW_STATEMENTS_OPERATOR_CONTINUE') || 'continue', 'CONTINUE'],
					],
				},
			],
			previousStatement: null,
			colour: 230,
			tooltip: window.languageManager.getMessage('CONTROLS_FLOW_STATEMENTS_TOOLTIP') || 'Break or continue statements for loops.',
			helpUrl: '',
		});

		// 設置樣式和其他流程控制區塊一致
		this.setStyle('loop_blocks');
	},

	// 自定義驗證邏輯：孤立警告 + 循環檢查
	onchange: function (e) {
		if (!this.workspace || this.workspace.isFlyout) return;
		if (e && e.type !== Blockly.Events.BLOCK_MOVE &&
			e.type !== Blockly.Events.BLOCK_CREATE &&
			e.type !== Blockly.Events.FINISHED_LOADING) return;

		// 1. 檢查是否在循環區塊內（原始邏輯）
		let inLoop = false;
		let block = this;
		do {
			block = block.getSurroundParent();
			if (!block) break;
			if (['controls_duration', 'controls_repeat', 'controls_repeat_ext',
				'controls_forEach', 'controls_for', 'controls_whileUntil'].includes(block.type)) {
				inLoop = true;
				break;
			}
		} while (block);

		// 2. 檢查是否在合法容器內
		const inContext = window.isInAllowedContext(this);

		// 3. 根據 generator 模式選擇 i18n 鍵
		const warningKey = window.currentProgrammingLanguage === 'micropython'
			? 'ORPHAN_BLOCK_WARNING_MICROPYTHON'
			: 'ORPHAN_BLOCK_WARNING_ARDUINO';

		// 4. 警告優先順序：孤立 > 不在循環內 > 清除
		if (!inContext) {
			this.setWarningText(
				window.languageManager.getMessage(warningKey) ||
				'This block must be placed inside setup(), loop(), or a function to generate code.'
			);
		} else if (!inLoop) {
			this.setWarningText(
				window.languageManager.getMessage('CONTROLS_FLOW_STATEMENTS_WARNING') ||
				'Break and continue statements can only be used within a loop.'
			);
		} else {
			this.setWarningText(null);
		}
	},
};

// ============================================================
// 為 Blockly 內建控制積木添加孤立積木警告 onchange 回呼
// ============================================================

/**
 * 通用孤立積木警告回呼
 * 檢查積木是否在合法容器內，否則顯示警告
 */
function orphanWarningOnchange(e) {
	if (!this.workspace || this.workspace.isFlyout) return;
	if (e && e.type !== Blockly.Events.BLOCK_MOVE &&
		e.type !== Blockly.Events.BLOCK_CREATE &&
		e.type !== Blockly.Events.FINISHED_LOADING) return;

	const isInContext = window.isInAllowedContext(this);
	const warningKey = window.currentProgrammingLanguage === 'micropython'
		? 'ORPHAN_BLOCK_WARNING_MICROPYTHON'
		: 'ORPHAN_BLOCK_WARNING_ARDUINO';

	if (isInContext) {
		this.setWarningText(null);
	} else {
		const fallbackText = window.currentProgrammingLanguage === 'micropython'
			? 'This block must be placed inside main() or a function to generate code.'
			: 'This block must be placed inside setup(), loop(), or a function to generate code.';
		this.setWarningText(
			window.languageManager.getMessage(warningKey) || fallbackText
		);
	}
}

// 包裝 onchange handler，保留原有的 handler
function wrapOnchange(blockDef, newHandler) {
	const originalOnchange = blockDef.onchange;
	blockDef.onchange = function (e) {
		if (originalOnchange) {
			originalOnchange.call(this, e);
		}
		newHandler.call(this, e);
	};
}

// T031-T034: 循環類內建積木
['controls_repeat_ext', 'controls_whileUntil', 'controls_for', 'controls_forEach'].forEach(function (blockType) {
	if (Blockly.Blocks[blockType]) {
		wrapOnchange(Blockly.Blocks[blockType], orphanWarningOnchange);
	}
});

// T037: 條件判斷內建積木
if (Blockly.Blocks['controls_if']) {
	wrapOnchange(Blockly.Blocks['controls_if'], orphanWarningOnchange);
}
