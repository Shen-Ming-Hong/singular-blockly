// filepath: e:\singular-blockly\media\blockly\blocks\motors.js
/**
 * @license
 * Copyright 2025 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

Blockly.Blocks['servo_setup'] = {
	init: function () {
		this.appendDummyInput()
			.appendField(window.languageManager.getMessage('SERVO_SETUP'))
			.appendField(new Blockly.FieldTextInput('myServo'), 'VAR')
			.appendField(window.languageManager.getMessage('SERVO_PIN'))
			.appendField(
				new Blockly.FieldDropdown(function () {
					return window.getDigitalPinOptions();
				}),
				'PIN'
			);
		this.setPreviousStatement(true, null);
		this.setNextStatement(true, null);
		this.setStyle('motors_blocks');
		this.setTooltip(window.languageManager.getMessage('SERVO_SETUP_TOOLTIP'));
		this.setHelpUrl('');
	},
};

Blockly.Blocks['servo_move'] = {
	init: function () {
		// 初始化恢復馬達變數名稱的屬性
		this.restoredServoValue = 'myServo';

		this.appendDummyInput()
			.appendField(window.languageManager.getMessage('SERVO_MOVE'))
			.appendField(
				new Blockly.FieldDropdown(() => {
					// 取得工作區
					const workspace = this.sourceBlock_ ? this.sourceBlock_.workspace : Blockly.getMainWorkspace();
					if (!workspace) {
						log.info('無法取得工作區，返回預設選項 myServo');
						return [['myServo', 'myServo']];
					}

					// 優先使用從變異資料恢復的值，然後才是 getFieldValue
					const currentValue = this.restoredServoValue || this.getFieldValue('VAR') || 'myServo';
					log.info(`servo_move: 當前選擇的馬達名稱: ${currentValue}`);

					// 先建立一個以當前值為首位的選項陣列
					const options = [[currentValue, currentValue]];

					// 找出所有 servo_setup 積木
					const blocks = workspace.getAllBlocks(false);
					const setupBlocks = blocks.filter(block => block.type === 'servo_setup');
					log.info(`servo_move: 找到 ${setupBlocks.length} 個伺服馬達設定積木`);

					// 如果沒有找到設定積木，就只返回當前值
					if (setupBlocks.length === 0) {
						log.info('servo_move: 未找到伺服馬達設定積木，僅返回當前選項');
						return options;
					}

					// 從設定積木中獲取所有馬達名稱，排除當前值以避免重複
					setupBlocks.forEach(block => {
						const name = block.getFieldValue('VAR');
						if (name !== currentValue) {
							// 避免重複添加當前值
							options.push([name, name]);
							log.info(`servo_move: 添加選項 ${name}`);
						}
					});

					log.info(`servo_move: 返回選項清單: ${JSON.stringify(options)}`);
					return options;
				}),
				'VAR'
			)
			.appendField(window.languageManager.getMessage('SERVO_ANGLE'))
			.appendField(new Blockly.FieldNumber(90, 0, 180), 'ANGLE');
		this.setPreviousStatement(true, null);
		this.setNextStatement(true, null);
		this.setStyle('motors_blocks');
		this.setTooltip(window.languageManager.getMessage('SERVO_MOVE_TOOLTIP'));
		this.setHelpUrl('');
	},

	// 新增變異記錄方法，保存選擇的馬達值
	mutationToDom: function () {
		const container = Blockly.utils.xml.createElement('mutation');
		const servoValue = this.getFieldValue('VAR');
		// 同時更新恢復值屬性
		this.restoredServoValue = servoValue;
		container.setAttribute('servo', servoValue);
		log.info(`servo_move: 儲存變異資料，馬達名稱: ${servoValue}`);
		return container;
	},

	// 從變異記錄恢復選擇的馬達值
	domToMutation: function (xmlElement) {
		const servo = xmlElement.getAttribute('servo');
		if (servo) {
			log.info(`servo_move: 從變異資料恢復馬達名稱: ${servo}`);
			// 在設置字段值的同時，也存儲到我們的備份屬性中
			this.restoredServoValue = servo;
			this.getField('VAR').setValue(servo);
			log.info(`servo_move: 已將馬達名稱 ${servo} 存入備份屬性`);
		} else {
			log.warn('servo_move: 變異資料中沒有找到馬達名稱');
		}
	},

	// 新增變更處理函數，確保在運行時變更能被記錄
	onchange: function () {
		const currentValue = this.getFieldValue('VAR');
		if (currentValue && currentValue !== this.restoredServoValue) {
			log.info(`servo_move: 馬達名稱從 ${this.restoredServoValue} 變更為 ${currentValue}`);
			this.restoredServoValue = currentValue;
		}
	},
};

// 新增伺服馬達停止積木
Blockly.Blocks['servo_stop'] = {
	init: function () {
		// 初始化恢復馬達變數名稱的屬性
		this.restoredServoValue = 'myServo';

		this.appendDummyInput()
			.appendField(window.languageManager.getMessage('SERVO_STOP'))
			.appendField(
				new Blockly.FieldDropdown(() => {
					// 取得工作區
					const workspace = this.sourceBlock_ ? this.sourceBlock_.workspace : Blockly.getMainWorkspace();
					if (!workspace) {
						log.info('無法取得工作區，返回預設選項 myServo');
						return [['myServo', 'myServo']];
					}

					// 優先使用從變異資料恢復的值，然後才是 getFieldValue
					const currentValue = this.restoredServoValue || this.getFieldValue('VAR') || 'myServo';
					log.info(`servo_stop: 當前選擇的馬達名稱: ${currentValue}`);

					// 先建立一個以當前值為首位的選項陣列
					const options = [[currentValue, currentValue]];

					// 找出所有 servo_setup 積木
					const blocks = workspace.getAllBlocks(false);
					const setupBlocks = blocks.filter(block => block.type === 'servo_setup');
					log.info(`servo_stop: 找到 ${setupBlocks.length} 個伺服馬達設定積木`);

					// 如果沒有找到設定積木，就只返回當前值
					if (setupBlocks.length === 0) {
						log.info('servo_stop: 未找到伺服馬達設定積木，僅返回當前選項');
						return options;
					}

					// 從設定積木中獲取所有馬達名稱，排除當前值以避免重複
					setupBlocks.forEach(block => {
						const name = block.getFieldValue('VAR');
						if (name !== currentValue) {
							// 避免重複添加當前值
							options.push([name, name]);
							log.info(`servo_stop: 添加選項 ${name}`);
						}
					});

					log.info(`servo_stop: 返回選項清單: ${JSON.stringify(options)}`);
					return options;
				}),
				'VAR'
			);
		this.setPreviousStatement(true, null);
		this.setNextStatement(true, null);
		this.setStyle('motors_blocks');
		this.setTooltip(window.languageManager.getMessage('SERVO_STOP_TOOLTIP'));
		this.setHelpUrl('');
	},

	// 新增變異記錄方法，保存選擇的馬達值
	mutationToDom: function () {
		const container = Blockly.utils.xml.createElement('mutation');
		const servoValue = this.getFieldValue('VAR');
		// 同時更新恢復值屬性
		this.restoredServoValue = servoValue;
		container.setAttribute('servo', servoValue);
		log.info(`servo_stop: 儲存變異資料，馬達名稱: ${servoValue}`);
		return container;
	},

	// 從變異記錄恢復選擇的馬達值
	domToMutation: function (xmlElement) {
		const servo = xmlElement.getAttribute('servo');
		if (servo) {
			log.info(`servo_stop: 從變異資料恢復馬達名稱: ${servo}`);
			// 在設置字段值的同時，也存儲到我們的備份屬性中
			this.restoredServoValue = servo;
			this.getField('VAR').setValue(servo);
		} else {
			log.warn('servo_stop: 變異資料中沒有找到馬達名稱');
		}
	},
};
