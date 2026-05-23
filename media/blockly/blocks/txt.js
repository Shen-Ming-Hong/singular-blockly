/**
 * @license
 * Copyright 2025 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 *
 * TXT Controller 專用積木定義
 */

'use strict';

/** TXT Controller 積木色相 (200 = 青藍色) */
const TXT_COLOR = 200;
const TXT_M_OUTPUT_DEFAULT_VALUE = 512;

const TXT_WARNING_KEYS = Object.freeze({
	ORPHAN: 'txt-orphan',
	M_OUTPUT_CONFLICT: 'txt-m-output-conflict',
	VIRTUAL_CONTROL: 'txt-virtual-control',
});

function getTxtMessage(key, fallback) {
	if (window.languageManager && typeof window.languageManager.getMessage === 'function') {
		return window.languageManager.getMessage(key, fallback);
	}
	return fallback;
}

function setTxtBlockWarning(block, key, message) {
	if (!block || typeof block.setWarningText !== 'function') {
		return;
	}

	block.txtWarningMessages_ = block.txtWarningMessages_ || {};
	if (message) {
		block.txtWarningMessages_[key] = message;
	} else {
		delete block.txtWarningMessages_[key];
	}

	const warningText = Object.values(block.txtWarningMessages_).filter(Boolean).join('\n');
	block.setWarningText(warningText || null);
}

window.TXT_WARNING_KEYS = window.TXT_WARNING_KEYS || TXT_WARNING_KEYS;
window.setTxtBlockWarning = window.setTxtBlockWarning || setTxtBlockWarning;

function getTxtMOutputValidation() {
	return window.txtMOutputValidation || null;
}

function getTxtMOutputComponents() {
	const validation = getTxtMOutputValidation();
	return validation?.M_COMPONENTS || {
		MOTOR: {
			key: 'MOTOR',
			displayMessageKey: 'TXT_COMPONENT_MOTOR',
			requiresDirection: true,
			valueLabelMessageKey: 'TXT_MOTOR_SPEED_SET',
			generatorMode: 'signed-speed',
		},
		LAMP: {
			key: 'LAMP',
			displayMessageKey: 'TXT_COMPONENT_LAMP',
			requiresDirection: false,
			valueLabelMessageKey: 'TXT_LAMP_BRIGHTNESS',
			generatorMode: 'unsigned-level',
		},
	};
}

function normalizeTxtMOutputComponent(componentValue) {
	const validation = getTxtMOutputValidation();
	if (validation && typeof validation.normalizeComponent === 'function') {
		return validation.normalizeComponent(componentValue);
	}

	const rawValue = String(componentValue || '').trim().toUpperCase();
	return Object.prototype.hasOwnProperty.call(getTxtMOutputComponents(), rawValue) ? rawValue : 'MOTOR';
}

function getTxtMOutputComponentMetadata(componentValue) {
	const normalizedComponent = normalizeTxtMOutputComponent(componentValue);
	return getTxtMOutputComponents()[normalizedComponent] || getTxtMOutputComponents().MOTOR;
}

function getTxtMOutputComponentOptions() {
	return Object.values(getTxtMOutputComponents()).map(component => [
		getTxtMessage(component.displayMessageKey, component.key),
		component.key,
	]);
}

function normalizeTxtMOutputDefaultNumber(value) {
	const numericValue = Number(value);
	return Number.isFinite(numericValue) ? numericValue : TXT_M_OUTPUT_DEFAULT_VALUE;
}

function getTxtMOutputShadowValue(block) {
	if (!block || block.type !== 'math_number' || typeof block.getFieldValue !== 'function') {
		return TXT_M_OUTPUT_DEFAULT_VALUE;
	}
	return normalizeTxtMOutputDefaultNumber(block.getFieldValue('NUM'));
}

function createTxtMOutputDefaultNumberShadow(value = TXT_M_OUTPUT_DEFAULT_VALUE) {
	const numericValue = normalizeTxtMOutputDefaultNumber(value);
	return Blockly.utils.xml.textToDom(`<shadow type="math_number"><field name="NUM">${numericValue}</field></shadow>`);
}

function setTxtMOutputDefaultNumberShadow(valueInput, value = TXT_M_OUTPUT_DEFAULT_VALUE) {
	if (!valueInput || typeof valueInput.setShadowDom !== 'function') {
		return;
	}
	valueInput.setShadowDom(createTxtMOutputDefaultNumberShadow(value));
}

