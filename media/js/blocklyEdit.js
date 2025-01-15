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

	// 移除這行，因為已經在全域宣告
	// const vscode = acquireVsCodeApi();

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
						// 新增變數
						workspace.createVariable(message.name);
					}
				}
				break;

			case 'deleteVariable':
				if (message.confirmed) {
					const variable = workspace.getVariable(message.name);
					if (variable) {
						workspace.deleteVariable(variable);
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
		const variableList = workspace.getAllVariables().map(variable => [variable.name, variable.name]);

		// 加入分隔線與選項
		if (variableList.length > 0) {
			const currentName = this.getText(); // 獲取當前變數名稱
			variableList.push(['---', '---']);
			variableList.push([Blockly.Msg['RENAME_VARIABLE'], Blockly.Msg['RENAME_VARIABLE']]);
			// 正確格式化刪除變數的選項文字
			variableList.push([Blockly.Msg['DELETE_VARIABLE'].replace('%1', currentName), Blockly.Msg['DELETE_VARIABLE']]);
			variableList.push(['---', '---']);
		}

		// 加入 "新增變數" 選項
		variableList.push([Blockly.Msg['NEW_VARIABLE'], Blockly.Msg['NEW_VARIABLE']]);

		return variableList;
	};

	// 覆寫變數下拉選單的變更監聽器
	Blockly.FieldVariable.prototype.onItemSelected_ = function (menu, menuItem) {
		const workspace = this.sourceBlock_.workspace;
		const id = this.getValue();
		const variable = workspace.getVariableById(id);

		if (menuItem.getValue() === Blockly.Msg['NEW_VARIABLE']) {
			// 請求使用者輸入新變數名稱
			vscode.postMessage({
				command: 'promptNewVariable',
				currentName: '',
			});
		} else if (menuItem.getValue() === Blockly.Msg['RENAME_VARIABLE']) {
			if (variable) {
				// 請求使用者輸入新名稱
				vscode.postMessage({
					command: 'promptNewVariable',
					currentName: variable.name,
					isRename: true,
				});
			}
		} else if (menuItem.getValue() === Blockly.Msg['DELETE_VARIABLE']) {
			if (variable) {
				// 詢問使用者是否要刪除變數
				vscode.postMessage({
					command: 'confirmDeleteVariable',
					variableName: variable.name,
				});
			}
		} else if (menuItem.getValue() !== '---') {
			// 正常選擇變數
			this.setValue(menuItem.getValue());
		}
	};
});
