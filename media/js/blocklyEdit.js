/**
 * @license
 * Copyright 2025 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
const vscode = acquireVsCodeApi();

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
			source: 'blocklyEdit',
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
			source: 'blocklyEdit',
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
			source: 'blocklyEdit',
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
			source: 'blocklyEdit',
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
 * Toast 通知系統
 * 用於顯示快速備份等操作的即時回饋
 */
const toast = {
	currentToast: null,
	currentTimeout: null,

	/**
	 * 顯示 Toast 通知
	 * @param {string} message - 要顯示的訊息
	 * @param {string} type - 通知類型：'success' | 'warning' | 'error'
	 * @param {number} duration - 顯示時長（毫秒），預設 2500ms
	 */
	show: function (message, type = 'success', duration = 2500) {
		// 移除現有 Toast
		this.hide();

		// 建立 Toast 元素（含 ARIA 無障礙屬性）
		const toastEl = document.createElement('div');
		toastEl.className = `toast ${type}`;
		toastEl.textContent = message;
		toastEl.setAttribute('role', 'status');
		toastEl.setAttribute('aria-live', 'polite');
		document.body.appendChild(toastEl);

		this.currentToast = toastEl;

		// 觸發動畫（使用 requestAnimationFrame 確保 DOM 更新後再添加 class）
		requestAnimationFrame(() => {
			toastEl.classList.add('visible');
		});

		// 自動隱藏
		this.currentTimeout = setTimeout(() => {
			toastEl.classList.remove('visible');
			setTimeout(() => {
				if (toastEl.parentNode) {
					toastEl.remove();
				}
				if (this.currentToast === toastEl) {
					this.currentToast = null;
				}
			}, 300); // 等待淡出動畫完成
		}, duration);
	},

	/**
	 * 隱藏當前 Toast
	 */
	hide: function () {
		if (this.currentTimeout) {
			clearTimeout(this.currentTimeout);
			this.currentTimeout = null;
		}
		if (this.currentToast) {
			this.currentToast.remove();
			this.currentToast = null;
		}
		// 移除所有殘留的 Toast 元素
		document.querySelectorAll('.toast').forEach(el => el.remove());
	},
};

/**
 * 當前程式語言（用於決定使用哪個生成器）
 * @type {'arduino' | 'micropython'}
 */
window.currentProgrammingLanguage = 'arduino';

/**
 * 根據當前程式語言生成程式碼
 * @param {Blockly.Workspace} workspace - Blockly 工作區
 * @returns {string} 生成的程式碼
 */
function generateCode(workspace) {
	const lang = window.currentProgrammingLanguage;
	if (lang === 'micropython' && window.micropythonGenerator) {
		console.log('[blockly] 使用 MicroPython 生成器生成程式碼');
		return window.micropythonGenerator.workspaceToCode(workspace);
	}
	console.log('[blockly] 使用 Arduino 生成器生成程式碼');
	return window.arduinoGenerator.workspaceToCode(workspace);
}

/**
 * 獲取當前使用的生成器
 * @returns {Blockly.Generator} 當前的程式碼生成器
 */
function getCurrentGenerator() {
	const lang = window.currentProgrammingLanguage;
	if (lang === 'micropython' && window.micropythonGenerator) {
		console.log('[blockly] 取得 MicroPython 生成器');
		return window.micropythonGenerator;
	}
	console.log('[blockly] 取得 Arduino 生成器');
	return window.arduinoGenerator;
}

/**
 * 快速備份功能（Ctrl+S / Cmd+S）
 * 提供即時備份工作區的快捷鍵功能
 */
const quickBackup = {
	/** 上次成功備份的時間戳（毫秒） */
	lastSaveTime: 0,

	/** 節流冷卻時間（毫秒），預設 3000ms */
	COOLDOWN_MS: 3000,

	/**
	 * 初始化快速備份功能
	 * 綁定 Ctrl+S (Windows/Linux) 和 Cmd+S (macOS) 鍵盤事件
	 */
	init: function () {
		document.addEventListener('keydown', e => {
			if ((e.ctrlKey || e.metaKey) && e.key === 's') {
				e.preventDefault(); // 阻止瀏覽器預設的「儲存網頁」對話框
				this.performQuickSave();
			}
		});
		log.info('快速備份功能已初始化 (Ctrl+S / Cmd+S)');
	},

	/**
	 * 檢查是否可以執行備份（節流檢查）
	 * @returns {boolean} true 表示可以備份，false 表示在冷卻期間
	 */
	canSave: function () {
		const now = Date.now();
		return now - this.lastSaveTime >= this.COOLDOWN_MS;
	},

	/**
	 * 記錄備份時間戳
	 */
	recordSave: function () {
		this.lastSaveTime = Date.now();
	},

	/**
	 * 生成備份名稱（格式：backup_YYYYMMDD_HHMMSS）
	 * @returns {string} 備份名稱
	 */
	generateBackupName: function () {
		const now = new Date();
		const pad = n => String(n).padStart(2, '0');
		return `backup_${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(
			now.getMinutes()
		)}${pad(now.getSeconds())}`;
	},

	/**
	 * 執行快速備份
	 */
	performQuickSave: function () {
		// 1. 節流檢查
		if (!this.canSave()) {
			const message = window.languageManager
				? window.languageManager.getMessage('BACKUP_QUICK_SAVE_COOLDOWN', '請稍候，上次備份剛完成')
				: '請稍候，上次備份剛完成';
			toast.show(message, 'warning');
			log.info('快速備份：冷卻期間，跳過備份');
			return;
		}

		// 2. 空工作區檢查
		const workspace = Blockly.getMainWorkspace();
		if (!workspace) {
			log.warn('快速備份：無法取得工作區');
			return;
		}

		const state = Blockly.serialization.workspaces.save(workspace);
		if (!state || !state.blocks || !state.blocks.blocks || state.blocks.blocks.length === 0) {
			const message = window.languageManager
				? window.languageManager.getMessage('BACKUP_QUICK_SAVE_EMPTY', '工作區為空，不需要備份')
				: '工作區為空，不需要備份';
			toast.show(message, 'warning');
			log.info('快速備份：工作區為空，跳過備份');
			return;
		}

		// 3. 生成備份名稱
		const backupName = this.generateBackupName();

		// 4. 發送備份請求
		const boardSelect = document.getElementById('boardSelect');
		vscode.postMessage({
			command: 'createBackup',
			name: backupName,
			state: state,
			board: boardSelect ? boardSelect.value : 'arduino_uno',
			theme: currentTheme,
			isQuickBackup: true,
		});

		// 5. 更新節流狀態
		this.recordSave();

		// 6. 顯示成功 Toast
		const successTemplate = window.languageManager
			? window.languageManager.getMessage('BACKUP_QUICK_SAVE_SUCCESS', '備份已儲存：{0}')
			: '備份已儲存：{0}';
		const successMessage = successTemplate.replace('{0}', backupName);
		toast.show(successMessage, 'success');

		log.info(`快速備份完成: ${backupName}`);
	},
};

/**
 * 動態生成開發板選擇下拉選單選項
 */
function populateBoardOptions() {
	const boardSelect = document.getElementById('boardSelect');
	if (!boardSelect) {
		log.warn('找不到開發板選擇下拉選單元素');
		return;
	}

	// 清空現有選項
	boardSelect.innerHTML = '';

	// 添加 "None" 選項
	const noneOption = document.createElement('option');
	noneOption.value = 'none';
	noneOption.textContent = 'None';
	boardSelect.appendChild(noneOption);

	// 從 BOARD_CONFIGS 動態生成選項
	if (window.BOARD_CONFIGS) {
		Object.keys(window.BOARD_CONFIGS).forEach(boardKey => {
			const boardConfig = window.BOARD_CONFIGS[boardKey];
			const option = document.createElement('option');
			option.value = boardKey;
			option.textContent = boardConfig.name;
			boardSelect.appendChild(option);
		});
	} else {
		log.warn('無法找到 BOARD_CONFIGS 物件，無法動態生成開發板選項');
	}

	// 設定預設選擇
	if (window.currentBoard && boardSelect.querySelector(`option[value="${window.currentBoard}"]`)) {
		boardSelect.value = window.currentBoard;
	} else {
		boardSelect.value = 'none';
	}
}

/**
 * 更新主編輯視窗的UI文字為多語言版本
 */
function updateEditorUITexts() {
	// 獲取語言管理器
	const languageManager = window.languageManager;
	if (!languageManager) {
		log.warn('語言管理器尚未載入，無法更新主編輯視窗文字');
		return;
	}

	// 更新主題切換按鈕title屬性
	const themeToggle = document.getElementById('themeToggle');
	if (themeToggle) {
		themeToggle.setAttribute('title', languageManager.getMessage('THEME_TOGGLE', '切換主題'));
	}

	// 更新選擇開發板標籤文字
	const boardSelectLabel = document.getElementById('boardSelectLabel');
	if (boardSelectLabel) {
		boardSelectLabel.textContent = languageManager.getMessage('BOARD_SELECT_LABEL', '選擇開發板：');
	}
	// 更新實驗積木提示文字
	if (window.experimentalBlocksNotice) {
		try {
			window.experimentalBlocksNotice.updateTexts();
		} catch (e) {
			log.error('[實驗積木] 更新實驗積木提示文字時發生錯誤:', e);
		}
	}
}

/**
 * 更新備份管理視窗的文字為多語言版本
 */
function updateBackupModalTexts() {
	// 獲取語言管理器
	const languageManager = window.languageManager;
	if (!languageManager) {
		log.warn('語言管理器尚未載入，無法更新備份管理視窗文字');
		return;
	} // 更新標題和按鈕
	document.getElementById('backupModalTitle').textContent = languageManager.getMessage('BACKUP_MANAGER_TITLE', '備份管理');
	document.getElementById('createBackupBtn').textContent = languageManager.getMessage('BACKUP_CREATE_NEW', '建立新備份');
	document.getElementById('backupNameLabel').textContent = languageManager.getMessage('BACKUP_NAME_LABEL', '備份名稱：');
	document.getElementById('backupName').placeholder = languageManager.getMessage('BACKUP_NAME_PLACEHOLDER', '輸入備份名稱');
	document.getElementById('confirmBackupBtn').textContent = languageManager.getMessage('BACKUP_CONFIRM', '確認');
	document.getElementById('cancelBackupBtn').textContent = languageManager.getMessage('BACKUP_CANCEL', '取消');
	document.getElementById('backupListTitle').textContent = languageManager.getMessage('BACKUP_LIST_TITLE', '備份列表');
	document.getElementById('emptyBackupMessage').textContent = languageManager.getMessage('BACKUP_LIST_EMPTY', '尚無備份');
	// 更新自動備份區塊文字
	document.getElementById('autoBackupIntervalLabel').textContent = languageManager.getMessage(
		'AUTO_BACKUP_INTERVAL_LABEL',
		'備份間隔時間：'
	);
	document.getElementById('autoBackupMinutesText').textContent = languageManager.getMessage('AUTO_BACKUP_MINUTES', '分鐘');
	document.getElementById('saveAutoBackupBtn').textContent = languageManager.getMessage('AUTO_BACKUP_SAVE', '儲存設定');
	// 更新備份按鈕標題
	document.getElementById('backupButton').title = languageManager.getMessage('BACKUP_BUTTON_TITLE', '備份管理');

	// 更新重新整理按鈕標題
	document.getElementById('refreshButton').title = languageManager.getMessage('REFRESH_BUTTON_TITLE', '重新整理程式碼');
}

/**
 * 更新積木搜尋視窗的文字為多語言版本
 */
function updateFunctionSearchModalTexts() {
	// 獲取語言管理器
	const languageManager = window.languageManager;
	if (!languageManager) {
		log.warn('語言管理器尚未載入，無法更新積木搜尋視窗文字');
		return;
	} // 更新標題和按鈕

	document.getElementById('functionSearchModalTitle').textContent = languageManager.getMessage('FUNCTION_SEARCH_TITLE', '搜尋積木');
	document.getElementById('functionSearchInput').placeholder = languageManager.getMessage(
		'FUNCTION_SEARCH_PLACEHOLDER',
		'輸入積木名稱或參數...'
	);
	// 不再設置按鈕文字，因為使用圖標
	document.getElementById('prevResultBtn').textContent = languageManager.getMessage('FUNCTION_SEARCH_PREV', '上一個');
	document.getElementById('nextResultBtn').textContent = languageManager.getMessage('FUNCTION_SEARCH_NEXT', '下一個');
	document.getElementById('emptySearchMessage').textContent = languageManager.getMessage('FUNCTION_SEARCH_EMPTY', '尚未搜尋');

	// 更新搜尋按鈕標題，包含快捷鍵提示
	const buttonTitle = languageManager.getMessage('FUNCTION_SEARCH_BUTTON_TITLE', '搜尋積木');
	const shortcutTip = languageManager.getMessage('FUNCTION_KEYBOARD_SHORTCUT_TIP', '(快捷鍵: Ctrl+F)');
	document.getElementById('functionSearchToggle').title = `${buttonTitle} ${shortcutTip}`;
}