function updateTxtMOutputShape(block, componentValue) {
	const metadata = getTxtMOutputComponentMetadata(componentValue || block.getFieldValue('COMPONENT'));
	const component = metadata.key;
	const componentField = block.getField('COMPONENT');
	if (componentField && block.getFieldValue('COMPONENT') !== component) {
		componentField.setValue(component);
	}

	const directionValue = block.getFieldValue('DIRECTION') || 'FORWARD';
	const speedInput = block.getInput('SPEED');
	const targetBlock = speedInput?.connection?.targetBlock?.() || null;
	const targetConnection = targetBlock && !targetBlock.isShadow() ? targetBlock.outputConnection : null;
	const shadowValue = targetBlock && targetBlock.isShadow() ? getTxtMOutputShadowValue(targetBlock) : TXT_M_OUTPUT_DEFAULT_VALUE;

	if (block.getInput('DIRECTION_ROW')) {
		block.removeInput('DIRECTION_ROW', true);
	}
	if (block.getInput('SPEED')) {
		block.removeInput('SPEED', true);
	}

	if (metadata.requiresDirection) {
		block.appendDummyInput('DIRECTION_ROW')
			.appendField(
				new Blockly.FieldDropdown([
					[getTxtMessage('TXT_DIRECTION_FORWARD', '正轉'), 'FORWARD'],
					[getTxtMessage('TXT_DIRECTION_BACKWARD', '反轉'), 'BACKWARD'],
				]),
				'DIRECTION'
			);
		block.setFieldValue(directionValue, 'DIRECTION');
	}

	const valueInput = block.appendValueInput('SPEED')
		.setCheck('Number')
		.appendField(getTxtMessage(metadata.valueLabelMessageKey, metadata.requiresDirection ? '設定速度' : '亮度'));
	setTxtMOutputDefaultNumberShadow(valueInput, shadowValue);
	if (targetConnection) {
		try {
			valueInput.connection.connect(targetConnection);
		} catch (error) {
			// 若舊連線已不存在或不相容，Blockly 會自行保留積木為未連接狀態。
		}
	}
}

function txtMOutputOnchange(e) {
	if (!this.workspace || this.workspace.isFlyout) { return; }
	if (!e ||
		e.type === Blockly.Events.FINISHED_LOADING ||
		(e.type === Blockly.Events.BLOCK_CHANGE && e.blockId === this.id && e.name === 'COMPONENT')) {
		this.updateShape_(this.getFieldValue('COMPONENT'));
	}
}

// === 頂層容器積木 ===

/**
 * TXT 初始化積木 — 頂層初始化容器
 * 負責建立 shared ftrobopy 連線與一次性初始化程式碼
 */
Blockly.Blocks['txt_setup'] = {
	init: function () {
		this.appendStatementInput('DO')
			.setCheck(null)
			.appendField(window.languageManager.getMessage('TXT_SETUP', 'TXT Setup'));
		this.setStyle('procedure_blocks');
		this.setTooltip(
			window.languageManager.getMessage(
				'TXT_SETUP_TOOLTIP',
				'Initialize the TXT Controller once and prepare shared hardware resources for all TXT processes.'
			)
		);
		this.setHelpUrl('');
		this.setMovable(true);
	},
};

/**
 * TXT 流程積木 — 頂層流程容器
 * 可選名稱欄位僅供顯示與診斷用途
 */
Blockly.Blocks['txt_process'] = {
	init: function () {
		this.appendDummyInput()
			.appendField(window.languageManager.getMessage('TXT_PROCESS_PREFIX', 'TXT Process:'))
			.appendField(new Blockly.FieldTextInput(''), 'NAME');
		this.appendStatementInput('DO').setCheck(null);
		this.setStyle('procedure_blocks');
		this.setTooltip(
			window.languageManager.getMessage(
				'TXT_PROCESS_TOOLTIP',
				'Define one TXT process. The name is optional and only used for display or diagnostics.'
			)
		);
		this.setHelpUrl('');
		this.setMovable(true);
	},
};

// === 馬達積木 ===

/**
 * 設定馬達速度
 */
Blockly.Blocks['txt_motor_speed'] = {
	init: function () {
		const componentField = new Blockly.FieldDropdown(getTxtMOutputComponentOptions, function (componentValue) {
			const normalizedComponent = normalizeTxtMOutputComponent(componentValue);
			const sourceBlock = typeof this.getSourceBlock === 'function' ? this.getSourceBlock() : this.sourceBlock_;
			if (sourceBlock?.workspace?.isFlyout) {
				return normalizedComponent;
			}
			if (sourceBlock && typeof sourceBlock.updateShape_ === 'function') {
				setTimeout(() => sourceBlock.updateShape_(normalizedComponent), 0);
			}
			return normalizedComponent;
		});

		this.appendDummyInput('MAIN')
			.appendField(getTxtMessage('TXT_M_OUTPUT_PREFIX', '輸出'))
			.appendField(
				new Blockly.FieldDropdown([
					['M1', '1'],
					['M2', '2'],
					['M3', '3'],
					['M4', '4'],
				]),
				'MOTOR'
			)
			.appendField(componentField, 'COMPONENT');
		this.updateShape_('MOTOR');
		this.setInputsInline(true);
		this.setPreviousStatement(true, null);
		this.setNextStatement(true, null);
		this.setColour(TXT_COLOR);
		this.setTooltip(getTxtMessage('TXT_M_OUTPUT_TOOLTIP', '選擇 M 埠與元件類型，設定馬達速度或燈泡亮度（0~512）'));
		this.setHelpUrl('');
	},
	updateShape_: function (componentValue) {
		updateTxtMOutputShape(this, componentValue);
	},
};

