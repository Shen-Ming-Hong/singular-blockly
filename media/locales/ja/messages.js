/**
 * @license
 * Copyright 2024 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file contains translations derived from Blockly project
 * Copyright 2012 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

// Define translations for Japanese
window.languageManager.loadMessages('ja', {
	// UI Elements
	BLOCKS_TAB: 'ブロック',
	CODE_TAB: 'コード',
	BOARD_SELECT_LABEL: 'ボードを選択:',

	// Board Names
	BOARD_NONE: 'なし',
	BOARD_UNO: 'Arduino Uno',
	BOARD_NANO: 'Arduino Nano',
	BOARD_MEGA: 'Arduino Mega',
	BOARD_ESP32: 'ESP32',
	BOARD_SUPERMINI: 'Super Mini',

	// Block Categories
	CATEGORY_LOGIC: '論理',
	CATEGORY_LOOPS: 'ループ',
	CATEGORY_MATH: '数学',
	CATEGORY_TEXT: 'テキスト',
	CATEGORY_LISTS: 'リスト',
	CATEGORY_VARIABLES: '変数',
	CATEGORY_FUNCTIONS: '関数',
	CATEGORY_ARDUINO: 'Arduino',

	// Arduino Block Labels
	ARDUINO_SETUP: 'セットアップ',
	ARDUINO_LOOP: 'ループ',
	ARDUINO_DIGITAL_WRITE: 'デジタル出力',
	ARDUINO_DIGITAL_READ: 'デジタル入力',
	ARDUINO_ANALOG_WRITE: 'アナログ出力',
	ARDUINO_ANALOG_READ: 'アナログ入力',
	ARDUINO_PIN: 'ピン',
	ARDUINO_VALUE: '値',
	ARDUINO_DELAY: '遅延',
	ARDUINO_DELAY_MS: 'ミリ秒',
	ARDUINO_PULLUP: '内部プルアップ有効',
	ARDUINO_MODE: 'モード',
	ARDUINO_MODE_INPUT: '入力',
	ARDUINO_MODE_OUTPUT: '出力',

	// Duration block
	DURATION_REPEAT: '繰り返し',
	DURATION_TIME: '時間',
	DURATION_MS: 'ミリ秒',
	DURATION_DO: '実行',

	// Print block
	TEXT_PRINT_SHOW: '表示',
	TEXT_PRINT_NEWLINE: '改行',

	// Pin Mode block
	PIN_MODE_SET: '設定',

	// Function Block Labels
	FUNCTION_CREATE: '関数を作成',
	FUNCTION_NAME: '名前',
	FUNCTION_PARAMS: 'パラメータ',
	FUNCTION_RETURN: '戻り値',
	FUNCTION_CALL: '呼び出し',

	// Logic Block Labels
	LOGIC_IF: 'もし',
	LOGIC_ELSE: 'そうでなければ',
	LOGIC_THEN: 'ならば',
	LOGIC_AND: 'かつ',
	LOGIC_OR: 'または',
	LOGIC_NOT: 'ではない',
	LOGIC_TRUE: '真',
	LOGIC_FALSE: '偽',

	// Loop Block Labels
	LOOP_REPEAT: '繰り返す',
	LOOP_WHILE: '条件が真の間',
	LOOP_UNTIL: '条件が真になるまで',
	LOOP_FOR: 'カウンタで繰り返す',
	LOOP_FOREACH: '各要素で繰り返す',
	LOOP_BREAK: '中断',
	LOOP_CONTINUE: '次のループへ',

	// Math Block Labels
	MATH_NUMBER: '数値',
	MATH_ARITHMETIC: '算術',
	MATH_OPERATIONS: '操作',
	MATH_ADD: '加算',
	MATH_SUBTRACT: '減算',
	MATH_MULTIPLY: '乗算',
	MATH_DIVIDE: '除算',
	MATH_POWER: '累乗',

	// Math Map Block
	MATH_MAP_VALUE: '値の変換',
	MATH_MAP_TOOLTIP: 'ある範囲の値を別の範囲に変換します',

	// Error Messages
	ERROR_BOARD_NOT_SELECTED: 'まず、ボードを選択してください',
	ERROR_INVALID_PIN: '無効なピン番号',
	ERROR_INVALID_VALUE: '無効な値',
	ERROR_MISSING_TRANSLATION: '翻訳がありません',

	// Blockly core messages
	ADD: '追加',
	REMOVE: '削除',
	RENAME: '名前変更',
	NEW: '新規',
	ADD_COMMENT: 'コメント追加',
	REMOVE_COMMENT: 'コメント削除',
	DUPLICATE_BLOCK: '複製',
	HELP: 'ヘルプ',
	UNDO: '元に戻す',
	REDO: 'やり直し',
	COLLAPSE_BLOCK: 'ブロックを折りたたむ',
	EXPAND_BLOCK: 'ブロックを展開',
	DELETE_BLOCK: 'ブロックを削除',
	DELETE_X_BLOCKS: '%1個のブロックを削除',
	DELETE_ALL_BLOCKS: 'すべての%1個のブロックを削除しますか?',
	CLEAN_UP: 'ブロックを整理',
	COLLAPSE_ALL: 'すべてのブロックを折りたたむ',
	EXPAND_ALL: 'すべてのブロックを展開',
	DISABLE_BLOCK: 'ブロックを無効化',
	ENABLE_BLOCK: 'ブロックを有効化',
	INLINE_INPUTS: 'インライン入力',
	EXTERNAL_INPUTS: '外部入力',

	// Variable & Function messages
	RENAME_VARIABLE: '変数の名前を変更...',
	NEW_VARIABLE: '変数を作成...',
	DELETE_VARIABLE: '変数%1を削除',
	PROCEDURE_ALREADY_EXISTS: '"%1"という名前の手続きはすでに存在します。',

	// Logic block messages
	CONTROLS_IF_MSG_IF: 'もし',
	CONTROLS_IF_MSG_THEN: 'ならば',
	CONTROLS_IF_MSG_ELSE: 'そうでなければ',
	CONTROLS_IF_MSG_ELSEIF: 'そうでなく、もし',
	CONTROLS_IF_IF_TITLE_IF: 'もし',
	CONTROLS_IF_ELSEIF_TITLE_ELSEIF: 'そうでなく、もし',
	CONTROLS_IF_ELSE_TITLE_ELSE: 'そうでなければ',
	LOGIC_COMPARE_TOOLTIP_EQ: '両方の入力が等しい場合は真を返します。',
	LOGIC_COMPARE_TOOLTIP_NEQ: '両方の入力が等しくない場合は真を返します。',
	LOGIC_COMPARE_TOOLTIP_LT: '最初の入力が2番目の入力より小さい場合は真を返します。',
	LOGIC_COMPARE_TOOLTIP_LTE: '最初の入力が2番目の入力以下の場合は真を返します。',
	LOGIC_COMPARE_TOOLTIP_GT: '最初の入力が2番目の入力より大きい場合は真を返します。',
	LOGIC_COMPARE_TOOLTIP_GTE: '最初の入力が2番目の入力以上の場合は真を返します。',
	LOGIC_OPERATION_AND: 'かつ',
	LOGIC_OPERATION_OR: 'または',
	LOGIC_NEGATE_TITLE: 'ではない %1',
	LOGIC_BOOLEAN_TRUE: '真',
	LOGIC_BOOLEAN_FALSE: '偽',
	LOGIC_NULL: 'null',

	// Additional Logic Block Messages
	LOGIC_COMPARE_HELPURL: 'https://ja.wikipedia.org/wiki/不等式',
	LOGIC_NEGATE_HELPURL: 'https://github.com/google/blockly/wiki/Logic#not',
	LOGIC_NEGATE_TOOLTIP: '入力が偽なら真を返します。入力が真なら偽を返します。',
	LOGIC_OPERATION_TOOLTIP_AND: '両方の入力が真の場合は真を返します。',
	LOGIC_OPERATION_TOOLTIP_OR: '少なくとも1つの入力が真の場合は真を返します。',
	LOGIC_BOOLEAN_TOOLTIP: '真または偽を返します。',

	// Loop block messages
	CONTROLS_REPEAT_TITLE: '%1 回繰り返す',
	CONTROLS_WHILEUNTIL_OPERATOR_WHILE: '条件が真の間、繰り返す',
	CONTROLS_WHILEUNTIL_OPERATOR_UNTIL: '条件が真になるまで繰り返す',
	CONTROLS_FOR_TITLE: 'カウンタ %1 を %2 から %3 まで %4 ずつ増加させながら繰り返す',
	CONTROLS_FLOW_STATEMENTS_OPERATOR_BREAK: 'ループを中断',
	CONTROLS_FLOW_STATEMENTS_OPERATOR_CONTINUE: '次の反復処理へ継続',
	CONTROLS_REPEAT_TOOLTIP: '一連の命令を数回実行します。',
	CONTROLS_WHILEUNTIL_TOOLTIP_WHILE: '値が真である限り、一連の命令を実行します。',
	CONTROLS_WHILEUNTIL_TOOLTIP_UNTIL: '値が偽である限り、一連の命令を実行します。',
	CONTROLS_FOR_TOOLTIP: '開始値から終了値まで、指定された間隔でカウントしながら、一連の命令を実行します。',
	CONTROLS_FLOW_STATEMENTS_WARNING: '警告：このブロックはループ内でのみ使用できます。',

	// Math block messages
	MATH_NUMBER_HELPURL: 'https://ja.wikipedia.org/wiki/数',
	MATH_NUMBER_TOOLTIP: '数値です。',
	MATH_ARITHMETIC_OPERATOR_ADD: '+',
	MATH_ARITHMETIC_OPERATOR_MINUS: '-',
	MATH_ARITHMETIC_OPERATOR_MULTIPLY: '×',
	MATH_ARITHMETIC_OPERATOR_DIVIDE: '÷',
	MATH_ARITHMETIC_OPERATOR_POWER: '^',
	MATH_SINGLE_OPERATOR_ROOT: '平方根',
	MATH_SINGLE_OPERATOR_ABSOLUTE: '絶対値',
	MATH_IS_EVEN: 'が偶数',
	MATH_IS_ODD: 'が奇数',
	MATH_IS_PRIME: 'が素数',
	MATH_IS_WHOLE: 'が整数',
	MATH_IS_POSITIVE: 'が正の数',
	MATH_IS_NEGATIVE: 'が負の数',
	MATH_ARITHMETIC_HELPURL: 'https://ja.wikipedia.org/wiki/算術',
	MATH_ARITHMETIC_TOOLTIP_ADD: '2つの数の和を返します。',
	MATH_ARITHMETIC_TOOLTIP_MINUS: '2つの数の差を返します。',
	MATH_ARITHMETIC_TOOLTIP_MULTIPLY: '2つの数の積を返します。',
	MATH_ARITHMETIC_TOOLTIP_DIVIDE: '2つの数の商を返します。',
	MATH_ARITHMETIC_TOOLTIP_POWER: '1番目の数を2番目の数で累乗した結果を返します。',

	// Text block messages
	TEXT_JOIN_TITLE_CREATEWITH: 'テキストの作成',
	TEXT_CREATE_JOIN_TITLE_JOIN: '結合',
	TEXT_LENGTH_TITLE: '%1 の長さ',
	TEXT_ISEMPTY_TITLE: '%1 が空',
	TEXT_INDEXOF_OPERATOR_FIRST: 'テキストの最初の出現位置を見つける',
	TEXT_INDEXOF_OPERATOR_LAST: 'テキストの最後の出現位置を見つける',
	TEXT_CHARAT_FROM_START: '文字を取得：',
	TEXT_CHARAT_FROM_END: '末尾から数えて文字を取得：',
	TEXT_CHARAT_FIRST: '最初の文字を取得',
	TEXT_CHARAT_LAST: '最後の文字を取得',
	TEXT_CHARAT_RANDOM: 'ランダムな文字を取得',
	TEXT_JOIN_TOOLTIP: '複数の項目を連結して1つのテキストにします。',
	TEXT_APPEND_VARIABLE: '項目',
	TEXT_APPEND_TOOLTIP: '変数「%1」にテキストを追加します。',
	TEXT_LENGTH_TOOLTIP: '与えられたテキスト内の文字数（スペースを含む）を返します。',
	TEXT_ISEMPTY_TOOLTIP: '与えられたテキストが空の場合、真を返します。',

	// List block messages
	LISTS_CREATE_EMPTY_TITLE: '空のリストを作成',
	LISTS_CREATE_WITH_INPUT_WITH: 'リストを作成：',
	LISTS_LENGTH_TITLE: '%1 の長さ',
	LISTS_ISEMPTY_TITLE: '%1 が空',
	LISTS_INDEXOF_FIRST: '最初の項目の出現位置を検索',
	LISTS_INDEXOF_LAST: '最後の項目の出現位置を検索',
	LISTS_GET_INDEX_GET: '取得',
	LISTS_GET_INDEX_REMOVE: '削除',
	LISTS_GET_INDEX_FROM_START: '番目',
	LISTS_GET_INDEX_FROM_END: '末尾から',
	LISTS_GET_INDEX_FIRST: '最初',
	LISTS_GET_INDEX_LAST: '最後',
	LISTS_GET_INDEX_RANDOM: 'ランダム',
	LISTS_CREATE_WITH_TOOLTIP: '任意の数の項目からなるリストを作成します。',
	LISTS_CREATE_EMPTY_TOOLTIP: '長さ0の空のリストを返します。',
	LISTS_LENGTH_TOOLTIP: 'リストの長さを返します。',
	LISTS_ISEMPTY_TOOLTIP: 'リストが空の場合、真を返します。',

	// Variables
	VARIABLES_SET: '%1 を %2 に設定',
	VARIABLES_GET: '%1',
	VARIABLES_DEFAULT_NAME: '項目',

	// If conditions
	CONTROLS_IF_TOOLTIP_1: '値が真の場合、ステートメントを実行します。',
	CONTROLS_IF_TOOLTIP_2:
		'値が真の場合、最初のブロックのステートメントを実行します。そうでなければ、2番目のブロックのステートメントを実行します。',
	CONTROLS_IF_TOOLTIP_3:
		'最初の値が真の場合、最初のブロックのステートメントを実行します。そうでなく、2番目の値が真の場合、2番目のブロックのステートメントを実行します。',
	CONTROLS_IF_TOOLTIP_4:
		'最初の値が真の場合、最初のブロックのステートメントを実行します。そうでなく、2番目の値が真の場合、2番目のブロックのステートメントを実行します。どの値も真でない場合、最後のブロックのステートメントを実行します。',

	// Procedures
	PROCEDURES_DEFNORETURN_TITLE: '',
	PROCEDURES_DEFNORETURN_PROCEDURE: '何かを実行',
	PROCEDURES_BEFORE_PARAMS: 'パラメータ:',
	PROCEDURES_CALL_BEFORE_PARAMS: 'パラメータ:',
	PROCEDURES_DEFNORETURN_DO: '',
	PROCEDURES_DEFNORETURN_TOOLTIP: '出力のない関数を作成します。',
	PROCEDURES_DEFRETURN_RETURN: '戻り値',
	PROCEDURES_DEFRETURN_TOOLTIP: '出力のある関数を作成します。',
	PROCEDURES_DEFRETURN_COMMENT: 'この関数の説明...',
	PROCEDURES_DEFRETURN_PROCEDURE: '何かを実行',
	PROCEDURES_DEFRETURN_DO: '',
	PROCEDURES_CALLNORETURN_HELPURL: 'https://ja.wikipedia.org/wiki/サブルーチン',
	PROCEDURES_CALLNORETURN_TOOLTIP: 'ユーザー定義の関数を実行します。',
	PROCEDURES_CALLRETURN_HELPURL: 'https://ja.wikipedia.org/wiki/サブルーチン',
	PROCEDURES_CALLRETURN_TOOLTIP: 'ユーザー定義の関数を実行し、その出力を使用します。',

	// Seven Segment Display
	SEVEN_SEGMENT_DISPLAY: '7セグメント表示器',
	SEVEN_SEGMENT_COMMON_CATHODE: '共通カソード',
	SEVEN_SEGMENT_COMMON_ANODE: '共通アノード',
	SEVEN_SEGMENT_NUMBER: '数字 (0-9)：',
	SEVEN_SEGMENT_DECIMAL_POINT: '小数点',
	SEVEN_SEGMENT_TOOLTIP: '7セグメント表示器に数字(0-9)を表示し、小数点を表示するかどうかを選択できます。',
	// Seven Segment Display Pins
	SEVEN_SEGMENT_PINS_SET: '七段表示器のピンを設定',
	SEVEN_SEGMENT_PINS_TOOLTIP: '7セグメント表示器の各セグメント(A-G)と小数点(DP)のピン接続を設定します。',
});