// 註冊工具箱元件
Blockly.registry.register(Blockly.registry.Type.TOOLBOX_ITEM, Blockly.ToolboxCategory.registrationName, Blockly.ToolboxCategory);

// 用來儲存等待回應的確認對話框回調函數
const pendingConfirmCallbacks = new Map();
let confirmCounter = 0;

/**
 * 非同步確認對話框（使用 VSCode 原生 API）
 * @param {string} message - 確認訊息
 * @returns {Promise<boolean>} - 用戶是否確認
 */
async function showAsyncConfirm(message) {
	const confirmId = confirmCounter++;

	return new Promise(resolve => {
		pendingConfirmCallbacks.set(confirmId, resolve);
		vscode.postMessage({
			command: 'confirmDialog',
			message: message,
			confirmId: confirmId,
		});
	});
}

// 覆蓋 window.confirm 方法，改用 VSCode API 顯示通知
window.confirm = function (message) {
	// 每次呼叫都產生唯一的 ID
	const confirmId = confirmCounter++;

	// 創建一個 Promise 來等待使用者的回應
	const confirmPromise = new Promise(resolve => {
		// 將此 Promise 的 resolve 函數儲存到 Map 中，供稍後回應時使用
		pendingConfirmCallbacks.set(confirmId, resolve);

		// 將確認請求發送給 VSCode 擴展，包含唯一 ID
		// 標記為 blockly 刪除用途，需要在確認後清除工作區
		vscode.postMessage({
			command: 'confirmDialog',
			message: message,
			confirmId: confirmId,
			purpose: 'blocklyDelete', // 標記用途
		});
	});

	// 立即返回 false，讓 Blockly 不要立即執行刪除動作
	// 實際的刪除操作會在用戶點選"OK"後，透過另一種方式執行
	return false;
};

// 備份管理功能
const backupManager = {
	// 備份列表
	backupList: [],
	// 自動備份計時器
	autoBackupTimer: null,
	// 自動備份間隔（分鐘）
	autoBackupInterval: 30,

	// 初始化備份管理器
	init: function () {
		// 綁定按鈕事件
		document.getElementById('backupButton').addEventListener('click', this.openModal.bind(this));
		document.querySelector('.modal-close').addEventListener('click', this.closeModal.bind(this));
		document.getElementById('createBackupBtn').addEventListener('click', this.showBackupForm.bind(this));
		document.getElementById('confirmBackupBtn').addEventListener('click', this.createBackup.bind(this));
		document.getElementById('cancelBackupBtn').addEventListener('click', this.hideBackupForm.bind(this));
		document.getElementById('saveAutoBackupBtn').addEventListener('click', this.saveAutoBackupSettings.bind(this));

		// 更新多國語言文字
		updateBackupModalTexts();

		// 初始化備份列表
		this.refreshBackupList();

		// 請求自動備份設定
		this.requestAutoBackupSettings();
	},

	// 打開模態對話框
	openModal: function () {
		document.getElementById('backupModal').style.display = 'block';
		// 刷新備份列表
		this.refreshBackupList();
	},

	// 關閉模態對話框
	closeModal: function () {
		document.getElementById('backupModal').style.display = 'none';
		this.hideBackupForm();
	},
	// 顯示建立備份表單
	showBackupForm: function () {
		// 隱藏控制欄
		document.querySelector('.backup-control-bar:not(.backup-create-form .backup-control-bar)').style.display = 'none';
		// 顯示表單
		document.querySelector('.backup-create-form').style.display = 'block';

		// 設定預設的備份名稱（格式：backup_YYYYMMDD_HHMMSS）
		const now = new Date();
		const year = now.getFullYear();
		const month = String(now.getMonth() + 1).padStart(2, '0');
		const day = String(now.getDate()).padStart(2, '0');
		const hours = String(now.getHours()).padStart(2, '0');
		const minutes = String(now.getMinutes()).padStart(2, '0');
		const seconds = String(now.getSeconds()).padStart(2, '0');
		const defaultName = `backup_${year}${month}${day}_${hours}${minutes}${seconds}`;

		document.getElementById('backupName').value = defaultName;
		document.getElementById('backupName').focus();
	},

	// 隱藏建立備份表單
	hideBackupForm: function () {
		// 顯示控制欄
		document.querySelector('.backup-control-bar:not(.backup-create-form .backup-control-bar)').style.display = 'flex';
		// 隱藏表單
		document.querySelector('.backup-create-form').style.display = 'none';
	},

	// 建立備份
	createBackup: function () {
		const backupName = document.getElementById('backupName').value.trim();
		if (!backupName) {
			alert('請輸入備份名稱');
			return;
		}
		// 安全性檢查：確保檔案名稱有效
		if (!this.isValidFilename(backupName)) {
			alert('備份名稱包含無效字符，請避免使用 \\ / : * ? " < > | 等特殊字符');
			return;
		}

		// 獲取工作區狀態
		try {
			const workspace = Blockly.getMainWorkspace();
			const state = Blockly.serialization.workspaces.save(workspace);
			const boardSelect = document.getElementById('boardSelect');

			// 發送建立備份請求到 VSCode 擴展
			vscode.postMessage({
				command: 'createBackup',
				name: backupName,
				state: state,
				board: boardSelect.value,
				theme: currentTheme,
			});

			// 隱藏表單
			this.hideBackupForm();

			// 顯示成功訊息
			log.info(`建立備份 "${backupName}" 成功`);
		} catch (error) {
			log.error('建立備份失敗:', error);
			alert('建立備份失敗: ' + error.message);
		}
	},

	// 驗證檔案名稱
	isValidFilename: function (filename) {
		// 允許中文、字母、數字、底線、連字符和點號，排除檔案系統不允許的特殊字符
		return /^[^\\/:*?"<>|]+$/.test(filename);
	},

	// 刷新備份列表
	refreshBackupList: function () {
		// 發送請求到 VSCode 擴展
		vscode.postMessage({
			command: 'getBackupList',
		});
	},
	// 更新備份列表 UI
	updateBackupListUI: function (backups) {
		const backupListEl = document.getElementById('backupList');
		// 清空列表
		backupListEl.innerHTML = '';

		// 如果沒有備份，顯示空白訊息
		if (!backups || backups.length === 0) {
			const emptyMessage = window.languageManager ? window.languageManager.getMessage('BACKUP_LIST_EMPTY', '尚無備份') : '尚無備份';
			backupListEl.innerHTML = `<div class="empty-backup-list">${emptyMessage}</div>`;
			return;
		}

		// 更新列表
		this.backupList = backups;
		backups.forEach(backup => {
			// 創建備份項目
			const backupItem = document.createElement('div');
			backupItem.className = 'backup-item';

			// 備份信息
			const backupInfo = document.createElement('div');
			backupInfo.className = 'backup-info';

			const backupName = document.createElement('div');
			backupName.className = 'backup-name';
			backupName.textContent = backup.name;

			const backupDate = document.createElement('div');
			backupDate.className = 'backup-date';
			backupDate.textContent = new Date(backup.date).toLocaleString();

			backupInfo.appendChild(backupName);
			backupInfo.appendChild(backupDate); // 操作按鈕
			const backupActions = document.createElement('div');
			backupActions.className = 'backup-actions'; // 預覽按鈕
			const previewBtn = document.createElement('button');
			previewBtn.className = 'backup-preview';
			const previewText = window.languageManager ? window.languageManager.getMessage('BACKUP_PREVIEW_BTN', '預覽') : '預覽';
			previewBtn.innerHTML = `
                <svg viewBox="0 0 24 24" width="16" height="16">
                    <path fill="currentColor" d="M12,9A3,3 0 0,0 9,12A3,3 0 0,0 12,15A3,3 0 0,0 15,12A3,3 0 0,0 12,9M12,17A5,5 0 0,1 7,12A5,5 0 0,1 12,7A5,5 0 0,1 17,12A5,5 0 0,1 12,17M12,4.5C7,4.5 2.73,7.61 1,12C2.73,16.39 7,19.5 12,19.5C17,19.5 21.27,16.39 23,12C21.27,7.61 17,4.5 12,4.5Z" />
                </svg>
                ${previewText}
            `;
			previewBtn.addEventListener('click', () => this.previewBackup(backup.name)); // 還原按鈕
			const restoreBtn = document.createElement('button');
			restoreBtn.className = 'backup-restore';
			const restoreText = window.languageManager ? window.languageManager.getMessage('BACKUP_RESTORE_BTN', '還原') : '還原';
			restoreBtn.innerHTML = `
                <svg viewBox="0 0 24 24" width="16" height="16">
                    <path fill="currentColor" d="M13,3A9,9 0 0,0 4,12H1L4.89,15.89L4.96,16.03L9,12H6A7,7 0 0,1 13,5A7,7 0 0,1 20,12A7,7 0 0,1 13,19C11.07,19 9.32,18.21 8.06,16.94L6.64,18.36C8.27,20 10.5,21 13,21A9,9 0 0,0 22,12A9,9 0 0,0 13,3Z" />
                </svg>
                ${restoreText}
            `;
			restoreBtn.addEventListener('click', () => this.restoreBackup(backup.name)); // 刪除按鈕
			const deleteBtn = document.createElement('button');
			deleteBtn.className = 'backup-delete';
			const deleteText = window.languageManager ? window.languageManager.getMessage('BACKUP_DELETE_BTN', '刪除') : '刪除';
			deleteBtn.innerHTML = `
                <svg viewBox="0 0 24 24" width="16" height="16">
                    <path fill="currentColor" d="M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z" />
                </svg>
                ${deleteText}
            `;
			deleteBtn.addEventListener('click', () => this.deleteBackup(backup.name));

			backupActions.appendChild(restoreBtn);
			backupActions.appendChild(previewBtn);
			backupActions.appendChild(deleteBtn);

			// 組合到備份項目
			backupItem.appendChild(backupInfo);
			backupItem.appendChild(backupActions);

			// 添加到列表
			backupListEl.appendChild(backupItem);
		});
	}, // 刪除備份
	deleteBackup: function (backupName) {
		// 直接發送命令到 VSCode 擴展，讓後端處理確認
		vscode.postMessage({
			command: 'deleteBackup',
			name: backupName,
		});
	},
	// 還原備份
	restoreBackup: function (backupName) {
		// 發送還原命令到 VSCode 擴展，讓後端處理確認
		vscode.postMessage({
			command: 'restoreBackup',
			name: backupName,
		});
	},
	// 預覽備份
	previewBackup: function (backupName) {
		log.info(`預覽備份: ${backupName}`);

		// 發送預覽命令到 VSCode 擴展，只需要傳遞備份名稱
		// 擴展端會負責構造完整的檔案路徑
		vscode.postMessage({
			command: 'previewBackup',
			name: backupName,
		});
	},

	// 請求自動備份設定
	requestAutoBackupSettings: function () {
		vscode.postMessage({
			command: 'getAutoBackupSettings',
		});
	},

	// 更新自動備份設定界面
	updateAutoBackupUI: function (minutes) {
		// 更新輸入框的值
		document.getElementById('autoBackupInterval').value = minutes;

		// 更新內部變數
		this.autoBackupInterval = minutes;

		// 如果計時器已存在，先清除
		if (this.autoBackupTimer) {
			clearInterval(this.autoBackupTimer);
		}

		// 設置自動備份計時器 (轉換為毫秒)
		this.startAutoBackupTimer();

		log.info(`自動備份間隔設定為 ${minutes} 分鐘`);
	},

	// 開始自動備份計時器
	startAutoBackupTimer: function () {
		// 如果間隔為0，則不啟用自動備份
		if (this.autoBackupInterval <= 0) {
			return;
		}

		const intervalMs = this.autoBackupInterval * 60 * 1000;
		this.autoBackupTimer = setInterval(this.createAutoBackup.bind(this), intervalMs);
		log.info(`已啟動自動備份，間隔: ${this.autoBackupInterval} 分鐘`);
	},

	// 儲存自動備份設定
	saveAutoBackupSettings: function () {
		const intervalInput = document.getElementById('autoBackupInterval');
		let interval = parseInt(intervalInput.value, 10);

		// 確保值有效 (最小為1分鐘)
		if (isNaN(interval) || interval < 1) {
			interval = 1;
			intervalInput.value = '1';
		}

		// 發送設定更新到 VSCode 擴展
		vscode.postMessage({
			command: 'updateAutoBackupSettings',
			interval: interval,
		});

		// 更新自動備份計時器
		this.updateAutoBackupUI(interval);

		// 顯示成功訊息
		const successMessage = window.languageManager
			? window.languageManager.getMessage('AUTO_BACKUP_SAVED', '自動備份設定已儲存')
			: '自動備份設定已儲存';

		vscode.postMessage({
			command: 'log',
			source: 'blocklyEdit',
			level: 'info',
			message: successMessage,
			timestamp: new Date().toISOString(),
		});
	},

	// 建立自動備份
	createAutoBackup: function () {
		try {
			const workspace = Blockly.getMainWorkspace();
			if (!workspace) {
				log.warn('無法建立自動備份: 未找到有效的工作區');
				return;
			}

			const state = Blockly.serialization.workspaces.save(workspace);
			if (!state || !state.blocks || state.blocks.blocks.length === 0) {
				log.info('工作區為空，不建立自動備份');
				return;
			}

			const boardSelect = document.getElementById('boardSelect');

			// 生成自動備份名稱 (格式: auto_YYYYMMDD_HHMMSS)
			const autoBackupPrefix = window.languageManager ? window.languageManager.getMessage('AUTO_BACKUP_PREFIX', 'auto_') : 'auto_';

			const now = new Date();
			const year = now.getFullYear();
			const month = String(now.getMonth() + 1).padStart(2, '0');
			const day = String(now.getDate()).padStart(2, '0');
			const hours = String(now.getHours()).padStart(2, '0');
			const minutes = String(now.getMinutes()).padStart(2, '0');
			const seconds = String(now.getSeconds()).padStart(2, '0');
			const backupName = `${autoBackupPrefix}${year}${month}${day}_${hours}${minutes}${seconds}`;

			// 發送建立備份請求到 VSCode 擴展
			vscode.postMessage({
				command: 'createBackup',
				name: backupName,
				state: state,
				board: boardSelect.value,
				theme: currentTheme,
				isAutoBackup: true,
			});

			log.info(`已建立自動備份: ${backupName}`);
		} catch (error) {
			log.error('自動備份失敗:', error);
		}
	},
};

// 積木搜尋功能
const functionSearch = {
	// 搜尋結果
	searchResults: [],
	// 當前選中的結果索引
	currentResultIndex: -1,

	// 初始化搜尋功能
	init: function () {
		// 綁定按鈕事件
		document.getElementById('functionSearchToggle').addEventListener('click', this.openModal.bind(this));
		document.getElementById('functionSearchModal').querySelector('.modal-close').addEventListener('click', this.closeModal.bind(this));
		document.getElementById('functionSearchBtn').addEventListener('click', this.performSearch.bind(this));
		document.getElementById('functionSearchInput').addEventListener('keypress', e => {
			if (e.key === 'Enter') {
				this.performSearch();
			}
		});
		// 點擊modal外部關閉
		document.getElementById('functionSearchModal').addEventListener('click', event => {
			// 如果點擊的是modal本身而不是其內容
			if (event.target === document.getElementById('functionSearchModal')) {
				log.info('點擊了搜尋模態視窗背景，準備關閉');
				this.closeModal();
			}
		});

		// 綁定結果導航按鈕
		document.getElementById('prevResultBtn').addEventListener('click', this.navigateToPrevResult.bind(this));
		document.getElementById('nextResultBtn').addEventListener('click', this.navigateToNextResult.bind(this));

		// 設置快捷鍵 (Ctrl+F)
		document.addEventListener('keydown', e => {
			if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
				e.preventDefault(); // 阻止瀏覽器默認搜尋
				this.openModal();
			}
		});

		// 更新多國語言文字
		updateFunctionSearchModalTexts();
	},

	// 打開搜尋對話框
	openModal: function () {
		document.getElementById('functionSearchModal').style.display = 'block';
		document.getElementById('functionSearchInput').focus();
	},

	// 關閉搜尋對話框
	closeModal: function () {
		document.getElementById('functionSearchModal').style.display = 'none';
	},

	// 執行搜尋
	performSearch: function () {
		const query = document.getElementById('functionSearchInput').value.trim().toLowerCase();
		if (!query) {
			return;
		}

		log.info(`執行函式積木搜尋: "${query}"`);

		const workspace = Blockly.getMainWorkspace();
		if (!workspace) {
			log.warn('無法執行搜尋: 未找到有效的工作區');
			return;
		}

		// 清除先前的搜尋結果
		this.clearResults();

		// 搜尋積木
		this.searchResults = this.searchBlocks(query);

		// 顯示搜尋結果
		this.displayResults();

		// 如果有結果，自動選擇第一個
		if (this.searchResults.length > 0) {
			this.currentResultIndex = 0;
			this.highlightCurrentResult();
			this.updateNavigationVisibility(true);
		} else {
			this.updateNavigationVisibility(false);
		}
	},

	// 在工作區中搜尋積木
	searchBlocks: function (query) {
		const workspace = Blockly.getMainWorkspace();
		const allBlocks = workspace.getAllBlocks(false);

		return allBlocks.filter(block => {
			// 搜尋積木類型
			if (block.type.toLowerCase().includes(query)) {
				return true;
			}

			// 搜尋積木文字內容
			for (const input of block.inputList) {
				for (const field of input.fieldRow) {
					if (!field.isVisible() || !field.getValue()) {
						continue;
					}

					const fieldValue = String(field.getValue()).toLowerCase();
					if (fieldValue.includes(query)) {
						return true;
					}
				}
			}

			return false;
		});
	},

	// 顯示搜尋結果
	displayResults: function () {
		const resultsContainer = document.getElementById('searchResults');
		resultsContainer.innerHTML = '';

		if (this.searchResults.length === 0) {
			const emptyMessage = window.languageManager
				? window.languageManager.getMessage('FUNCTION_SEARCH_NO_RESULTS', '沒有找到匹配的函式積木')
				: '沒有找到匹配的函式積木';

			resultsContainer.innerHTML = `<div class="empty-search-results">${emptyMessage}</div>`;
			return;
		}

		// 創建結果列表
		const resultList = document.createElement('div');
		resultList.className = 'result-list';

		this.searchResults.forEach((block, index) => {
			const resultItem = document.createElement('div');
			resultItem.className = 'result-item';
			resultItem.setAttribute('data-index', index);
			resultItem.id = `search-result-${index}`; // 添加唯一ID

			// 獲取積木預覽文字
			const previewTexts = [];
			block.inputList.forEach(input => {
				input.fieldRow.forEach(field => {
					if (field.isVisible() && field.getValue()) {
						const text = field.getText ? field.getText() : String(field.getValue());
						if (text) {
							previewTexts.push(text);
						}
					}
				});
			});

			const blockName = block.type;
			const previewText = previewTexts.length > 0 ? previewTexts.join(' ') : '';

			const functionPrefix = window.languageManager
				? window.languageManager.getMessage('FUNCTION_RESULT_PREFIX', '函式: ')
				: '函式: ';

			resultItem.innerHTML = `
        <div class="result-title">${functionPrefix}${blockName}</div>
        <div class="result-preview">${previewText}</div>
      `;

			// 點擊結果項時聚焦到積木
			resultItem.addEventListener('click', () => {
				this.currentResultIndex = index;
				this.highlightCurrentResult();
			});

			resultList.appendChild(resultItem);
		});

		resultsContainer.appendChild(resultList);

		// 更新結果計數
		document.getElementById('resultCounter').textContent = `1/${this.searchResults.length}`;
	},

	// 清除所有搜尋結果
	clearResults: function () {
		this.searchResults = [];
		this.currentResultIndex = -1;
		document.getElementById('searchResults').innerHTML = '';
	},

	// 清除高亮顯示
	clearHighlight: function () {
		// 移除所有積木的高亮樣式
		const workspace = Blockly.getMainWorkspace();
		if (workspace) {
			workspace.getAllBlocks().forEach(block => {
				if (block.pathObject && block.pathObject.svgPath) {
					block.pathObject.svgPath.classList.remove('highlight-block');
				}
			});
		}
	},

	// 高亮當前選中的結果
	highlightCurrentResult: function () {
		if (this.currentResultIndex < 0 || this.currentResultIndex >= this.searchResults.length) {
			return;
		}

		// 清除先前的高亮
		this.clearHighlight();

		// 獲取當前積木
		const block = this.searchResults[this.currentResultIndex];

		// 高亮顯示積木
		if (block.pathObject && block.pathObject.svgPath) {
			block.pathObject.svgPath.classList.add('highlight-block');
		}

		// 移動到積木位置
		this.centerOnBlock(block);

		// 更新結果計數
		document.getElementById('resultCounter').textContent = `${this.currentResultIndex + 1}/${this.searchResults.length}`;

		// 更新結果項的視覺選中狀態
		const resultItems = document.querySelectorAll('.result-item');
		resultItems.forEach(item => {
			item.classList.remove('selected');
			if (parseInt(item.getAttribute('data-index')) === this.currentResultIndex) {
				item.classList.add('selected');
				// 確保當前項目在視圖中可見
				item.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
			}
		});
	},

	// 將視圖中心移動到指定積木
	centerOnBlock: function (block) {
		if (!block) {
			return;
		}

		// 通過 Blockly API 將視圖中心移動到積木位置
		Blockly.getMainWorkspace().centerOnBlock(block.id);
	},

	// 導航到下一個結果
	navigateToNextResult: function () {
		if (this.searchResults.length === 0) {
			return;
		}

		this.currentResultIndex = (this.currentResultIndex + 1) % this.searchResults.length;
		this.highlightCurrentResult();
	},

	// 導航到上一個結果
	navigateToPrevResult: function () {
		if (this.searchResults.length === 0) {
			return;
		}

		this.currentResultIndex = (this.currentResultIndex - 1 + this.searchResults.length) % this.searchResults.length;
		this.highlightCurrentResult();
	},

	// 更新導航按鈕的可見性
	updateNavigationVisibility: function (visible) {
		const navContainer = document.querySelector('.search-navigation');
		navContainer.style.display = visible ? 'flex' : 'none';
	},
};

