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

	const vscode = acquireVsCodeApi();

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
		if (message.command === 'loadWorkspace') {
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
		}
	});

	Blockly.Variables.createVariableButtonHandler = function (workspace) {
		const dialog = document.getElementById('variableDialog');
		const input = document.getElementById('variableNameInput');
		dialog.style.display = 'block';
		input.value = '';
		input.focus();

		// 防止點擊對話框外部自動關閉
		const clickHandler = function (e) {
			if (!dialog.contains(e.target)) {
				cancelVariable();
				document.removeEventListener('click', clickHandler);
			}
		};

		setTimeout(() => {
			document.addEventListener('click', clickHandler);
		}, 100);
	};

	// 確認建立變數
	window.confirmVariable = function () {
		const input = document.getElementById('variableNameInput');
		const name = input.value.trim();

		if (name) {
			if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(name)) {
				alert('變數名稱必須以字母或底線開頭，只能包含字母、數字和底線');
				return;
			}

			try {
				workspace.createVariable(name);
				document.getElementById('variableDialog').style.display = 'none';
			} catch (e) {
				console.error('建立變數失敗:', e);
				alert('建立變數失敗: ' + e.message);
			}
		} else {
			alert('請輸入變數名稱');
		}
	};

	// 取消建立變數
	window.cancelVariable = function () {
		document.getElementById('variableDialog').style.display = 'none';
	};

	// 監聽變數對話框的 Enter 鍵
	document.getElementById('variableNameInput').addEventListener('keypress', function (e) {
		if (e.key === 'Enter') {
			confirmVariable();
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
});
