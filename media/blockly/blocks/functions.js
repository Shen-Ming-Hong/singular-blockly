/**
 * @license
 * Copyright 2025 Singular Blockly Contributors
 * Copyright 2012 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

// 函式積木的 Mutator 定義
const functionMutator = {
	mutationToDom: function () {
		if (!this.arguments_ || !this.argumentTypes_) {
			this.arguments_ = [];
			this.argumentTypes_ = [];
		}
		const container = document.createElement('mutation');
		for (let i = 0; i < this.arguments_.length; i++) {
			const parameter = document.createElement('arg');
			parameter.setAttribute('name', this.arguments_[i] || '');
			parameter.setAttribute('type', this.argumentTypes_[i] || 'int');
			container.appendChild(parameter);
		}
		// 移除回傳值屬性設定
		return container;
	},

	domToMutation: function (xmlElement) {
		this.arguments_ = [];
		this.argumentTypes_ = [];
		for (let i = 0, childNode; (childNode = xmlElement.childNodes[i]); i++) {
			if (childNode.nodeName.toLowerCase() === 'arg') {
				this.arguments_.push(childNode.getAttribute('name') || '');
				this.argumentTypes_.push(childNode.getAttribute('type') || 'int');
			}
		}
		// 移除回傳值相關設定
		this.updateShape_();
	},
	decompose: function (workspace) {
		const containerBlock = workspace.newBlock('arduino_function_mutator');
		containerBlock.initSvg();

		// 將函式參數註冊為函式區域變數
		this.registerArgumentsAsLocalVariables();

		// 恢復參數積木
		let connection = containerBlock.getInput('STACK').connection;
		for (let i = 0; i < (this.arguments_.length || 0); i++) {
			const paramBlock = workspace.newBlock('arduino_function_parameter');
			paramBlock.initSvg();
			paramBlock.setFieldValue(this.arguments_[i] || '', 'NAME');
			paramBlock.setFieldValue(this.argumentTypes_[i] || 'int', 'TYPE');
			connection.connect(paramBlock.previousConnection);
			connection = paramBlock.nextConnection;
		}

		return containerBlock;
	},
	compose: function (containerBlock) {
		this.arguments_ = [];
		this.argumentTypes_ = [];
		let paramBlock = containerBlock.getInputTargetBlock('STACK');
		while (paramBlock && !paramBlock.isInsertionMarker()) {
			this.arguments_.push(paramBlock.getFieldValue('NAME') || '');
			this.argumentTypes_.push(paramBlock.getFieldValue('TYPE') || 'int');
			paramBlock = paramBlock.nextConnection && paramBlock.nextConnection.targetBlock();
		}

		// 即時更新積木外觀
		if (this._updateTimeout) {
			clearTimeout(this._updateTimeout);
		}
		this._updateTimeout = setTimeout(() => {
			this.updateShape_();
		}, 0);
	},
	saveConnections: function (containerBlock) {
		let paramBlock = containerBlock.getInputTargetBlock('STACK');
		let i = 0;
		while (paramBlock) {
			paramBlock = paramBlock.nextConnection && paramBlock.nextConnection.targetBlock();
			i++;
		}
		// 移除回傳積木連接狀態的恢復程式碼
	},
	parameterFlyoutCallback: function (workspace) {
		const blocks = [];

		// 參數積木
		const paramBlock = workspace.newBlock('arduino_function_parameter');
		paramBlock.initSvg();
		blocks.push(paramBlock);

		// 設定飛出窗口高度
		const blockHeight = paramBlock.getHeightWidth().height;
		const minHeight = blockHeight * 3;

		workspace.flyout_.setHeight(minHeight);
		workspace.flyout_.workspace_.updateInverseScreenCTM();

		let count = 0;
		let block = workspace.getTopBlocks(false)[0];
		if (block) {
			let paramBlock = block.getInputTargetBlock('STACK');
			while (paramBlock) {
				count++;
				paramBlock = paramBlock.getNextBlock();
			}
		}

		const letters = 'xyzabcdefghijklmnopqrstuvw';
		const newName = count < letters.length ? letters[count] : `arg${count}`;
		paramBlock.setFieldValue(newName, 'NAME');

		return blocks;
	}, // 新增：將函式參數註冊為函式區域變數
	registerArgumentsAsLocalVariables: function () {
		const workspace = this.workspace;
		if (!workspace || !this.arguments_ || !this.argumentTypes_) {
			return;
		}

		// 紀錄目前的參數名稱，用於後續檢查哪些變數需要被刪除
		const currentParamNames = new Set(this.arguments_.filter(name => name));

		// 檢查工作區中所有其他函式積木使用的參數名稱
		const otherFunctionParamNames = new Set();
		if (workspace) {
			const allFunctionBlocks = workspace.getBlocksByType('arduino_function', false);
			allFunctionBlocks.forEach(block => {
				// 跳過當前積木
				if (block.id !== this.id && block.arguments_) {
					// 收集其他函式積木的參數名稱
					block.arguments_.forEach(paramName => {
						if (paramName) {
							otherFunctionParamNames.add(paramName);
						}
					});
				}
			});
		}

		// 首先移除不再使用的舊參數變數，但保留其他函式積木使用的參數變數
		if (this.registeredVarIds_) {
			// 獲取目前已註冊的參數變數
			const oldVars = this.registeredVarIds_
				.map(varId => {
					try {
						return workspace.getVariableById(varId);
					} catch (err) {
						log.error('獲取舊參數變數失敗:', err);
						return null;
					}
				})
				.filter(v => v !== null);

			// 找出不再使用的參數變數（名稱不在目前參數列表中且不被其他函式使用）
			const varsToRemove = oldVars.filter(v => !currentParamNames.has(v.name) && !otherFunctionParamNames.has(v.name)); // 刪除不再使用的參數變數，且不被其他函式積木使用的變數
			// 但需要排除全域變數，只刪除由函式積木創建的參數變數
			varsToRemove.forEach(variable => {
				try {
					// 檢查變數是否為全域變數 - 這裡檢查是否有其他積木使用此變數
					const variableId = variable.getId();
					const varName = variable.name;

					// 檢查是否有變數積木使用此變數
					const varBlocks = workspace
						.getBlocksByType('variables_get', false)
						.concat(workspace.getBlocksByType('variables_set', false));

					const isUsedInVarBlocks = varBlocks.some(block => {
						const blockVarId = block.getFieldValue('VAR');
						return blockVarId === variableId;
					});

					// 如果變數用於其他積木，則視為全域變數，不刪除
					if (isUsedInVarBlocks) {
						log.info(`保留全域變數: ${varName}`);
					} else {
						// 否則刪除此參數變數
						log.info(`刪除不再使用的參數變數: ${varName}`);
						workspace.deleteVariableById(variableId);
					}
				} catch (err) {
					log.error(`刪除舊參數變數 ${variable.name} 失敗:`, err);
				}
			});
		}

		// 重設已註冊變數ID列表
		this.registeredVarIds_ = [];

		// 為每個參數創建或更新變數
		for (let i = 0; i < this.arguments_.length; i++) {
			const paramName = this.arguments_[i];
			if (paramName) {
				// 檢查變數是否已存在
				let variable = workspace.getVariable(paramName);
				if (!variable) {
					// 根據參數類型確定變數類型
					let varType = null;
					switch (this.argumentTypes_[i]) {
						case 'String':
							varType = 'String';
							break;
						default:
							varType = null; // 使用預設類型
					}
					// 創建變數
					try {
						log.info(`為參數創建變數: ${paramName} (型別: ${varType || 'default'})`);
						variable = workspace.createVariable(paramName, varType);
						if (variable) {
							this.registeredVarIds_.push(variable.getId());
						}
					} catch (err) {
						log.error(`為參數 ${paramName} 創建變數失敗:`, err);
					}
				} else {
					// 變數已存在，添加到已註冊清單
					this.registeredVarIds_.push(variable.getId());
				}
			}
		}
	},
};

// 註冊 Mutator 擴展
Blockly.Extensions.registerMutator(
	'function_mutator',
	functionMutator,
	function () {
		this.parameterFlyoutCallback = functionMutator.parameterFlyoutCallback;
	},
	['arduino_function_parameter'] // 移除 return 積木
);

// 修改函式積木定義
Blockly.Blocks['arduino_function'] = {
	init: function () {
		this.appendDummyInput('MAIN')
			.appendField(window.languageManager.getMessage('FUNCTION_CREATE'))
			.appendField(new Blockly.FieldTextInput('myFunction'), 'NAME')
			.appendField(':', 'PARAM_LABEL');

		this.appendStatementInput('STACK').setCheck(null);
		this.setStyle('procedure_blocks'); // 使用主題中定義的顏色
		this.setTooltip('');
		this.setHelpUrl('');

		this.arguments_ = [];
		this.argumentTypes_ = [];

		this.jsonInit({
			mutator: 'function_mutator',
		});

		// 追蹤函式名稱變更
		this.oldName_ = 'myFunction';
	},
	updateShape_: function () {
		const mainInput = this.getInput('MAIN');

		// 清除舊的欄位
		const existingFields = [];
		for (let i = 0; i < mainInput.fieldRow.length; i++) {
			const field = mainInput.fieldRow[i];
			if (field.name) {
				existingFields.push(field.name);
			}
		}
		existingFields.forEach(name => {
			if (name !== 'NAME') {
				mainInput.removeField(name);
			}
		});

		// 移除舊的傳入輸入點		// 移除任何可能存在的回傳值輸入點
		const returnInput = this.getInput('RETURN_VALUE');
		if (returnInput) {
			this.removeInput('RETURN_VALUE');
		}

		// 不再添加 void 回傳類型標籤

		// 添加參數
		if (this.arguments_ && this.argumentTypes_) {
			mainInput.appendField('(', 'START_ARGS');
			for (let i = 0; i < this.arguments_.length; i++) {
				if (i > 0) {
					mainInput.appendField(', ', 'SEP_' + i);
				}
				mainInput
					.appendField(new Blockly.FieldLabel(this.argumentTypes_[i] || 'int'), 'TYPE_' + i)
					.appendField(new Blockly.FieldLabel(' ' + (this.arguments_[i] || '')), 'NAME_' + i);
			}
			mainInput.appendField(')', 'END_ARGS');
		} else {
			mainInput.appendField('()', 'EMPTY_ARGS');
		}
		// 新增：更新所有相關的函數呼叫積木
		this.updateRelatedFunctionCalls();

		// 註冊參數為區域變數，確保它們在函式內可使用
		this.registerArgumentsAsLocalVariables();
	}, // 回傳類型已固定為 void，不需要額外方法

	// 新增：更新所有相關的函數呼叫積木
	updateRelatedFunctionCalls: function () {
		const workspace = this.workspace;
		if (!workspace) {
			return;
		}

		const funcName = this.getFieldValue('NAME');

		// 獲取所有呼叫此函數的積木
		const callBlocks = workspace
			.getBlocksByType('arduino_function_call', false)
			.filter(block => block.getFieldValue('NAME') === funcName);

		// 更新每個呼叫積木
		callBlocks.forEach(callBlock => {
			callBlock.updateFromFunctionBlock_();
		});
	},
	// 添加 onchange 事件處理器
	onchange: function (e) {
		// 檢查事件是否與此積木相關
		if (e.blockId !== this.id) {
			return;
		}

		// 處理複製貼上事件 - 檢測剛建立的積木是否是複製貼上的結果
		if (e.type === Blockly.Events.CREATE && e.ids && e.ids.includes(this.id)) {
			// 判斷是否是從複製貼上產生的積木 (不是直接從工具箱拖出來的)
			if (!this.workspace.isFlyout && !this.isInFlyout) {
				// 獲取當前函式名稱
				const currentName = this.getFieldValue('NAME');

				// 檢查是否有其他同名函式
				const otherSameNameFunctions = this.workspace
					.getBlocksByType('arduino_function', false)
					.filter(block => block.id !== this.id && block.getFieldValue('NAME') === currentName);

				// 如果有其他同名函式，則修改本積木名稱
				if (otherSameNameFunctions.length > 0) {
					// 找出一個不重複的名稱
					let newName = currentName;
					let counter = 1;

					while (
						this.workspace
							.getBlocksByType('arduino_function', false)
							.some(block => block.id !== this.id && block.getFieldValue('NAME') === newName)
					) {
						newName = `${currentName}${counter}`;
						counter++;
					}

					// 重要修改：暫時停用名稱變更事件監聽，以避免觸發呼叫積木名稱的更新
					this._skipNameChangeUpdate = true;

					// 設定新名稱
					this.setFieldValue(newName, 'NAME');
					this.oldName_ = newName; // 更新追蹤的舊名稱

					// 使用自訂的方式通知其他元件進行更新，但不觸發呼叫積木的名稱更新
					if (this.workspace) {
						// 建立一個修改事件，但不發送到普通的更新處理管道
						new Blockly.Events.BlockChange(this, 'field', 'NAME', currentName, newName);
					}

					// 延遲一段時間後恢復名稱變更事件監聽
					setTimeout(() => {
						this._skipNameChangeUpdate = false;
					}, 200);
				}
			}
		}

		if (e.type === Blockly.Events.BLOCK_CHANGE || e.type === Blockly.Events.BLOCK_MOVE) {
			// 專門處理函數名稱變更的情況
			if (e.type === Blockly.Events.BLOCK_CHANGE && e.element === 'field' && e.name === 'NAME') {
				// 記錄詳細的名稱變更資訊，用於調試
				log.info(`函數名稱變更事件觸發: ${this.oldName_} -> ${e.newValue}`);

				// 如果是複製貼上引起的名稱變更，跳過更新呼叫積木
				if (this._skipNameChangeUpdate) {
					log.info('跳過更新呼叫積木 (由複製貼上引起的名稱變更)');
					return;
				} // 新功能：檢查是否有同名函式積木，如果有則阻止修改
				let newName = e.newValue;
				if (newName) {
					// 檢查工作區中是否已存在同名函式積木
					const sameNameFunctions = this.workspace
						.getBlocksByType('arduino_function', false)
						.filter(block => block.id !== this.id && block.getFieldValue('NAME') === newName);

					if (sameNameFunctions.length > 0) {
						// 有同名函式積木，阻止此次修改
						log.info(`阻止更改為重複的函式名稱: ${newName}`);

						// 恢復原名稱
						const oldName = e.oldValue || this.oldName_;

						// 暫時停用事件監聽，避免遞迴觸發
						this._preventNameChangeUpdate = true;

						// 重要：記錄此次操作中原始的舊名稱，避免後續錯誤更新
						this._originalOldName = oldName;

						// 使用 setTimeout 確保在當前事件處理完成後才設回原名稱
						setTimeout(() => {
							// 恢復原名稱
							this.setFieldValue(oldName, 'NAME');

							// 給用戶顯示警告
							this.setWarningText(`函式名稱 "${newName}" 已存在，請使用不同的名稱`);

							// 延遲清除警告
							setTimeout(() => {
								if (this.getFieldValue('NAME') !== newName) {
									this.setWarningText(null);
								}
							}, 5000);

							// 延遲重新啟用事件監聽
							setTimeout(() => {
								this._preventNameChangeUpdate = false;
							}, 500); // 加長延遲，確保不會過早接收到新事件
						}, 10);

						// 重要：直接返回，防止後續處理更新呼叫積木
						return;
					}
				}

				// 如果是阻止重複名稱的機制觸發的名稱更改，則直接返回
				if (this._preventNameChangeUpdate) {
					return;
				}

				// 檢測函數名稱變化
				const oldName = e.oldValue || this.oldName_;
				newName = e.newValue;

				// 重要：檢查是否是因為重複名稱檢查而恢復的原名稱
				// 如果是從阻止的嘗試恢復原名稱，則不應該觸發呼叫積木的更新
				if (this._originalOldName === newName) {
					log.info(`跳過更新呼叫積木 (恢復原名稱: ${newName})`);
					this._originalOldName = undefined; // 清除標記
					this.oldName_ = newName; // 更新舊名稱
					return;
				}

				if (oldName && newName && oldName !== newName) {
					// 更新使用舊名稱的呼叫積木
					const currentWorkspace = this.workspace;
					if (!currentWorkspace) {
						return;
					}

					// 找出所有使用舊名稱的函數呼叫積木
					const callBlocks = currentWorkspace.getBlocksByType('arduino_function_call', false).filter(block => {
						const blockName = block.getFieldValue('NAME');
						return blockName === oldName;
					});

					log.info(`找到 ${callBlocks.length} 個使用舊名稱 "${oldName}" 的呼叫積木`);

					// 為每個呼叫積木更新函數名稱
					callBlocks.forEach((callBlock, index) => {
						try {
							log.info(`更新呼叫積木 #${index + 1} 名稱: ${oldName} -> ${newName}`);

							// 先確認欄位存在
							const nameField = callBlock.getField('NAME');
							if (nameField) {
								// 如果是 FieldLabel，用特殊方式設定
								if (nameField.EDITABLE === false) {
									// 使用替代方法設定 FieldLabel 的值
									nameField.setValue(newName);
								} else {
									// 標準方式設定可編輯欄位
									callBlock.setFieldValue(newName, 'NAME');
								}

								// 更新完名稱後刷新積木的參數和外觀
								callBlock.updateFromFunctionBlock_();
							}
						} catch (err) {
							log.error(`更新呼叫積木名稱失敗:`, err);
						}
					});

					// 工具箱刷新 - 確保工具箱中顯示的函數名稱也更新
					if (currentWorkspace.toolbox_) {
						setTimeout(() => {
							try {
								currentWorkspace.toolbox_.refreshSelection();
							} catch (err) {
								log.error('工具箱刷新失敗:', err);
							}
						}, 200);
					}
				}

				// 儲存當前名稱以便下次比較
				this.oldName_ = newName;
			}
		}
	},
};

// 參數容器積木
Blockly.Blocks['arduino_function_mutator'] = {
	init: function () {
		this.appendDummyInput().appendField(window.languageManager.getMessage('FUNCTION_PARAMS'));
		this.appendStatementInput('STACK');
		// 移除回傳值輸入點
		this.setStyle('procedure_blocks'); // 修改這裡，使用主題中定義的顏色
		this.setTooltip('');
		this.setHelpUrl('');
	},
};

// 參數積木
Blockly.Blocks['arduino_function_parameter'] = {
	init: function () {
		this.appendDummyInput()
			.appendField(window.languageManager.getMessage('FUNCTION_PARAMS'))
			.appendField(
				new Blockly.FieldDropdown([
					['int', 'int'],
					['float', 'float'],
					['bool', 'bool'],
					['String', 'String'],
				]),
				'TYPE'
			)
			.appendField(new Blockly.FieldTextInput('x'), 'NAME');
		this.setPreviousStatement(true);
		this.setNextStatement(true);
		this.setStyle('procedure_blocks'); // 修改這裡，使用主題中定義的顏色
		this.setTooltip('');
		this.setHelpUrl('');
	},

	onchange: function (e) {
		if (
			e.type === Blockly.Events.CHANGE ||
			e.type === Blockly.Events.MOVE ||
			e.type === Blockly.Events.CREATE ||
			e.type === Blockly.Events.DELETE
		) {
			// 處理自動命名
			if (e.type === Blockly.Events.CREATE && e.blockId === this.id) {
				this.handleAutoNaming_();
			}

			// 取得主積木和主工作區
			const rootBlock = this.getRootBlock();
			if (rootBlock?.type === 'arduino_function_mutator') {
				const mainBlock = this.workspace.options.parentWorkspace?.mutator?.block_;

				if (mainBlock) {
					// 更新主積木外觀
					mainBlock.updateShape_();
					// 主積木的 updateShape_ 方法會自動呼叫 updateRelatedFunctionCalls
					// 不需要額外的更新邏輯
				}
			}
		}
	},

	// 抽出自動命名邏輯為獨立函數
	handleAutoNaming_: function () {
		setTimeout(() => {
			const blocks = this.workspace.getBlocksByType('arduino_function_parameter');
			const index = blocks.indexOf(this);
			if (index !== -1 && this.getFieldValue('NAME') === 'x') {
				const letters = 'xyzabcdefghijklmnopqrstuvw';
				const newName = index < letters.length ? letters[index] : `arg${index}`;
				this.getField('NAME').setValue(newName);
			}
		}, 0);
	},
};

// 新增：函數呼叫積木定義
Blockly.Blocks['arduino_function_call'] = {
	init: function () {
		this.appendDummyInput('MAIN')
			.appendField(window.languageManager.getMessage('FUNCTION_CALL') || '呼叫')
			.appendField(new Blockly.FieldLabel('myFunction'), 'NAME'); // 使用 FieldLabel 而非 FieldTextInput，讓它不可編輯

		this.setInputsInline(true);
		this.setStyle('procedure_blocks');
		this.setTooltip('呼叫一個自定義函數');
		this.setHelpUrl('');

		// 用於存儲參數相關信息
		this.arguments_ = [];
		this.argumentTypes_ = [];

		// 預設設置為語句積木，可以連接到其他積木上下方
		this.setPreviousStatement(true);
		this.setNextStatement(true);
		this.setOutput(false);
	},

	// 將函數狀態序列化為 DOM
	mutationToDom: function () {
		const container = document.createElement('mutation');
		container.setAttribute('version', '1');
		container.setAttribute('name', this.getFieldValue('NAME'));
		container.setAttribute('has_return', this.hasReturn_ ? 'true' : 'false');
		container.setAttribute('return_type', this.returnType_);

		// 添加參數資訊
		for (let i = 0; i < this.arguments_.length; i++) {
			const parameter = document.createElement('arg');
			parameter.setAttribute('name', this.arguments_[i] || '');
			parameter.setAttribute('type', this.argumentTypes_[i] || 'int');
			container.appendChild(parameter);
		}

		return container;
	}, // 從 DOM 還原函數狀態
	domToMutation: function (xmlElement) {
		// 檢查版本
		const version = xmlElement.getAttribute('version') || '0';
		// 從 DOM 中先取得函數名稱
		const name = xmlElement.getAttribute('name');
		if (name) {
			this.setFieldValue(name, 'NAME');
		}

		// 回傳值相關設定已固定為無回傳值
		this.hasReturn_ = false;
		this.returnType_ = 'void';

		// 取得參數資訊
		this.arguments_ = [];
		this.argumentTypes_ = [];
		for (let i = 0, childNode; (childNode = xmlElement.childNodes[i]); i++) {
			if (childNode.nodeName.toLowerCase() === 'arg') {
				this.arguments_.push(childNode.getAttribute('name') || '');
				this.argumentTypes_.push(childNode.getAttribute('type') || 'int');
			}
		}

		// 初始化工作區重載後連接還原追蹤
		if (!window._functionCallBlocks) {
			window._functionCallBlocks = [];
		}
		window._functionCallBlocks.push(this);
		// 函數呼叫積木現在統一為語句型積木（無回傳值）
		this.setOutput(false);
		this.setPreviousStatement(true);
		this.setNextStatement(true);

		if (this.workspace && !this.workspace.isFlyout) {
			log.info(`函數呼叫積木 "${name}" 設置為語句積木`);
		}

		// 保存所有連接的完整詳細信息
		const connectionInfo = {
			params: {}, // 參數輸入連接
			parent: null, // 上面的積木
			child: null, // 下面的積木
			output: null, // 輸出連接
		};

		// 抽取共用函數來收集連接資訊
		const collectConnectionInfo = (connection, connectionType) => {
			if (connection && connection.isConnected()) {
				const targetConnection = connection.targetConnection;
				const targetBlock = connection.targetBlock();
				return {
					connection: targetConnection,
					block: targetBlock,
					blockId: targetBlock?.id,
					type: targetBlock?.type,
				};
			}
			return null;
		};

		// 儲存所有參數連接資訊 - 只遍歷實際存在的輸入
		this.inputList.forEach((input, index) => {
			// 只處理以 ARG 開頭的輸入名稱
			if (input.name && input.name.startsWith('ARG') && input.connection && input.connection.isConnected()) {
				const paramIndex = parseInt(input.name.substring(3)); // 從 'ARGn' 獲取索引 n
				const connInfo = collectConnectionInfo(input.connection);
				if (connInfo) {
					connectionInfo.params[paramIndex] = connInfo;
				}
			}
		});

		// 保存所有積木主要連接的詳細資訊
		connectionInfo.parent = collectConnectionInfo(this.previousConnection);
		connectionInfo.child = collectConnectionInfo(this.nextConnection);

		// 函數呼叫積木統一為語句型積木（無回傳值），不需要輸出連接

		// 為調試記錄詳細的連接資訊
		log.info(`函數呼叫積木還原前的連接資訊:`, {
			hasParent: !!connectionInfo.parent,
			hasChild: !!connectionInfo.child,
			hasOutput: !!connectionInfo.output,
			paramConnections: Object.keys(connectionInfo.params).length,
		});

		// 清除所有現有的輸入，但保留MAIN
		const inputList = this.inputList.slice();
		for (let i = 0; i < inputList.length; i++) {
			if (inputList[i].name !== 'MAIN') {
				this.removeInput(inputList[i].name);
			}
		}

		// 重新創建參數輸入 - 始終使用 null 作為檢查類型以確保最大兼容性
		for (let i = 0; i < this.arguments_.length; i++) {
			const argName = this.arguments_[i] || `參數${i + 1}`;
			const argType = this.argumentTypes_[i] || 'int';

			// 參數輸入使用 null 檢查類型，允許連接任何類型的積木
			this.appendValueInput('ARG' + i)
				.setAlign(Blockly.ALIGN_RIGHT)
				.appendField(`${argName} (${argType}):`)
				.setCheck(null);
		}

		// 設定提示
		let tooltip = '呼叫函數: ' + name;
		if (this.hasReturn_) {
			tooltip += ` (回傳型別: ${this.returnType_})`;
		}
		this.setTooltip(tooltip);

		// 簡化連接還原機制
		this._initConnectionRestorer();
	},

	// 初始化連接還原器
	_initConnectionRestorer: function () {
		this._connectionRestoreStatus = {
			isWorkspaceLoad: true,
			attempt: 0,
			succeeded: 0,
			failed: 0,
			maxAttempts: 2,
		};

		// 使用單一延遲來執行還原
		setTimeout(() => this._restoreConnections(), 20);
	},

	// 還原積木連接
	_restoreConnections: function () {
		// 嘗試還原主要連接（上層和下層）
		const mainResult = this._restoreMainConnections();

		// 嘗試還原參數連接
		const paramResult = this._restoreParameterConnections();

		// 更新還原狀態
		this._connectionRestoreStatus.attempt++;
		this._connectionRestoreStatus.succeeded += mainResult.success + paramResult.success;
		this._connectionRestoreStatus.failed += mainResult.failed + paramResult.failed;

		// 記錄還原結果
		const totalRestored = mainResult.success + paramResult.success;
		const totalFailed = mainResult.failed + paramResult.failed;

		if (totalRestored > 0 || totalFailed > 0) {
			log.info(
				`連接還原嘗試 #${this._connectionRestoreStatus.attempt}: ` +
					`成功=${totalRestored}, 失敗=${totalFailed}, ` +
					`(主連接: 成功=${mainResult.success}, 失敗=${mainResult.failed}, ` +
					`參數連接: 成功=${paramResult.success}, 失敗=${paramResult.failed})`
			);
		}

		// 判斷是否需要再次嘗試
		if (
			totalFailed > 0 &&
			this._connectionRestoreStatus.attempt < this._connectionRestoreStatus.maxAttempts &&
			(this._connectionRestoreStatus.isWorkspaceLoad || this._connectionRestoreStatus.attempt === 0)
		) {
			setTimeout(() => this._restoreConnections(), 100);
		} else if (this._connectionRestoreStatus.succeeded > 0) {
			log.info(`連接恢復完成 (成功: ${this._connectionRestoreStatus.succeeded})`);
		}
	},

	// 還原主要連接（上層和下層）
	_restoreMainConnections: function () {
		let success = 0;
		let failed = 0;

		// 取得連接資訊（假設已在 domToMutation 中設定）
		const connectionInfo = this._lastConnectionInfo || {};

		// 嘗試還原上方連接
		if (this.previousConnection && connectionInfo.parent && connectionInfo.parent.connection) {
			try {
				this.previousConnection.connect(connectionInfo.parent.connection);
				log.info(`成功還原上方連接`);
				success++;
			} catch (err) {
				log.warn(`還原上方連接失敗:`, err);
				failed++;
			}
		}

		// 嘗試還原下方連接
		if (this.nextConnection && connectionInfo.child && connectionInfo.child.connection) {
			try {
				this.nextConnection.connect(connectionInfo.child.connection);
				log.info(`成功還原下方連接`);
				success++;
			} catch (err) {
				log.warn(`還原下方連接失敗:`, err);
				failed++;
			}
		}

		return { success, failed };
	},

	// 還原參數連接
	_restoreParameterConnections: function () {
		let success = 0;
		let failed = 0;

		// 取得連接資訊（假設已在 domToMutation 中設定）
		const connectionInfo = this._lastConnectionInfo || {};
		const params = connectionInfo.params || {};

		// 嘗試還原每個參數的連接
		Object.keys(params).forEach(paramIndex => {
			const paramInfo = params[paramIndex];
			const input = this.getInput('ARG' + paramIndex);

			if (input && input.connection && paramInfo) {
				try {
					// 先嘗試連接到原始連接點
					if (paramInfo.connection && paramInfo.connection.getSourceBlock()) {
						input.connection.connect(paramInfo.connection);
						log.info(`成功還原參數 ${paramIndex} 連接`);
						success++;
					}
					// 如果失敗，嘗試連接到目標積木的輸出連接
					else if (paramInfo.block && paramInfo.block.outputConnection) {
						input.connection.connect(paramInfo.block.outputConnection);
						log.info(`成功還原參數 ${paramIndex} 連接到積木輸出`);
						success++;
					}
				} catch (err) {
					log.warn(`還原參數 ${paramIndex} 連接失敗:`, err);
					failed++;
				}
			}
		});

		return { success, failed };
	},
	// 獲取與類型兼容的積木連接類型
	getCompatibleTypes_: function (type) {
		switch (type) {
			case 'int':
			case 'float':
				return 'Number';
			case 'String':
				return 'String';
			case 'bool':
				return 'Boolean';
			default:
				return null; // 允許任何類型
		}
	},

	// 為程式碼生成器提供運算子優先順序資訊
	// 由於函數呼叫現在統一為語句型積木（沒有回傳值），此方法已不再使用
	// 但保留簡化版本以與程式碼生成器相容
	getArduinoOrder: function () {
		return 2; // ORDER_FUNCTION_CALL
	},

	// 檢查函數是否存在並更新警告文字
	checkFunctionExists: function () {
		const funcName = this.getFieldValue('NAME');
		if (!funcName || !this.workspace) {
			return false;
		}

		// 檢查工作區中是否有對應名稱的函數定義
		const functionExists = this.workspace
			.getBlocksByType('arduino_function', false)
			.some(block => block.getFieldValue('NAME') === funcName);

		// 更新警告文字
		this.setWarningText(functionExists ? null : '函數 ' + funcName + ' 不存在。');
		return functionExists;
	},
	// 設置函數名稱（由於使用FieldLabel，需要自行實現setValue方法）
	setFunctionName: function (name) {
		if (!name) {
			return;
		}

		const nameField = this.getField('NAME');
		if (nameField) {
			nameField.setValue(name);
			// 立即觸發更新
			this._forceNextUpdate = true;
			this.updateFromFunctionBlock_(true);
		}
	},

	// 當工作區中的積木變化時觸發
	onchange: function (e) {
		// 確保有有效的工作區且不在飛出面板中
		if (!this.workspace || this.isInFlyout) {
			return;
		}

		// 優化事件處理，減少不必要的更新
		const isRelevantEvent =
			e.type === Blockly.Events.BLOCK_CHANGE || e.type === Blockly.Events.BLOCK_CREATE || e.type === Blockly.Events.BLOCK_DELETE;

		// 檢查事件是否與函數積木相關
		const isFunctionEvent = isRelevantEvent && e.blockId && this.workspace.getBlockById(e.blockId)?.type === 'arduino_function';

		// 如果是自身變更或函數積木變更，則更新
		if (e.blockId === this.id || isFunctionEvent) {
			// 使用去抖動處理，避免短時間內多次更新
			if (this._updateListTimeout) {
				clearTimeout(this._updateListTimeout);
			}

			this._updateListTimeout = setTimeout(() => {
				this.updateFromFunctionBlock_();
				this.checkFunctionExists();
			}, 100);
		}
	},

	// 從函數定義積木更新函數呼叫積木的資訊
	updateFromFunctionBlock_: function (force) {
		// 如果在飛出面板中，不進行更新
		if (this.isInFlyout) {
			return;
		}

		// 獲取當前函數名稱
		const funcName = this.getFieldValue('NAME');
		if (!funcName) {
			return;
		}

		// 查找相應的函數定義積木
		const functionBlock = this._findFunctionBlock(funcName);
		if (!functionBlock) {
			log.info(`找不到名為 ${funcName} 的函數定義積木`);
			// 更新警告但不修改參數結構
			this.checkFunctionExists();
			return;
		}

		// 從函數定義積木取得參數資訊
		const [hasChanged, newArgs, newTypes] = this._collectFunctionParameters(functionBlock);

		// 只有在有變更或強制更新時才執行更新
		if (hasChanged || force) {
			this._applyFunctionParameters(newArgs, newTypes, functionBlock);
		}
	},

	// 尋找指定名稱的函數定義積木
	_findFunctionBlock: function (funcName) {
		if (!this.workspace) {
			return null;
		}

		// 找出所有函數定義積木
		const functionBlocks = this.workspace.getBlocksByType('arduino_function', false);

		// 找到對應名稱的函數積木
		return functionBlocks.find(block => block.getFieldValue('NAME') === funcName) || null;
	},

	// 從函數定義積木收集參數資訊
	_collectFunctionParameters: function (functionBlock) {
		// 取得現有參數資訊
		const oldArgs = this.arguments_ || [];
		const oldTypes = this.argumentTypes_ || [];

		// 取得新參數資訊
		const newArgs = functionBlock.arguments_ || [];
		const newTypes = functionBlock.argumentTypes_ || [];

		// 檢查參數是否有變化
		let hasChanged = oldArgs.length !== newArgs.length;

		if (!hasChanged) {
			// 參數數量相同，檢查參數名稱和類型是否有變化
			for (let i = 0; i < newArgs.length; i++) {
				if (oldArgs[i] !== newArgs[i] || oldTypes[i] !== newTypes[i]) {
					hasChanged = true;
					break;
				}
			}
		}

		return [hasChanged, newArgs, newTypes];
	},

	// 套用參數變更到函數呼叫積木
	_applyFunctionParameters: function (newArgs, newTypes, functionBlock) {
		// 更新存儲的參數資訊
		this.arguments_ = newArgs.slice();
		this.argumentTypes_ = newTypes.slice();

		// 保存現有連接的資訊
		const connectionInfo = this._saveConnectionInfo();

		// 清空現有參數輸入
		this._clearExistingInputs();

		// 建立新的參數輸入
		this._createParameterInputs();

		// 嘗試還原先前的連接
		this._restoreConnectionsFromInfo(connectionInfo);

		// 更新輸入對齊和顯示樣式
		this.setInputsInline(true);

		// 更新提示文字
		this._updateTooltip(functionBlock);
	},

	// 儲存目前的連接資訊
	_saveConnectionInfo: function () {
		const connectionInfo = {
			params: {},
		};

		// 儲存參數輸入的連接
		for (let i = 0; i < this.inputList.length; i++) {
			const input = this.inputList[i];
			if (input.name && input.name.startsWith('ARG') && input.connection && input.connection.isConnected()) {
				const paramIndex = parseInt(input.name.substring(3));
				const targetBlock = input.connection.targetBlock();
				if (targetBlock) {
					connectionInfo.params[paramIndex] = {
						blockId: targetBlock.id,
						type: targetBlock.type,
						block: targetBlock,
						connection: input.connection.targetConnection,
					};
				}
			}
		}

		return connectionInfo;
	},

	// 清除現有的參數輸入
	_clearExistingInputs: function () {
		const inputsToRemove = [];
		for (let i = 0; i < this.inputList.length; i++) {
			if (this.inputList[i].name !== 'MAIN') {
				inputsToRemove.push(this.inputList[i].name);
			}
		}

		// 移除所有非主要輸入
		for (let i = 0; i < inputsToRemove.length; i++) {
			this.removeInput(inputsToRemove[i]);
		}
	},

	// 建立參數輸入
	_createParameterInputs: function () {
		// 為每個參數建立輸入
		for (let i = 0; i < this.arguments_.length; i++) {
			const argName = this.arguments_[i] || `參數${i + 1}`;
			const argType = this.argumentTypes_[i] || 'int';

			// 參數輸入使用 null 檢查類型，允許最大兼容性
			this.appendValueInput('ARG' + i)
				.setAlign(Blockly.ALIGN_RIGHT)
				.appendField(`${argName} (${argType}):`)
				.setCheck(null);
		}
	},

	// 從保存的資訊中嘗試還原連接
	_restoreConnectionsFromInfo: function (connectionInfo) {
		const params = connectionInfo.params || {};

		// 嘗試還原每個參數的連接
		Object.keys(params).forEach(paramIndex => {
			const paramInfo = params[paramIndex];
			const input = this.getInput('ARG' + paramIndex);

			if (input && input.connection && paramInfo) {
				try {
					// 先嘗試透過積木ID連接
					const targetBlock = this.workspace.getBlockById(paramInfo.blockId);
					if (targetBlock && targetBlock.outputConnection) {
						input.connection.connect(targetBlock.outputConnection);
					}
					// 如果失敗，嘗試使用保存的連接資訊
					else if (paramInfo.connection && paramInfo.connection.getSourceBlock()) {
						input.connection.connect(paramInfo.connection);
					}
				} catch (err) {
					log.warn(`還原參數 ${paramIndex} 連接失敗:`, err);
				}
			}
		});
	},

	// 更新提示文字
	_updateTooltip: function (functionBlock) {
		const name = this.getFieldValue('NAME');
		let tooltip = '呼叫函數: ' + name;

		// 添加回傳型別資訊（如果有）
		if (functionBlock && functionBlock.returnType_) {
			tooltip += ` (回傳型別: ${functionBlock.returnType_})`;
		}

		this.setTooltip(tooltip);
	},
};
