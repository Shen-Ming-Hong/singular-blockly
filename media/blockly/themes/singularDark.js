/**
 * @license
 * Copyright 2024 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Singular Dark theme configuration
 */
const singularDarkTheme = Blockly.Theme.defineTheme('singularDark', {
	base: Blockly.Themes.Modern,
	componentStyles: {
		workspaceBackgroundColour: '#2D2D2D', // 深灰色背景
		toolboxBackgroundColour: '#333333', // 較深的工具箱背景
		toolboxForegroundColour: '#E0E0E0', // 淺灰色文字
		flyoutBackgroundColour: '#383838', // 深灰色彈出背景
		flyoutForegroundColour: '#E0E0E0',
		flyoutOpacity: 0.95,
		scrollbarColour: '#505050',
		insertionMarkerColour: '#FF8A65', // 保持相同的珊瑚色標記
		insertionMarkerOpacity: 0.3,
		scrollbarOpacity: 0.4,
		cursorColour: '#FF8A65',
		selectedGlowColour: '#FF8A65',
		selectedGlowOpacity: 0.3,
		replacementGradientHue: 180,
	},
	blockStyles: {
		logic_blocks: {
			colourPrimary: '#78909C', // 溫暖的灰藍色
			colourSecondary: '#7D94A0', // 更接近主色調
			colourTertiary: '#8298A3', // 降低陰影對比
		},
		loop_blocks: {
			colourPrimary: '#A1887F', // 溫暖的褐色
			colourSecondary: '#A58D84',
			colourTertiary: '#A99289',
		},
		math_blocks: {
			colourPrimary: '#66BB6A', // 柔和的綠色
			colourSecondary: '#6BBE6F',
			colourTertiary: '#70C174',
		},
		text_blocks: {
			colourPrimary: '#FB8C00', // 更深的橙色，提高對比度
			colourSecondary: '#FC9110',
			colourTertiary: '#FD961F',
		},
		list_blocks: {
			colourPrimary: '#F06292', // 柔和的粉紅色
			colourSecondary: '#F16997',
			colourTertiary: '#F2709B',
		},
		variable_blocks: {
			colourPrimary: '#4DB6AC', // 柔和的青色
			colourSecondary: '#52B9AF',
			colourTertiary: '#57BCB3',
		},
		procedure_blocks: {
			colourPrimary: '#7986CB', // 溫暖的靛藍色
			colourSecondary: '#7E8ACE',
			colourTertiary: '#838ED1',
		},
		arduino_blocks: {
			colourPrimary: '#00979C', // Arduino 標準藍色
			colourSecondary: '#00A0A0',
			colourTertiary: '#00B9C0',
		},
		sensor_blocks: {
			colourPrimary: '#8A95A8', // 柔和灰藍
			colourSecondary: '#7E8892', // 深階灰藍
			colourTertiary: '#707583', // 更深灰階
		},
		motors_blocks: {
			colourPrimary: '#AB47BC', // 馬達積木主色
			colourSecondary: '#B356C7',
			colourTertiary: '#C266D4',
		},
		communication_blocks: {
			colourPrimary: '#5C9AD2', // 通訊積木主色
			colourSecondary: '#6BA3D8',
			colourTertiary: '#7AACDE',
		},
	},
	categoryStyles: {
		logic_category: { colour: '#5C7D8A' },
		loop_category: { colour: '#8B6B61' },
		math_category: { colour: '#4F9A52' },
		text_category: { colour: '#D67600' },
		list_category: { colour: '#D44D78' },
		variable_category: { colour: '#3A9991' },
		procedure_category: { colour: '#5A68A9' },
		arduino_category: { colour: '#00767A' },
		sensor_category: { colour: '#8A95A8' },
		motors_category: { colour: '#AB47BC' },
		communication_category: { colour: '#4A85B8' },
	},
	fontStyle: {
		family: 'Inter, system-ui, -apple-system, sans-serif',
		weight: 'normal',
		size: 13,
	},
	startHats: false,
});

// 導出主題
if (typeof module !== 'undefined' && module.exports) {
	module.exports = singularDarkTheme;
} else {
	window.SingularBlocklyDarkTheme = singularDarkTheme;
}
