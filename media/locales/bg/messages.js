/**
 * @license
 * Copyright 2024 Singular Blockly Contributors
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
	// Servo Block Labels
	SERVO_SETUP: 'Настройване на серво мотор',
	SERVO_PIN: 'Пин',
	SERVO_SETUP_TOOLTIP: 'Обявяване на променлива за серво мотор и задаване на пин',
	SERVO_MOVE: 'Завъртане на серво мотор',
	SERVO_ANGLE: 'Ъгъл',
	SERVO_MOVE_TOOLTIP: 'Завъртане на серво мотор до определен ъгъл',
	SERVO_STOP: 'Спиране на серво мотор',
	SERVO_STOP_TOOLTIP: 'Спиране на изходния сигнал на серво мотора',

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
});
