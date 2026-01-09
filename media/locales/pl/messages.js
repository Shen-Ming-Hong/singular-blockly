/**
 * @license
 * Copyright 2025 Singular Blockly Contributors
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
	REFRESH_BUTTON_TITLE: 'Odśwież kod',
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
	// Block Search UI
	FUNCTION_SEARCH_TITLE: 'Szukaj Bloków',
	FUNCTION_SEARCH_BUTTON_TITLE: 'Szukaj Bloków',
	FUNCTION_SEARCH_PLACEHOLDER: 'Wprowadź nazwę bloku lub parametry...',
	FUNCTION_SEARCH_BTN: 'Szukaj',
	FUNCTION_SEARCH_PREV: 'Poprzedni',
	FUNCTION_SEARCH_NEXT: 'Następny',
	FUNCTION_SEARCH_EMPTY: 'Jeszcze nie wyszukiwano',
	FUNCTION_SEARCH_NO_RESULTS: 'Nie znaleziono pasujących bloków',
	FUNCTION_RESULT_PREFIX: 'Blok: ',
	FUNCTION_KEYBOARD_SHORTCUT_TIP: '(Skrót: Ctrl+F)',
	FUNCTION_SEARCH_HISTORY_TITLE: 'Historia wyszukiwania',

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
	VISION_SENSORS_CATEGORY: 'Czujniki Wizyjne',
	// Servo Block Labels
	SERVO_SETUP: 'Konfiguracja Serwa',
	SERVO_PIN: 'Pin',
	SERVO_SETUP_TOOLTIP: 'Zadeklaruj zmienną serwa i ustaw pin',
	SERVO_MOVE: 'Obróć Serwo',
	SERVO_ANGLE: 'Kąt',
	SERVO_MOVE_TOOLTIP: 'Obróć serwo do określonego kąta',
	SERVO_STOP: 'Zatrzymaj Serwo',
	SERVO_STOP_TOOLTIP: 'Zatrzymaj sygnał wyjściowy serwa',

	// Encoder Motor Control
	ENCODER_SETUP: 'Konfiguruj Silnik Enkodera',
	ENCODER_NAME: 'Nazwa',
	ENCODER_PIN_A: 'Pin A',
	ENCODER_PIN_B: 'Pin B',
	ENCODER_USE_INTERRUPT: 'Użyj Przerwania',
	ENCODER_SETUP_TOOLTIP: 'Konfiguruj silnik enkodera z nazwą i konfiguracjami pinów',
	ENCODER_READ: 'Odczytaj Enkoder',
	ENCODER_READ_TOOLTIP: 'Pobierz aktualną pozycję enkodera',
	ENCODER_RESET: 'Resetuj Enkoder',
	ENCODER_RESET_TOOLTIP: 'Resetuj pozycję enkodera do zera',
	ENCODER_PID_SETUP: 'Konfiguruj Sterowanie PID',
	ENCODER_PID_MOTOR: 'Silnik',
	ENCODER_PID_KP: 'Kp',
	ENCODER_PID_KI: 'Ki',
	ENCODER_PID_KD: 'Kd',
	ENCODER_PID_MODE: 'Tryb',
	ENCODER_PID_MODE_POSITION: 'Pozycja',
	ENCODER_PID_MODE_SPEED: 'Prędkość',
	ENCODER_PID_SETUP_TOOLTIP: 'Konfiguruj sterowanie PID dla precyzyjnej kontroli silnika. Wybierz tryb pozycji lub prędkości.',
	ENCODER_PID_COMPUTE: 'Oblicz PID',
	ENCODER_PID_TARGET: 'Cel',
	ENCODER_PID_COMPUTE_TOOLTIP: 'Oblicz wyjście sterowania PID na podstawie pozycji docelowej',
	ENCODER_PID_RESET: 'Zresetuj PID',
	ENCODER_PID_RESET_TOOLTIP: 'Zresetuj stan regulatora PID (wyczyść akumulację całki, zresetuj licznik)',

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
	// Pixetto Smart Camera
	PIXETTO_INIT: 'Inicjalizuj inteligentną kamerę Pixetto',
	PIXETTO_RX_PIN: 'Pin RX',
	PIXETTO_TX_PIN: 'Pin TX',
	PIXETTO_IS_DETECTED: 'Pixetto Obiekt Wykryty',
	PIXETTO_GET_TYPE_ID: 'Pixetto Pobierz ID Typu',
	PIXETTO_GET_FUNC_ID: 'Pixetto Pobierz ID Funkcji',
	PIXETTO_COLOR_DETECT: 'Pixetto wykrywanie koloru',
	PIXETTO_SHAPE_DETECT: 'Pixetto wykrywanie kształtu',
	PIXETTO_FACE_DETECT: 'Pixetto wykrywanie twarzy',
	PIXETTO_APRILTAG_DETECT: 'Pixetto wykrywanie AprilTag',
	PIXETTO_NEURAL_NETWORK: 'Pixetto rozpoznawanie sieci neuronowej',
	PIXETTO_HANDWRITTEN_DIGIT: 'Pixetto rozpoznawanie cyfry pisanej odręcznie',
	PIXETTO_GET_POSITION: 'Pixetto pobierz wykryty obiekt',
	PIXETTO_ROAD_DETECT: 'Pixetto wykrywanie dróg',
	PIXETTO_SET_MODE: 'Ustaw tryb funkcjonalny Pixetto',
	PIXETTO_COLOR: 'Kolor',
	PIXETTO_SHAPE: 'Kształt',
	PIXETTO_MODE: 'Tryb',
	PIXETTO_TAG_ID: 'ID znacznika',
	PIXETTO_CLASS_ID: 'ID klasy',
	PIXETTO_DIGIT: 'Cyfra',
	PIXETTO_COORDINATE: 'Współrzędna',
	PIXETTO_ROAD_INFO: 'Informacja', // Vision Sensors Category Labels
	PIXETTO_LABEL: 'Pixetto',
	HUSKYLENS_LABEL: 'HUSKYLENS',
	// HUSKYLENS Inteligentna Kamera
	HUSKYLENS_INIT_I2C: 'Inicjalizuj HUSKYLENS (I2C)',
	HUSKYLENS_INIT_UART: 'Inicjalizuj HUSKYLENS (UART)',
	HUSKYLENS_RX_PIN: 'Połącz z HuskyLens TX →',
	HUSKYLENS_TX_PIN: 'Połącz z HuskyLens RX →',
	HUSKYLENS_SET_ALGORITHM: 'Ustaw algorytm HUSKYLENS na',
	HUSKYLENS_ALGORITHM_FACE_RECOGNITION: 'Rozpoznawanie twarzy',
	HUSKYLENS_ALGORITHM_OBJECT_TRACKING: 'Śledzenie obiektów',
	HUSKYLENS_ALGORITHM_OBJECT_RECOGNITION: 'Rozpoznawanie obiektów',
	HUSKYLENS_ALGORITHM_LINE_TRACKING: 'Śledzenie linii',
	HUSKYLENS_ALGORITHM_COLOR_RECOGNITION: 'Rozpoznawanie kolorów',
	HUSKYLENS_ALGORITHM_TAG_RECOGNITION: 'Rozpoznawanie tagów',
	HUSKYLENS_ALGORITHM_OBJECT_CLASSIFICATION: 'Klasyfikacja obiektów',
	HUSKYLENS_REQUEST: 'Żądaj wyniku rozpoznawania HUSKYLENS',
	HUSKYLENS_IS_LEARNED: 'HUSKYLENS nauczył się obiektów',
	HUSKYLENS_COUNT_BLOCKS: 'Liczba wykrytych bloków HUSKYLENS',
	HUSKYLENS_COUNT_ARROWS: 'Liczba wykrytych strzałek HUSKYLENS',
	HUSKYLENS_GET_BLOCK_INFO: 'Pobierz blok',
	HUSKYLENS_GET_ARROW_INFO: 'Pobierz strzałkę',
	HUSKYLENS_BLOCK_INFO_TYPE: ' ',
	HUSKYLENS_ARROW_INFO_TYPE: ' ',
	HUSKYLENS_X_CENTER: 'Centrum X',
	HUSKYLENS_Y_CENTER: 'Centrum Y',
	HUSKYLENS_WIDTH: 'Szerokość',
	HUSKYLENS_HEIGHT: 'Wysokość',
	HUSKYLENS_ID: 'ID',
	HUSKYLENS_X_ORIGIN: 'X początek',
	HUSKYLENS_Y_ORIGIN: 'Y początek',
	HUSKYLENS_X_TARGET: 'X cel',
	HUSKYLENS_Y_TARGET: 'Y cel',
	HUSKYLENS_LEARN: 'Pozwól HUSKYLENS nauczyć się ID',
	HUSKYLENS_FORGET: 'Pozwól HUSKYLENS zapomnieć wszystko wyuczone',

	// Pixetto Tooltips
	PIXETTO_INIT_TOOLTIP: 'Inicjalizuj inteligentną kamerę Pixetto i ustaw piny komunikacji UART',
	PIXETTO_IS_DETECTED_TOOLTIP: 'Wykryj, czy Pixetto wykrywa jakiś obiekt',
	PIXETTO_GET_TYPE_ID_TOOLTIP: 'Pobierz ID typu obiektu wykrytego przez Pixetto (kolor, kształt itp.)',
	PIXETTO_GET_FUNC_ID_TOOLTIP: 'Pobierz ID funkcji aktualnie używanej przez Pixetto (wykrywanie koloru, kształtu itp.)',
	PIXETTO_COLOR_DETECT_TOOLTIP: 'Wykryj, czy Pixetto wykrywa obiekt o określonym kolorze',
	PIXETTO_SHAPE_DETECT_TOOLTIP: 'Wykryj, czy Pixetto wykrywa obiekt o określonym kształcie',
	PIXETTO_FACE_DETECT_TOOLTIP: 'Wykryj, czy Pixetto wykrywa twarz',
	PIXETTO_APRILTAG_DETECT_TOOLTIP: 'Wykryj, czy Pixetto wykrywa AprilTag o określonym ID',
	PIXETTO_NEURAL_NETWORK_TOOLTIP: 'Wykryj, czy sieć neuronowa Pixetto rozpoznaje obiekt określonej klasy',
	PIXETTO_HANDWRITTEN_DIGIT_TOOLTIP: 'Wykryj, czy Pixetto rozpoznaje określoną cyfrę pisaną odręcznie',
	PIXETTO_GET_POSITION_TOOLTIP: 'Pobierz informacje o pozycji lub rozmiarze obiektu wykrytego przez Pixetto',
	PIXETTO_ROAD_DETECT_TOOLTIP: 'Pobierz informacje związane z wykrywaniem dróg z Pixetto',
	PIXETTO_SET_MODE_TOOLTIP: 'Ustaw tryb funkcjonalny inteligentnej kamery Pixetto',

	// Pixetto Color Options
	PIXETTO_COLOR_RED: 'Czerwony',
	PIXETTO_COLOR_BLUE: 'Niebieski',
	PIXETTO_COLOR_GREEN: 'Zielony',
	PIXETTO_COLOR_YELLOW: 'Żółty',
	PIXETTO_COLOR_ORANGE: 'Pomarańczowy',
	PIXETTO_COLOR_PURPLE: 'Fioletowy',
	PIXETTO_COLOR_BLACK: 'Czarny',
	PIXETTO_COLOR_WHITE: 'Biały',

	// Pixetto Shape Options
	PIXETTO_SHAPE_TRIANGLE: 'Trójkąt',
	PIXETTO_SHAPE_RECTANGLE: 'Prostokąt',
	PIXETTO_SHAPE_PENTAGON: 'Pięciokąt',
	PIXETTO_SHAPE_HEXAGON: 'Sześciokąt',
	PIXETTO_SHAPE_CIRCLE: 'Koło',

	// Pixetto Position Options
	PIXETTO_POSITION_X: 'Współrzędna X',
	PIXETTO_POSITION_Y: 'Współrzędna Y',
	PIXETTO_POSITION_WIDTH: 'Szerokość',
	PIXETTO_POSITION_HEIGHT: 'Wysokość',

	// Pixetto Road Info Options
	PIXETTO_ROAD_CENTER_X: 'Środek X',
	PIXETTO_ROAD_CENTER_Y: 'Środek Y',
	PIXETTO_ROAD_LEFT_X: 'Lewa granica X',
	PIXETTO_ROAD_RIGHT_X: 'Prawa granica X',

	// Pixetto Mode Options
	PIXETTO_MODE_COLOR_DETECTION: 'Wykrywanie koloru',
	PIXETTO_MODE_SHAPE_DETECTION: 'Wykrywanie kształtu',
	PIXETTO_MODE_FACE_DETECTION: 'Wykrywanie twarzy',
	PIXETTO_MODE_APRILTAG_DETECTION: 'Wykrywanie AprilTag',
	PIXETTO_MODE_NEURAL_NETWORK: 'Sieć neuronowa',
	PIXETTO_MODE_HANDWRITTEN_DIGIT: 'Cyfra pisana odręcznie',
	PIXETTO_MODE_ROAD_DETECTION: 'Wykrywanie dróg',
	PIXETTO_MODE_BALL_DETECTION: 'Wykrywanie piłki',
	PIXETTO_MODE_TEMPLATE_MATCHING: 'Dopasowywanie szablonów',

	// HUSKYLENS Tooltips
	HUSKYLENS_INIT_I2C_TOOLTIP: 'Inicjalizuj inteligentną kamerę HUSKYLENS używając I2C',
	HUSKYLENS_INIT_UART_TOOLTIP: 'Inicjalizuj inteligentną kamerę HUSKYLENS używając UART, ustaw piny RX/TX',
	HUSKYLENS_SET_ALGORITHM_TOOLTIP: 'Ustaw algorytm rozpoznawania używany przez HUSKYLENS',
	HUSKYLENS_REQUEST_TOOLTIP: 'Żądaj najnowszych wyników rozpoznawania od HUSKYLENS',
	HUSKYLENS_IS_LEARNED_TOOLTIP: 'Sprawdź, czy HUSKYLENS nauczył się jakichś obiektów',
	HUSKYLENS_COUNT_BLOCKS_TOOLTIP: 'Pobierz liczbę bloków wykrytych przez HUSKYLENS',
	HUSKYLENS_COUNT_ARROWS_TOOLTIP: 'Pobierz liczbę strzałek wykrytych przez HUSKYLENS',
	HUSKYLENS_GET_BLOCK_INFO_TOOLTIP: 'Pobierz informacje określonego bloku (pozycja, rozmiar lub ID)',
	HUSKYLENS_GET_ARROW_INFO_TOOLTIP: 'Pobierz informacje o określonej strzałce (początek, cel lub ID)',
	HUSKYLENS_LEARN_TOOLTIP: 'Pozwól HUSKYLENS nauczyć się obiektu o określonym ID (tylko dla trybu Klasyfikacji Obiektów)',
	HUSKYLENS_FORGET_TOOLTIP: 'Wyczyść wszystkie wyuczone obiekty z HUSKYLENS (tylko dla trybu Klasyfikacji Obiektów)',
	HUSKYLENS_I2C_PIN_HINT: 'Okablowanie: ',
	HUSKYLENS_UART_PIN_HINT: 'Zalecane piny: ',
	HUSKYLENS_UART_ANY_DIGITAL: 'Dowolny pin cyfrowy',
	// ESP32 PWM Setup
	ESP32_PWM_SETUP: 'Konfiguracja PWM ESP32',
	ESP32_PWM_FREQUENCY: 'Częstotliwość',
	ESP32_PWM_RESOLUTION: 'Rozdzielczość',
	ESP32_PWM_FREQUENCY_TOOLTIP:
		'Ustaw częstotliwość PWM, zakres 1-80000 Hz. Wysoka częstotliwość dla układów sterowników silnika (20-75KHz)',
	ESP32_PWM_RESOLUTION_TOOLTIP:
		'Ustaw rozdzielczość PWM, wpływa na precyzję wyjścia. Uwaga: częstotliwość × 2^rozdzielczość ≤ 80 000 000',
	ESP32_PWM_RESOLUTION_8BIT: '8 bitów (0-255)',
	ESP32_PWM_RESOLUTION_10BIT: '10 bitów (0-1023)',
	ESP32_PWM_RESOLUTION_12BIT: '12 bitów (0-4095)',
	ESP32_PWM_RESOLUTION_13BIT: '13 bitów (0-8191)',
	ESP32_PWM_RESOLUTION_14BIT: '14 bitów (0-16383)',
	ESP32_PWM_RESOLUTION_15BIT: '15 bitów (0-32767)',
	ESP32_PWM_RESOLUTION_16BIT: '16 bitów (0-65535)',
	// Safety Guard (Project Safety Protection)
	SAFETY_WARNING_BODY_NO_TYPE:
		'Ten projekt nie ma jeszcze bloków Blockly. Jeśli kontynuujesz, folder i pliki blockly zostaną utworzone tutaj. Czy chcesz kontynuować?',
	SAFETY_WARNING_BODY_WITH_TYPE:
		'Wykryto projekt {0}. Ten projekt nie ma jeszcze bloków Blockly. Jeśli kontynuujesz, folder i pliki blockly zostaną utworzone tutaj. Czy chcesz kontynuować?',
	BUTTON_CONTINUE: 'Kontynuuj',
	BUTTON_CANCEL: 'Anuluj',
	BUTTON_SUPPRESS: 'Nie przypominaj',
	SAFETY_GUARD_CANCELLED: 'Anulowano otwieranie edytora Blockly',
	SAFETY_GUARD_SUPPRESSED: 'Zapisano preferencje, to ostrzeżenie nie będzie już wyświetlane',

	// Communication Category
	CATEGORY_COMMUNICATION: 'Komunikacja',

	// ESP32 WiFi
	ESP32_WIFI_LABEL: 'WiFi',
	ESP32_WIFI_CONNECT: 'Połącz WiFi',
	ESP32_WIFI_CONNECT_SSID: 'SSID',
	ESP32_WIFI_CONNECT_PASSWORD: 'Hasło',
	ESP32_WIFI_CONNECT_TOOLTIP: 'Połącz ESP32 z siecią WiFi przy użyciu podanego SSID i hasła',
	ESP32_WIFI_DISCONNECT: 'Rozłącz WiFi',
	ESP32_WIFI_DISCONNECT_TOOLTIP: 'Rozłącz ESP32 z sieci WiFi',
	ESP32_WIFI_STATUS: 'Stan WiFi',
	ESP32_WIFI_STATUS_TOOLTIP: 'Sprawdź, czy ESP32 jest połączone z siecią WiFi',
	ESP32_WIFI_GET_IP: 'Pobierz adres IP WiFi',
	ESP32_WIFI_GET_IP_TOOLTIP: 'Pobierz lokalny adres IP ESP32 jako ciąg znaków',
	ESP32_WIFI_SCAN: 'Skanuj sieci WiFi',
	ESP32_WIFI_SCAN_TOOLTIP: 'Skanuj dostępne sieci WiFi i zwróć liczbę znalezionych sieci',
	ESP32_WIFI_GET_SSID: 'Pobierz SSID sieci',
	ESP32_WIFI_GET_SSID_INDEX: 'indeks',
	ESP32_WIFI_GET_SSID_TOOLTIP: 'Pobierz nazwę SSID sieci WiFi o podanym indeksie',
	ESP32_WIFI_GET_RSSI: 'Pobierz RSSI sieci',
	ESP32_WIFI_GET_RSSI_INDEX: 'indeks',
	ESP32_WIFI_GET_RSSI_TOOLTIP: 'Pobierz siłę sygnału (RSSI) sieci WiFi o podanym indeksie',

	// ESP32 MQTT
	ESP32_MQTT_LABEL: 'MQTT',
	ESP32_MQTT_SETUP: 'Konfiguracja MQTT',
	ESP32_MQTT_SETUP_SERVER: 'Serwer',
	ESP32_MQTT_SETUP_PORT: 'Port',
	ESP32_MQTT_SETUP_CLIENT_ID: 'ID klienta',
	ESP32_MQTT_SETUP_TOOLTIP: 'Skonfiguruj klienta MQTT z adresem serwera, portem i ID klienta',
	ESP32_MQTT_CONNECT: 'Połącz MQTT',
	ESP32_MQTT_CONNECT_USERNAME: 'Użytkownik',
	ESP32_MQTT_CONNECT_PASSWORD: 'Hasło',
	ESP32_MQTT_CONNECT_TOOLTIP: 'Połącz z brokerem MQTT z opcjonalną nazwą użytkownika i hasłem',
	ESP32_MQTT_PUBLISH: 'Publikuj MQTT',
	ESP32_MQTT_PUBLISH_TOPIC: 'Temat',
	ESP32_MQTT_PUBLISH_MESSAGE: 'Wiadomość',
	ESP32_MQTT_PUBLISH_TOOLTIP: 'Opublikuj wiadomość do tematu MQTT',
	ESP32_MQTT_SUBSCRIBE: 'Subskrybuj MQTT',
	ESP32_MQTT_SUBSCRIBE_TOPIC: 'Temat',
	ESP32_MQTT_SUBSCRIBE_TOOLTIP: 'Subskrybuj temat MQTT, aby otrzymywać wiadomości',
	ESP32_MQTT_LOOP: 'Pętla MQTT',
	ESP32_MQTT_LOOP_TOOLTIP: 'Przetwarzaj przychodzące wiadomości MQTT (wywołuj w głównej pętli)',
	ESP32_MQTT_GET_TOPIC: 'Pobierz temat MQTT',
	ESP32_MQTT_GET_TOPIC_TOOLTIP: 'Pobierz temat ostatnio otrzymanej wiadomości MQTT',
	ESP32_MQTT_GET_MESSAGE: 'Pobierz wiadomość MQTT',
	ESP32_MQTT_GET_MESSAGE_TOOLTIP: 'Pobierz zawartość ostatnio otrzymanej wiadomości MQTT',
	ESP32_MQTT_STATUS: 'MQTT Połączony',
	ESP32_MQTT_STATUS_TOOLTIP: 'Sprawdź czy połączony z serwerem MQTT',

	// Text to Number
	TEXT_TO_NUMBER: 'Tekst na liczbę',
	TEXT_TO_NUMBER_INT: 'całkowita',
	TEXT_TO_NUMBER_FLOAT: 'zmiennoprzecinkowa',
	TEXT_TO_NUMBER_TOOLTIP: 'Konwertuj tekst na liczbę (całkowitą lub zmiennoprzecinkową)',

	// To String Block
	TO_STRING: 'Na tekst',
	TO_STRING_TOOLTIP: 'Konwertuj liczbę lub wartość logiczną na tekst',

	// ESP32 Only Block Warning
	ESP32_ONLY_BLOCK_WARNING: 'Ten blok obsługuje tylko płytki ESP32',

	// Quick Backup Toast Messages
	BACKUP_QUICK_SAVE_SUCCESS: 'Kopia zapasowa zapisana: {0}',
	BACKUP_QUICK_SAVE_EMPTY: 'Obszar roboczy jest pusty, kopia zapasowa nie jest potrzebna',
	BACKUP_QUICK_SAVE_COOLDOWN: 'Proszę czekać, kopia zapasowa właśnie została ukończona',

	// Board Switch Warning
	BOARD_SWITCH_WARNING_TITLE: 'Zmień typ płytki',
	BOARD_SWITCH_WARNING_MESSAGE:
		'Przełączenie na inny typ płytki spowoduje wyczyszczenie bieżącego obszaru roboczego.\nTwoja praca zostanie najpierw automatycznie zapisana.\n\nCzy chcesz kontynuować?',

	// CyberBrick Board
	BOARD_CYBERBRICK: 'CyberBrick',

	// CyberBrick Category
	CATEGORY_CYBERBRICK_CORE: 'CyberBrick',
	CATEGORY_CYBERBRICK_LED: 'LED',
	CATEGORY_CYBERBRICK_GPIO: 'GPIO',
	CATEGORY_CYBERBRICK_TIME: 'Czas',

	// CyberBrick Main Block
	CYBERBRICK_MAIN: 'Program główny',
	CYBERBRICK_MAIN_TOOLTIP: 'Punkt wejścia głównego programu CyberBrick. Cały kod powinien być umieszczony w tym bloku.',

	// CyberBrick LED Blocks
	CYBERBRICK_LED_SET_COLOR: 'Ustaw kolor LED',
	CYBERBRICK_LED_SET_COLOR_PREFIX: 'Ustaw kolor wbudowanego LED',
	CYBERBRICK_LED_RED: 'Czerwony',
	CYBERBRICK_LED_GREEN: 'Zielony',
	CYBERBRICK_LED_BLUE: 'Niebieski',
	CYBERBRICK_LED_SET_COLOR_TOOLTIP: 'Ustaw kolor wbudowanego LED (GPIO8) używając wartości RGB (0-255)',
	CYBERBRICK_LED_OFF: 'Wyłącz LED',
	CYBERBRICK_LED_OFF_TOOLTIP: 'Wyłącz wbudowany LED',

	// CyberBrick GPIO Blocks
	CYBERBRICK_GPIO_SET: 'Ustaw GPIO',
	CYBERBRICK_GPIO_SET_PREFIX: 'GPIO',
	CYBERBRICK_GPIO_SET_TO: 'na',
	CYBERBRICK_GPIO_PIN: 'Pin',
	CYBERBRICK_GPIO_VALUE: 'Wartość',
	CYBERBRICK_GPIO_HIGH: 'WYSOKI',
	CYBERBRICK_GPIO_LOW: 'NISKI',
	CYBERBRICK_GPIO_SET_TOOLTIP: 'Ustaw pin GPIO na WYSOKI lub NISKI',
	CYBERBRICK_GPIO_READ: 'Odczytaj GPIO',
	CYBERBRICK_GPIO_READ_TOOLTIP: 'Odczytaj wartość cyfrową z pinu GPIO (zwraca 0 lub 1)',

	// CyberBrick Time Blocks
	CYBERBRICK_DELAY_MS: 'Opóźnienie (ms)',
	CYBERBRICK_DELAY_MS_PREFIX: 'Opóźnienie',
	CYBERBRICK_DELAY_MS_SUFFIX: 'ms',
	CYBERBRICK_DELAY_MS_TOOLTIP: 'Wstrzymaj wykonywanie programu na określoną liczbę milisekund',
	CYBERBRICK_DELAY_S: 'Opóźnienie (s)',
	CYBERBRICK_DELAY_S_PREFIX: 'Opóźnienie',
	CYBERBRICK_DELAY_S_SUFFIX: 'sekund',
	CYBERBRICK_DELAY_S_TOOLTIP: 'Wstrzymaj wykonywanie programu na określoną liczbę sekund',

	// CyberBrick WiFi Blocks
	CATEGORY_CYBERBRICK_WIFI: 'WiFi',
	CYBERBRICK_WIFI_CONNECT: 'Połącz WiFi',
	CYBERBRICK_WIFI_SSID: 'SSID',
	CYBERBRICK_WIFI_PASSWORD: 'Hasło',
	CYBERBRICK_WIFI_CONNECT_TOOLTIP: 'Połącz z określoną siecią WiFi',
	CYBERBRICK_WIFI_DISCONNECT: 'Rozłącz WiFi',
	CYBERBRICK_WIFI_DISCONNECT_TOOLTIP: 'Rozłącz z bieżącą siecią WiFi',
	CYBERBRICK_WIFI_IS_CONNECTED: 'WiFi połączone?',
	CYBERBRICK_WIFI_IS_CONNECTED_TOOLTIP: 'Sprawdź czy WiFi jest połączone',
	CYBERBRICK_WIFI_GET_IP: 'Pobierz adres IP',
	CYBERBRICK_WIFI_GET_IP_TOOLTIP: 'Pobierz bieżący adres IP',

	// CyberBrick Upload
	UPLOAD_BUTTON_TITLE: 'Prześlij do CyberBrick',
	UPLOAD_BUTTON_DISABLED_TITLE: 'Najpierw zapisz obszar roboczy, aby włączyć przesyłanie',
	UPLOAD_STARTING: 'Rozpoczynanie przesyłania...',
	UPLOAD_SUCCESS: 'Przesyłanie zakończone sukcesem!',
	UPLOAD_FAILED: 'Przesyłanie nie powiodło się: {0}',
	UPLOAD_NO_PORT: 'Nie znaleziono urządzenia CyberBrick',
	UPLOAD_IN_PROGRESS: 'Przesyłanie...',
	UPLOAD_EMPTY_WORKSPACE: 'Obszar roboczy jest pusty, najpierw dodaj bloki',
	UPLOAD_NO_CODE: 'Nie można wygenerować kodu',

	// Upload progress stages
	UPLOAD_STAGE_PREPARING: 'Przygotowanie',
	UPLOAD_STAGE_CHECKING: 'Sprawdzanie narzędzi',
	UPLOAD_STAGE_INSTALLING: 'Instalowanie narzędzi',
	UPLOAD_STAGE_CONNECTING: 'Łączenie z urządzeniem',
	UPLOAD_STAGE_RESETTING: 'Resetowanie urządzenia',
	UPLOAD_STAGE_BACKUP: 'Tworzenie kopii zapasowej',
	UPLOAD_STAGE_UPLOADING: 'Przesyłanie',
	UPLOAD_STAGE_RESTARTING: 'Restartowanie urządzenia',
	UPLOAD_STAGE_COMPLETED: 'Zakończono',

	// Upload error messages
	ERROR_UPLOAD_BOARD_UNSUPPORTED: 'Obsługiwana jest tylko płytka CyberBrick',
	ERROR_UPLOAD_CODE_EMPTY: 'Kod nie może być pusty',
	ERROR_UPLOAD_NO_PYTHON: 'Środowisko Python PlatformIO nie znalezione. Najpierw zainstaluj PlatformIO.',
	ERROR_UPLOAD_MPREMOTE_FAILED: 'Instalacja mpremote nie powiodła się',
	ERROR_UPLOAD_DEVICE_NOT_FOUND: 'Urządzenie CyberBrick nie znalezione. Upewnij się, że jest podłączone.',
	ERROR_UPLOAD_RESET_FAILED: 'Nie udało się zresetować urządzenia',
	ERROR_UPLOAD_UPLOAD_FAILED: 'Nie udało się przesłać programu',
	ERROR_UPLOAD_RESTART_FAILED: 'Nie udało się zrestartować urządzenia',

	// Arduino Upload Button
	UPLOAD_BUTTON_TITLE_ARDUINO: 'Kompiluj i Wgraj',
	UPLOAD_SELECT_BOARD: 'Najpierw wybierz płytkę',

	// Arduino Upload Stages
	ARDUINO_STAGE_SYNCING: 'Synchronizacja ustawień',
	ARDUINO_STAGE_SAVING: 'Zapisywanie obszaru roboczego',
	ARDUINO_STAGE_CHECKING: 'Sprawdzanie kompilatora',
	ARDUINO_STAGE_DETECTING: 'Wykrywanie płytki',
	ARDUINO_STAGE_COMPILING: 'Kompilacja',
	ARDUINO_STAGE_UPLOADING: 'Wgrywanie',

	// Arduino Upload Results
	ARDUINO_COMPILE_SUCCESS: 'Kompilacja ukończona!',
	ARDUINO_UPLOAD_SUCCESS: 'Wgrywanie ukończone!',

	// Arduino Upload Errors
	ERROR_ARDUINO_PIO_NOT_FOUND: 'Nie znaleziono PlatformIO CLI. Najpierw zainstaluj PlatformIO.',
	ERROR_ARDUINO_COMPILE_FAILED: 'Kompilacja nie powiodła się',
	ERROR_ARDUINO_UPLOAD_FAILED: 'Wgrywanie nie powiodło się',
	ERROR_ARDUINO_NO_WORKSPACE: 'Najpierw otwórz folder projektu',
	ERROR_ARDUINO_TIMEOUT: 'Przekroczono limit czasu operacji',
	ERROR_ARDUINO_DEVICE_DISCONNECT: 'Urządzenie zostało odłączone',

	// Backup messages
	BACKUP_CONFIRM_DELETE: 'Czy na pewno chcesz usunąć kopię zapasową "{0}"?',
	BACKUP_CONFIRM_RESTORE: 'Czy na pewno chcesz przywrócić kopię zapasową "{0}"? To nadpisze bieżący obszar roboczy.',
	BACKUP_ERROR_NOT_FOUND: 'Kopia zapasowa "{0}" nie została znaleziona',
	BACKUP_ERROR_CREATE_FAILED: 'Nie udało się utworzyć kopii zapasowej: {0}',
	BACKUP_ERROR_DELETE_FAILED: 'Nie udało się usunąć kopii zapasowej: {0}',
	BACKUP_ERROR_RESTORE_FAILED: 'Nie udało się przywrócić kopii zapasowej: {0}',
	BACKUP_ERROR_PREVIEW_FAILED: 'Nie udało się wyświetlić podglądu kopii zapasowej: {0}',
	BACKUP_ERROR_NAME_NOT_SPECIFIED: 'Nie podano nazwy kopii zapasowej',
	BACKUP_ERROR_MAIN_NOT_FOUND: 'Nie można znaleźć pliku main.json',
	BACKUP_ERROR_UPDATE_SETTINGS_FAILED: 'Nie udało się zaktualizować ustawień automatycznego tworzenia kopii zapasowych',

	// Button labels
	BUTTON_DELETE: 'Usuń',
	BUTTON_RESTORE: 'Przywróć',

	// Error messages
	ERROR_PROCESSING_MESSAGE: 'Błąd podczas przetwarzania wiadomości: {0}',
	ERROR_SETTINGS_UPDATE_FAILED: 'Nie udało się zaktualizować ustawień',
	ERROR_RELOAD_WORKSPACE_FAILED: 'Nie udało się ponownie załadować obszaru roboczego: {0}',
	ERROR_OPEN_PROJECT_FOLDER_FIRST: 'Najpierw otwórz folder projektu',

	// Info messages
	INFO_NO_BACKUPS_TO_PREVIEW: 'Brak plików kopii zapasowych do podglądu',

	// Dialog messages
	DIALOG_SELECT_BACKUP_TITLE: 'Wybierz plik kopii zapasowej do podglądu',
	DIALOG_BACKUP_FILES_LABEL: 'Pliki kopii zapasowych',

	// X11 Płytka rozszerzeń
	CATEGORY_X11: 'X11 Rozszerzenie',
	X11_LABEL_SERVOS: 'Serwomotory',
	X11_LABEL_MOTORS: 'Silniki',
	X11_LABEL_LEDS: 'LED',

	// X11 180° Serwo bloki
	X11_SERVO_180_ANGLE_PREFIX: 'Ustaw serwo',
	X11_SERVO_180_ANGLE_SUFFIX: 'kąt',
	X11_SERVO_180_ANGLE_TOOLTIP: 'Ustaw kąt serwa 180° (0-180 stopni)',

	// X11 360° Serwo bloki
	X11_SERVO_360_SPEED_PREFIX: 'Ustaw serwo',
	X11_SERVO_360_SPEED_SUFFIX: 'prędkość',
	X11_SERVO_360_SPEED_TOOLTIP: 'Ustaw prędkość serwa 360° ciągłego obrotu (-100 do 100, ujemna=wstecz)',

	// X11 Blok zatrzymania serwa
	X11_SERVO_STOP: 'Zatrzymaj serwo',
	X11_SERVO_STOP_TOOLTIP: 'Zatrzymaj określone serwo',

	// X11 Silnik bloki
	X11_MOTOR_SPEED_PREFIX: 'Ustaw silnik',
	X11_MOTOR_SPEED_SUFFIX: 'prędkość',
	X11_MOTOR_SPEED_TOOLTIP: 'Ustaw prędkość silnika DC (-2048 do 2048, ujemna=wstecz)',
	X11_MOTOR_STOP: 'Zatrzymaj silnik',
	X11_MOTOR_STOP_TOOLTIP: 'Zatrzymaj określony silnik',

	// X11 LED bloki
	X11_LED_SET_COLOR_PREFIX: 'Taśma LED',
	X11_LED_SET_COLOR_INDEX: 'indeks',
	X11_LED_SET_COLOR_INDEX_SUFFIX: 'ustaw kolor R',
	X11_LED_SET_COLOR_TOOLTIP: 'Ustaw kolor piksela taśmy LED (indeks 0=pierwszy piksel, lub wszystkie)',
	X11_LED_INDEX_ALL: 'Wszystkie',

	// === Płytka rozszerzeń X12 Nadajnik ===
	CATEGORY_X12: 'X12 Rozszerzenie',
	X12_LABEL_JOYSTICK: 'Joystick',
	X12_LABEL_BUTTON: 'Przycisk',

	// X12 Bloki joysticka
	X12_GET_JOYSTICK_PREFIX: 'Lokalny joystick',
	X12_GET_JOYSTICK_TOOLTIP: 'Odczytaj wartość ADC lokalnego joysticka nadajnika (0-4095)',
	X12_GET_JOYSTICK_MAPPED_PREFIX: 'Lokalny joystick',
	X12_GET_JOYSTICK_MAPPED_MIN: 'mapuj na',
	X12_GET_JOYSTICK_MAPPED_MAX: '~',
	X12_GET_JOYSTICK_MAPPED_TOOLTIP: 'Odczytaj lokalny joystick i mapuj na określony zakres',

	// X12 Bloki przycisków
	X12_IS_BUTTON_PRESSED_PREFIX: 'Lokalny przycisk',
	X12_IS_BUTTON_PRESSED_SUFFIX: 'wciśnięty?',
	X12_IS_BUTTON_PRESSED_TOOLTIP: 'Sprawdź czy lokalny przycisk nadajnika jest wciśnięty',

	// === Pilot RC ===

	// RC Bloki inicjalizacji

	// RC Bloki joysticka

	// RC Bloki przycisków

	// RC Bloki statusu
});
