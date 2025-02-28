/**
 * @license
 * Copyright 2024 Singular Blockly Contributors
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

	// Board Names
	BOARD_NONE: 'Žádná',
	BOARD_UNO: 'Arduino Uno',
	BOARD_NANO: 'Arduino Nano',
	BOARD_MEGA: 'Arduino Mega',
	BOARD_ESP32: 'ESP32',
	BOARD_SUPERMINI: 'Super Mini',

	// Block Categories
	CATEGORY_LOGIC: 'Logika',
	CATEGORY_LOOPS: 'Smyčky',
	CATEGORY_MATH: 'Matematika',
	CATEGORY_TEXT: 'Text',
	CATEGORY_LISTS: 'Seznamy',
	CATEGORY_VARIABLES: 'Proměnné',
	CATEGORY_FUNCTIONS: 'Funkce',
	CATEGORY_ARDUINO: 'Arduino',

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
	ARDUINO_PULLUP: 'Povolit interní pullup',
	ARDUINO_MODE: 'Režim',
	ARDUINO_MODE_INPUT: 'VSTUP',
	ARDUINO_MODE_OUTPUT: 'VÝSTUP',

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

	// Error Messages
	ERROR_BOARD_NOT_SELECTED: 'Prosím nejprve vyberte desku',
	ERROR_INVALID_PIN: 'Neplatné číslo pinu',
	ERROR_INVALID_VALUE: 'Neplatná hodnota',
	ERROR_MISSING_TRANSLATION: 'Chybí překlad',

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
});
