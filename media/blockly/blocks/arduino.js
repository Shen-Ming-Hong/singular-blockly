/**
 * @license
 * Copyright 2024 Singular Blockly Contributors
 * Copyright 2012 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

// 建立腳位模式追蹤所需的全局變數
if (!window.pinModeTracker) {
	window.pinModeTracker = {
		modes: {}, // 存儲腳位模式
		lastBlockId: {}, // 存儲每個腳位最後設定的積木ID
		lastUpdateTime: {}, // 存儲每個腳位最後更新時間戳

		// 標準化腳位名稱，與 arduinoGenerator.normalizePin 保持一致
		normalizePin: function (pin) {
			// 先將 pin 轉為字串以確保一致性
			let pinStr = String(pin);

			// 處理腳位名稱格式，例如將 'D3' 中的數字部分提取出來
			if (pinStr.startsWith('D')) {
				return pinStr.substring(1); // 移除 'D' 前綴，保留數字部分
			}

			// 類比腳位保持原樣 (例如 "A0" 保持為 "A0")
			return pinStr;
		},

		// 設置腳位模式
		setMode: function (pin, mode, blockId) {
			// 標準化腳位名稱
			const normalizedPin = this.normalizePin(pin);

			// 記錄設定此腳位的積木 ID 和時間戳
			if (blockId) {
				this.lastBlockId[normalizedPin] = blockId;
				this.lastUpdateTime[normalizedPin] = Date.now();
			} else if (Blockly.selected) {
				this.lastBlockId[normalizedPin] = Blockly.selected.id;
				this.lastUpdateTime[normalizedPin] = Date.now();
			}

			// 更新內部狀態
			this.modes[normalizedPin] = mode;

			// 同步到 arduinoGenerator.pinModes_
			if (window.arduinoGenerator && window.arduinoGenerator.pinModes_) {
				window.arduinoGenerator.pinModes_[normalizedPin] = mode;
			}

			// 當腳位模式變化時，通知所有相關積木更新警告
			this.updateBlockWarnings(normalizedPin);
		},

		// 獲取腳位模式
		getMode: function (pin) {
			// 標準化腳位名稱
			const normalizedPin = this.normalizePin(pin);

			// 優先從 generator 中獲取，確保與生成程式碼時的檢查一致
			if (window.arduinoGenerator && window.arduinoGenerator.pinModes_ && normalizedPin in window.arduinoGenerator.pinModes_) {
				this.modes[normalizedPin] = window.arduinoGenerator.pinModes_[normalizedPin]; // 同步回來
				return window.arduinoGenerator.pinModes_[normalizedPin];
			}
			return this.modes[normalizedPin] || null;
		},

		// 檢查腳位模式是否符合要求
		checkMode: function (pin, requiredMode) {
			const currentMode = this.getMode(pin);
			if (!currentMode) {
				return true;
			} // 如果沒有設定模式，返回 true (自動設定)
			if (currentMode === requiredMode) {
				return true;
			} // 如果模式符合，返回 true
			return false; // 模式不符合，返回 false (衝突)
		},

		// 取得某個腳位的最後設定積木
		getLastBlock: function (pin) {
			const normalizedPin = this.normalizePin(pin);
			const blockId = this.lastBlockId[normalizedPin];
			if (blockId && Blockly.getMainWorkspace()) {
				return Blockly.getMainWorkspace().getBlockById(blockId);
			}
			return null;
		},

		// 找到最近修改過的積木（基於時間戳）
		getMostRecentBlock: function (pin) {
			const normalizedPin = this.normalizePin(pin);

			// 獲取所有使用此腳位的積木
			const blocks = this.getBlocksUsingPin(pin);

			// 如果沒有積木使用此腳位，返回 null
			if (blocks.length === 0) {
				return null;
			}

			// 如果有時間戳記錄，使用它
			if (this.lastUpdateTime[normalizedPin]) {
				const lastBlockId = this.lastBlockId[normalizedPin];
				const lastBlock = Blockly.getMainWorkspace().getBlockById(lastBlockId);

				// 如果找到最後設定的積木且它在當前工作區中，返回它
				if (lastBlock) {
					return lastBlock;
				}
			}

			// 如果找不到最後設定的積木，返回列表中的最後一個（通常是最後放置的）
			return blocks[blocks.length - 1];
		},

		// 獲取所有使用特定腳位的積木
		getBlocksUsingPin: function (pin) {
			if (!Blockly.getMainWorkspace()) {
				return [];
			}

			const normalizedPin = this.normalizePin(pin);
			const blocks = Blockly.getMainWorkspace().getAllBlocks(false);

			return blocks.filter(block => {
				if (
					[
						'arduino_digital_write',
						'arduino_digital_read',
						'arduino_analog_write',
						'arduino_analog_read',
						'arduino_pullup',
						'arduino_pin_mode',
					].includes(block.type)
				) {
					const blockPin = block.getFieldValue('PIN');
					return blockPin && this.normalizePin(blockPin) === normalizedPin;
				}
				return false;
			});
		},

		// 更新所有使用特定腳位的積木警告
		updateBlockWarnings: function (pin) {
			if (!Blockly.getMainWorkspace()) {
				return;
			}

			const normalizedPin = this.normalizePin(pin);
			const blocks = this.getBlocksUsingPin(pin);

			// 先清除所有使用此腳位的積木的警告
			blocks.forEach(block => block.setWarningText(null));

			// 獲取當前腳位的模式
			const currentMode = this.getMode(pin);
			if (!currentMode) {
				return;
			}

			// 獲取最後修改此腳位的積木
			const lastBlock = this.getMostRecentBlock(pin);
			if (!lastBlock) {
				return;
			}

			// 遍歷所有積木，找到與最後設置的積木模式不兼容的積木
			blocks.forEach(block => {
				// 跳過最後設定的積木
				if (block.id === lastBlock.id) {
					return;
				}

				// 根據積木類型確定需要的模式
				let requiredMode;
				switch (block.type) {
					case 'arduino_digital_write':
					case 'arduino_analog_write':
						requiredMode = 'OUTPUT';
						break;
					case 'arduino_pin_mode':
						if (block.getFieldValue('MODE') === 'OUTPUT') {
							requiredMode = 'OUTPUT';
						} else {
							requiredMode = ['INPUT', 'INPUT_PULLUP'];
						}
						break;
					case 'arduino_digital_read':
					case 'arduino_analog_read':
					case 'arduino_pullup':
						requiredMode = ['INPUT', 'INPUT_PULLUP'];
						break;
				}

				// 檢查模式是否兼容
				const isCompatible = Array.isArray(requiredMode) ? requiredMode.includes(currentMode) : requiredMode === currentMode;

				if (!isCompatible) {
					// 清除其他積木的警告，在最後設定的積木上顯示警告
					block.setWarningText(null);

					// 根據積木類型顯示適當的警告
					let warningText = '';
					const blockPin = block.getFieldValue('PIN');
					switch (block.type) {
						case 'arduino_digital_write':
							warningText = `腳位 ${blockPin} 被設為 ${currentMode} 模式，但 digitalWrite 需要 OUTPUT 模式`;
							break;
						case 'arduino_analog_write':
							warningText = `腳位 ${blockPin} 被設為 ${currentMode} 模式，但 analogWrite 需要 OUTPUT 模式`;
							break;
						case 'arduino_digital_read':
							warningText = `腳位 ${blockPin} 被設為 ${currentMode} 模式，但 digitalRead 需要 INPUT 或 INPUT_PULLUP 模式`;
							break;
						case 'arduino_analog_read':
							warningText = `腳位 ${blockPin} 被設為 ${currentMode} 模式，但 analogRead 需要 INPUT 或 INPUT_PULLUP 模式`;
							break;
						case 'arduino_pullup':
							warningText = `腳位 ${blockPin} 被設為 ${currentMode} 模式，但 內部上拉電阻 需要 INPUT 模式`;
							break;
						case 'arduino_pin_mode':
							const mode = block.getFieldValue('MODE');
							warningText = `腳位 ${blockPin} 被設為 ${currentMode} 模式，但嘗試設置為 ${mode} 模式`;
							break;
					}

					// 在最後設定的積木上顯示警告
					lastBlock.setWarningText(warningText);
				}
			});
		},

		// 重置所有腳位模式
		reset: function () {
			this.modes = {};
			this.lastBlockId = {};
			this.lastUpdateTime = {};
			// 同步重置 generator 的腳位模式
			if (window.arduinoGenerator && window.arduinoGenerator.pinModes_) {
				window.arduinoGenerator.pinModes_ = {};
			}
		},

		// 與 generator 的腳位模式同步
		syncFromGenerator: function () {
			if (window.arduinoGenerator && window.arduinoGenerator.pinModes_) {
				// 將 generator 中的所有腳位模式同步到 pinModeTracker
				for (const pin in window.arduinoGenerator.pinModes_) {
					this.modes[pin] = window.arduinoGenerator.pinModes_[pin];
				}

				// 更新所有積木的警告
				this.updateAllBlockWarnings();
			}
		},

		// 重新掃描所有使用特定腳位的積木
		rescanPinUsages: function (pin) {
			const normalizedPin = this.normalizePin(pin);
			const blocks = this.getBlocksUsingPin(pin);

			if (blocks.length === 0) {
				// 如果沒有積木使用此腳位，清除記錄
				delete this.modes[normalizedPin];
				delete this.lastBlockId[normalizedPin];
				delete this.lastUpdateTime[normalizedPin];
				return;
			}

			// 找到最後一個積木（基於UI順序）
			const lastBlock = blocks[blocks.length - 1];

			// 更新時間戳和ID
			this.lastBlockId[normalizedPin] = lastBlock.id;
			this.lastUpdateTime[normalizedPin] = Date.now();

			// 根據最後一個積木的類型設置模式
			let mode;
			switch (lastBlock.type) {
				case 'arduino_digital_write':
				case 'arduino_analog_write':
					mode = 'OUTPUT';
					break;
				case 'arduino_digital_read':
				case 'arduino_analog_read':
					mode = 'INPUT';
					break;
				case 'arduino_pullup':
					mode = 'INPUT_PULLUP';
					break;
				case 'arduino_pin_mode':
					mode = lastBlock.getFieldValue('MODE');
					break;
			}

			// 設置模式並更新警告
			if (mode) {
				this.modes[normalizedPin] = mode;
				this.updateBlockWarnings(normalizedPin);
			}
		},

		// 監聽積木變化事件
		handleBlockEvent: function (event) {
			// 如果工作區被銷毀，直接返回
			if (!Blockly.getMainWorkspace()) {
				return;
			}

			// 處理積木移動事件
			if (event.type === Blockly.Events.BLOCK_MOVE) {
				// 區塊移動後需要重新掃描所有腳位使用情況
				setTimeout(() => {
					// 獲取所有與Arduino IO相關的積木
					const blocks = Blockly.getMainWorkspace()
						.getAllBlocks(false)
						.filter(block =>
							[
								'arduino_digital_write',
								'arduino_digital_read',
								'arduino_analog_write',
								'arduino_analog_read',
								'arduino_pullup',
								'arduino_pin_mode',
							].includes(block.type)
						);

					// 收集所有使用的腳位
					const usedPins = new Set();
					blocks.forEach(block => {
						const pin = block.getFieldValue('PIN');
						if (pin) {
							usedPins.add(this.normalizePin(pin));
						}
					});

					// 對每個腳位重新掃描並更新
					usedPins.forEach(pin => this.rescanPinUsages(pin));
				}, 10);
			}
			// 處理積木屬性變更或創建事件
			else if (event.type === Blockly.Events.BLOCK_CHANGE || event.type === Blockly.Events.BLOCK_CREATE) {
				const block = Blockly.getMainWorkspace().getBlockById(event.blockId);
				if (block) {
					if (
						[
							'arduino_digital_write',
							'arduino_digital_read',
							'arduino_analog_write',
							'arduino_analog_read',
							'arduino_pullup',
							'arduino_pin_mode',
						].includes(block.type)
					) {
						const pin = block.getFieldValue('PIN');
						if (pin) {
							// 更新當前積木的時間戳
							const normalizedPin = this.normalizePin(pin);
							this.lastUpdateTime[normalizedPin] = Date.now();
							this.lastBlockId[normalizedPin] = block.id;

							// 設置適當的模式
							let mode;
							switch (block.type) {
								case 'arduino_digital_write':
								case 'arduino_analog_write':
									mode = 'OUTPUT';
									break;
								case 'arduino_digital_read':
								case 'arduino_analog_read':
									mode = 'INPUT';
									break;
								case 'arduino_pullup':
									mode = 'INPUT_PULLUP';
									break;
								case 'arduino_pin_mode':
									mode = block.getFieldValue('MODE');
									break;
							}

							if (mode) {
								this.modes[normalizedPin] = mode;
							}

							// 延遲更新以確保UI已經完成更新
							setTimeout(() => {
								this.updateBlockWarnings(pin);
							}, 10);
						}
					}
				}
			}
		},

		// 更新所有積木警告
		updateAllBlockWarnings: function () {
			if (!Blockly.getMainWorkspace()) {
				return;
			}

			// 先清除所有積木的警告
			const blocks = Blockly.getMainWorkspace().getAllBlocks(false);
			blocks.forEach(block => {
				if (
					[
						'arduino_digital_write',
						'arduino_digital_read',
						'arduino_analog_write',
						'arduino_analog_read',
						'arduino_pullup',
						'arduino_pin_mode',
					].includes(block.type)
				) {
					block.setWarningText(null);
				}
			});

			// 遍歷所有腳位，更新警告
			for (const pin in this.modes) {
				this.updateBlockWarnings(pin);
			}
		},
	};

	// 在工作區變化時添加事件監聽
	if (Blockly.getMainWorkspace()) {
		// 添加工作區變化監聽器
		Blockly.getMainWorkspace().addChangeListener(function (event) {
			if (event.type === Blockly.Events.FINISHED_LOADING) {
				window.pinModeTracker.reset();
			}

			// 處理積木事件
			window.pinModeTracker.handleBlockEvent(event);
		});
	}
}

Blockly.Blocks['arduino_setup_loop'] = {
	init: function () {
		this.appendStatementInput('SETUP').setCheck(null).appendField(window.languageManager.getMessage('ARDUINO_SETUP'));
		this.appendStatementInput('LOOP').setCheck(null).appendField(window.languageManager.getMessage('ARDUINO_LOOP'));
		this.setColour('#00979C');
		this.setTooltip('Arduino 程式的基本結構');
		this.setHelpUrl('');
	},
};

Blockly.Blocks['arduino_digital_write'] = {
	init: function () {
		this.lastKnownBoard_ = window.currentBoard;

		this.appendDummyInput()
			.appendField(window.languageManager.getMessage('ARDUINO_DIGITAL_WRITE'))
			.appendField(window.languageManager.getMessage('ARDUINO_PIN'))
			.appendField(
				new Blockly.FieldDropdown(function () {
					return window.getDigitalPinOptions();
				}),
				'PIN'
			);

		this.appendValueInput('VALUE')
			.setCheck(['Boolean', 'Number', 'String'])
			.appendField(window.languageManager.getMessage('ARDUINO_VALUE'))
			.setShadowDom(Blockly.utils.xml.textToDom('<shadow type="arduino_level"><field name="LEVEL">LOW</field></shadow>'));

		this.setInputsInline(true);
		this.setPreviousStatement(true, null);
		this.setNextStatement(true, null);
		this.setColour('#00979C');
		this.setTooltip('寫入數位輸出值到指定的腳位，可以是布林值、數字或變數');
		this.setHelpUrl('');
	},

	onchange: function (e) {
		if (window.currentBoard !== this.lastKnownBoard_) {
			this.lastKnownBoard_ = window.currentBoard;
			const pinField = this.getField('PIN');
			if (pinField) {
				pinField.setValue(pinField.getValue());
				this.render();
			}
		}

		if (e.type === Blockly.Events.BLOCK_MOVE) {
			const valueInput = this.getInput('VALUE');
			if (valueInput && valueInput.connection && !valueInput.connection.targetConnection) {
				if (!valueInput.connection.shadowDom_) {
					valueInput.setShadowDom(
						Blockly.utils.xml.textToDom('<shadow type="arduino_level"><field name="LEVEL">LOW</field></shadow>')
					);
				}
			}
		}

		// 當 digitalWrite 積木發生變化且在正常工作區中，設置腳位模式
		if (this.workspace && !this.workspace.isFlyout && !this.isInFlyout) {
			const pin = this.getFieldValue('PIN');
			if (pin) {
				// 設置腳位為 OUTPUT 模式，同時傳入積木 ID 以追踪最後修改的積木
				window.pinModeTracker.setMode(pin, 'OUTPUT', this.id);
			}
		}
	},
};

Blockly.Blocks['arduino_digital_read'] = {
	init: function () {
		this.lastKnownBoard_ = window.currentBoard;

		this.appendDummyInput()
			.appendField(window.languageManager.getMessage('ARDUINO_DIGITAL_READ'))
			.appendField(window.languageManager.getMessage('ARDUINO_PIN'))
			.appendField(
				new Blockly.FieldDropdown(function () {
					return window.getDigitalPinOptions();
				}),
				'PIN'
			);
		this.setOutput(true, 'Boolean');
		this.setColour('#00979C');
		this.setTooltip('從指定的腳位讀取數位輸入值');
		this.setHelpUrl('');
	},

	onchange: function (e) {
		if (window.currentBoard !== this.lastKnownBoard_) {
			this.lastKnownBoard_ = window.currentBoard;
			const pinField = this.getField('PIN');
			if (pinField) {
				pinField.setValue(pinField.getValue());
				this.render();
			}
		}

		// 當 digitalRead 積木發生變化且在正常工作區中，設置腳位模式
		if (this.workspace && !this.workspace.isFlyout && !this.isInFlyout) {
			const pin = this.getFieldValue('PIN');
			if (pin) {
				// 設置腳位為 INPUT 模式，同時傳入積木 ID 以追踪最後修改的積木
				window.pinModeTracker.setMode(pin, 'INPUT', this.id);
			}
		}
	},
};

Blockly.Blocks['arduino_analog_write'] = {
	init: function () {
		this.lastKnownBoard_ = window.currentBoard;
		const range = window.getAnalogOutputRange();

		this.appendDummyInput()
			.appendField(window.languageManager.getMessage('ARDUINO_ANALOG_WRITE'))
			.appendField(window.languageManager.getMessage('ARDUINO_PIN'))
			.appendField(
				new Blockly.FieldDropdown(function () {
					return window.getDigitalPinOptions().filter(pin => pin[0].includes('PWM'));
				}),
				'PIN'
			);

		this.appendValueInput('VALUE')
			.setCheck(['Number', 'String'])
			.appendField(window.languageManager.getMessage('ARDUINO_VALUE'))
			.setShadowDom(
				Blockly.utils.xml.textToDom(`<shadow type="math_number"><field name="NUM">${range.defaultValue}</field></shadow>`)
			);

		this.setInputsInline(true);
		this.setPreviousStatement(true, null);
		this.setNextStatement(true, null);
		this.setColour('#00979C');
		this.setTooltip(`寫入類比值(${range.min}-${range.max})到指定的腳位`);
		this.setHelpUrl('');
	},

	onchange: function (e) {
		if (window.currentBoard !== this.lastKnownBoard_) {
			this.lastKnownBoard_ = window.currentBoard;
			const range = window.getAnalogOutputRange();
			const pinField = this.getField('PIN');
			if (pinField) {
				pinField.setValue(pinField.getValue());
			}

			const valueBlock = this.getInput('VALUE').connection.targetBlock();
			if (valueBlock && valueBlock.type === 'math_number' && valueBlock.isShadow()) {
				const numField = valueBlock.getField('NUM');
				const currentValue = numField.getValue();
				if (currentValue < range.min) {
					numField.setValue(range.min);
				}
				if (currentValue > range.max) {
					numField.setValue(range.max);
				}
			}
			this.setTooltip(`寫入類比值(${range.min}-${range.max})到指定的腳位`);
			this.render();
		}

		if (e.type === Blockly.Events.BLOCK_MOVE) {
			const valueInput = this.getInput('VALUE');
			if (valueInput && valueInput.connection && !valueInput.connection.targetConnection) {
				const range = window.getAnalogOutputRange();
				if (!valueInput.connection.shadowDom_) {
					valueInput.setShadowDom(
						Blockly.utils.xml.textToDom(`<shadow type="math_number"><field name="NUM">${range.defaultValue}</field></shadow>`)
					);
				}
			}
		}

		// 當 analogWrite 積木發生變化且在正常工作區中，設置腳位模式
		if (this.workspace && !this.workspace.isFlyout && !this.isInFlyout) {
			const pin = this.getFieldValue('PIN');
			if (pin) {
				// 設置腳位為 OUTPUT 模式，同時傳入積木 ID 以追踪最後修改的積木
				window.pinModeTracker.setMode(pin, 'OUTPUT', this.id);
			}
		}
	},
};

Blockly.Blocks['arduino_analog_read'] = {
	init: function () {
		this.lastKnownBoard_ = window.currentBoard;

		this.appendDummyInput()
			.appendField(window.languageManager.getMessage('ARDUINO_ANALOG_READ'))
			.appendField(window.languageManager.getMessage('ARDUINO_PIN'))
			.appendField(
				new Blockly.FieldDropdown(function () {
					return window.getAnalogPinOptions();
				}),
				'PIN'
			);
		this.setOutput(true, 'Number');
		this.setColour('#00979C');
		this.setTooltip('從指定的腳位讀取類比值');
		this.setHelpUrl('');
	},

	onchange: function (e) {
		if (window.currentBoard !== this.lastKnownBoard_) {
			this.lastKnownBoard_ = window.currentBoard;
			const pinField = this.getField('PIN');
			if (pinField) {
				pinField.setValue(pinField.getValue());
				this.render();
			}
		}

		// 當 analogRead 積木發生變化且在正常工作區中，設置腳位模式
		if (this.workspace && !this.workspace.isFlyout && !this.isInFlyout) {
			const pin = this.getFieldValue('PIN');
			if (pin) {
				// 設置腳位為 INPUT 模式，同時傳入積木 ID 以追踪最後修改的積木
				window.pinModeTracker.setMode(pin, 'INPUT', this.id);
			}
		}
	},
};

Blockly.Blocks['arduino_delay'] = {
	init: function () {
		this.appendDummyInput()
			.appendField(window.languageManager.getMessage('ARDUINO_DELAY'))
			.appendField(new Blockly.FieldNumber(1000, 0), 'TIME')
			.appendField(window.languageManager.getMessage('ARDUINO_DELAY_MS'));
		this.setPreviousStatement(true, null);
		this.setNextStatement(true, null);
		this.setColour('#00979C');
		this.setTooltip('暫停程式執行指定的毫秒數');
		this.setHelpUrl('');
	},
};

Blockly.Blocks['arduino_level'] = {
	init: function () {
		this.appendDummyInput().appendField(
			new Blockly.FieldDropdown([
				['HIGH', 'HIGH'],
				['LOW', 'LOW'],
			]),
			'LEVEL'
		);
		this.setOutput(true, ['Boolean', 'Number']);
		this.setColour('#00979C');
		this.setTooltip('Arduino 的 HIGH (1) 或 LOW (0) 常數');
		this.setHelpUrl('https://www.arduino.cc/reference/en/language/variables/constants/constants/');
	},
};

Blockly.Blocks['arduino_pullup'] = {
	init: function () {
		this.lastKnownBoard_ = window.currentBoard;

		this.appendDummyInput()
			.appendField(window.languageManager.getMessage('ARDUINO_PULLUP'))
			.appendField(window.languageManager.getMessage('ARDUINO_PIN'))
			.appendField(
				new Blockly.FieldDropdown(function () {
					return window.getPullupPinOptions();
				}),
				'PIN'
			);

		this.setInputsInline(true);
		this.setPreviousStatement(true, null);
		this.setNextStatement(true, null);
		this.setColour('#00979C');
		this.setTooltip(window.languageManager.getMessage('ARDUINO_PULLUP'));
		this.setHelpUrl('');
	},

	onchange: function (e) {
		if (window.currentBoard !== this.lastKnownBoard_) {
			this.lastKnownBoard_ = window.currentBoard;
			const pinField = this.getField('PIN');
			if (pinField) {
				pinField.setValue(pinField.getValue());
				this.render();
			}
		}

		// 當 pullup 積木發生變化時，更新腳位模式追蹤
		const pin = this.getFieldValue('PIN');
		if (pin) {
			// 檢查腳位模式是否與要求的模式衝突
			const currentMode = window.pinModeTracker.getMode(pin);
			// 只有當腳位模式已設定且不是輸入模式時顯示警告
			if (currentMode && currentMode !== 'INPUT' && currentMode !== 'INPUT_PULLUP') {
				this.setWarningText(`腳位 ${pin} 被設為 ${currentMode} 模式，但 內部上拉電阻 需要 INPUT 模式`);
			} else {
				this.setWarningText(null);
				// 設置腳位模式為 INPUT_PULLUP
				window.pinModeTracker.setMode(pin, 'INPUT_PULLUP');
			}
		}
	},
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
		this.setColour('#A1887F');
		this.setTooltip('在指定的時間內重複執行程式');
		this.setHelpUrl('');
	},
};

Blockly.Blocks['text_print'] = {
	init: function () {
		this.appendValueInput('TEXT').setCheck(null).appendField(window.languageManager.getMessage('TEXT_PRINT_SHOW'));
		this.appendDummyInput()
			.appendField(new Blockly.FieldCheckbox('TRUE'), 'NEW_LINE')
			.appendField(window.languageManager.getMessage('TEXT_PRINT_NEWLINE'));
		this.setInputsInline(true);
		this.setPreviousStatement(true, null);
		this.setNextStatement(true, null);
		this.setColour('#FB8C00');
		this.setTooltip('在序列埠監控視窗顯示文字');
		this.setHelpUrl('');
	},
};

Blockly.Blocks['arduino_pin_mode'] = {
	init: function () {
		this.lastKnownBoard_ = window.currentBoard;

		this.appendDummyInput()
			.appendField(window.languageManager.getMessage('PIN_MODE_SET'))
			.appendField(window.languageManager.getMessage('ARDUINO_PIN'))
			.appendField(
				new Blockly.FieldDropdown(function () {
					return window.getDigitalPinOptions();
				}),
				'PIN'
			)
			.appendField(window.languageManager.getMessage('ARDUINO_MODE'))
			.appendField(
				new Blockly.FieldDropdown([
					[window.languageManager.getMessage('ARDUINO_MODE_INPUT'), 'INPUT'],
					[window.languageManager.getMessage('ARDUINO_MODE_OUTPUT'), 'OUTPUT'],
				]),
				'MODE'
			);

		this.setInputsInline(true);
		this.setPreviousStatement(true, null);
		this.setNextStatement(true, null);
		this.setColour('#00979C');
		this.setTooltip('設定指定腳位的運作模式（輸入/輸出）');
		this.setHelpUrl('');
	},

	onchange: function (e) {
		if (window.currentBoard !== this.lastKnownBoard_) {
			this.lastKnownBoard_ = window.currentBoard;
			const pinField = this.getField('PIN');
			if (pinField) {
				pinField.setValue(pinField.getValue());
				this.render();
			}
		}

		// 當 pinMode 積木發生變化時，更新腳位模式追蹤
		const pin = this.getFieldValue('PIN');
		const mode = this.getFieldValue('MODE');
		if (pin && mode) {
			// 這將觸發所有使用此腳位的積木更新其警告
			window.pinModeTracker.setMode(pin, mode);
		}
	},
};

Blockly.Blocks['math_map'] = {
	init: function () {
		this.appendValueInput('VALUE').setCheck('Number').appendField(window.languageManager.getMessage('MATH_MAP_VALUE'));
		this.appendValueInput('FROM_LOW').setCheck('Number').appendField('(');
		this.appendValueInput('FROM_HIGH').setCheck('Number').appendField(',');
		this.appendValueInput('TO_LOW').setCheck('Number').appendField('→');
		this.appendValueInput('TO_HIGH').setCheck('Number').appendField(',');
		this.appendDummyInput().appendField(')');
		this.setInputsInline(true);
		this.setOutput(true, 'Number');
		this.setColour('#66BB6A');
		this.setTooltip(window.languageManager.getMessage('MATH_MAP_TOOLTIP'));
		this.setHelpUrl('https://www.arduino.cc/reference/en/language/functions/math/map/');
	},
};

Blockly.Blocks['seven_segment_display'] = {
	init: function () {
		this.appendDummyInput()
			.appendField(window.languageManager.getMessage('SEVEN_SEGMENT_DISPLAY'))
			.appendField(
				new Blockly.FieldDropdown([
					[window.languageManager.getMessage('SEVEN_SEGMENT_COMMON_CATHODE'), 'COMMON_CATHODE'],
					[window.languageManager.getMessage('SEVEN_SEGMENT_COMMON_ANODE'), 'COMMON_ANODE'],
				]),
				'TYPE'
			);
		this.appendValueInput('NUMBER')
			.setCheck('Number')
			.appendField(window.languageManager.getMessage('SEVEN_SEGMENT_NUMBER'))
			.setShadowDom(Blockly.utils.xml.textToDom('<shadow type="math_number"><field name="NUM">0</field></shadow>'));
		this.appendDummyInput()
			.appendField(window.languageManager.getMessage('SEVEN_SEGMENT_DECIMAL_POINT'))
			.appendField(new Blockly.FieldCheckbox('FALSE'), 'DECIMAL_POINT');
		this.setInputsInline(true);
		this.setPreviousStatement(true, null);
		this.setNextStatement(true, null);
		this.setColour('#00979C');
		this.setTooltip(window.languageManager.getMessage('SEVEN_SEGMENT_TOOLTIP'));
		this.setHelpUrl('https://www.arduino.cc/reference/en/');
	},
};

Blockly.Blocks['seven_segment_pins'] = {
	init: function () {
		this.lastKnownBoard_ = window.currentBoard;

		this.appendDummyInput().appendField(window.languageManager.getMessage('SEVEN_SEGMENT_PINS_SET'));

		// 為七段顯示器的每個段位添加腳位設定
		const segments = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'DP'];
		const positions = [
			[0, 0],
			[0, 1], // A, B
			[1, 0],
			[1, 1], // C, D
			[2, 0],
			[2, 1], // E, F
			[3, 0],
			[3, 1], // G, DP
		];

		for (let i = 0; i < segments.length; i++) {
			const segment = segments[i];
			const [row, col] = positions[i];

			this.appendDummyInput()
				.appendField(segment + ':')
				.appendField(
					new Blockly.FieldDropdown(function () {
						return window.getDigitalPinOptions();
					}),
					'PIN_' + segment
				)
				.setAlign(Blockly.ALIGN_RIGHT);
		}

		this.setInputsInline(false);
		this.setPreviousStatement(true, null);
		this.setNextStatement(true, null);
		this.setColour('#00979C');
		this.setTooltip(window.languageManager.getMessage('SEVEN_SEGMENT_PINS_TOOLTIP'));
		this.setHelpUrl('https://www.arduino.cc/reference/en/');
	},

	onchange: function () {
		if (window.currentBoard !== this.lastKnownBoard_) {
			this.lastKnownBoard_ = window.currentBoard;
			const segments = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'DP'];

			for (const segment of segments) {
				const pinField = this.getField('PIN_' + segment);
				if (pinField) {
					pinField.setValue(pinField.getValue());
				}
			}
			this.render();
		}
	},
};

Blockly.Blocks['threshold_function_setup'] = {
	init: function () {
		this.appendDummyInput().appendField(new Blockly.FieldTextInput('Func0'), 'NAME');
		this.appendDummyInput()
			.appendField(window.languageManager.getMessage('THRESHOLD_PIN'))
			.appendField(
				new Blockly.FieldDropdown(function () {
					return window.getAnalogPinOptions();
				}),
				'PIN'
			);
		this.appendValueInput('THRESHOLD')
			.setCheck('Number')
			.appendField(window.languageManager.getMessage('THRESHOLD_VALUE'))
			.setShadowDom(Blockly.utils.xml.textToDom('<shadow type="math_number"><field name="NUM">450</field></shadow>'));
		this.appendValueInput('HIGH_VALUE')
			.appendField(window.languageManager.getMessage('THRESHOLD_HIGH_VALUE'))
			.setShadowDom(Blockly.utils.xml.textToDom('<shadow type="math_number"><field name="NUM">1</field></shadow>'));
		this.appendValueInput('LOW_VALUE')
			.appendField(window.languageManager.getMessage('THRESHOLD_LOW_VALUE'))
			.setShadowDom(Blockly.utils.xml.textToDom('<shadow type="math_number"><field name="NUM">0</field></shadow>'));
		this.setInputsInline(true);
		this.setPreviousStatement(true, null);
		this.setNextStatement(true, null);
		this.setColour('#00979C');
		this.setTooltip(window.languageManager.getMessage('THRESHOLD_TOOLTIP_SETUP'));
	},
};

Blockly.Blocks['threshold_function_read'] = {
	init: function () {
		this.appendDummyInput().appendField(
			new Blockly.FieldDropdown(() => {
				// Make sure we have access to the workspace
				const workspace = this.sourceBlock_ ? this.sourceBlock_.workspace : Blockly.getMainWorkspace();
				if (!workspace) {
					return [['Func0', 'Func0']];
				}

				// Find all threshold function setup blocks to get available function names
				const blocks = workspace.getAllBlocks(false);
				const functions = blocks
					.filter(block => block.type === 'threshold_function_setup')
					.map(block => {
						const name = block.getFieldValue('NAME');
						return [name, name];
					});
				return functions.length > 0 ? functions : [['Func0', 'Func0']];
			}),
			'FUNC'
		);
		this.setOutput(true, null);
		this.setColour('#00979C');
		this.setTooltip(window.languageManager.getMessage('THRESHOLD_TOOLTIP_READ'));
	},
};
