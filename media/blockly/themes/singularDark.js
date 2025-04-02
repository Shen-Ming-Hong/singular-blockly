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
			colourPrimary: '#5C7D8A', // 暗藍色
			colourSecondary: '#506A75', // 更深色
			colourTertiary: '#445A63', // 深色陰影
		},
		loop_blocks: {
			colourPrimary: '#8B6B61', // 暗褐色
			colourSecondary: '#775C54',
			colourTertiary: '#664D47',
		},
		math_blocks: {
			colourPrimary: '#4F9A52', // 深綠色
			colourSecondary: '#428445',
			colourTertiary: '#377038',
		},
		text_blocks: {
			colourPrimary: '#D67600', // 深橙色
			colourSecondary: '#B76400',
			colourTertiary: '#9B5500',
		},
		list_blocks: {
			colourPrimary: '#D44D78', // 深粉色
			colourSecondary: '#B54166',
			colourTertiary: '#993655',
		},
		variable_blocks: {
			colourPrimary: '#3A9991', // 深青色
			colourSecondary: '#31837C',
			colourTertiary: '#296F69',
		},
		procedure_blocks: {
			colourPrimary: '#5A68A9', // 深靛藍色
			colourSecondary: '#4D5991',
			colourTertiary: '#414C7B',
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
		arduino_category: { colour: '#00767A' }, // 較深的 Arduino 藍色
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