// 主題切換處理函數
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

// 重新整理程式碼處理函數
function handleRefreshCode() {
	try {
		log.info('開始重新整理程式碼...');

		// 獲取重新整理按鈕和圖示
		const refreshButton = document.getElementById('refreshButton');
		const refreshSvg = refreshButton.querySelector('.refresh-svg');

		// 啟動旋轉動畫
		refreshSvg.classList.add('spinning');

		// 獲取工作區
		const workspace = Blockly.getMainWorkspace();
		if (!workspace) {
			log.error('無法獲取 Blockly 工作區');
			return;
		}

		// 根據當前程式語言生成程式碼
		const code = generateCode(workspace);
		const generator = getCurrentGenerator();

		// 發送更新訊息到擴充功能
		vscode.postMessage({
			command: 'updateCode',
			code: code,
			language: window.currentProgrammingLanguage,
			lib_deps: generator.lib_deps_ || [],
			build_flags: generator.build_flags_ || [],
			lib_ldf_mode: generator.lib_ldf_mode_ || null,
		});

		log.info(`程式碼重新整理完成 (語言: ${window.currentProgrammingLanguage})`);

		// 2秒後停止旋轉動畫
		setTimeout(() => {
			refreshSvg.classList.remove('spinning');
		}, 2000);
	} catch (error) {
		log.error('重新整理程式碼時發生錯誤:', error);

		// 停止旋轉動畫
		const refreshButton = document.getElementById('refreshButton');
		const refreshSvg = refreshButton.querySelector('.refresh-svg');
		refreshSvg.classList.remove('spinning');
	}
}

// 更新主題
function updateTheme(theme) {
	const lightIcon = document.getElementById('lightIcon');
	const darkIcon = document.getElementById('darkIcon');

	// 更新 body 的 class，與預覽模式保持一致
	document.body.classList.remove('theme-light', 'theme-dark');
	document.body.classList.add(`theme-${theme}`);

	if (theme === 'dark') {
		lightIcon.style.display = 'none';
		darkIcon.style.display = 'block';

		// 套用深色主題到 Blockly
		if (Blockly.getMainWorkspace()) {
			Blockly.getMainWorkspace().setTheme(window.SingularBlocklyDarkTheme);
		}
	} else {
		lightIcon.style.display = 'block';
		darkIcon.style.display = 'none';

		// 套用淺色主題到 Blockly
		if (Blockly.getMainWorkspace()) {
			Blockly.getMainWorkspace().setTheme(window.SingularBlocklyTheme);
		}
	}
}

// 監聽語言變更事件
window.addEventListener('languageChanged', function (event) {
	log.info(`語言已變更為: ${event.detail.language}`);
	// 更新主編輯視窗UI文字
	updateEditorUITexts();
	// 更新備份管理視窗的文字
	updateBackupModalTexts();
	// 更新函式積木搜尋視窗的文字
	updateFunctionSearchModalTexts();
	// 如果備份列表已顯示，更新其UI
	if (document.getElementById('backupModal').style.display === 'block') {
		// 刷新備份列表以更新按鈕文字
		backupManager.refreshBackupList();
	}
});

