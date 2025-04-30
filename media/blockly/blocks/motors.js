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
					// 使用支援PWM的引腳選項，因為伺服馬達需要PWM信號
					return window.getPWMPinOptions();
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

// 新增編碼馬達設定積木
Blockly.Blocks['encoder_setup'] = {
	init: function () {
		this.useInterruptPins_ = false; // 預設不使用中斷引腳

		this.appendDummyInput()
			.appendField(window.languageManager.getMessage('ENCODER_SETUP'))
			.appendField(new Blockly.FieldTextInput('myEncoder'), 'VAR');

		this.appendDummyInput()
			.appendField(new Blockly.FieldCheckbox('FALSE'), 'USE_INTERRUPT')
			.appendField(window.languageManager.getMessage('ENCODER_USE_INTERRUPT'));

		this.appendDummyInput('PIN_INPUTS')
			.appendField(window.languageManager.getMessage('ENCODER_PIN_A'))
			.appendField(
				new Blockly.FieldDropdown(() => {
					// 根據是否使用中斷引腳來決定下拉選單的選項
					return this.useInterruptPins_ ? window.getInterruptPinOptions() : window.getDigitalPinOptions();
				}),
				'PIN_A'
			)
			.appendField(window.languageManager.getMessage('ENCODER_PIN_B'))
			.appendField(
				new Blockly.FieldDropdown(() => {
					// 根據是否使用中斷引腳來決定下拉選單的選項
					return this.useInterruptPins_ ? window.getInterruptPinOptions() : window.getDigitalPinOptions();
				}),
				'PIN_B'
			);

		this.setPreviousStatement(true, null);
		this.setNextStatement(true, null);
		this.setStyle('motors_blocks');
		this.setTooltip(window.languageManager.getMessage('ENCODER_SETUP_TOOLTIP'));
		this.setHelpUrl('');

		// 將此積木標記為預覽功能
		if (window.registerPreviewBlock) {
			window.registerPreviewBlock('encoder_setup');
		}
		// 註冊為實驗性積木
		if (window.registerExperimentalBlock) {
			window.registerExperimentalBlock('encoder_setup');
		}
	},
	// 更新引腳下拉選單
	updatePinDropdowns: function () {
		// 保存目前選擇的值
		const pinAValue = this.getFieldValue('PIN_A');
		const pinBValue = this.getFieldValue('PIN_B');

		// 完全刪除現有的 PIN_INPUTS 行並重新建立
		this.removeInput('PIN_INPUTS');

		// 重建整個輸入行
		const newInput = this.appendDummyInput('PIN_INPUTS')
			.appendField(window.languageManager.getMessage('ENCODER_PIN_A'))
			.appendField(
				new Blockly.FieldDropdown(() => {
					return this.useInterruptPins_ ? window.getInterruptPinOptions() : window.getDigitalPinOptions();
				}),
				'PIN_A'
			)
			.appendField(window.languageManager.getMessage('ENCODER_PIN_B'))
			.appendField(
				new Blockly.FieldDropdown(() => {
					return this.useInterruptPins_ ? window.getInterruptPinOptions() : window.getDigitalPinOptions();
				}),
				'PIN_B'
			);

		// 恢復先前的選擇值
		if (pinAValue) {
			this.getField('PIN_A').setValue(pinAValue);
		}

		if (pinBValue) {
			this.getField('PIN_B').setValue(pinBValue);
		}
	},

	// 處理積木的變化
	onchange: function (e) {
		// 檢查是否為中斷選項變更事件
		if (e && e.type === Blockly.Events.BLOCK_CHANGE && e.blockId === this.id && e.name === 'USE_INTERRUPT') {
			const useInterrupt = e.newValue === 'TRUE';
			// 只有在狀態改變時才更新
			if (this.useInterruptPins_ !== useInterrupt) {
				this.useInterruptPins_ = useInterrupt;
				// 更新引腳下拉選單
				this.updatePinDropdowns();
			}
		}
	},

	// 保存勾選框狀態到變異記錄
	mutationToDom: function () {
		const container = Blockly.utils.xml.createElement('mutation');
		container.setAttribute('use_interrupt', this.useInterruptPins_);
		return container;
	},
	// 從變異記錄恢復勾選框狀態
	domToMutation: function (xmlElement) {
		const useInterrupt = xmlElement.getAttribute('use_interrupt') === 'true';
		this.useInterruptPins_ = useInterrupt;

		// 設定勾選框狀態
		this.getField('USE_INTERRUPT').setValue(useInterrupt ? 'TRUE' : 'FALSE');

		// 更新引腳下拉選單
		this.updatePinDropdowns();
	},
};

