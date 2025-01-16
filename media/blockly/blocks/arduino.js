Blockly.Blocks['arduino_setup_loop'] = {
	init: function () {
		this.appendStatementInput('SETUP').setCheck(null).appendField('初始化');
		this.appendStatementInput('LOOP').setCheck(null).appendField('重複執行');
		this.setColour(230);
		this.setTooltip('Arduino 程式的基本結構');
		this.setHelpUrl('');
	},
};

Blockly.Blocks['arduino_digital_write'] = {
	init: function () {
		this.appendDummyInput()
			.appendField('數位寫入 腳位')
			.appendField(new Blockly.FieldNumber(13, 0, 127), 'PIN')
			.appendField('數值')
			.appendField(
				new Blockly.FieldDropdown([
					['HIGH', 'HIGH'],
					['LOW', 'LOW'],
				]),
				'VALUE'
			);
		this.setPreviousStatement(true, null);
		this.setNextStatement(true, null);
		this.setColour(230);
		this.setTooltip('寫入數位輸出值到指定的腳位');
		this.setHelpUrl('');
	},
};

Blockly.Blocks['arduino_digital_read'] = {
	init: function () {
		this.appendDummyInput().appendField('數位讀取 腳位').appendField(new Blockly.FieldNumber(2, 0, 127), 'PIN');
		this.setOutput(true, 'Boolean');
		this.setColour(230);
		this.setTooltip('從指定的腳位讀取數位輸入值');
		this.setHelpUrl('');
	},
};

Blockly.Blocks['arduino_analog_write'] = {
	init: function () {
		this.appendDummyInput()
			.appendField('類比寫入 腳位')
			.appendField(new Blockly.FieldNumber(3, 0, 127), 'PIN')
			.appendField('數值')
			.appendField(new Blockly.FieldNumber(0, 0, 255), 'VALUE');
		this.setPreviousStatement(true, null);
		this.setNextStatement(true, null);
		this.setColour(230);
		this.setTooltip('寫入類比值(0-255)到指定的腳位');
		this.setHelpUrl('');
	},
};

Blockly.Blocks['arduino_analog_read'] = {
	init: function () {
		this.appendDummyInput().appendField('類比讀取 腳位').appendField(new Blockly.FieldNumber(0, 0, 127), 'PIN');
		this.setOutput(true, 'Number');
		this.setColour(230);
		this.setTooltip('從指定的腳位讀取類比值(0-1023)');
		this.setHelpUrl('');
	},
};

Blockly.Blocks['arduino_delay'] = {
	init: function () {
		this.appendDummyInput().appendField('等待').appendField(new Blockly.FieldNumber(1000, 0), 'TIME').appendField('毫秒');
		this.setPreviousStatement(true, null);
		this.setNextStatement(true, null);
		this.setColour(230);
		this.setTooltip('暫停程式執行指定的毫秒數');
		this.setHelpUrl('');
	},
};

// 先註冊 Mutator
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
		this.updateShape_();
	},

	decompose: function (workspace) {
		const containerBlock = workspace.newBlock('arduino_function_mutator');
		containerBlock.initSvg();

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

	// 修改 flyout callback
	parameterFlyoutCallback: function (workspace) {
		const paramBlock = workspace.newBlock('arduino_function_parameter');
		paramBlock.initSvg();

		// 取得積木的高度
		const blockHeight = paramBlock.getHeightWidth().height;

		// 設定 flyout 的最小高度
		// 預留空間給至少 3 個參數積木
		const minHeight = blockHeight * 3.5; // 3.5 倍高度以確保有足夠空間

		// 設定 flyout 設定
		workspace.flyout_.setHeight(minHeight);
		workspace.flyout_.workspace_.updateInverseScreenCTM();

		// 計算現有的參數數量
		let count = 0;
		let block = workspace.getTopBlocks(false)[0];
		if (block) {
			let paramBlock = block.getInputTargetBlock('STACK');
			while (paramBlock) {
				count++;
				paramBlock = paramBlock.getNextBlock();
			}
		}

		// 根據位置設定預設變數名稱
		const letters = 'xyzabcdefghijklmnopqrstuvw';
		const newName = count < letters.length ? letters[count] : `arg${count}`;
		paramBlock.setFieldValue(newName, 'NAME');

		return [paramBlock];
	},
};

