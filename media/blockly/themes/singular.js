/**
 * @license
 * Copyright 2024 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Singular theme configuration
 */
const singularTheme = Blockly.Theme.defineTheme('singular', {
	base: Blockly.Themes.Modern,
	componentStyles: {
		workspaceBackgroundColour: '#F5F5F5', // 溫暖的淺灰色背景
		toolboxBackgroundColour: '#EEEEEE', // 更柔和的工具箱背景
		toolboxForegroundColour: '#424242', // 柔和的深灰色文字
		flyoutBackgroundColour: '#E8E8E8', // 淺灰色彈出背景
		flyoutForegroundColour: '#424242',
		flyoutOpacity: 0.95,
		scrollbarColour: '#BDBDBD',
		insertionMarkerColour: '#FF8A65', // 溫暖的珊瑚色標記
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
	},
	categoryStyles: {
		logic_category: { colour: '#78909C' },
		loop_category: { colour: '#A1887F' },
		math_category: { colour: '#66BB6A' },
		text_category: { colour: '#FB8C00' }, // 對應更新類別顏色
		list_category: { colour: '#F06292' },
		variable_category: { colour: '#4DB6AC' },
		procedure_category: { colour: '#7986CB' },
		arduino_category: { colour: '#00979C' }, // Arduino 標準藍色
		sensor_category: { colour: '#8A95A8' },
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
	module.exports = singularTheme;
} else {
	window.SingularBlocklyTheme = singularTheme;
}
