/**
 * @license
 * Copyright 2025 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

Blockly.Blocks['ultrasonic_sensor'] = {
	init: function () {
		this.lastKnownBoard_ = window.currentBoard;

		this.appendDummyInput().appendField(window.languageManager.getMessage('ULTRASONIC_SENSOR'));

		this.appendDummyInput()
			.appendField(window.languageManager.getMessage('ULTRASONIC_TRIG_PIN'))
			.appendField(
				new Blockly.FieldDropdown(function () {
					return window.getDigitalPinOptions();
				}),
				'TRIG_PIN'
			);
		// 使用自訂函數動態生成 Echo 腳位選項
		this.appendDummyInput()
			.appendField(window.languageManager.getMessage('ULTRASONIC_ECHO_PIN'))
			.appendField(
				new Blockly.FieldDropdown(() => {
					// 獲取中斷狀態
					const useInterrupt = this.getFieldValue('USE_INTERRUPT') === 'TRUE';

					// 如果中斷模式啟用且有定義中斷腳位，則只顯示支援中斷的腳位
					if (useInterrupt && window.BOARD_CONFIGS[window.currentBoard]?.interruptPins) {
						return window.BOARD_CONFIGS[window.currentBoard].interruptPins;
					}
					// 否則顯示所有數位腳位
					return window.getDigitalPinOptions();
				}),
				'ECHO_PIN'
			);
		this.appendDummyInput()
			.appendField(window.languageManager.getMessage('ULTRASONIC_USE_INTERRUPT'))
			.appendField(new Blockly.FieldCheckbox('FALSE'), 'USE_INTERRUPT');
		this.setInputsInline(false);
		this.setPreviousStatement(true, null);
		this.setNextStatement(true, null);
		this.setStyle('sensor_blocks');
		this.setTooltip(window.languageManager.getMessage('ULTRASONIC_TOOLTIP_SETUP'));
		this.setHelpUrl('');
	},
	// 取得目前開發板支援的中斷腳位
	getInterruptPinOptions: function () {
		if (window.BOARD_CONFIGS[window.currentBoard]?.interruptPins) {
			return window.BOARD_CONFIGS[window.currentBoard].interruptPins;
		}
		// 如果沒有定義中斷腳位，返回空陣列
		return [];
	},

	// 重新產生 Echo 腳位選單
	updateEchoPinDropdown: function () {
		const echoPinField = this.getField('ECHO_PIN');
		const useInterrupt = this.getFieldValue('USE_INTERRUPT') === 'TRUE';

		if (echoPinField) {
			// 保存當前選擇的值
			const currentValue = echoPinField.getValue();

			// 替換下拉選單內容
			if (useInterrupt) {
				const interruptPins = this.getInterruptPinOptions();
				if (interruptPins.length > 0) {
					echoPinField.menuGenerator_ = interruptPins;

					// 檢查當前值是否在新的選項列表中
					const pinValues = interruptPins.map(pin => pin[1]);
					if (!pinValues.includes(currentValue) && pinValues.length > 0) {
						// 如果當前值不在選項中，設為第一個選項
						echoPinField.setValue(pinValues[0]);
					}
				}
			} else {
				// 非中斷模式，使用所有數位腳位
				echoPinField.menuGenerator_ = window.getDigitalPinOptions();
			}

			// 重新渲染積木
			this.render();
		}
	},

	onchange: function (e) {
		// 開發板變更時更新腳位選單
		if (window.currentBoard !== this.lastKnownBoard_) {
			this.lastKnownBoard_ = window.currentBoard;
			const trigPinField = this.getField('TRIG_PIN');
			const echoPinField = this.getField('ECHO_PIN');
			if (trigPinField && echoPinField) {
				trigPinField.setValue(trigPinField.getValue());
				// 更新 Echo 腳位下拉選單
				this.updateEchoPinDropdown();
			}
		}

		// 檢查是否為中斷選項變更事件
		if (e && e.type === Blockly.Events.BLOCK_CHANGE && e.blockId === this.id && e.name === 'USE_INTERRUPT') {
			// 中斷選項改變，更新 Echo 腳位下拉選單
			this.updateEchoPinDropdown();
		}

		// 當超音波積木有變化且在正常工作區中時
		if (this.workspace && !this.workspace.isFlyout && !this.isInFlyout) {
			const trigPin = this.getFieldValue('TRIG_PIN');
			const echoPin = this.getFieldValue('ECHO_PIN');
			const useInterrupt = this.getFieldValue('USE_INTERRUPT') === 'TRUE';

			if (trigPin) {
				// 設置 Trig 腳位為 OUTPUT 模式
				window.pinModeTracker.setMode(trigPin, 'OUTPUT', this.id);
			}

			if (echoPin) {
				// 設置 Echo 腳位為 INPUT 模式
				window.pinModeTracker.setMode(echoPin, 'INPUT', this.id);
			} // 如果啟用硬體中斷，檢查所選 Echo 腳位是否為有效的中斷腳位
			if (useInterrupt) {
				const board = window.BOARD_CONFIGS[window.currentBoard];
				if (board && board.interruptPins) {
					const interruptPinValues = board.interruptPins.map(pin => pin[1]);
					if (!interruptPinValues.includes(echoPin)) {
						// 使用語言變數並格式化警告訊息
						const warningMessage = window.languageManager
							.getMessage('ULTRASONIC_WARNING')
							.replace('{0}', echoPin)
							.replace('{1}', interruptPinValues.join(', '));
						this.setWarningText(warningMessage);
					} else {
						this.setWarningText(null);
					}
				}
			} else {
				this.setWarningText(null);
			}
		}
	},
};

Blockly.Blocks['ultrasonic_read'] = {
	init: function () {
		this.appendDummyInput().appendField(window.languageManager.getMessage('ULTRASONIC_READ'));

		this.setOutput(true, 'Number');
		this.setStyle('sensor_blocks');
		this.setTooltip(window.languageManager.getMessage('ULTRASONIC_TOOLTIP_READ'));
		this.setHelpUrl('');
	},
};

// 新增超音波觸發積木
Blockly.Blocks['ultrasonic_trigger'] = {
	init: function () {
		this.appendDummyInput().appendField(window.languageManager.getMessage('ULTRASONIC_TRIGGER', '發送超音波訊號'));

		this.setPreviousStatement(true, null);
		this.setNextStatement(true, null);
		this.setStyle('sensor_blocks');
		this.setTooltip(
			window.languageManager.getMessage('ULTRASONIC_TOOLTIP_TRIGGER', '發送超音波感測器的觸發訊號，在中斷模式下使用以手動觸發測量。')
		);
		this.setHelpUrl('');
	},

	onchange: function () {
		// 檢查工作區中是否有超音波感測器積木
		if (this.workspace && !this.workspace.isFlyout && !this.isInFlyout) {
			// 尋找超音波感測器積木
			const blocks = this.workspace.getAllBlocks(false);
			let hasUltrasonicSensor = false;

			for (let i = 0; i < blocks.length; i++) {
				if (blocks[i].type === 'ultrasonic_sensor') {
					hasUltrasonicSensor = true;
					break;
				}
			}

			// 如果沒有找到超音波感測器積木，顯示警告
			if (!hasUltrasonicSensor) {
				this.setWarningText(window.languageManager.getMessage('ULTRASONIC_WARNING_NO_SENSOR', '請先添加超音波感測器設定積木！'));
			} else {
				this.setWarningText(null);
			}
		}
	},
};
