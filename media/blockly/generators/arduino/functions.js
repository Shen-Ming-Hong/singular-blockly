window.arduinoGenerator.forBlock['arduino_function'] = function (block) {
	const funcName = block.getFieldValue('NAME');

	// Add event listener for name changes if not already added
	if (!block.nameChangeHandler_) {
		block.nameChangeHandler_ = function (event) {
			if (event.type === Blockly.Events.CHANGE && event.element === 'field' && event.name === 'NAME') {
				// Find all function_call blocks in the workspace that reference this function
				const workspace = block.workspace;
				const callBlocks = workspace.getAllBlocks().filter(b => b.type === 'function_call' && b.functionBlock_ === block);

				// Update each function_call block's name
				callBlocks.forEach(callBlock => {
					callBlock.setFieldValue(event.newValue, 'NAME');
				});
			}
		};
		block.workspace.addChangeListener(block.nameChangeHandler_);
	}

	const statements = window.arduinoGenerator.statementToCode(block, 'STACK');

	// 處理函式參數
	const args = [];
	for (let i = 0; i < block.arguments_.length; i++) {
		args.push(block.argumentTypes_[i] + ' ' + block.arguments_[i]);
	}

	// 決定回傳型態
	let returnType = 'void';
	let hasReturnStatement = false;

	// 檢查回傳值輸入
	const returnValueInput = block.getInput('RETURN_VALUE');
	if (returnValueInput && returnValueInput.connection.targetBlock()) {
		const returnBlock = returnValueInput.connection.targetBlock();
		returnType = block.getReturnType_(returnBlock); // 使用 functions.js 中定義的方法
	}

	// 生成函式定義
	let code = `${returnType} ${funcName}(${args.join(', ')}) {\n`;

	// 添加函式內容
	if (statements) {
		// 檢查是否已經有 return 語句
		hasReturnStatement = statements.includes('return');
		code += statements;
	}

	// 處理回傳值
	if (returnType !== 'void' && !hasReturnStatement) {
		const returnValue = window.arduinoGenerator.valueToCode(block, 'RETURN_VALUE', window.arduinoGenerator.ORDER_ATOMIC);

		// 根據回傳型態提供預設值
		let defaultValue;
		switch (returnType) {
			case 'String':
				defaultValue = '""';
				break;
			case 'boolean':
				defaultValue = 'false';
				break;
			case 'float':
				defaultValue = '0.0';
				break;
			default:
				defaultValue = '0';
		}

		code += `  return ${returnValue || defaultValue};\n`;
	}

	code += '}\n\n';

	// 將函式定義添加到全域函式集合
	window.arduinoGenerator.functions_[funcName] = code;
	return null;
};

window.arduinoGenerator.forBlock['function_call'] = function (block) {
	const functionName = block.getFieldValue('NAME');
	const functionBlock = block.functionBlock_;

	const args = [];
	if (functionBlock && functionBlock.arguments_) {
		for (let i = 0; i < functionBlock.arguments_.length; i++) {
			const input = block.getInput('ARG' + i);
			if (!input) {
				continue;
			}

			let paramValue = window.arduinoGenerator.valueToCode(block, 'ARG' + i, window.arduinoGenerator.ORDER_NONE);
			const paramType = functionBlock.argumentTypes_[i];

			if (!paramValue) {
				switch (paramType) {
					case 'String':
						paramValue = '""';
						break;
					case 'boolean':
						paramValue = 'false';
						break;
					case 'float':
						paramValue = '0.0';
						break;
					default:
						paramValue = '0';
				}
			}
			args.push(paramValue);
		}
	}

	const code = `${functionName}(${args.join(', ')})`;

	if (functionBlock && functionBlock.hasReturn_) {
		return [code, window.arduinoGenerator.ORDER_UNARY_POSTFIX];
	} else {
		return code + ';\n';
	}
};