// 新增讀取編碼馬達位置積木
Blockly.Blocks['encoder_read'] = {
	init: function () {
		// 初始化恢復編碼馬達變數名稱的屬性
		this.restoredEncoderValue = 'myEncoder';

		this.appendDummyInput()
			.appendField(window.languageManager.getMessage('ENCODER_READ'))
			.appendField(
				new Blockly.FieldDropdown(() => {
					// 取得工作區
					const workspace = this.sourceBlock_ ? this.sourceBlock_.workspace : Blockly.getMainWorkspace();
					if (!workspace) {
						log.info('無法取得工作區，返回預設選項 myEncoder');
						return [['myEncoder', 'myEncoder']];
					}

					// 優先使用從變異資料恢復的值，然後才是 getFieldValue
					const currentValue = this.restoredEncoderValue || this.getFieldValue('VAR') || 'myEncoder';
					log.info(`encoder_read: 當前選擇的編碼馬達名稱: ${currentValue}`);

					// 先建立一個以當前值為首位的選項陣列
					const options = [[currentValue, currentValue]];

					// 找出所有 encoder_setup 積木
					const blocks = workspace.getAllBlocks(false);
					const setupBlocks = blocks.filter(block => block.type === 'encoder_setup');
					log.info(`encoder_read: 找到 ${setupBlocks.length} 個編碼馬達設定積木`);

					// 如果沒有找到設定積木，就只返回當前值
					if (setupBlocks.length === 0) {
						log.info('encoder_read: 未找到編碼馬達設定積木，僅返回當前選項');
						return options;
					}

					// 從設定積木中獲取所有編碼馬達名稱，排除當前值以避免重複
					setupBlocks.forEach(block => {
						const name = block.getFieldValue('VAR');
						if (name !== currentValue) {
							// 避免重複添加當前值
							options.push([name, name]);
							log.info(`encoder_read: 添加選項 ${name}`);
						}
					});

					log.info(`encoder_read: 返回選項清單: ${JSON.stringify(options)}`);
					return options;
				}),
				'VAR'
			);
		this.setOutput(true, 'Number');
		this.setStyle('motors_blocks');
		this.setTooltip(window.languageManager.getMessage('ENCODER_READ_TOOLTIP'));
		this.setHelpUrl('');

		// 將此積木標記為預覽功能
		if (window.registerPreviewBlock) {
			window.registerPreviewBlock('encoder_read');
		}
		// 註冊為實驗性積木
		if (window.registerExperimentalBlock) {
			window.registerExperimentalBlock('encoder_read');
		}
	},

	// 新增變異記錄方法，保存選擇的編碼馬達值
	mutationToDom: function () {
		const container = Blockly.utils.xml.createElement('mutation');
		const encoderValue = this.getFieldValue('VAR');
		// 同時更新恢復值屬性
		this.restoredEncoderValue = encoderValue;
		container.setAttribute('encoder', encoderValue);
		log.info(`encoder_read: 儲存變異資料，編碼馬達名稱: ${encoderValue}`);
		return container;
	},

	// 從變異記錄恢復選擇的編碼馬達值
	domToMutation: function (xmlElement) {
		const encoder = xmlElement.getAttribute('encoder');
		if (encoder) {
			log.info(`encoder_read: 從變異資料恢復編碼馬達名稱: ${encoder}`);
			// 在設置字段值的同時，也存儲到我們的備份屬性中
			this.restoredEncoderValue = encoder;
			this.getField('VAR').setValue(encoder);
		} else {
			log.warn('encoder_read: 變異資料中沒有找到編碼馬達名稱');
		}
	},
};