document.addEventListener('DOMContentLoaded', async () => {
	log.info('Blockly Edit page loaded');

	// 更新主編輯視窗UI文字的多語言支援
	updateEditorUITexts();

	// 動態生成開發板選項
	populateBoardOptions();
	// 註冊主題切換按鈕事件
	document.getElementById('themeToggle').addEventListener('click', toggleTheme);
	// 註冊重新整理按鈕事件
	document.getElementById('refreshButton').addEventListener('click', handleRefreshCode);

	// 初始化備份管理器
	backupManager.init();
	// 初始化函式積木搜尋功能
	functionSearch.init();
	// 初始化快速備份功能 (Ctrl+S / Cmd+S)
	quickBackup.init();

	// T015: 初始化剪貼簿操作監聽器 (Ctrl+C/V/X)
	// 監聽複製、貼上、剪下操作以鎖定保存
	document.addEventListener('keydown', e => {
		if ((e.ctrlKey || e.metaKey) && ['c', 'v', 'x'].includes(e.key.toLowerCase())) {
			// 開始剪貼簿操作鎖定
			startClipboardLock();
		}
	});
	document.addEventListener('keyup', e => {
		if (['c', 'v', 'x'].includes(e.key.toLowerCase())) {
			// 延遲結束剪貼簿操作鎖定（確保事件處理完成）
			setTimeout(() => {
				endClipboardLock();
			}, 100);
		}
	});
	log.info('剪貼簿操作監聽器已初始化 (Ctrl+C/V/X)');

	// 初始化實驗積木提示
	try {
		if (window.experimentalBlocksNotice) {
			window.experimentalBlocksNotice.init();
		} else {
			log.warn('[實驗積木] 實驗積木提示管理器未定義');
		}
	} catch (e) {
		log.error('[實驗積木] 初始化實驗積木提示時發生錯誤:', e);
	}
	// 在初始化時先輸出一次實驗積木清單
	log.info('初始化階段輸出實驗積木清單');
	logExperimentalBlocks();
	// 載入 toolbox 配置
	const response = await fetch(window.TOOLBOX_URL);
	const toolboxConfig = await response.json();
	// Blockly utils 兼容性包裝器
	const blocklyUtils = {
		replaceMessageReferences: text => {
			// 如果文本為空或未定義，直接返回
			if (!text) {
				return text;
			}

			// 檢查是否有原生 API
			if (Blockly.utils && typeof Blockly.utils.replaceMessageReferences === 'function') {
				return Blockly.utils.replaceMessageReferences(text);
			}

			// 實現自定義的語言變數替換邏輯
			return text.replace(/%{([^}]*)}/g, function (match, key) {
				if (window.languageManager && typeof window.languageManager.getMessage === 'function') {
					return window.languageManager.getMessage(key, match);
				}
				return match; // 如果沒有語言管理器，返回原始匹配文本
			});
		},
		textToDom: xmlString => {
			// 檢查 XML utils API
			if (Blockly.utils && Blockly.utils.xml && typeof Blockly.utils.xml.textToDom === 'function') {
				return Blockly.utils.xml.textToDom(xmlString);
			}
			// 回退到 DOM 解析
			const parser = new DOMParser();
			return parser.parseFromString(xmlString, 'text/xml').documentElement;
		},
	};

	// 新增：在注入前處理 toolbox 配置中的翻譯
	const processTranslations = obj => {
		if (typeof obj === 'object') {
			for (let key in obj) {
				if (typeof obj[key] === 'string') {
					obj[key] = blocklyUtils.replaceMessageReferences(obj[key]);
				} else if (typeof obj[key] === 'object') {
					processTranslations(obj[key]);
				}
			}
		}
		return obj;
	};

	// 處理翻譯
	processTranslations(toolboxConfig);

	// 根據當前主題設定選擇初始主題
	const theme = currentTheme === 'dark' ? window.SingularBlocklyDarkTheme : window.SingularBlocklyTheme;
	const workspace = Blockly.inject('blocklyDiv', {
		toolbox: toolboxConfig,
		theme: theme, // 使用根據設定選擇的主題
		trashcan: true, // 添加垃圾桶
		move: {
			scrollbars: true,
			drag: true,
			wheel: false, // 設為 false 避免與縮放功能衝突
		},
		zoom: {
			controls: true, // 添加放大縮小控制
			wheel: true, // 允許使用滾輪縮放
			startScale: 1.0, // 初始縮放比例
			maxScale: 3, // 最大縮放比例
			minScale: 0.3, // 最小縮放比例
			scaleSpeed: 1.2, // 縮放速度
			pinch: true, // 支援觸控設備的縮放
		},
	});
	// 根據初始主題設定更新 UI
	updateTheme(currentTheme);

	// 創建預設變數 i
	if (!workspace.getVariableMap().getVariable('i')) {
		workspace.getVariableMap().createVariable('i');
	}

	// 初始化時根據當前開發板過濾 toolbox (預設為 arduino_uno)
	// 這確保在沒有儲存狀態時,toolbox 也能正確顯示
	const initialBoard = window.currentBoard || 'arduino_uno';
	await updateToolboxForBoard(workspace, initialBoard);

	// 添加工作區點擊事件，用於清除搜尋高亮顯示
	workspace.getInjectionDiv().addEventListener('click', e => {
		// 檢查點擊是否發生在積木上
		const targetElement = e.target;
		// 如果點擊的是工作區背景或空白區域 (非積木)
		if (!targetElement.closest('.blocklyDraggable') && !targetElement.closest('.blocklyBubbleCanvas')) {
			// 清除所有積木的高亮樣式
			workspace.getAllBlocks().forEach(block => {
				if (block.pathObject && block.pathObject.svgPath) {
					block.pathObject.svgPath.classList.remove('highlight-block');
				}
			});
		}
	});

	// 覆寫變數類別的flyout生成函數
	workspace.registerToolboxCategoryCallback('VARIABLE', function (workspace) {
		const variableBlocks = [];
		// 添加"新增變數"按鈕
		variableBlocks.push(
			blocklyUtils.textToDom('<button text="' + Blockly.Msg['NEW_VARIABLE'] + '" callbackKey="CREATE_VARIABLE"></button>')
		);

		// 為每個現有變數創建積木
		const variables = workspace.getVariableMap().getAllVariables();
		if (variables.length > 0) {
			variables.forEach(variable => {
				variableBlocks.push(
					blocklyUtils.textToDom(
						`<block type="variables_get">
							<field name="VAR" id="${variable.getId()}">${variable.name}</field>
						</block>`
					),
					blocklyUtils.textToDom(
						`<block type="variables_set">
							<field name="VAR" id="${variable.getId()}">${variable.name}</field>
						</block>`
					)
				);
			});
		}

		return variableBlocks;
	});

	// 註冊變數創建按鈕的回調
	workspace.registerButtonCallback('CREATE_VARIABLE', function () {
		vscode.postMessage({
			command: 'promptNewVariable',
			currentName: '',
			isRename: false,
		});
	});

	// 註冊函式類別的 flyout callback
	workspace.registerToolboxCategoryCallback('FUNCTION', function (workspace) {
		const blocks = [];

		// 首先創建函式定義積木
		blocks.push(blocklyUtils.textToDom(`<block type="arduino_function"></block>`));

		// 然後為每個已定義的函式創建調用積木
		const functions = workspace.getBlocksByType('arduino_function', false);
		if (functions.length > 0) {
			functions.forEach(functionBlock => {
				const funcName = functionBlock.getFieldValue('NAME');
				if (funcName) {
					// 為每個已定義的函數創建對應的呼叫積木
					// 函式現在統一為 void 類型，不再有回傳值
					const returnType = 'void'; // 使用新的 XML 格式，包含完整的 mutation 資訊，但統一無回傳值
					let callBlockXml = `
						<block type="arduino_function_call">
							<mutation name="${funcName}" version="1" has_return="false" return_type="void">
					`;

					// 添加函數參數資訊（作為 mutation 的子元素）
					if (functionBlock.arguments_ && functionBlock.arguments_.length > 0) {
						for (let i = 0; i < functionBlock.arguments_.length; i++) {
							const argName = functionBlock.arguments_[i] || '';
							const argType = functionBlock.argumentTypes_[i] || 'int';
							callBlockXml += `<arg name="${argName}" type="${argType}"></arg>`;
						}
					}

					// 關閉 mutation 和 block 標籤
					callBlockXml += '</mutation></block>';

					// 轉換為 DOM 元素並添加到積木列表
					const callBlockDom = blocklyUtils.textToDom(callBlockXml);
					blocks.push(callBlockDom);
				}
			});
		}

		return blocks;
	});

	// 載入鎖定標記，防止 FileWatcher 觸發的 loadWorkspace 立即保存導致無限循環
	let isLoadingFromFileWatcher = false;

	/**
	 * 判斷 Blockly 序列化狀態是否為空
	 * @param {Object} state Blockly.serialization.workspaces.save() 的回傳值
	 * @returns {boolean} true 表示狀態為空
	 */
	const isWorkspaceStateEmpty = state => {
		return !state || !state.blocks || !state.blocks.blocks || state.blocks.blocks.length === 0;
	};

	// 保存工作區狀態的函數
	const saveWorkspaceState = () => {
		// T014: 使用整合的 shouldSkipSave() 守衛條件
		if (shouldSkipSave()) {
			return;
		}

		try {
			const state = Blockly.serialization.workspaces.save(workspace);

			// 空狀態檢查 - 防止意外覆寫有效資料
			if (isWorkspaceStateEmpty(state)) {
				log.warn('跳過保存：工作區為空');
				return;
			}

			vscode.postMessage({
				command: 'saveWorkspace',
				state: state,
				board: boardSelect.value,
				theme: currentTheme, // 確保主題設定被保存
			});
		} catch (error) {
			log.error('保存工作區狀態失敗:', error);
		}
	};
	// 檢查是否為積木相關事件的輔助函數
	const isBlockChangeEvent = event => {
		return (
			event.type === Blockly.Events.BLOCK_MOVE ||
			event.type === Blockly.Events.BLOCK_CHANGE ||
			event.type === Blockly.Events.BLOCK_DELETE ||
			event.type === Blockly.Events.BLOCK_CREATE
		);
	};

	// 拖動狀態追蹤：避免在拖動過程中執行昂貴的操作
	let isDraggingBlock = false;
	let pendingCodeUpdate = false;
	let codeUpdateDebounceTimer = null;

	// === 025-fix-drag-reload-crash: 新增狀態變數 ===
	// T002: 剪貼簿操作鎖定旗標 - 防止 Ctrl+C/V/X 期間觸發不完整儲存
	let isClipboardOperationInProgress = false;
	// T003: FileWatcher 重載請求暫存 - 延遲到拖曳結束後執行
	let pendingReloadFromFileWatcher = null;
	// T004: 剪貼簿操作鎖定計時器
	let clipboardLockTimer = null;
	// T004a: 剪貼簿操作最大鎖定時間（防止無限延長）
	const CLIPBOARD_MAX_LOCK_TIME = 5000; // 5000ms
	let clipboardLockStartTime = null;

	/**
	 * T005: 檢查是否正在拖曳中（雙重檢查機制）
	 * 使用 OR 邏輯同時檢查 isDraggingBlock 旗標和 workspace.isDragging()
	 * @returns {boolean} 是否正在拖曳
	 */
	const isCurrentlyDragging = () => {
		return isDraggingBlock || (workspace && workspace.isDragging());
	};

	/**
	 * T006: 檢查是否應該跳過儲存操作
	 * 整合所有儲存守衛條件：拖曳、剪貼簿鎖定、FileWatcher 載入
	 * @returns {boolean} 是否應該跳過儲存
	 */
	const shouldSkipSave = () => {
		// 條件 1: 正在拖曳中
		if (isCurrentlyDragging()) {
			log.info('跳過保存：正在拖曳');
			return true;
		}
		// 條件 2: 剪貼簿操作鎖定中
		if (isClipboardOperationInProgress) {
			log.info('跳過保存：剪貼簿操作鎖定中');
			return true;
		}
		// 條件 3: 正在從 FileWatcher 載入
		if (isLoadingFromFileWatcher) {
			log.info('跳過保存：正在從 FileWatcher 載入');
			return true;
		}
		return false;
	};

	/**
	 * T007: 執行待處理的 FileWatcher 重載請求
	 * 在拖曳結束後檢查並執行暫存的重載請求
	 */
	const processPendingReload = () => {
		if (pendingReloadFromFileWatcher && !isCurrentlyDragging()) {
			log.info('拖曳結束，執行待處理的 FileWatcher 重載');
			const pendingMessage = pendingReloadFromFileWatcher;
			pendingReloadFromFileWatcher = null;

			// 設置 FileWatcher 載入鎖定
			isLoadingFromFileWatcher = true;

			// 執行重載邏輯（模擬收到 loadWorkspace 訊息）
			try {
				if (pendingMessage.board) {
					const boardSelect = document.getElementById('boardSelect');
					if (boardSelect) {
						boardSelect.value = pendingMessage.board;
						window.setCurrentBoard(pendingMessage.board);
					}
				}
				if (pendingMessage.theme) {
					currentTheme = pendingMessage.theme;
					updateTheme(currentTheme);
				}
				if (pendingMessage.state) {
					Blockly.serialization.workspaces.load(pendingMessage.state, workspace);
					rebuildPwmConfig(workspace);
				}
			} catch (error) {
				log.error('執行待處理的 FileWatcher 重載失敗:', error);
			}

			// 延遲重置鎖定
			setTimeout(() => {
				isLoadingFromFileWatcher = false;
				log.info('FileWatcher 重載完成，恢復保存操作');
			}, 1500);
		}
	};

	/**
	 * T012: 開始剪貼簿操作鎖定
	 * 設置鎖定旗標並啟動安全超時計時器
	 */
	const startClipboardLock = () => {
		isClipboardOperationInProgress = true;
		clipboardLockStartTime = Date.now();

		// 清除之前的計時器
		if (clipboardLockTimer) {
			clearTimeout(clipboardLockTimer);
		}

		// 設置安全超時（防止無限鎖定）
		clipboardLockTimer = setTimeout(() => {
			if (isClipboardOperationInProgress) {
				log.warn(`剪貼簿操作鎖定超過 ${CLIPBOARD_MAX_LOCK_TIME}ms，強制解鎖`);
				endClipboardLock();
			}
		}, CLIPBOARD_MAX_LOCK_TIME);

		log.info('剪貼簿操作開始，設置鎖定');
	};

	/**
	 * T013: 結束剪貼簿操作鎖定
	 * 清除鎖定旗標和計時器
	 */
	const endClipboardLock = () => {
		isClipboardOperationInProgress = false;
		clipboardLockStartTime = null;

		if (clipboardLockTimer) {
			clearTimeout(clipboardLockTimer);
			clipboardLockTimer = null;
		}

		log.info('剪貼簿操作結束，解除鎖定');
	};
	// === 025-fix-drag-reload-crash: 狀態變數結束 ===

	// 視角保持狀態：用於在積木刪除時保持視角位置
	// stableViewport: 持續追蹤「穩定狀態」的視角（沒有拖曳時的位置）
	// viewportState: 當拖曳開始時鎖定的視角（用於恢復）
	// viewportLocked: 是否正在鎖定視角（用於攔截 VIEWPORT_CHANGE 事件）
	// lockedViewport: 鎖定時的視角位置
	let stableViewport = null;
	let viewportState = null;
	let viewportRestoreTimer = null;
	let stableViewportUpdateTimer = null;
	let viewportLocked = false;
	let lockedViewport = null;

	// 延遲執行程式碼更新的函數（避免頻繁更新造成卡頓）
	const debouncedCodeUpdate = () => {
		if (codeUpdateDebounceTimer) {
			clearTimeout(codeUpdateDebounceTimer);
		}
		codeUpdateDebounceTimer = setTimeout(() => {
			try {
				const code = generateCode(workspace);
				const generator = getCurrentGenerator();
				vscode.postMessage({
					command: 'updateCode',
					code: code,
					language: window.currentProgrammingLanguage,
					lib_deps: generator.lib_deps_ || [],
					build_flags: generator.build_flags_ || [],
					lib_ldf_mode: generator.lib_ldf_mode_ || null,
				});
				saveWorkspaceState();
				pendingCodeUpdate = false;
			} catch (err) {
				log.info('代碼生成暫時性錯誤（可能是積木正在拖動）:', err);
			}
		}, 300); // T015: 300ms 延遲，配合剪貼簿操作鎖定機制
	};

	// 單一的工作區變更監聯器
	workspace.addChangeListener(event => {
		// 視角鎖定機制：在刪除進行中時，立即恢復視角以防止閃爍
		if (viewportLocked && event.type === Blockly.Events.VIEWPORT_CHANGE) {
			// 立即將視角拉回鎖定位置
			if (lockedViewport) {
				workspace.scroll(lockedViewport.scrollX, lockedViewport.scrollY);
			}
			return;
		}

		// 持續追蹤穩定的視角位置（在沒有拖曳時更新）
		// 這樣當拖曳開始時，我們有拖曳「之前」的正確視角位置
		// 使用 workspace.scrollX/scrollY 而非 getMetrics().viewLeft/viewTop
		// 因為 scroll() 方法使用的是 scrollX/scrollY 的座標系統
		if (!isDraggingBlock && !viewportRestoreTimer && !viewportLocked) {
			clearTimeout(stableViewportUpdateTimer);
			stableViewportUpdateTimer = setTimeout(() => {
				stableViewport = {
					scrollX: workspace.scrollX,
					scrollY: workspace.scrollY,
					scale: workspace.getScale(),
				};
			}, 50); // 50ms 延遲避免過於頻繁更新
		}

		// 處理 BLOCK_DRAG 事件來追蹤拖動狀態
		if (event.type === Blockly.Events.BLOCK_DRAG) {
			isDraggingBlock = event.isStart;

			// 視角保持機制：在拖曳開始時，使用之前追蹤的穩定視角
			// 因為 BLOCK_DRAG isStart 觸發時，Blockly 可能已經開始移動視角了
			if (event.isStart && !viewportState) {
				// 優先使用之前追蹤的穩定視角，如果沒有則使用當前位置
				if (stableViewport) {
					viewportState = { ...stableViewport };
				} else {
					viewportState = {
						scrollX: workspace.scrollX,
						scrollY: workspace.scrollY,
						scale: workspace.getScale(),
					};
				}
			}

			if (!event.isStart && pendingCodeUpdate) {
				// 拖動結束且有待處理的更新，執行延遲更新
				debouncedCodeUpdate();
			}

			// 拖曳結束但沒有刪除積木時，清除視角狀態（延遲清除以確保不會過早清除）
			if (!event.isStart) {
				setTimeout(() => {
					// 如果沒有進行中的視角恢復計時器，表示沒有刪除事件，可以清除狀態
					if (!viewportRestoreTimer && viewportState) {
						viewportState = null;
					}
				}, 200);

				// T009: 拖曳結束後，延遲 100ms 執行待處理的 FileWatcher 重載請求
				setTimeout(() => {
					processPendingReload();
				}, 100);
			}
			return;
		}

		// 忽略拖動中的 UI 事件
		if (event.isUiEvent) {
			return;
		}

		// 視角保持機制：在積木刪除時鎖定視角位置，防止 Blockly 內部的視角跳動
		if (event.type === Blockly.Events.BLOCK_DELETE) {
			// 立即鎖定視角，使用穩定視角或當前視角
			if (!viewportLocked) {
				lockedViewport = stableViewport
					? { ...stableViewport }
					: {
							scrollX: workspace.scrollX,
							scrollY: workspace.scrollY,
							scale: workspace.getScale(),
					  };
				viewportLocked = true;
			}

			// 使用 debounce 機制處理批次刪除
			clearTimeout(viewportRestoreTimer);
			viewportRestoreTimer = setTimeout(() => {
				// 解除鎖定並做最終恢復
				if (lockedViewport) {
					workspace.scroll(lockedViewport.scrollX, lockedViewport.scrollY);
					if (workspace.getScale() !== lockedViewport.scale) {
						workspace.setScale(lockedViewport.scale);
					}
				}
				// 延遲解除鎖定，確保 Blockly 的所有後續視角變更都被攔截
				setTimeout(() => {
					viewportLocked = false;
					lockedViewport = null;
					viewportState = null;
				}, 200);
				viewportRestoreTimer = null;
			}, 50);
		}

		// 監聽 esp32_pwm_setup 積木的變更並即時更新全域配置
		if (event.type === Blockly.Events.BLOCK_CHANGE && event.blockId) {
			const block = workspace.getBlockById(event.blockId);
			if (block && block.type === 'esp32_pwm_setup') {
				const frequency = parseInt(block.getFieldValue('FREQUENCY')) || 75000;
				const resolution = parseInt(block.getFieldValue('RESOLUTION')) || 8;
				window.esp32PwmFrequency = frequency;
				window.esp32PwmResolution = resolution;
				console.log(`[PWM Config] 即時更新: ${frequency}Hz @ ${resolution}bit`);
			}
		}

		// T013: 剪貼簿操作期間新增積木時動態延長鎖定
		if (event.type === Blockly.Events.BLOCK_CREATE && isClipboardOperationInProgress) {
			// 檢查是否已超過最大鎖定時間
			const lockDuration = clipboardLockStartTime ? Date.now() - clipboardLockStartTime : 0;
			if (lockDuration < CLIPBOARD_MAX_LOCK_TIME) {
				// 重設鎖定計時器，延長鎖定直到所有積木建立完成
				if (clipboardLockTimer) {
					clearTimeout(clipboardLockTimer);
				}
				clipboardLockTimer = setTimeout(() => {
					endClipboardLock();
				}, 300); // 300ms 後如果沒有新的 BLOCK_CREATE 事件就解除鎖定
				log.info('剪貼簿操作：偵測到新積木建立，延長鎖定時間');
			}
		}

		// 監聽 esp32_pwm_setup 積木的新增/刪除
		if (event.type === Blockly.Events.BLOCK_CREATE || event.type === Blockly.Events.BLOCK_DELETE) {
			// 檢查是否是 esp32_pwm_setup 積木
			let isEsp32PwmBlock = false;
			if (event.type === Blockly.Events.BLOCK_DELETE && event.oldJson && event.oldJson.type === 'esp32_pwm_setup') {
				isEsp32PwmBlock = true;
			} else if (event.type === Blockly.Events.BLOCK_CREATE && event.blockId) {
				const block = workspace.getBlockById(event.blockId);
				if (block && block.type === 'esp32_pwm_setup') {
					isEsp32PwmBlock = true;
				}
			}

			// 延遲重建配置,確保所有積木事件完成
			setTimeout(() => {
				rebuildPwmConfig(workspace);

				// 如果是 esp32_pwm_setup 積木的新增/刪除，立即觸發程式碼更新
				if (isEsp32PwmBlock) {
					console.log('[PWM Config] PWM 設定積木變動，觸發程式碼更新');
					try {
						const code = generateCode(workspace);
						const generator = getCurrentGenerator();
						vscode.postMessage({
							command: 'updateCode',
							code: code,
							language: window.currentProgrammingLanguage,
							libDeps: generator.lib_deps_ || [],
							buildFlags: generator.build_flags_ || [],
						});
					} catch (error) {
						console.error('[PWM Config] 程式碼生成失敗:', error);
					}
				}
			}, 100);
		}

		// 工作區完全載入後修復函數呼叫積木和連接點
		if (event.type === Blockly.Events.FINISHED_LOADING) {
			// 工作區載入完成時輸出實驗積木清單
			log.info('工作區載入完成，輸出實驗積木清單');
			logExperimentalBlocks();

			// 工作區載入完成後，自動更新實驗積木清單
			log.info('工作區載入完成，更新實驗積木清單');
			updateExperimentalBlocksList(workspace);

			// 檢查是否需要顯示實驗積木提示
			setTimeout(() => {
				experimentalBlocksNotice.checkAndShow();
			}, 1000);

			// 收集工具箱中的實驗積木
			if (typeof window.collectExperimentalBlocksFromFlyout === 'function') {
				log.info('工作區載入完成，收集工具箱中的實驗積木');
				window.collectExperimentalBlocksFromFlyout();
			}

			// 延遲執行以確保所有積木已完全載入
			setTimeout(() => {
				log.info('工作區載入完成，開始修復函數呼叫積木關聯');

				// 1. 獲取所有函數定義積木
				const functionBlocks = workspace.getBlocksByType('arduino_function', false);
				const functionNamesMap = new Map();

				// 2. 建立函數名稱映射表
				functionBlocks.forEach(block => {
					const name = block.getFieldValue('NAME');
					if (name) {
						functionNamesMap.set(name, block);
					}
				});

				// 3. 更新所有函數呼叫積木
				const callBlocks = workspace.getBlocksByType('arduino_function_call', false);
				callBlocks.forEach(block => {
					// 強制更新呼叫積木
					block.updateFromFunctionBlock_();
					log.info(`修復函數呼叫積木: ${block.getFieldValue('NAME')}`);
				});

				// 4. 為所有函數呼叫積木重建連接點
				if (window._functionCallBlocks && window._functionCallBlocks.length > 0) {
					log.info(`開始重建 ${window._functionCallBlocks.length} 個函數呼叫積木的連接點`);

					// 進行兩次連接嘗試，以增加成功率
					window._functionCallBlocks.forEach(block => {
						try {
							// 檢查呼叫積木是否還在工作區中
							if (block.workspace) {
								// 第一次嘗試：通過更新函數定義來重建連接
								block.updateFromFunctionBlock_();

								// 強制立即更新形狀
								if (block._doUpdateShape) {
									block._doUpdateShape();
								}

								log.info(`重建 ${block.getFieldValue('NAME')} 連接點完成`);
							}
						} catch (err) {
							log.warn(`重建函數呼叫積木連接失敗:`, err);
						}
					});

					// 重置追蹤列表，避免重複處理
					window._functionCallBlocks = [];
				}

				log.info('函數呼叫積木修復完成');

				// 5. 觸發工作區變更，確保連接狀態刷新
				try {
					// 使用標準的 fireChangeListener 方法來觸發變更事件
					const changeEvent = new Blockly.Events.BlockMove();
					workspace.fireChangeListener(changeEvent);
					log.info('工作區連接狀態已刷新');
				} catch (err) {
					log.warn('刷新工作區連接狀態失敗:', err);
				}
			}, 800); // 延長等待時間，確保所有積木已完全載入和初始化
		}
		// 監聽函數定義變更，自動刷新工具箱
		if (isBlockChangeEvent(event)) {
			// 檢查是否是函數積木的變更
			const isRelatedToFunction = event.type === Blockly.Events.BLOCK_CREATE || event.type === Blockly.Events.BLOCK_DELETE;

			if (isRelatedToFunction) {
				const block = workspace.getBlockById(event.blockId);
				if (block && block.type === 'arduino_function') {
					// 強制刷新函數類別
					if (workspace.toolbox_) {
						// 延遲執行以避免頻繁刷新
						if (workspace._refreshFunctionTimeout) {
							clearTimeout(workspace._refreshFunctionTimeout);
						}

						workspace._refreshFunctionTimeout = setTimeout(() => {
							workspace.toolbox_.refreshSelection();
						}, 300);
					}
				}
			}
		} // 更新程式碼
		if (isBlockChangeEvent(event)) {
			// 記錄積木變動事件
			const eventType = event.type.toString().replace('Blockly.Events.', '');
			const blockId = event.blockId || '(未知ID)';
			let blockInfo = '(未知積木)';
			let blockType = null;

			// 對於刪除事件，需要特殊處理，因為積木已經從工作區中移除
			if (event.type === Blockly.Events.BLOCK_DELETE) {
				// 對於刪除事件，我們可以從事件的oldJson屬性中獲取積木類型
				if (event.oldJson && event.oldJson.type) {
					blockType = event.oldJson.type;
					blockInfo = `刪除的積木類型: ${blockType}`; // 檢查被刪除的積木是否在實驗積木清單中
					if (window.experimentalBlocks.includes(blockType)) {
						log.info(`偵測到實驗性積木被刪除: ${blockType}`);

						// 檢查工作區中是否還有同類型的其他積木
						const sameTypeBlocks = workspace.getBlocksByType(blockType, false); // 積木被刪除，但不從實驗積木清單中移除，確保記錄完整
						// 只記錄日誌，不調用 unregisterExperimentalBlock
						if (!sameTypeBlocks || sameTypeBlocks.length === 0) {
							log.info(`工作區中已沒有 ${blockType} 積木，但保留在實驗積木清單中`);
						} else {
							log.info(`工作區仍有 ${sameTypeBlocks.length} 個 ${blockType} 積木，保留在實驗積木清單中`);
						}
					}
				}
			} else {
				// 對於非刪除事件，嘗試獲取更多積木信息
				try {
					const block = workspace.getBlockById(blockId);
					if (block) {
						blockType = block.type;
						blockInfo = `類型: ${blockType}`;
					}
				} catch (e) {
					// 忽略錯誤
				}
			}
			log.info(`積木變動事件: ${eventType}, ID: ${blockId}, ${blockInfo}`);

			// 檢查是否是實驗性積木
			let isExperimental = false;
			if (blockType && window.experimentalBlocks.includes(blockType)) {
				isExperimental = true;
				log.info(`注意: 變動的積木 "${blockType}" 已在實驗積木清單中`);

				// 如果使用了實驗積木，顯示提示
				experimentalBlocksNotice.checkAndShow();
			} else if (blockType && window.potentialExperimentalBlocks.includes(blockType)) {
				log.info(`注意: 變動的積木 "${blockType}" 是潛在實驗積木，將在更新清單時檢查`);
			} // 在積木創建或刪除後，更新實驗積木清單
			if (event.type === Blockly.Events.BLOCK_CREATE || event.type === Blockly.Events.BLOCK_DELETE) {
				// 延遲執行以確保其他事件處理已完成
				setTimeout(() => {
					log.info('檢測到積木變動，主動更新實驗積木清單');
					updateExperimentalBlocksList(workspace);

					// 積木變動後檢查是否需要顯示實驗積木提示
					window.experimentalBlocksNotice.checkAndShow();

					// 積木變動時也嘗試收集工具箱中的實驗積木
					if (typeof window.collectExperimentalBlocksFromFlyout === 'function') {
						log.info('積木變動，收集工具箱中的實驗積木');
						window.collectExperimentalBlocksFromFlyout();
					}
				}, 100);
			}

			// 輸出最新的實驗積木清單（僅非拖動時）
			if (!isDraggingBlock) {
				log.info('實驗積木清單檢查開始 >>>>>>');
				logExperimentalBlocks();
				log.info('實驗積木清單檢查結束 <<<<<<');
			}

			// 程式碼更新：拖動中時延遲執行，避免卡頓
			if (isDraggingBlock) {
				// 標記有待處理的更新，等拖動結束後執行
				pendingCodeUpdate = true;
			} else {
				// 非拖動時使用 debounce 更新，避免短時間內多次更新
				debouncedCodeUpdate();
			}
		}
	});

	// 處理開發板選擇
	const boardSelect = document.getElementById('boardSelect');
	boardSelect.addEventListener('change', async event => {
		const selectedBoard = event.target.value;
		const previousBoard = window.currentBoard || 'none';

		// 取得舊板子和新板子的語言類型
		const previousConfig = window.BOARD_CONFIGS[previousBoard];
		const newConfig = window.BOARD_CONFIGS[selectedBoard];
		const previousLanguage = previousConfig?.language || 'arduino';
		const newLanguage = newConfig?.language || 'arduino';

		// 檢測語言類型是否變更（arduino ↔ micropython）
		const isLanguageChanging = previousLanguage !== newLanguage;

		// 檢查工作區是否為空
		const workspaceState = Blockly.serialization.workspaces.save(workspace);
		const hasBlocks = workspaceState?.blocks?.blocks && workspaceState.blocks.blocks.length > 0;

		// 標記是否需要強制儲存（當工作區被清空後）
		let forceEmptySave = false;

		// 如果語言變更且工作區非空，顯示確認對話框
		if (isLanguageChanging && hasBlocks) {
			log.info(`[blockly] 偵測到語言變更 (${previousLanguage} → ${newLanguage})，工作區非空，顯示確認對話框`);

			// 構建確認訊息
			const warningTitle = window.languageManager
				? window.languageManager.getMessage('BOARD_SWITCH_WARNING_TITLE', '切換開發板類型')
				: '切換開發板類型';
			const warningMessage = window.languageManager
				? window.languageManager.getMessage(
						'BOARD_SWITCH_WARNING_MESSAGE',
						'切換到不同類型的開發板將清空目前的工作區。\n系統會先自動備份您的工作。\n\n確定要繼續嗎？'
				  )
				: '切換到不同類型的開發板將清空目前的工作區。\n系統會先自動備份您的工作。\n\n確定要繼續嗎？';

			// 使用非同步確認對話框（VSCode 原生 API）
			const confirmed = await showAsyncConfirm(`${warningTitle}\n\n${warningMessage}`);

			if (!confirmed) {
				// 用戶取消，恢復原來的板子選擇
				log.info('[blockly] 用戶取消切換，恢復原板子選擇');
				boardSelect.value = previousBoard;
				return;
			}

			// 用戶確認，執行自動備份
			log.info('[blockly] 用戶確認切換，執行自動備份');
			const backupName = quickBackup.generateBackupName();
			vscode.postMessage({
				command: 'createBackup',
				name: backupName,
				state: workspaceState,
				board: previousBoard,
				theme: currentTheme,
				isQuickBackup: true,
			});

			// 顯示備份成功 Toast
			const backupSuccessTemplate = window.languageManager
				? window.languageManager.getMessage('BACKUP_QUICK_SAVE_SUCCESS', '備份已儲存：{0}')
				: '備份已儲存：{0}';
			const backupSuccessMessage = backupSuccessTemplate.replace('{0}', backupName);
			toast.show(backupSuccessMessage, 'success');

			// 清空工作區
			log.info('[blockly] 清空工作區');
			workspace.clear();

			// 標記需要強制儲存空工作區
			forceEmptySave = true;
		} else if (isLanguageChanging && !hasBlocks) {
			log.info(`[blockly] 偵測到語言變更 (${previousLanguage} → ${newLanguage})，工作區為空，跳過確認對話框`);
		}

		// 更新全局的currentBoard
		window.setCurrentBoard(selectedBoard);
		// 根據開發板更新 toolbox (顯示/隱藏 ESP32 專屬積木)
		await updateToolboxForBoard(workspace, selectedBoard);
		// 觸發工作區更新以重新整理積木
		workspace.getAllBlocks().forEach(block => {
			if (block.type.startsWith('arduino_')) {
				block.render();
			}
		});

		// CyberBrick 專用邏輯
		const boardConfig = window.BOARD_CONFIGS[selectedBoard];
		if (boardConfig?.language === 'micropython') {
			// 切換到 MicroPython 主板時，刪除 platformio.ini 避免與 PlatformIO 衝突
			log.info('[blockly] 切換到 MicroPython 主板，發送刪除 platformio.ini 請求');
			vscode.postMessage({ command: 'deletePlatformioIni' });
		}

		vscode.postMessage({
			command: 'updateBoard',
			board: selectedBoard,
			lib_deps: window.arduinoGenerator.lib_deps_ || [],
			build_flags: window.arduinoGenerator.build_flags_ || [],
			lib_ldf_mode: window.arduinoGenerator.lib_ldf_mode_ || null,
		});

		// 如果需要強制儲存（工作區被清空後），直接發送空狀態
		if (forceEmptySave) {
			log.info('[blockly] 強制儲存空工作區狀態與新板子設定');
			const emptyState = Blockly.serialization.workspaces.save(workspace);
			vscode.postMessage({
				command: 'saveWorkspace',
				state: emptyState,
				board: selectedBoard,
				theme: currentTheme,
			});
		} else {
			saveWorkspaceState();
		}
	});

	// 監聽來自擴充功能的訊息
	window.addEventListener('message', async event => {
		const message = event.data;
		const workspace = Blockly.getMainWorkspace();
		log.info(`收到訊息: ${message.command}`, message);

		switch (message.command) {
			case 'createVariable':
				if (message.name) {
					if (message.isRename && message.oldName) {
						// 修正：直接使用變數 ID 進行重命名
						const variable = workspace.getVariableMap().getVariable(message.oldName);
						if (variable) {
							// 使用 workspace 的 renameVariableById 方法
							workspace.renameVariableById(variable.getId(), message.name);
							// 觸發工作區變更事件以更新程式碼
							workspace.fireChangeListener({
								type: Blockly.Events.VAR_RENAME,
								varId: variable.getId(),
								oldName: message.oldName,
								newName: message.name,
							});
						}
					} else {
						// 新增變數，直接使用 workspace 的方法
						const existingVar = workspace.getVariableMap().getVariable(message.name);
						if (!existingVar) {
							workspace.getVariableMap().createVariable(message.name);
							// 觸發更新
							const code = generateCode(workspace);
							vscode.postMessage({
								command: 'updateCode',
								code: code,
								language: window.currentProgrammingLanguage,
							});
							saveWorkspaceState();
						}
					}
				}
				break;
			case 'deleteVariable':
				if (message.confirmed) {
					const variable = workspace.getVariableMap().getVariable(message.name);
					if (variable) {
						const varId = variable.getId();
						// 先找出所有使用這個變數的積木
						const blocks = workspace
							.getBlocksByType('variables_get')
							.concat(workspace.getBlocksByType('variables_set'))
							.filter(block => block.getField('VAR').getText() === message.name);
						// 移除所有使用這個變數的積木
						blocks.forEach(block => {
							block.dispose(false);
						});
						// 從工作區中移除變數定義
						workspace.deleteVariableById(varId);
						// 手動觸發更新
						const code = generateCode(workspace);
						vscode.postMessage({
							command: 'updateCode',
							code: code,
							language: window.currentProgrammingLanguage,
						});
						saveWorkspaceState();
					}
				}
				break;
			case 'confirmDialogResult':
				// 處理從VSCode傳回的確認對話框結果
				if (message.confirmId !== undefined) {
					const callback = pendingConfirmCallbacks.get(message.confirmId);
					if (callback) {
						// 從等待清單中移除這個回調
						pendingConfirmCallbacks.delete(message.confirmId);

						// 根據用途處理不同的邏輯
						if (message.purpose === 'blocklyDelete') {
							// 原本的 Blockly 刪除積木用途
							// 如果使用者確認要刪除方塊
							if (message.confirmed) {
								// 執行刪除工作區中所有方塊的操作
								workspace.clear();

								// 更新程式碼和保存工作區狀態
								const code = generateCode(workspace);
								vscode.postMessage({
									command: 'updateCode',
									code: code,
									language: window.currentProgrammingLanguage,
								});
								saveWorkspaceState();
							}
						} else {
							// 其他用途（如板子切換），直接呼叫回調函數
							// 讓呼叫者自行處理後續邏輯
							// 安全檢查：確保 callback 是一個函數再調用
							if (typeof callback === 'function') {
								callback(message.confirmed);
							}
						}
					}
				}
				break;
			// 新增：處理獲取板子設定的請求
			case 'getBoardConfig':
				// 從全局函數獲取板子設定
				log.info(`收到獲取板子設定請求，板子類型: ${message.board}`);
				if (typeof window.getBoardConfig === 'function') {
					const config = window.getBoardConfig(message.board);
					log.info(`找到板子設定: `, config);
					// 回傳設定到擴充功能
					vscode.postMessage({
						command: 'boardConfigResult',
						config: config,
						messageId: message.messageId, // 返回原始訊息ID以便識別
					});
					log.info(`已發送設定回覆，訊息ID: ${message.messageId}`);
				} else {
					// 如果函數不存在，返回空字串
					log.warn('在 WebView 中找不到 getBoardConfig 函數');
					vscode.postMessage({
						command: 'boardConfigResult',
						config: '',
						messageId: message.messageId,
					});
				}
				break;
			case 'loadWorkspace':
				try {
					// 如果是 FileWatcher 觸發的重載，設置鎖定標記防止無限循環
					const isFromFileWatcher = message.source === 'fileWatcher';

					// T008: 如果是 FileWatcher 觸發且正在拖曳，延遲執行重載
					if (isFromFileWatcher && isCurrentlyDragging()) {
						log.info('[FileWatcher] 偵測到拖曳中，延遲重載請求');
						pendingReloadFromFileWatcher = {
							state: message.state,
							board: message.board,
							theme: message.theme,
						};
						return; // 提前返回，等待拖曳結束後執行
					}

					if (isFromFileWatcher) {
						isLoadingFromFileWatcher = true;
						log.info('FileWatcher 觸發的工作區重載，暫停保存操作');
					}

					if (message.board) {
						// 取得當前板子以比較是否實際變更
						const previousBoard = boardSelect.value;
						// 先設定板子類型
						boardSelect.value = message.board;
						window.setCurrentBoard(message.board);
						// 根據開發板更新 toolbox (顯示/隱藏 ESP32 專屬積木)
						await updateToolboxForBoard(workspace, message.board);
						// 只有當板子實際變更時才發送 updateBoard 訊息
						// 避免載入工作區時誤觸發 PlatformIO 重新檢查
						if (previousBoard !== message.board) {
							log.info(`開發板從 ${previousBoard} 變更為 ${message.board}，發送更新訊息`);
							vscode.postMessage({
								command: 'updateBoard',
								board: message.board,
							});
						}

						// CyberBrick 專案載入時，確保刪除 platformio.ini 避免衝突
						const boardConfig = window.BOARD_CONFIGS[message.board];
						if (boardConfig?.language === 'micropython') {
							log.info('[blockly] 載入 MicroPython 專案，檢查並刪除 platformio.ini');
							vscode.postMessage({ command: 'deletePlatformioIni' });
						}
					}

					// 載入主題設定
					if (message.theme) {
						currentTheme = message.theme;
						updateTheme(currentTheme);
					}

					if (message.state) {
						// 儲存函數名稱以用於追蹤變更
						const preSaveFunctionNames = new Map();
						try {
							// 先取得工作區中的函數名稱以進行比較
							workspace.getBlocksByType('arduino_function', false).forEach(block => {
								const name = block.getFieldValue('NAME');
								if (name) {
									preSaveFunctionNames.set(block.id, name);
								}
							});
						} catch (e) {
							log.info('取得現有函數名稱失敗', e);
						}

						// 然後再載入工作區內容
						Blockly.serialization.workspaces.load(message.state, workspace);

						// 重建 ESP32 PWM 配置
						rebuildPwmConfig(workspace);

						// 工作區載入後，立即修復函數名稱關聯
						setTimeout(() => {
							log.info('工作區載入完成，修復函數名稱關聯');

							// 取得所有函數積木
							const functionBlocks = workspace.getBlocksByType('arduino_function', false);

							// 記錄函數定義的名稱變更
							const functionNameChanges = new Map();
							functionBlocks.forEach(block => {
								const oldName = preSaveFunctionNames.get(block.id);
								const newName = block.getFieldValue('NAME');
								if (oldName && newName && oldName !== newName) {
									log.info(`檢測到函數名稱變更: ${oldName} -> ${newName}`);
									functionNameChanges.set(oldName, newName);

									// 將新名稱保存到 oldName_ 屬性中，以便後續修改名稱時能正確比較
									block.oldName_ = newName;
								}
							});

							// 應用名稱變更到所有函數呼叫積木
							if (functionNameChanges.size > 0) {
								const callBlocks = workspace.getBlocksByType('arduino_function_call', false);
								callBlocks.forEach(block => {
									const currentName = block.getFieldValue('NAME');
									const newName = functionNameChanges.get(currentName);
									if (newName) {
										log.info(`更新函數呼叫積木名稱: ${currentName} -> ${newName}`);

										// 更新名稱
										const nameField = block.getField('NAME');
										if (nameField) {
											nameField.setValue(newName);
										}
									}
								});
							}

							// 強制更新所有函數呼叫積木
							const callBlocks = workspace.getBlocksByType('arduino_function_call', false);
							callBlocks.forEach(callBlock => {
								try {
									log.info(`更新函數呼叫積木: ${callBlock.getFieldValue('NAME')}`);
									callBlock.updateFromFunctionBlock_();
								} catch (err) {
									log.error('更新函數呼叫積木失敗:', err);
								}
							});

							// 更新程式碼
							try {
								const code = generateCode(workspace);
								vscode.postMessage({
									command: 'updateCode',
									code: code,
									language: window.currentProgrammingLanguage,
								});
							} catch (err) {
								log.warn('更新程式碼失敗:', err);
							}
						}, 300);
					}

					// 如果是 FileWatcher 觸發的重載，延遲後重置鎖定標記
					if (isFromFileWatcher) {
						setTimeout(() => {
							isLoadingFromFileWatcher = false;
							log.info('FileWatcher 重載完成，恢復保存操作');
						}, 1500); // 給足夠時間讓所有事件處理完成
					}
				} catch (error) {
					log.error('載入工作區狀態失敗:', error);
					// 發生錯誤時也要重置鎖定標記
					isLoadingFromFileWatcher = false;
				}
				break;
			case 'setTheme':
				// 直接從 VSCode 設定主題
				currentTheme = message.theme || 'light';
				updateTheme(currentTheme);
				break;

			// 處理備份列表回應
			case 'backupListResponse':
				backupManager.updateBackupListUI(message.backups);
				break;

			// 處理備份建立回應
			case 'backupCreated':
				backupManager.refreshBackupList();
				break; // 處理備份刪除回應
			case 'backupDeleted':
				backupManager.refreshBackupList();
				break;

			// 處理備份還原回應
			case 'backupRestored':
				if (message.success) {
					// 關閉備份對話框
					backupManager.closeModal();
					// 顯示成功訊息
					vscode.postMessage({
						command: 'log',
						source: 'blocklyEdit',
						level: 'info',
						message: `成功還原備份: ${message.name}`,
						timestamp: new Date().toISOString(),
					});
				}
				break;

			// 處理自動備份設定回應
			case 'autoBackupSettingsResponse':
				backupManager.updateAutoBackupUI(message.interval);
				break;

			// CyberBrick MicroPython 上傳功能
			case 'uploadProgress':
				handleUploadProgress(message);
				break;

			case 'uploadResult':
				handleUploadResult(message);
				break;

			case 'portListResponse':
				handlePortListResponse(message);
				break;
		}
	});

	// 請求初始狀態
	vscode.postMessage({
		command: 'requestInitialState',
	});

	// handleResize 的定義
	const handleResize = () => {
		Blockly.svgResize(workspace);
	};

	// 註冊到 window 的 resize 事件
	window.addEventListener('resize', handleResize);

	// 初始觸發一次 resize
	handleResize();

	// 添加監聽右鍵選單中的「整理方塊」操作
	const originalCleanUp = Blockly.WorkspaceSvg.prototype.cleanUp;
	if (originalCleanUp) {
		Blockly.WorkspaceSvg.prototype.cleanUp = function () {
			// 呼叫原始的清理函數
			originalCleanUp.call(this);

			// 當清理完成後，延遲一點時間儲存工作區狀態
			// 這確保了「整理方塊」操作後座標變更會被正確儲存
			setTimeout(() => {
				const state = Blockly.serialization.workspaces.save(this);
				vscode.postMessage({
					command: 'saveWorkspace',
					state: state,
					board: boardSelect.value,
					theme: currentTheme, // 確保在整理方塊後也保存主題設定
				});
				log.info('方塊整理完成，已儲存工作區狀態');
			}, 300);
		};
	}

	// 覆寫變數下拉選單的創建方法
	Blockly.FieldVariable.dropdownCreate = function () {
		const workspace = Blockly.getMainWorkspace();
		// 修改這行：使用變數的 ID 作為值
		const variableList = workspace
			.getVariableMap()
			.getAllVariables()
			.map(variable => [variable.name, variable.getId()]);
		// 加入分隔線與選項
		if (variableList.length > 0) {
			const currentName = this.getText(); // 獲取當前變數名稱
			variableList.push(['---', '---']);
			variableList.push([Blockly.Msg['RENAME_VARIABLE'], Blockly.Msg['RENAME_VARIABLE']]);
			variableList.push([Blockly.Msg['DELETE_VARIABLE'].replace('%1', currentName), Blockly.Msg['DELETE_VARIABLE']]);
			variableList.push(['---', '---']);
		}
		variableList.push([Blockly.Msg['NEW_VARIABLE'], Blockly.Msg['NEW_VARIABLE']]);
		return variableList;
	};

	// 覆寫變數下拉選單的變更監聽器
	Blockly.FieldVariable.prototype.onItemSelected_ = function (menu, menuItem) {
		const workspace = this.sourceBlock_.workspace;
		const value = menuItem.getValue();
		if (value === Blockly.Msg['NEW_VARIABLE']) {
			// 請求使用者輸入新變數名稱
			vscode.postMessage({
				command: 'promptNewVariable',
				currentName: '',
			});
		} else if (value === Blockly.Msg['RENAME_VARIABLE']) {
			const id = this.getValue();
			const variable = workspace.getVariableMap().getVariableById(id);
			if (variable) {
				// 請求使用者輸入新名稱
				vscode.postMessage({
					command: 'promptNewVariable',
					currentName: variable.name,
					isRename: true,
				});
			}
		} else if (value === Blockly.Msg['DELETE_VARIABLE']) {
			const id = this.getValue();
			const variable = workspace.getVariableMap().getVariableById(id);
			if (variable) {
				// 詢問使用者是否要刪除變數
				vscode.postMessage({
					command: 'confirmDeleteVariable',
					variableName: variable.name,
				});
			}
		} else if (value !== '---') {
			// 正常選擇變數：直接使用變數 ID
			this.setValue(value);
		}
	};

	// 覆寫 Blockly 的變數創建函數，避免使用內建對話框
	Blockly.Variables.createVariable = function (workspace, opt_callback, opt_type) {
		// 直接發送訊息給 VS Code，要求輸入新變數名稱
		vscode.postMessage({
			command: 'promptNewVariable',
			currentName: '',
			type: opt_type || '',
		});
	};
});

