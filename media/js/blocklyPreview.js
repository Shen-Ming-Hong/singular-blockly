/**
 * @license
 * Copyright 2025 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

const vscode = acquireVsCodeApi();
let workspace;

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
	}
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
 * 監聯來自擴充功能的訊息
 */
window.addEventListener('message', event => {
	const message = event.data;

	switch (message.command) {
		case 'setBoard':
			// T010: 設定開發板類型（必須在 loadWorkspaceState 之前處理）
			if (message.board && window.setCurrentBoard) {
				window.setCurrentBoard(message.board);
				log.info(`預覽模式開發板已設定為: ${message.board}`, {
					originalBoard: message.originalBoard,
					isDefault: message.isDefault,
				});
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
			break;
		case 'updateTheme':
			updateTheme(message.theme, false); // 設置 notifyExtension = false，避免重複通知
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
});

// 監聽語言檔案載入事件
window.addEventListener('messageLoaded', function (event) {
	log.info(`語言檔案已載入: ${event.detail.locale}`);
	// 更新 UI 文字
	updateUITexts();
});

// 初始化
document.addEventListener('DOMContentLoaded', async () => {
	log.info('Blockly Preview page loaded');

	// 設定主題切換按鈕事件
	document.getElementById('themeToggle').addEventListener('click', toggleTheme);

	// 初始化 Blockly 工作區
	initBlocklyWorkspace();

	// 根據初始主題設定更新 UI
	updateTheme(currentTheme);

	// 更新UI文字的多國語言顯示
	updateUITexts();
});