// 新增重設編碼馬達積木
Blockly.Blocks['encoder_reset'] = {
	init: function () {
		// 初始化恢復編碼馬達變數名稱的屬性
		this.restoredEncoderValue = 'myEncoder';

		this.appendDummyInput()
			.appendField(window.languageManager.getMessage('ENCODER_RESET'))
			.appendField(
				new Blockly.FieldDropdown(() => {
					// 取得工作區
					const workspace = this.sourceBlock_ ? this.sourceBlock_.workspace : Blockly.getMainWorkspace();
					if (!workspace) {
						log.info('無法取得工作區，返回預設選項 myEncoder');
						return [['myEncoder', 'myEncoder']];
					}

					// 優先使用從變異資料恢復的值，然後才是 getFieldValue
					const currentValue = this.restoredEncoderValue || this.getFieldValue('VAR') || 'myEncoder';
					log.info(`encoder_reset: 當前選擇的編碼馬達名稱: ${currentValue}`);

					// 先建立一個以當前值為首位的選項陣列
					const options = [[currentValue, currentValue]];

					// 找出所有 encoder_setup 積木
					const blocks = workspace.getAllBlocks(false);
					const setupBlocks = blocks.filter(block => block.type === 'encoder_setup');
					log.info(`encoder_reset: 找到 ${setupBlocks.length} 個編碼馬達設定積木`);

					// 如果沒有找到設定積木，就只返回當前值
					if (setupBlocks.length === 0) {
						log.info('encoder_reset: 未找到編碼馬達設定積木，僅返回當前選項');
						return options;
					}

					// 從設定積木中獲取所有編碼馬達名稱，排除當前值以避免重複
					setupBlocks.forEach(block => {
						const name = block.getFieldValue('VAR');
						if (name !== currentValue) {
							// 避免重複添加當前值
							options.push([name, name]);
							log.info(`encoder_reset: 添加選項 ${name}`);
						}
					});

					log.info(`encoder_reset: 返回選項清單: ${JSON.stringify(options)}`);
					return options;
				}),
				'VAR'
			);
		this.setPreviousStatement(true, null);
		this.setNextStatement(true, null);
		this.setStyle('motors_blocks');
		this.setTooltip(window.languageManager.getMessage('ENCODER_RESET_TOOLTIP'));
		this.setHelpUrl('');

		// 將此積木標記為預覽功能
		if (window.registerPreviewBlock) {
			window.registerPreviewBlock('encoder_reset');
		}
		// 註冊為實驗性積木
		if (window.registerExperimentalBlock) {
			window.registerExperimentalBlock('encoder_reset');
		}
	},

	// 新增變異記錄方法，保存選擇的編碼馬達值
	mutationToDom: function () {
		const container = Blockly.utils.xml.createElement('mutation');
		const encoderValue = this.getFieldValue('VAR');
		// 同時更新恢復值屬性
		this.restoredEncoderValue = encoderValue;
		container.setAttribute('encoder', encoderValue);
		log.info(`encoder_reset: 儲存變異資料，編碼馬達名稱: ${encoderValue}`);
		return container;
	},

	// 從變異記錄恢復選擇的編碼馬達值
	domToMutation: function (xmlElement) {
		const encoder = xmlElement.getAttribute('encoder');
		if (encoder) {
			log.info(`encoder_reset: 從變異資料恢復編碼馬達名稱: ${encoder}`);
			// 在設置字段值的同時，也存儲到我們的備份屬性中
			this.restoredEncoderValue = encoder;
			this.getField('VAR').setValue(encoder);
		} else {
			log.warn('encoder_reset: 變異資料中沒有找到編碼馬達名稱');
		}
	},
};

