/**
 * @license
 * Copyright 2025 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file contains translations derived from Blockly project
 * Copyright 2012 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

// Define translations for Czech
window.languageManager.loadMessages('cs', {
	// UI Elements
	BLOCKS_TAB: 'Bloky',
	CODE_TAB: 'Kód',
	BOARD_SELECT_LABEL: 'Vybrat desku:',
	LANGUAGE_SELECT_TOOLTIP: 'Vybrat jazyk',
	LANGUAGE_AUTO: 'Automaticky (podle VS Code)',

	// Experimental Blocks Notice
	EXPERIMENTAL_BLOCKS_TITLE: 'Nalezeny experimentální bloky',
	EXPERIMENTAL_BLOCKS_DESC:
		'Váš pracovní prostor obsahuje experimentální bloky (zvýrazněné žlutým přerušovaným okrajem). Tyto funkce se mohou v budoucích aktualizacích změnit nebo být odstraněny, používejte je s opatrností.',

	// Preview Mode UI
	PREVIEW_BADGE: 'Náhled',
	THEME_TOGGLE: 'Přepnout motiv',
	PREVIEW_WINDOW_TITLE: 'Blockly Náhled - {0}',
	PREVIEW_WINDOW_TITLE_WITH_NAME: 'Náhled - {0}',

	// Backup Modal UI
	BACKUP_MANAGER_TITLE: 'Správce záloh',
	BACKUP_CREATE_NEW: 'Vytvořit novou zálohu',
	BACKUP_NAME_LABEL: 'Název zálohy:',
	BACKUP_NAME_PLACEHOLDER: 'Zadejte název zálohy',
	BACKUP_CONFIRM: 'Potvrdit',
	BACKUP_CANCEL: 'Zrušit',
	BACKUP_LIST_TITLE: 'Seznam záloh',
	BACKUP_LIST_EMPTY: 'Žádné dostupné zálohy',
	BACKUP_BUTTON_TITLE: 'Správce záloh',
	REFRESH_BUTTON_TITLE: 'Obnovit kód',
	BACKUP_PREVIEW_BTN: 'Náhled',
	BACKUP_RESTORE_BTN: 'Obnovit',
	BACKUP_DELETE_BTN: 'Smazat',
	AUTO_BACKUP_TITLE: 'Nastavení automatického zálohování',
	AUTO_BACKUP_INTERVAL_LABEL: 'Interval zálohování:',
	AUTO_BACKUP_MINUTES: 'minut',
	AUTO_BACKUP_SAVE: 'Uložit nastavení',
	AUTO_BACKUP_SAVED: 'Nastavení automatického zálohování uloženo',
	AUTO_BACKUP_PREFIX: 'auto_',
	MANUAL_BACKUP_TITLE: 'Ruční zálohování',

	// Board Names
	BOARD_NONE: 'Žádná',
	BOARD_UNO: 'Arduino Uno',
	BOARD_NANO: 'Arduino Nano',
	BOARD_MEGA: 'Arduino Mega',
	BOARD_ESP32: 'ESP32',
	BOARD_SUPERMINI: 'Super Mini',
	// Block Search UI
	FUNCTION_SEARCH_TITLE: 'Hledat bloky',
	FUNCTION_SEARCH_BUTTON_TITLE: 'Hledat bloky',
	FUNCTION_SEARCH_PLACEHOLDER: 'Zadejte název bloku nebo parametry...',
	FUNCTION_SEARCH_BTN: 'Hledat',
	FUNCTION_SEARCH_PREV: 'Předchozí',
	FUNCTION_SEARCH_NEXT: 'Další',
	FUNCTION_SEARCH_EMPTY: 'Ještě nebylo vyhledáváno',
	FUNCTION_SEARCH_NO_RESULTS: 'Nebyly nalezeny žádné odpovídající bloky',
	FUNCTION_RESULT_PREFIX: 'Blok: ',
	FUNCTION_KEYBOARD_SHORTCUT_TIP: '(Zkratka: Ctrl+F)',
	FUNCTION_SEARCH_HISTORY_TITLE: 'Historie vyhledávání',

	// Block Categories
	CATEGORY_LOGIC: 'Logika',
	CATEGORY_LOOPS: 'Smyčky',
	CATEGORY_MATH: 'Matematika',
	CATEGORY_TEXT: 'Text',
	CATEGORY_LISTS: 'Seznamy',
	CATEGORY_VARIABLES: 'Proměnné',
	CATEGORY_FUNCTIONS: 'Funkce',
	CATEGORY_ARDUINO: 'Arduino',
	CATEGORY_SENSORS: 'Senzory',
	CATEGORY_MOTORS: 'Motory',
	VISION_SENSORS_CATEGORY: 'Vizuální Senzory',
	// Servo Block Labels
	SERVO_SETUP: 'Nastavení Servo Motoru',
	SERVO_PIN: 'Pin',
	SERVO_SETUP_TOOLTIP: 'Deklarovat proměnnou servo motoru a nastavit pin',
	SERVO_MOVE: 'Otočit Servo Motor',
	SERVO_ANGLE: 'Úhel',
	SERVO_MOVE_TOOLTIP: 'Otočit servo motor na specifický úhel',
	SERVO_STOP: 'Zastavit Servo Motor',
	SERVO_STOP_TOOLTIP: 'Zastavit výstupní signál servo motoru',

	// Encoder Motor Control
	ENCODER_SETUP: 'Nastavit Enkodérový Motor',
	ENCODER_NAME: 'Název',
	ENCODER_PIN_A: 'Pin A',
	ENCODER_PIN_B: 'Pin B',
	ENCODER_USE_INTERRUPT: 'Použít Přerušení',
	ENCODER_SETUP_TOOLTIP: 'Nastavit enkodérový motor s názvem a konfigurací pinů',
	ENCODER_READ: 'Číst Enkodér',
	ENCODER_READ_TOOLTIP: 'Získat aktuální pozici enkodéru',
	ENCODER_RESET: 'Resetovat Enkodér',
	ENCODER_RESET_TOOLTIP: 'Resetovat pozici enkodéru na nulu',
	ENCODER_PID_SETUP: 'Nastavit PID Řízení',
	ENCODER_PID_MOTOR: 'Motor',
	ENCODER_PID_KP: 'Kp',
	ENCODER_PID_KI: 'Ki',
	ENCODER_PID_KD: 'Kd',
	ENCODER_PID_MODE: 'Režim',
	ENCODER_PID_MODE_POSITION: 'Pozice',
	ENCODER_PID_MODE_SPEED: 'Rychlost',
	ENCODER_PID_SETUP_TOOLTIP: 'Nakonfigurovat PID řízení pro přesnou kontrolu motoru. Vyberte režim pro pozici nebo rychlost.',
	ENCODER_PID_COMPUTE: 'Vypočítat PID',
	ENCODER_PID_TARGET: 'Cíl',
	ENCODER_PID_COMPUTE_TOOLTIP: 'Vypočítat výstup PID řízení na základě cílové pozice',
	ENCODER_PID_RESET: 'Resetovat PID',
	ENCODER_PID_RESET_TOOLTIP: 'Resetovat stav PID regulátoru (vymazat integrální akumulaci, resetovat čítač)',

	// Arduino Block Labels
	ARDUINO_SETUP: 'Nastavení',
	ARDUINO_LOOP: 'Smyčka',
	ARDUINO_DIGITAL_WRITE: 'Digitální zápis',
	ARDUINO_DIGITAL_READ: 'Digitální čtení',
	ARDUINO_ANALOG_WRITE: 'Analogový zápis',
	ARDUINO_ANALOG_READ: 'Analogové čtení',
	ARDUINO_PIN: 'Pin',
	ARDUINO_VALUE: 'Hodnota',
	ARDUINO_DELAY: 'Zpoždění',
	ARDUINO_DELAY_MS: 'milisekund',
	ARDUINO_PULLUP: 'Povolit interní pull-up',
	ARDUINO_MODE: 'Režim',
	ARDUINO_MODE_INPUT: 'VSTUP',
	ARDUINO_MODE_OUTPUT: 'VÝSTUP',

	// Sensor Block Labels
	ULTRASONIC_SENSOR: 'Ultrazvukový senzor',
	ULTRASONIC_TRIG_PIN: 'Trig pin',
	ULTRASONIC_ECHO_PIN: 'Echo pin',
	ULTRASONIC_USE_INTERRUPT: 'Použít hardwarové přerušení',
	ULTRASONIC_READ: 'Čtení ultrazvukové vzdálenosti (cm)',
	ULTRASONIC_TOOLTIP_SETUP: 'Konfiguruje ultrazvukový senzor s Trig a Echo piny. Volitelné hardwarové přerušení pro vyšší přesnost.',
	ULTRASONIC_TOOLTIP_READ: 'Čte vzdálenost měřenou ultrazvukovým senzorem v centimetrech.',
	ULTRASONIC_WARNING: 'Vybraný Echo pin {0} nepodporuje hardwarové přerušení. Vyberte prosím jeden z těchto pinů: {1}',

	// Threshold Function Block Labels
	THRESHOLD_PIN: 'na',
	THRESHOLD_VALUE: 'pokud >',
	THRESHOLD_HIGH_VALUE: '=',
	THRESHOLD_LOW_VALUE: 'jinak',
	THRESHOLD_TOOLTIP_SETUP:
		'Nastaví funkci prahové hodnoty. Když analogový vstup překročí prahovou hodnotu, vrátí první výstup, jinak vrátí druhý výstup.',
	THRESHOLD_TOOLTIP_READ: 'Získá hodnotu z funkce prahové hodnoty',

	// Duration block
	DURATION_REPEAT: 'Opakovat po',
	DURATION_TIME: 'čas',
	DURATION_MS: 'milisekund',
	DURATION_DO: 'dělej',

	// Print block
	TEXT_PRINT_SHOW: 'vytisknout',
	TEXT_PRINT_NEWLINE: 'nový řádek',

	// Pin Mode block
	PIN_MODE_SET: 'nastavit',

	// Function Block Labels
	FUNCTION_CREATE: 'Vytvořit funkci',
	FUNCTION_NAME: 'Název',
	FUNCTION_PARAMS: 'Parametry',
	FUNCTION_RETURN: 'Návrat',
	FUNCTION_CALL: 'Volání',

	// Logic Block Labels
	LOGIC_IF: 'když',
	LOGIC_ELSE: 'jinak',
	LOGIC_THEN: 'pak',
	LOGIC_AND: 'a',
	LOGIC_OR: 'nebo',
	LOGIC_NOT: 'ne',
	LOGIC_TRUE: 'pravda',
	LOGIC_FALSE: 'nepravda',

	// Loop Block Labels
	LOOP_REPEAT: 'opakuj',
	LOOP_WHILE: 'dokud',
	LOOP_UNTIL: 'dokud ne',
	LOOP_FOR: 'pro',
	LOOP_FOREACH: 'pro každý',
	LOOP_BREAK: 'přerušit',
	LOOP_CONTINUE: 'pokračovat',

	// Math Block Labels
	MATH_NUMBER: 'číslo',
	MATH_ARITHMETIC: 'aritmetika',
	MATH_OPERATIONS: 'operace',
	MATH_ADD: 'sčítání',
	MATH_SUBTRACT: 'odčítání',
	MATH_MULTIPLY: 'násobení',
	MATH_DIVIDE: 'dělení',
	MATH_POWER: 'mocnina',

	// Math Map Block
	MATH_MAP_VALUE: 'mapovat',
	MATH_MAP_TOOLTIP:
		'Mapuje číslo z jednoho rozsahu do druhého. Například map(hodnota, 0, 1023, 0, 255) převede analogový vstup na 8-bitový PWM výstup.',

	// VS Code UI Messages
	VSCODE_OPEN_FOLDER: 'Otevřít složku',
	VSCODE_PLEASE_OPEN_PROJECT: 'Prosím, nejprve otevřete složku projektu!',
	VSCODE_FAILED_SAVE_FILE: 'Nepodařilo se uložit soubor: {0}',
	VSCODE_FAILED_UPDATE_INI: 'Nepodařilo se aktualizovat platformio.ini: {0}',
	VSCODE_UNABLE_SAVE_WORKSPACE: 'Nelze uložit stav pracovního prostoru: {0}',
	VSCODE_FAILED_START: 'Nepodařilo se spustit Singular Blockly: {0}',
	VSCODE_CONFIRM_DELETE_VARIABLE: 'Opravdu chcete smazat proměnnou "{0}"?',
	VSCODE_BOARD_UPDATED: 'Konfigurace desky aktualizována na: {0}',
	VSCODE_RELOAD_REQUIRED: '，Prosím, znovu načtěte okno pro dokončení nastavení',
	VSCODE_ENTER_VARIABLE_NAME: 'Zadejte název nové proměnné',
	VSCODE_ENTER_NEW_VARIABLE_NAME: 'Zadejte nový název proměnné (aktuální: {0})',
	VSCODE_VARIABLE_NAME_EMPTY: 'Název proměnné nemůže být prázdný',
	VSCODE_VARIABLE_NAME_INVALID: 'Název proměnné může obsahovat pouze písmena, číslice a podtržítka a nemůže začínat číslicí',
	VSCODE_RELOAD: 'Znovu načíst',
	VSCODE_OK: 'OK',
	VSCODE_CANCEL: 'Zrušit',
	VSCODE_OPEN_BLOCKLY_EDITOR: 'Otevřít editor Blockly',

	// Error Messages
	ERROR_BOARD_NOT_SELECTED: 'Prosím, nejprve vyberte desku',
	ERROR_INVALID_PIN: 'Neplatné číslo pinu',
	ERROR_INVALID_VALUE: 'Neplatná hodnota',
	ERROR_MISSING_TRANSLATION: 'Chybějící překlad',

	// Blockly core messages
	ADD: 'přidat',
	REMOVE: 'odebrat',
	RENAME: 'přejmenovat',
	NEW: 'nový',
	ADD_COMMENT: 'Přidat komentář',
	REMOVE_COMMENT: 'Odebrat komentář',
	DUPLICATE_BLOCK: 'Duplikovat',
	HELP: 'Nápověda',
	UNDO: 'Zpět',
	REDO: 'Znovu',
	COLLAPSE_BLOCK: 'Sbalit blok',
	EXPAND_BLOCK: 'Rozbalit blok',
	DELETE_BLOCK: 'Smazat blok',
	DELETE_X_BLOCKS: 'Smazat %1 bloků',
	DELETE_ALL_BLOCKS: 'Smazat všech %1 bloků?',
	CLEAN_UP: 'Uklidit bloky',
	COLLAPSE_ALL: 'Sbalit bloky',
	EXPAND_ALL: 'Rozbalit bloky',
	DISABLE_BLOCK: 'Zakázat blok',
	ENABLE_BLOCK: 'Povolit blok',
	INLINE_INPUTS: 'Vložené vstupy',
	EXTERNAL_INPUTS: 'Externí vstupy',

	// Variable & Function messages
	RENAME_VARIABLE: 'Přejmenovat proměnnou...',
	NEW_VARIABLE: 'Vytvořit proměnnou...',
	DELETE_VARIABLE: 'Smazat proměnnou %1',
	PROCEDURE_ALREADY_EXISTS: 'Procedura s názvem "%1" již existuje.',

	// Logic block messages
	CONTROLS_IF_MSG_IF: 'když',
	CONTROLS_IF_MSG_THEN: 'pak',
	CONTROLS_IF_MSG_ELSE: 'jinak',
	CONTROLS_IF_MSG_ELSEIF: 'jinak když',
	CONTROLS_IF_IF_TITLE_IF: 'když',
	CONTROLS_IF_ELSEIF_TITLE_ELSEIF: 'jinak když',
	CONTROLS_IF_ELSE_TITLE_ELSE: 'jinak',
	LOGIC_COMPARE_TOOLTIP_EQ: 'Vrátí pravda, pokud jsou oba vstupy stejné.',
	LOGIC_COMPARE_TOOLTIP_NEQ: 'Vrátí pravda, pokud jsou oba vstupy různé.',
	LOGIC_COMPARE_TOOLTIP_LT: 'Vrátí pravda, pokud je první vstup menší než druhý vstup.',
	LOGIC_COMPARE_TOOLTIP_LTE: 'Vrátí pravda, pokud je první vstup menší nebo roven druhému vstupu.',
	LOGIC_COMPARE_TOOLTIP_GT: 'Vrátí pravda, pokud je první vstup větší než druhý vstup.',
	LOGIC_COMPARE_TOOLTIP_GTE: 'Vrátí pravda, pokud je první vstup větší nebo roven druhému vstupu.',
	LOGIC_OPERATION_AND: 'a',
	LOGIC_OPERATION_OR: 'nebo',
	LOGIC_NEGATE_TITLE: 'ne %1',
	LOGIC_BOOLEAN_TRUE: 'pravda',
	LOGIC_BOOLEAN_FALSE: 'nepravda',
	LOGIC_NULL: 'null',

	// Additional Logic Block Messages
	LOGIC_COMPARE_HELPURL: 'https://cs.wikipedia.org/wiki/Nerovnost_(matematika)',
	LOGIC_NEGATE_HELPURL: 'https://github.com/google/blockly/wiki/Logic#not',
	LOGIC_NEGATE_TOOLTIP: 'Vrátí pravda, pokud je vstup nepravda. Vrátí nepravda, pokud je vstup pravda.',
	LOGIC_OPERATION_TOOLTIP_AND: 'Vrátí pravda, pokud jsou oba vstupy pravda.',
	LOGIC_OPERATION_TOOLTIP_OR: 'Vrátí pravda, pokud je alespoň jeden vstup pravda.',
	LOGIC_BOOLEAN_TOOLTIP: 'Vrátí buď pravda nebo nepravda.',

	// Loop block messages
	CONTROLS_REPEAT_TITLE: 'opakuj %1 krát',
	CONTROLS_REPEAT_INPUT_DO: 'delej',
	CONTROLS_WHILEUNTIL_OPERATOR_WHILE: 'opakuj dokud',
	CONTROLS_WHILEUNTIL_OPERATOR_UNTIL: 'opakuj dokud ne',
	CONTROLS_FOR_TITLE: 'počítej s %1 od %2 do %3 po %4',
	CONTROLS_FLOW_STATEMENTS_OPERATOR_BREAK: 'vyskočit ze smyčky',
	CONTROLS_FLOW_STATEMENTS_OPERATOR_CONTINUE: 'pokračovat další iterací',
	CONTROLS_REPEAT_TOOLTIP: 'Provede některé příkazy několikrát.',
	CONTROLS_WHILEUNTIL_TOOLTIP_WHILE: 'Dokud je hodnota pravda, provádí příkazy.',
	CONTROLS_WHILEUNTIL_TOOLTIP_UNTIL: 'Dokud je hodnota nepravda, provádí příkazy.',
	CONTROLS_FOR_TOOLTIP: 'Počítá od počátečního čísla do koncového čísla po stanoveném intervalu.',
	CONTROLS_FLOW_STATEMENTS_WARNING: 'Varování: Tento blok může být použit pouze uvnitř smyčky.',

	// Math block messages
	MATH_NUMBER_HELPURL: 'https://cs.wikipedia.org/wiki/Číslo',
	MATH_NUMBER_TOOLTIP: 'Číslo.',
	MATH_ARITHMETIC_OPERATOR_ADD: '+',
	MATH_ARITHMETIC_OPERATOR_MINUS: '-',
	MATH_ARITHMETIC_OPERATOR_MULTIPLY: '×',
	MATH_ARITHMETIC_OPERATOR_DIVIDE: '÷',
	MATH_ARITHMETIC_OPERATOR_POWER: '^',
	MATH_SINGLE_OPERATOR_ROOT: 'odmocnina',
	MATH_SINGLE_OPERATOR_ABSOLUTE: 'absolutní hodnota',
	MATH_IS_EVEN: 'je sudé',
	MATH_IS_ODD: 'je liché',
	MATH_IS_PRIME: 'je prvočíslo',
	MATH_IS_WHOLE: 'je celé číslo',
	MATH_IS_POSITIVE: 'je kladné',
	MATH_IS_NEGATIVE: 'je záporné',
	MATH_ARITHMETIC_HELPURL: 'https://cs.wikipedia.org/wiki/Aritmetika',
	MATH_ARITHMETIC_TOOLTIP_ADD: 'Vrátí součet dvou čísel.',
	MATH_ARITHMETIC_TOOLTIP_MINUS: 'Vrátí rozdíl dvou čísel.',
	MATH_ARITHMETIC_TOOLTIP_MULTIPLY: 'Vrátí součin dvou čísel.',
	MATH_ARITHMETIC_TOOLTIP_DIVIDE: 'Vrátí podíl dvou čísel.',
	MATH_ARITHMETIC_TOOLTIP_POWER: 'Vrátí první číslo umocněné na druhé číslo.',

	// Text block messages
	TEXT_JOIN_TITLE_CREATEWITH: 'vytvořit text s',
	TEXT_CREATE_JOIN_TITLE_JOIN: 'spojit',
	TEXT_LENGTH_TITLE: 'délka %1',
	TEXT_ISEMPTY_TITLE: '%1 je prázdný',
	TEXT_INDEXOF_OPERATOR_FIRST: 'najít první výskyt textu',
	TEXT_INDEXOF_OPERATOR_LAST: 'najít poslední výskyt textu',
	TEXT_CHARAT_FROM_START: 'získat písmeno #',
	TEXT_CHARAT_FROM_END: 'získat písmeno # od konce',
	TEXT_CHARAT_FIRST: 'získat první písmeno',
	TEXT_CHARAT_LAST: 'získat poslední písmeno',
	TEXT_CHARAT_RANDOM: 'získat náhodné písmeno',
	TEXT_JOIN_TOOLTIP: 'Vytvoří text spojením libovolného počtu položek.',
	TEXT_APPEND_VARIABLE: 'položka',
	TEXT_APPEND_TOOLTIP: 'Připojí text k proměnné "%1".',
	TEXT_LENGTH_TOOLTIP: 'Vrátí počet písmen (včetně mezer) v daném textu.',
	TEXT_ISEMPTY_TOOLTIP: 'Vrátí pravda, pokud je zadaný text prázdný.',

	// List block messages
	LISTS_CREATE_EMPTY_TITLE: 'vytvořit prázdný seznam',
	LISTS_CREATE_WITH_INPUT_WITH: 'vytvořit seznam s',
	LISTS_LENGTH_TITLE: 'délka %1',
	LISTS_ISEMPTY_TITLE: '%1 je prázdný',
	LISTS_INDEXOF_FIRST: 'najít první výskyt prvku',
	LISTS_INDEXOF_LAST: 'najít poslední výskyt prvku',
	LISTS_GET_INDEX_GET: 'získat',
	LISTS_GET_INDEX_REMOVE: 'odstranit',
	LISTS_GET_INDEX_FROM_START: '#',
	LISTS_GET_INDEX_FROM_END: '# od konce',
	LISTS_GET_INDEX_FIRST: 'první',
	LISTS_GET_INDEX_LAST: 'poslední',
	LISTS_GET_INDEX_RANDOM: 'náhodný',
	LISTS_CREATE_WITH_TOOLTIP: 'Vytvoří seznam s libovolným počtem položek.',
	LISTS_CREATE_EMPTY_TOOLTIP: 'Vrátí prázdný seznam délky 0',
	LISTS_LENGTH_TOOLTIP: 'Vrátí délku seznamu.',
	LISTS_ISEMPTY_TOOLTIP: 'Vrátí pravda, pokud je seznam prázdný.',

	// Variables
	VARIABLES_SET: 'nastavit %1 na %2',
	VARIABLES_GET: '%1',
	VARIABLES_DEFAULT_NAME: 'položka',

	// If conditions
	CONTROLS_IF_TOOLTIP_1: 'Je-li hodnota pravda, proveď nějaké příkazy.',
	CONTROLS_IF_TOOLTIP_2: 'Je-li hodnota pravda, proveď první blok příkazů. V opačném případě proveď druhý blok příkazů.',
	CONTROLS_IF_TOOLTIP_3:
		'Je-li první hodnota pravda, proveď první blok příkazů. V opačném případě, je-li druhá hodnota pravda, proveď druhý blok příkazů.',
	CONTROLS_IF_TOOLTIP_4:
		'Je-li první hodnota pravda, proveď první blok příkazů. V opačném případě, je-li druhá hodnota pravda, proveď druhý blok příkazů. Pokud žádná z hodnot není pravda, proveď poslední blok příkazů.',

	// Procedures
	PROCEDURES_DEFNORETURN_TITLE: '',
	PROCEDURES_DEFNORETURN_PROCEDURE: 'udělej něco',
	PROCEDURES_BEFORE_PARAMS: 's:',
	PROCEDURES_CALL_BEFORE_PARAMS: 's:',
	PROCEDURES_DEFNORETURN_DO: '',
	PROCEDURES_DEFNORETURN_TOOLTIP: 'Vytvoří funkci bez návratové hodnoty.',
	PROCEDURES_DEFRETURN_RETURN: 'vrátit',
	PROCEDURES_DEFRETURN_TOOLTIP: 'Vytvoří funkci s návratovou hodnotou.',
	PROCEDURES_DEFRETURN_COMMENT: 'Popiš tuto funkci...',
	PROCEDURES_DEFRETURN_PROCEDURE: 'udělej něco s návratem',
	PROCEDURES_DEFRETURN_DO: '',
	PROCEDURES_CALLNORETURN_HELPURL: 'https://cs.wikipedia.org/wiki/Podprogram',
	PROCEDURES_CALLNORETURN_TOOLTIP: 'Spustí uživatelsky definovanou funkci.',
	PROCEDURES_CALLRETURN_HELPURL: 'https://cs.wikipedia.org/wiki/Podprogram',
	PROCEDURES_CALLRETURN_TOOLTIP: 'Spustí uživatelsky definovanou funkci a použije její výstup.',

	// Seven Segment Display
	SEVEN_SEGMENT_DISPLAY: 'Sedmisegmentový displej',
	SEVEN_SEGMENT_COMMON_CATHODE: 'Společná katoda',
	SEVEN_SEGMENT_COMMON_ANODE: 'Společná anoda',
	SEVEN_SEGMENT_NUMBER: 'Číslo (0-9):',
	SEVEN_SEGMENT_DECIMAL_POINT: 'Desetinná tečka',
	SEVEN_SEGMENT_TOOLTIP: 'Zobrazí číslo (0-9) na sedmisegmentovém displeji s volitelnou desetinnou tečkou.',
	// Seven Segment Display Pins
	SEVEN_SEGMENT_PINS_SET: 'Nastavit piny sedmisegmentového displeje',
	SEVEN_SEGMENT_PINS_TOOLTIP: 'Nastavit piny pro každý segment (A-G) a desetinnou tečku (DP) sedmisegmentového displeje.',
	// Pixetto Smart Camera
	PIXETTO_INIT: 'Inicializace chytré kamery Pixetto',
	PIXETTO_RX_PIN: 'RX pin',
	PIXETTO_TX_PIN: 'TX pin',
	PIXETTO_IS_DETECTED: 'Pixetto detekovaný objekt',
	PIXETTO_GET_TYPE_ID: 'Pixetto získat ID typu',
	PIXETTO_GET_FUNC_ID: 'Pixetto získat ID funkce',
	PIXETTO_COLOR_DETECT: 'Pixetto detekce barvy',
	PIXETTO_SHAPE_DETECT: 'Pixetto detekce tvaru',
	PIXETTO_FACE_DETECT: 'Pixetto detekce obličeje',
	PIXETTO_APRILTAG_DETECT: 'Pixetto detekce AprilTag',
	PIXETTO_NEURAL_NETWORK: 'Pixetto rozpoznání neuronové sítě',
	PIXETTO_HANDWRITTEN_DIGIT: 'Pixetto rozpoznání ručně psané číslice',
	PIXETTO_GET_POSITION: 'Pixetto získat detekovaný objekt',
	PIXETTO_ROAD_DETECT: 'Pixetto detekce silnic',
	PIXETTO_SET_MODE: 'Nastavit funkční režim Pixetto',
	PIXETTO_COLOR: 'Barva',
	PIXETTO_SHAPE: 'Tvar',
	PIXETTO_MODE: 'Režim',
	PIXETTO_TAG_ID: 'ID značky',
	PIXETTO_CLASS_ID: 'ID třídy',
	PIXETTO_DIGIT: 'Číslice',
	PIXETTO_COORDINATE: 'Souřadnice',
	PIXETTO_ROAD_INFO: 'Informace', // Vision Sensors Category Labels
	PIXETTO_LABEL: 'Pixetto',
	HUSKYLENS_LABEL: 'HUSKYLENS',
	// HUSKYLENS Chytrá Kamera
	HUSKYLENS_INIT_I2C: 'Inicializovat HUSKYLENS (I2C)',
	HUSKYLENS_INIT_UART: 'Inicializovat HUSKYLENS (UART)',
	HUSKYLENS_RX_PIN: 'Připojit k HuskyLens TX →',
	HUSKYLENS_TX_PIN: 'Připojit k HuskyLens RX →',
	HUSKYLENS_SET_ALGORITHM: 'Nastavit algoritmus HUSKYLENS na',
	HUSKYLENS_ALGORITHM_FACE_RECOGNITION: 'Rozpoznávání obličeje',
	HUSKYLENS_ALGORITHM_OBJECT_TRACKING: 'Sledování objektů',
	HUSKYLENS_ALGORITHM_OBJECT_RECOGNITION: 'Rozpoznávání objektů',
	HUSKYLENS_ALGORITHM_LINE_TRACKING: 'Sledování čár',
	HUSKYLENS_ALGORITHM_COLOR_RECOGNITION: 'Rozpoznávání barev',
	HUSKYLENS_ALGORITHM_TAG_RECOGNITION: 'Rozpoznávání značek',
	HUSKYLENS_ALGORITHM_OBJECT_CLASSIFICATION: 'Klasifikace objektů',
	HUSKYLENS_REQUEST: 'Vyžádat výsledek rozpoznávání HUSKYLENS',
	HUSKYLENS_IS_LEARNED: 'HUSKYLENS se naučil objekty',
	HUSKYLENS_COUNT_BLOCKS: 'Počet bloků detekovaných HUSKYLENS',
	HUSKYLENS_COUNT_ARROWS: 'Počet šipek detekovaných HUSKYLENS',
	HUSKYLENS_GET_BLOCK_INFO: 'Získat blok',
	HUSKYLENS_GET_ARROW_INFO: 'Získat šipku',
	HUSKYLENS_BLOCK_INFO_TYPE: ' ',
	HUSKYLENS_ARROW_INFO_TYPE: ' ',
	HUSKYLENS_X_CENTER: 'X střed',
	HUSKYLENS_Y_CENTER: 'Y střed',
	HUSKYLENS_WIDTH: 'Šířka',
	HUSKYLENS_HEIGHT: 'Výška',
	HUSKYLENS_ID: 'ID',
	HUSKYLENS_X_ORIGIN: 'X počátek',
	HUSKYLENS_Y_ORIGIN: 'Y počátek',
	HUSKYLENS_X_TARGET: 'X cíl',
	HUSKYLENS_Y_TARGET: 'Y cíl',
	HUSKYLENS_LEARN: 'Nechte HUSKYLENS naučit se ID',
	HUSKYLENS_FORGET: 'Nechte HUSKYLENS zapomenout vše naučené',

	// Pixetto Tooltips
	PIXETTO_INIT_TOOLTIP: 'Inicializace chytré kamery Pixetto a nastavení komunikačních pinů UART',
	PIXETTO_IS_DETECTED_TOOLTIP: 'Zjistit, zda Pixetto detekuje nějaký objekt',
	PIXETTO_GET_TYPE_ID_TOOLTIP: 'Získat ID typu detekovaného objektu z Pixetto (barva, tvar atd.)',
	PIXETTO_GET_FUNC_ID_TOOLTIP: 'Získat ID aktuální funkce používané Pixetto (detekce barvy, tvaru atd.)',
	PIXETTO_COLOR_DETECT_TOOLTIP: 'Zjistit, zda Pixetto detekuje objekt zadané barvy',
	PIXETTO_SHAPE_DETECT_TOOLTIP: 'Zjistit, zda Pixetto detekuje objekt zadaného tvaru',
	PIXETTO_FACE_DETECT_TOOLTIP: 'Zjistit, zda Pixetto detekuje obličej',
	PIXETTO_APRILTAG_DETECT_TOOLTIP: 'Zjistit, zda Pixetto detekuje AprilTag se zadaným ID',
	PIXETTO_NEURAL_NETWORK_TOOLTIP: 'Zjistit, zda neuronová síť Pixetto rozpozná objekt zadané třídy',
	PIXETTO_HANDWRITTEN_DIGIT_TOOLTIP: 'Zjistit, zda Pixetto rozpozná zadanou ručně psanou číslici',
	PIXETTO_GET_POSITION_TOOLTIP: 'Získat informace o poloze nebo velikosti detekovaného objektu Pixetto',
	PIXETTO_ROAD_DETECT_TOOLTIP: 'Získat informace související s detekcí silnic od Pixetto',
	PIXETTO_SET_MODE_TOOLTIP: 'Nastavit funkční režim chytré kamery Pixetto',

	// Pixetto Color Options
	PIXETTO_COLOR_RED: 'Červená',
	PIXETTO_COLOR_BLUE: 'Modrá',
	PIXETTO_COLOR_GREEN: 'Zelená',
	PIXETTO_COLOR_YELLOW: 'Žlutá',
	PIXETTO_COLOR_ORANGE: 'Oranžová',
	PIXETTO_COLOR_PURPLE: 'Fialová',
	PIXETTO_COLOR_BLACK: 'Černá',
	PIXETTO_COLOR_WHITE: 'Bílá',

	// Pixetto Shape Options
	PIXETTO_SHAPE_TRIANGLE: 'Trojúhelník',
	PIXETTO_SHAPE_RECTANGLE: 'Obdélník',
	PIXETTO_SHAPE_PENTAGON: 'Pětiúhelník',
	PIXETTO_SHAPE_HEXAGON: 'Šestiúhelník',
	PIXETTO_SHAPE_CIRCLE: 'Kruh',

	// Pixetto Position Options
	PIXETTO_POSITION_X: 'X souřadnice',
	PIXETTO_POSITION_Y: 'Y souřadnice',
	PIXETTO_POSITION_WIDTH: 'Šířka',
	PIXETTO_POSITION_HEIGHT: 'Výška',

	// Pixetto Road Info Options
	PIXETTO_ROAD_CENTER_X: 'Střed X',
	PIXETTO_ROAD_CENTER_Y: 'Střed Y',
	PIXETTO_ROAD_LEFT_X: 'Levá hranice X',
	PIXETTO_ROAD_RIGHT_X: 'Pravá hranice X',

	// Pixetto Mode Options
	PIXETTO_MODE_COLOR_DETECTION: 'Detekce barvy',
	PIXETTO_MODE_SHAPE_DETECTION: 'Detekce tvaru',
	PIXETTO_MODE_FACE_DETECTION: 'Detekce obličeje',
	PIXETTO_MODE_APRILTAG_DETECTION: 'Detekce AprilTag',
	PIXETTO_MODE_NEURAL_NETWORK: 'Neuronová síť',
	PIXETTO_MODE_HANDWRITTEN_DIGIT: 'Ručně psaná číslice',
	PIXETTO_MODE_ROAD_DETECTION: 'Detekce silnic',
	PIXETTO_MODE_BALL_DETECTION: 'Detekce míče',
	PIXETTO_MODE_TEMPLATE_MATCHING: 'Přiřazování šablon',

	// HUSKYLENS Tooltips
	HUSKYLENS_INIT_I2C_TOOLTIP: 'Inicializovat chytrou kameru HUSKYLENS pomocí I2C',
	HUSKYLENS_INIT_UART_TOOLTIP: 'Inicializovat chytrou kameru HUSKYLENS pomocí UART, nastavit RX/TX piny',
	HUSKYLENS_SET_ALGORITHM_TOOLTIP: 'Nastavit algoritmus rozpoznávání používaný HUSKYLENS',
	HUSKYLENS_REQUEST_TOOLTIP: 'Vyžádat nejnovější výsledky rozpoznávání od HUSKYLENS',
	HUSKYLENS_IS_LEARNED_TOOLTIP: 'Zkontrolovat, zda se HUSKYLENS naučil nějaké objekty',
	HUSKYLENS_COUNT_BLOCKS_TOOLTIP: 'Získat počet bloků detekovaných HUSKYLENS',
	HUSKYLENS_COUNT_ARROWS_TOOLTIP: 'Získat počet šipek detekovaných HUSKYLENS',
	HUSKYLENS_GET_BLOCK_INFO_TOOLTIP: 'Získat informace o zadaném bloku (pozice, velikost nebo ID)',
	HUSKYLENS_GET_ARROW_INFO_TOOLTIP: 'Získat informace o určené šipce (počátek, cíl nebo ID)',
	HUSKYLENS_LEARN_TOOLTIP: 'Nechat HUSKYLENS naučit se objekt se zadaným ID (pouze pro režim Klasifikace objektů)',
	HUSKYLENS_FORGET_TOOLTIP: 'Vymazat všechny naučené objekty z HUSKYLENS (pouze pro režim Klasifikace objektů)',
	HUSKYLENS_I2C_PIN_HINT: 'Zapojení: ',
	HUSKYLENS_UART_PIN_HINT: 'Doporučené piny: ',
	HUSKYLENS_UART_ANY_DIGITAL: 'Jakýkoliv digitální pin',
	// ESP32 PWM Setup
	ESP32_PWM_SETUP: 'Nastavení PWM ESP32',
	ESP32_PWM_FREQUENCY: 'Frekvence',
	ESP32_PWM_RESOLUTION: 'Rozlišení',
	ESP32_PWM_FREQUENCY_TOOLTIP: 'Nastavit frekvenci PWM, rozsah 1-80000 Hz. Vysoká frekvence pro motorové ovladače (20-75KHz)',
	ESP32_PWM_RESOLUTION_TOOLTIP: 'Nastavit rozlišení PWM, ovlivňuje přesnost výstupu. Poznámka: frekvence × 2^rozlišení ≤ 80 000 000',
	ESP32_PWM_RESOLUTION_8BIT: '8 bitů (0-255)',
	ESP32_PWM_RESOLUTION_10BIT: '10 bitů (0-1023)',
	ESP32_PWM_RESOLUTION_12BIT: '12 bitů (0-4095)',
	ESP32_PWM_RESOLUTION_13BIT: '13 bitů (0-8191)',
	ESP32_PWM_RESOLUTION_14BIT: '14 bitů (0-16383)',
	ESP32_PWM_RESOLUTION_15BIT: '15 bitů (0-32767)',
	ESP32_PWM_RESOLUTION_16BIT: '16 bitů (0-65535)',
	// Safety Guard (Project Safety Protection)
	SAFETY_WARNING_BODY_NO_TYPE:
		'Tento projekt ještě nemá bloky Blockly. Pokud budete pokračovat, bude zde vytvořena složka a soubory blockly. Chcete pokračovat?',
	SAFETY_WARNING_BODY_WITH_TYPE:
		'Detekován projekt {0}. Tento projekt ještě nemá bloky Blockly. Pokud budete pokračovat, bude zde vytvořena složka a soubory blockly. Chcete pokračovat?',
	BUTTON_CONTINUE: 'Pokračovat',
	BUTTON_CANCEL: 'Zrušit',
	BUTTON_SUPPRESS: 'Již nepřipomínat',
	SAFETY_GUARD_CANCELLED: 'Otevření editoru Blockly bylo zrušeno',
	SAFETY_GUARD_SUPPRESSED: 'Nastavení uloženo, toto upozornění již nebude zobrazeno',

	// Communication Category
	CATEGORY_COMMUNICATION: 'Komunikace',

	// ESP32 WiFi
	ESP32_WIFI_LABEL: 'WiFi',
	ESP32_WIFI_CONNECT: 'Připojit WiFi',
	ESP32_WIFI_CONNECT_SSID: 'SSID',
	ESP32_WIFI_CONNECT_PASSWORD: 'Heslo',
	ESP32_WIFI_CONNECT_TOOLTIP: 'Připojit ESP32 k WiFi síti s uvedeným SSID a heslem',
	ESP32_WIFI_DISCONNECT: 'Odpojit WiFi',
	ESP32_WIFI_DISCONNECT_TOOLTIP: 'Odpojit ESP32 od WiFi sítě',
	ESP32_WIFI_STATUS: 'Stav WiFi',
	ESP32_WIFI_STATUS_TOOLTIP: 'Zkontrolovat, zda je ESP32 připojeno k WiFi síti',
	ESP32_WIFI_GET_IP: 'Získat WiFi IP adresu',
	ESP32_WIFI_GET_IP_TOOLTIP: 'Získat lokální IP adresu ESP32 jako text',
	ESP32_WIFI_SCAN: 'Vyhledat WiFi sítě',
	ESP32_WIFI_SCAN_TOOLTIP: 'Vyhledat dostupné WiFi sítě a vrátit počet nalezených',
	ESP32_WIFI_GET_SSID: 'Získat SSID sítě',
	ESP32_WIFI_GET_SSID_INDEX: 'index',
	ESP32_WIFI_GET_SSID_TOOLTIP: 'Získat název SSID WiFi sítě na daném indexu',
	ESP32_WIFI_GET_RSSI: 'Získat RSSI sítě',
	ESP32_WIFI_GET_RSSI_INDEX: 'index',
	ESP32_WIFI_GET_RSSI_TOOLTIP: 'Získat sílu signálu (RSSI) WiFi sítě na daném indexu',

	// ESP32 MQTT
	ESP32_MQTT_LABEL: 'MQTT',
	ESP32_MQTT_SETUP: 'Nastavení MQTT',
	ESP32_MQTT_SETUP_SERVER: 'Server',
	ESP32_MQTT_SETUP_PORT: 'Port',
	ESP32_MQTT_SETUP_CLIENT_ID: 'ID klienta',
	ESP32_MQTT_SETUP_TOOLTIP: 'Nakonfigurovat MQTT klienta s adresou serveru, portem a ID klienta',
	ESP32_MQTT_CONNECT: 'Připojit MQTT',
	ESP32_MQTT_CONNECT_USERNAME: 'Uživatel',
	ESP32_MQTT_CONNECT_PASSWORD: 'Heslo',
	ESP32_MQTT_CONNECT_TOOLTIP: 'Připojit se k MQTT brokeru s volitelným uživatelským jménem a heslem',
	ESP32_MQTT_PUBLISH: 'Publikovat MQTT',
	ESP32_MQTT_PUBLISH_TOPIC: 'Téma',
	ESP32_MQTT_PUBLISH_MESSAGE: 'Zpráva',
	ESP32_MQTT_PUBLISH_TOOLTIP: 'Publikovat zprávu do MQTT tématu',
	ESP32_MQTT_SUBSCRIBE: 'Odebírat MQTT',
	ESP32_MQTT_SUBSCRIBE_TOPIC: 'Téma',
	ESP32_MQTT_SUBSCRIBE_TOOLTIP: 'Odebírat MQTT téma pro příjem zpráv',
	ESP32_MQTT_LOOP: 'MQTT smyčka',
	ESP32_MQTT_LOOP_TOOLTIP: 'Zpracovat příchozí MQTT zprávy (volat v hlavní smyčce)',
	ESP32_MQTT_GET_TOPIC: 'Získat MQTT téma',
	ESP32_MQTT_GET_TOPIC_TOOLTIP: 'Získat téma naposledy přijaté MQTT zprávy',
	ESP32_MQTT_GET_MESSAGE: 'Získat MQTT zprávu',
	ESP32_MQTT_GET_MESSAGE_TOOLTIP: 'Získat obsah naposledy přijaté MQTT zprávy',
	ESP32_MQTT_STATUS: 'MQTT Připojeno',
	ESP32_MQTT_STATUS_TOOLTIP: 'Zkontrolovat, zda je připojeno k MQTT serveru',

	// Text to Number
	TEXT_TO_NUMBER: 'Text na číslo',
	TEXT_TO_NUMBER_INT: 'celé',
	TEXT_TO_NUMBER_FLOAT: 'desetinné',
	TEXT_TO_NUMBER_TOOLTIP: 'Převést text na číslo (celé nebo desetinné)',

	// To String Block
	TO_STRING: 'Na text',
	TO_STRING_TOOLTIP: 'Převést číslo nebo boolean na text',

	// ESP32 Only Block Warning
	ESP32_ONLY_BLOCK_WARNING: 'Tento blok podporuje pouze desky ESP32',

	// Quick Backup Toast Messages
	BACKUP_QUICK_SAVE_SUCCESS: 'Záloha uložena: {0}',
	BACKUP_QUICK_SAVE_EMPTY: 'Pracovní prostor je prázdný, záloha není potřeba',
	BACKUP_QUICK_SAVE_COOLDOWN: 'Prosím počkejte, záloha byla právě dokončena',
	MAIN_BLOCK_DUPLICATE_WARNING: 'Bylo zjištěno více bloků hlavního programu. Odstraňte přebytečné bloky.',

	// Board Switch Warning
	BOARD_SWITCH_WARNING_TITLE: 'Přepnout typ desky',
	BOARD_SWITCH_WARNING_MESSAGE:
		'Přepnutí na jiný typ desky vymaže aktuální pracovní prostor.\nVaše práce bude nejprve automaticky zálohována.\n\nChcete pokračovat?',

	// CyberBrick Board
	BOARD_CYBERBRICK: 'CyberBrick',

	// CyberBrick Category
	CATEGORY_CYBERBRICK_CORE: 'CyberBrick',
	CATEGORY_CYBERBRICK_LED: 'LED',
	CATEGORY_CYBERBRICK_GPIO: 'GPIO',
	CATEGORY_CYBERBRICK_TIME: 'Čas',

	// CyberBrick Main Block
	CYBERBRICK_MAIN: 'Hlavní program',
	CYBERBRICK_MAIN_TOOLTIP: 'Vstupní bod hlavního programu CyberBrick. Veškerý kód by měl být umístěn uvnitř tohoto bloku.',

	// CyberBrick LED Blocks
	CYBERBRICK_LED_SET_COLOR: 'Nastavit barvu LED',
	CYBERBRICK_LED_SET_COLOR_PREFIX: 'Nastavit barvu vestavěné LED',
	CYBERBRICK_LED_RED: 'Červená',
	CYBERBRICK_LED_GREEN: 'Zelená',
	CYBERBRICK_LED_BLUE: 'Modrá',
	CYBERBRICK_LED_SET_COLOR_TOOLTIP: 'Nastavit barvu vestavěné LED (GPIO8) pomocí hodnot RGB (0-255)',
	CYBERBRICK_LED_OFF: 'Vypnout LED',
	CYBERBRICK_LED_OFF_TOOLTIP: 'Vypnout vestavěnou LED',

	// CyberBrick GPIO Blocks
	CYBERBRICK_GPIO_SET: 'Nastavit GPIO',
	CYBERBRICK_GPIO_SET_PREFIX: 'GPIO',
	CYBERBRICK_GPIO_SET_TO: 'na',
	CYBERBRICK_GPIO_PIN: 'Pin',
	CYBERBRICK_GPIO_VALUE: 'Hodnota',
	CYBERBRICK_GPIO_HIGH: 'VYSOKÁ',
	CYBERBRICK_GPIO_LOW: 'NÍZKÁ',
	CYBERBRICK_GPIO_SET_TOOLTIP: 'Nastavit GPIO pin na VYSOKOU nebo NÍZKOU',
	CYBERBRICK_GPIO_READ: 'Číst GPIO',
	CYBERBRICK_GPIO_READ_TOOLTIP: 'Číst digitální hodnotu z GPIO pinu (vrací 0 nebo 1)',

	// CyberBrick Time Blocks
	CYBERBRICK_DELAY_MS: 'Zpoždění (ms)',
	CYBERBRICK_DELAY_MS_PREFIX: 'Zpoždění',
	CYBERBRICK_DELAY_MS_SUFFIX: 'ms',
	CYBERBRICK_DELAY_MS_TOOLTIP: 'Pozastavit provádění programu na zadaný počet milisekund',
	CYBERBRICK_DELAY_S: 'Zpoždění (s)',
	CYBERBRICK_DELAY_S_PREFIX: 'Zpoždění',
	CYBERBRICK_DELAY_S_SUFFIX: 'sekund',
	CYBERBRICK_DELAY_S_TOOLTIP: 'Pozastavit provádění programu na zadaný počet sekund',

	// CyberBrick WiFi Blocks
	CATEGORY_CYBERBRICK_WIFI: 'WiFi',
	CYBERBRICK_WIFI_CONNECT: 'Připojit WiFi',
	CYBERBRICK_WIFI_SSID: 'SSID',
	CYBERBRICK_WIFI_PASSWORD: 'Heslo',
	CYBERBRICK_WIFI_CONNECT_TOOLTIP: 'Připojit k zadané WiFi síti',
	CYBERBRICK_WIFI_DISCONNECT: 'Odpojit WiFi',
	CYBERBRICK_WIFI_DISCONNECT_TOOLTIP: 'Odpojit od aktuální WiFi sítě',
	CYBERBRICK_WIFI_IS_CONNECTED: 'WiFi připojeno?',
	CYBERBRICK_WIFI_IS_CONNECTED_TOOLTIP: 'Zkontrolovat zda je WiFi připojeno',
	CYBERBRICK_WIFI_GET_IP: 'Získat IP adresu',
	CYBERBRICK_WIFI_GET_IP_TOOLTIP: 'Získat aktuální IP adresu',

	// CyberBrick Upload
	UPLOAD_BUTTON_TITLE: 'Nahrát do CyberBrick',
	UPLOAD_BUTTON_DISABLED_TITLE: 'Nejprve uložte pracovní prostor pro povolení nahrávání',
	UPLOAD_STARTING: 'Zahajování nahrávání...',
	UPLOAD_SUCCESS: 'Nahrávání úspěšné!',
	UPLOAD_FAILED: 'Nahrávání selhalo: {0}',
	UPLOAD_NO_PORT: 'Zařízení CyberBrick nebylo nalezeno',
	UPLOAD_IN_PROGRESS: 'Nahrávání...',
	UPLOAD_EMPTY_WORKSPACE: 'Pracovní prostor je prázdný, nejprve přidejte bloky',
	UPLOAD_NO_CODE: 'Nelze vygenerovat kód',

	// Upload progress stages
	UPLOAD_STAGE_PREPARING: 'Příprava',
	UPLOAD_STAGE_CHECKING: 'Kontrola nástrojů',
	UPLOAD_STAGE_INSTALLING: 'Instalace nástrojů',
	UPLOAD_STAGE_CONNECTING: 'Připojování zařízení',
	UPLOAD_STAGE_RESETTING: 'Resetování zařízení',
	UPLOAD_STAGE_BACKUP: 'Zálohování',
	UPLOAD_STAGE_UPLOADING: 'Nahrávání',
	UPLOAD_STAGE_RESTARTING: 'Restartování zařízení',
	UPLOAD_STAGE_COMPLETED: 'Dokončeno',

	// Upload error messages
	ERROR_UPLOAD_BOARD_UNSUPPORTED: 'Je podporována pouze deska CyberBrick',
	ERROR_UPLOAD_CODE_EMPTY: 'Kód nemůže být prázdný',
	ERROR_UPLOAD_NO_PYTHON: 'Python prostředí PlatformIO nebylo nalezeno. Nejprve nainstalujte PlatformIO.',
	ERROR_UPLOAD_MPREMOTE_FAILED: 'Instalace mpremote selhala',
	ERROR_UPLOAD_DEVICE_NOT_FOUND: 'Zařízení CyberBrick nebylo nalezeno. Ujistěte se, že je připojeno.',
	ERROR_UPLOAD_RESET_FAILED: 'Nepodařilo se resetovat zařízení',
	ERROR_UPLOAD_UPLOAD_FAILED: 'Nepodařilo se nahrát program',
	ERROR_UPLOAD_RESTART_FAILED: 'Nepodařilo se restartovat zařízení',

	// Arduino Upload Button
	UPLOAD_BUTTON_TITLE_ARDUINO: 'Kompilovat a Nahrát',
	UPLOAD_SELECT_BOARD: 'Nejprve vyberte desku',

	// Arduino Upload Stages
	ARDUINO_STAGE_SYNCING: 'Synchronizace nastavení',
	ARDUINO_STAGE_SAVING: 'Ukládání pracovního prostoru',
	ARDUINO_STAGE_CHECKING: 'Kontrola kompilátoru',
	ARDUINO_STAGE_DETECTING: 'Detekce desky',
	ARDUINO_STAGE_COMPILING: 'Kompilace',
	ARDUINO_STAGE_UPLOADING: 'Nahrávání',

	// Arduino Upload Results
	ARDUINO_COMPILE_SUCCESS: 'Kompilace úspěšná!',
	ARDUINO_UPLOAD_SUCCESS: 'Nahrávání úspěšné!',

	// Arduino Upload Errors
	ERROR_ARDUINO_PIO_NOT_FOUND: 'PlatformIO CLI nenalezeno. Nejprve nainstalujte PlatformIO.',
	ERROR_ARDUINO_COMPILE_FAILED: 'Kompilace selhala',
	ERROR_ARDUINO_UPLOAD_FAILED: 'Nahrávání selhalo',
	ERROR_ARDUINO_NO_WORKSPACE: 'Nejprve otevřete složku projektu',
	ERROR_ARDUINO_TIMEOUT: 'Časový limit operace vypršel',
	ERROR_ARDUINO_DEVICE_DISCONNECT: 'Zařízení bylo odpojeno',

	// Backup messages
	BACKUP_CONFIRM_DELETE: 'Opravdu chcete smazat zálohu "{0}"?',
	BACKUP_CONFIRM_RESTORE: 'Opravdu chcete obnovit zálohu "{0}"? Tím se přepíše aktuální pracovní prostor.',
	BACKUP_ERROR_NOT_FOUND: 'Záloha "{0}" nebyla nalezena',
	BACKUP_ERROR_CREATE_FAILED: 'Nepodařilo se vytvořit zálohu: {0}',
	BACKUP_ERROR_DELETE_FAILED: 'Nepodařilo se smazat zálohu: {0}',
	BACKUP_ERROR_RESTORE_FAILED: 'Nepodařilo se obnovit zálohu: {0}',
	BACKUP_ERROR_PREVIEW_FAILED: 'Nepodařilo se zobrazit náhled zálohy: {0}',
	BACKUP_ERROR_NAME_NOT_SPECIFIED: 'Název zálohy není zadán',
	BACKUP_ERROR_MAIN_NOT_FOUND: 'Nelze najít soubor main.json',
	BACKUP_ERROR_UPDATE_SETTINGS_FAILED: 'Nepodařilo se aktualizovat nastavení automatického zálohování',

	// Button labels
	BUTTON_DELETE: 'Smazat',
	BUTTON_RESTORE: 'Obnovit',

	// Error messages
	ERROR_PROCESSING_MESSAGE: 'Chyba při zpracování zprávy: {0}',
	ERROR_SETTINGS_UPDATE_FAILED: 'Nepodařilo se aktualizovat nastavení',
	ERROR_RELOAD_WORKSPACE_FAILED: 'Nepodařilo se znovu načíst pracovní prostor: {0}',
	ERROR_OPEN_PROJECT_FOLDER_FIRST: 'Nejprve otevřete složku projektu',

	// Info messages
	INFO_NO_BACKUPS_TO_PREVIEW: 'Žádné záložní soubory k náhledu',

	// Dialog messages
	DIALOG_SELECT_BACKUP_TITLE: 'Vyberte záložní soubor pro náhled',
	DIALOG_BACKUP_FILES_LABEL: 'Záložní soubory',

	// X11 Rozšiřující deska
	CATEGORY_X11: 'X11 Rozšíření',
	X11_LABEL_SERVOS: 'Servomotory',
	X11_LABEL_MOTORS: 'Motory',
	X11_LABEL_LEDS: 'LED',

	// X11 180° Servo bloky
	X11_SERVO_180_ANGLE_PREFIX: 'Nastav servo',
	X11_SERVO_180_ANGLE_SUFFIX: 'úhel',
	X11_SERVO_180_ANGLE_TOOLTIP: 'Nastav úhel 180° serva (0-180 stupňů)',

	// X11 360° Servo bloky
	X11_SERVO_360_SPEED_PREFIX: 'Nastav servo',
	X11_SERVO_360_SPEED_SUFFIX: 'rychlost',
	X11_SERVO_360_SPEED_TOOLTIP: 'Nastav rychlost 360° kontinualne rotačního serva (-100 až 100, záporné=zpět)',

	// X11 Blok zastavení serva
	X11_SERVO_STOP: 'Zastav servo',
	X11_SERVO_STOP_TOOLTIP: 'Zastav určené servo',

	// X11 Motor bloky
	X11_MOTOR_SPEED_PREFIX: 'Nastav motor',
	X11_MOTOR_SPEED_SUFFIX: 'rychlost',
	X11_MOTOR_SPEED_TOOLTIP: 'Nastav rychlost DC motoru (-2048 až 2048, záporné=zpět)',
	X11_MOTOR_STOP: 'Zastav motor',
	X11_MOTOR_STOP_TOOLTIP: 'Zastav určený motor',

	// X11 LED bloky
	X11_LED_SET_COLOR_PREFIX: 'LED pásek',
	X11_LED_SET_COLOR_INDEX: 'index',
	X11_LED_SET_COLOR_INDEX_SUFFIX: 'nastav barvu R',
	X11_LED_SET_COLOR_TOOLTIP: 'Nastav barvu pixelu LED pásku (index 0=první pixel, nebo všechny)',
	X11_LED_INDEX_ALL: 'Všechny',

	// === X12 Rozšiřující deska Vysílač ===
	CATEGORY_X12: 'X12 Rozšíření',
	X12_LABEL_JOYSTICK: 'Joystick',
	X12_LABEL_BUTTON: 'Tlačítko',

	// X12 Joystick bloky
	X12_GET_JOYSTICK_PREFIX: 'Joystick',
	X12_GET_JOYSTICK_SUFFIX: 'hodnota',
	X12_GET_JOYSTICK_TOOLTIP: 'Číst ADC hodnotu joysticku (0-4095)',
	X12_GET_JOYSTICK_MAPPED_PREFIX: 'Joystick',
	X12_GET_JOYSTICK_MAPPED_MIN: 'mapovat na',
	X12_GET_JOYSTICK_MAPPED_MAX: '~',
	X12_GET_JOYSTICK_MAPPED_TOOLTIP: 'Číst joystick a mapovat na určený rozsah',

	// X12 Tlačítko bloky
	X12_IS_BUTTON_PRESSED_PREFIX: 'Tlačítko',
	X12_IS_BUTTON_PRESSED_SUFFIX: 'stisknuto?',
	X12_IS_BUTTON_PRESSED_TOOLTIP: 'Zkontrolovat zda je tlačítko stisknuto',

	// === RC Dálkové ovládání ===

	// RC Inicializace bloky

	// RC Joystick bloky

	// RC Tlačítko bloky

	// RC Stav bloky

	// === RC Připojení ===
	CATEGORY_RC: 'RC Připojení',
	RC_LABEL_MASTER: '📡 Vysílač',
	RC_LABEL_SLAVE: '📻 Přijímač',
	RC_LABEL_DATA: '📊 Data',
	RC_LABEL_STATUS: '🔗 Stav',

	// Bloky vysílače RC
	RC_MASTER_INIT: 'Inicializovat vysílač RC',
	RC_MASTER_INIT_PAIR_ID: 'ID párování',
	RC_MASTER_INIT_CHANNEL: 'kanál',
	RC_MASTER_INIT_TOOLTIP: 'Inicializovat vysílač RC s ID párování (1-255) a kanálem (1-11)',
	RC_SEND: 'Odeslat data RC',
	RC_SEND_TOOLTIP: 'Číst data joysticků/tlačítek X12 a odeslat přijímači',

	// Bloky přijímače RC
	RC_SLAVE_INIT: 'Inicializovat přijímač RC',
	RC_SLAVE_INIT_PAIR_ID: 'ID párování',
	RC_SLAVE_INIT_CHANNEL: 'kanál',
	RC_SLAVE_INIT_TOOLTIP: 'Inicializovat přijímač RC s ID párování (1-255) a kanálem (1-11)',
	RC_WAIT_CONNECTION: 'Čekat na párování',
	RC_WAIT_TIMEOUT: 'timeout',
	RC_WAIT_SECONDS: 'sek',
	RC_WAIT_TOOLTIP: 'Čekat na připojení vysílače, LED bliká modře, pokračovat po timeout',

	// Bloky čtení dat RC
	RC_GET_JOYSTICK_PREFIX: 'RC joystick',
	RC_GET_JOYSTICK_TOOLTIP: 'Číst hodnotu joysticku (0-4095), 2048 je střed',
	RC_GET_JOYSTICK_MAPPED_PREFIX: 'RC joystick',
	RC_GET_JOYSTICK_MAPPED_MIN: 'mapovat na',
	RC_GET_JOYSTICK_MAPPED_MAX: '~',
	RC_GET_JOYSTICK_MAPPED_TOOLTIP: 'Číst joystick a mapovat na určený rozsah',
	RC_GET_BUTTON_PREFIX: 'RC tlačítko',
	RC_GET_BUTTON_SUFFIX: 'stav',
	RC_GET_BUTTON_TOOLTIP: 'Číst stav tlačítka (0=stisknuto, 1=uvolněno)',
	RC_IS_BUTTON_PRESSED_PREFIX: 'RC tlačítko',
	RC_IS_BUTTON_PRESSED_SUFFIX: 'stisknuto?',
	RC_IS_BUTTON_PRESSED_TOOLTIP: 'Zkontrolovat zda je tlačítko stisknuto',

	// Bloky stavu RC
	RC_IS_CONNECTED: 'RC připojeno?',
	RC_IS_CONNECTED_TOOLTIP: 'Zkontrolovat zda byla přijata data za 500ms',
});