// 註冊 Mutator 擴展
Blockly.Extensions.registerMutator(
	'function_mutator',
	functionMutator,
	function () {
		this.parameterFlyoutCallback = functionMutator.parameterFlyoutCallback;
	},
	['arduino_function_parameter']
);

// 修改函式積木定義
Blockly.Blocks['arduino_function'] = {
	init: function () {
		// 創建主要輸入行，包含函式名稱和參數列表
		this.appendDummyInput('MAIN')
			.appendField('函式')
			.appendField(new Blockly.FieldTextInput('myFunction'), 'NAME')
			.appendField(':', 'PARAM_LABEL'); // 添加冒號分隔符

		this.appendStatementInput('STACK').setCheck(null);
		this.setColour(290);
		this.setTooltip('');
		this.setHelpUrl('');

		// 初始化參數陣列
		this.arguments_ = [];
		this.argumentTypes_ = [];

		// 使用擴展而不是直接設置 mutator
		this.jsonInit({
			mutator: 'function_mutator',
		});
	},

	// 更新積木外觀
	updateShape_: function () {
		// 獲取主要輸入行
		const mainInput = this.getInput('MAIN');

		// 移除所有舊的參數字段
		const fieldCount = mainInput.fieldRow.length;
		for (let i = fieldCount - 1; i >= 0; i--) {
			const field = mainInput.fieldRow[i];
			if (field.name && (field.name.startsWith('TYPE_') || field.name.startsWith('NAME_') || field.name.startsWith('SEP_'))) {
				mainInput.removeField(field.name);
			}
		}

		// 添加新的參數
		if (this.arguments_ && this.argumentTypes_) {
			for (let i = 0; i < this.arguments_.length; i++) {
				if (i > 0) {
					// 添加分隔逗號
					mainInput.appendField(', ', 'SEP_' + i);
				}
				// 添加參數類型和名稱
				mainInput
					.appendField(new Blockly.FieldLabel(this.argumentTypes_[i] || 'int'), 'TYPE_' + i)
					.appendField(new Blockly.FieldLabel(' ' + (this.arguments_[i] || '')), 'NAME_' + i);
			}
		}
	},
};

// 參數容器積木
Blockly.Blocks['arduino_function_mutator'] = {
	init: function () {
		this.appendDummyInput().appendField('函式參數');
		this.appendStatementInput('STACK');
		this.setColour(290);
		this.setTooltip('');
		this.setHelpUrl('');
	},
};

// 修改參數積木
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
		this.setColour(290);
		this.setTooltip('');
		this.setHelpUrl('');
	},

	onchange: function (e) {
		if (e.type === Blockly.Events.CREATE) {
			// 檢查是否是這個積木被創建的事件
			if (e.blockId === this.id) {
				// 等待下一個事件循環再執行，確保工作區已完全初始化
				setTimeout(() => {
					// 獲取所有同類型的積木
					const blocks = this.workspace.getBlocksByType('arduino_function_parameter');
					// 找出此積木在序列中的位置
					const index = blocks.indexOf(this);
					if (index !== -1) {
						// 設定對應的變數名稱
						const letters = 'xyzabcdefghijklmnopqrstuvw';
						const newName = index < letters.length ? letters[index] : `arg${index}`;
						// 只有當名稱是預設的 'x' 時才更新
						if (this.getFieldValue('NAME') === 'x') {
							this.getField('NAME').setValue(newName);
						}
					}
				}, 0);
			}
		}
	},
};
