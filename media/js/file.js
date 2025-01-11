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

	// 處理開發板選擇
	const boardSelect = document.getElementById('boardSelect');
	boardSelect.addEventListener('change', event => {
		const selectedBoard = event.target.value;
		vscode.postMessage({
			command: 'updateBoard',
			board: selectedBoard,
		});
	});

	// 更新程式碼預覽的函數
	const updateCodePreview = () => {
		const code = arduinoGenerator.workspaceToCode(workspace);
		vscode.postMessage({
			command: 'updateCode',
			code: code,
		});
	};

	// 修改 workspace change listener
	workspace.addChangeListener(function (event) {
		if (
			event.type === Blockly.Events.BLOCK_MOVE ||
			event.type === Blockly.Events.BLOCK_CHANGE ||
			event.type === Blockly.Events.BLOCK_DELETE ||
			event.type === Blockly.Events.BLOCK_CREATE
		) {
			updateCodePreview(); // 更新程式碼預覽
		}
	});

	// 監聽來自擴充功能的訊息
	window.addEventListener('message', event => {
		const message = event.data;
		if (message.command === 'loadWorkspace') {
			Blockly.serialization.workspaces.load(message.state, workspace);
		}
	});

	// 每當工作區變更時保存狀態
	workspace.addChangeListener(e => {
		if (e.isUiEvent) {
			return;
		} // 忽略 UI 事件

		const state = Blockly.serialization.workspaces.save(workspace);
		vscode.postMessage({
			command: 'saveWorkspace',
			state: state,
		});
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