// 覆寫 Blockly 的字串替換函數以支援多語言
Blockly.utils.replaceMessageReferences = function (message) {
	if (!message) {
		return message;
	}
	return message.replace(/%{([^}]*)}/g, function (match, key) {
		if (window.languageManager && typeof window.languageManager.getMessage === 'function') {
			return window.languageManager.getMessage(key, match);
		}
		return match;
	});
};

/**
 * 從工作區重建 ESP32 PWM 配置
 * 掃描工作區中的 esp32_pwm_setup 積木並重建全域變數
 * @param {Blockly.Workspace} workspace - Blockly 工作區實例
 */
function rebuildPwmConfig(workspace) {
	try {
		const pwmBlocks = workspace.getAllBlocks().filter(block => block.type === 'esp32_pwm_setup');

		if (pwmBlocks.length > 0) {
			// 多個 PWM 設定積木時,以最後一個為準 (後蓋前原則)
			const lastBlock = pwmBlocks[pwmBlocks.length - 1];
			window.esp32PwmFrequency = parseInt(lastBlock.getFieldValue('FREQUENCY')) || 75000;
			window.esp32PwmResolution = parseInt(lastBlock.getFieldValue('RESOLUTION')) || 8;
			console.log(`[PWM Config] 從積木重建: ${window.esp32PwmFrequency}Hz @ ${window.esp32PwmResolution}bit`);
		} else {
			// 無 PWM 設定積木,使用預設值
			window.esp32PwmFrequency = 75000;
			window.esp32PwmResolution = 8;
			console.log('[PWM Config] 使用預設值: 75000Hz @ 8bit');
		}
	} catch (error) {
		console.error('[PWM Config] 重建失敗:', error);
		// 容錯:設定預設值
		window.esp32PwmFrequency = 75000;
		window.esp32PwmResolution = 8;
	}
}

