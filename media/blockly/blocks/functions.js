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
		container.setAttribute('has_return', this.hasReturn_ ? 'true' : 'false');
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
		this.hasReturn_ = xmlElement.getAttribute('has_return') === 'true';
		this.updateShape_();
	},

	decompose: function (workspace) {
		const containerBlock = workspace.newBlock('arduino_function_mutator');
		containerBlock.initSvg();

		// 保存主積木的回傳值連接
		const returnValueInput = this.getInput('RETURN_VALUE');
		if (returnValueInput && returnValueInput.connection.targetBlock()) {
			this.savedReturnValue_ = returnValueInput.connection.targetBlock();
		}

		// 恢復回傳類型積木
		if (this.hasReturn_) {
			const returnBlock = workspace.newBlock('arduino_function_return');
			returnBlock.initSvg();
			// 找到儲存的回傳類型
			if (this.workspace.mutator) {
				const mainWorkspace = this.workspace.mutator.getWorkspace();
				if (mainWorkspace) {
					const oldReturnBlock = mainWorkspace.getBlockById(this.returnBlockId_);
					if (oldReturnBlock) {
						// 設置相同的回傳類型
						returnBlock.setFieldValue(oldReturnBlock.getFieldValue('TYPE'), 'TYPE');
					}
				}
			}
			containerBlock.getInput('RETURN').connection.connect(returnBlock.outputConnection);
		}

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

		// 檢查回傳積木是否存在
		const returnBlock = containerBlock.getInputTargetBlock('RETURN');
		this.hasReturn_ = !!returnBlock;
		this.returnBlockId_ = returnBlock ? returnBlock.id : null;

		// 即時更新積木外觀
		if (this._updateTimeout) {
			clearTimeout(this._updateTimeout);
		}
		this._updateTimeout = setTimeout(() => {
			this.updateShape_();
			// 在形狀更新後重新連接回傳值
			if (this.savedReturnValue_ && this.getInput('RETURN_VALUE')) {
				this.getInput('RETURN_VALUE').connection.connect(this.savedReturnValue_.outputConnection);
			}
		}, 0);

		// 保存回傳積木的連接狀態
		if (returnBlock) {
			this.returnConnection_ = returnBlock.outputConnection.targetConnection;
		}
	},

	saveConnections: function (containerBlock) {
		let paramBlock = containerBlock.getInputTargetBlock('STACK');
		let i = 0;
		while (paramBlock) {
			paramBlock = paramBlock.nextConnection && paramBlock.nextConnection.targetBlock();
			i++;
		}

		// 恢復回傳積木的連接狀態
		const returnBlock = containerBlock.getInputTargetBlock('RETURN');
		if (returnBlock && this.returnConnection_) {
			returnBlock.outputConnection.connect(this.returnConnection_);
		}
	},

	parameterFlyoutCallback: function (workspace) {
		const blocks = [];

		// 參數積木
		const paramBlock = workspace.newBlock('arduino_function_parameter');
		paramBlock.initSvg();
		blocks.push(paramBlock);

		// Return 積木
		const returnBlock = workspace.newBlock('arduino_function_return');
		returnBlock.initSvg();
		blocks.push(returnBlock);

		const blockHeight = paramBlock.getHeightWidth().height;
		const minHeight = blockHeight * 3.5;

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
	},
};

// 修改註冊 Mutator 擴展，加入 return 積木
Blockly.Extensions.registerMutator(
	'function_mutator',
	functionMutator,
	function () {
		this.parameterFlyoutCallback = functionMutator.parameterFlyoutCallback;
	},
	['arduino_function_parameter', 'arduino_function_return'] // 加入 return 積木
);

