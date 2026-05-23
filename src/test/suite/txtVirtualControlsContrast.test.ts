/**
 * @license
 * Copyright 2025 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import * as assert from 'assert';
import * as path from 'path';

interface ParsedColor {
	r: number;
	g: number;
	b: number;
	a: number;
}

interface TxtVirtualControlsContrastApi {
	parseColor(value: string): ParsedColor | null;
	normalizeHexColor(value: string, fallback: string): string;
	relativeLuminance(value: string | ParsedColor): number | null;
	contrastRatio(first: string | ParsedColor, second: string | ParsedColor): number | null;
	getReadableTextColor(backgroundColor: string): string;
	normalizeThemeMode(theme?: string): 'light' | 'dark';
	getDefaultButtonStyle(theme?: string): { backgroundColor: string; textColor: string };
	getEffectiveButtonStyle(
		style: {
			themeStyles?: Partial<Record<'light' | 'dark', { backgroundColor: string; textColor: string; customized?: boolean }>>;
		},
		theme?: string
	): { backgroundColor: string; textColor: string };
}

suite('TXT Virtual Controls Contrast Helper Tests', () => {
	const PROJECT_ROOT = path.join(__dirname, '..', '..', '..');
	const helperPath = path.join(PROJECT_ROOT, 'media', 'js', 'txtVirtualControlsContrast.js');
	const contrast = require(helperPath) as TxtVirtualControlsContrastApi;

	test('parseColor should support hex and rgb values without DOM', () => {
		assert.deepStrictEqual(contrast.parseColor('#fff'), { r: 255, g: 255, b: 255, a: 1 });
		assert.deepStrictEqual(contrast.parseColor('#005a9e'), { r: 0, g: 90, b: 158, a: 1 });
		assert.deepStrictEqual(contrast.parseColor('rgb(245, 245, 245)'), { r: 245, g: 245, b: 245, a: 1 });
		assert.deepStrictEqual(contrast.parseColor('rgba(0, 0, 0, 0.5)'), { r: 0, g: 0, b: 0, a: 0.5 });
		assert.strictEqual(contrast.parseColor('not-a-color'), null);
	});

	test('normalizeHexColor should convert supported colors to color-input friendly hex values', () => {
		assert.strictEqual(contrast.normalizeHexColor('#fff', '#000000'), '#ffffff');
		assert.strictEqual(contrast.normalizeHexColor('rgb(255, 202, 40)', '#000000'), '#ffca28');
		assert.strictEqual(contrast.normalizeHexColor('not-a-color', '#005a9e'), '#005a9e');
	});

	test('relativeLuminance should produce deterministic WCAG luminance values', () => {
		assert.strictEqual(contrast.relativeLuminance('#000000'), 0);
		assert.strictEqual(contrast.relativeLuminance('#ffffff'), 1);
		const blueLuminance = contrast.relativeLuminance('#005a9e');
		assert.ok(blueLuminance !== null && blueLuminance > 0 && blueLuminance < 1);
	});

	test('contrastRatio should calculate WCAG contrast ratio', () => {
		const blackWhite = contrast.contrastRatio('#000000', '#ffffff');
		if (blackWhite === null) {
			assert.fail('black and white contrast ratio should be calculable');
		}
		assert.ok(Math.abs(blackWhite - 21) < 0.01);

		const sameColor = contrast.contrastRatio('#ffffff', '#ffffff');
		assert.strictEqual(sameColor, 1);
	});

	test('getReadableTextColor should choose the higher contrast text color', () => {
		assert.strictEqual(contrast.getReadableTextColor('#ffffff'), '#1f1f1f');
		assert.strictEqual(contrast.getReadableTextColor('#005a9e'), '#ffffff');
		assert.strictEqual(contrast.getReadableTextColor('#ffca28'), '#1f1f1f');
	});

	test('getDefaultButtonStyle should provide distinct accessible light and dark base colors', () => {
		const lightStyle = contrast.getDefaultButtonStyle('light');
		const darkStyle = contrast.getDefaultButtonStyle('dark');

		assert.deepStrictEqual(lightStyle, { backgroundColor: '#005a9e', textColor: '#ffffff' });
		assert.deepStrictEqual(darkStyle, { backgroundColor: '#ffca28', textColor: '#1f1f1f' });
		assert.notDeepStrictEqual(lightStyle, darkStyle);
		assert.ok((contrast.contrastRatio(lightStyle.textColor, lightStyle.backgroundColor) || 0) >= 4.5);
		assert.ok((contrast.contrastRatio(darkStyle.textColor, darkStyle.backgroundColor) || 0) >= 4.5);
	});

	test('getEffectiveButtonStyle should keep manual colors per theme and use defaults when a theme has no record', () => {
		const style = {
			themeStyles: {
				light: { backgroundColor: '#f57c00', textColor: '#1f1f1f', customized: true },
			},
		};

		assert.deepStrictEqual(contrast.getEffectiveButtonStyle(style, 'light'), {
			backgroundColor: '#f57c00',
			textColor: '#1f1f1f',
		});
		assert.deepStrictEqual(contrast.getEffectiveButtonStyle(style, 'dark'), {
			backgroundColor: '#ffca28',
			textColor: '#1f1f1f',
		});
	});
});