/**
 * 停止馬達
 */
Blockly.Blocks['txt_motor_stop'] = {
	init: function () {
		this.appendDummyInput()
			.appendField(getTxtMessage('TXT_M_OUTPUT_STOP', '停止輸出'))
			.appendField(
				new Blockly.FieldDropdown([
					['M1', '1'],
					['M2', '2'],
					['M3', '3'],
					['M4', '4'],
				]),
				'MOTOR'
			);
		this.setPreviousStatement(true, null);
		this.setNextStatement(true, null);
		this.setColour(TXT_COLOR);
		this.setTooltip(getTxtMessage('TXT_M_OUTPUT_STOP_TOOLTIP', '停止指定 M 埠輸出（輸出值設為 0）'));
		this.setHelpUrl('');
	},
};

// === 輸出積木 ===

/**
 * 設定數位輸出
 */
Blockly.Blocks['txt_output'] = {
	init: function () {
		this.appendDummyInput()
			.appendField(window.languageManager.getMessage('TXT_OUTPUT', '輸出'))
			.appendField(
				new Blockly.FieldDropdown([
					['O1', '1'],
					['O2', '2'],
					['O3', '3'],
					['O4', '4'],
					['O5', '5'],
					['O6', '6'],
					['O7', '7'],
					['O8', '8'],
				]),
				'OUTPUT'
			)
			.appendField(window.languageManager.getMessage('TXT_OUTPUT_SET', '設為'))
			.appendField(
				new Blockly.FieldDropdown([
					[window.languageManager.getMessage('TXT_STATE_ON', '開'), 'ON'],
					[window.languageManager.getMessage('TXT_STATE_OFF', '關'), 'OFF'],
				]),
				'STATE'
			);
		this.setPreviousStatement(true, null);
		this.setNextStatement(true, null);
		this.setColour(TXT_COLOR);
		this.setTooltip(window.languageManager.getMessage('TXT_OUTPUT_TOOLTIP', '設定數位輸出腳位 O1~O8 的狀態'));
		this.setHelpUrl('');
	},
};

// === 輸入積木 ===

/**
 * 感測器輸入積木 — 支援按鈕、光柵、超音波
 * 下拉選感測器類型；生成 Python 程式碼時自動處理 setConfig 差異
 */
Blockly.Blocks['txt_input_sensor'] = {
	init: function () {
		this.appendDummyInput()
			.appendField(window.languageManager.getMessage('TXT_INPUT_SENSOR_PREFIX', '讀取'))
			.appendField(
				new Blockly.FieldDropdown([
					[window.languageManager.getMessage('TXT_SENSOR_BUTTON', '按鈕'), 'BUTTON'],
					[window.languageManager.getMessage('TXT_SENSOR_GATE', '光柵'), 'GATE'],
					[window.languageManager.getMessage('TXT_SENSOR_ULTRASONIC', '超音波'), 'ULTRASONIC'],
				]),
				'SENSOR_TYPE'
			)
			.appendField(
				new Blockly.FieldDropdown([
					['I1', '1'],
					['I2', '2'],
					['I3', '3'],
					['I4', '4'],
					['I5', '5'],
					['I6', '6'],
					['I7', '7'],
					['I8', '8'],
				]),
				'INPUT'
			);
		this.setOutput(true, 'Number');
		this.setColour(TXT_COLOR);
		this.setTooltip(window.languageManager.getMessage('TXT_INPUT_SENSOR_TOOLTIP', '選擇感測器類型並讀取輸入值（按鈕/光柵回傳 0 或 1，超音波回傳距離 cm）'));
		this.setHelpUrl('');
	},
};

/**
 * 讀取虛擬按鈕狀態
 */
