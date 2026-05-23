/**
 * @license
 * Copyright 2025 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

const vscode = acquireVsCodeApi();
let workspace;
let isLanguageSwitchReloading = false;
let pendingLanguageReloadTimer = null;

// 日誌系統
const log = {
	/**
	 * 輸出偵錯等級的日誌
	 * @param {string} message - 主要訊息
	 * @param {...any} args - 額外參數，會被轉換為字串或JSON
	 */
	debug: function (message, ...args) {
		console.debug(message, ...args); // 保留在開發者工具中顯示（偵錯使用）

		// 格式化額外參數
		const formattedArgs = args.map(arg => (typeof arg === 'object' ? JSON.stringify(arg) : String(arg)));

		vscode.postMessage({
			command: 'log',
			source: 'blocklyPreview',
			level: 'debug',
			message: message,
			args: formattedArgs,
			timestamp: new Date().toISOString(),
		});
	},

	/**
	 * 輸出一般資訊等級的日誌
	 * @param {string} message - 主要訊息
	 * @param {...any} args - 額外參數，會被轉換為字串或JSON
	 */
	info: function (message, ...args) {
		console.log(message, ...args); // 保留在開發者工具中顯示（偵錯使用）

		// 格式化額外參數
		const formattedArgs = args.map(arg => (typeof arg === 'object' ? JSON.stringify(arg) : String(arg)));

		vscode.postMessage({
			command: 'log',
			source: 'blocklyPreview',
			level: 'info',
			message: message,
			args: formattedArgs,
			timestamp: new Date().toISOString(),
		});
	},

	/**
	 * 輸出警告等級的日誌
	 * @param {string} message - 主要訊息
	 * @param {...any} args - 額外參數，會被轉換為字串或JSON
	 */
	warn: function (message, ...args) {
		console.warn(message, ...args); // 保留在開發者工具中顯示（偵錯使用）

		// 格式化額外參數
		const formattedArgs = args.map(arg => (typeof arg === 'object' ? JSON.stringify(arg) : String(arg)));

		vscode.postMessage({
			command: 'log',
			source: 'blocklyPreview',
			level: 'warn',
			message: message,
			args: formattedArgs,
			timestamp: new Date().toISOString(),
		});
	},

	/**
	 * 輸出錯誤等級的日誌
	 * @param {string} message - 主要訊息
	 * @param {...any} args - 額外參數，會被轉換為字串或JSON
	 */
	error: function (message, ...args) {
		console.error(message, ...args); // 保留在開發者工具中顯示（偵錯使用）

		// 格式化額外參數
		const formattedArgs = args.map(arg => (typeof arg === 'object' ? JSON.stringify(arg) : String(arg)));

		vscode.postMessage({
			command: 'log',
			source: 'blocklyPreview',
			level: 'error',
			message: message,
			args: formattedArgs,
			timestamp: new Date().toISOString(),
		});
	},
};

// 儲存當前主題設定
let currentTheme = window.initialTheme || 'light';
let currentPreviewBoard = 'uno';

const TXT_PREVIEW_PANEL_DEFAULT_WIDTH = 340;
const TXT_PREVIEW_PANEL_MIN_WIDTH = 280;
const TXT_PREVIEW_PANEL_MAX_WIDTH = 560;
const TXT_PREVIEW_MIN_BLOCKLY_WIDTH = 360;
const TXT_PREVIEW_SPLITTER_WIDTH = 10;
const TXT_PREVIEW_TOOLBAR_GAP = 12;
const TXT_PREVIEW_MIN_BUTTON_WIDTH = 72;
const TXT_PREVIEW_MIN_BUTTON_HEIGHT = 40;
const TXT_PREVIEW_DEFAULT_BUTTON_STYLE = {
	backgroundColor: '#005a9e',
	textColor: '#ffffff',
};
const TXT_PREVIEW_DEFAULT_BUTTON_STYLES = {
	light: TXT_PREVIEW_DEFAULT_BUTTON_STYLE,
	dark: {
		backgroundColor: '#ffca28',
		textColor: '#1f1f1f',
	},
};

const txtPreviewState = {
	document: createEmptyTxtPreviewControlsDocument(),
	previewWarnings: [],
	panelOpen: false,
	panelWidth: TXT_PREVIEW_PANEL_DEFAULT_WIDTH,
	panelResize: null,
	readonlyGuardsInitialized: false,
};

/**
 * 更新介面文字的多國語言支援
 */
