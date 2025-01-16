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

	parameterFlyoutCallback: function (workspace) {
		const paramBlock = workspace.newBlock('arduino_function_parameter');
		paramBlock.initSvg();

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

// 函式積木定義
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

		this.jsonInit({
			mutator: 'function_mutator',
		});
	},

	updateShape_: function () {
		const mainInput = this.getInput('MAIN');
		const fieldCount = mainInput.fieldRow.length;
		for (let i = fieldCount - 1; i >= 0; i--) {
			const field = mainInput.fieldRow[i];
			if (field.name && (field.name.startsWith('TYPE_') || field.name.startsWith('NAME_') || field.name.startsWith('SEP_'))) {
				mainInput.removeField(field.name);
			}
		}

		if (this.arguments_ && this.argumentTypes_) {
			for (let i = 0; i < this.arguments_.length; i++) {
				if (i > 0) {
					mainInput.appendField(', ', 'SEP_' + i);
				}
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
