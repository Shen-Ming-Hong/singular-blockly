/**
 * @license
 * Copyright 2025 Singular Blockly Contributors
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
	LANGUAGE_SELECT_TOOLTIP: '言語を選択',
	LANGUAGE_AUTO: '自動（VS Code に従う）',

	// Experimental Blocks Notice
	EXPERIMENTAL_BLOCKS_TITLE: '実験的ブロックが検出されました',
	EXPERIMENTAL_BLOCKS_DESC:
		'ワークスペースに実験的ブロック（黄色の点線の枠で強調表示）が含まれています。これらの機能は将来のアップデートで変更または削除される可能性があります。注意して使用してください。',

	// Preview Mode UI
	PREVIEW_BADGE: 'プレビュー',
	THEME_TOGGLE: 'テーマ切替',
	PREVIEW_WINDOW_TITLE: 'Blockly プレビュー - {0}',
	PREVIEW_WINDOW_TITLE_WITH_NAME: 'プレビュー - {0}',

	// Backup Modal UI
	BACKUP_MANAGER_TITLE: 'バックアップ管理',
	BACKUP_CREATE_NEW: '新規バックアップ作成',
	BACKUP_NAME_LABEL: 'バックアップ名:',
	BACKUP_NAME_PLACEHOLDER: 'バックアップ名を入力',
	BACKUP_CONFIRM: '確認',
	BACKUP_CANCEL: 'キャンセル',
	BACKUP_LIST_TITLE: 'バックアップ一覧',
	BACKUP_LIST_EMPTY: 'バックアップがありません',
	BACKUP_BUTTON_TITLE: 'バックアップ管理',
	REFRESH_BUTTON_TITLE: 'コードの更新',
	BACKUP_PREVIEW_BTN: 'プレビュー',
	BACKUP_RESTORE_BTN: '復元',
	BACKUP_DELETE_BTN: '削除',
	AUTO_BACKUP_TITLE: '自動バックアップ設定',
	AUTO_BACKUP_INTERVAL_LABEL: 'バックアップ間隔:',
	AUTO_BACKUP_MINUTES: '分',
	AUTO_BACKUP_SAVE: '設定を保存',
	AUTO_BACKUP_SAVED: '自動バックアップ設定が保存されました',
	AUTO_BACKUP_PREFIX: 'auto_',
	MANUAL_BACKUP_TITLE: '手動バックアップ',

	// Board Names
	BOARD_NONE: 'なし',
	BOARD_UNO: 'Arduino Uno',
	BOARD_NANO: 'Arduino Nano',
	BOARD_MEGA: 'Arduino Mega',
	BOARD_ESP32: 'ESP32',
	BOARD_SUPERMINI: 'Super Mini',
	// Block Search UI
	FUNCTION_SEARCH_TITLE: 'ブロック検索',
	FUNCTION_SEARCH_BUTTON_TITLE: 'ブロック検索',
	FUNCTION_SEARCH_PLACEHOLDER: 'ブロック名やパラメータを入力...',
	FUNCTION_SEARCH_BTN: '検索',
	FUNCTION_SEARCH_PREV: '前へ',
	FUNCTION_SEARCH_NEXT: '次へ',
	FUNCTION_SEARCH_EMPTY: '未検索',
	FUNCTION_SEARCH_NO_RESULTS: '一致するブロックが見つかりません',
	FUNCTION_RESULT_PREFIX: 'ブロック: ',
	FUNCTION_KEYBOARD_SHORTCUT_TIP: '(ショートカット: Ctrl+F)',
	FUNCTION_SEARCH_HISTORY_TITLE: '検索履歴',

	// Block Categories
	CATEGORY_LOGIC: '論理',
	CATEGORY_LOOPS: 'ループ',
	CATEGORY_MATH: '数学',
	CATEGORY_TEXT: 'テキスト',
	CATEGORY_LISTS: 'リスト',
	CATEGORY_VARIABLES: '変数',
	CATEGORY_FUNCTIONS: '関数',
	CATEGORY_ARDUINO: 'Arduino',
	CATEGORY_SENSORS: 'センサー',
	CATEGORY_MOTORS: 'モーター',
	VISION_SENSORS_CATEGORY: '視覚センサー',
	// Servo Block Labels
	SERVO_SETUP: 'サーボモーターの設定',
	SERVO_PIN: 'ピン',
	SERVO_SETUP_TOOLTIP: 'サーボモーター変数を宣言してピンを設定する',
	SERVO_MOVE: 'サーボモーターを回転',
	SERVO_ANGLE: '角度',
	SERVO_MOVE_TOOLTIP: 'サーボモーターを特定の角度に回転させる',
	SERVO_STOP: 'サーボモーターを停止',
	SERVO_STOP_TOOLTIP: 'サーボモーターの信号出力を停止する',

	// Encoder Motor Block Labels
	ENCODER_SETUP: 'エンコーダーモーターの設定',
	ENCODER_NAME: '名前',
	ENCODER_PIN_A: 'ピンA',
	ENCODER_PIN_B: 'ピンB',
	ENCODER_USE_INTERRUPT: 'ハードウェア割り込みを使用',
	ENCODER_SETUP_TOOLTIP: 'ピンAとピンBでエンコーダーモーターを設定します',
	ENCODER_READ: 'エンコーダーを読み取る',
	ENCODER_READ_TOOLTIP: 'エンコーダーの現在位置を読み取ります',
	ENCODER_RESET: 'エンコーダーをリセット',
	ENCODER_RESET_TOOLTIP: 'エンコーダーをゼロ位置にリセットします',
	ENCODER_PID_SETUP: 'PID制御の設定',
	ENCODER_PID_MOTOR: 'モーター',
	ENCODER_PID_KP: 'Kp',
	ENCODER_PID_KI: 'Ki',
	ENCODER_PID_KD: 'Kd',
	ENCODER_PID_MODE: 'モード',
	ENCODER_PID_MODE_POSITION: '位置',
	ENCODER_PID_MODE_SPEED: '速度',
	ENCODER_PID_SETUP_TOOLTIP: 'エンコーダーモーターのPID制御を設定します。位置または速度モードを選択してください。',
	ENCODER_PID_COMPUTE: 'PIDを計算',
	ENCODER_PID_TARGET: '目標値',
	ENCODER_PID_COMPUTE_TOOLTIP: 'エンコーダーモーターが目標位置に到達するためのPIDを計算します',
	ENCODER_PID_RESET: 'PIDをリセット',
	ENCODER_PID_RESET_TOOLTIP: 'PIDコントローラの状態をリセット（積分値のクリア、カウンタのリセット）',

	// Arduino Block Labels
	ARDUINO_SETUP: 'セットアップ',
	ARDUINO_LOOP: 'ループ',
	ARDUINO_DIGITAL_WRITE: 'デジタル書き込み',
	ARDUINO_DIGITAL_READ: 'デジタル読み取り',
	ARDUINO_ANALOG_WRITE: 'アナログ書き込み',
	ARDUINO_ANALOG_READ: 'アナログ読み取り',
	ARDUINO_PIN: 'ピン',
	ARDUINO_VALUE: '値',
	ARDUINO_DELAY: '遅延',
	ARDUINO_DELAY_MS: 'ミリ秒',
	ARDUINO_PULLUP: '内部プルアップを有効にする',
	ARDUINO_MODE: 'モード',
	ARDUINO_MODE_INPUT: '入力',
	ARDUINO_MODE_OUTPUT: '出力',

	// Sensor Block Labels
	ULTRASONIC_SENSOR: '超音波センサー',
	ULTRASONIC_TRIG_PIN: 'トリガーピン',
	ULTRASONIC_ECHO_PIN: 'エコーピン',
	ULTRASONIC_USE_INTERRUPT: 'ハードウェア割り込みを使用',
	ULTRASONIC_READ: '超音波距離を読み取る (cm)',
	ULTRASONIC_TOOLTIP_SETUP:
		'トリガーとエコーピンで超音波センサーを設定します。オプションでハードウェア割り込みを使用して精度を向上できます。',
	ULTRASONIC_TOOLTIP_READ: '超音波センサーで測定した距離をセンチメートル単位で読み取ります。',
	ULTRASONIC_WARNING:
		'選択されたエコーピン {0} はハードウェア割り込みをサポートしていません。これらのピンのいずれかを選択してください: {1}',

	// Threshold Function Block Labels
	THRESHOLD_PIN: 'で',
	THRESHOLD_VALUE: 'もし >',
	THRESHOLD_HIGH_VALUE: '=',
	THRESHOLD_LOW_VALUE: 'それ以外',
	THRESHOLD_TOOLTIP_SETUP:
		'しきい値関数を設定します。アナログ入力がしきい値を超えたとき最初の出力を返し、それ以外の場合は2番目の出力を返します。',
	THRESHOLD_TOOLTIP_READ: 'しきい値関数から値を取得',

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

	// VS Code UI Messages
	VSCODE_OPEN_FOLDER: 'フォルダを開く',
	VSCODE_PLEASE_OPEN_PROJECT: 'まず、プロジェクトフォルダを開いてください！',
	VSCODE_FAILED_SAVE_FILE: 'ファイルの保存に失敗しました： {0}',
	VSCODE_FAILED_UPDATE_INI: 'platformio.iniの更新に失敗しました： {0}',
	VSCODE_UNABLE_SAVE_WORKSPACE: 'ワークスペースの状態を保存できません： {0}',
	VSCODE_FAILED_START: 'Singular Blocklyの起動に失敗しました： {0}',
	VSCODE_CONFIRM_DELETE_VARIABLE: '変数「{0}」を削除してもよろしいですか？',
	VSCODE_BOARD_UPDATED: 'ボード設定を更新しました： {0}',
	VSCODE_RELOAD_REQUIRED: '，設定を完了するにはウィンドウを再読み込みしてください',
	VSCODE_ENTER_VARIABLE_NAME: '新しい変数名を入力してください',
	VSCODE_ENTER_NEW_VARIABLE_NAME: '新しい変数名を入力してください (現在: {0})',
	VSCODE_VARIABLE_NAME_EMPTY: '変数名は空にできません',
	VSCODE_VARIABLE_NAME_INVALID: '変数名には文字、数字、アンダースコアのみ使用でき、数字で始めることはできません',
	VSCODE_RELOAD: '再読み込み',
	VSCODE_OK: 'OK',
	VSCODE_CANCEL: 'キャンセル',
	VSCODE_OPEN_BLOCKLY_EDITOR: 'Blocklyエディタを開く',

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
	CONTROLS_REPEAT_INPUT_DO: '実行',
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
	// Pixetto Smart Camera
	PIXETTO_INIT: 'Pixetto スマートカメラを初期化',
	PIXETTO_RX_PIN: 'RX ピン',
	PIXETTO_TX_PIN: 'TX ピン',
	PIXETTO_IS_DETECTED: 'Pixetto オブジェクト検出',
	PIXETTO_GET_TYPE_ID: 'Pixetto タイプID取得',
	PIXETTO_GET_FUNC_ID: 'Pixetto 機能ID取得',
	PIXETTO_COLOR_DETECT: 'Pixetto 色検出',
	PIXETTO_SHAPE_DETECT: 'Pixetto 形状検出',
	PIXETTO_FACE_DETECT: 'Pixetto 顔検出',
	PIXETTO_APRILTAG_DETECT: 'Pixetto AprilTag検出',
	PIXETTO_NEURAL_NETWORK: 'Pixetto ニューラルネットワーク認識',
	PIXETTO_HANDWRITTEN_DIGIT: 'Pixetto 手書き数字認識',
	PIXETTO_GET_POSITION: 'Pixetto 検出されたオブジェクトを取得',
	PIXETTO_ROAD_DETECT: 'Pixetto 道路検出',
	PIXETTO_SET_MODE: 'Pixetto 機能モードを設定',
	PIXETTO_COLOR: '色',
	PIXETTO_SHAPE: '形状',
	PIXETTO_MODE: 'モード',
	PIXETTO_TAG_ID: 'タグ ID',
	PIXETTO_CLASS_ID: 'クラス ID',
	PIXETTO_DIGIT: '数字',
	PIXETTO_COORDINATE: '座標',
	PIXETTO_ROAD_INFO: '情報',
	// Vision Sensors Category Labels
	PIXETTO_LABEL: 'Pixetto',
	HUSKYLENS_LABEL: 'HUSKYLENS',

	// Pixetto Tooltips
	PIXETTO_INIT_TOOLTIP: 'Pixetto スマートカメラを初期化し、UART通信ピンを設定します',
	PIXETTO_IS_DETECTED_TOOLTIP: 'Pixetto がオブジェクトを検出しているかどうかを検出',
	PIXETTO_GET_TYPE_ID_TOOLTIP: 'Pixetto が検出したオブジェクトのタイプID（色、形状など）を取得',
	PIXETTO_GET_FUNC_ID_TOOLTIP: 'Pixetto が現在使用している機能ID（色検出、形状検出など）を取得',
	PIXETTO_COLOR_DETECT_TOOLTIP: 'Pixetto が指定された色のオブジェクトを検出するかを判定します',
	PIXETTO_SHAPE_DETECT_TOOLTIP: 'Pixetto が指定された形状のオブジェクトを検出するかを判定します',
	PIXETTO_FACE_DETECT_TOOLTIP: 'Pixetto が顔を検出するかを判定します',
	PIXETTO_APRILTAG_DETECT_TOOLTIP: 'Pixetto が指定されたIDのAprilTagを検出するかを判定します',
	PIXETTO_NEURAL_NETWORK_TOOLTIP: 'Pixetto ニューラルネットワークが指定されたクラスのオブジェクトを認識するかを判定します',
	PIXETTO_HANDWRITTEN_DIGIT_TOOLTIP: 'Pixetto が指定された手書き数字を認識するかを判定します',
	PIXETTO_GET_POSITION_TOOLTIP: 'Pixetto で検出されたオブジェクトの位置またはサイズ情報を取得します',
	PIXETTO_ROAD_DETECT_TOOLTIP: 'Pixetto から道路検出関連の情報を取得します',
	PIXETTO_SET_MODE_TOOLTIP: 'Pixetto スマートカメラの機能モードを設定します',

	// Pixetto Color Options
	PIXETTO_COLOR_RED: '赤',
	PIXETTO_COLOR_BLUE: '青',
	PIXETTO_COLOR_GREEN: '緑',
	PIXETTO_COLOR_YELLOW: '黄色',
	PIXETTO_COLOR_ORANGE: 'オレンジ',
	PIXETTO_COLOR_PURPLE: '紫',
	PIXETTO_COLOR_BLACK: '黒',
	PIXETTO_COLOR_WHITE: '白',

	// Pixetto Shape Options
	PIXETTO_SHAPE_TRIANGLE: '三角形',
	PIXETTO_SHAPE_RECTANGLE: '四角形',
	PIXETTO_SHAPE_PENTAGON: '五角形',
	PIXETTO_SHAPE_HEXAGON: '六角形',
	PIXETTO_SHAPE_CIRCLE: '円',

	// Pixetto Position Options
	PIXETTO_POSITION_X: 'X座標',
	PIXETTO_POSITION_Y: 'Y座標',
	PIXETTO_POSITION_WIDTH: '幅',
	PIXETTO_POSITION_HEIGHT: '高さ',

	// Pixetto Road Info Options
	PIXETTO_ROAD_CENTER_X: '中心X',
	PIXETTO_ROAD_CENTER_Y: '中心Y',
	PIXETTO_ROAD_LEFT_X: '左境界X',
	PIXETTO_ROAD_RIGHT_X: '右境界X',

	// Pixetto Mode Options
	PIXETTO_MODE_COLOR_DETECTION: '色検出',
	PIXETTO_MODE_SHAPE_DETECTION: '形状検出',
	PIXETTO_MODE_FACE_DETECTION: '顔検出',
	PIXETTO_MODE_APRILTAG_DETECTION: 'AprilTag検出',
	PIXETTO_MODE_NEURAL_NETWORK: 'ニューラルネットワーク',
	PIXETTO_MODE_HANDWRITTEN_DIGIT: '手書き数字',
	PIXETTO_MODE_ROAD_DETECTION: '道路検出',
	PIXETTO_MODE_BALL_DETECTION: 'ボール検出',
	PIXETTO_MODE_TEMPLATE_MATCHING: 'テンプレートマッチング',

	// HUSKYLENS Smart Camera
	HUSKYLENS_INIT_I2C: 'HUSKYLENS 初期化 (I2C)',
	HUSKYLENS_INIT_UART: 'HUSKYLENS 初期化 (UART)',
	HUSKYLENS_RX_PIN: 'HuskyLens TX に接続 →',
	HUSKYLENS_TX_PIN: 'HuskyLens RX に接続 →',
	HUSKYLENS_SET_ALGORITHM: 'HUSKYLENS アルゴリズム設定',
	HUSKYLENS_ALGORITHM_FACE_RECOGNITION: '顔認識',
	HUSKYLENS_ALGORITHM_OBJECT_TRACKING: 'オブジェクト追跡',
	HUSKYLENS_ALGORITHM_OBJECT_RECOGNITION: 'オブジェクト認識',
	HUSKYLENS_ALGORITHM_LINE_TRACKING: 'ライン追跡',
	HUSKYLENS_ALGORITHM_COLOR_RECOGNITION: '色認識',
	HUSKYLENS_ALGORITHM_TAG_RECOGNITION: 'タグ認識',
	HUSKYLENS_ALGORITHM_OBJECT_CLASSIFICATION: 'オブジェクト分類',
	HUSKYLENS_REQUEST: 'HUSKYLENS データ取得',
	HUSKYLENS_IS_LEARNED: 'HUSKYLENS 学習済み',
	HUSKYLENS_COUNT_BLOCKS: 'HUSKYLENS ブロック数',
	HUSKYLENS_COUNT_ARROWS: 'HUSKYLENS 矢印数',
	HUSKYLENS_GET_BLOCK_INFO: 'ブロック取得',
	HUSKYLENS_GET_ARROW_INFO: '矢印取得',
	HUSKYLENS_BLOCK_INFO_TYPE: 'の',
	HUSKYLENS_ARROW_INFO_TYPE: 'の',
	HUSKYLENS_X_CENTER: 'X中心',
	HUSKYLENS_Y_CENTER: 'Y中心',
	HUSKYLENS_WIDTH: '幅',
	HUSKYLENS_HEIGHT: '高さ',
	HUSKYLENS_ID: 'ID',
	HUSKYLENS_X_ORIGIN: 'X開始点',
	HUSKYLENS_Y_ORIGIN: 'Y開始点',
	HUSKYLENS_X_TARGET: 'X終了点',
	HUSKYLENS_Y_TARGET: 'Y終了点',
	HUSKYLENS_LEARN: 'HUSKYLENS ID 学習',
	HUSKYLENS_FORGET: 'HUSKYLENS 全学習削除',

	// HUSKYLENS Tooltips
	HUSKYLENS_INIT_I2C_TOOLTIP: 'I2C を使用して HUSKYLENS スマートカメラを初期化',
	HUSKYLENS_INIT_UART_TOOLTIP: 'UART を使用して HUSKYLENS スマートカメラを初期化、RX/TX ピンを設定',
	HUSKYLENS_SET_ALGORITHM_TOOLTIP: 'HUSKYLENS で使用する認識アルゴリズムを設定',
	HUSKYLENS_REQUEST_TOOLTIP: 'HUSKYLENS から最新の認識結果を取得',
	HUSKYLENS_IS_LEARNED_TOOLTIP: 'HUSKYLENS が何かを学習しているかを検出',
	HUSKYLENS_COUNT_BLOCKS_TOOLTIP: 'HUSKYLENS で検出されたブロック数を取得',
	HUSKYLENS_COUNT_ARROWS_TOOLTIP: 'HUSKYLENS で検出された矢印数を取得',
	HUSKYLENS_GET_BLOCK_INFO_TOOLTIP: '指定されたブロックの情報（位置、サイズ、または ID）を取得',
	HUSKYLENS_GET_ARROW_INFO_TOOLTIP: '指定された矢印の情報（始点、終点、またはID）を取得',
	HUSKYLENS_LEARN_TOOLTIP: 'HUSKYLENSに指定IDのオブジェクトを学習させる（オブジェクト分類モードのみ）',
	HUSKYLENS_FORGET_TOOLTIP: 'HUSKYLENS の全ての学習済みオブジェクトを削除（オブジェクト分類モードのみ）',
	HUSKYLENS_I2C_PIN_HINT: '配線：',
	HUSKYLENS_UART_PIN_HINT: '推奨ピン：',
	HUSKYLENS_UART_ANY_DIGITAL: '任意のデジタルピン',
	// ESP32 PWM Setup
	ESP32_PWM_SETUP: 'ESP32 PWM設定',
	ESP32_PWM_FREQUENCY: '周波数',
	ESP32_PWM_RESOLUTION: '分解能',
	ESP32_PWM_FREQUENCY_TOOLTIP: 'PWM周波数を設定、範囲1-80000 Hz。モータードライバーチップ用の高周波（20-75KHz）',
	ESP32_PWM_RESOLUTION_TOOLTIP: 'PWM分解能を設定、出力精度に影響します。注意：周波数 × 2^分解能 ≤ 80,000,000',
	ESP32_PWM_RESOLUTION_8BIT: '8ビット (0-255)',
	ESP32_PWM_RESOLUTION_10BIT: '10ビット (0-1023)',
	ESP32_PWM_RESOLUTION_12BIT: '12ビット (0-4095)',
	ESP32_PWM_RESOLUTION_13BIT: '13ビット (0-8191)',
	ESP32_PWM_RESOLUTION_14BIT: '14ビット (0-16383)',
	ESP32_PWM_RESOLUTION_15BIT: '15ビット (0-32767)',
	ESP32_PWM_RESOLUTION_16BIT: '16ビット (0-65535)',
	// Safety Guard (Project Safety Protection)
	SAFETY_WARNING_BODY_NO_TYPE:
		'このプロジェクトにはまだBlocklyブロックがありません。続行すると、ここにblocklyフォルダとファイルが作成されます。続行しますか？',
	SAFETY_WARNING_BODY_WITH_TYPE:
		'{0}プロジェクトを検出しました。このプロジェクトにはまだBlocklyブロックがありません。続行すると、ここにblocklyフォルダとファイルが作成されます。続行しますか？',
	BUTTON_CONTINUE: '続ける',
	BUTTON_CANCEL: 'キャンセル',
	BUTTON_SUPPRESS: '今後表示しない',
	SAFETY_GUARD_CANCELLED: 'Blocklyエディタを開くのをキャンセルしました',
	SAFETY_GUARD_SUPPRESSED: '設定を保存しました。今後この警告は表示されません',

	// Communication Category (WiFi/MQTT)
	CATEGORY_COMMUNICATION: '通信',
	ESP32_WIFI_LABEL: 'WiFi',
	ESP32_MQTT_LABEL: 'MQTT',
	ESP32_WIFI_CONNECT: 'WiFi 接続',
	ESP32_WIFI_CONNECT_SSID: 'SSID',
	ESP32_WIFI_CONNECT_PASSWORD: 'パスワード',
	ESP32_WIFI_CONNECT_TOOLTIP: 'WiFiネットワークに接続（タイムアウト10秒）',
	ESP32_WIFI_DISCONNECT: 'WiFi 切断',
	ESP32_WIFI_DISCONNECT_TOOLTIP: 'WiFi接続を切断',
	ESP32_WIFI_STATUS: 'WiFi 接続済み?',
	ESP32_WIFI_STATUS_TOOLTIP: 'WiFi接続状態を返す',
	ESP32_WIFI_GET_IP: 'WiFi IPアドレス',
	ESP32_WIFI_GET_IP_TOOLTIP: '現在のIPアドレスを取得',
	ESP32_WIFI_SCAN: 'WiFiネットワークをスキャン',
	ESP32_WIFI_SCAN_TOOLTIP: '近くのWiFiネットワークをスキャンして数を返す',
	ESP32_WIFI_GET_SSID: 'WiFi SSIDを取得',
	ESP32_WIFI_GET_SSID_INDEX: 'インデックス',
	ESP32_WIFI_GET_SSID_TOOLTIP: '指定インデックスのWiFi名を取得',
	ESP32_WIFI_GET_RSSI: 'WiFi信号強度を取得',
	ESP32_WIFI_GET_RSSI_INDEX: 'インデックス',
	ESP32_WIFI_GET_RSSI_TOOLTIP: '指定インデックスの信号強度を取得（dBm）',
	ESP32_MQTT_SETUP: 'MQTT 設定',
	ESP32_MQTT_SETUP_SERVER: 'サーバー',
	ESP32_MQTT_SETUP_PORT: 'ポート',
	ESP32_MQTT_SETUP_CLIENT_ID: 'クライアントID',
	ESP32_MQTT_SETUP_TOOLTIP: 'MQTTサーバー接続パラメータを設定',
	ESP32_MQTT_CONNECT: 'MQTT 接続',
	ESP32_MQTT_CONNECT_USERNAME: 'ユーザー名',
	ESP32_MQTT_CONNECT_PASSWORD: 'パスワード',
	ESP32_MQTT_CONNECT_TOOLTIP: 'MQTTサーバーに接続',
	ESP32_MQTT_PUBLISH: 'MQTT 発行',
	ESP32_MQTT_PUBLISH_TOPIC: 'トピック',
	ESP32_MQTT_PUBLISH_MESSAGE: 'メッセージ',
	ESP32_MQTT_PUBLISH_TOOLTIP: '指定トピックにメッセージを発行',
	ESP32_MQTT_SUBSCRIBE: 'MQTT 購読',
	ESP32_MQTT_SUBSCRIBE_TOPIC: 'トピック',
	ESP32_MQTT_SUBSCRIBE_TOOLTIP: '指定トピックのメッセージを購読',
	ESP32_MQTT_LOOP: 'MQTT メッセージ処理',
	ESP32_MQTT_LOOP_TOOLTIP: '接続を維持して受信メッセージを処理（loopに配置）',
	ESP32_MQTT_GET_TOPIC: 'MQTT 最新トピック',
	ESP32_MQTT_GET_TOPIC_TOOLTIP: '最後に受信したメッセージのトピックを取得',
	ESP32_MQTT_GET_MESSAGE: 'MQTT 最新メッセージ',
	ESP32_MQTT_GET_MESSAGE_TOOLTIP: '最後に受信したメッセージの内容を取得',
	ESP32_MQTT_STATUS: 'MQTT 接続済み',
	ESP32_MQTT_STATUS_TOOLTIP: 'MQTT サーバーに接続しているか確認',
	TEXT_TO_NUMBER: 'テキストを数値に',
	TEXT_TO_NUMBER_INT: '整数',
	TEXT_TO_NUMBER_FLOAT: '小数',
	TEXT_TO_NUMBER_TOOLTIP: 'テキストを数値に変換（無効な入力は0を返す）',

	// To String Block
	TO_STRING: '文字列に変換',
	TO_STRING_TOOLTIP: '数値またはブール値を文字列に変換',

	// ESP32 Only Block Warning
	ESP32_ONLY_BLOCK_WARNING: 'このブロックは ESP32 シリーズのボードのみ対応',

	// Quick Backup Toast Messages
	BACKUP_QUICK_SAVE_SUCCESS: 'バックアップ保存完了：{0}',
	BACKUP_QUICK_SAVE_EMPTY: 'ワークスペースが空です、バックアップ不要',
	BACKUP_QUICK_SAVE_COOLDOWN: 'しばらくお待ちください、バックアップが完了したばかりです',
	MAIN_BLOCK_DUPLICATE_WARNING: 'メインプログラムブロックが複数検出されました。余分なブロックを削除してください。',

	// Board Switch Warning
	BOARD_SWITCH_WARNING_TITLE: 'ボードタイプを切替',
	BOARD_SWITCH_WARNING_MESSAGE:
		'異なるボードタイプに切り替えると、現在のワークスペースがクリアされます。\n作業内容は自動的にバックアップされます。\n\n続行しますか？',

	// CyberBrick Board
	BOARD_CYBERBRICK: 'CyberBrick',

	// CyberBrick Category
	CATEGORY_CYBERBRICK_CORE: 'CyberBrick',
	CATEGORY_CYBERBRICK_LED: 'LED',
	CATEGORY_CYBERBRICK_GPIO: 'GPIO',
	CATEGORY_CYBERBRICK_TIME: '時間',

	// CyberBrick Main Block
	CYBERBRICK_MAIN: 'メインプログラム',
	CYBERBRICK_MAIN_TOOLTIP: 'CyberBrickメインプログラムのエントリーポイント。すべてのコードはこのブロック内に配置してください。',

	// CyberBrick LED Blocks
	CYBERBRICK_LED_SET_COLOR: 'LED色を設定',
	CYBERBRICK_LED_SET_COLOR_PREFIX: 'オンボードLEDの色を設定',
	CYBERBRICK_LED_RED: '赤',
	CYBERBRICK_LED_GREEN: '緑',
	CYBERBRICK_LED_BLUE: '青',
	CYBERBRICK_LED_SET_COLOR_TOOLTIP: 'オンボードLED（GPIO8）の色をRGB値（0-255）で設定',
	CYBERBRICK_LED_OFF: 'LEDをオフ',
	CYBERBRICK_LED_OFF_TOOLTIP: 'オンボードLEDをオフにする',

	// CyberBrick GPIO Blocks
	CYBERBRICK_GPIO_SET: 'GPIO設定',
	CYBERBRICK_GPIO_SET_PREFIX: 'GPIO',
	CYBERBRICK_GPIO_SET_TO: 'を',
	CYBERBRICK_GPIO_PIN: 'ピン',
	CYBERBRICK_GPIO_VALUE: '値',
	CYBERBRICK_GPIO_HIGH: 'HIGH',
	CYBERBRICK_GPIO_LOW: 'LOW',
	CYBERBRICK_GPIO_SET_TOOLTIP: 'GPIOピンをHIGHまたはLOWに設定',
	CYBERBRICK_GPIO_READ: 'GPIO読取',
	CYBERBRICK_GPIO_READ_TOOLTIP: 'GPIOピンからデジタル値を読み取る（0または1を返す）',

	// CyberBrick Time Blocks
	CYBERBRICK_DELAY_MS: '遅延（ミリ秒）',
	CYBERBRICK_DELAY_MS_PREFIX: '遅延',
	CYBERBRICK_DELAY_MS_SUFFIX: 'ミリ秒',
	CYBERBRICK_DELAY_MS_TOOLTIP: '指定したミリ秒間プログラムの実行を一時停止',
	CYBERBRICK_DELAY_S: '遅延（秒）',
	CYBERBRICK_DELAY_S_PREFIX: '遅延',
	CYBERBRICK_DELAY_S_SUFFIX: '秒',
	CYBERBRICK_DELAY_S_TOOLTIP: '指定した秒数プログラムの実行を一時停止',
	CYBERBRICK_TICKS_MS: '現在のミリ秒を取得',
	CYBERBRICK_TICKS_MS_TOOLTIP: '現在のミリ秒カウンタを取得',
	CYBERBRICK_TICKS_DIFF_PREFIX: '時間差',
	CYBERBRICK_TICKS_DIFF_NOW: '現在',
	CYBERBRICK_TICKS_DIFF_START: '開始',
	CYBERBRICK_TICKS_DIFF_TOOLTIP: '現在と開始の間のミリ秒を計算',

	// CyberBrick WiFi Blocks
	CATEGORY_CYBERBRICK_WIFI: 'WiFi',
	CYBERBRICK_WIFI_CONNECT: 'WiFi接続',
	CYBERBRICK_WIFI_SSID: 'SSID',
	CYBERBRICK_WIFI_PASSWORD: 'パスワード',
	CYBERBRICK_WIFI_CONNECT_TOOLTIP: '指定したWiFiネットワークに接続',
	CYBERBRICK_WIFI_DISCONNECT: 'WiFi切断',
	CYBERBRICK_WIFI_DISCONNECT_TOOLTIP: '現在のWiFiネットワークから切断',
	CYBERBRICK_WIFI_IS_CONNECTED: 'WiFi接続中？',
	CYBERBRICK_WIFI_IS_CONNECTED_TOOLTIP: 'WiFiが接続されているか確認',
	CYBERBRICK_WIFI_GET_IP: 'IPアドレス取得',
	CYBERBRICK_WIFI_GET_IP_TOOLTIP: '現在のIPアドレスを取得',

	// CyberBrick Upload
	UPLOAD_BUTTON_TITLE: 'CyberBrickにアップロード',
	UPLOAD_BUTTON_DISABLED_TITLE: 'アップロードを有効にするには、まずワークスペースを保存してください',
	UPLOAD_STARTING: 'アップロード開始中...',
	UPLOAD_SUCCESS: 'アップロード成功！',
	UPLOAD_FAILED: 'アップロード失敗：{0}',
	UPLOAD_NO_PORT: 'CyberBrickデバイスが見つかりません',
	UPLOAD_IN_PROGRESS: 'アップロード中...',
	UPLOAD_EMPTY_WORKSPACE: 'ワークスペースが空です、まずブロックを追加してください',
	UPLOAD_NO_CODE: 'コードを生成できません',

	// Upload progress stages
	UPLOAD_STAGE_PREPARING: '準備中',
	UPLOAD_STAGE_CHECKING: 'ツール確認中',
	UPLOAD_STAGE_INSTALLING: 'ツールインストール中',
	UPLOAD_STAGE_CONNECTING: 'デバイス接続中',
	UPLOAD_STAGE_RESETTING: 'デバイスリセット中',
	UPLOAD_STAGE_BACKUP: 'バックアップ中',
	UPLOAD_STAGE_UPLOADING: 'アップロード中',
	UPLOAD_STAGE_RESTARTING: 'デバイス再起動中',
	UPLOAD_STAGE_COMPLETED: '完了',

	// Upload error messages
	ERROR_UPLOAD_BOARD_UNSUPPORTED: 'CyberBrickボードのみサポートされています',
	ERROR_UPLOAD_CODE_EMPTY: 'コードが空です',
	ERROR_UPLOAD_NO_PYTHON: 'PlatformIO Python環境が見つかりません。先にPlatformIOをインストールしてください。',
	ERROR_UPLOAD_MPREMOTE_FAILED: 'mpremoteのインストールに失敗しました',
	ERROR_UPLOAD_DEVICE_NOT_FOUND: 'CyberBrickデバイスが見つかりません。接続を確認してください。',
	ERROR_UPLOAD_RESET_FAILED: 'デバイスのリセットに失敗しました',
	ERROR_UPLOAD_UPLOAD_FAILED: 'プログラムのアップロードに失敗しました',
	ERROR_UPLOAD_RESTART_FAILED: 'デバイスの再起動に失敗しました',

	// Arduino アップロードボタン
	UPLOAD_BUTTON_TITLE_ARDUINO: 'コンパイル＆アップロード',
	UPLOAD_SELECT_BOARD: '先にボードを選択してください',

	// Arduino アップロード段階
	ARDUINO_STAGE_SYNCING: '設定を同期中',
	ARDUINO_STAGE_SAVING: 'ワークスペースを保存中',
	ARDUINO_STAGE_CHECKING: 'コンパイラを確認中',
	ARDUINO_STAGE_DETECTING: 'ボードを検出中',
	ARDUINO_STAGE_COMPILING: 'コンパイル中',
	ARDUINO_STAGE_UPLOADING: 'アップロード中',

	// Arduino アップロード結果
	ARDUINO_COMPILE_SUCCESS: 'コンパイル成功！',
	ARDUINO_UPLOAD_SUCCESS: 'アップロード成功！',

	// Arduino アップロードエラー
	ERROR_ARDUINO_PIO_NOT_FOUND: 'PlatformIO CLIが見つかりません。先にPlatformIOをインストールしてください。',
	ERROR_ARDUINO_COMPILE_FAILED: 'コンパイルに失敗しました',
	ERROR_ARDUINO_UPLOAD_FAILED: 'アップロードに失敗しました',
	ERROR_ARDUINO_NO_WORKSPACE: '先にプロジェクトフォルダを開いてください',
	ERROR_ARDUINO_TIMEOUT: '操作がタイムアウトしました',
	ERROR_ARDUINO_DEVICE_DISCONNECT: 'デバイスが切断されました',

	// Backup messages
	BACKUP_CONFIRM_DELETE: 'バックアップ「{0}」を削除してもよろしいですか？',
	BACKUP_CONFIRM_RESTORE: 'バックアップ「{0}」を復元してもよろしいですか？現在のワークスペースは上書きされます。',
	BACKUP_ERROR_NOT_FOUND: 'バックアップ「{0}」が見つかりません',
	BACKUP_ERROR_CREATE_FAILED: 'バックアップの作成に失敗しました：{0}',
	BACKUP_ERROR_DELETE_FAILED: 'バックアップの削除に失敗しました：{0}',
	BACKUP_ERROR_RESTORE_FAILED: 'バックアップの復元に失敗しました：{0}',
	BACKUP_ERROR_PREVIEW_FAILED: 'バックアップのプレビューに失敗しました：{0}',
	BACKUP_ERROR_NAME_NOT_SPECIFIED: 'バックアップ名が指定されていません',
	BACKUP_ERROR_MAIN_NOT_FOUND: 'main.jsonファイルが見つかりません',
	BACKUP_ERROR_UPDATE_SETTINGS_FAILED: '自動バックアップ設定の更新に失敗しました',

	// Button labels
	BUTTON_DELETE: '削除',
	BUTTON_RESTORE: '復元',

	// Error messages
	ERROR_PROCESSING_MESSAGE: 'メッセージの処理中にエラーが発生しました：{0}',
	ERROR_SETTINGS_UPDATE_FAILED: '設定の更新に失敗しました',
	ERROR_RELOAD_WORKSPACE_FAILED: 'ワークスペースの再読み込みに失敗しました：{0}',
	ERROR_OPEN_PROJECT_FOLDER_FIRST: '最初にプロジェクトフォルダを開いてください',

	// Info messages
	INFO_NO_BACKUPS_TO_PREVIEW: 'プレビューするバックアップファイルがありません',

	// Dialog messages
	DIALOG_SELECT_BACKUP_TITLE: 'プレビューするバックアップファイルを選択',
	DIALOG_BACKUP_FILES_LABEL: 'バックアップファイル',

	// X11 拡張ボード
	CATEGORY_X11: 'X11 拡張',
	X11_LABEL_SERVOS: 'サーボモーター',
	X11_LABEL_MOTORS: 'モーター',
	X11_LABEL_LEDS: 'LED',

	// X11 180° サーボブロック
	X11_SERVO_180_ANGLE_PREFIX: 'サーボ',
	X11_SERVO_180_ANGLE_SUFFIX: 'の角度を設定',
	X11_SERVO_180_ANGLE_TOOLTIP: '180° サーボの角度を設定 (0-180度)',

	// X11 360° サーボブロック
	X11_SERVO_360_SPEED_PREFIX: 'サーボ',
	X11_SERVO_360_SPEED_SUFFIX: 'の速度を設定',
	X11_SERVO_360_SPEED_TOOLTIP: '360° 連続回転サーボの速度を設定 (-100～100、負の値=逆回転)',

	// X11 サーボ停止ブロック
	X11_SERVO_STOP: 'サーボを停止',
	X11_SERVO_STOP_TOOLTIP: '指定したサーボを停止',

	// X11 モーターブロック
	X11_MOTOR_SPEED_PREFIX: 'モーター',
	X11_MOTOR_SPEED_SUFFIX: 'の速度を設定',
	X11_MOTOR_SPEED_TOOLTIP: 'DCモーターの速度を設定 (-2048～2048、負の値=逆回転)',
	X11_MOTOR_STOP: 'モーターを停止',
	X11_MOTOR_STOP_TOOLTIP: '指定したモーターを停止',

	// X11 LED ブロック
	X11_LED_SET_COLOR_PREFIX: 'LEDテープ',
	X11_LED_SET_COLOR_INDEX: 'インデックス',
	X11_LED_SET_COLOR_INDEX_SUFFIX: 'の色を設定 R',
	X11_LED_SET_COLOR_TOOLTIP: 'LEDテープのピクセル色を設定 (インデックス 0=最初、または全て)',
	X11_LED_INDEX_ALL: '全て',

	// === X12 送信機拡張ボード ===
	CATEGORY_X12: 'X12 拡張ボード',
	X12_LABEL_JOYSTICK: 'ジョイスティック',
	X12_LABEL_BUTTON: 'ボタン',

	// X12 ジョイスティックブロック
	X12_GET_JOYSTICK_PREFIX: 'ジョイスティック',
	X12_GET_JOYSTICK_SUFFIX: '値',
	X12_GET_JOYSTICK_TOOLTIP: 'ジョイスティックのADC値を読み取る (0-4095)',
	X12_GET_JOYSTICK_MAPPED_PREFIX: 'ジョイスティック',
	X12_GET_JOYSTICK_MAPPED_MIN: 'マップ',
	X12_GET_JOYSTICK_MAPPED_MAX: '~',
	X12_GET_JOYSTICK_MAPPED_TOOLTIP: 'ジョイスティックを読み取り、指定範囲にマップ',

	// X12 ボタンブロック
	X12_IS_BUTTON_PRESSED_PREFIX: 'ボタン',
	X12_IS_BUTTON_PRESSED_SUFFIX: '押された?',
	X12_IS_BUTTON_PRESSED_TOOLTIP: 'ボタンが押されているか確認',

	// === RC リモコン通信 ===

	// RC 初期化ブロック

	// RC ジョイスティックブロック

	// RC ボタンブロック

	// RC ステータスブロック

	// === RC接続 ===
	CATEGORY_RC: 'RC接続',
	RC_LABEL_MASTER: '📡 送信機',
	RC_LABEL_SLAVE: '📻 受信機',
	RC_LABEL_DATA: '📊 データ読取',
	RC_LABEL_STATUS: '🔗 接続状態',

	// RC 送信機ブロック
	RC_MASTER_INIT: 'RC送信機を初期化',
	RC_MASTER_INIT_PAIR_ID: 'ペアID',
	RC_MASTER_INIT_CHANNEL: 'チャンネル',
	RC_MASTER_INIT_TOOLTIP: 'RC送信機を初期化、ペアID (1-255) とチャンネル (1-11) を設定',
	RC_SEND: 'RCデータを送信',
	RC_SEND_TOOLTIP: 'X12ジョイスティック/ボタンデータを読み取り受信機に送信',

	// RC 受信機ブロック
	RC_SLAVE_INIT: 'RC受信機を初期化',
	RC_SLAVE_INIT_PAIR_ID: 'ペアID',
	RC_SLAVE_INIT_CHANNEL: 'チャンネル',
	RC_SLAVE_INIT_TOOLTIP: 'RC受信機を初期化、ペアID (1-255) とチャンネル (1-11) を設定',
	RC_WAIT_CONNECTION: 'ペアリング待機',
	RC_WAIT_TIMEOUT: 'タイムアウト',
	RC_WAIT_SECONDS: '秒',
	RC_WAIT_TOOLTIP: '送信機の接続を待機、LEDが青く点滅、タイムアウト後に続行',
	RC_IS_CONNECTED: 'RC接続中?',
	RC_IS_CONNECTED_TOOLTIP: '500ms以内にデータを受信したか確認',

	// RC データ読取ブロック
	RC_GET_JOYSTICK_PREFIX: 'RC ジョイスティック',
	RC_GET_JOYSTICK_TOOLTIP: 'リモートジョイスティックの値を読取 (0-4095)、2048が中央',
	RC_GET_JOYSTICK_MAPPED_PREFIX: 'RC ジョイスティック',
	RC_GET_JOYSTICK_MAPPED_MIN: 'マップ',
	RC_GET_JOYSTICK_MAPPED_MAX: '~',
	RC_GET_JOYSTICK_MAPPED_TOOLTIP: 'リモートジョイスティックを読み取り指定範囲にマップ',
	RC_IS_BUTTON_PRESSED_PREFIX: 'RC ボタン',
	RC_IS_BUTTON_PRESSED_SUFFIX: '押された?',
	RC_IS_BUTTON_PRESSED_TOOLTIP: 'リモートボタンが押されているか確認',
	RC_GET_BUTTON_PREFIX: 'RC ボタン',
	RC_GET_BUTTON_SUFFIX: '状態',
	RC_GET_BUTTON_TOOLTIP: 'リモートボタンの状態を読取 (0=押下, 1=解放)',
});