/**
 * 根據開發板類型動態更新 toolbox 以顯示或隱藏 ESP32 專屬積木
 * 也支援 CyberBrick（MicroPython）的工具箱切換
 * @param {Blockly.WorkspaceSvg} workspace - Blockly 工作區實例
 * @param {string} boardId - 開發板 ID (例如 'esp32', 'esp32_super_mini', 'arduino_uno', 'cyberbrick')
 */
async function updateToolboxForBoard(workspace, boardId) {
	try {
		// 檢查是否為 CyberBrick（MicroPython）
		const isCyberBrick = boardId === 'cyberbrick';

		// 根據開發板類型選擇工具箱 URL
		const toolboxUrl = isCyberBrick ? window.CYBERBRICK_TOOLBOX_URL : window.TOOLBOX_URL;

		// 重新載入對應的 toolbox 配置
		const response = await fetch(toolboxUrl);
		let toolboxConfig = await response.json();

		// 檢查是否為 ESP32 系列開發板（包括 CyberBrick 的某些功能）
		const isESP32Board = boardId === 'esp32' || boardId === 'esp32_super_mini';

		// 如果不是 CyberBrick，才需要過濾 ESP32 專屬積木
		if (!isCyberBrick) {
			// 遞迴過濾 toolbox 中的積木和分類
			const filterToolboxContents = contents => {
				if (!contents || !Array.isArray(contents)) return contents;

				return contents.filter(item => {
					// 如果是 esp32_pwm_setup 積木,只在 ESP32 開發板時顯示
					if (item.type === 'esp32_pwm_setup') {
						return isESP32Board;
					}

					// 如果是「通訊」分類 (communication),只在 ESP32 開發板時顯示
					if (item.kind === 'category' && item.name === '%{CATEGORY_COMMUNICATION}') {
						return isESP32Board;
					}

					// 如果是 category,遞迴處理其內容
					if (item.kind === 'category' && item.contents) {
						item.contents = filterToolboxContents(item.contents);
					}

					// 保留其他所有項目
					return true;
				});
			};

			// 處理 toolbox 根層級
			if (toolboxConfig.contents) {
				toolboxConfig.contents = filterToolboxContents(toolboxConfig.contents);
			}
		}

		// 處理翻譯 (與初始化時相同)
		const blocklyUtils = {
			replaceMessageReferences: text => {
				if (!text) return text;
				if (Blockly.utils && typeof Blockly.utils.replaceMessageReferences === 'function') {
					return Blockly.utils.replaceMessageReferences(text);
				}
				if (typeof text !== 'string') return text;
				return text.replace(/%\{([^}]+)\}/g, (match, key) => {
					return Blockly.Msg[key] || match;
				});
			},
		};

		const processTranslations = obj => {
			if (typeof obj === 'object') {
				for (let key in obj) {
					if (typeof obj[key] === 'string') {
						obj[key] = blocklyUtils.replaceMessageReferences(obj[key]);
					} else if (typeof obj[key] === 'object') {
						processTranslations(obj[key]);
					}
				}
			}
			return obj;
		};

		processTranslations(toolboxConfig);

		// 更新 workspace 的 toolbox
		workspace.updateToolbox(toolboxConfig);
		console.log(`[blockly] 已根據開發板 ${boardId} 更新工具箱 (CyberBrick: ${isCyberBrick}, ESP32: ${isESP32Board})`);

		// 更新 UI 元素（上傳按鈕、生成器切換等）
		updateUIForBoard(boardId, isCyberBrick);

		// 更新工作區中已存在的 ESP32 專屬積木警告（僅針對 Arduino 板）
		if (!isCyberBrick) {
			updateEsp32BlockWarnings(workspace, isESP32Board);
		}
	} catch (error) {
		console.error('[blockly] 工具箱更新失敗:', error);
	}
}