// 修改函式積木定義
Blockly.Blocks['arduino_function'] = {
	init: function () {
		this.appendDummyInput('MAIN')
			.appendField('函式')
			.appendField(new Blockly.FieldTextInput('myFunction', this.validateFunctionName_), 'NAME')
			.appendField(':', 'PARAM_LABEL');

		this.appendStatementInput('STACK').setCheck(null);
		this.setColour('#7986CB'); // 修改這裡，使用主題中定義的顏色
		this.setTooltip('');
		this.setHelpUrl('');

		this.arguments_ = [];
		this.argumentTypes_ = [];
		this.hasReturn_ = false;
		this.hasReturnValue_ = false; // 新增此屬性追蹤是否有回傳值輸入點
		this.returnBlockId_ = null; // 新增此屬性來追蹤回傳積木
		this.returnType_ = 'void'; // 新增此屬性追蹤回傳類型

		this.jsonInit({
			mutator: 'function_mutator',
		});

		// 追蹤函式名稱變更
		this.oldName_ = 'myFunction';
	},

	validateFunctionName_: function (newName) {
		// 儲存舊名稱以供更新使用
		const oldName = this.oldName_;
		this.oldName_ = newName;

		if (this.workspace) {
			// 找到並更新所有相關的函式調用積木
			this.workspace
				.getAllBlocks(false)
				.filter(block => block.type === 'function_call' && block.getFieldValue('NAME') === oldName)
				.forEach(callBlock => {
					callBlock.setFieldValue(newName, 'NAME');
					callBlock.render();
				});
		}
		return newName;
	},

	updateShape_: function () {
		const mainInput = this.getInput('MAIN');
		const returnInput = this.getInput('RETURN_VALUE'); // 獲取傳入輸入點

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

		// 移除舊的傳入輸入點
		if (returnInput) {
			this.removeInput('RETURN_VALUE');
		}

		// 確定回傳類型
		let returnType = this.hasReturn_ ? 'int' : 'void';
		if (this.hasReturn_ && this.workspace.mutator) {
			const mutatorWorkspace = this.workspace.mutator.getWorkspace();
			if (mutatorWorkspace) {
				const containerBlock = mutatorWorkspace.getTopBlocks()[0];
				if (containerBlock) {
					const returnBlock = containerBlock.getInputTargetBlock('RETURN');
					if (returnBlock) {
						returnType = returnBlock.getFieldValue('TYPE') || 'int';
					}
				}
			}
		}

		if (returnInput && returnInput.connection.targetBlock()) {
			const connectedBlock = returnInput.connection.targetBlock();
			returnType = this.getReturnType_(connectedBlock);
		}

		// 添加函式名稱前的回傳類型
		mainInput.insertFieldAt(0, new Blockly.FieldLabel(returnType + ' '), 'RETURN_TYPE');

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

		// 添加回傳值輸入點
		if (returnType !== 'void') {
			const validTypes = ['Number', 'String', 'Boolean', null]; // 添加 null 表示接受任意類型
			this.appendValueInput('RETURN_VALUE').setAlign(Blockly.ALIGN_RIGHT).setCheck(validTypes).appendField('回傳');
		}

		// 如果有保存的回傳值，嘗試重新連接
		if (this.savedReturnValue_ && this.getInput('RETURN_VALUE')) {
			try {
				this.getInput('RETURN_VALUE').connection.connect(this.savedReturnValue_.outputConnection);
			} catch (e) {
				console.warn('無法重新連接回傳值:', e);
			}
		}

		// 更新完形狀後，通知所有相關的函式調用積木
		if (this.workspace) {
			const funcName = this.getFieldValue('NAME');
			this.workspace
				.getAllBlocks(false)
				.filter(block => block.type === 'function_call' && block.getFieldValue('NAME') === funcName)
				.forEach(callBlock => callBlock.updateShape_(this));
		}
	},

	getReturnType_: function (block) {
		switch (block.type) {
			case 'math_arithmetic':
			case 'math_single':
				return 'float'; // 數學運算應預設為float
			case 'math_number':
				// 將 getFieldValue 回傳的數值轉換為字串
				const numStr = block.getFieldValue('NUM').toString();
				return numStr.includes('.') ? 'float' : 'int';
			case 'logic_boolean':
				return 'boolean';
			case 'text':
				return 'String';
			case 'variables_get':
				const varName = block.getField('VAR').getText();
				const workspace = block.workspace;
				const variable = workspace.getVariableById(block.getField('VAR').getValue());

				// 檢查變數型別
				if (variable) {
					const setterBlocks = workspace.getBlocksByType('variables_set').filter(b => b.getField('VAR').getText() === varName);

					if (setterBlocks.length > 0) {
						const lastSetter = setterBlocks[setterBlocks.length - 1];
						const valueBlock = lastSetter.getInputTargetBlock('VALUE');

						if (valueBlock) {
							switch (valueBlock.type) {
								case 'text':
								case 'text_join':
									return 'String';
								case 'math_number':
									// 這裡也要確保轉換為字串
									const value = valueBlock.getFieldValue('NUM').toString();
									return value.includes('.') ? 'float' : 'int';
								case 'logic_boolean':
									return 'boolean';
								default:
									return variable.type === 'String' ? 'String' : 'int';
							}
						}
					}
					return variable.type === 'String' ? 'String' : 'int';
				}
				return 'int';
			default:
				return 'int';
		}
	},

	// 新增：更新回傳類型顯示
	updateReturnType_: function (type) {
		const mainInput = this.getInput('MAIN');
		const returnTypeField = mainInput.fieldRow.find(f => f.name === 'RETURN_TYPE');
		if (returnTypeField) {
			returnTypeField.setValue(type + ' ');
		}
	},

	// 添加 onchange 事件處理器
	onchange: function (e) {
		if (e.type === Blockly.Events.BLOCK_CHANGE || e.type === Blockly.Events.BLOCK_MOVE) {
			const returnInput = this.getInput('RETURN_VALUE');
			if (returnInput) {
				const connectedBlock = returnInput.connection.targetBlock();
				if (connectedBlock) {
					const returnType = this.getReturnType_(connectedBlock);
					this.updateReturnType_(returnType);
				}
			}
		}
	},
};

