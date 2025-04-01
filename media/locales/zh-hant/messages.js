/**
 * @license
 * Copyright 2024 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file contains translations derived from Blockly project
 * Copyright 2012 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

// Define translations for Traditional Chinese
window.languageManager.loadMessages('zh-hant', {
	// UI Elements
	BLOCKS_TAB: '積木',
	CODE_TAB: '程式碼',
	BOARD_SELECT_LABEL: '選擇開發板：',

	// Board Names
	BOARD_NONE: '無',
	BOARD_UNO: 'Arduino Uno',
	BOARD_NANO: 'Arduino Nano',
	BOARD_MEGA: 'Arduino Mega',
	BOARD_ESP32: 'ESP32',
	BOARD_SUPERMINI: 'Super Mini',

	// Block Categories
	CATEGORY_LOGIC: '邏輯',
	CATEGORY_LOOPS: '迴圈',
	CATEGORY_MATH: '數學',
	CATEGORY_TEXT: '文字',
	CATEGORY_LISTS: '列表',
	CATEGORY_VARIABLES: '變數',
	CATEGORY_FUNCTIONS: '函式',
	CATEGORY_ARDUINO: 'Arduino',

	// Arduino Block Labels
	ARDUINO_SETUP: '設定',
	ARDUINO_LOOP: '重複',
	ARDUINO_DIGITAL_WRITE: '數位寫入',
	ARDUINO_DIGITAL_READ: '數位讀取',
	ARDUINO_ANALOG_WRITE: '類比寫入',
	ARDUINO_ANALOG_READ: '類比讀取',
	ARDUINO_PIN: '腳位',
	ARDUINO_VALUE: '數值',
	ARDUINO_DELAY: '延遲',
	ARDUINO_DELAY_MS: '毫秒',
	ARDUINO_PULLUP: '啟用內建上拉電阻',
	ARDUINO_MODE: '模式',
	ARDUINO_MODE_INPUT: '輸入',
	ARDUINO_MODE_OUTPUT: '輸出',

	// Threshold Function Block Labels
	THRESHOLD_PIN: '於',
	THRESHOLD_VALUE: '若 >',
	THRESHOLD_HIGH_VALUE: '=',
	THRESHOLD_LOW_VALUE: '否則',
	THRESHOLD_TOOLTIP_SETUP: '設定一個門檻值函式。當類比輸入值超過門檻值時返回第一個輸出值，否則返回第二個輸出值',
	THRESHOLD_TOOLTIP_READ: '讀取指定門檻值函式的結果',

	// Duration block
	DURATION_REPEAT: '重複執行',
	DURATION_TIME: '時間',
	DURATION_MS: '毫秒',
	DURATION_DO: '執行',

	// Print block
	TEXT_PRINT_SHOW: '顯示',
	TEXT_PRINT_NEWLINE: '換行',

	// Pin Mode block
	PIN_MODE_SET: '設定',

	// Function Block Labels
	FUNCTION_CREATE: '建立函式',
	FUNCTION_NAME: '名稱',
	FUNCTION_PARAMS: '參數',
	FUNCTION_RETURN: '返回',
	FUNCTION_CALL: '呼叫',

	// Logic Block Labels
	LOGIC_IF: '如果',
	LOGIC_ELSE: '否則',
	LOGIC_THEN: '那麼',
	LOGIC_AND: '且',
	LOGIC_OR: '或',
	LOGIC_NOT: '非',
	LOGIC_TRUE: '真',
	LOGIC_FALSE: '假',

	// Loop Block Labels
	LOOP_REPEAT: '重複',
	LOOP_WHILE: '當',
	LOOP_UNTIL: '直到',
	LOOP_FOR: '計次',
	LOOP_FOREACH: '取出每個',
	LOOP_BREAK: '中斷',
	LOOP_CONTINUE: '繼續',

	// Math Block Labels
	MATH_NUMBER: '數字',
	MATH_ARITHMETIC: '算術',
	MATH_OPERATIONS: '運算',
	MATH_ADD: '加',
	MATH_SUBTRACT: '減',
	MATH_MULTIPLY: '乘',
	MATH_DIVIDE: '除',
	MATH_POWER: '次方',

	// Math Map Block
	MATH_MAP_VALUE: '映射',
	MATH_MAP_TOOLTIP: '將數值從一個範圍重新映射到另一個範圍。例如：map(值, 0, 1023, 0, 255) 會將類比輸入值縮放為 8 位元 PWM 輸出。',

	// VS Code UI Messages
	VSCODE_OPEN_FOLDER: '開啟資料夾',
	VSCODE_PLEASE_OPEN_PROJECT: '請先開啟專案資料夾！',
	VSCODE_FAILED_SAVE_FILE: '儲存檔案失敗： {0}',
	VSCODE_FAILED_UPDATE_INI: '更新 platformio.ini 失敗： {0}',
	VSCODE_UNABLE_SAVE_WORKSPACE: '無法儲存工作區狀態： {0}',
	VSCODE_FAILED_START: '啟動 Singular Blockly 失敗： {0}',
	VSCODE_CONFIRM_DELETE_VARIABLE: '確定要刪除變數「{0}」嗎？',
	VSCODE_BOARD_UPDATED: '開發板配置已更新為：{0}',
	VSCODE_RELOAD_REQUIRED: '，請重新載入視窗以完成設定',
	VSCODE_ENTER_VARIABLE_NAME: '輸入變數名稱',
	VSCODE_ENTER_NEW_VARIABLE_NAME: '輸入新的變數名稱（目前：{0}）',
	VSCODE_VARIABLE_NAME_EMPTY: '變數名稱不能為空',
	VSCODE_VARIABLE_NAME_INVALID: '變數名稱只能包含字母、數字和底線，且不能以數字開頭',
	VSCODE_RELOAD: '重新載入',
	VSCODE_OK: '確定',
	VSCODE_CANCEL: '取消',
	VSCODE_OPEN_BLOCKLY_EDITOR: '開啟 Blockly 編輯器',

	// Error Messages
	ERROR_BOARD_NOT_SELECTED: '請先選擇開發板',
	ERROR_INVALID_PIN: '無效的腳位編號',
	ERROR_INVALID_VALUE: '無效的數值',
	ERROR_MISSING_TRANSLATION: '缺少翻譯',

	// Blockly core messages
	ADD: '新增',
	REMOVE: '移除',
	RENAME: '重新命名',
	NEW: '新增',
	ADD_COMMENT: '新增註解',
	REMOVE_COMMENT: '移除註解',
	DUPLICATE_BLOCK: '複製並貼上',
	HELP: '說明',
	UNDO: '復原',
	REDO: '重做',
	COLLAPSE_BLOCK: '摺疊方塊',
	EXPAND_BLOCK: '展開方塊',
	DELETE_BLOCK: '刪除方塊',
	DELETE_X_BLOCKS: '刪除 %1 個方塊',
	DELETE_ALL_BLOCKS: '要刪除全部 %1 個方塊嗎？',
	CLEAN_UP: '整理方塊',
	COLLAPSE_ALL: '摺疊所有方塊',
	EXPAND_ALL: '展開所有方塊',
	DISABLE_BLOCK: '停用方塊',
	ENABLE_BLOCK: '啟用方塊',
	INLINE_INPUTS: '內嵌輸入',
	EXTERNAL_INPUTS: '外部輸入',

	// Variable & Function messages
	RENAME_VARIABLE: '重新命名變數...',
	NEW_VARIABLE: '建立變數...',
	DELETE_VARIABLE: '刪除變數 %1',
	PROCEDURE_ALREADY_EXISTS: '已經存在名為「%1」的程序。',

	// Logic block messages
	CONTROLS_IF_MSG_IF: '如果',
	CONTROLS_IF_MSG_THEN: '那麼',
	CONTROLS_IF_MSG_ELSE: '否則',
	CONTROLS_IF_MSG_ELSEIF: '否則如果',
	CONTROLS_IF_IF_TITLE_IF: '如果',
	CONTROLS_IF_ELSEIF_TITLE_ELSEIF: '否則如果',
	CONTROLS_IF_ELSE_TITLE_ELSE: '否則',
	LOGIC_COMPARE_TOOLTIP_EQ: '如果兩個輸入相等，返回真。',
	LOGIC_COMPARE_TOOLTIP_NEQ: '如果兩個輸入不相等，返回真。',
	LOGIC_COMPARE_TOOLTIP_LT: '如果第一個輸入小於第二個輸入，返回真。',
	LOGIC_COMPARE_TOOLTIP_LTE: '如果第一個輸入小於或等於第二個輸入，返回真。',
	LOGIC_COMPARE_TOOLTIP_GT: '如果第一個輸入大於第二個輸入，返回真。',
	LOGIC_COMPARE_TOOLTIP_GTE: '如果第一個輸入大於或等於第二個輸入，返回真。',
	LOGIC_OPERATION_AND: '且',
	LOGIC_OPERATION_OR: '或',
	LOGIC_NEGATE_TITLE: '非 %1',
	LOGIC_BOOLEAN_TRUE: '真',
	LOGIC_BOOLEAN_FALSE: '假',
	LOGIC_NULL: '空',

	// Additional Logic Block Messages
	LOGIC_COMPARE_HELPURL: 'https://zh.wikipedia.org/wiki/不等式',
	LOGIC_NEGATE_HELPURL: 'https://github.com/google/blockly/wiki/Logic#not',
	LOGIC_NEGATE_TOOLTIP: '如果輸入為假，則返回真。如果輸入為真，則返回假。',
	LOGIC_OPERATION_TOOLTIP_AND: '如果兩個輸入都為真，則返回真。',
	LOGIC_OPERATION_TOOLTIP_OR: '如果至少有一個輸入為真，則返回真。',
	LOGIC_BOOLEAN_TOOLTIP: '返回真或假。',

	// Loop block messages
	CONTROLS_REPEAT_TITLE: '重複 %1 次',
	CONTROLS_WHILEUNTIL_OPERATOR_WHILE: '重複當',
	CONTROLS_WHILEUNTIL_OPERATOR_UNTIL: '重複直到',
	CONTROLS_FOR_TITLE: '使用 %1 從 %2 計數到 %3 每次遞增 %4',
	CONTROLS_FLOW_STATEMENTS_OPERATOR_BREAK: '跳出迴圈',
	CONTROLS_FLOW_STATEMENTS_OPERATOR_CONTINUE: '繼續下一次迴圈',
	CONTROLS_REPEAT_TOOLTIP: '重複執行某些指令數次。',
	CONTROLS_WHILEUNTIL_TOOLTIP_WHILE: '當值為真時，執行一些指令。',
	CONTROLS_WHILEUNTIL_TOOLTIP_UNTIL: '當值為假時，執行一些指令。',
	CONTROLS_FOR_TOOLTIP: '從起始數到結束數中取值，按指定的間隔遞增，執行指定的指令。',
	CONTROLS_FLOW_STATEMENTS_WARNING: '警告：此方塊只能在重複迴圈中使用。',

	// Math block messages
	MATH_NUMBER_HELPURL: 'https://zh.wikipedia.org/wiki/數',
	MATH_NUMBER_TOOLTIP: '一個數字。',
	MATH_ARITHMETIC_OPERATOR_ADD: '+',
	MATH_ARITHMETIC_OPERATOR_MINUS: '-',
	MATH_ARITHMETIC_OPERATOR_MULTIPLY: '×',
	MATH_ARITHMETIC_OPERATOR_DIVIDE: '÷',
	MATH_ARITHMETIC_OPERATOR_POWER: '^',
	MATH_SINGLE_OPERATOR_ROOT: '平方根',
	MATH_SINGLE_OPERATOR_ABSOLUTE: '絕對值',
	MATH_IS_EVEN: '是偶數',
	MATH_IS_ODD: '是奇數',
	MATH_IS_PRIME: '是質數',
	MATH_IS_WHOLE: '是整數',
	MATH_IS_POSITIVE: '是正數',
	MATH_IS_NEGATIVE: '是負數',
	MATH_ARITHMETIC_HELPURL: 'https://zh.wikipedia.org/wiki/算術',
	MATH_ARITHMETIC_TOOLTIP_ADD: '返回兩個數字的和。',
	MATH_ARITHMETIC_TOOLTIP_MINUS: '返回兩個數字的差。',
	MATH_ARITHMETIC_TOOLTIP_MULTIPLY: '返回兩個數字的乘積。',
	MATH_ARITHMETIC_TOOLTIP_DIVIDE: '返回兩個數字的商。',
	MATH_ARITHMETIC_TOOLTIP_POWER: '返回第一個數字的第二個數字次方。',

	// Text block messages
	TEXT_JOIN_TITLE_CREATEWITH: '建立文字',
	TEXT_CREATE_JOIN_TITLE_JOIN: '連接',
	TEXT_LENGTH_TITLE: '%1 的長度',
	TEXT_ISEMPTY_TITLE: '%1 為空',
	TEXT_INDEXOF_OPERATOR_FIRST: '尋找文字第一次出現的位置',
	TEXT_INDEXOF_OPERATOR_LAST: '尋找文字最後一次出現的位置',
	TEXT_CHARAT_FROM_START: '取得第',
	TEXT_CHARAT_FROM_END: '取得倒數第',
	TEXT_CHARAT_FIRST: '取得第一個字元',
	TEXT_CHARAT_LAST: '取得最後一個字元',
	TEXT_CHARAT_RANDOM: '取得隨機字元',
	TEXT_JOIN_TOOLTIP: '將任意數量的項目連接成一段文字。',
	TEXT_APPEND_VARIABLE: '項目',
	TEXT_APPEND_TOOLTIP: '將一些文字附加到變數「%1」。',
	TEXT_LENGTH_TOOLTIP: '返回文字中的字母數（包含空格）。',
	TEXT_ISEMPTY_TOOLTIP: '如果提供的文字為空，則返回真。',

	// List block messages
	LISTS_CREATE_EMPTY_TITLE: '建立空列表',
	LISTS_CREATE_WITH_INPUT_WITH: '建立列表',
	LISTS_LENGTH_TITLE: '%1 的長度',
	LISTS_ISEMPTY_TITLE: '%1 為空',
	LISTS_INDEXOF_FIRST: '找出第一個項目出現',
	LISTS_INDEXOF_LAST: '找出最後一個項目出現',
	LISTS_GET_INDEX_GET: '取得',
	LISTS_GET_INDEX_REMOVE: '移除',
	LISTS_GET_INDEX_FROM_START: '第',
	LISTS_GET_INDEX_FROM_END: '倒數第',
	LISTS_GET_INDEX_FIRST: '第一個',
	LISTS_GET_INDEX_LAST: '最後一個',
	LISTS_GET_INDEX_RANDOM: '隨機',
	LISTS_CREATE_WITH_TOOLTIP: '建立包含任意數量項目列表。',
	LISTS_CREATE_EMPTY_TOOLTIP: '返回一個長度為 0 的空列表',
	LISTS_LENGTH_TOOLTIP: '返回列表的長度。',
	LISTS_ISEMPTY_TOOLTIP: '如果列表為空，則返回真。',

	// Variables
	VARIABLES_SET: '將 %1 設為 %2',
	VARIABLES_GET: '%1',
	VARIABLES_DEFAULT_NAME: '項目',

	// If conditions
	CONTROLS_IF_TOOLTIP_1: '當值為真時，執行一些指令。',
	CONTROLS_IF_TOOLTIP_2: '當值為真時，執行第一個指令區塊。否則，執行第二個指令區塊。',
	CONTROLS_IF_TOOLTIP_3: '如果第一個值為真，則執行第一個指令區塊。否則，如果第二個值為真，則執行第二個指令區塊。',
	CONTROLS_IF_TOOLTIP_4:
		'如果第一個值為真，則執行第一個指令區塊。否則，如果第二個值為真，則執行第二個指令區塊。如果沒有任何一個值為真，則執行最後一個指令區塊。',

	// Procedures
	PROCEDURES_DEFNORETURN_TITLE: '',
	PROCEDURES_DEFNORETURN_PROCEDURE: '執行某個程序',
	PROCEDURES_BEFORE_PARAMS: '參數：',
	PROCEDURES_CALL_BEFORE_PARAMS: '參數：',
	PROCEDURES_DEFNORETURN_DO: '',
	PROCEDURES_DEFNORETURN_TOOLTIP: '建立一個無回傳值的函式。',
	PROCEDURES_DEFRETURN_RETURN: '回傳',
	PROCEDURES_DEFRETURN_TOOLTIP: '建立一個有回傳值的函式。',
	PROCEDURES_DEFRETURN_COMMENT: '描述此函式...',
	PROCEDURES_DEFRETURN_PROCEDURE: '執行某個操作',
	PROCEDURES_DEFRETURN_DO: '',
	PROCEDURES_CALLNORETURN_HELPURL: 'https://zh.wikipedia.org/wiki/子程序',
	PROCEDURES_CALLNORETURN_TOOLTIP: '執行使用者定義的函式。',
	PROCEDURES_CALLRETURN_HELPURL: 'https://zh.wikipedia.org/wiki/子程序',
	PROCEDURES_CALLRETURN_TOOLTIP: '執行使用者定義的函式並使用它的輸出。',

	// Seven Segment Display
	SEVEN_SEGMENT_DISPLAY: '七段顯示器',
	SEVEN_SEGMENT_COMMON_CATHODE: '共陰極',
	SEVEN_SEGMENT_COMMON_ANODE: '共陽極',
	SEVEN_SEGMENT_NUMBER: '數字 (0-9)：',
	SEVEN_SEGMENT_DECIMAL_POINT: '小數點',
	SEVEN_SEGMENT_TOOLTIP: '在七段顯示器上顯示數字(0-9)，可選擇是否顯示小數點。',
	// Seven Segment Display Pins
	SEVEN_SEGMENT_PINS_SET: '設定七段顯示器腳位',
	SEVEN_SEGMENT_PINS_TOOLTIP: '配置七段顯示器的各段(A-G)及小數點(DP)的連接腳位。',
});