Blockly.Blocks['txt_virtual_button_state'] = {
	init: function () {
		this.appendDummyInput()
			.appendField(window.languageManager.getMessage('TXT_VIRTUAL_BUTTON_STATE_PREFIX', 'read virtual button'))
			.appendField(
				new Blockly.FieldDropdown(() => {
					if (typeof window.getTxtVirtualButtonDropdownOptions === 'function') {
						return window.getTxtVirtualButtonDropdownOptions(this);
					}
					return [[window.languageManager.getMessage('TXT_VIRTUAL_CONTROLS_EMPTY_OPTION', 'Create a button first'), '__none__']];
				}),
				'BUTTON_ID'
			);
		this.setOutput(true, 'Number');
		this.setColour(TXT_COLOR);
		this.setTooltip(
			window.languageManager.getMessage(
				'TXT_VIRTUAL_BUTTON_STATE_TOOLTIP',
				'Returns 1 while the selected virtual button is pressed, otherwise 0.'
			)
		);
		this.setHelpUrl('');
		if (typeof window.setTxtVirtualButtonReferenceState === 'function') {
			window.setTxtVirtualButtonReferenceState(this, {});
		}
	},
	saveExtraState: function () {
		if (typeof window.getTxtVirtualButtonReferenceState === 'function') {
			return window.getTxtVirtualButtonReferenceState(this);
		}
		return null;
	},
	loadExtraState: function (state) {
		if (typeof window.setTxtVirtualButtonReferenceState === 'function') {
			window.setTxtVirtualButtonReferenceState(this, state || {});
		}
	},
	onchange: function (e) {
		txtOrphanOnchange.call(this, e);
		if (typeof window.refreshTxtVirtualButtonReferenceForBlock === 'function') {
			window.refreshTxtVirtualButtonReferenceForBlock(this);
		}
	},
};

// === 延遲積木 ===

/**
 * 延遲等待
 */
Blockly.Blocks['txt_wait'] = {
	init: function () {
		this.appendDummyInput()
			.appendField(window.languageManager.getMessage('TXT_WAIT', '等待'));
		this.appendValueInput('MS').setCheck('Number');
		this.appendDummyInput().appendField(window.languageManager.getMessage('TXT_WAIT_UNIT', '毫秒'));
		this.setInputsInline(true);
		this.setPreviousStatement(true, null);
		this.setNextStatement(true, null);
		this.setColour(TXT_COLOR);
		this.setTooltip(window.languageManager.getMessage('TXT_WAIT_TOOLTIP', '等待指定的毫秒數'));
		this.setHelpUrl('');
	},
};

// === 全部停止積木 ===

/**
 * 停止所有馬達與輸出
 */
Blockly.Blocks['txt_stop_all'] = {
	init: function () {
		this.appendDummyInput().appendField(window.languageManager.getMessage('TXT_STOP_ALL', '停止所有馬達與輸出'));
		this.setPreviousStatement(true, null);
		this.setNextStatement(true, null);
		this.setColour(TXT_COLOR);
		this.setTooltip(window.languageManager.getMessage('TXT_STOP_ALL_TOOLTIP', '停止 TXT Controller 上所有馬達與數位輸出'));
		this.setHelpUrl('');
	},
};

// ============================================================
// 孤立積木保護 — 所有 TXT 積木
// ============================================================

/**
 * TXT 孤立積木警告回呼
 * 積木移動或建立時檢查是否在 TXT 合法容器或函式容器內
 */
function txtOrphanOnchange(e) {
	if (!this.workspace || this.workspace.isFlyout) { return; }
	if (e && e.type !== Blockly.Events.BLOCK_MOVE &&
		e.type !== Blockly.Events.BLOCK_CREATE &&
		e.type !== Blockly.Events.FINISHED_LOADING) { return; }

	const isInContext = window.isInAllowedContext(this);
	if (isInContext) {
		window.setTxtBlockWarning(this, TXT_WARNING_KEYS.ORPHAN, null);
	} else {
		window.setTxtBlockWarning(
			this,
			TXT_WARNING_KEYS.ORPHAN,
			getTxtMessage('TXT_ORPHAN_WARNING_MULTI', 'This block must be placed inside a "TXT Setup" or "TXT Process" block')
		);
	}
}

function txtStatementOnchange(e) {
	txtOrphanOnchange.call(this, e);
	if (this.type === 'txt_motor_speed') {
		txtMOutputOnchange.call(this, e);
	}
}

// 為所有 TXT statement 積木加入孤立警告
['txt_motor_speed', 'txt_motor_stop', 'txt_output', 'txt_wait', 'txt_stop_all'].forEach(function (blockType) {
	if (Blockly.Blocks[blockType]) {
		Blockly.Blocks[blockType].onchange = txtStatementOnchange;
	}
});

// value blocks（有輸出）也加入孤立警告
['txt_input_sensor'].forEach(function (blockType) {
	if (Blockly.Blocks[blockType]) {
		Blockly.Blocks[blockType].onchange = txtOrphanOnchange;
	}
});