// 參數容器積木
Blockly.Blocks['arduino_function_mutator'] = {
	init: function () {
		this.appendDummyInput().appendField('函式參數');
		this.appendStatementInput('STACK');
		this.appendValueInput('RETURN').setCheck(null).appendField('回傳類型');
		this.setColour('#7986CB'); // 修改這裡，使用主題中定義的顏色
		this.setTooltip('');
		this.setHelpUrl('');
	},
};

// 參數積木
Blockly.Blocks['arduino_function_parameter'] = {
	init: function () {
		this.appendDummyInput()
			.appendField('參數')
			.appendField(
				new Blockly.FieldDropdown([
					['int', 'int'],
					['float', 'float'],
					['boolean', 'boolean'],
					['String', 'String'],
				]),
				'TYPE'
			)
			.appendField(new Blockly.FieldTextInput('x'), 'NAME');
		this.setPreviousStatement(true);
		this.setNextStatement(true);
		this.setColour('#7986CB'); // 修改這裡，使用主題中定義的顏色
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
				const mainWorkspace = mainBlock?.workspace;

				if (mainBlock && mainWorkspace) {
					// 更新主積木外觀
					mainBlock.updateShape_();

					// 找到所有相關的 function_call 積木
					const funcName = mainBlock.getFieldValue('NAME');
					const functionCalls = mainWorkspace
						.getAllBlocks(false)
						.filter(block => block.type === 'function_call' && block.getFieldValue('NAME') === funcName);

					// 更新每個 function_call 積木的外觀
					functionCalls.forEach(callBlock => {
						// 保存連接的積木
						const savedConnections = [];
						for (let i = 0; callBlock.getInput('ARG' + i); i++) {
							const input = callBlock.getInput('ARG' + i);
							if (input.connection.targetBlock()) {
								savedConnections.push({
									index: i,
									block: input.connection.targetBlock(),
								});
							}
						}

						// 更新形狀
						callBlock.updateShape_(mainBlock);

						// 重新連接積木
						savedConnections.forEach(({ index, block }) => {
							const input = callBlock.getInput('ARG' + index);
							if (input) {
								input.connection.connect(block.outputConnection);
							}
						});

						// 強制重新渲染
						callBlock.render();
					});
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

// 修改 return 積木定義
Blockly.Blocks['arduino_function_return'] = {
	init: function () {
		this.appendDummyInput().appendField('設定回傳值');
		this.setOutput(true, null);
		this.setColour('#7986CB');
		this.setTooltip('將此積木放置到右側來啟用函式回傳值');
		this.setHelpUrl('');
	},

	onchange: function (e) {
		if (e.type === Blockly.Events.BLOCK_MOVE || e.type === Blockly.Events.BLOCK_CREATE || e.type === Blockly.Events.BLOCK_DELETE) {
			const workspace = this.workspace;
			if (!workspace.isMutator) {
				return;
			}

			const rootBlock = this.getRootBlock();
			if (!rootBlock || rootBlock.type !== 'arduino_function_mutator') {
				return;
			}

			// 找到主要函式積木和主工作區
			const mainBlock = workspace.options.parentWorkspace?.mutator?.block_;
			const mainWorkspace = mainBlock?.workspace;
			if (!mainBlock || !mainWorkspace) {
				return;
			}

			// 檢查連接狀態
			const isConnected = rootBlock.getInputTargetBlock('RETURN') === this;

			if (mainBlock.hasReturn_ !== isConnected) {
				mainBlock.hasReturn_ = isConnected;

				// 更新主積木外觀
				mainBlock.updateShape_();

				// 尋找並更新所有相關的 function_call 積木
				const funcName = mainBlock.getFieldValue('NAME');
				mainWorkspace
					.getAllBlocks(false)
					.filter(block => block.type === 'function_call' && block.getFieldValue('NAME') === funcName)
					.forEach(callBlock => {
						callBlock.updateShape_(mainBlock);
						callBlock.render(); // 強制重新渲染
					});
			}
		}
	},
};

Blockly.Blocks['function_call'] = {
	init: function () {
		this.appendDummyInput().appendField('呼叫').appendField(new Blockly.FieldLabel(''), 'NAME');
		// 初始設定為輸出模式，之後會根據函式類型動態調整
		this.setOutput(true, null);
		this.setColour('#7986CB');
		this.setTooltip('呼叫函式');
		this.setHelpUrl('');

		// 添加對應的定義積木引用
		this.functionBlock_ = null;
	},

	mutationToDom: function () {
		const container = document.createElement('mutation');
		const funcName = this.getFieldValue('NAME');
		container.setAttribute('name', funcName);

		// 保存參數資訊
		if (this.functionBlock_) {
			container.setAttribute('arguments', JSON.stringify(this.functionBlock_.arguments_ || []));
			container.setAttribute('types', JSON.stringify(this.functionBlock_.argumentTypes_ || []));
			container.setAttribute('has_return', this.functionBlock_.hasReturn_ ? 'true' : 'false');
		}

		return container;
	},

	domToMutation: function (xmlElement) {
		const funcName = xmlElement.getAttribute('name');
		this.setFieldValue(funcName, 'NAME');

		// 嘗試找到對應的函式定義積木
		const workspace = this.workspace;
		const functionBlocks = workspace
			.getAllBlocks(false)
			.filter(block => block.type === 'arduino_function' && block.getFieldValue('NAME') === funcName);

		if (functionBlocks.length > 0) {
			this.functionBlock_ = functionBlocks[0];
			this.updateShape_(this.functionBlock_);
		} else {
			// 如果找不到函式定義積木，使用保存的參數資訊
			try {
				const args = JSON.parse(xmlElement.getAttribute('arguments') || '[]');
				const types = JSON.parse(xmlElement.getAttribute('types') || '[]');
				const hasReturn = xmlElement.getAttribute('has_return') === 'true';

				// 創建臨時的參數資訊
				this.functionBlock_ = {
					arguments_: args,
					argumentTypes_: types,
					hasReturn_: hasReturn,
				};
				this.updateShape_(this.functionBlock_);
			} catch (e) {
				console.error('Error parsing function call mutation:', e);
			}
		}
	},

	updateShape_: function (functionBlock) {
		this.functionBlock_ = functionBlock;

		// 保存輸出連接
		let outputConnection = null;
		if (this.outputConnection && this.outputConnection.targetConnection) {
			outputConnection = this.outputConnection.targetConnection;
		}

		// 保存前後連接
		let previousConnection = null;
		let nextConnection = null;
		if (this.previousConnection && this.previousConnection.targetConnection) {
			previousConnection = this.previousConnection.targetConnection;
		}
		if (this.nextConnection && this.nextConnection.targetConnection) {
			nextConnection = this.nextConnection.targetConnection;
		}

		// 保存現有參數連接
		const savedConnections = [];
		this.inputList.slice(1).forEach((input, i) => {
			if (input.connection && input.connection.targetBlock()) {
				savedConnections.push({
					index: i,
					block: input.connection.targetBlock(),
				});
			}
		});

		// 清除所有輸入除了第一個
		this.inputList.slice(1).forEach(input => this.removeInput(input.name));

		// 根據函式是否有回傳值設定連接方式
		if (!functionBlock || !functionBlock.hasReturn_) {
			// 無回傳值時使用前後連接
			this.setOutput(false);
			this.setPreviousStatement(true);
			this.setNextStatement(true);

			// 嘗試恢復前後連接
			if (this.previousConnection && previousConnection) {
				this.previousConnection.connect(previousConnection);
			}
			if (this.nextConnection && nextConnection) {
				this.nextConnection.connect(nextConnection);
			}
		} else {
			// 有回傳值時使用輸出連接
			this.setOutput(true);
			this.setPreviousStatement(false);
			this.setNextStatement(false);

			// 嘗試恢復輸出連接
			if (this.outputConnection && outputConnection) {
				this.outputConnection.connect(outputConnection);
			}
		}

		if (!functionBlock) {
			return;
		}

		// 取得函式的參數和類型
		const args = functionBlock.arguments_ || [];
		const types = functionBlock.argumentTypes_ || [];

		// 加入參數輸入點
		for (let i = 0; i < args.length; i++) {
			this.appendValueInput('ARG' + i)
				.setAlign(Blockly.ALIGN_RIGHT)
				.setCheck(this.getTypeCheck_(types[i]))
				.appendField(args[i]);
		}

		// 重新連接參數
		savedConnections.forEach(({ index, block }) => {
			const input = this.getInput('ARG' + index);
			if (input && input.connection) {
				input.connection.connect(block.outputConnection);
			}
		});

		// 強制重新渲染
		if (this.rendered) {
			this.render();
			// 通知工作區有變化
			this.workspace.fireChangeListener({
				type: Blockly.Events.CHANGE,
				blockId: this.id,
			});
		}
	},

	getTypeCheck_: function (type) {
		switch (type) {
			case 'int':
			case 'float':
				return 'Number';
			case 'String':
				return 'String';
			case 'boolean':
				return 'Boolean';
			default:
				return null;
		}
	},

	onchange: function (e) {
		if (this.workspace.isDragging && this.workspace.isDragging()) {
			return; // Don't update during drag
		}

		if (e.type === Blockly.Events.BLOCK_MOVE || e.type === Blockly.Events.BLOCK_CHANGE) {
			const funcName = this.getFieldValue('NAME');
			const workspace = this.workspace;

			// 尋找對應的函式定義積木
			const functionBlock = workspace
				.getAllBlocks(false)
				.find(block => block.type === 'arduino_function' && block.getFieldValue('NAME') === funcName);

			if (functionBlock && this.functionBlock_ !== functionBlock) {
				this.updateShape_(functionBlock);
			}
		}
	},
};
