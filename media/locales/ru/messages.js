/**
 * @license
 * Copyright 2024 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file contains translations derived from Blockly project
 * Copyright 2012 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

// Define translations for Russian
window.languageManager.loadMessages('ru', {
	// UI Elements
	BLOCKS_TAB: 'Блоки',
	CODE_TAB: 'Код',
	BOARD_SELECT_LABEL: 'Выберите плату:',

	// Experimental Blocks Notice
	EXPERIMENTAL_BLOCKS_TITLE: 'Обнаружены экспериментальные блоки',
	EXPERIMENTAL_BLOCKS_DESC:
		'Ваша рабочая область содержит экспериментальные блоки (выделенные желтыми пунктирными границами). Эти функции могут измениться или быть удалены в будущих обновлениях, используйте их с осторожностью.',

	// Preview Mode UI
	PREVIEW_BADGE: 'Предпросмотр',
	THEME_TOGGLE: 'Сменить тему',
	PREVIEW_WINDOW_TITLE: 'Blockly Предпросмотр - {0}',
	PREVIEW_WINDOW_TITLE_WITH_NAME: 'Предпросмотр - {0}',

	// Backup Modal UI
	BACKUP_MANAGER_TITLE: 'Управление резервными копиями',
	BACKUP_CREATE_NEW: 'Создать новую копию',
	BACKUP_NAME_LABEL: 'Имя копии:',
	BACKUP_NAME_PLACEHOLDER: 'Введите имя копии',
	BACKUP_CONFIRM: 'Подтвердить',
	BACKUP_CANCEL: 'Отмена',
	BACKUP_LIST_TITLE: 'Список копий',
	BACKUP_LIST_EMPTY: 'Копии отсутствуют',
	BACKUP_BUTTON_TITLE: 'Управление копиями',
	REFRESH_BUTTON_TITLE: 'Обновить код',
	BACKUP_PREVIEW_BTN: 'Просмотр',
	BACKUP_RESTORE_BTN: 'Восстановить',
	BACKUP_DELETE_BTN: 'Удалить',
	AUTO_BACKUP_TITLE: 'Настройки автоматического резервирования',
	AUTO_BACKUP_INTERVAL_LABEL: 'Интервал резервирования:',
	AUTO_BACKUP_MINUTES: 'минут',
	AUTO_BACKUP_SAVE: 'Сохранить настройки',
	AUTO_BACKUP_SAVED: 'Настройки автоматического резервирования сохранены',
	AUTO_BACKUP_PREFIX: 'auto_',
	MANUAL_BACKUP_TITLE: 'Ручное резервирование',

	// Board Names
	BOARD_NONE: 'Нет',
	BOARD_UNO: 'Arduino Uno',
	BOARD_NANO: 'Arduino Nano',
	BOARD_MEGA: 'Arduino Mega',
	BOARD_ESP32: 'ESP32',
	BOARD_SUPERMINI: 'Super Mini',
	// Block Search UI
	FUNCTION_SEARCH_TITLE: 'Поиск блоков',
	FUNCTION_SEARCH_BUTTON_TITLE: 'Поиск блоков',
	FUNCTION_SEARCH_PLACEHOLDER: 'Введите название блока или параметры...',
	FUNCTION_SEARCH_BTN: 'Поиск',
	FUNCTION_SEARCH_PREV: 'Предыдущий',
	FUNCTION_SEARCH_NEXT: 'Следующий',
	FUNCTION_SEARCH_EMPTY: 'Поиск еще не выполнен',
	FUNCTION_SEARCH_NO_RESULTS: 'Совпадающие блоки не найдены',
	FUNCTION_RESULT_PREFIX: 'Блок: ',
	FUNCTION_KEYBOARD_SHORTCUT_TIP: '(Комбинация: Ctrl+F)',
	FUNCTION_SEARCH_HISTORY_TITLE: 'История поиска',

	// Block Categories
	CATEGORY_LOGIC: 'Логика',
	CATEGORY_LOOPS: 'Циклы',
	CATEGORY_MATH: 'Математика',
	CATEGORY_TEXT: 'Текст',
	CATEGORY_LISTS: 'Списки',
	CATEGORY_VARIABLES: 'Переменные',
	CATEGORY_FUNCTIONS: 'Функции',
	CATEGORY_ARDUINO: 'Arduino',
	CATEGORY_SENSORS: 'Датчики',
	CATEGORY_MOTORS: 'Моторы',
	// Servo Block Labels
	SERVO_SETUP: 'Настроить сервопривод',
	SERVO_PIN: 'Пин',
	SERVO_SETUP_TOOLTIP: 'Объявить переменную сервопривода и установить пин',
	SERVO_MOVE: 'Повернуть сервопривод',
	SERVO_ANGLE: 'Угол',
	SERVO_MOVE_TOOLTIP: 'Повернуть сервопривод на определенный угол',
	SERVO_STOP: 'Остановить сервопривод',
	SERVO_STOP_TOOLTIP: 'Остановить выходной сигнал сервопривода',

	// Arduino Block Labels
	ARDUINO_SETUP: 'Настройка',
	ARDUINO_LOOP: 'Цикл',
	ARDUINO_DIGITAL_WRITE: 'Цифровая запись',
	ARDUINO_DIGITAL_READ: 'Цифровое чтение',
	ARDUINO_ANALOG_WRITE: 'Аналоговая запись',
	ARDUINO_ANALOG_READ: 'Аналоговое чтение',
	ARDUINO_PIN: 'Пин',
	ARDUINO_VALUE: 'Значение',
	ARDUINO_DELAY: 'Задержка',
	ARDUINO_DELAY_MS: 'миллисекунд',
	ARDUINO_PULLUP: 'Включить внутренний подтягивающий резистор',
	ARDUINO_MODE: 'Режим',
	ARDUINO_MODE_INPUT: 'ВХОД',
	ARDUINO_MODE_OUTPUT: 'ВЫХОД',

	// Sensor Block Labels
	ULTRASONIC_SENSOR: 'Ультразвуковой датчик',
	ULTRASONIC_TRIG_PIN: 'Пин Trig',
	ULTRASONIC_ECHO_PIN: 'Пин Echo',
	ULTRASONIC_USE_INTERRUPT: 'Использовать аппаратное прерывание',
	ULTRASONIC_READ: 'Считать ультразвуковое расстояние (см)',
	ULTRASONIC_TOOLTIP_SETUP:
		'Настраивает ультразвуковой датчик с пинами Trig и Echo. Опциональное аппаратное прерывание для большей точности.',
	ULTRASONIC_TOOLTIP_READ: 'Считывает расстояние, измеренное ультразвуковым датчиком, в сантиметрах.',
	ULTRASONIC_WARNING: 'Выбранный пин Echo {0} не поддерживает аппаратные прерывания. Пожалуйста, выберите один из этих пинов: {1}',

	// Threshold Function Block Labels
	THRESHOLD_PIN: 'на',
	THRESHOLD_VALUE: 'если >',
	THRESHOLD_HIGH_VALUE: '=',
	THRESHOLD_LOW_VALUE: 'иначе',
	THRESHOLD_TOOLTIP_SETUP:
		'Настраивает функцию порога. Когда аналоговый вход превышает порог, возвращает первый выход, иначе возвращает второй выход.',
	THRESHOLD_TOOLTIP_READ: 'Получает значение из пороговой функции',

	// Duration block
	DURATION_REPEAT: 'Повторять в течение',
	DURATION_TIME: 'времени',
	DURATION_MS: 'миллисекунд',
	DURATION_DO: 'выполнять',

	// Print block
	TEXT_PRINT_SHOW: 'вывести',
	TEXT_PRINT_NEWLINE: 'новая строка',

	// Pin Mode block
	PIN_MODE_SET: 'установить',

	// Function Block Labels
	FUNCTION_CREATE: 'Создать функцию',
	FUNCTION_NAME: 'Имя',
	FUNCTION_PARAMS: 'Параметры',
	FUNCTION_RETURN: 'Возврат',
	FUNCTION_CALL: 'Вызов',

	// Logic Block Labels
	LOGIC_IF: 'если',
	LOGIC_ELSE: 'иначе',
	LOGIC_THEN: 'то',
	LOGIC_AND: 'и',
	LOGIC_OR: 'или',
	LOGIC_NOT: 'не',
	LOGIC_TRUE: 'истина',
	LOGIC_FALSE: 'ложь',

	// Loop Block Labels
	LOOP_REPEAT: 'повторить',
	LOOP_WHILE: 'пока',
	LOOP_UNTIL: 'до тех пор пока',
	LOOP_FOR: 'для',
	LOOP_FOREACH: 'для каждого',
	LOOP_BREAK: 'прервать',
	LOOP_CONTINUE: 'продолжить',

	// Math Block Labels
	MATH_NUMBER: 'число',
	MATH_ARITHMETIC: 'арифметика',
	MATH_OPERATIONS: 'операции',
	MATH_ADD: 'сложить',
	MATH_SUBTRACT: 'вычесть',
	MATH_MULTIPLY: 'умножить',
	MATH_DIVIDE: 'разделить',
	MATH_POWER: 'степень',

	// Math Map Block
	MATH_MAP_VALUE: 'преобразовать',
	MATH_MAP_TOOLTIP:
		'Преобразует число из одного диапазона в другой. Например, map(значение, 0, 1023, 0, 255) преобразует аналоговый вход в 8-битный ШИМ выход.',

	// VS Code UI Messages
	VSCODE_OPEN_FOLDER: 'Открыть Папку',
	VSCODE_PLEASE_OPEN_PROJECT: 'Пожалуйста, сначала откройте папку проекта!',
	VSCODE_FAILED_SAVE_FILE: 'Не удалось сохранить файл: {0}',
	VSCODE_FAILED_UPDATE_INI: 'Не удалось обновить platformio.ini: {0}',
	VSCODE_UNABLE_SAVE_WORKSPACE: 'Не удалось сохранить состояние рабочего пространства: {0}',
	VSCODE_FAILED_START: 'Не удалось запустить Singular Blockly: {0}',
	VSCODE_CONFIRM_DELETE_VARIABLE: 'Вы уверены, что хотите удалить переменную "{0}"?',
	VSCODE_BOARD_UPDATED: 'Конфигурация платы обновлена до: {0}',
	VSCODE_RELOAD_REQUIRED: '，Пожалуйста, перезагрузите окно для завершения настройки',
	VSCODE_ENTER_VARIABLE_NAME: 'Введите имя новой переменной',
	VSCODE_ENTER_NEW_VARIABLE_NAME: 'Введите новое имя переменной (текущее: {0})',
	VSCODE_VARIABLE_NAME_EMPTY: 'Имя переменной не может быть пустым',
	VSCODE_VARIABLE_NAME_INVALID:
		'Имя переменной может содержать только буквы, цифры и символы подчеркивания, и не может начинаться с цифры',
	VSCODE_RELOAD: 'Перезагрузить',
	VSCODE_OK: 'OK',
	VSCODE_CANCEL: 'Отмена',
	VSCODE_OPEN_BLOCKLY_EDITOR: 'Открыть редактор Blockly',

	// Error Messages
	ERROR_BOARD_NOT_SELECTED: 'Пожалуйста, сначала выберите плату',
	ERROR_INVALID_PIN: 'Недопустимый номер контакта',
	ERROR_INVALID_VALUE: 'Недопустимое значение',
	ERROR_MISSING_TRANSLATION: 'Перевод отсутствует',

	// Blockly core messages
	ADD: 'добавить',
	REMOVE: 'удалить',
	RENAME: 'переименовать',
	NEW: 'новый',
	ADD_COMMENT: 'Добавить комментарий',
	REMOVE_COMMENT: 'Удалить комментарий',
	DUPLICATE_BLOCK: 'Дублировать',
	HELP: 'Помощь',
	UNDO: 'Отменить',
	REDO: 'Повторить',
	COLLAPSE_BLOCK: 'Свернуть блок',
	EXPAND_BLOCK: 'Развернуть блок',
	DELETE_BLOCK: 'Удалить блок',
	DELETE_X_BLOCKS: 'Удалить блоков: %1',
	DELETE_ALL_BLOCKS: 'Удалить все блоки (%1)?',
	CLEAN_UP: 'Навести порядок в блоках',
	COLLAPSE_ALL: 'Свернуть блоки',
	EXPAND_ALL: 'Развернуть блоки',
	DISABLE_BLOCK: 'Отключить блок',
	ENABLE_BLOCK: 'Включить блок',
	INLINE_INPUTS: 'Встроенные входы',
	EXTERNAL_INPUTS: 'Внешние входы',

	// Variable & Function messages
	RENAME_VARIABLE: 'Переименовать переменную...',
	NEW_VARIABLE: 'Создать переменную...',
	DELETE_VARIABLE: 'Удалить переменную %1',
	PROCEDURE_ALREADY_EXISTS: 'Процедура с именем "%1" уже существует.',

	// Logic block messages
	CONTROLS_IF_MSG_IF: 'если',
	CONTROLS_IF_MSG_THEN: 'то',
	CONTROLS_IF_MSG_ELSE: 'иначе',
	CONTROLS_IF_MSG_ELSEIF: 'иначе если',
	CONTROLS_IF_IF_TITLE_IF: 'если',
	CONTROLS_IF_ELSEIF_TITLE_ELSEIF: 'иначе если',
	CONTROLS_IF_ELSE_TITLE_ELСЕ: 'иначе',
	LOGIC_COMPARE_TOOLTIP_EQ: 'Возвращает истину, если оба входа равны друг другу.',
	LOGIC_COMPARE_TOOLTIP_NEQ: 'Возвращает истину, если оба входа не равны друг другу.',
	LOGIC_COMPARE_TOOLTIP_LT: 'Возвращает истину, если первый вход меньше второго входа.',
	LOGIC_COMPARE_TOOLTIP_LTE: 'Возвращает истину, если первый вход меньше или равен второму входу.',
	LOGIC_COMPARE_TOOLTIP_GT: 'Возвращает истину, если первый вход больше второго входа.',
	LOGIC_COMPARE_TOOLTIP_GTE: 'Возвращает истину, если первый вход больше или равен второму входу.',
	LOGIC_OPERATION_AND: 'и',
	LOGIC_OPERATION_OR: 'или',
	LOGIC_NEGATE_TITLE: 'не %1',
	LOGIC_BOOLEAN_TRUE: 'истина',
	LOGIC_BOOLEAN_FALSE: 'ложь',
	LOGIC_NULL: 'null',

	// Additional Logic Block Messages
	LOGIC_COMPARE_HELPURL: 'https://ru.wikipedia.org/wiki/Неравенство_(математика)',
	LOGIC_NEGATE_HELPURL: 'https://github.com/google/blockly/wiki/Logic#not',
	LOGIC_NEGATE_TOOLTIP: 'Возвращает истину, если вход ложен. Возвращает ложь, если вход истинен.',
	LOGIC_OPERATION_TOOLTIP_AND: 'Возвращает истину, если оба входа истинны.',
	LOGIC_OPERATION_TOOLTIP_OR: 'Возвращает истину, если хотя бы один из входов истинен.',
	LOGIC_BOOLEAN_TOOLTIP: 'Возвращает либо истину, либо ложь.',

	// Loop block messages
	CONTROLS_REPEAT_TITLE: 'повторить %1 раз',
	CONTROLS_WHILEUNTIL_OPERATOR_WHILE: 'повторять, пока',
	CONTROLS_WHILEUNTIL_OPERATOR_UNTIL: 'повторять, до тех пор пока не',
	CONTROLS_FOR_TITLE: 'считать с %1 от %2 до %3 шагом %4',
	CONTROLS_FLOW_STATEMENTS_OPERATOR_BREAK: 'выйти из цикла',
	CONTROLS_FLOW_STATEMENTS_OPERATOR_CONTINUE: 'перейти к следующей итерации цикла',
	CONTROLS_REPEAT_TOOLTIP: 'Повторяет выполнение действий несколько раз.',
	CONTROLS_WHILEUNTIL_TOOLTIP_WHILE: 'Пока значение истинно, выполняет действия.',
	CONTROLS_WHILEUNTIL_TOOLTIP_UNTIL: 'Пока значение ложно, выполняет действия.',
	CONTROLS_FOR_TOOLTIP: 'Считает от начального числа до конечного с заданным интервалом.',
	CONTROLS_FLOW_STATEMENTS_WARNING: 'Предупреждение: Этот блок может использоваться только внутри цикла.',

	// Math block messages
	MATH_NUMBER_HELPURL: 'https://ru.wikipedia.org/wiki/Число',
	MATH_NUMBER_TOOLTIP: 'Число.',
	MATH_ARITHMETIC_OPERATOR_ADD: '+',
	MATH_ARITHMETIC_OPERATOR_MINUS: '-',
	MATH_ARITHMETIC_OPERATOR_MULTIPLY: '×',
	MATH_ARITHMETIC_OPERATOR_DIVIDE: '÷',
	MATH_ARITHMETIC_OPERATOR_POWER: '^',
	MATH_SINGLE_OPERATOR_ROOT: 'корень квадратный',
	MATH_SINGLE_OPERATOR_ABSOLUTE: 'модуль',
	MATH_IS_EVEN: 'четное',
	MATH_IS_ODD: 'нечетное',
	MATH_IS_PRIME: 'простое',
	MATH_IS_WHOLE: 'целое',
	MATH_IS_POSITIVE: 'положительное',
	MATH_IS_NEGATIVE: 'отрицательное',
	MATH_ARITHMETIC_HELPURL: 'https://ru.wikipedia.org/wiki/Арифметика',
	MATH_ARITHMETIC_TOOLTIP_ADD: 'Возвращает сумму двух чисел.',
	MATH_ARITHMETIC_TOOLTIP_MINUS: 'Возвращает разность двух чисел.',
	MATH_ARITHMETIC_TOOLTIP_MULTIPLY: 'Возвращает произведение двух чисел.',
	MATH_ARITHMETIC_TOOLTIP_DIVIDE: 'Возвращает частное от деления двух чисел.',
	MATH_ARITHMETIC_TOOLTIP_POWER: 'Возвращает первое число, возведенное в степень второго числа.',

	// Text block messages
	TEXT_JOIN_TITLE_CREATEWITH: 'создать текст из',
	TEXT_CREATE_JOIN_TITLE_JOIN: 'объединить',
	TEXT_LENGTH_TITLE: 'длина %1',
	TEXT_ISEMPTY_TITLE: '%1 пусто',
	TEXT_INDEXOF_OPERATOR_FIRST: 'найти первое вхождение текста',
	TEXT_INDEXOF_OPERATOR_LAST: 'найти последнее вхождение текста',
	TEXT_CHARAT_FROM_START: 'взять букву №',
	TEXT_CHARAT_FROM_END: 'взять букву № с конца',
	TEXT_CHARAT_FIRST: 'взять первую букву',
	TEXT_CHARAT_LAST: 'взять последнюю букву',
	TEXT_CHARAT_RANDOM: 'взять случайную букву',
	TEXT_JOIN_TOOLTIP: 'Создает текст, объединяя любое количество элементов.',
	TEXT_APPEND_VARIABLE: 'элемент',
	TEXT_APPEND_TOOLTIP: 'Добавляет текст к переменной "%1".',
	TEXT_LENGTH_TOOLTIP: 'Возвращает количество букв (включая пробелы) в указанном тексте.',
	TEXT_ISEMPTY_TOOLTIP: 'Возвращает истину, если указанный текст пуст.',

	// List block messages
	LISTS_CREATE_EMPTY_TITLE: 'создать пустой список',
	LISTS_CREATE_WITH_INPUT_WITH: 'создать список с',
	LISTS_LENGTH_TITLE: 'длина %1',
	LISTS_ISEMPTY_TITLE: '%1 пусто',
	LISTS_INDEXOF_FIRST: 'найти первое вхождение элемента',
	LISTS_INDEXOF_LAST: 'найти последнее вхождение элемента',
	LISTS_GET_INDEX_GET: 'получить',
	LISTS_GET_INDEX_REMOVE: 'удалить',
	LISTS_GET_INDEX_FROM_START: '#',
	LISTS_GET_INDEX_FROM_END: '# с конца',
	LISTS_GET_INDEX_FIRST: 'первый',
	LISTS_GET_INDEX_LAST: 'последний',
	LISTS_GET_INDEX_RANDOM: 'случайный',
	LISTS_CREATE_WITH_TOOLTIP: 'Создает список с любым количеством элементов.',
	LISTS_CREATE_EMPTY_TOOLTIP: 'Возвращает список длиной 0, не содержащий записей.',
	LISTS_LENGTH_TOOLTIP: 'Возвращает длину списка.',
	LISTS_ISEMPTY_TOOLTIP: 'Возвращает истину, если список пуст.',

	// Variables
	VARIABLES_SET: 'присвоить %1 значение %2',
	VARIABLES_GET: '%1',
	VARIABLES_DEFAULT_NAME: 'элемент',

	// If conditions
	CONTROLS_IF_TOOLTIP_1: 'Если значение истинно, то выполняет действия.',
	CONTROLS_IF_TOOLTIP_2: 'Если значение истинно, то выполняет первый блок действий. Иначе выполняет второй блок действий.',
	CONTROLS_IF_TOOLTIP_3:
		'Если первое значение истинно, то выполняет первый блок действий. Иначе, если второе значение истинно, выполняет второй блок действий.',
	CONTROLS_IF_TOOLTIP_4:
		'Если первое значение истинно, то выполняет первый блок действий. Иначе, если второе значение истинно, выполняет второй блок действий. Если ни одно из значений не истинно, выполняет последний блок действий.',

	// Procedures
	PROCEDURES_DEFNORETURN_TITLE: '',
	PROCEDURES_DEFNORETURN_PROCEDURE: 'выполнить что-то',
	PROCEDURES_BEFORE_PARAMS: 'с:',
	PROCEDURES_CALL_BEFORE_PARAMS: 'с:',
	PROCEDURES_DEFNORETURN_DO: '',
	PROCEDURES_DEFNORETURN_TOOLTIP: 'Создает функцию без вывода результата.',
	PROCEDURES_DEFRETURN_RETURN: 'вернуть',
	PROCEDURES_DEFRETURN_TOOLTIP: 'Создает функцию с выводом результата.',
	PROCEDURES_DEFRETURN_COMMENT: 'Описание этой функции...',
	PROCEDURES_DEFRETURN_PROCEDURE: 'выполнить что-то с возвратом',
	PROCEDURES_DEFRETURN_DO: '',
	PROCEDURES_CALLNORETURN_HELPURL: 'https://ru.wikipedia.org/wiki/Подпрограмма',
	PROCEDURES_CALLNORETURN_TOOLTIP: 'Выполняет пользовательскую функцию.',
	PROCEDURES_CALLRETURN_HELPURL: 'https://ru.wikipedia.org/wiki/Подпрограмма',
	PROCEDURES_CALLRETURN_TOOLTIP: 'Выполняет пользовательскую функцию и использует её результат.',

	// Seven Segment Display
	SEVEN_SEGMENT_DISPLAY: 'Семисегментный индикатор',
	SEVEN_SEGMENT_COMMON_CATHODE: 'Общий катод',
	SEVEN_SEGMENT_COMMON_ANODE: 'Общий анод',
	SEVEN_SEGMENT_NUMBER: 'Число (0-9):',
	SEVEN_SEGMENT_DECIMAL_POINT: 'Десятичная точка',
	SEVEN_SEGMENT_TOOLTIP: 'Отображает число (0-9) на семисегментном индикаторе с опциональной десятичной точкой.',
	// Seven Segment Display Pins
	SEVEN_SEGMENT_PINS_SET: 'Установить пины семисегментного индикатора',
	SEVEN_SEGMENT_PINS_TOOLTIP: 'Настроить пины для каждого сегмента (A-G) и десятичной точки (DP) семисегментного индикатора.',
	// Pixetto Smart Camera
	PIXETTO_INIT: 'Инициализировать умную камеру Pixetto',
	PIXETTO_RX_PIN: 'Пин RX',
	PIXETTO_TX_PIN: 'Пин TX',
	PIXETTO_IS_DETECTED: 'Pixetto Объект Обнаружен',
	PIXETTO_GET_TYPE_ID: 'Pixetto Получить ID Типа',
	PIXETTO_GET_FUNC_ID: 'Pixetto Получить ID Функции',
	PIXETTO_COLOR_DETECT: 'Pixetto обнаружение цвета',
	PIXETTO_SHAPE_DETECT: 'Pixetto обнаружение формы',
	PIXETTO_FACE_DETECT: 'Pixetto обнаружение лица',
	PIXETTO_APRILTAG_DETECT: 'Pixetto обнаружение AprilTag',
	PIXETTO_NEURAL_NETWORK: 'Pixetto распознавание нейронной сети',
	PIXETTO_HANDWRITTEN_DIGIT: 'Pixetto распознавание рукописной цифры',
	PIXETTO_GET_POSITION: 'Pixetto получить обнаруженный объект',
	PIXETTO_ROAD_DETECT: 'Pixetto обнаружение дороги',
	PIXETTO_SET_MODE: 'Установить функциональный режим Pixetto',
	PIXETTO_COLOR: 'Цвет',
	PIXETTO_SHAPE: 'Форма',
	PIXETTO_MODE: 'Режим',
	PIXETTO_TAG_ID: 'ID метки',
	PIXETTO_CLASS_ID: 'ID класса',
	PIXETTO_DIGIT: 'Цифра',
	PIXETTO_COORDINATE: 'Координата',
	PIXETTO_ROAD_INFO: 'Информация',
	PIXETTO_CATEGORY: 'Pixetto',

	// Pixetto Tooltips
	PIXETTO_INIT_TOOLTIP: 'Инициализировать умную камеру Pixetto и настроить пины связи UART',
	PIXETTO_IS_DETECTED_TOOLTIP: 'Обнаружить, обнаруживает ли Pixetto какой-либо объект',
	PIXETTO_GET_TYPE_ID_TOOLTIP: 'Получить ID типа объекта, обнаруженного Pixetto (цвет, форма и т.д.)',
	PIXETTO_GET_FUNC_ID_TOOLTIP: 'Получить ID функции, используемой в данный момент Pixetto (обнаружение цвета, формы и т.д.)',
	PIXETTO_COLOR_DETECT_TOOLTIP: 'Определить, обнаруживает ли Pixetto объект указанного цвета',
	PIXETTO_SHAPE_DETECT_TOOLTIP: 'Определить, обнаруживает ли Pixetto объект указанной формы',
	PIXETTO_FACE_DETECT_TOOLTIP: 'Определить, обнаруживает ли Pixetto лицо',
	PIXETTO_APRILTAG_DETECT_TOOLTIP: 'Определить, обнаруживает ли Pixetto AprilTag с указанным ID',
	PIXETTO_NEURAL_NETWORK_TOOLTIP: 'Определить, распознает ли нейронная сеть Pixetto объект указанного класса',
	PIXETTO_HANDWRITTEN_DIGIT_TOOLTIP: 'Определить, распознает ли Pixetto указанную рукописную цифру',
	PIXETTO_GET_POSITION_TOOLTIP: 'Получить информацию о позиции или размере объекта, обнаруженного Pixetto',
	PIXETTO_ROAD_DETECT_TOOLTIP: 'Получить информацию, связанную с обнаружением дороги от Pixetto',
	PIXETTO_SET_MODE_TOOLTIP: 'Установить функциональный режим умной камеры Pixetto',

	// Pixetto Color Options
	PIXETTO_COLOR_RED: 'Красный',
	PIXETTO_COLOR_BLUE: 'Синий',
	PIXETTO_COLOR_GREEN: 'Зеленый',
	PIXETTO_COLOR_YELLOW: 'Желтый',
	PIXETTO_COLOR_ORANGE: 'Оранжевый',
	PIXETTO_COLOR_PURPLE: 'Фиолетовый',
	PIXETTO_COLOR_BLACK: 'Черный',
	PIXETTO_COLOR_WHITE: 'Белый',

	// Pixetto Shape Options
	PIXETTO_SHAPE_TRIANGLE: 'Треугольник',
	PIXETTO_SHAPE_RECTANGLE: 'Прямоугольник',
	PIXETTO_SHAPE_PENTAGON: 'Пятиугольник',
	PIXETTO_SHAPE_HEXAGON: 'Шестиугольник',
	PIXETTO_SHAPE_CIRCLE: 'Круг',

	// Pixetto Position Options
	PIXETTO_POSITION_X: 'X координата',
	PIXETTO_POSITION_Y: 'Y координата',
	PIXETTO_POSITION_WIDTH: 'Ширина',
	PIXETTO_POSITION_HEIGHT: 'Высота',

	// Pixetto Road Info Options
	PIXETTO_ROAD_CENTER_X: 'Центр X',
	PIXETTO_ROAD_CENTER_Y: 'Центр Y',
	PIXETTO_ROAD_LEFT_X: 'Левая граница X',
	PIXETTO_ROAD_RIGHT_X: 'Правая граница X',

	// Pixetto Mode Options
	PIXETTO_MODE_COLOR_DETECTION: 'Обнаружение цвета',
	PIXETTO_MODE_SHAPE_DETECTION: 'Обнаружение формы',
	PIXETTO_MODE_FACE_DETECTION: 'Обнаружение лица',
	PIXETTO_MODE_APRILTAG_DETECTION: 'Обнаружение AprilTag',
	PIXETTO_MODE_NEURAL_NETWORK: 'Нейронная сеть',
	PIXETTO_MODE_HANDWRITTEN_DIGIT: 'Рукописная цифра',
	PIXETTO_MODE_ROAD_DETECTION: 'Обнаружение дороги',
	PIXETTO_MODE_BALL_DETECTION: 'Обнаружение мяча',
	PIXETTO_MODE_TEMPLATE_MATCHING: 'Сопоставление шаблонов',
});
