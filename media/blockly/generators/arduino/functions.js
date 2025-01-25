window.arduinoGenerator.forBlock['arduino_function'] = function (block) {
	const funcName = block.getFieldValue('NAME');
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