// 新增PID控制器設定積木
Blockly.Blocks['encoder_pid_setup'] = {
	init: function () {
		// 初始化恢復編碼馬達變數名稱的屬性
		this.restoredEncoderValue = 'myEncoder';

		this.appendDummyInput()
			.appendField(window.languageManager.getMessage('ENCODER_PID_SETUP'))
			.appendField(new Blockly.FieldTextInput('myPID'), 'PID_VAR')
			.appendField(window.languageManager.getMessage('ENCODER_PID_MOTOR'))
			.appendField(
				new Blockly.FieldDropdown(() => {
					// 取得工作區
					const workspace = this.sourceBlock_ ? this.sourceBlock_.workspace : Blockly.getMainWorkspace();
					if (!workspace) {
						log.info('無法取得工作區，返回預設選項 myEncoder');
						return [['myEncoder', 'myEncoder']];
					}

					// 優先使用從變異資料恢復的值，然後才是 getFieldValue
					const currentValue = this.restoredEncoderValue || this.getFieldValue('VAR') || 'myEncoder';
					log.info(`encoder_pid_setup: 當前選擇的編碼馬達名稱: ${currentValue}`);

					// 先建立一個以當前值為首位的選項陣列
					const options = [[currentValue, currentValue]];

					// 找出所有 encoder_setup 積木
					const blocks = workspace.getAllBlocks(false);
					const setupBlocks = blocks.filter(block => block.type === 'encoder_setup');
					log.info(`encoder_pid_setup: 找到 ${setupBlocks.length} 個編碼馬達設定積木`);

					// 如果沒有找到設定積木，就只返回當前值
					if (setupBlocks.length === 0) {
						log.info('encoder_pid_setup: 未找到編碼馬達設定積木，僅返回當前選項');
						return options;
					}

					// 從設定積木中獲取所有編碼馬達名稱，排除當前值以避免重複
					setupBlocks.forEach(block => {
						const name = block.getFieldValue('VAR');
						if (name !== currentValue) {
							// 避免重複添加當前值
							options.push([name, name]);
							log.info(`encoder_pid_setup: 添加選項 ${name}`);
						}
					});

					log.info(`encoder_pid_setup: 返回選項清單: ${JSON.stringify(options)}`);
					return options;
				}),
				'VAR'
			);
		this.appendDummyInput()
			.appendField(window.languageManager.getMessage('ENCODER_PID_KP'))
			.appendField(new Blockly.FieldNumber(1, 0, 100, 0.01), 'KP')
			.appendField(window.languageManager.getMessage('ENCODER_PID_KI'))
			.appendField(new Blockly.FieldNumber(0, 0, 100, 0.01), 'KI')
			.appendField(window.languageManager.getMessage('ENCODER_PID_KD'))
			.appendField(new Blockly.FieldNumber(0, 0, 100, 0.01), 'KD');
		this.setPreviousStatement(true, null);
		this.setNextStatement(true, null);
		this.setStyle('motors_blocks');
		this.setTooltip(window.languageManager.getMessage('ENCODER_PID_SETUP_TOOLTIP'));
		this.setHelpUrl('');

		// 將此積木標記為預覽功能
		if (window.registerPreviewBlock) {
			window.registerPreviewBlock('encoder_pid_setup');
		}
		// 註冊為實驗性積木
		if (window.registerExperimentalBlock) {
			window.registerExperimentalBlock('encoder_pid_setup');
		}
	},

	// 新增變異記錄方法，保存選擇的編碼馬達值
	mutationToDom: function () {
		const container = Blockly.utils.xml.createElement('mutation');
		const encoderValue = this.getFieldValue('VAR');
		// 同時更新恢復值屬性
		this.restoredEncoderValue = encoderValue;
		container.setAttribute('encoder', encoderValue);
		log.info(`encoder_pid_setup: 儲存變異資料，編碼馬達名稱: ${encoderValue}`);
		return container;
	},

	// 從變異記錄恢復選擇的編碼馬達值
	domToMutation: function (xmlElement) {
		const encoder = xmlElement.getAttribute('encoder');
		if (encoder) {
			log.info(`encoder_pid_setup: 從變異資料恢復編碼馬達名稱: ${encoder}`);
			// 在設置字段值的同時，也存儲到我們的備份屬性中
			this.restoredEncoderValue = encoder;
			this.getField('VAR').setValue(encoder);
		} else {
			log.warn('encoder_pid_setup: 變異資料中沒有找到編碼馬達名稱');
		}
	},
};

