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

	// 自定義驗證邏輯
	onchange: function () {
		// 檢查此區塊是否在有效的循環區塊內
		let legal = false;
		let block = this;
		do {
			block = block.getSurroundParent();
			if (!block) {
				break;
			}

			// 檢查支援的所有循環區塊
			if (
				block.type === 'controls_duration' ||
				block.type === 'controls_repeat' ||
				block.type === 'controls_repeat_ext' ||
				block.type === 'controls_forEach' ||
				block.type === 'controls_for' ||
				block.type === 'controls_whileUntil'
			) {
				legal = true;
				break;
			}
		} while (block);

		// 根據是否在有效循環內設置或清除警告
		if (legal) {
			this.setWarningText(null);
		} else {
			this.setWarningText(
				window.languageManager.getMessage('CONTROLS_FLOW_STATEMENTS_WARNING') ||
					'Break and continue statements can only be used within a loop.'
			);
		}
	},
};
