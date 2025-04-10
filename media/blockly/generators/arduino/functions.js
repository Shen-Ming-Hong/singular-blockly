/**
 * @license
 * Copyright 2024 Singular Blockly Contributors
 * Copyright 2012 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

window.arduinoGenerator.forBlock['arduino_function'] = function (block) {
	const funcName = block.getFieldValue('NAME');
	const statements = window.arduinoGenerator.statementToCode(block, 'STACK');

	// 處理函式參數
	const args = [];
	for (let i = 0; i < block.arguments_.length; i++) {
		args.push(block.argumentTypes_[i] + ' ' + block.arguments_[i]);
	}

	// 函式回傳型態固定為 void，不再支援其他回傳類型
	const returnType = 'void';
	// 生成函式定義
	let code = `${returnType} ${funcName}(${args.join(', ')}) {\n`;

	// 添加函式內容
	if (statements) {
		code += statements;
	}

	// 添加函式結尾
	code += '}\n\n';

	// 將函式定義添加到全域函式集合
	window.arduinoGenerator.functions_[funcName] = code;
	return null;
};
// 函數呼叫積木的代碼生成器
window.arduinoGenerator.forBlock['arduino_function_call'] = function (block) {
	// 使用直接變數存放代碼，函數呼叫統一為語句型態
	let code = '';

	try {
		// 獲取函數名稱
		const funcName = block.getFieldValue('NAME');
		if (!funcName) {
			console.warn('函數呼叫積木缺少函數名稱');
			code = '/* 未定義函數 */';
			return code + ';\n';
		}

		// 處理函數參數
		const args = [];

		// 根據參數類型提供預設值的輔助函數
		const getDefaultValueForType = type => {
			switch (type) {
				case 'String':
					return '""';
				case 'bool':
					return 'false';
				case 'float':
					return '0.0';
				default:
					return '0';
			}
		};

		// 安全地處理參數
		if (Array.isArray(block.arguments_)) {
			for (let i = 0; i < block.arguments_.length; i++) {
				// 檢查輸入是否存在
				if (block.getInput('ARG' + i)) {
					try {
						// 嘗試獲取連接的積木代碼
						const inputBlock = block.getInputTargetBlock('ARG' + i);
						let argCode = '';

						if (inputBlock) {
							if (inputBlock.type === 'arduino_function_call') {
								// 特殊處理: 如果參數也是函數呼叫積木
								const nestedCode = window.arduinoGenerator.blockToCode(inputBlock);

								// 處理語句形式返回的情況 (應該移除末尾的分號)
								argCode = String(nestedCode).replace(/;\s*$/, '');
							} else {
								// 標準處理其他類型的積木
								try {
									// 直接使用預設的優先順序值
									const orderValue = window.arduinoGenerator.ORDER_ATOMIC;

									// 安全地獲取參數代碼
									argCode = window.arduinoGenerator.valueToCode(block, 'ARG' + i, orderValue);
								} catch (orderError) {
									console.warn(`獲取參數代碼失敗，使用備用方法:`, orderError);

									// 嘗試直接獲取積木的代碼
									const blockToCode = window.arduinoGenerator.blockToCode(inputBlock);
									// 簡化這個檢查，因為函數呼叫始終是語句
									argCode = String(blockToCode).replace(/;\s*$/, ''); // 移除分號
								}
							}
						}

						// 獲取預期的參數類型
						const argType =
							Array.isArray(block.argumentTypes_) && i < block.argumentTypes_.length
								? block.argumentTypes_[i] || 'int'
								: 'int';

						// 添加參數代碼或預設值
						args.push(argCode || getDefaultValueForType(argType));
					} catch (paramError) {
						console.error(`處理參數 ${i} 時出錯:`, paramError);

						// 出錯時使用預設值
						const argType =
							Array.isArray(block.argumentTypes_) && i < block.argumentTypes_.length
								? block.argumentTypes_[i] || 'int'
								: 'int';
						args.push(getDefaultValueForType(argType));
					}
				}
			}
		}
		// 生成函數呼叫代碼
		code = `${funcName}(${args.join(', ')})`;
	} catch (e) {
		console.error('函數呼叫生成錯誤:', e);
		code = '/* 函數呼叫錯誤 */';
	}

	// 加上分號和換行符
	return code + ';\n';
};
