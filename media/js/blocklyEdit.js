// 在頁面最上方宣告全域 vscode API 實例
const vscode = acquireVsCodeApi();

document.addEventListener('DOMContentLoaded', async () => {
	console.log('Blockly Edit page loaded');

	// 載入 toolbox 配置
	const response = await fetch(window.TOOLBOX_URL);
	const toolboxConfig = await response.json();
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
			event.type === Blockly.Events.BLOCK_MOVE ||
			event.type === Blockly.Events.BLOCK_CHANGE ||
			event.type === Blockly.Events.BLOCK_DELETE ||
			event.type === Blockly.Events.BLOCK_CREATE
		) {
			const code = arduinoGenerator.workspaceToCode(workspace);
			vscode.postMessage({
				command: 'updateCode',
				code: code,
			});
		}

		// 保存工作區狀態
		saveWorkspaceState();
	});

	// 處理開發板選擇
	const boardSelect = document.getElementById('boardSelect');
	boardSelect.addEventListener('change', event => {
		const selectedBoard = event.target.value;
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
					if (message.state) {
						Blockly.serialization.workspaces.load(message.state, workspace);
					}
					if (message.board) {
						boardSelect.value = message.board;
						vscode.postMessage({
							command: 'updateBoard',
							board: message.board,
						});
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