/**
 * 根據開發板更新 UI 元素（上傳按鈕、生成器等）
 * @param {string} boardId - 開發板 ID
 * @param {boolean} isCyberBrick - 是否為 CyberBrick
 */
function updateUIForBoard(boardId, isCyberBrick) {
	// 更新上傳按鈕顯示/隱藏
	const uploadContainer = document.getElementById('uploadContainer');
	const uploadButton = document.getElementById('uploadButton');

	if (uploadContainer) {
		uploadContainer.style.display = isCyberBrick ? 'block' : 'none';
	}

	if (uploadButton && window.languageManager) {
		uploadButton.title = window.languageManager.getMessage('UPLOAD_BUTTON_TITLE', 'Upload to CyberBrick');
	}

	// 記錄當前使用的程式語言
	window.currentProgrammingLanguage = isCyberBrick ? 'micropython' : 'arduino';

	console.log(
		`[blockly] UI 已更新: 開發板=${boardId}, 語言=${window.currentProgrammingLanguage}, 上傳按鈕=${isCyberBrick ? '顯示' : '隱藏'}`
	);

	// 初始化上傳按鈕事件
	initUploadButton();
}

// ===== CyberBrick MicroPython 上傳功能 =====

/**
 * 上傳按鈕狀態
 */
const uploadState = {
	isUploading: false,
	selectedPort: null,
};

