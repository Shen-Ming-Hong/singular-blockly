/**
 * @license
 * Copyright 2025 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

(function (root, factory) {
	const api = factory();
	if (typeof module === 'object' && module.exports) {
		module.exports = api;
	}
	root.txtVirtualControlsContrast = api;
})(typeof window !== 'undefined' ? window : globalThis, function () {
	'use strict';

	const TEXT_CONTRAST_THRESHOLD = 4.5;
	const BOUNDARY_CONTRAST_THRESHOLD = 3;
	const FALLBACK_SURFACE = '#ffffff';
	const DEFAULT_BUTTON_STYLES = Object.freeze({
		light: Object.freeze({
			backgroundColor: '#005a9e',
			textColor: '#ffffff',
		}),
		dark: Object.freeze({
			backgroundColor: '#ffca28',
			textColor: '#1f1f1f',
		}),
	});

	function clampChannel(value) {
		return Math.max(0, Math.min(255, Math.round(value)));
	}

	function parseHexColor(value) {
		const raw = String(value || '').trim();
		const match = raw.match(/^#([0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})$/i);
		if (!match) {
			return null;
		}

		const hex = match[1];
		if (hex.length === 3 || hex.length === 4) {
			const r = parseInt(hex[0] + hex[0], 16);
			const g = parseInt(hex[1] + hex[1], 16);
			const b = parseInt(hex[2] + hex[2], 16);
			const a = hex.length === 4 ? parseInt(hex[3] + hex[3], 16) / 255 : 1;
			return { r, g, b, a };
		}

		const r = parseInt(hex.slice(0, 2), 16);
		const g = parseInt(hex.slice(2, 4), 16);
		const b = parseInt(hex.slice(4, 6), 16);
		const a = hex.length === 8 ? parseInt(hex.slice(6, 8), 16) / 255 : 1;
		return { r, g, b, a };
	}

	function parseRgbChannel(value) {
		const raw = String(value || '').trim();
		if (raw.endsWith('%')) {
			const percentage = Number.parseFloat(raw.slice(0, -1));
			return Number.isFinite(percentage) ? clampChannel((percentage / 100) * 255) : NaN;
		}
		const channel = Number.parseFloat(raw);
		return Number.isFinite(channel) ? clampChannel(channel) : NaN;
	}

	function parseAlpha(value) {
		const raw = String(value || '').trim();
		if (!raw) {
			return 1;
		}
		if (raw.endsWith('%')) {
			const percentage = Number.parseFloat(raw.slice(0, -1));
			return Number.isFinite(percentage) ? Math.max(0, Math.min(1, percentage / 100)) : NaN;
		}
		const alpha = Number.parseFloat(raw);
		return Number.isFinite(alpha) ? Math.max(0, Math.min(1, alpha)) : NaN;
	}

	function parseRgbColor(value) {
		const raw = String(value || '').trim();
		const match = raw.match(/^rgba?\((.*)\)$/i);
		if (!match) {
			return null;
		}

		const normalized = match[1].replace(/\s*\/\s*/g, ',').replace(/\s+/g, ',');
		const parts = normalized.split(',').map(part => part.trim()).filter(Boolean);
		if (parts.length < 3) {
			return null;
		}

		const r = parseRgbChannel(parts[0]);
		const g = parseRgbChannel(parts[1]);
		const b = parseRgbChannel(parts[2]);
		const a = parts.length > 3 ? parseAlpha(parts[3]) : 1;
		if (![r, g, b, a].every(Number.isFinite)) {
			return null;
		}
		return { r, g, b, a };
	}

	function parseColor(value) {
		if (!value || typeof value !== 'string') {
			return null;
		}

		const trimmed = value.trim();
		if (!trimmed || trimmed === 'transparent') {
			return null;
		}
		return parseHexColor(trimmed) || parseRgbColor(trimmed);
	}

	function toHexChannel(value) {
		return clampChannel(value).toString(16).padStart(2, '0');
	}

	function toHexColor(colorInput) {
		const parsed = typeof colorInput === 'string' ? parseColor(colorInput) : colorInput;
		const color = normalizeOpaqueColor(parsed);
		if (!color) {
			return null;
		}
		return `#${toHexChannel(color.r)}${toHexChannel(color.g)}${toHexChannel(color.b)}`;
	}

	function normalizeHexColor(value, fallback) {
		return toHexColor(value) || toHexColor(fallback) || '#000000';
	}

	function compositeOver(color, backdrop) {
		const alpha = Number.isFinite(color?.a) ? color.a : 1;
		if (alpha >= 1) {
			return { r: color.r, g: color.g, b: color.b, a: 1 };
		}
		const base = backdrop || parseColor(FALLBACK_SURFACE);
		return {
			r: clampChannel(color.r * alpha + base.r * (1 - alpha)),
			g: clampChannel(color.g * alpha + base.g * (1 - alpha)),
			b: clampChannel(color.b * alpha + base.b * (1 - alpha)),
			a: 1,
		};
	}

	function normalizeOpaqueColor(color, backdrop) {
		if (!color) {
			return null;
		}
		return compositeOver(color, backdrop);
	}

	function linearizeChannel(channel) {
		const normalized = channel / 255;
		return normalized <= 0.03928 ? normalized / 12.92 : Math.pow((normalized + 0.055) / 1.055, 2.4);
	}

	function relativeLuminance(colorInput) {
		const parsed = typeof colorInput === 'string' ? parseColor(colorInput) : colorInput;
		const color = normalizeOpaqueColor(parsed);
		if (!color) {
			return null;
		}
		return 0.2126 * linearizeChannel(color.r) + 0.7152 * linearizeChannel(color.g) + 0.0722 * linearizeChannel(color.b);
	}

	function contrastRatio(colorAInput, colorBInput) {
		const colorA = typeof colorAInput === 'string' ? parseColor(colorAInput) : colorAInput;
		const colorB = typeof colorBInput === 'string' ? parseColor(colorBInput) : colorBInput;
		if (!colorA || !colorB) {
			return null;
		}

		const opaqueB = normalizeOpaqueColor(colorB);
		const opaqueA = normalizeOpaqueColor(colorA, opaqueB);
		const luminanceA = relativeLuminance(opaqueA);
		const luminanceB = relativeLuminance(opaqueB);
		if (luminanceA === null || luminanceB === null) {
			return null;
		}

		const lighter = Math.max(luminanceA, luminanceB);
		const darker = Math.min(luminanceA, luminanceB);
		return (lighter + 0.05) / (darker + 0.05);
	}

	function getReadableTextColor(backgroundColor) {
		const darkText = '#1f1f1f';
		const lightText = '#ffffff';
		const darkContrast = contrastRatio(darkText, backgroundColor) || 0;
		const lightContrast = contrastRatio(lightText, backgroundColor) || 0;
		return darkContrast >= lightContrast ? darkText : lightText;
	}

	function normalizeThemeMode(theme) {
		return theme === 'dark' ? 'dark' : 'light';
	}

	function getDefaultButtonStyle(theme) {
		const mode = normalizeThemeMode(theme);
		const style = DEFAULT_BUTTON_STYLES[mode] || DEFAULT_BUTTON_STYLES.light;
		return {
			backgroundColor: style.backgroundColor,
			textColor: getReadableTextColor(style.backgroundColor) || style.textColor,
		};
	}

	function normalizeButtonStyleRecord(style, fallback) {
		const base = fallback || getDefaultButtonStyle('light');
		const backgroundColor = normalizeHexColor(style?.backgroundColor, base.backgroundColor);
		const textColor = normalizeHexColor(style?.textColor, base.textColor || getReadableTextColor(backgroundColor));
		return {
			backgroundColor,
			textColor,
		};
	}

	function getEffectiveButtonStyle(style, theme) {
		const mode = normalizeThemeMode(theme);
		const fallback = getDefaultButtonStyle(mode);
		const themeStyles = style && typeof style === 'object' && style.themeStyles && typeof style.themeStyles === 'object'
			? style.themeStyles
			: null;
		const themeStyle = themeStyles?.[mode];

		if (themeStyle && typeof themeStyle === 'object' && themeStyle.customized !== false) {
			return normalizeButtonStyleRecord(themeStyle, fallback);
		}

		return fallback;
	}

	function roundRatio(value) {
		return value === null ? undefined : Math.round(value * 100) / 100;
	}

	function classifyContrastRisk(options) {
		const textThreshold = Number.isFinite(options?.textThreshold) ? options.textThreshold : TEXT_CONTRAST_THRESHOLD;
		const boundaryThreshold = Number.isFinite(options?.boundaryThreshold)
			? options.boundaryThreshold
			: BOUNDARY_CONTRAST_THRESHOLD;
		const textContrast = contrastRatio(options?.textColor, options?.backgroundColor);
		const boundaryContrast = contrastRatio(options?.backgroundColor, options?.surfaceColor || FALLBACK_SURFACE);
		const riskTypes = [];

		if (textContrast !== null && textContrast < textThreshold) {
			riskTypes.push('text-readability');
		}
		if (boundaryContrast !== null && boundaryContrast < boundaryThreshold) {
			riskTypes.push('button-boundary');
		}

		return {
			riskTypes,
			textContrastRatio: roundRatio(textContrast),
			boundaryContrastRatio: roundRatio(boundaryContrast),
		};
	}

	function getComputedColor(element, propertyName, fallback = '') {
		try {
			if (!element || typeof getComputedStyle !== 'function') {
				return fallback;
			}
			const styles = getComputedStyle(element);
			const value = propertyName.startsWith('--') ? styles.getPropertyValue(propertyName) : styles[propertyName];
			return value && String(value).trim() ? String(value).trim() : fallback;
		} catch (_error) {
			return fallback;
		}
	}

	function getTxtVirtualControlSurfaceColors(options = {}) {
		const canvas = options.canvas || null;
		const panel = options.panel || null;
		return {
			canvasSurfaceColor: getComputedColor(canvas, '--txt-virtual-controls-canvas-surface', options.canvasFallback || '#f8f8f8'),
			panelSurfaceColor: getComputedColor(panel, '--txt-virtual-controls-panel-bg', options.panelFallback || FALLBACK_SURFACE),
			warningSurfaceColor: getComputedColor(
				panel || canvas,
				'--txt-virtual-controls-warning-bg',
				options.warningFallback || 'rgba(245, 166, 35, 0.16)'
			),
		};
	}

	function getThemeMode(body) {
		const classList = body?.classList;
		if (classList?.contains('vscode-high-contrast')) {
			return 'high-contrast';
		}
		if (classList?.contains('theme-dark') || classList?.contains('vscode-dark')) {
			return 'dark';
		}
		return 'light';
	}

	return {
		TEXT_CONTRAST_THRESHOLD,
		BOUNDARY_CONTRAST_THRESHOLD,
		parseColor,
		toHexColor,
		normalizeHexColor,
		relativeLuminance,
		contrastRatio,
		getReadableTextColor,
		normalizeThemeMode,
		getDefaultButtonStyle,
		getEffectiveButtonStyle,
		classifyContrastRisk,
		getComputedColor,
		getTxtVirtualControlSurfaceColors,
		getThemeMode,
	};
});
