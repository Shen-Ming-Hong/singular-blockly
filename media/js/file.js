
document.addEventListener('DOMContentLoaded', () => {
	console.log('Blockly Edit page loaded');
	const workspace = Blockly.inject('blocklyDiv', {
		toolbox: `
			<xml xmlns="https://developers.google.com/blockly/xml">
				<block type="controls_if"></block>
				<block type="logic_compare"></block>
				<block type="math_number"></block>
				<block type="math_arithmetic"></block>
				<block type="text"></block>
				<block type="text_print"></block>
			</xml>
		`,
		trashcan: true, // 添加垃圾桶
		zoom: {
			controls: true, // 添加放大縮小控制
			wheel: true, // 允許使用滾輪縮放
			startScale: 1.0, // 初始縮放比例
			maxScale: 3, // 最大縮放比例
			minScale: 0.3, // 最小縮放比例
			scaleSpeed: 1.2 // 縮放速度
		},
		theme: 'modern'
	});

	window.addEventListener('resize', () => {
		const blocklyDiv = document.getElementById('blocklyDiv');
		blocklyDiv.style.width = window.innerWidth + 'px';
		blocklyDiv.style.height = window.innerHeight + 'px';
		Blockly.svgResize(workspace);
	});

	window.dispatchEvent(new Event('resize'));
});