/**
 * 初始化上傳按鈕事件
 */
function initUploadButton() {
	const uploadButton = document.getElementById('uploadButton');
	if (!uploadButton) return;

	// 移除舊的事件監聽器（避免重複綁定）
	uploadButton.replaceWith(uploadButton.cloneNode(true));
	const newUploadButton = document.getElementById('uploadButton');

	newUploadButton.addEventListener('click', handleUploadClick);
}

/**
 * 處理上傳按鈕點擊
 */
async function handleUploadClick() {
	if (uploadState.isUploading) {
		console.log('[blockly] 上傳中，忽略點擊');
		return;
	}

	const workspace = Blockly.getMainWorkspace();
	if (!workspace) {
		toast.show(window.languageManager?.getMessage('UPLOAD_FAILED', '上傳失敗') + ': 工作區未初始化', 'error');
		return;
	}

	// 檢查工作區是否有積木
	const blocks = workspace.getAllBlocks(false);
	if (blocks.length === 0) {
		toast.show(window.languageManager?.getMessage('UPLOAD_EMPTY_WORKSPACE', '工作區為空，請先添加積木'), 'warning');
		return;
	}

	// 生成程式碼
	const code = generateCode(workspace);
	if (!code || code.trim().length === 0) {
		toast.show(window.languageManager?.getMessage('UPLOAD_NO_CODE', '無法生成程式碼'), 'error');
		return;
	}

	// 設置上傳狀態
	setUploadButtonState('uploading');

	// 發送上傳請求
	console.log('[blockly] 發送上傳請求');
	vscode.postMessage({
		command: 'requestUpload',
		code: code,
		board: 'cyberbrick',
		port: uploadState.selectedPort,
	});
}

/**
 * 設置上傳按鈕狀態
 * @param {'ready'|'uploading'|'success'|'error'} state - 按鈕狀態
 */
function setUploadButtonState(state) {
	const uploadButton = document.getElementById('uploadButton');
	if (!uploadButton) return;

	switch (state) {
		case 'uploading':
			uploadState.isUploading = true;
			uploadButton.disabled = true;
			uploadButton.classList.add('spinning');
			break;
		case 'ready':
		case 'success':
		case 'error':
			uploadState.isUploading = false;
			uploadButton.disabled = false;
			uploadButton.classList.remove('spinning');
			break;
	}
}

/**
 * 處理上傳進度訊息
 * @param {Object} message - 進度訊息
 */
function handleUploadProgress(message) {
	console.log(`[blockly] 上傳進度: ${message.stage} (${message.progress}%) - ${message.message}`);

	// 階段訊息對應
	const stageMessages = {
		preparing: window.languageManager?.getMessage('UPLOAD_STAGE_PREPARING', '準備上傳'),
		checking_tool: window.languageManager?.getMessage('UPLOAD_STAGE_CHECKING', '檢查工具'),
		installing_tool: window.languageManager?.getMessage('UPLOAD_STAGE_INSTALLING', '安裝工具'),
		connecting: window.languageManager?.getMessage('UPLOAD_STAGE_CONNECTING', '連接裝置'),
		resetting: window.languageManager?.getMessage('UPLOAD_STAGE_RESETTING', '重置裝置'),
		backing_up: window.languageManager?.getMessage('UPLOAD_STAGE_BACKUP', '備份程式'),
		uploading: window.languageManager?.getMessage('UPLOAD_STAGE_UPLOADING', '上傳程式'),
		restarting: window.languageManager?.getMessage('UPLOAD_STAGE_RESTARTING', '重啟裝置'),
		completed: window.languageManager?.getMessage('UPLOAD_STAGE_COMPLETED', '完成'),
	};

	const stageText = stageMessages[message.stage] || message.message;
	const progressText = `${stageText} (${message.progress}%)`;

	// 顯示帶有進度的 toast（持續顯示直到下一個更新）
	toast.show(progressText, 'info', 10000);
}

/**
 * 處理上傳結果訊息
 * @param {Object} message - 結果訊息
 */
function handleUploadResult(message) {
	console.log('[blockly] 上傳結果:', message);

	// 重置按鈕狀態
	setUploadButtonState(message.success ? 'success' : 'error');

	if (message.success) {
		const successMsg = window.languageManager?.getMessage('UPLOAD_SUCCESS', '上傳成功！');
		toast.show(successMsg, 'success');
	} else {
		// 根據錯誤階段取得本地化錯誤訊息
		const errorMsg = getLocalizedUploadError(message.error?.stage, message.error?.message);
		const failedMsg = window.languageManager?.getMessage('UPLOAD_FAILED', '上傳失敗');
		toast.show(`${failedMsg}: ${errorMsg}`, 'error', 5000);
	}
}

/**
 * 根據錯誤階段取得本地化的錯誤訊息
 * @param {string} stage - 錯誤發生的階段
 * @param {string} fallbackMessage - 預設訊息（來自 Extension Host）
 * @returns {string} 本地化的錯誤訊息
 */
function getLocalizedUploadError(stage, fallbackMessage) {
	// 階段對應的錯誤訊息鍵名
	const errorKeyMap = {
		preparing: {
			'Only CyberBrick board is supported': 'ERROR_UPLOAD_BOARD_UNSUPPORTED',
			'Code cannot be empty': 'ERROR_UPLOAD_CODE_EMPTY',
		},
		checking_tool: {
			default: 'ERROR_UPLOAD_NO_PYTHON',
		},
		installing_tool: {
			default: 'ERROR_UPLOAD_MPREMOTE_FAILED',
		},
		connecting: {
			default: 'ERROR_UPLOAD_DEVICE_NOT_FOUND',
		},
		resetting: {
			default: 'ERROR_UPLOAD_RESET_FAILED',
		},
		uploading: {
			default: 'ERROR_UPLOAD_UPLOAD_FAILED',
		},
		restarting: {
			default: 'ERROR_UPLOAD_RESTART_FAILED',
		},
	};

	// 預設的 fallback 訊息（使用英文以避免硬編碼中文）
	const defaultFallbacks = {
		ERROR_UPLOAD_BOARD_UNSUPPORTED: 'Only CyberBrick board is supported',
		ERROR_UPLOAD_CODE_EMPTY: 'Code cannot be empty',
		ERROR_UPLOAD_NO_PYTHON: 'PlatformIO Python environment not found',
		ERROR_UPLOAD_MPREMOTE_FAILED: 'Failed to install mpremote',
		ERROR_UPLOAD_DEVICE_NOT_FOUND: 'CyberBrick device not found',
		ERROR_UPLOAD_RESET_FAILED: 'Failed to reset device',
		ERROR_UPLOAD_UPLOAD_FAILED: 'Failed to upload program',
		ERROR_UPLOAD_RESTART_FAILED: 'Failed to restart device',
	};

	if (!stage || !errorKeyMap[stage]) {
		return fallbackMessage || 'Unknown error';
	}

	const stageErrors = errorKeyMap[stage];

	// 嘗試精確匹配錯誤訊息
	let errorKey = stageErrors[fallbackMessage];

	// 如果沒有精確匹配，使用該階段的預設錯誤
	if (!errorKey) {
		errorKey = stageErrors.default;
	}

	if (!errorKey) {
		return fallbackMessage || 'Unknown error';
	}

	// 取得本地化訊息
	return window.languageManager?.getMessage(errorKey, defaultFallbacks[errorKey]) || fallbackMessage || 'Unknown error';
}

/**
 * 處理連接埠清單回應
 * @param {Object} message - 連接埠清單訊息
 */
function handlePortListResponse(message) {
	console.log('[blockly] 連接埠清單:', message);

	if (message.autoDetected) {
		uploadState.selectedPort = message.autoDetected;
		console.log(`[blockly] 自動偵測到 CyberBrick: ${message.autoDetected}`);
	}

	// TODO: 未來可以顯示連接埠選擇 UI
}

/**
 * 更新工作區中 ESP32 專屬積木的警告
 * @param {Blockly.WorkspaceSvg} workspace - Blockly 工作區實例
 * @param {boolean} isESP32Board - 是否為 ESP32 開發板
 */
function updateEsp32BlockWarnings(workspace, isESP32Board) {
	// ESP32 專屬積木類型列表
	const esp32BlockTypes = [
		'esp32_wifi_connect',
		'esp32_wifi_disconnect',
		'esp32_wifi_status',
		'esp32_wifi_get_ip',
		'esp32_wifi_scan',
		'esp32_wifi_get_ssid',
		'esp32_wifi_get_rssi',
		'esp32_mqtt_setup',
		'esp32_mqtt_connect',
		'esp32_mqtt_publish',
		'esp32_mqtt_subscribe',
		'esp32_mqtt_loop',
		'esp32_mqtt_get_topic',
		'esp32_mqtt_get_message',
		'esp32_mqtt_status',
		'esp32_pwm_setup',
	];

	const warningMessage = window.languageManager
		? window.languageManager.getMessage('ESP32_ONLY_BLOCK_WARNING', '此積木僅支援 ESP32 系列開發板')
		: '此積木僅支援 ESP32 系列開發板';

	// 遍歷工作區中所有積木
	workspace.getAllBlocks().forEach(block => {
		if (esp32BlockTypes.includes(block.type)) {
			if (!isESP32Board) {
				// 非 ESP32 板子：顯示警告
				block.setWarningText(warningMessage);
			} else {
				// ESP32 板子：移除警告
				block.setWarningText(null);
			}
		}
	});
}