// 新增計算PID積木
Blockly.Blocks['encoder_pid_compute'] = {
	init: function () {
		// 初始化恢復PID變數名稱的屬性
		this.restoredPIDValue = 'myPID';

		this.appendDummyInput()
			.appendField(window.languageManager.getMessage('ENCODER_PID_COMPUTE'))
			.appendField(
				new Blockly.FieldDropdown(() => {
					// 取得工作區
					const workspace = this.sourceBlock_ ? this.sourceBlock_.workspace : Blockly.getMainWorkspace();
					if (!workspace) {
						log.info('無法取得工作區，返回預設選項 myPID');
						return [['myPID', 'myPID']];
					}

					// 優先使用從變異資料恢復的值，然後才是 getFieldValue
					const currentValue = this.restoredPIDValue || this.getFieldValue('PID_VAR') || 'myPID';
					log.info(`encoder_pid_compute: 當前選擇的PID名稱: ${currentValue}`);

					// 先建立一個以當前值為首位的選項陣列
					const options = [[currentValue, currentValue]];

					// 找出所有 encoder_pid_setup 積木
					const blocks = workspace.getAllBlocks(false);
					const setupBlocks = blocks.filter(block => block.type === 'encoder_pid_setup');
					log.info(`encoder_pid_compute: 找到 ${setupBlocks.length} 個PID設定積木`);

					// 如果沒有找到設定積木，就只返回當前值
					if (setupBlocks.length === 0) {
						log.info('encoder_pid_compute: 未找到PID設定積木，僅返回當前選項');
						return options;
					}

					// 從設定積木中獲取所有PID名稱，排除當前值以避免重複
					setupBlocks.forEach(block => {
						const name = block.getFieldValue('PID_VAR');
						if (name !== currentValue) {
							// 避免重複添加當前值
							options.push([name, name]);
							log.info(`encoder_pid_compute: 添加選項 ${name}`);
						}
					});

					log.info(`encoder_pid_compute: 返回選項清單: ${JSON.stringify(options)}`);
					return options;
				}),
				'PID_VAR'
			);
		this.appendValueInput('TARGET').setCheck('Number').appendField(window.languageManager.getMessage('ENCODER_PID_TARGET'));
		this.setOutput(true, 'Number');
		this.setStyle('motors_blocks');
		this.setTooltip(window.languageManager.getMessage('ENCODER_PID_COMPUTE_TOOLTIP'));
		this.setHelpUrl('');

		// 將此積木標記為預覽功能
		if (window.registerPreviewBlock) {
			window.registerPreviewBlock('encoder_pid_compute');
		}
		// 註冊為實驗性積木
		if (window.registerExperimentalBlock) {
			window.registerExperimentalBlock('encoder_pid_compute');
		}
	},

	// 新增變異記錄方法，保存選擇的PID值
	mutationToDom: function () {
		const container = Blockly.utils.xml.createElement('mutation');
		const pidValue = this.getFieldValue('PID_VAR');
		// 同時更新恢復值屬性
		this.restoredPIDValue = pidValue;
		container.setAttribute('pid', pidValue);
		log.info(`encoder_pid_compute: 儲存變異資料，PID名稱: ${pidValue}`);
		return container;
	},

	// 從變異記錄恢復選擇的PID值
	domToMutation: function (xmlElement) {
		const pid = xmlElement.getAttribute('pid');
		if (pid) {
			log.info(`encoder_pid_compute: 從變異資料恢復PID名稱: ${pid}`);
			// 在設置字段值的同時，也存儲到我們的備份屬性中
			this.restoredPIDValue = pid;
			this.getField('PID_VAR').setValue(pid);
		} else {
			log.warn('encoder_pid_compute: 變異資料中沒有找到PID名稱');
		}
	},
};
