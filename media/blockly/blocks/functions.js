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
		this.updateShape_();
	},

	saveConnections: function (containerBlock) {
		let paramBlock = containerBlock.getInputTargetBlock('STACK');
		let i = 0;
		while (paramBlock) {
			paramBlock = paramBlock.nextConnection && paramBlock.nextConnection.targetBlock();
			i++;
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
			.appendField(new Blockly.FieldTextInput('myFunction'), 'NAME')
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
					const type = this.getReturnType_(connectedBlock);
					this.updateReturnType_(type);
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
		if (e.type === Blockly.Events.CREATE && e.blockId === this.id) {
			setTimeout(() => {
				const blocks = this.workspace.getBlocksByType('arduino_function_parameter');
				const index = blocks.indexOf(this);
				if (index !== -1) {
					const letters = 'xyzabcdefghijklmnopqrstuvw';
					const newName = index < letters.length ? letters[index] : `arg${index}`;
					if (this.getFieldValue('NAME') === 'x') {
						this.getField('NAME').setValue(newName);
					}
				}
			}, 0);
		}
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

			// 找到主要函式積木
			const mainWorkspace = workspace.options.parentWorkspace;
			const mainBlock = mainWorkspace?.mutator?.block_;
			if (!mainBlock) {
				return;
			}

			// 確認是否連接到 Mutator
			const isConnected = rootBlock.getInputTargetBlock('RETURN') === this;

			// 更新主積木狀態
			if (mainBlock.hasReturn_ !== isConnected) {
				mainBlock.hasReturn_ = isConnected;
				setTimeout(() => mainBlock.updateShape_(), 0);
			}
		}
	},
};

// 修改函式積木的 onchange 事件處理
Blockly.Blocks['arduino_function'].onchange = function (e) {
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
};
