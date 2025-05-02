/**
 * @license
 * Copyright 2024 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file contains translations derived from Blockly project
 * Copyright 2012 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

// Define translations for Polish
window.languageManager.loadMessages('pl', {
	// UI Elements
	BLOCKS_TAB: 'Bloki',
	CODE_TAB: 'Kod',
	BOARD_SELECT_LABEL: 'Wybierz płytkę:',

	// Experimental Blocks Notice
	EXPERIMENTAL_BLOCKS_TITLE: 'Wykryto bloki eksperymentalne',
	EXPERIMENTAL_BLOCKS_DESC:
		'Twój obszar roboczy zawiera bloki eksperymentalne (wyróżnione żółtymi przerywanymi krawędziami). Te funkcje mogą ulec zmianie lub zostać usunięte w przyszłych aktualizacjach, używaj ich ostrożnie.',

	// Preview Mode UI
	PREVIEW_BADGE: 'Podgląd',
	THEME_TOGGLE: 'Zmień motyw',
	PREVIEW_WINDOW_TITLE: 'Blockly Podgląd - {0}',
	PREVIEW_WINDOW_TITLE_WITH_NAME: 'Podgląd - {0}',

	// Backup Modal UI
	BACKUP_MANAGER_TITLE: 'Menedżer kopii zapasowych',
	BACKUP_CREATE_NEW: 'Utwórz nową kopię',
	BACKUP_NAME_LABEL: 'Nazwa kopii:',
	BACKUP_NAME_PLACEHOLDER: 'Wprowadź nazwę kopii',
	BACKUP_CONFIRM: 'Potwierdź',
	BACKUP_CANCEL: 'Anuluj',
	BACKUP_LIST_TITLE: 'Lista kopii',
	BACKUP_LIST_EMPTY: 'Brak dostępnych kopii',
	BACKUP_BUTTON_TITLE: 'Menedżer kopii zapasowych',
	BACKUP_PREVIEW_BTN: 'Podgląd',
	BACKUP_RESTORE_BTN: 'Przywróć',
	BACKUP_DELETE_BTN: 'Usuń',
	AUTO_BACKUP_TITLE: 'Ustawienia automatycznej kopii',
	AUTO_BACKUP_INTERVAL_LABEL: 'Interwał kopii:',
	AUTO_BACKUP_MINUTES: 'minut',
	AUTO_BACKUP_SAVE: 'Zapisz ustawienia',
	AUTO_BACKUP_SAVED: 'Ustawienia automatycznej kopii zapisane',
	AUTO_BACKUP_PREFIX: 'auto_',
	MANUAL_BACKUP_TITLE: 'Kopia ręczna',

	// Board Names
	BOARD_NONE: 'Brak',
	BOARD_UNO: 'Arduino Uno',
	BOARD_NANO: 'Arduino Nano',
	BOARD_MEGA: 'Arduino Mega',
	BOARD_ESP32: 'ESP32',
	BOARD_SUPERMINI: 'Super Mini',

	// Block Categories
	CATEGORY_LOGIC: 'Logika',
	CATEGORY_LOOPS: 'Pętle',
	CATEGORY_MATH: 'Matematyka',
	CATEGORY_TEXT: 'Tekst',
	CATEGORY_LISTS: 'Listy',
	CATEGORY_VARIABLES: 'Zmienne',
	CATEGORY_FUNCTIONS: 'Funkcje',
	CATEGORY_ARDUINO: 'Arduino',
	CATEGORY_SENSORS: 'Czujniki',
	CATEGORY_MOTORS: 'Silniki',
	// Servo Block Labels
	SERVO_SETUP: 'Konfiguracja Serwa',
	SERVO_PIN: 'Pin',
	SERVO_SETUP_TOOLTIP: 'Zadeklaruj zmienną serwa i ustaw pin',
	SERVO_MOVE: 'Obróć Serwo',
	SERVO_ANGLE: 'Kąt',
	SERVO_MOVE_TOOLTIP: 'Obróć serwo do określonego kąta',
	SERVO_STOP: 'Zatrzymaj Serwo',
	SERVO_STOP_TOOLTIP: 'Zatrzymaj sygnał wyjściowy serwa',

	// Arduino Block Labels
	ARDUINO_SETUP: 'Konfiguracja',
	ARDUINO_LOOP: 'Pętla',
	ARDUINO_DIGITAL_WRITE: 'Zapis cyfrowy',
	ARDUINO_DIGITAL_READ: 'Odczyt cyfrowy',
	ARDUINO_ANALOG_WRITE: 'Zapis analogowy',
	ARDUINO_ANALOG_READ: 'Odczyt analogowy',
	ARDUINO_PIN: 'Pin',
	ARDUINO_VALUE: 'Wartość',
	ARDUINO_DELAY: 'Opóźnienie',
	ARDUINO_DELAY_MS: 'milisekund',
	ARDUINO_PULLUP: 'Włącz wewnętrzny pull-up',
	ARDUINO_MODE: 'Tryb',
	ARDUINO_MODE_INPUT: 'WEJŚCIE',
	ARDUINO_MODE_OUTPUT: 'WYJŚCIE',

	// Sensor Block Labels
	ULTRASONIC_SENSOR: 'Czujnik ultradźwiękowy',
	ULTRASONIC_TRIG_PIN: 'Pin Trig',
	ULTRASONIC_ECHO_PIN: 'Pin Echo',
	ULTRASONIC_USE_INTERRUPT: 'Użyj przerwania sprzętowego',
	ULTRASONIC_READ: 'Odczyt odległości ultradźwiękowej (cm)',
	ULTRASONIC_TOOLTIP_SETUP:
		'Konfiguruje czujnik ultradźwiękowy z pinami Trig i Echo. Opcjonalne przerwanie sprzętowe dla większej dokładności.',
	ULTRASONIC_TOOLTIP_READ: 'Odczytuje odległość zmierzoną przez czujnik ultradźwiękowy w centymetrach.',
	ULTRASONIC_WARNING: 'Wybrany pin Echo {0} nie obsługuje przerwań sprzętowych. Wybierz jeden z tych pinów: {1}',

	// Threshold Function Block Labels
	THRESHOLD_PIN: 'na',
	THRESHOLD_VALUE: 'jeśli >',
	THRESHOLD_HIGH_VALUE: '=',
	THRESHOLD_LOW_VALUE: 'w przeciwnym razie',
	THRESHOLD_TOOLTIP_SETUP:
		'Konfiguruje funkcję progową. Gdy wejście analogowe przekroczy próg, zwraca pierwszą wartość wyjściową, w przeciwnym razie zwraca drugą wartość.',
	THRESHOLD_TOOLTIP_READ: 'Pobiera wartość z funkcji progowej',

	// Duration block
	DURATION_REPEAT: 'Powtarzaj przez',
	DURATION_TIME: 'czas',
	DURATION_MS: 'milisekundy',
	DURATION_DO: 'wykonaj',

	// Print block
	TEXT_PRINT_SHOW: 'wydrukuj',
	TEXT_PRINT_NEWLINE: 'nowa linia',

	// Pin Mode block
	PIN_MODE_SET: 'ustaw',

	// Function Block Labels
	FUNCTION_CREATE: 'Utwórz funkcję',
	FUNCTION_NAME: 'Nazwa',
	FUNCTION_PARAMS: 'Parametry',
	FUNCTION_RETURN: 'Zwróć',
	FUNCTION_CALL: 'Wywołaj',

	// Logic Block Labels
	LOGIC_IF: 'jeśli',
	LOGIC_ELSE: 'w przeciwnym razie',
	LOGIC_THEN: 'to',
	LOGIC_AND: 'i',
	LOGIC_OR: 'lub',
	LOGIC_NOT: 'nie',
	LOGIC_TRUE: 'prawda',
	LOGIC_FALSE: 'fałsz',

	// Loop Block Labels
	LOOP_REPEAT: 'powtórz',
	LOOP_WHILE: 'dopóki',
	LOOP_UNTIL: 'aż do',
	LOOP_FOR: 'dla',
	LOOP_FOREACH: 'dla każdego',
	LOOP_BREAK: 'przerwij',
	LOOP_CONTINUE: 'kontynuuj',

	// Math Block Labels
	MATH_NUMBER: 'liczba',
	MATH_ARITHMETIC: 'arytmetyka',
	MATH_OPERATIONS: 'operacje',
	MATH_ADD: 'dodaj',
	MATH_SUBTRACT: 'odejmij',
	MATH_MULTIPLY: 'pomnóż',
	MATH_DIVIDE: 'podziel',
	MATH_POWER: 'potęga',

	// Math Map Block
	MATH_MAP_VALUE: 'mapuj',
	MATH_MAP_TOOLTIP:
		'Mapuje liczbę z jednego zakresu na inny. Na przykład, map(wartość, 0, 1023, 0, 255) przeskaluje wejście analogowe do wyjścia PWM 8-bitowego.',

	// VS Code UI Messages
	VSCODE_OPEN_FOLDER: 'Otwórz folder',
	VSCODE_PLEASE_OPEN_PROJECT: 'Proszę najpierw otworzyć folder projektu!',
	VSCODE_FAILED_SAVE_FILE: 'Nie udało się zapisać pliku: {0}',
	VSCODE_FAILED_UPDATE_INI: 'Nie udało się zaktualizować platformio.ini: {0}',
	VSCODE_UNABLE_SAVE_WORKSPACE: 'Nie można zapisać stanu obszaru roboczego: {0}',
	VSCODE_FAILED_START: 'Nie udało się uruchomić Singular Blockly: {0}',
	VSCODE_CONFIRM_DELETE_VARIABLE: 'Czy na pewno chcesz usunąć zmienną "{0}"?',
	VSCODE_BOARD_UPDATED: 'Konfiguracja płytki zaktualizowana do: {0}',
	VSCODE_RELOAD_REQUIRED: '，Proszę przeładować okno, aby zakończyć konfigurację',
	VSCODE_ENTER_VARIABLE_NAME: 'Wprowadź nazwę nowej zmiennej',
	VSCODE_ENTER_NEW_VARIABLE_NAME: 'Wprowadź nową nazwę zmiennej (obecna: {0})',
	VSCODE_VARIABLE_NAME_EMPTY: 'Nazwa zmiennej nie może być pusta',
	VSCODE_VARIABLE_NAME_INVALID: 'Nazwa zmiennej może zawierać tylko litery, cyfry i podkreślenia, i nie może zaczynać się od cyfry',
	VSCODE_RELOAD: 'Przeładuj',
	VSCODE_OK: 'OK',
	VSCODE_CANCEL: 'Anuluj',
	VSCODE_OPEN_BLOCKLY_EDITOR: 'Otwórz edytor Blockly',

	// Error Messages
	ERROR_BOARD_NOT_SELECTED: 'Proszę najpierw wybrać płytkę',
	ERROR_INVALID_PIN: 'Nieprawidłowy numer pinu',
	ERROR_INVALID_VALUE: 'Nieprawidłowa wartość',
	ERROR_MISSING_TRANSLATION: 'Brakujące tłumaczenie',

	// Blockly core messages
	ADD: 'dodaj',
	REMOVE: 'usuń',
	RENAME: 'zmień nazwę',
	NEW: 'nowy',
	ADD_COMMENT: 'Dodaj komentarz',
	REMOVE_COMMENT: 'Usuń komentarz',
	DUPLICATE_BLOCK: 'Duplikuj',
	HELP: 'Pomoc',
	UNDO: 'Cofnij',
	REDO: 'Ponów',
	COLLAPSE_BLOCK: 'Zwiń blok',
	EXPAND_BLOCK: 'Rozwiń blok',
	DELETE_BLOCK: 'Usuń blok',
	DELETE_X_BLOCKS: 'Usuń %1 bloków',
	DELETE_ALL_BLOCKS: 'Usunąć wszystkie %1 bloków?',
	CLEAN_UP: 'Uporządkuj bloki',
	COLLAPSE_ALL: 'Zwiń bloki',
	EXPAND_ALL: 'Rozwiń bloki',
	DISABLE_BLOCK: 'Wyłącz blok',
	ENABLE_BLOCK: 'Włącz blok',
	INLINE_INPUTS: 'Wejścia w linii',
	EXTERNAL_INPUTS: 'Zewnętrzne wejścia',

	// Variable & Function messages
	RENAME_VARIABLE: 'Zmień nazwę zmiennej...',
	NEW_VARIABLE: 'Utwórz zmienną...',
	DELETE_VARIABLE: 'Usuń zmienną %1',
	PROCEDURE_ALREADY_EXISTS: 'Procedura o nazwie "%1" już istnieje.',

	// Logic block messages
	CONTROLS_IF_MSG_IF: 'jeśli',
	CONTROLS_IF_MSG_THEN: 'to',
	CONTROLS_IF_MSG_ELSE: 'w przeciwnym razie',
	CONTROLS_IF_MSG_ELSEIF: 'w przeciwnym razie jeśli',
	CONTROLS_IF_IF_TITLE_IF: 'jeśli',
	CONTROLS_IF_ELSEIF_TITLE_ELSEIF: 'w przeciwnym razie jeśli',
	CONTROLS_IF_ELSE_TITLE_ELSE: 'w przeciwnym razie',
	LOGIC_COMPARE_TOOLTIP_EQ: 'Zwraca prawdę, jeśli oba wejścia są sobie równe.',
	LOGIC_COMPARE_TOOLTIP_NEQ: 'Zwraca prawdę, jeśli oba wejścia nie są sobie równe.',
	LOGIC_COMPARE_TOOLTIP_LT: 'Zwraca prawdę, jeśli pierwsze wejście jest mniejsze od drugiego.',
	LOGIC_COMPARE_TOOLTIP_LTE: 'Zwraca prawdę, jeśli pierwsze wejście jest mniejsze lub równe drugiemu.',
	LOGIC_COMPARE_TOOLTIP_GT: 'Zwraca prawdę, jeśli pierwsze wejście jest większe od drugiego.',
	LOGIC_COMPARE_TOOLTIP_GTE: 'Zwraca prawdę, jeśli pierwsze wejście jest większe lub równe drugiemu.',
	LOGIC_OPERATION_AND: 'i',
	LOGIC_OPERATION_OR: 'lub',
	LOGIC_NEGATE_TITLE: 'nie %1',
	LOGIC_BOOLEAN_TRUE: 'prawda',
	LOGIC_BOOLEAN_FALSE: 'fałsz',
	LOGIC_NULL: 'null',

	// Additional Logic Block Messages
	LOGIC_COMPARE_HELPURL: 'https://pl.wikipedia.org/wiki/Nierówność_(matematyka)',
	LOGIC_NEGATE_HELPURL: 'https://github.com/google/blockly/wiki/Logic#not',
	LOGIC_NEGATE_TOOLTIP: 'Zwraca prawdę, jeśli wejście jest fałszem. Zwraca fałsz, jeśli wejście jest prawdą.',
	LOGIC_OPERATION_TOOLTIP_AND: 'Zwraca prawdę, jeśli oba wejścia są prawdą.',
	LOGIC_OPERATION_TOOLTIP_OR: 'Zwraca prawdę, jeśli przynajmniej jedno z wejść jest prawdą.',
	LOGIC_BOOLEAN_TOOLTIP: 'Zwraca albo prawdę, albo fałsz.',

	// Loop block messages
	CONTROLS_REPEAT_TITLE: 'powtórz %1 razy',
	CONTROLS_WHILEUNTIL_OPERATOR_WHILE: 'powtarzaj dopóki',
	CONTROLS_WHILEUNTIL_OPERATOR_UNTIL: 'powtarzaj aż do',
	CONTROLS_FOR_TITLE: 'licz z %1 od %2 do %3 co %4',
	CONTROLS_FLOW_STATEMENTS_OPERATOR_BREAK: 'wyjdź z pętli',
	CONTROLS_FLOW_STATEMENTS_OPERATOR_CONTINUE: 'kontynuuj następną iterację',
	CONTROLS_REPEAT_TOOLTIP: 'Wykonaj pewne instrukcje kilka razy.',
	CONTROLS_WHILEUNTIL_TOOLTIP_WHILE: 'Dopóki wartość jest prawdą, wykonuj instrukcje.',
	CONTROLS_WHILEUNTIL_TOOLTIP_UNTIL: 'Dopóki wartość jest fałszem, wykonuj instrukcje.',
	CONTROLS_FOR_TOOLTIP: 'Zlicza od liczby początkowej do końcowej z określonym krokiem.',
	CONTROLS_FLOW_STATEMENTS_WARNING: 'Ostrzeżenie: Ten blok może być używany tylko w pętli.',

	// Math block messages
	MATH_NUMBER_HELPURL: 'https://pl.wikipedia.org/wiki/Liczba',
	MATH_NUMBER_TOOLTIP: 'Liczba.',
	MATH_ARITHMETIC_OPERATOR_ADD: '+',
	MATH_ARITHMETIC_OPERATOR_MINUS: '-',
	MATH_ARITHMETIC_OPERATOR_MULTIPLY: '×',
	MATH_ARITHMETIC_OPERATOR_DIVIDE: '÷',
	MATH_ARITHMETIC_OPERATOR_POWER: '^',
	MATH_SINGLE_OPERATOR_ROOT: 'pierwiastek kwadratowy',
	MATH_SINGLE_OPERATOR_ABSOLUTE: 'wartość bezwzględna',
	MATH_IS_EVEN: 'jest parzysta',
	MATH_IS_ODD: 'jest nieparzysta',
	MATH_IS_PRIME: 'jest liczbą pierwszą',
	MATH_IS_WHOLE: 'jest liczbą całkowitą',
	MATH_IS_POSITIVE: 'jest dodatnia',
	MATH_IS_NEGATIVE: 'jest ujemna',
	MATH_ARITHMETIC_HELPURL: 'https://pl.wikipedia.org/wiki/Arytmetyka',
	MATH_ARITHMETIC_TOOLTIP_ADD: 'Zwraca sumę dwóch liczb.',
	MATH_ARITHMETIC_TOOLTIP_MINUS: 'Zwraca różnicę dwóch liczb.',
	MATH_ARITHMETIC_TOOLTIP_MULTIPLY: 'Zwraca iloczyn dwóch liczb.',
	MATH_ARITHMETIC_TOOLTIP_DIVIDE: 'Zwraca iloraz dwóch liczb.',
	MATH_ARITHMETIC_TOOLTIP_POWER: 'Zwraca pierwszą liczbę podniesioną do potęgi drugiej liczby.',

	// Text block messages
	TEXT_JOIN_TITLE_CREATEWITH: 'utwórz tekst z',
	TEXT_CREATE_JOIN_TITLE_JOIN: 'połącz',
	TEXT_LENGTH_TITLE: 'długość %1',
	TEXT_ISEMPTY_TITLE: '%1 jest pusty',
	TEXT_INDEXOF_OPERATOR_FIRST: 'znajdź pierwsze wystąpienie tekstu',
	TEXT_INDEXOF_OPERATOR_LAST: 'znajdź ostatnie wystąpienie tekstu',
	TEXT_CHARAT_FROM_START: 'pobierz literę #',
	TEXT_CHARAT_FROM_END: 'pobierz literę # od końca',
	TEXT_CHARAT_FIRST: 'pobierz pierwszą literę',
	TEXT_CHARAT_LAST: 'pobierz ostatnią literę',
	TEXT_CHARAT_RANDOM: 'pobierz losową literę',
	TEXT_JOIN_TOOLTIP: 'Tworzy fragment tekstu łącząc dowolną liczbę elementów.',
	TEXT_APPEND_VARIABLE: 'element',
	TEXT_APPEND_TOOLTIP: 'Dołącz tekst do zmiennej "%1".',
	TEXT_LENGTH_TOOLTIP: 'Zwraca liczbę liter (włącznie ze spacjami) w podanym tekście.',
	TEXT_ISEMPTY_TOOLTIP: 'Zwraca prawdę, jeśli podany tekst jest pusty.',

	// List block messages
	LISTS_CREATE_EMPTY_TITLE: 'utwórz pustą listę',
	LISTS_CREATE_WITH_INPUT_WITH: 'utwórz listę z',
	LISTS_LENGTH_TITLE: 'długość %1',
	LISTS_ISEMPTY_TITLE: '%1 jest pusta',
	LISTS_INDEXOF_FIRST: 'znajdź pierwsze wystąpienie elementu',
	LISTS_INDEXOF_LAST: 'znajdź ostatnie wystąpienie elementu',
	LISTS_GET_INDEX_GET: 'pobierz',
	LISTS_GET_INDEX_REMOVE: 'usuń',
	LISTS_GET_INDEX_FROM_START: '#',
	LISTS_GET_INDEX_FROM_END: '# od końca',
	LISTS_GET_INDEX_FIRST: 'pierwszy',
	LISTS_GET_INDEX_LAST: 'ostatni',
	LISTS_GET_INDEX_RANDOM: 'losowy',
	LISTS_CREATE_WITH_TOOLTIP: 'Utwórz listę z dowolną liczbą elementów.',
	LISTS_CREATE_EMPTY_TOOLTIP: 'Zwraca listę o długości 0, nie zawierającą żadnych danych',
	LISTS_LENGTH_TOOLTIP: 'Zwraca długość listy.',
	LISTS_ISEMPTY_TOOLTIP: 'Zwraca prawdę, jeśli lista jest pusta.',

	// Variables
	VARIABLES_SET: 'ustaw %1 na %2',
	VARIABLES_GET: '%1',
	VARIABLES_DEFAULT_NAME: 'element',

	// If conditions
	CONTROLS_IF_TOOLTIP_1: 'Jeśli wartość jest prawdą, wykonaj instrukcje.',
	CONTROLS_IF_TOOLTIP_2: 'Jeśli wartość jest prawdą, wykonaj pierwszy blok instrukcji. W przeciwnym razie wykonaj drugi blok instrukcji.',
	CONTROLS_IF_TOOLTIP_3:
		'Jeśli pierwsza wartość jest prawdą, wykonaj pierwszy blok instrukcji. W przeciwnym razie, jeśli druga wartość jest prawdą, wykonaj drugi blok instrukcji.',
	CONTROLS_IF_TOOLTIP_4:
		'Jeśli pierwsza wartość jest prawdą, wykonaj pierwszy blok instrukcji. W przeciwnym razie, jeśli druga wartość jest prawdą, wykonaj drugi blok instrukcji. Jeśli żadna z wartości nie jest prawdą, wykonaj ostatni blok instrukcji.',

	// Procedures
	PROCEDURES_DEFNORETURN_TITLE: '',
	PROCEDURES_DEFNORETURN_PROCEDURE: 'wykonaj coś',
	PROCEDURES_BEFORE_PARAMS: 'z:',
	PROCEDURES_CALL_BEFORE_PARAMS: 'z:',
	PROCEDURES_DEFNORETURN_DO: '',
	PROCEDURES_DEFNORETURN_TOOLTIP: 'Tworzy funkcję bez wyniku.',
	PROCEDURES_DEFRETURN_RETURN: 'zwróć',
	PROCEDURES_DEFRETURN_TOOLTIP: 'Tworzy funkcję z wynikiem.',
	PROCEDURES_DEFRETURN_COMMENT: 'Opisz tę funkcję...',
	PROCEDURES_DEFRETURN_PROCEDURE: 'wykonaj coś ze zwrotem',
	PROCEDURES_DEFRETURN_DO: '',
	PROCEDURES_CALLNORETURN_HELPURL: 'https://pl.wikipedia.org/wiki/Podprogram',
	PROCEDURES_CALLNORETURN_TOOLTIP: 'Uruchom zdefiniowaną przez użytkownika funkcję.',
	PROCEDURES_CALLRETURN_HELPURL: 'https://pl.wikipedia.org/wiki/Podprogram',
	PROCEDURES_CALLRETURN_TOOLTIP: 'Uruchom zdefiniowaną przez użytkownika funkcję i użyj jej wyniku.',

	// Seven Segment Display
	SEVEN_SEGMENT_DISPLAY: 'Wyświetlacz siedmiosegmentowy',
	SEVEN_SEGMENT_COMMON_CATHODE: 'Wspólna katoda',
	SEVEN_SEGMENT_COMMON_ANODE: 'Wspólna anoda',
	SEVEN_SEGMENT_NUMBER: 'Liczba (0-9):',
	SEVEN_SEGMENT_DECIMAL_POINT: 'Kropka dziesiętna',
	SEVEN_SEGMENT_TOOLTIP: 'Wyświetl liczbę (0-9) na wyświetlaczu siedmiosegmentowym z opcjonalną kropką dziesiętną.',
	// Seven Segment Display Pins
	SEVEN_SEGMENT_PINS_SET: 'Ustaw piny wyświetlacza siedmiosegmentowego',
	SEVEN_SEGMENT_PINS_TOOLTIP: 'Skonfiguruj piny dla każdego segmentu (A-G) i kropki dziesiętnej (DP) wyświetlacza siedmiosegmentowego.',
});
