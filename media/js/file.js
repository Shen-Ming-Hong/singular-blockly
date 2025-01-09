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

	window.addEventListener('resize', () => {
		const blocklyDiv = document.getElementById('blocklyDiv');
		blocklyDiv.style.width = window.innerWidth + 'px';
		blocklyDiv.style.height = window.innerHeight + 'px';
		Blockly.svgResize(workspace);
	});

	window.dispatchEvent(new Event('resize'));
});