function updateUITexts() {
	// 獲取需要更新的元素
	const previewBadge = document.getElementById('previewBadge');
	const themeToggle = document.getElementById('themeToggle');
	const pageTitle = document.getElementById('pageTitle');

	// 使用語言管理器取得翻譯文字
	if (window.languageManager) {
		if (previewBadge) {
			previewBadge.textContent = window.languageManager.getMessage('PREVIEW_BADGE', '預覽');
		}

		if (themeToggle) {
			themeToggle.setAttribute('title', window.languageManager.getMessage('THEME_TOGGLE', '切換主題'));
		}

		// 更新視窗標題
		if (pageTitle) {
			const titleTemplate = window.languageManager.getMessage('PREVIEW_WINDOW_TITLE', 'Blockly 預覽 - {0}');
			const fileName = window.previewFileName || '';
			const title = titleTemplate.replace('{0}', fileName);
			document.title = title; // 更新瀏覽器頁籤標題
		}
		// 更新頁面內的預覽標題
		{
			const inPageTemplate = window.languageManager.getMessage('PREVIEW_WINDOW_TITLE', 'Blockly 預覽 - {0}');
			const inPageText = inPageTemplate.replace('{0}', window.previewFileName || '');
			const previewTitleEl = document.querySelector('.preview-title');
			if (previewTitleEl) {
				const badgeText = previewBadge ? previewBadge.textContent : '';
				// 修復 XSS 漏洞: 使用 textContent 設定文字,再透過 DOM 操作添加 badge 元素
				// 避免使用 innerHTML 直接插入未轉義的內容
				previewTitleEl.textContent = inPageText + ' ';
				const badgeEl = document.createElement('span');
				badgeEl.className = 'preview-badge';
				badgeEl.id = 'previewBadge';
				badgeEl.textContent = badgeText;
				previewTitleEl.appendChild(badgeEl);
			}
		}

		updateTxtPreviewTexts();
	}
}

function formatTxtPreviewMessage(key, fallback, ...args) {
	let message = window.languageManager?.getMessage(key, fallback) || fallback;
	args.forEach((arg, index) => {
		message = message.replace(new RegExp(`\\{${index}\\}`, 'g'), String(arg));
	});
	return message;
}

function createEmptyTxtPreviewControlsDocument() {
	return {
		schemaVersion: 1,
		canvas: { mode: 'editing' },
		controls: [],
	};
}

function getTxtPreviewElements() {
	return {
		container: document.querySelector('.container'),
		blocklyArea: document.getElementById('blocklyArea'),
		splitter: document.getElementById('txtVirtualControlsSplitter'),
		panel: document.getElementById('txtVirtualControlsPanel'),
		title: document.getElementById('txtVirtualControlsPanelTitle'),
		modeBadge: document.getElementById('txtVirtualControlsModeBadge'),
		canvasHint: document.getElementById('txtVirtualControlsCanvasHint'),
		warningList: document.getElementById('txtVirtualControlsWarningList'),
		emptyState: document.getElementById('txtVirtualControlsEmptyState'),
		canvas: document.getElementById('txtVirtualControlsCanvas'),
	};
}

