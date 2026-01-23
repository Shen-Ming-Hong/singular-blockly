/**
 * @license
 * Copyright 2025 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file contains translations derived from Blockly project
 * Copyright 2012 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

// Define translations for Bulgarian
window.languageManager.loadMessages('bg', {
	// UI Elements
	BLOCKS_TAB: 'Блокове',
	CODE_TAB: 'Код',
	BOARD_SELECT_LABEL: 'Избор на платка:',
	LANGUAGE_SELECT_TOOLTIP: 'Изберете език',
	LANGUAGE_AUTO: 'Автоматично (следва VS Code)',

	// Experimental Blocks Notice
	EXPERIMENTAL_BLOCKS_TITLE: 'Открити са експериментални блокове',
	EXPERIMENTAL_BLOCKS_DESC:
		'Вашето работно пространство съдържа експериментални блокове (откроени с жълти пунктирани граници). Тези функции могат да бъдат променени или премахнати в бъдещи актуализации, използвайте ги с повишено внимание.',

	// Preview Mode UI
	PREVIEW_BADGE: 'Преглед',
	THEME_TOGGLE: 'Смяна на тема',
	PREVIEW_WINDOW_TITLE: 'Blockly Преглед - {0}',
	PREVIEW_WINDOW_TITLE_WITH_NAME: 'Преглед - {0}',

	// Backup Modal UI
	BACKUP_MANAGER_TITLE: 'Управление на архиви',
	BACKUP_CREATE_NEW: 'Създаване на нов архив',
	BACKUP_NAME_LABEL: 'Име на архив:',
	BACKUP_NAME_PLACEHOLDER: 'Въведете име на архива',
	BACKUP_CONFIRM: 'Потвърждение',
	BACKUP_CANCEL: 'Отказ',
	BACKUP_LIST_TITLE: 'Списък с архиви',
	BACKUP_LIST_EMPTY: 'Няма налични архиви',
	BACKUP_BUTTON_TITLE: 'Управление на архиви',
	REFRESH_BUTTON_TITLE: 'Обнови кода',
	BACKUP_PREVIEW_BTN: 'Преглед',
	BACKUP_RESTORE_BTN: 'Възстановяване',
	BACKUP_DELETE_BTN: 'Изтриване',
	AUTO_BACKUP_TITLE: 'Настройки за автоматично архивиране',
	AUTO_BACKUP_INTERVAL_LABEL: 'Интервал на архивиране:',
	AUTO_BACKUP_MINUTES: 'минути',
	AUTO_BACKUP_SAVE: 'Запазване на настройките',
	AUTO_BACKUP_SAVED: 'Настройките за автоматично архивиране са запазени',
	AUTO_BACKUP_PREFIX: 'auto_',
	MANUAL_BACKUP_TITLE: 'Ръчно архивиране',

	// Board Names
	BOARD_NONE: 'Няма',
	BOARD_UNO: 'Arduino Uno',
	BOARD_NANO: 'Arduino Nano',
	BOARD_MEGA: 'Arduino Mega',
	BOARD_ESP32: 'ESP32',
	BOARD_SUPERMINI: 'Super Mini',
	// Block Search UI
	FUNCTION_SEARCH_TITLE: 'Търсене на блокове',
	FUNCTION_SEARCH_BUTTON_TITLE: 'Търсене на блокове',
	FUNCTION_SEARCH_PLACEHOLDER: 'Въведете име на блок или параметри...',
	FUNCTION_SEARCH_BTN: 'Търсене',
	FUNCTION_SEARCH_PREV: 'Предишен',
	FUNCTION_SEARCH_NEXT: 'Следващ',
	FUNCTION_SEARCH_EMPTY: 'Все още не е търсено',
	FUNCTION_SEARCH_NO_RESULTS: 'Не са намерени съвпадащи блокове',
	FUNCTION_RESULT_PREFIX: 'Блок: ',
	FUNCTION_KEYBOARD_SHORTCUT_TIP: '(Клавишна комбинация: Ctrl+F)',
	FUNCTION_SEARCH_HISTORY_TITLE: 'История на търсенето',

	// Block Categories
	CATEGORY_LOGIC: 'Логика',
	CATEGORY_LOOPS: 'Цикли',
	CATEGORY_MATH: 'Математика',
	CATEGORY_TEXT: 'Текст',
	CATEGORY_LISTS: 'Списъци',
	CATEGORY_VARIABLES: 'Променливи',
	CATEGORY_FUNCTIONS: 'Функции',
	CATEGORY_ARDUINO: 'Arduino',
	CATEGORY_SENSORS: 'Сензори',
	CATEGORY_MOTORS: 'Мотори',
	VISION_SENSORS_CATEGORY: 'Визуални Сензори',
	// Servo Block Labels
	SERVO_SETUP: 'Настройване на серво мотор',
	SERVO_PIN: 'Пин',
	SERVO_SETUP_TOOLTIP: 'Обявяване на променлива за серво мотор и задаване на пин',
	SERVO_MOVE: 'Завъртане на серво мотор',
	SERVO_ANGLE: 'Ъгъл',
	SERVO_MOVE_TOOLTIP: 'Завъртане на серво мотор до определен ъгъл',
	SERVO_STOP: 'Спиране на серво мотор',
	SERVO_STOP_TOOLTIP: 'Спиране на изходния сигнал на серво мотора',

	// Encoder Motor Control
	ENCODER_SETUP: 'Настройка на енкодерен мотор',
	ENCODER_NAME: 'Име',
	ENCODER_PIN_A: 'Пин A',
	ENCODER_PIN_B: 'Пин B',
	ENCODER_USE_INTERRUPT: 'Използване на прекъсване',
	ENCODER_SETUP_TOOLTIP: 'Настройка на енкодерен мотор с име и конфигурации на пиновете',
	ENCODER_READ: 'Четене на енкодер',
	ENCODER_READ_TOOLTIP: 'Получаване на текущата позиция на енкодера',
	ENCODER_RESET: 'Нулиране на енкодер',
	ENCODER_RESET_TOOLTIP: 'Нулиране на позицията на енкодера до нула',
	ENCODER_PID_SETUP: 'Настройка на PID контрол',
	ENCODER_PID_MOTOR: 'Мотор',
	ENCODER_PID_KP: 'Kp',
	ENCODER_PID_KI: 'Ki',
	ENCODER_PID_KD: 'Kd',
	ENCODER_PID_MODE: 'Режим',
	ENCODER_PID_MODE_POSITION: 'Позиция',
	ENCODER_PID_MODE_SPEED: 'Скорост',
	ENCODER_PID_SETUP_TOOLTIP: 'Конфигуриране на PID контрол за прецизен контрол на мотора. Изберете режим за позиция или скорост.',
	ENCODER_PID_COMPUTE: 'Изчисляване на PID',
	ENCODER_PID_TARGET: 'Цел',
	ENCODER_PID_COMPUTE_TOOLTIP: 'Изчисляване на изход на PID контрол въз основа на целева позиция',
	ENCODER_PID_RESET: 'Нулиране на PID',
	ENCODER_PID_RESET_TOOLTIP: 'Нулиране на състоянието на PID контролера (изчистване на интегралното натрупване, нулиране на брояча)',

	// Arduino Block Labels
	ARDUINO_SETUP: 'Настройка',
	ARDUINO_LOOP: 'Цикъл',
	ARDUINO_DIGITAL_WRITE: 'Цифров запис',
	ARDUINO_DIGITAL_READ: 'Цифрово четене',
	ARDUINO_ANALOG_WRITE: 'Аналогов запис',
	ARDUINO_ANALOG_READ: 'Аналогово четене',
	ARDUINO_PIN: 'Пин',
	ARDUINO_VALUE: 'Стойност',
	ARDUINO_DELAY: 'Забавяне',
	ARDUINO_DELAY_MS: 'милисекунди',
	ARDUINO_PULLUP: 'Активиране на вътрешен издърпващ резистор',
	ARDUINO_MODE: 'Режим',
	ARDUINO_MODE_INPUT: 'ВХОД',
	ARDUINO_MODE_OUTPUT: 'ИЗХОД',

	// Sensor Block Labels
	ULTRASONIC_SENSOR: 'Ултразвуков сензор',
	ULTRASONIC_TRIG_PIN: 'Trig пин',
	ULTRASONIC_ECHO_PIN: 'Echo пин',
	ULTRASONIC_USE_INTERRUPT: 'Използване на хардуерно прекъсване',
	ULTRASONIC_READ: 'Прочитане на ултразвуково разстояние (см)',
	ULTRASONIC_TOOLTIP_SETUP:
		'Конфигурира ултразвуковия сензор с Trig и Echo пинове. Опционално хардуерно прекъсване за по-голяма точност.',
	ULTRASONIC_TOOLTIP_READ: 'Прочита разстоянието, измерено от ултразвуковия сензор в сантиметри.',
	ULTRASONIC_WARNING: 'Избраният Echo пин {0} не поддържа хардуерни прекъсвания. Моля, изберете един от тези пинове: {1}',

	// Threshold Function Block Labels
	THRESHOLD_PIN: 'на',
	THRESHOLD_VALUE: 'ако >',
	THRESHOLD_HIGH_VALUE: '=',
	THRESHOLD_LOW_VALUE: 'иначе',
	THRESHOLD_TOOLTIP_SETUP:
		'Конфигурира функция за праг. Когато аналоговият вход надвиши прага, връща първия изход, в противен случай връща втория.',
	THRESHOLD_TOOLTIP_READ: 'Получава стойност от функцията за праг',

	// Duration block
	DURATION_REPEAT: 'Повтори за',
	DURATION_TIME: 'време',
	DURATION_MS: 'милисекунди',
	DURATION_DO: 'изпълни',

	// Print block
	TEXT_PRINT_SHOW: 'отпечатай',
	TEXT_PRINT_NEWLINE: 'нов ред',

	// Pin Mode block
	PIN_MODE_SET: 'задай',

	// Function Block Labels
	FUNCTION_CREATE: 'Създай функция',
	FUNCTION_NAME: 'Име',
	FUNCTION_PARAMS: 'Параметри',
	FUNCTION_RETURN: 'Връщане',
	FUNCTION_CALL: 'Извикване',

	// Logic Block Labels
	LOGIC_IF: 'ако',
	LOGIC_ELSE: 'иначе',
	LOGIC_THEN: 'тогава',
	LOGIC_AND: 'и',
	LOGIC_OR: 'или',
	LOGIC_NOT: 'не',
	LOGIC_TRUE: 'вярно',
	LOGIC_FALSE: 'грешно',

	// Loop Block Labels
	LOOP_REPEAT: 'повтори',
	LOOP_WHILE: 'докато',
	LOOP_UNTIL: 'докато не',
	LOOP_FOR: 'за',
	LOOP_FOREACH: 'за всеки',
	LOOP_BREAK: 'прекъсни',
	LOOP_CONTINUE: 'продължи',

	// Math Block Labels
	MATH_NUMBER: 'число',
	MATH_ARITHMETIC: 'аритметика',
	MATH_OPERATIONS: 'операции',
	MATH_ADD: 'добави',
	MATH_SUBTRACT: 'извади',
	MATH_MULTIPLY: 'умножи',
	MATH_DIVIDE: 'раздели',
	MATH_POWER: 'степен',

	// Math Map Block
	MATH_MAP_VALUE: 'преобразувай',
	MATH_MAP_TOOLTIP:
		'Преобразува число от един диапазон в друг. Например, map(стойност, 0, 1023, 0, 255) ще мащабира аналогов вход към 8-битов PWM изход.',

	// VS Code UI Messages
	VSCODE_OPEN_FOLDER: 'Отваряне на папка',
	VSCODE_PLEASE_OPEN_PROJECT: 'Моля, първо отворете папка на проекта!',
	VSCODE_FAILED_SAVE_FILE: 'Неуспешно записване на файла: {0}',
	VSCODE_FAILED_UPDATE_INI: 'Неуспешно актуализиране на platformio.ini: {0}',
	VSCODE_UNABLE_SAVE_WORKSPACE: 'Не може да се запише състоянието на работната среда: {0}',
	VSCODE_FAILED_START: 'Неуспешно стартиране на Singular Blockly: {0}',
	VSCODE_CONFIRM_DELETE_VARIABLE: 'Наистина ли искате да изтриете променливата "{0}"?',
	VSCODE_BOARD_UPDATED: 'Конфигурацията на платката е актуализирана до: {0}',
	VSCODE_RELOAD_REQUIRED: '，Моля, презаредете прозореца, за да завършите настройката',
	VSCODE_ENTER_VARIABLE_NAME: 'Въведете име на новата променлива',
	VSCODE_ENTER_NEW_VARIABLE_NAME: 'Въведете ново име на променливата (текущо: {0})',
	VSCODE_VARIABLE_NAME_EMPTY: 'Името на променливата не може да бъде празно',
	VSCODE_VARIABLE_NAME_INVALID: 'Името на променливата може да съдържа само букви, цифри и подчертаване, и не може да започва с цифра',
	VSCODE_RELOAD: 'Презареждане',
	VSCODE_OK: 'OK',
	VSCODE_CANCEL: 'Отказ',
	VSCODE_OPEN_BLOCKLY_EDITOR: 'Отваряне на редактора Blockly',

	// Error Messages
	ERROR_BOARD_NOT_SELECTED: 'Моля, първо изберете платка',
	ERROR_INVALID_PIN: 'Невалиден номер на пин',
	ERROR_INVALID_VALUE: 'Невалидна стойност',
	ERROR_MISSING_TRANSLATION: 'Липсващ превод',

	// Blockly core messages
	ADD: 'добави',
	REMOVE: 'премахни',
	RENAME: 'преименувай',
	NEW: 'нов',
	ADD_COMMENT: 'Добави коментар',
	REMOVE_COMMENT: 'Премахни коментар',
	DUPLICATE_BLOCK: 'Дублирай',
	HELP: 'Помощ',
	UNDO: 'Отмени',
	REDO: 'Повтори',
	COLLAPSE_BLOCK: 'Свий блок',
	EXPAND_BLOCK: 'Разгъни блок',
	DELETE_BLOCK: 'Изтрий блок',
	DELETE_X_BLOCKS: 'Изтрий %1 блока',
	DELETE_ALL_BLOCKS: 'Изтрий всички %1 блока?',
	CLEAN_UP: 'Подреди блоковете',
	COLLAPSE_ALL: 'Свий блоковете',
	EXPAND_ALL: 'Разгъни блоковете',
	DISABLE_BLOCK: 'Деактивирай блок',
	ENABLE_BLOCK: 'Активирай блок',
	INLINE_INPUTS: 'Вътрешни входове',
	EXTERNAL_INPUTS: 'Външни входове',

	// Variable & Function messages
	RENAME_VARIABLE: 'Преименувай променлива...',
	NEW_VARIABLE: 'Създай променлива...',
	DELETE_VARIABLE: 'Изтрий променлива %1',
	PROCEDURE_ALREADY_EXISTS: 'Процедура с име "%1" вече съществува.',

	// Logic block messages
	CONTROLS_IF_MSG_IF: 'ако',
	CONTROLS_IF_MSG_THEN: 'тогава',
	CONTROLS_IF_MSG_ELSE: 'иначе',
	CONTROLS_IF_MSG_ELSEIF: 'иначе ако',
	CONTROLS_IF_IF_TITLE_IF: 'ако',
	CONTROLS_IF_ELSEIF_TITLE_ELSEIF: 'иначе ако',
	CONTROLS_IF_ELSE_TITLE_ELSE: 'иначе',
	LOGIC_COMPARE_TOOLTIP_EQ: 'Връща вярно, ако двата входа са равни.',
	LOGIC_COMPARE_TOOLTIP_NEQ: 'Връща вярно, ако двата входа не са равни.',
	LOGIC_COMPARE_TOOLTIP_LT: 'Връща вярно, ако първият вход е по-малък от втория.',
	LOGIC_COMPARE_TOOLTIP_LTE: 'Връща вярно, ако първият вход е по-малък или равен на втория.',
	LOGIC_COMPARE_TOOLTIP_GT: 'Връща вярно, ако първият вход е по-голям от втория.',
	LOGIC_COMPARE_TOOLTIP_GTE: 'Връща вярно, ако първият вход е по-голям или равен на втория.',
	LOGIC_OPERATION_AND: 'и',
	LOGIC_OPERATION_OR: 'или',
	LOGIC_NEGATE_TITLE: 'не %1',
	LOGIC_BOOLEAN_TRUE: 'вярно',
	LOGIC_BOOLEAN_FALSE: 'грешно',
	LOGIC_NULL: 'нула',

	// Additional Logic Block Messages
	LOGIC_COMPARE_HELPURL: 'https://bg.wikipedia.org/wiki/Неравенство_(математика)',
	LOGIC_NEGATE_HELPURL: 'https://github.com/google/blockly/wiki/Logic#not',
	LOGIC_NEGATE_TOOLTIP: 'Връща вярно, ако входът е грешен. Връща грешно, ако входът е верен.',
	LOGIC_OPERATION_TOOLTIP_AND: 'Връща вярно, ако двата входа са верни.',
	LOGIC_OPERATION_TOOLTIP_OR: 'Връща вярно, ако поне един от входовете е верен.',
	LOGIC_BOOLEAN_TOOLTIP: 'Връща или вярно, или грешно.',

	// Loop block messages
	CONTROLS_REPEAT_TITLE: 'повтори %1 пъти',
	CONTROLS_REPEAT_INPUT_DO: 'изпълни',
	CONTROLS_WHILEUNTIL_OPERATOR_WHILE: 'повтаряй докато',
	CONTROLS_WHILEUNTIL_OPERATOR_UNTIL: 'повтаряй докато не',
	CONTROLS_FOR_TITLE: 'брой с %1 от %2 до %3 със стъпка %4',
	CONTROLS_FLOW_STATEMENTS_OPERATOR_BREAK: 'излез от цикъла',
	CONTROLS_FLOW_STATEMENTS_OPERATOR_CONTINUE: 'продължи със следващата итерация',
	CONTROLS_REPEAT_TOOLTIP: 'Изпълнява няколко команди няколко пъти.',
	CONTROLS_WHILEUNTIL_TOOLTIP_WHILE: 'Докато стойността е вярна, изпълнява командите.',
	CONTROLS_WHILEUNTIL_TOOLTIP_UNTIL: 'Докато стойността е грешна, изпълнява командите.',
	CONTROLS_FOR_TOOLTIP: 'Брои от начално число до крайно число със зададена стъпка.',
	CONTROLS_FLOW_STATEMENTS_WARNING: 'Внимание: Този блок може да се използва само в цикъл.',

	// Math block messages
	MATH_NUMBER_HELPURL: 'https://bg.wikipedia.org/wiki/Число',
	MATH_NUMBER_TOOLTIP: 'Число.',
	MATH_ARITHMETIC_OPERATOR_ADD: '+',
	MATH_ARITHMETIC_OPERATOR_MINUS: '-',
	MATH_ARITHMETIC_OPERATOR_MULTIPLY: '×',
	MATH_ARITHMETIC_OPERATOR_DIVIDE: '÷',
	MATH_ARITHMETIC_OPERATOR_POWER: '^',
	MATH_SINGLE_OPERATOR_ROOT: 'корен квадратен',
	MATH_SINGLE_OPERATOR_ABSOLUTE: 'абсолютна стойност',
	MATH_IS_EVEN: 'е четно',
	MATH_IS_ODD: 'е нечетно',
	MATH_IS_PRIME: 'е просто',
	MATH_IS_WHOLE: 'е цяло',
	MATH_IS_POSITIVE: 'е положително',
	MATH_IS_NEGATIVE: 'е отрицателно',
	MATH_ARITHMETIC_HELPURL: 'https://bg.wikipedia.org/wiki/Аритметика',
	MATH_ARITHMETIC_TOOLTIP_ADD: 'Връща сумата на двете числа.',
	MATH_ARITHMETIC_TOOLTIP_MINUS: 'Връща разликата на двете числа.',
	MATH_ARITHMETIC_TOOLTIP_MULTIPLY: 'Връща произведението на двете числа.',
	MATH_ARITHMETIC_TOOLTIP_DIVIDE: 'Връща частното на двете числа.',
	MATH_ARITHMETIC_TOOLTIP_POWER: 'Връща първото число на степен второто число.',

	// Text block messages
	TEXT_JOIN_TITLE_CREATEWITH: 'създай текст с',
	TEXT_CREATE_JOIN_TITLE_JOIN: 'съедини',
	TEXT_LENGTH_TITLE: 'дължина на %1',
	TEXT_ISEMPTY_TITLE: '%1 е празен',
	TEXT_INDEXOF_OPERATOR_FIRST: 'намери първото срещане на текст',
	TEXT_INDEXOF_OPERATOR_LAST: 'намери последното срещане на текст',
	TEXT_CHARAT_FROM_START: 'вземи буква #',
	TEXT_CHARAT_FROM_END: 'вземи буква # отзад',
	TEXT_CHARAT_FIRST: 'вземи първата буква',
	TEXT_CHARAT_LAST: 'вземи последната буква',
	TEXT_CHARAT_RANDOM: 'вземи случайна буква',
	TEXT_JOIN_TOOLTIP: 'Създава текст като съединява няколко елемента.',
	TEXT_APPEND_VARIABLE: 'елемент',
	TEXT_APPEND_TOOLTIP: 'Добавя текст към променлива "%1".',
	TEXT_LENGTH_TOOLTIP: 'Връща броя на буквите (включително интервалите) в дадения текст.',
	TEXT_ISEMPTY_TOOLTIP: 'Връща вярно, ако даденият текст е празен.',

	// List block messages
	LISTS_CREATE_EMPTY_TITLE: 'създай празен списък',
	LISTS_CREATE_WITH_INPUT_WITH: 'създай списък с',
	LISTS_LENGTH_TITLE: 'дължина на %1',
	LISTS_ISEMPTY_TITLE: '%1 е празен',
	LISTS_INDEXOF_FIRST: 'намери първото срещане на',
	LISTS_INDEXOF_LAST: 'намери последното срещане на',
	LISTS_GET_INDEX_GET: 'вземи',
	LISTS_GET_INDEX_REMOVE: 'премахни',
	LISTS_GET_INDEX_FROM_START: '#',
	LISTS_GET_INDEX_FROM_END: '# отзад',
	LISTS_GET_INDEX_FIRST: 'първи',
	LISTS_GET_INDEX_LAST: 'последен',
	LISTS_GET_INDEX_RANDOM: 'случаен',
	LISTS_CREATE_WITH_TOOLTIP: 'Създава списък с произволен брой елементи.',
	LISTS_CREATE_EMPTY_TOOLTIP: 'Връща празен списък с дължина 0',
	LISTS_LENGTH_TOOLTIP: 'Връща дължината на списък.',
	LISTS_ISEMPTY_TOOLTIP: 'Връща вярно, ако списъкът е празен.',

	// Variables
	VARIABLES_SET: 'нека %1 бъде %2',
	VARIABLES_GET: '%1',
	VARIABLES_DEFAULT_NAME: 'елемент',

	// If conditions
	CONTROLS_IF_TOOLTIP_1: 'Ако стойността е вярна, изпълни някои команди.',
	CONTROLS_IF_TOOLTIP_2: 'Ако стойността е вярна, изпълни първия блок от команди. В противен случай изпълни втория блок от команди.',
	CONTROLS_IF_TOOLTIP_3:
		'Ако първата стойност е вярна, изпълни първия блок от команди. В противен случай, ако втората стойност е вярна, изпълни втория блок от команди.',
	CONTROLS_IF_TOOLTIP_4:
		'Ако първата стойност е вярна, изпълни първия блок от команди. В противен случай, ако втората стойност е вярна, изпълни втория блок от команди. Ако нито една от стойностите не е вярна, изпълни последния блок от команди.',

	// Procedures
	PROCEDURES_DEFNORETURN_TITLE: '',
	PROCEDURES_DEFNORETURN_PROCEDURE: 'направи нещо',
	PROCEDURES_BEFORE_PARAMS: 'с:',
	PROCEDURES_CALL_BEFORE_PARAMS: 'с:',
	PROCEDURES_DEFNORETURN_DO: '',
	PROCEDURES_DEFNORETURN_TOOLTIP: 'Създава функция без изход.',
	PROCEDURES_DEFRETURN_RETURN: 'върни',
	PROCEDURES_DEFRETURN_TOOLTIP: 'Създава функция с изход.',
	PROCEDURES_DEFRETURN_COMMENT: 'Опиши тази функция...',
	PROCEDURES_DEFRETURN_PROCEDURE: 'направи нещо с връщане',
	PROCEDURES_DEFRETURN_DO: '',
	PROCEDURES_CALLNORETURN_HELPURL: 'https://bg.wikipedia.org/wiki/Подпрограма',
	PROCEDURES_CALLNORETURN_TOOLTIP: 'Изпълнява дефинираната от потребителя функция.',
	PROCEDURES_CALLRETURN_HELPURL: 'https://bg.wikipedia.org/wiki/Подпрограма',
	PROCEDURES_CALLRETURN_TOOLTIP: 'Изпълнява дефинираната от потребителя функция и използва нейния изход.',

	// Seven Segment Display
	SEVEN_SEGMENT_DISPLAY: 'Седемсегментен дисплей',
	SEVEN_SEGMENT_COMMON_CATHODE: 'Общ катод',
	SEVEN_SEGMENT_COMMON_ANODE: 'Общ анод',
	SEVEN_SEGMENT_NUMBER: 'Число (0-9):',
	SEVEN_SEGMENT_DECIMAL_POINT: 'Десетична точка',
	SEVEN_SEGMENT_TOOLTIP: 'Показва число (0-9) на седемсегментен дисплей с опционална десетична точка.',
	// Seven Segment Display Pins
	SEVEN_SEGMENT_PINS_SET: 'Задай пинове за седемсегментен дисплей',
	SEVEN_SEGMENT_PINS_TOOLTIP: 'Конфигурира пиновете за всеки сегмент (A-G) и десетичната точка (DP) на седемсегментния дисплей.',
	// Pixetto Smart Camera
	PIXETTO_INIT: 'Инициализиране на интелигентна камера Pixetto',
	PIXETTO_RX_PIN: 'RX пин',
	PIXETTO_TX_PIN: 'TX пин',
	PIXETTO_IS_DETECTED: 'Pixetto засечен обект',
	PIXETTO_GET_TYPE_ID: 'Pixetto получаване на ID на тип',
	PIXETTO_GET_FUNC_ID: 'Pixetto получаване на ID на функция',
	PIXETTO_COLOR_DETECT: 'Pixetto разпознаване на цвят',
	PIXETTO_SHAPE_DETECT: 'Pixetto разпознаване на форма',
	PIXETTO_FACE_DETECT: 'Pixetto разпознаване на лице',
	PIXETTO_APRILTAG_DETECT: 'Pixetto разпознаване на AprilTag',
	PIXETTO_NEURAL_NETWORK: 'Pixetto разпознаване с невронна мрежа',
	PIXETTO_HANDWRITTEN_DIGIT: 'Pixetto разпознаване на ръкописна цифра',
	PIXETTO_GET_POSITION: 'Pixetto получаване на засечен обект',
	PIXETTO_ROAD_DETECT: 'Pixetto разпознаване на път',
	PIXETTO_SET_MODE: 'Задаване на функционален режим Pixetto',
	PIXETTO_COLOR: 'Цвят',
	PIXETTO_SHAPE: 'Форма',
	PIXETTO_MODE: 'Режим',
	PIXETTO_TAG_ID: 'ID на етикет',
	PIXETTO_CLASS_ID: 'ID на клас',
	PIXETTO_DIGIT: 'Цифра',
	PIXETTO_COORDINATE: 'Координата',
	PIXETTO_ROAD_INFO: 'Информация', // Vision Sensors Category Labels
	PIXETTO_LABEL: 'Pixetto',
	HUSKYLENS_LABEL: 'HUSKYLENS',
	// HUSKYLENS Интелигентна Камера
	HUSKYLENS_INIT_I2C: 'Инициализирай HUSKYLENS (I2C)',
	HUSKYLENS_INIT_UART: 'Инициализирай HUSKYLENS (UART)',
	HUSKYLENS_RX_PIN: 'Свържи с HuskyLens TX →',
	HUSKYLENS_TX_PIN: 'Свържи с HuskyLens RX →',
	HUSKYLENS_SET_ALGORITHM: 'Настрой алгоритъм на HUSKYLENS на',
	HUSKYLENS_ALGORITHM_FACE_RECOGNITION: 'Разпознаване на лица',
	HUSKYLENS_ALGORITHM_OBJECT_TRACKING: 'Проследяване на обекти',
	HUSKYLENS_ALGORITHM_OBJECT_RECOGNITION: 'Разпознаване на обекти',
	HUSKYLENS_ALGORITHM_LINE_TRACKING: 'Проследяване на линии',
	HUSKYLENS_ALGORITHM_COLOR_RECOGNITION: 'Разпознаване на цветове',
	HUSKYLENS_ALGORITHM_TAG_RECOGNITION: 'Разпознаване на тагове',
	HUSKYLENS_ALGORITHM_OBJECT_CLASSIFICATION: 'Класификация на обекти',
	HUSKYLENS_REQUEST: 'Заяви резултат от разпознаване от HUSKYLENS',
	HUSKYLENS_IS_LEARNED: 'HUSKYLENS е научил обекти',
	HUSKYLENS_COUNT_BLOCKS: 'Брой засечени блокове от HUSKYLENS',
	HUSKYLENS_COUNT_ARROWS: 'Брой засечени стрелки от HUSKYLENS',
	HUSKYLENS_GET_BLOCK_INFO: 'Вземи блок',
	HUSKYLENS_GET_ARROW_INFO: 'Вземи стрелка',
	HUSKYLENS_BLOCK_INFO_TYPE: ' ',
	HUSKYLENS_ARROW_INFO_TYPE: ' ',
	HUSKYLENS_X_CENTER: 'X център',
	HUSKYLENS_Y_CENTER: 'Y център',
	HUSKYLENS_WIDTH: 'Ширина',
	HUSKYLENS_HEIGHT: 'Височина',
	HUSKYLENS_ID: 'ID',
	HUSKYLENS_X_ORIGIN: 'X начало',
	HUSKYLENS_Y_ORIGIN: 'Y начало',
	HUSKYLENS_X_TARGET: 'X цел',
	HUSKYLENS_Y_TARGET: 'Y цел',
	HUSKYLENS_LEARN: 'Нека HUSKYLENS научи ID',
	HUSKYLENS_FORGET: 'Нека HUSKYLENS забрави всичко научено',

	// HuskyLens ID-Based Блокове
	HUSKYLENS_BY_ID_LABEL: 'Заявка по ID',
	HUSKYLENS_REQUEST_BLOCKS_ID: 'изискване на HUSKYLENS блокове с ID',
	HUSKYLENS_REQUEST_BLOCKS_ID_SUFFIX: '',
	HUSKYLENS_REQUEST_BLOCKS_ID_TOOLTIP: 'Изисквайте само блокове с определен ID за по-добра ефективност',
	HUSKYLENS_COUNT_BLOCKS_ID: 'брой на HUSKYLENS блокове с ID',
	HUSKYLENS_COUNT_BLOCKS_ID_SUFFIX: '',
	HUSKYLENS_COUNT_BLOCKS_ID_TOOLTIP: 'Получаване на броя блокове с определен ID',
	HUSKYLENS_GET_BLOCK_ID: 'получи блок с ID',
	HUSKYLENS_GET_BLOCK_ID_INDEX: 'индекс',
	HUSKYLENS_GET_BLOCK_ID_INDEX_SUFFIX: '',
	HUSKYLENS_GET_BLOCK_ID_TOOLTIP: 'Получаване на позиция, размер или ID на блок с определен ID',

	// Pixetto Tooltips
	PIXETTO_INIT_TOOLTIP: 'Инициализиране на интелигентната камера Pixetto и настройване на UART комуникационни пинове',
	PIXETTO_IS_DETECTED_TOOLTIP: 'Откриване дали Pixetto засича някакъв обект',
	PIXETTO_GET_TYPE_ID_TOOLTIP: 'Получаване на ID на типа на засечения обект от Pixetto (цвят, форма и др.)',
	PIXETTO_GET_FUNC_ID_TOOLTIP: 'Получаване на ID на текущата функция, използвана от Pixetto (разпознаване на цвят, форма и др.)',
	PIXETTO_COLOR_DETECT_TOOLTIP: 'Разпознай дали Pixetto засича обект от определен цвят',
	PIXETTO_SHAPE_DETECT_TOOLTIP: 'Разпознай дали Pixetto засича обект от определена форма',
	PIXETTO_FACE_DETECT_TOOLTIP: 'Разпознай дали Pixetto засича лице',
	PIXETTO_APRILTAG_DETECT_TOOLTIP: 'Разпознай дали Pixetto засича AprilTag с определен ID',
	PIXETTO_NEURAL_NETWORK_TOOLTIP: 'Разпознай дали невронната мрежа на Pixetto разпознава обект от определен клас',
	PIXETTO_HANDWRITTEN_DIGIT_TOOLTIP: 'Разпознай дали Pixetto разпознава определена ръкописна цифра',
	PIXETTO_GET_POSITION_TOOLTIP: 'Получи информация за позицията или размера на засечен обект от Pixetto',
	PIXETTO_ROAD_DETECT_TOOLTIP: 'Получи информация свързана с разпознаването на пътища от Pixetto',
	PIXETTO_SET_MODE_TOOLTIP: 'Настрой функционален режим на интелигентната камера Pixetto',

	// Pixetto Color Options
	PIXETTO_COLOR_RED: 'Червено',
	PIXETTO_COLOR_BLUE: 'Синьо',
	PIXETTO_COLOR_GREEN: 'Зелено',
	PIXETTO_COLOR_YELLOW: 'Жълто',
	PIXETTO_COLOR_ORANGE: 'Оранжево',
	PIXETTO_COLOR_PURPLE: 'Лилаво',
	PIXETTO_COLOR_BLACK: 'Черно',
	PIXETTO_COLOR_WHITE: 'Бяло',

	// Pixetto Shape Options
	PIXETTO_SHAPE_TRIANGLE: 'Триъгълник',
	PIXETTO_SHAPE_RECTANGLE: 'Правоъгълник',
	PIXETTO_SHAPE_PENTAGON: 'Петоъгълник',
	PIXETTO_SHAPE_HEXAGON: 'Шестоъгълник',
	PIXETTO_SHAPE_CIRCLE: 'Кръг',

	// Pixetto Position Options
	PIXETTO_POSITION_X: 'X координата',
	PIXETTO_POSITION_Y: 'Y координата',
	PIXETTO_POSITION_WIDTH: 'Ширина',
	PIXETTO_POSITION_HEIGHT: 'Височина',

	// Pixetto Road Info Options
	PIXETTO_ROAD_CENTER_X: 'Център X',
	PIXETTO_ROAD_CENTER_Y: 'Център Y',
	PIXETTO_ROAD_LEFT_X: 'Лява граница X',
	PIXETTO_ROAD_RIGHT_X: 'Дясна граница X',

	// Pixetto Mode Options
	PIXETTO_MODE_COLOR_DETECTION: 'Разпознаване на цвят',
	PIXETTO_MODE_SHAPE_DETECTION: 'Разпознаване на форма',
	PIXETTO_MODE_FACE_DETECTION: 'Разпознаване на лице',
	PIXETTO_MODE_APRILTAG_DETECTION: 'Разпознаване на AprilTag',
	PIXETTO_MODE_NEURAL_NETWORK: 'Невронна мрежа',
	PIXETTO_MODE_HANDWRITTEN_DIGIT: 'Ръкописна цифра',
	PIXETTO_MODE_ROAD_DETECTION: 'Разпознаване на път',
	PIXETTO_MODE_BALL_DETECTION: 'Разпознаване на топка',
	PIXETTO_MODE_TEMPLATE_MATCHING: 'Съпоставяне на шаблон',

	// HUSKYLENS Tooltips
	HUSKYLENS_INIT_I2C_TOOLTIP: 'Инициализиране на интелигентна камера HUSKYLENS с използване на I2C',
	HUSKYLENS_INIT_UART_TOOLTIP: 'Инициализиране на интелигентна камера HUSKYLENS с използване на UART, настройване на RX/TX пинове',
	HUSKYLENS_SET_ALGORITHM_TOOLTIP: 'Настройване на алгоритъма за разпознаване, използван от HUSKYLENS',
	HUSKYLENS_REQUEST_TOOLTIP: 'Заявяване на най-новите резултати от разпознаването от HUSKYLENS',
	HUSKYLENS_IS_LEARNED_TOOLTIP: 'Проверка дали HUSKYLENS е научил някакви обекти',
	HUSKYLENS_COUNT_BLOCKS_TOOLTIP: 'Получаване на броя блокове, засечени от HUSKYLENS',
	HUSKYLENS_COUNT_ARROWS_TOOLTIP: 'Получаване на броя стрелки, засечени от HUSKYLENS',
	HUSKYLENS_GET_BLOCK_INFO_TOOLTIP: 'Получаване на информация за определен блок (позиция, размер или ID)',
	HUSKYLENS_GET_ARROW_INFO_TOOLTIP: 'Получаване на информация за определена стрелка (начало, цел или ID)',
	HUSKYLENS_LEARN_TOOLTIP: 'Нека HUSKYLENS научи обект с определен ID (само за режим Класификация на обекти)',
	HUSKYLENS_FORGET_TOOLTIP: 'Изчистване на всички научени обекти от HUSKYLENS (само за режим Класификация на обекти)',
	HUSKYLENS_I2C_PIN_HINT: 'Окабеляване: ',
	HUSKYLENS_UART_PIN_HINT: 'Препоръчителни пинове: ',
	HUSKYLENS_UART_ANY_DIGITAL: 'Всеки цифров пин',

	// ESP32 PWM Setup
	ESP32_PWM_SETUP: 'Настройка на ESP32 PWM',
	ESP32_PWM_FREQUENCY: 'Честота',
	ESP32_PWM_RESOLUTION: 'Резолюция',
	ESP32_PWM_FREQUENCY_TOOLTIP: 'Задайте честота на PWM, диапазон 1-80000 Hz. Висока честота за моторни драйвери (20-75KHz)',
	ESP32_PWM_RESOLUTION_TOOLTIP: 'Задайте резолюция на PWM, влияе на точността на изхода. Забележка: честота × 2^резолюция ≤ 80 000 000',
	ESP32_PWM_RESOLUTION_8BIT: '8 бита (0-255)',
	ESP32_PWM_RESOLUTION_10BIT: '10 бита (0-1023)',
	ESP32_PWM_RESOLUTION_12BIT: '12 бита (0-4095)',
	ESP32_PWM_RESOLUTION_13BIT: '13 бита (0-8191)',
	ESP32_PWM_RESOLUTION_14BIT: '14 бита (0-16383)',
	ESP32_PWM_RESOLUTION_15BIT: '15 бита (0-32767)',
	ESP32_PWM_RESOLUTION_16BIT: '16 бита (0-65535)',

	// Safety Guard (Project Safety Protection)
	SAFETY_WARNING_BODY_NO_TYPE:
		'Този проект все още няма Blockly блокове. Ако продължите, тук ще бъдат създадени blockly папка и файлове. Искате ли да продължите?',
	SAFETY_WARNING_BODY_WITH_TYPE:
		'Открит е проект {0}. Този проект все още няма Blockly блокове. Ако продължите, тук ще бъдат създадени blockly папка и файлове. Искате ли да продължите?',
	BUTTON_CONTINUE: 'Продължи',
	BUTTON_CANCEL: 'Отказ',
	BUTTON_SUPPRESS: 'Не напомняй',
	SAFETY_GUARD_CANCELLED: 'Отворянето на редактора Blockly е отменено',
	SAFETY_GUARD_SUPPRESSED: 'Предпочитанието е запазено, това предупреждение няма да се показва отново',

	// Communication Category
	CATEGORY_COMMUNICATION: 'Комуникация',

	// ESP32 WiFi
	ESP32_WIFI_LABEL: 'WiFi',
	ESP32_WIFI_CONNECT: 'Свържи WiFi',
	ESP32_WIFI_CONNECT_SSID: 'SSID',
	ESP32_WIFI_CONNECT_PASSWORD: 'Парола',
	ESP32_WIFI_CONNECT_TOOLTIP: 'Свържете ESP32 към WiFi мрежа с посочения SSID и парола',
	ESP32_WIFI_DISCONNECT: 'Прекъсни WiFi',
	ESP32_WIFI_DISCONNECT_TOOLTIP: 'Прекъснете WiFi връзката на ESP32',
	ESP32_WIFI_STATUS: 'Статус на WiFi',
	ESP32_WIFI_STATUS_TOOLTIP: 'Проверете дали ESP32 е свързан към WiFi мрежа',
	ESP32_WIFI_GET_IP: 'Вземи WiFi IP адрес',
	ESP32_WIFI_GET_IP_TOOLTIP: 'Вземете локалния IP адрес на ESP32 като текст',
	ESP32_WIFI_SCAN: 'Сканирай WiFi мрежи',
	ESP32_WIFI_SCAN_TOOLTIP: 'Сканирайте за налични WiFi мрежи и върнете броя намерени',
	ESP32_WIFI_GET_SSID: 'Вземи SSID на мрежа',
	ESP32_WIFI_GET_SSID_INDEX: 'индекс',
	ESP32_WIFI_GET_SSID_TOOLTIP: 'Вземете SSID името на WiFi мрежата по даден индекс',
	ESP32_WIFI_GET_RSSI: 'Вземи RSSI на мрежа',
	ESP32_WIFI_GET_RSSI_INDEX: 'индекс',
	ESP32_WIFI_GET_RSSI_TOOLTIP: 'Вземете силата на сигнала (RSSI) на WiFi мрежата по даден индекс',

	// ESP32 MQTT
	ESP32_MQTT_LABEL: 'MQTT',
	ESP32_MQTT_SETUP: 'Настройка на MQTT',
	ESP32_MQTT_SETUP_SERVER: 'Сървър',
	ESP32_MQTT_SETUP_PORT: 'Порт',
	ESP32_MQTT_SETUP_CLIENT_ID: 'ID на клиент',
	ESP32_MQTT_SETUP_TOOLTIP: 'Конфигурирайте MQTT клиент с адрес на сървър, порт и идентификатор на клиент',
	ESP32_MQTT_CONNECT: 'Свържи MQTT',
	ESP32_MQTT_CONNECT_USERNAME: 'Потребител',
	ESP32_MQTT_CONNECT_PASSWORD: 'Парола',
	ESP32_MQTT_CONNECT_TOOLTIP: 'Свържете се с MQTT брокер с незадължително потребителско име и парола',
	ESP32_MQTT_PUBLISH: 'Публикувай MQTT',
	ESP32_MQTT_PUBLISH_TOPIC: 'Тема',
	ESP32_MQTT_PUBLISH_MESSAGE: 'Съобщение',
	ESP32_MQTT_PUBLISH_TOOLTIP: 'Публикувайте съобщение в MQTT тема',
	ESP32_MQTT_SUBSCRIBE: 'Абонирай MQTT',
	ESP32_MQTT_SUBSCRIBE_TOPIC: 'Тема',
	ESP32_MQTT_SUBSCRIBE_TOOLTIP: 'Абонирайте се за MQTT тема за получаване на съобщения',
	ESP32_MQTT_LOOP: 'MQTT цикъл',
	ESP32_MQTT_LOOP_TOOLTIP: 'Обработете входящите MQTT съобщения (извикайте в главния цикъл)',
	ESP32_MQTT_GET_TOPIC: 'Вземи MQTT тема',
	ESP32_MQTT_GET_TOPIC_TOOLTIP: 'Вземете темата на последно полученото MQTT съобщение',
	ESP32_MQTT_GET_MESSAGE: 'Вземи MQTT съобщение',
	ESP32_MQTT_GET_MESSAGE_TOOLTIP: 'Вземете съдържанието на последно полученото MQTT съобщение',
	ESP32_MQTT_STATUS: 'MQTT Свързан',
	ESP32_MQTT_STATUS_TOOLTIP: 'Проверете дали е свързан с MQTT сървъра',

	// Text to Number
	TEXT_TO_NUMBER: 'Текст към число',
	TEXT_TO_NUMBER_INT: 'цяло',
	TEXT_TO_NUMBER_FLOAT: 'дробно',
	TEXT_TO_NUMBER_TOOLTIP: 'Преобразувайте текст в число (цяло или дробно)',

	// To String Block
	TO_STRING: 'Към текст',
	TO_STRING_TOOLTIP: 'Преобразувайте число или булева стойност в текст',

	// ESP32 Only Block Warning
	ESP32_ONLY_BLOCK_WARNING: 'Този блок поддържа само платки ESP32',

	// Quick Backup Toast Messages
	BACKUP_QUICK_SAVE_SUCCESS: 'Резервното копие е запазено: {0}',
	BACKUP_QUICK_SAVE_EMPTY: 'Работното пространство е празно, не е необходимо архивиране',
	BACKUP_QUICK_SAVE_COOLDOWN: 'Моля, изчакайте, архивирането току-що приключи',
	MAIN_BLOCK_DUPLICATE_WARNING: 'Открити са няколко блока на основната програма. Изтрийте излишните блокове.',

	// Board Switch Warning
	BOARD_SWITCH_WARNING_TITLE: 'Превключване на тип платка',
	BOARD_SWITCH_WARNING_MESSAGE:
		'Превключването към друг тип платка ще изчисти текущото работно пространство.\nВашата работа ще бъде автоматично архивирана първо.\n\nИскате ли да продължите?',

	// CyberBrick Board
	BOARD_CYBERBRICK: 'CyberBrick',

	// CyberBrick Category
	CATEGORY_CYBERBRICK_CORE: 'CyberBrick',
	CATEGORY_CYBERBRICK_LED: 'LED',
	CATEGORY_CYBERBRICK_GPIO: 'GPIO',
	CATEGORY_CYBERBRICK_TIME: 'Време',

	// CyberBrick Main Block
	CYBERBRICK_MAIN: 'Главна програма',
	CYBERBRICK_MAIN_TOOLTIP: 'Входна точка на главната програма на CyberBrick. Всички кодове трябва да бъдат поставени вътре в този блок.',

	// CyberBrick LED Blocks
	CYBERBRICK_LED_SET_COLOR: 'Задаване на цвят на LED',
	CYBERBRICK_LED_SET_COLOR_PREFIX: 'Задаване на цвят на вграден LED',
	CYBERBRICK_LED_RED: 'Червено',
	CYBERBRICK_LED_GREEN: 'Зелено',
	CYBERBRICK_LED_BLUE: 'Синьо',
	CYBERBRICK_LED_SET_COLOR_TOOLTIP: 'Задаване на цвят на вградения LED (GPIO8) с RGB стойности (0-255)',
	CYBERBRICK_LED_OFF: 'Изключване на LED',
	CYBERBRICK_LED_OFF_TOOLTIP: 'Изключване на вградения LED',

	// CyberBrick GPIO Blocks
	CYBERBRICK_GPIO_SET: 'Задаване на GPIO',
	CYBERBRICK_GPIO_SET_PREFIX: 'GPIO',
	CYBERBRICK_GPIO_SET_TO: 'на',
	CYBERBRICK_GPIO_PIN: 'Пин',
	CYBERBRICK_GPIO_VALUE: 'Стойност',
	CYBERBRICK_GPIO_HIGH: 'ВИСОКО',
	CYBERBRICK_GPIO_LOW: 'НИСКО',
	CYBERBRICK_GPIO_SET_TOOLTIP: 'Задаване на GPIO пин на ВИСОКО или НИСКО',
	CYBERBRICK_GPIO_READ: 'Четене на GPIO',
	CYBERBRICK_GPIO_READ_TOOLTIP: 'Четене на цифрова стойност от GPIO пин (връща 0 или 1)',

	// CyberBrick Time Blocks
	CYBERBRICK_DELAY_MS: 'Забавяне (мс)',
	CYBERBRICK_DELAY_MS_PREFIX: 'Забавяне',
	CYBERBRICK_DELAY_MS_SUFFIX: 'мс',
	CYBERBRICK_DELAY_MS_TOOLTIP: 'Пауза на изпълнението на програмата за зададения брой милисекунди',
	CYBERBRICK_DELAY_S: 'Забавяне (сек)',
	CYBERBRICK_DELAY_S_PREFIX: 'Забавяне',
	CYBERBRICK_DELAY_S_SUFFIX: 'секунди',
	CYBERBRICK_DELAY_S_TOOLTIP: 'Пауза на изпълнението на програмата за зададения брой секунди',
	CYBERBRICK_TICKS_MS: 'Вземи текущите милисекунди',
	CYBERBRICK_TICKS_MS_TOOLTIP: 'Вземи текущия брояч на милисекундите',
	CYBERBRICK_TICKS_DIFF_PREFIX: 'Разлика във времето',
	CYBERBRICK_TICKS_DIFF_NOW: 'сега',
	CYBERBRICK_TICKS_DIFF_START: 'начало',
	CYBERBRICK_TICKS_DIFF_TOOLTIP: 'Изчисли милисекундите между сега и началото',

	// CyberBrick WiFi Blocks
	CATEGORY_CYBERBRICK_WIFI: 'WiFi',
	CYBERBRICK_WIFI_CONNECT: 'Свързване с WiFi',
	CYBERBRICK_WIFI_SSID: 'SSID',
	CYBERBRICK_WIFI_PASSWORD: 'Парола',
	CYBERBRICK_WIFI_CONNECT_TOOLTIP: 'Свързване към зададената WiFi мрежа',
	CYBERBRICK_WIFI_DISCONNECT: 'Изключване от WiFi',
	CYBERBRICK_WIFI_DISCONNECT_TOOLTIP: 'Изключване от текущата WiFi мрежа',
	CYBERBRICK_WIFI_IS_CONNECTED: 'WiFi свързан?',
	CYBERBRICK_WIFI_IS_CONNECTED_TOOLTIP: 'Проверка дали WiFi е свързан',
	CYBERBRICK_WIFI_GET_IP: 'Вземи IP адрес',
	CYBERBRICK_WIFI_GET_IP_TOOLTIP: 'Вземи текущия IP адрес',

	// CyberBrick Upload
	UPLOAD_BUTTON_TITLE: 'Качване в CyberBrick',
	UPLOAD_BUTTON_DISABLED_TITLE: 'Първо запазете работното пространство, за да активирате качването',
	UPLOAD_STARTING: 'Стартиране на качването...',
	UPLOAD_SUCCESS: 'Качването е успешно!',
	UPLOAD_FAILED: 'Качването е неуспешно: {0}',
	UPLOAD_NO_PORT: 'CyberBrick устройството не е намерено',
	UPLOAD_IN_PROGRESS: 'Качване...',
	UPLOAD_EMPTY_WORKSPACE: 'Работното пространство е празно, първо добавете блокове',
	UPLOAD_NO_CODE: 'Не може да се генерира код',

	// Upload progress stages
	UPLOAD_STAGE_PREPARING: 'Подготовка',
	UPLOAD_STAGE_CHECKING: 'Проверка на инструменти',
	UPLOAD_STAGE_INSTALLING: 'Инсталиране на инструменти',
	UPLOAD_STAGE_CONNECTING: 'Свързване на устройство',
	UPLOAD_STAGE_RESETTING: 'Рестартиране на устройство',
	UPLOAD_STAGE_BACKUP: 'Архивиране',
	UPLOAD_STAGE_UPLOADING: 'Качване',
	UPLOAD_STAGE_RESTARTING: 'Рестартиране на устройство',
	UPLOAD_STAGE_COMPLETED: 'Завършено',

	// Upload error messages
	ERROR_UPLOAD_BOARD_UNSUPPORTED: 'Поддържа се само платка CyberBrick',
	ERROR_UPLOAD_CODE_EMPTY: 'Кодът не може да бъде празен',
	ERROR_UPLOAD_NO_PYTHON: 'Python средата на PlatformIO не е намерена. Моля, първо инсталирайте PlatformIO.',
	ERROR_UPLOAD_MPREMOTE_FAILED: 'Инсталацията на mpremote е неуспешна',
	ERROR_UPLOAD_DEVICE_NOT_FOUND: 'CyberBrick устройството не е намерено. Моля, уверете се, че е свързано.',
	ERROR_UPLOAD_RESET_FAILED: 'Неуспешно нулиране на устройството',
	ERROR_UPLOAD_UPLOAD_FAILED: 'Неуспешно качване на програмата',
	ERROR_UPLOAD_RESTART_FAILED: 'Неуспешно рестартиране на устройството',

	// Arduino Upload Button
	UPLOAD_BUTTON_TITLE_ARDUINO: 'Компилирай и Качи',
	UPLOAD_SELECT_BOARD: 'Моля, първо изберете платка',

	// Arduino Upload Stages
	ARDUINO_STAGE_SYNCING: 'Синхронизиране на настройките',
	ARDUINO_STAGE_SAVING: 'Запазване на работното пространство',
	ARDUINO_STAGE_CHECKING: 'Проверка на компилатора',
	ARDUINO_STAGE_DETECTING: 'Откриване на платката',
	ARDUINO_STAGE_COMPILING: 'Компилиране',
	ARDUINO_STAGE_UPLOADING: 'Качване',

	// Arduino Upload Results
	ARDUINO_COMPILE_SUCCESS: 'Компилацията е успешна!',
	ARDUINO_UPLOAD_SUCCESS: 'Качването е успешно!',

	// Arduino Upload Errors
	ERROR_ARDUINO_PIO_NOT_FOUND: 'PlatformIO CLI не е намерен. Моля, първо инсталирайте PlatformIO.',
	ERROR_ARDUINO_COMPILE_FAILED: 'Компилацията е неуспешна',
	ERROR_ARDUINO_UPLOAD_FAILED: 'Качването е неуспешно',
	ERROR_ARDUINO_NO_WORKSPACE: 'Моля, първо отворете папка на проекта',
	ERROR_ARDUINO_TIMEOUT: 'Времето за операцията изтече',
	ERROR_ARDUINO_DEVICE_DISCONNECT: 'Устройството е изключено',

	// Backup messages
	BACKUP_CONFIRM_DELETE: 'Сигурни ли сте, че искате да изтриете резервното копие "{0}"?',
	BACKUP_CONFIRM_RESTORE:
		'Сигурни ли сте, че искате да възстановите резервното копие "{0}"? Това ще презапише текущото работно пространство.',
	BACKUP_ERROR_NOT_FOUND: 'Резервното копие "{0}" не е намерено',
	BACKUP_ERROR_CREATE_FAILED: 'Неуспешно създаване на резервно копие: {0}',
	BACKUP_ERROR_DELETE_FAILED: 'Неуспешно изтриване на резервно копие: {0}',
	BACKUP_ERROR_RESTORE_FAILED: 'Неуспешно възстановяване на резервно копие: {0}',
	BACKUP_ERROR_PREVIEW_FAILED: 'Неуспешен преглед на резервно копие: {0}',
	BACKUP_ERROR_NAME_NOT_SPECIFIED: 'Името на резервното копие не е указано',
	BACKUP_ERROR_MAIN_NOT_FOUND: 'Файлът main.json не може да бъде намерен',
	BACKUP_ERROR_UPDATE_SETTINGS_FAILED: 'Неуспешно актуализиране на настройките за автоматично архивиране',

	// Button labels
	BUTTON_DELETE: 'Изтрий',
	BUTTON_RESTORE: 'Възстанови',

	// Error messages
	ERROR_PROCESSING_MESSAGE: 'Грешка при обработка на съобщението: {0}',
	ERROR_SETTINGS_UPDATE_FAILED: 'Неуспешно актуализиране на настройките',
	ERROR_RELOAD_WORKSPACE_FAILED: 'Неуспешно презареждане на работното пространство: {0}',
	ERROR_OPEN_PROJECT_FOLDER_FIRST: 'Моля, първо отворете папка на проекта',

	// Info messages
	INFO_NO_BACKUPS_TO_PREVIEW: 'Няма файлове за резервно копие за преглед',

	// Dialog messages
	DIALOG_SELECT_BACKUP_TITLE: 'Изберете файл за резервно копие за преглед',
	DIALOG_BACKUP_FILES_LABEL: 'Файлове за резервно копие',

	// X11 Разширителна платка
	CATEGORY_X11: 'X11 Разширение',
	X11_LABEL_SERVOS: 'Сервомотори',
	X11_LABEL_MOTORS: 'Мотори',
	X11_LABEL_LEDS: 'Светодиоди',

	// X11 180° Серво блокове
	X11_SERVO_180_ANGLE_PREFIX: 'Задай серво',
	X11_SERVO_180_ANGLE_SUFFIX: 'ъгъл',
	X11_SERVO_180_ANGLE_TOOLTIP: 'Задай ъгъл на 180° серво (0-180 градуса)',

	// X11 360° Серво блокове
	X11_SERVO_360_SPEED_PREFIX: 'Задай серво',
	X11_SERVO_360_SPEED_SUFFIX: 'скорост',
	X11_SERVO_360_SPEED_TOOLTIP: 'Задай скорост на 360° непрекъснато въртящ се серво (-100 до 100, отрицателно=обратно)',

	// X11 Блок за спиране на серво
	X11_SERVO_STOP: 'Спри серво',
	X11_SERVO_STOP_TOOLTIP: 'Спри посоченото серво',

	// X11 Мотор блокове
	X11_MOTOR_SPEED_PREFIX: 'Задай мотор',
	X11_MOTOR_SPEED_SUFFIX: 'скорост',
	X11_MOTOR_SPEED_TOOLTIP: 'Задай скорост на DC мотор (-2048 до 2048, отрицателно=обратно)',
	X11_MOTOR_STOP: 'Спри мотор',
	X11_MOTOR_STOP_TOOLTIP: 'Спри посочения мотор',

	// X11 LED блокове
	X11_LED_SET_COLOR_PREFIX: 'LED лента',
	X11_LED_SET_COLOR_INDEX: 'индекс',
	X11_LED_SET_COLOR_INDEX_SUFFIX: 'задай цвят R',
	X11_LED_SET_COLOR_TOOLTIP: 'Задай цвят на пиксел на LED лента (индекс 0=първи пиксел, или всички)',
	X11_LED_INDEX_ALL: 'Всички',

	// === X12 Разширителна плочка Предавател ===
	CATEGORY_X12: 'X12 Разширение',
	X12_LABEL_JOYSTICK: 'Джойстик',
	X12_LABEL_BUTTON: 'Бутон',

	// X12 Джойстик блокове
	X12_GET_JOYSTICK_PREFIX: 'Джойстик',
	X12_GET_JOYSTICK_SUFFIX: 'стойност',
	X12_GET_JOYSTICK_TOOLTIP: 'Чети ADC стойност на джойстика (0-4095)',
	X12_GET_JOYSTICK_MAPPED_PREFIX: 'Джойстик',
	X12_GET_JOYSTICK_MAPPED_MIN: 'картирай към',
	X12_GET_JOYSTICK_MAPPED_MAX: '~',
	X12_GET_JOYSTICK_MAPPED_TOOLTIP: 'Чети джойстик и картирай към указан диапазон',

	// X12 Бутон блокове
	X12_IS_BUTTON_PRESSED_PREFIX: 'Бутон',
	X12_IS_BUTTON_PRESSED_SUFFIX: 'натиснат?',
	X12_IS_BUTTON_PRESSED_TOOLTIP: 'Провери дали бутонът е натиснат',

	// === RC Дистанционно ===

	// RC Инициализация блокове

	// RC Джойстик блокове

	// RC Бутон блокове

	// RC Статус блокове

	// === RC Връзка ===
	CATEGORY_RC: 'RC Връзка',
	RC_LABEL_MASTER: '📡 Предавател',
	RC_LABEL_SLAVE: '📻 Приемник',
	RC_LABEL_DATA: '📊 Данни',
	RC_LABEL_STATUS: '🔗 Статус',

	// Блокове предавател RC
	RC_MASTER_INIT: 'Инициализирай предавател RC',
	RC_MASTER_INIT_PAIR_ID: 'ID на сдвояване',
	RC_MASTER_INIT_CHANNEL: 'канал',
	RC_MASTER_INIT_TOOLTIP: 'Инициализирай предавател RC с ID на сдвояване (1-255) и канал (1-11)',
	RC_SEND: 'Изпрати RC данни',
	RC_SEND_TOOLTIP: 'Чети данни от джойстици/бутони X12 и изпрати на приемника',

	// Блокове приемник RC
	RC_SLAVE_INIT: 'Инициализирай приемник RC',
	RC_SLAVE_INIT_PAIR_ID: 'ID на сдвояване',
	RC_SLAVE_INIT_CHANNEL: 'канал',
	RC_SLAVE_INIT_TOOLTIP: 'Инициализирай приемник RC с ID на сдвояване (1-255) и канал (1-11)',
	RC_WAIT_CONNECTION: 'Изчакай сдвояване',
	RC_WAIT_TIMEOUT: 'таймаут',
	RC_WAIT_SECONDS: 'сек',
	RC_WAIT_TOOLTIP: 'Изчакай свързване на предавател, LED мига синьо, продължава след таймаут',

	// Блокове четене на данни RC
	RC_GET_JOYSTICK_PREFIX: 'RC джойстик',
	RC_GET_JOYSTICK_TOOLTIP: 'Чети стойност на джойстик (0-4095), 2048 е център',
	RC_GET_JOYSTICK_MAPPED_PREFIX: 'RC джойстик',
	RC_GET_JOYSTICK_MAPPED_MIN: 'картирай към',
	RC_GET_JOYSTICK_MAPPED_MAX: '~',
	RC_GET_JOYSTICK_MAPPED_TOOLTIP: 'Чети джойстик и картирай към указан диапазон',
	RC_GET_BUTTON_PREFIX: 'RC бутон',
	RC_GET_BUTTON_SUFFIX: 'състояние',
	RC_GET_BUTTON_TOOLTIP: 'Чети състояние на бутон (0=натиснат, 1=отпуснат)',
	RC_IS_BUTTON_PRESSED_PREFIX: 'RC бутон',
	RC_IS_BUTTON_PRESSED_SUFFIX: 'натиснат?',
	RC_IS_BUTTON_PRESSED_TOOLTIP: 'Провери дали бутонът е натиснат',

	// Блокове статус RC
	RC_IS_CONNECTED: 'RC свързан?',
	RC_IS_CONNECTED_TOOLTIP: 'Провери дали са получени данни за 500мс',
});
