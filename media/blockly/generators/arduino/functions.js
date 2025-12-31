/**
 * @license
 * Copyright 2025 Singular Blockly Contributors
 * Copyright 2012 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

window.arduinoGenerator.forBlock['arduino_function'] = function (block) {
	const displayName = block.getFieldValue('NAME'); // 顯示用的名稱（可以是中文）
	const funcName = window.arduinoGenerator.convertFunctionName(displayName); // 轉換後的合法函式名稱
	const statements = window.arduinoGenerator.statementToCode(block, 'STACK');

	// 儲存顯示名稱和實際函式名稱的對應關係
	if (!window.arduinoGenerator.functionNameMap) {
		window.arduinoGenerator.functionNameMap = new Map();
	}
	window.arduinoGenerator.functionNameMap.set(displayName, funcName);

	// 初始化參數名稱對應表（用於函數呼叫時取得轉換後的參數名稱）
	if (!window.arduinoGenerator.functionParamMap) {
		window.arduinoGenerator.functionParamMap = new Map();
	}

	// 處理函式參數（中文參數名稱需轉換為合法 C++ 變數名稱）
	const args = [];
	const paramMap = new Map();
	for (let i = 0; i < block.arguments_.length; i++) {
		const originalParamName = block.arguments_[i];
		// 使用與函式名稱相同的轉換邏輯處理參數名稱
		const convertedParamName = window.arduinoGenerator.convertFunctionName(originalParamName);
		paramMap.set(originalParamName, convertedParamName);
		args.push(block.argumentTypes_[i] + ' ' + convertedParamName);
	}
	// 儲存此函數的參數名稱對應關係
	window.arduinoGenerator.functionParamMap.set(displayName, paramMap);

	// 函式回傳型態固定為 void
	const returnType = 'void';
	// 生成函式定義，並在註解中保留原始名稱
	let code = `// 原始函式名稱: ${displayName}\n`;
	code += `${returnType} ${funcName}(${args.join(', ')}) {\n`;

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

window.arduinoGenerator.forBlock['arduino_function_call'] = function (block) {
	let code = '';

	try {
		// 獲取顯示用的函式名稱
		const displayName = block.getFieldValue('NAME');
		if (!displayName) {
			log.warn('函數呼叫積木缺少函數名稱');
			code = '/* 未定義函數 */';
			return code + ';\n';
		}

		// 獲取實際的函式名稱
		const funcName = window.arduinoGenerator.functionNameMap
			? window.arduinoGenerator.functionNameMap.get(displayName)
			: window.arduinoGenerator.convertFunctionName(displayName);

		// 處理參數
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
									log.warn(`獲取參數代碼失敗，使用備用方法:`, orderError);

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
						log.error(`處理參數 ${i} 時出錯:`, paramError);

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
		log.error('函數呼叫生成錯誤:', e);
		code = '/* 函數呼叫錯誤 */';
	}

	// 加上分號和換行符
	return code + ';\n';
};
