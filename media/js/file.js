document.addEventListener('DOMContentLoaded', async () => {
	console.log('Blockly Edit page loaded');

	// 先取得所有 DOM 元素
	const blocklyDiv = document.getElementById('blocklyDiv');
	const blocklyArea = document.getElementById('blocklyArea'); // 添加這行

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

	// 修改 resize 事件處理，移到 DOM 元素初始化之後
	const handleResize = () => {
		Blockly.svgResize(workspace);
	};

	window.addEventListener('resize', handleResize);

	// 初始觸發一次 resize
	handleResize();
});
