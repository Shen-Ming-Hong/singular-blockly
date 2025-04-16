/**
 * @license
 * Copyright 2024 Singular Blockly Contributors
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
	}

	// 更新標題和按鈕
	document.getElementById('backupModalTitle').textContent = languageManager.getMessage('BACKUP_MANAGER_TITLE', '備份管理');
	document.getElementById('createBackupBtn').textContent = languageManager.getMessage('BACKUP_CREATE_NEW', '建立新備份');
	document.getElementById('createBackupTitle').textContent = languageManager.getMessage('BACKUP_CREATE_NEW', '建立新備份');
	document.getElementById('backupNameLabel').textContent = languageManager.getMessage('BACKUP_NAME_LABEL', '備份名稱：');
	document.getElementById('backupName').placeholder = languageManager.getMessage('BACKUP_NAME_PLACEHOLDER', '輸入備份名稱');
	document.getElementById('confirmBackupBtn').textContent = languageManager.getMessage('BACKUP_CONFIRM', '確認');
	document.getElementById('cancelBackupBtn').textContent = languageManager.getMessage('BACKUP_CANCEL', '取消');
	document.getElementById('backupListTitle').textContent = languageManager.getMessage('BACKUP_LIST_TITLE', '備份列表');
	document.getElementById('emptyBackupMessage').textContent = languageManager.getMessage('BACKUP_LIST_EMPTY', '尚無備份');

	// 更新備份按鈕標題
	document.getElementById('backupButton').title = languageManager.getMessage('BACKUP_BUTTON_TITLE', '備份管理');
}

// 註冊工具箱元件
Blockly.registry.register(Blockly.registry.Type.TOOLBOX_ITEM, Blockly.ToolboxCategory.registrationName, Blockly.ToolboxCategory);

// 用來儲存等待回應的確認對話框回調函數
const pendingConfirmCallbacks = new Map();
let confirmCounter = 0;

// 覆蓋 window.confirm 方法，改用 VSCode API 顯示通知
window.confirm = function (message) {
	// 每次呼叫都產生唯一的 ID
	const confirmId = confirmCounter++;

	// 創建一個 Promise 來等待使用者的回應
	const confirmPromise = new Promise(resolve => {
		// 將此 Promise 的 resolve 函數儲存到 Map 中，供稍後回應時使用
		pendingConfirmCallbacks.set(confirmId, resolve);

		// 將確認請求發送給 VSCode 擴展，包含唯一 ID
		vscode.postMessage({
			command: 'confirmDialog',
			message: message,
			confirmId: confirmId,
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
	// 初始化備份管理器
	init: function () {
		// 綁定按鈕事件
		document.getElementById('backupButton').addEventListener('click', this.openModal.bind(this));
		document.querySelector('.modal-close').addEventListener('click', this.closeModal.bind(this));
		document.getElementById('createBackupBtn').addEventListener('click', this.showBackupForm.bind(this));
		document.getElementById('confirmBackupBtn').addEventListener('click', this.createBackup.bind(this));
		document.getElementById('cancelBackupBtn').addEventListener('click', this.hideBackupForm.bind(this));

		// 更新多國語言文字
		updateBackupModalTexts();

		// 初始化備份列表
		this.refreshBackupList();
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
		// 隱藏建立按鈕
		document.querySelector('.backup-actions').style.display = 'none';
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
		// 顯示建立按鈕
		document.querySelector('.backup-actions').style.display = 'block';
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
			alert('備份名稱包含無效字符，請使用字母、數字、底線和連字符');
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
		// 只允許字母、數字、底線、連字符和點號
		return /^[a-zA-Z0-9_\-\.]+$/.test(filename);
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

	// 註冊主題切換按鈕事件
	document.getElementById('themeToggle').addEventListener('click', toggleTheme);

	// 初始化備份管理器
	backupManager.init();

	// 載入 toolbox 配置
	const response = await fetch(window.TOOLBOX_URL);
	const toolboxConfig = await response.json();

	// 新增：在注入前處理 toolbox 配置中的翻譯
	const processTranslations = obj => {
		if (typeof obj === 'object') {
			for (let key in obj) {
				if (typeof obj[key] === 'string') {
					obj[key] = Blockly.utils.replaceMessageReferences(obj[key]);
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
		},
	});
	// 根據初始主題設定更新 UI
	updateTheme(currentTheme);

	// 創建預設變數 i
	if (!workspace.getVariable('i')) {
		workspace.createVariable('i');
	}

	// 覆寫變數類別的flyout生成函數
	workspace.registerToolboxCategoryCallback('VARIABLE', function (workspace) {
		const variableBlocks = [];

		// 添加"新增變數"按鈕
		variableBlocks.push(
			Blockly.utils.xml.textToDom('<button text="' + Blockly.Msg['NEW_VARIABLE'] + '" callbackKey="CREATE_VARIABLE"></button>')
		);

		// 為每個現有變數創建積木
		const variables = workspace.getAllVariables();
		if (variables.length > 0) {
			variables.forEach(variable => {
				variableBlocks.push(
					Blockly.utils.xml.textToDom(
						`<block type="variables_get">
							<field name="VAR" id="${variable.getId()}">${variable.name}</field>
						</block>`
					),
					Blockly.utils.xml.textToDom(
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
		blocks.push(Blockly.utils.xml.textToDom(`<block type="arduino_function"></block>`));

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
							<mutation name="${funcName}" version="1" has_return="false" return_type="void"></mutation>
					`;

					// 添加函數參數資訊
					if (functionBlock.arguments_ && functionBlock.arguments_.length > 0) {
						for (let i = 0; i < functionBlock.arguments_.length; i++) {
							const argName = functionBlock.arguments_[i] || '';
							const argType = functionBlock.argumentTypes_[i] || 'int';
							callBlockXml += `<arg name="${argName}" type="${argType}"></arg>`;
						}
					}

					// 關閉 XML 標籤
					callBlockXml += '</block>';

					// 轉換為 DOM 元素並添加到積木列表
					const callBlockDom = Blockly.utils.xml.textToDom(callBlockXml);
					blocks.push(callBlockDom);
				}
			});
		}

		return blocks;
	});

	// 保存工作區狀態的函數
	const saveWorkspaceState = () => {
		try {
			const state = Blockly.serialization.workspaces.save(workspace);
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

	// 單一的工作區變更監聽器
	workspace.addChangeListener(event => {
		// 忽略拖動中的 UI 事件
		if (event.isUiEvent) {
			return;
		}
		// 工作區完全載入後修復函數呼叫積木和連接點
		if (event.type === Blockly.Events.FINISHED_LOADING) {
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
		if (
			event.type === Blockly.Events.BLOCK_MOVE ||
			event.type === Blockly.Events.BLOCK_CHANGE ||
			event.type === Blockly.Events.BLOCK_DELETE ||
			event.type === Blockly.Events.BLOCK_CREATE
		) {
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
		}

		// 更新程式碼
		if (
			event.type === Blockly.Events.BLOCK_MOVE ||
			event.type === Blockly.Events.BLOCK_CHANGE ||
			event.type === Blockly.Events.BLOCK_DELETE ||
			event.type === Blockly.Events.BLOCK_CREATE
		) {
			// 檢查是否是函式定義積木變化
			try {
				const code = arduinoGenerator.workspaceToCode(workspace);
				vscode.postMessage({
					command: 'updateCode',
					code: code,
				});

				// 無條件保存所有方塊移動事件，確保座標變更被儲存
				saveWorkspaceState();
			} catch (err) {
				log.info('代碼生成暫時性錯誤（可能是積木正在拖動）:', err);
			}
		}
	});

	// 處理開發板選擇
	const boardSelect = document.getElementById('boardSelect');
	boardSelect.addEventListener('change', event => {
		const selectedBoard = event.target.value;
		// 更新全局的currentBoard
		window.setCurrentBoard(selectedBoard);
		// 觸發工作區更新以重新整理積木
		workspace.getAllBlocks().forEach(block => {
			if (block.type.startsWith('arduino_')) {
				block.render();
			}
		});
		vscode.postMessage({
			command: 'updateBoard',
			board: selectedBoard,
		});
		saveWorkspaceState();
	});

	// 監聽來自擴充功能的訊息
	window.addEventListener('message', event => {
		const message = event.data;
		const workspace = Blockly.getMainWorkspace();
		log.info(`收到訊息: ${message.command}`, message);

		switch (message.command) {
			case 'createVariable':
				if (message.name) {
					if (message.isRename && message.oldName) {
						// 修正：直接使用變數 ID 進行重命名
						const variable = workspace.getVariable(message.oldName);
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
						const existingVar = workspace.getVariable(message.name);
						if (!existingVar) {
							workspace.createVariable(message.name);
							// 觸發更新
							const code = arduinoGenerator.workspaceToCode(workspace);
							vscode.postMessage({
								command: 'updateCode',
								code: code,
							});
							saveWorkspaceState();
						}
					}
				}
				break;
			case 'deleteVariable':
				if (message.confirmed) {
					const variable = workspace.getVariable(message.name);
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
						const code = arduinoGenerator.workspaceToCode(workspace);
						vscode.postMessage({
							command: 'updateCode',
							code: code,
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

						// 如果使用者確認要刪除方塊
						if (message.confirmed) {
							// 執行刪除工作區中所有方塊的操作
							workspace.clear();

							// 更新程式碼和保存工作區狀態
							const code = arduinoGenerator.workspaceToCode(workspace);
							vscode.postMessage({
								command: 'updateCode',
								code: code,
							});
							saveWorkspaceState();
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
					if (message.board) {
						// 先設定板子類型
						boardSelect.value = message.board;
						window.setCurrentBoard(message.board);
						vscode.postMessage({
							command: 'updateBoard',
							board: message.board,
						});
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
								const code = arduinoGenerator.workspaceToCode(workspace);
								vscode.postMessage({
									command: 'updateCode',
									code: code,
								});
							} catch (err) {
								log.warn('更新程式碼失敗:', err);
							}
						}, 300);
					}
				} catch (error) {
					log.error('載入工作區狀態失敗:', error);
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

			// 移除多餘的備份載入功能
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
		const variableList = workspace.getAllVariables().map(variable => [variable.name, variable.getId()]);
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
			const variable = workspace.getVariableById(id);
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
			const variable = workspace.getVariableById(id);
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

// 覆寫 Blockly 的字串替換函數
Blockly.utils.replaceMessageReferences = function (message) {
	if (!message) {
		return message;
	}
	return message.replace(/%{([^}]*)}/g, function (m, key) {
		return window.languageManager.getMessage(key, m);
	});
};
