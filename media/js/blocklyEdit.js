/**
 * @license
 * Copyright 2024 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
const vscode = acquireVsCodeApi();

// 註冊工具箱元件
Blockly.registry.register(Blockly.registry.Type.TOOLBOX_ITEM, Blockly.ToolboxCategory.registrationName, Blockly.ToolboxCategory);

document.addEventListener('DOMContentLoaded', async () => {
	console.log('Blockly Edit page loaded');

	// 載入 toolbox 配置
	const response = await fetch(window.TOOLBOX_URL);
	const toolboxConfig = await response.json();

	// 新增：在注入前處理 toolbox 配置中的翻譯
	const processTranslations = obj => {
		if (typeof obj === 'object') {
			for (let key in obj) {
				if (typeof obj[key] === 'string') {
					obj[key] = Blockly.utils.replaceMessageReferences(obj[key]);
				} else if (typeof obj[key] === 'object') {
					processTranslations(obj[key]);
				}
			}
		}
		return obj;
	};

	// 處理翻譯
	processTranslations(toolboxConfig);

	const workspace = Blockly.inject('blocklyDiv', {
		toolbox: toolboxConfig,
		trashcan: true, // 添加垃圾桶
		zoom: {
			controls: true, // 添加放大縮小控制
			wheel: true, // 允許使用滾輪縮放
			startScale: 1.0, // 初始縮放比例
			maxScale: 3, // 最大縮放比例
			minScale: 0.3, // 最小縮放比例
			scaleSpeed: 1.2, // 縮放速度
		},
		theme: window.SingularBlocklyTheme, // 使用全局主題
	});

	// 創建預設變數 i
	if (!workspace.getVariable('i')) {
		workspace.createVariable('i');
	}

	// 覆寫變數類別的flyout生成函數
	workspace.registerToolboxCategoryCallback('VARIABLE', function (workspace) {
		const variableBlocks = [];

		// 添加"新增變數"按鈕
		variableBlocks.push(
			Blockly.utils.xml.textToDom('<button text="' + Blockly.Msg['NEW_VARIABLE'] + '" callbackKey="CREATE_VARIABLE"></button>')
		);

		// 為每個現有變數創建積木
		const variables = workspace.getAllVariables();
		if (variables.length > 0) {
			variables.forEach(variable => {
				variableBlocks.push(
					Blockly.utils.xml.textToDom(
						`<block type="variables_get">
							<field name="VAR" id="${variable.getId()}">${variable.name}</field>
						</block>`
					),
					Blockly.utils.xml.textToDom(
						`<block type="variables_set">
							<field name="VAR" id="${variable.getId()}">${variable.name}</field>
						</block>`
					)
				);
			});
		}

		return variableBlocks;
	});

	// 註冊變數創建按鈕的回調
	workspace.registerButtonCallback('CREATE_VARIABLE', function () {
		vscode.postMessage({
			command: 'promptNewVariable',
			currentName: '',
			isRename: false,
		});
	});

	// 註冊函式類別的 flyout callback
	workspace.registerToolboxCategoryCallback('FUNCTION', function (workspace) {
		// 首先創建函式定義積木
		const blocks = [Blockly.utils.xml.textToDom(`<block type="arduino_function"></block>`)];
		// 然後為每個已定義的函式創建調用積木
		const functions = workspace.getBlocksByType('arduino_function', false);
		const functionCalls = functions.map(functionBlock => {
			const funcName = functionBlock.getFieldValue('NAME');
			// 創建函式調用積木
			const callBlockXml = Blockly.utils.xml.textToDom(
				`<block type="function_call">
					<field name="NAME">${funcName}</field>
				</block>`
			);
			// 使用 requestRender_ 來確保調用積木正確初始化
			const callBlockId = Blockly.utils.idGenerator.genUid();
			callBlockXml.setAttribute('id', callBlockId);
			// 在積木被添加到工作區後更新其形狀
			workspace.registerToolboxCategoryCallback('__TEMP__', function (ws) {
				setTimeout(() => {
					const callBlock = workspace.getBlockById(callBlockId);
					if (callBlock) {
						callBlock.updateShape_(functionBlock);
						callBlock.render();
					}
				}, 0);
				return [];
			});
			return callBlockXml;
		});
		// 返回合併後的積木陣列
		return blocks.concat(functionCalls);
	});

	// 保存工作區狀態的函數
	const saveWorkspaceState = () => {
		try {
			const state = Blockly.serialization.workspaces.save(workspace);
			vscode.postMessage({
				command: 'saveWorkspace',
				state: state,
				board: boardSelect.value,
			});
		} catch (error) {
			console.error('保存工作區狀態失敗:', error);
		}
	};

	// 單一的工作區變更監聽器
	workspace.addChangeListener(event => {
		if (event.isUiEvent) {
			return;
		} // 忽略 UI 事件

		// 更新程式碼
		if (
			event.type === Blockly.Events.BLOCK_MOVE || // 移除條件，讓所有移動都觸發更新
			event.type === Blockly.Events.BLOCK_CHANGE ||
			event.type === Blockly.Events.BLOCK_DELETE ||
			event.type === Blockly.Events.BLOCK_CREATE
		) {
			// 檢查是否是函式定義積木變化
			if (event.blockId) {
				const block = workspace.getBlockById(event.blockId);
				if (block) {
					if (block.type === 'arduino_function') {
						const funcName = block.getFieldValue('NAME');
						// 找到並更新所有相關的函式調用積木
						workspace
							.getAllBlocks(false)
							.filter(b => b.type === 'function_call' && b.getFieldValue('NAME') === funcName)
							.forEach(callBlock => {
								// 保存現有連接
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
								callBlock.updateShape_(block);
								// 恢復連接
								savedConnections.forEach(({ index, block }) => {
									const input = callBlock.getInput('ARG' + index);
									if (input) {
										input.connection.connect(block.outputConnection);
									}
								});
								callBlock.render();
							});
					}
				}
			}
			try {
				const code = arduinoGenerator.workspaceToCode(workspace);
				vscode.postMessage({
					command: 'updateCode',
					code: code,
				});
				// 只在實際的變更（非拖動中）時保存工作區狀態
				if (event.type !== Blockly.Events.BLOCK_MOVE || event.oldParentId !== undefined || event.newParentId !== undefined) {
					saveWorkspaceState();
				}
			} catch (err) {
				console.log('代碼生成暫時性錯誤（可能是積木正在拖動）:', err);
			}
		}
	});

	// 處理開發板選擇
	const boardSelect = document.getElementById('boardSelect');
	boardSelect.addEventListener('change', event => {
		const selectedBoard = event.target.value;
		// 更新全局的currentBoard
		window.setCurrentBoard(selectedBoard);
		// 觸發工作區更新以重新整理積木
		workspace.getAllBlocks().forEach(block => {
			if (block.type.startsWith('arduino_')) {
				block.render();
			}
		});
		vscode.postMessage({
			command: 'updateBoard',
			board: selectedBoard,
		});
		saveWorkspaceState();
	});

	// 監聽來自擴充功能的訊息
	window.addEventListener('message', event => {
		const message = event.data;
		const workspace = Blockly.getMainWorkspace();
		switch (message.command) {
			case 'createVariable':
				if (message.name) {
					if (message.isRename && message.oldName) {
						// 修正：直接使用變數 ID 進行重命名
						const variable = workspace.getVariable(message.oldName);
						if (variable) {
							// 使用 workspace 的 renameVariableById 方法
							workspace.renameVariableById(variable.getId(), message.name);
							// 觸發工作區變更事件以更新程式碼
							workspace.fireChangeListener({
								type: Blockly.Events.VAR_RENAME,
								varId: variable.getId(),
								oldName: message.oldName,
								newName: message.name,
							});
						}
					} else {
						// 新增變數，直接使用 workspace 的方法
						const existingVar = workspace.getVariable(message.name);
						if (!existingVar) {
							workspace.createVariable(message.name);
							// 觸發更新
							const code = arduinoGenerator.workspaceToCode(workspace);
							vscode.postMessage({
								command: 'updateCode',
								code: code,
							});
							saveWorkspaceState();
						}
					}
				}
				break;
			case 'deleteVariable':
				if (message.confirmed) {
					const variable = workspace.getVariable(message.name);
					if (variable) {
						const varId = variable.getId();
						// 先找出所有使用這個變數的積木
						const blocks = workspace
							.getBlocksByType('variables_get')
							.concat(workspace.getBlocksByType('variables_set'))
							.filter(block => block.getField('VAR').getText() === message.name);
						// 移除所有使用這個變數的積木
						blocks.forEach(block => {
							block.dispose(false);
						});
						// 從工作區中移除變數定義
						workspace.deleteVariableById(varId);
						// 手動觸發更新
						const code = arduinoGenerator.workspaceToCode(workspace);
						vscode.postMessage({
							command: 'updateCode',
							code: code,
						});
						saveWorkspaceState();
					}
				}
				break;
			// ...保留其他既有的 case...
			case 'loadWorkspace':
				try {
					if (message.board) {
						// 先設定板子類型
						boardSelect.value = message.board;
						window.setCurrentBoard(message.board);
						vscode.postMessage({
							command: 'updateBoard',
							board: message.board,
						});
					}
					if (message.state) {
						// 然後再載入工作區內容
						Blockly.serialization.workspaces.load(message.state, workspace);
					}
				} catch (error) {
					console.error('載入工作區狀態失敗:', error);
				}
				break;
		}
	});

	// 請求初始狀態
	vscode.postMessage({
		command: 'requestInitialState',
	});

	// handleResize 的定義
	const handleResize = () => {
		Blockly.svgResize(workspace);
	};

	// 註冊到 window 的 resize 事件
	window.addEventListener('resize', handleResize);

	// 初始觸發一次 resize
	handleResize();

	// 覆寫變數下拉選單的創建方法
	Blockly.FieldVariable.dropdownCreate = function () {
		const workspace = Blockly.getMainWorkspace();
		// 修改這行：使用變數的 ID 作為值
		const variableList = workspace.getAllVariables().map(variable => [variable.name, variable.getId()]);
		// 加入分隔線與選項
		if (variableList.length > 0) {
			const currentName = this.getText(); // 獲取當前變數名稱
			variableList.push(['---', '---']);
			variableList.push([Blockly.Msg['RENAME_VARIABLE'], Blockly.Msg['RENAME_VARIABLE']]);
			variableList.push([Blockly.Msg['DELETE_VARIABLE'].replace('%1', currentName), Blockly.Msg['DELETE_VARIABLE']]);
			variableList.push(['---', '---']);
		}
		variableList.push([Blockly.Msg['NEW_VARIABLE'], Blockly.Msg['NEW_VARIABLE']]);
		return variableList;
	};

	// 覆寫變數下拉選單的變更監聽器
	Blockly.FieldVariable.prototype.onItemSelected_ = function (menu, menuItem) {
		const workspace = this.sourceBlock_.workspace;
		const value = menuItem.getValue();
		if (value === Blockly.Msg['NEW_VARIABLE']) {
			// 請求使用者輸入新變數名稱
			vscode.postMessage({
				command: 'promptNewVariable',
				currentName: '',
			});
		} else if (value === Blockly.Msg['RENAME_VARIABLE']) {
			const id = this.getValue();
			const variable = workspace.getVariableById(id);
			if (variable) {
				// 請求使用者輸入新名稱
				vscode.postMessage({
					command: 'promptNewVariable',
					currentName: variable.name,
					isRename: true,
				});
			}
		} else if (value === Blockly.Msg['DELETE_VARIABLE']) {
			const id = this.getValue();
			const variable = workspace.getVariableById(id);
			if (variable) {
				// 詢問使用者是否要刪除變數
				vscode.postMessage({
					command: 'confirmDeleteVariable',
					variableName: variable.name,
				});
			}
		} else if (value !== '---') {
			// 正常選擇變數：直接使用變數 ID
			this.setValue(value);
		}
	};

	// 覆寫 Blockly 的變數創建函數，避免使用內建對話框
	Blockly.Variables.createVariable = function (workspace, opt_callback, opt_type) {
		// 直接發送訊息給 VS Code，要求輸入新變數名稱
		vscode.postMessage({
			command: 'promptNewVariable',
			currentName: '',
			type: opt_type || '',
		});
	};
});

// 覆寫 Blockly 的字串替換函數
Blockly.utils.replaceMessageReferences = function (message) {
	if (!message) {
		return message;
	}
	return message.replace(/%{([^}]*)}/g, function (m, key) {
		return window.languageManager.getMessage(key, m);
	});
};