function sanitizePreviewNumber(value, fallback) {
	return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function sanitizePreviewString(value, fallback = '') {
	return typeof value === 'string' ? value : fallback;
}

function sanitizePreviewColor(value, fallback) {
	const color = sanitizePreviewString(value, fallback).trim();
	return /^#(?:[0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(color) ? color : fallback;
}

function getTxtPreviewStyleApi() {
	return window.txtVirtualControlsContrast || null;
}

function getTxtPreviewThemeMode(theme = currentTheme) {
	const styleApi = getTxtPreviewStyleApi();
	if (styleApi && typeof styleApi.normalizeThemeMode === 'function') {
		return styleApi.normalizeThemeMode(theme);
	}
	return theme === 'dark' ? 'dark' : 'light';
}

function getTxtPreviewDefaultButtonStyle(theme = currentTheme) {
	const styleApi = getTxtPreviewStyleApi();
	if (styleApi && typeof styleApi.getDefaultButtonStyle === 'function') {
		return styleApi.getDefaultButtonStyle(theme);
	}
	const mode = getTxtPreviewThemeMode(theme);
	return { ...(TXT_PREVIEW_DEFAULT_BUTTON_STYLES[mode] || TXT_PREVIEW_DEFAULT_BUTTON_STYLE) };
}

function sanitizePreviewThemeColor(value, fallback) {
	const styleApi = getTxtPreviewStyleApi();
	if (styleApi && typeof styleApi.normalizeHexColor === 'function') {
		return styleApi.normalizeHexColor(value, fallback);
	}
	return sanitizePreviewColor(value, fallback);
}

function normalizeTxtPreviewThemeStyle(value, theme) {
	if (!value || typeof value !== 'object') {
		return null;
	}

	const fallback = getTxtPreviewDefaultButtonStyle(theme);
	return {
		backgroundColor: sanitizePreviewThemeColor(value.backgroundColor, fallback.backgroundColor),
		textColor: sanitizePreviewThemeColor(value.textColor, fallback.textColor),
		customized: value.customized !== false,
	};
}

function normalizeTxtPreviewThemeStyles(style, legacyStyle) {
	const rawThemeStyles = style && typeof style === 'object' && style.themeStyles && typeof style.themeStyles === 'object'
		? style.themeStyles
		: null;
	const themeStyles = {};

	if (rawThemeStyles) {
		['light', 'dark'].forEach(theme => {
			const normalized = normalizeTxtPreviewThemeStyle(rawThemeStyles[theme], theme);
			if (normalized) {
				themeStyles[theme] = normalized;
			}
		});
		return themeStyles;
	}

	const lightDefault = getTxtPreviewDefaultButtonStyle('light');
	const isLegacyCustomized =
		legacyStyle.backgroundColor !== lightDefault.backgroundColor || legacyStyle.textColor !== lightDefault.textColor;
	if (isLegacyCustomized) {
		themeStyles[getTxtPreviewThemeMode(currentTheme)] = {
			...legacyStyle,
			customized: true,
		};
	}

	return themeStyles;
}

function getTxtPreviewEffectiveButtonStyle(style, theme = currentTheme) {
	const styleApi = getTxtPreviewStyleApi();
	if (styleApi && typeof styleApi.getEffectiveButtonStyle === 'function') {
		return styleApi.getEffectiveButtonStyle(style, theme);
	}

	const mode = getTxtPreviewThemeMode(theme);
	const fallback = getTxtPreviewDefaultButtonStyle(mode);
	return normalizeTxtPreviewThemeStyle(style?.themeStyles?.[mode], mode) || fallback;
}

function normalizeTxtPreviewButtonStyle(style) {
	const rawStyle = style && typeof style === 'object' ? style : {};
	const lightDefault = getTxtPreviewDefaultButtonStyle('light');
	const legacyStyle = {
		backgroundColor: sanitizePreviewThemeColor(rawStyle.backgroundColor, lightDefault.backgroundColor),
		textColor: sanitizePreviewThemeColor(rawStyle.textColor, lightDefault.textColor),
	};
	const themeStyles = normalizeTxtPreviewThemeStyles(rawStyle, legacyStyle);
	const effectiveStyle = getTxtPreviewEffectiveButtonStyle({ ...legacyStyle, themeStyles }, currentTheme);

	return {
		...effectiveStyle,
		themeStyles,
	};
}

function normalizeTxtPreviewControlsDocument(document) {
	if (!document || typeof document !== 'object') {
		return createEmptyTxtPreviewControlsDocument();
	}

	const controlsInput = Array.isArray(document.controls) ? document.controls : [];
	return {
		schemaVersion: 1,
		canvas: { mode: 'editing' },
		controls: controlsInput
			.map(control => {
				if (!control || typeof control !== 'object') {
					return null;
				}

				const stableId = sanitizePreviewString(control.stableId).trim();
				if (!stableId) {
					return null;
				}

				const displayName = sanitizePreviewString(control.displayName, stableId).trim() || stableId;
				const identifier = sanitizePreviewString(control.identifier, stableId).trim() || stableId;
				const position = control.position || {};
				const size = control.size || {};
				const style = control.style || {};

				return {
					stableId,
					displayName,
					identifier,
					kind: 'button',
					position: {
						x: Math.max(0, sanitizePreviewNumber(position.x, 24)),
						y: Math.max(0, sanitizePreviewNumber(position.y, 24)),
					},
					size: {
						width: Math.max(TXT_PREVIEW_MIN_BUTTON_WIDTH, sanitizePreviewNumber(size.width, 120)),
						height: Math.max(TXT_PREVIEW_MIN_BUTTON_HEIGHT, sanitizePreviewNumber(size.height, 48)),
					},
					style: normalizeTxtPreviewButtonStyle(style),
				};
			})
			.filter(Boolean),
	};
}

function scheduleTxtPreviewBlocklyResize() {
	requestAnimationFrame(() => {
		if (workspace) {
			Blockly.svgResize(workspace);
		}
	});
}

function clampTxtPreviewPanelWidth(nextWidth, containerWidth = window.innerWidth) {
	const numericWidth = Number.isFinite(nextWidth) ? nextWidth : TXT_PREVIEW_PANEL_DEFAULT_WIDTH;
	const maxWidth = Math.max(
		TXT_PREVIEW_PANEL_MIN_WIDTH,
		Math.min(
			TXT_PREVIEW_PANEL_MAX_WIDTH,
			(containerWidth || window.innerWidth) - TXT_PREVIEW_MIN_BLOCKLY_WIDTH - TXT_PREVIEW_SPLITTER_WIDTH - 24
		)
	);
	return Math.max(TXT_PREVIEW_PANEL_MIN_WIDTH, Math.min(maxWidth, Math.round(numericWidth)));
}

function applyTxtPreviewPanelLayout() {
	const elements = getTxtPreviewElements();
	if (!elements.container) {
		return;
	}

	if (txtPreviewState.panelOpen) {
		txtPreviewState.panelWidth = clampTxtPreviewPanelWidth(txtPreviewState.panelWidth, elements.container.clientWidth);
	}

	const openWidth = txtPreviewState.panelOpen ? txtPreviewState.panelWidth : 0;
	elements.container.style.setProperty('--txt-virtual-controls-panel-width', `${openWidth}px`);
	elements.container.style.setProperty(
		'--txt-virtual-controls-toolbar-offset',
		txtPreviewState.panelOpen ? `${openWidth + TXT_PREVIEW_SPLITTER_WIDTH + TXT_PREVIEW_TOOLBAR_GAP}px` : '0px'
	);

	if (elements.panel) {
		elements.panel.classList.toggle('open', txtPreviewState.panelOpen);
	}
	if (elements.splitter) {
		elements.splitter.classList.toggle('open', txtPreviewState.panelOpen);
	}
}

function setTxtPreviewPanelVisible(isVisible) {
	const elements = getTxtPreviewElements();
	txtPreviewState.panelOpen = Boolean(isVisible);

	for (const element of [elements.panel, elements.splitter]) {
		if (!element) {
			continue;
		}
		element.hidden = !txtPreviewState.panelOpen;
		element.setAttribute('aria-hidden', txtPreviewState.panelOpen ? 'false' : 'true');
	}

	if (elements.panel) {
		if (txtPreviewState.panelOpen) {
			elements.panel.removeAttribute('inert');
			elements.panel.inert = false;
		} else {
			elements.panel.setAttribute('inert', '');
			elements.panel.inert = true;
		}
	}

	applyTxtPreviewPanelLayout();
	scheduleTxtPreviewBlocklyResize();
}

function updateTxtPreviewTexts() {
	const elements = getTxtPreviewElements();
	if (!elements.panel) {
		return;
	}

	if (elements.title) {
		elements.title.textContent = formatTxtPreviewMessage('TXT_VIRTUAL_CONTROLS_TITLE', 'TXT Virtual Controls');
	}
	if (elements.modeBadge) {
		elements.modeBadge.textContent = formatTxtPreviewMessage('TXT_PREVIEW_READONLY_BADGE', 'Preview only');
	}
	if (elements.canvasHint) {
		elements.canvasHint.textContent = formatTxtPreviewMessage(
			'TXT_PREVIEW_READONLY_HINT',
			'Preview only. You can scroll this canvas and resize the preview panels, but buttons cannot be edited or pressed.'
		);
	}
	if (elements.emptyState) {
		elements.emptyState.textContent = formatTxtPreviewMessage('TXT_PREVIEW_EMPTY_STATE', 'No TXT virtual buttons are stored in this backup.');
	}
	if (elements.splitter) {
		elements.splitter.setAttribute(
			'aria-label',
			formatTxtPreviewMessage('TXT_PREVIEW_SPLITTER_LABEL', 'Resize Blockly preview and TXT virtual controls preview')
		);
	}
	if (elements.warningList) {
		elements.warningList.setAttribute('aria-label', formatTxtPreviewMessage('TXT_PREVIEW_WARNING_LIST_LABEL', 'TXT preview warnings'));
	}

	renderTxtPreviewWarnings();
}

function getTxtPreviewWarningText(warning) {
	const fallbackText = warning?.fallbackText ? ` (${warning.fallbackText})` : '';
	switch (warning?.code) {
		case 'legacy-missing-document':
			return formatTxtPreviewMessage(
				'TXT_PREVIEW_WARNING_LEGACY_MISSING_DOCUMENT',
				'This older backup has no TXT virtual controls data yet.'
			);
		case 'empty-controls':
			return formatTxtPreviewMessage('TXT_PREVIEW_WARNING_EMPTY_CONTROLS', 'This backup has no TXT virtual buttons.');
		case 'invalid-control-shape':
			return formatTxtPreviewMessage(
				'TXT_PREVIEW_WARNING_INVALID_CONTROL_SHAPE',
				'Some virtual button data was incomplete; recoverable values are shown with safe defaults.'
			) + fallbackText;
		case 'missing-control-reference':
			return formatTxtPreviewMessage(
				'TXT_PREVIEW_WARNING_MISSING_CONTROL_REFERENCE',
				'A Blockly block references a virtual button that is missing from this backup.'
			) + fallbackText;
		default:
			return formatTxtPreviewMessage('TXT_PREVIEW_WARNING_GENERIC', 'TXT preview data was partially recovered.') + fallbackText;
	}
}

function renderTxtPreviewWarnings() {
	const elements = getTxtPreviewElements();
	if (!elements.warningList) {
		return;
	}

	elements.warningList.replaceChildren();
	const warnings = Array.isArray(txtPreviewState.previewWarnings) ? txtPreviewState.previewWarnings : [];
	elements.warningList.classList.toggle('hidden', warnings.length === 0);

	warnings.forEach(warning => {
		const item = document.createElement('li');
		item.className = `txt-preview-warning-item ${warning?.severity === 'info' ? 'info' : 'warning'}`;
		item.textContent = getTxtPreviewWarningText(warning);
		elements.warningList.appendChild(item);
	});
}

function getRecoveredControlIds() {
	return new Set(
		(txtPreviewState.previewWarnings || [])
			.filter(warning => warning?.code === 'invalid-control-shape' && warning.stableId)
			.map(warning => warning.stableId)
	);
}

function preventTxtPreviewEdit(event) {
	event.preventDefault();
	event.stopPropagation();
}

function handleTxtPreviewReadonlyGuard(event) {
	const target = event.target;
	if (target && typeof target.closest === 'function' && target.closest('.txt-virtual-control-button')) {
		preventTxtPreviewEdit(event);
	}
}

function initTxtPreviewReadonlyGuards() {
	if (txtPreviewState.readonlyGuardsInitialized) {
		return;
	}

	const elements = getTxtPreviewElements();
	if (!elements.canvas) {
		return;
	}

	['pointerdown', 'click', 'dblclick', 'contextmenu', 'keydown', 'dragstart'].forEach(eventName => {
		elements.canvas.addEventListener(eventName, handleTxtPreviewReadonlyGuard, true);
	});
	txtPreviewState.readonlyGuardsInitialized = true;
}

function renderTxtPreviewControls() {
	const elements = getTxtPreviewElements();
	if (!elements.canvas || !elements.emptyState) {
		return;
	}

	const controls = txtPreviewState.document.controls || [];
	const recoveredControlIds = getRecoveredControlIds();
	const surface = document.createElement('div');
	surface.className = 'txt-preview-canvas-surface';

	let maxRight = elements.canvas.clientWidth || 0;
	let maxBottom = elements.canvas.clientHeight || 0;

	controls.forEach(control => {
		const effectiveStyle = getTxtPreviewEffectiveButtonStyle(control.style, currentTheme);
		const button = document.createElement('button');
		button.type = 'button';
		button.className = 'txt-virtual-control-button';
		button.dataset.stableId = control.stableId;
		button.dataset.identifier = control.identifier;
		button.textContent = control.displayName;
		button.setAttribute('aria-disabled', 'true');
		button.setAttribute(
			'aria-label',
			formatTxtPreviewMessage(
				'TXT_PREVIEW_BUTTON_ARIA_LABEL',
				'{0}. Identifier {1}. Preview only, cannot be edited or pressed.',
				control.displayName,
				control.identifier
			)
		);
		button.setAttribute(
			'title',
			formatTxtPreviewMessage('TXT_PREVIEW_BUTTON_READONLY_TITLE', 'Preview only: this virtual button cannot be edited or pressed here.')
		);
		button.tabIndex = -1;
		button.style.left = `${control.position.x}px`;
		button.style.top = `${control.position.y}px`;
		button.style.width = `${control.size.width}px`;
		button.style.height = `${control.size.height}px`;
		button.style.backgroundColor = effectiveStyle.backgroundColor;
		button.style.color = effectiveStyle.textColor;
		button.classList.toggle('recovered', recoveredControlIds.has(control.stableId));
		surface.appendChild(button);

		maxRight = Math.max(maxRight, control.position.x + control.size.width + 32);
		maxBottom = Math.max(maxBottom, control.position.y + control.size.height + 32);
	});

	surface.style.width = `${maxRight}px`;
	surface.style.height = `${maxBottom}px`;
	elements.canvas.replaceChildren(surface);
	elements.canvas.scrollTo({ left: 0, top: 0 });
	elements.emptyState.classList.toggle('hidden', controls.length > 0);
	renderTxtPreviewWarnings();
}

function renderTxtVirtualControlsPreview(txtVirtualControls, previewWarnings = []) {
	txtPreviewState.document = normalizeTxtPreviewControlsDocument(txtVirtualControls);
	txtPreviewState.previewWarnings = Array.isArray(previewWarnings) ? previewWarnings : [];
	txtPreviewState.panelWidth = TXT_PREVIEW_PANEL_DEFAULT_WIDTH;

	setTxtPreviewPanelVisible(currentPreviewBoard === 'txt');
	if (currentPreviewBoard !== 'txt') {
		return;
	}

	updateTxtPreviewTexts();
	renderTxtPreviewControls();
	initTxtPreviewReadonlyGuards();
}

function hideTxtVirtualControlsPreview() {
	txtPreviewState.document = createEmptyTxtPreviewControlsDocument();
	txtPreviewState.previewWarnings = [];
	const elements = getTxtPreviewElements();
	if (elements.canvas) {
		elements.canvas.replaceChildren();
	}
	if (elements.warningList) {
		elements.warningList.replaceChildren();
		elements.warningList.classList.add('hidden');
	}
	if (elements.emptyState) {
		elements.emptyState.classList.add('hidden');
	}
	setTxtPreviewPanelVisible(false);
}

function handleTxtPreviewSplitterPointerDown(event) {
	const elements = getTxtPreviewElements();
	if (!txtPreviewState.panelOpen || !elements.container || !elements.splitter) {
		return;
	}

	event.preventDefault();
	elements.splitter.setPointerCapture?.(event.pointerId);
	txtPreviewState.panelResize = {
		pointerId: event.pointerId,
		containerWidth: elements.container.clientWidth,
		containerRight: elements.container.getBoundingClientRect().right,
	};
	document.body.classList.add('txt-virtual-controls-resizing');
	window.addEventListener('pointermove', handleTxtPreviewSplitterPointerMove);
	window.addEventListener('pointerup', handleTxtPreviewSplitterPointerUp, { once: true });
	window.addEventListener('pointercancel', handleTxtPreviewSplitterPointerUp, { once: true });
}

function handleTxtPreviewSplitterPointerMove(event) {
	if (!txtPreviewState.panelResize) {
		return;
	}

	txtPreviewState.panelWidth = clampTxtPreviewPanelWidth(
		txtPreviewState.panelResize.containerRight - event.clientX,
		txtPreviewState.panelResize.containerWidth
	);
	applyTxtPreviewPanelLayout();
	scheduleTxtPreviewBlocklyResize();
}

function handleTxtPreviewSplitterPointerUp() {
	window.removeEventListener('pointermove', handleTxtPreviewSplitterPointerMove);
	const elements = getTxtPreviewElements();
	if (elements.splitter && txtPreviewState.panelResize?.pointerId !== undefined) {
		elements.splitter.releasePointerCapture?.(txtPreviewState.panelResize.pointerId);
	}
	txtPreviewState.panelResize = null;
	document.body.classList.remove('txt-virtual-controls-resizing');
	scheduleTxtPreviewBlocklyResize();
}

/**
 * 初始化 Blockly 工作區
 * 預覽模式下不需要工具箱
 */
function initBlocklyWorkspace() {
	log.info('初始化預覽模式 Blockly 工作區');
	// 選擇適合的主題
	const theme = currentTheme === 'dark' ? SingularBlocklyDarkTheme : SingularBlocklyTheme; // 初始化工作區 - 不需要工具箱
	workspace = Blockly.inject('blocklyDiv', {
		theme: theme,
		readOnly: true, // 預覽模式設為真正的唯讀模式
		move: {
			scrollbars: true,
			drag: true,
			wheel: false, // 設為 false 避免與縮放功能衝突
		},
		zoom: {
			controls: true,
			wheel: true, // 啟用滾輪縮放
			startScale: 1.0,
			maxScale: 3,
			minScale: 0.3,
			scaleSpeed: 1.2,
			pinch: true, // 支援觸控設備的縮放
		},
		trashcan: false, // 預覽模式不需要垃圾桶
	});

	// 將工作區註冊為全局變數 (用於除錯)
	window.workspace = workspace;
	// 請求載入備份數據
	requestBackupData();

	log.info('預覽工作區初始化完成');
}

/**
 * 請求載入備份數據
 */
function requestBackupData() {
	log.info('請求載入備份數據');

	vscode.postMessage({
		command: 'loadBackupData',
		fileName: window.previewFileName,
	});
}

/**
 * 從擴充功能載入工作區數據
 * @param {string} xml - Blockly XML 字符串
 */
function loadWorkspaceFromXml(xml) {
	if (!workspace || !xml) {
		log.error('無法載入工作區數據: 缺少工作區或XML數據');
		return;
	}

	log.info('正在載入工作區XML數據');

	try {
		// 清除現有積木
		workspace.clear();

		// 解析XML並載入積木
		const dom = Blockly.Xml.textToDom(xml);
		Blockly.Xml.domToWorkspace(dom, workspace);

		// 調整視圖以適應積木
		workspace.zoomToFit();
		workspace.scrollCenter();

		log.info('工作區數據載入成功');
	} catch (error) {
		log.error('載入工作區數據時發生錯誤', error);
	}
}

/**
 * 主題切換處理函數
 */
function toggleTheme() {
	// 切換主題
	currentTheme = currentTheme === 'light' ? 'dark' : 'light';

	// 更新主題狀態
	updateTheme(currentTheme);

	// 儲存設定到 VS Code
	vscode.postMessage({
		command: 'updateTheme',
		theme: currentTheme,
	});
}

/**
 * 更新主題
 * @param {string} theme - 主題名稱 ('light' 或 'dark')
 * @param {boolean} [notifyExtension=true] - 是否通知擴充功能主題變更
 */
function updateTheme(theme, notifyExtension = true) {
	currentTheme = theme;

	// 更新 body 的 class
	document.body.classList.remove('theme-light', 'theme-dark');
	document.body.classList.add(`theme-${theme}`);

	// 更新圖標顯示
	const lightIcon = document.getElementById('lightIcon');
	const darkIcon = document.getElementById('darkIcon');

	if (lightIcon && darkIcon) {
		if (theme === 'light') {
			lightIcon.style.display = 'block';
			darkIcon.style.display = 'none';
		} else {
			lightIcon.style.display = 'none';
			darkIcon.style.display = 'block';
		}
	}

	// 如果工作區已初始化，更新工作區主題
	if (workspace) {
		const blocklyTheme = theme === 'dark' ? SingularBlocklyDarkTheme : SingularBlocklyTheme;
		workspace.setTheme(blocklyTheme);
	}

	// 只有在需要時才通知擴充功能主題變更
	if (notifyExtension) {
		vscode.postMessage({
			command: 'themeChanged',
			theme: theme,
		});
	}

	log.info(`主題已更新為: ${theme}`);
	if (currentPreviewBoard === 'txt' && txtPreviewState.panelOpen) {
		renderTxtPreviewControls();
	}
}

/**
 * 從工作區狀態 (JSON格式) 載入工作區
 * @param {Object} workspaceState - Blockly 序列化後的工作區狀態
 */
function loadWorkspaceFromState(workspaceState) {
	try {
		log.info('從 workspace 狀態載入工作區');

		// 確保工作區已初始化
		if (!workspace) {
			initBlocklyWorkspace();
		}

		// 清空現有工作區
		workspace.clear();

		// 使用 Blockly 的反序列化功能載入工作區狀態
		Blockly.serialization.workspaces.load(workspaceState, workspace);

		log.info('成功載入 workspace 狀態');
	} catch (error) {
		log.error('載入 workspace 狀態失敗', error);

		// 顯示錯誤訊息
		vscode.postMessage({
			command: 'log',
			level: 'error',
			message: '載入工作區狀態失敗',
			args: [error.toString()],
		});
	}
}

/**
 * 語言切換後重新載入工作區以刷新積木文字
 */
function refreshWorkspaceForLanguage() {
	if (!workspace) {
		return;
	}

	if (isLanguageSwitchReloading) {
		return;
	}

	if (typeof workspace.isDragging === 'function' && workspace.isDragging()) {
		if (!pendingLanguageReloadTimer) {
			pendingLanguageReloadTimer = setTimeout(() => {
				pendingLanguageReloadTimer = null;
				refreshWorkspaceForLanguage();
			}, 200);
		}
		return;
	}

	let eventsWereEnabled = false;

	try {
		isLanguageSwitchReloading = true;
		const state = Blockly.serialization.workspaces.save(workspace);
		eventsWereEnabled = Blockly.Events?.isEnabled ? Blockly.Events.isEnabled() : false;

		if (eventsWereEnabled && Blockly.Events?.disable) {
			Blockly.Events.disable();
		}

		workspace.clear();
		Blockly.serialization.workspaces.load(state, workspace);
		workspace.render();
	} catch (error) {
		log.warn('語言切換後重載預覽工作區失敗:', error);
	} finally {
		if (eventsWereEnabled && Blockly.Events?.enable) {
			Blockly.Events.enable();
		}
		setTimeout(() => {
			isLanguageSwitchReloading = false;
		}, 0);
	}
}

/**
 * 顯示開發板警告訊息
 * 當備份檔案中的 board 值無效時，在預覽視窗頂部顯示警告
 * @param {string} message - 警告訊息文字（已由 Extension 端翻譯）
 */
function showBoardWarning(message) {
	// 移除現有的警告（如果有）
	const existingWarning = document.querySelector('.board-warning');
	if (existingWarning) {
		existingWarning.remove();
	}

	// 建立警告元素
	const warningEl = document.createElement('div');
	warningEl.className = 'board-warning';
	warningEl.style.cssText = `
		background-color: #ffc107;
		color: #212529;
		padding: 8px 16px;
		font-size: 13px;
		text-align: center;
		border-bottom: 1px solid #e0a800;
	`;
	warningEl.textContent = message;

	// 插入到 preview-info 後面
	const previewInfo = document.querySelector('.preview-info');
	if (previewInfo && previewInfo.parentNode) {
		previewInfo.parentNode.insertBefore(warningEl, previewInfo.nextSibling);
	} else {
		// Fallback: 插入到 body 開頭
		document.body.insertBefore(warningEl, document.body.firstChild);
	}

	log.warn(`Board warning displayed: ${message}`);
}

/**
 * 監聽來自擴充功能的訊息
 */
window.addEventListener('message', event => {
	const message = event.data;

	switch (message.command) {
		case 'setBoard':
			// T010: 設定開發板類型（必須在 loadWorkspaceState 之前處理）
			currentPreviewBoard = message.board || 'uno';
			if (message.board && window.setCurrentBoard) {
				window.setCurrentBoard(message.board);
				log.info(`預覽模式開發板已設定為: ${message.board}`, {
					originalBoard: message.originalBoard,
					isDefault: message.isDefault,
				});
			}
			if (currentPreviewBoard !== 'txt') {
				hideTxtVirtualControlsPreview();
			}

			// T011: 顯示警告（如果有）
			if (message.warning) {
				showBoardWarning(message.warning);
			}
			break;

		case 'loadWorkspaceState':
			if (message.workspaceState) {
				loadWorkspaceFromState(message.workspaceState);
			}
			if (currentPreviewBoard === 'txt') {
				renderTxtVirtualControlsPreview(message.txtVirtualControls, message.previewWarnings || []);
			} else {
				hideTxtVirtualControlsPreview();
			}
			break;
		case 'updateTheme':
			updateTheme(message.theme, false); // 設置 notifyExtension = false，避免重複通知
			break;
		case 'updateLanguage':
			if (window.languageManager && message.resolvedLanguage) {
				window.languageManager.setLanguage(message.resolvedLanguage);
			} else {
				log.warn('預覽視窗無法更新語言: 缺少 languageManager 或語言代碼', message);
			}
			break;

		case 'loadError':
			// 顯示載入失敗的錯誤訊息
			log.error('載入備份失敗', message.error);
			break;

		default:
			// 忽略未知命令
			break;
	}
});

// 監聽語言變更事件
window.addEventListener('languageChanged', function (event) {
	log.info(`語言已變更為: ${event.detail.language}`);
	// 更新 UI 文字
	updateUITexts();
	if (currentPreviewBoard === 'txt' && txtPreviewState.panelOpen) {
		renderTxtPreviewControls();
	}
	// 重新載入工作區以刷新積木文字
	refreshWorkspaceForLanguage();
});

// 監聽語言檔案載入事件
window.addEventListener('messageLoaded', function (event) {
	log.info(`語言檔案已載入: ${event.detail.locale}`);
	// 更新 UI 文字
	updateUITexts();
	if (currentPreviewBoard === 'txt' && txtPreviewState.panelOpen) {
		renderTxtPreviewControls();
	}
});

// 初始化
document.addEventListener('DOMContentLoaded', async () => {
	log.info('Blockly Preview page loaded');

	// 設定主題切換按鈕事件
	document.getElementById('themeToggle').addEventListener('click', toggleTheme);
	document.getElementById('txtVirtualControlsSplitter')?.addEventListener('pointerdown', handleTxtPreviewSplitterPointerDown);

	// 初始化 Blockly 工作區
	initBlocklyWorkspace();

	// 根據初始主題設定更新 UI
	updateTheme(currentTheme);

	// 更新UI文字的多國語言顯示
	updateUITexts();
});
