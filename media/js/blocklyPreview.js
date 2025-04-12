/**
 * @license
 * Copyright 2024 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

const vscode = acquireVsCodeApi();
let workspace;
const CLIPBOARD_STORAGE_KEY = 'blockly-clipboard-data';

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
 * 初始化 Blockly 工作區
 * 預覽模式下不需要工具箱
 */
function initBlocklyWorkspace() {
	log.info('初始化預覽模式 Blockly 工作區');

	// 選擇適合的主題
	const theme = currentTheme === 'dark' ? SingularBlocklyDarkTheme : SingularBlocklyTheme;
	// 初始化工作區 - 不需要工具箱
	workspace = Blockly.inject('blocklyDiv', {
		theme: theme,
		readOnly: false, // 允許選擇方便複製，但無法修改積木
		move: {
			scrollbars: true,
			drag: true,
			wheel: true,
		},
		zoom: {
			controls: true,
			wheel: true,
			startScale: 1.0,
			maxScale: 3,
			minScale: 0.3,
			scaleSpeed: 1.2,
		},
		trashcan: false, // 預覽模式不需要垃圾桶
	});

	// 將工作區註冊為全局變數 (用於除錯)
	window.workspace = workspace;

	// 請求載入備份數據
	requestBackupData();

	// 設定複製功能
	setupCopyFunctionality();

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
 * 設定積木複製功能
 */
function setupCopyFunctionality() {
	// 監聽複製事件 (Ctrl+C)
	document.addEventListener('keydown', function (e) {
		// 檢查是否為 Ctrl+C 或 Cmd+C (Mac)
		if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
			copySelectedBlocks();
		}
	});
}

/**
 * 複製選中的積木
 */
function copySelectedBlocks() {
	if (!workspace) {
		log.warn('複製失敗: 工作區未初始化');
		return;
	}

	const selectedBlocks = workspace.getSelectedBlocks();
	if (!selectedBlocks || selectedBlocks.length === 0) {
		log.info('沒有選中的積木可供複製');
		return;
	}

	log.info(`複製 ${selectedBlocks.length} 個積木`);

	try {
		// 序列化選中的積木
		const blocksXml = Blockly.Xml.blockToDom(selectedBlocks[0]);
		const xmlText = Blockly.Xml.domToText(blocksXml);

		// 儲存到 localStorage 以便能在主編輯器中貼上
		localStorage.setItem(CLIPBOARD_STORAGE_KEY, xmlText);

		// 顯示提示
		showCopySuccessMessage();

		log.info('積木複製成功，已保存到剪貼簿', { blockCount: selectedBlocks.length });
	} catch (error) {
		log.error('複製積木時發生錯誤', error);
	}
}

/**
 * 顯示複製成功的提示訊息
 */
function showCopySuccessMessage() {
	const messageContainer = document.createElement('div');
	messageContainer.className = 'copy-success-message';
	messageContainer.textContent = '積木已複製，請在主編輯器使用 Ctrl+V 貼上';

	document.body.appendChild(messageContainer);

	// 3秒後移除提示
	setTimeout(() => {
		messageContainer.classList.add('copy-success-message-hide');
		setTimeout(() => {
			document.body.removeChild(messageContainer);
		}, 500);
	}, 3000);
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
 * 監聽來自擴充功能的訊息
 */
window.addEventListener('message', event => {
	const message = event.data;

	switch (message.command) {
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

// 初始化
document.addEventListener('DOMContentLoaded', async () => {
	log.info('Blockly Preview page loaded');

	// 設定主題切換按鈕事件
	document.getElementById('themeToggle').addEventListener('click', toggleTheme);

	// 初始化 Blockly 工作區
	initBlocklyWorkspace();

	// 根據初始主題設定更新 UI
	updateTheme(currentTheme);
});
