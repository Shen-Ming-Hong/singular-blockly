/**
 * @license
 * Copyright 2024 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file contains translations derived from Blockly project
 * Copyright 2012 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

// Define translations for German
window.languageManager.loadMessages('de', {
	// UI Elements
	BLOCKS_TAB: 'Blöcke',
	CODE_TAB: 'Code',
	BOARD_SELECT_LABEL: 'Board auswählen:',

	// Board Names
	BOARD_NONE: 'Keine',
	BOARD_UNO: 'Arduino Uno',
	BOARD_NANO: 'Arduino Nano',
	BOARD_MEGA: 'Arduino Mega',
	BOARD_ESP32: 'ESP32',
	BOARD_SUPERMINI: 'Super Mini',

	// Block Categories
	CATEGORY_LOGIC: 'Logik',
	CATEGORY_LOOPS: 'Schleifen',
	CATEGORY_MATH: 'Mathematik',
	CATEGORY_TEXT: 'Text',
	CATEGORY_LISTS: 'Listen',
	CATEGORY_VARIABLES: 'Variablen',
	CATEGORY_FUNCTIONS: 'Funktionen',
	CATEGORY_ARDUINO: 'Arduino',

	// Arduino Block Labels
	ARDUINO_SETUP: 'Setup',
	ARDUINO_LOOP: 'Schleife',
	ARDUINO_DIGITAL_WRITE: 'Digital Schreiben',
	ARDUINO_DIGITAL_READ: 'Digital Lesen',
	ARDUINO_ANALOG_WRITE: 'Analog Schreiben',
	ARDUINO_ANALOG_READ: 'Analog Lesen',
	ARDUINO_PIN: 'Pin',
	ARDUINO_VALUE: 'Wert',
	ARDUINO_DELAY: 'Verzögerung',
	ARDUINO_DELAY_MS: 'Millisekunden',
	ARDUINO_PULLUP: 'Internen Pullup aktivieren',
	ARDUINO_MODE: 'Modus',
	ARDUINO_MODE_INPUT: 'EINGANG',
	ARDUINO_MODE_OUTPUT: 'AUSGANG',

	// Threshold Function Block Labels
	THRESHOLD_PIN: 'bei',
	THRESHOLD_VALUE: 'wenn >',
	THRESHOLD_HIGH_VALUE: '=',
	THRESHOLD_LOW_VALUE: 'sonst',
	THRESHOLD_TOOLTIP_SETUP:
		'Konfiguriert eine Schwellenwertfunktion. Wenn der Analogeingang den Schwellenwert überschreitet, wird der erste Ausgabewert zurückgegeben, andernfalls der zweite.',
	THRESHOLD_TOOLTIP_READ: 'Ruft den Wert der Schwellenwertfunktion ab',

	// Duration block
	DURATION_REPEAT: 'Wiederhole für',
	DURATION_TIME: 'Zeit',
	DURATION_MS: 'Millisekunden',
	DURATION_DO: 'mache',

	// Print block
	TEXT_PRINT_SHOW: 'ausgeben',
	TEXT_PRINT_NEWLINE: 'Zeilenumbruch',

	// Pin Mode block
	PIN_MODE_SET: 'setze',

	// Function Block Labels
	FUNCTION_CREATE: 'Funktion erstellen',
	FUNCTION_NAME: 'Name',
	FUNCTION_PARAMS: 'Parameter',
	FUNCTION_RETURN: 'Rückgabe',
	FUNCTION_CALL: 'Aufruf',

	// Logic Block Labels
	LOGIC_IF: 'wenn',
	LOGIC_ELSE: 'sonst',
	LOGIC_THEN: 'dann',
	LOGIC_AND: 'und',
	LOGIC_OR: 'oder',
	LOGIC_NOT: 'nicht',
	LOGIC_TRUE: 'wahr',
	LOGIC_FALSE: 'falsch',

	// Loop Block Labels
	LOOP_REPEAT: 'wiederhole',
	LOOP_WHILE: 'während',
	LOOP_UNTIL: 'bis',
	LOOP_FOR: 'für',
	LOOP_FOREACH: 'für jedes',
	LOOP_BREAK: 'abbrechen',
	LOOP_CONTINUE: 'fortfahren',

	// Math Block Labels
	MATH_NUMBER: 'Zahl',
	MATH_ARITHMETIC: 'Arithmetik',
	MATH_OPERATIONS: 'Operationen',
	MATH_ADD: 'addieren',
	MATH_SUBTRACT: 'subtrahieren',
	MATH_MULTIPLY: 'multiplizieren',
	MATH_DIVIDE: 'dividieren',
	MATH_POWER: 'Potenz',

	// Math Map Block
	MATH_MAP_VALUE: 'abbilden',
	MATH_MAP_TOOLTIP:
		'Bildet eine Zahl von einem Bereich auf einen anderen ab. Zum Beispiel wird map(Wert, 0, 1023, 0, 255) einen analogen Eingang auf einen 8-Bit-PWM-Ausgang skalieren.',

	// VS Code UI Messages
	VSCODE_OPEN_FOLDER: 'Ordner öffnen',
	VSCODE_PLEASE_OPEN_PROJECT: 'Bitte öffnen Sie zuerst einen Projektordner!',
	VSCODE_FAILED_SAVE_FILE: 'Datei konnte nicht gespeichert werden: {0}',
	VSCODE_FAILED_UPDATE_INI: 'Aktualisierung von platformio.ini fehlgeschlagen: {0}',
	VSCODE_UNABLE_SAVE_WORKSPACE: 'Arbeitsbereichsstatus konnte nicht gespeichert werden: {0}',
	VSCODE_FAILED_START: 'Start von Singular Blockly fehlgeschlagen: {0}',
	VSCODE_CONFIRM_DELETE_VARIABLE: 'Möchten Sie die Variable "{0}" wirklich löschen?',
	VSCODE_BOARD_UPDATED: 'Board-Konfiguration aktualisiert auf: {0}',
	VSCODE_RELOAD_REQUIRED: '，Bitte Fenster neu laden, um die Einrichtung abzuschließen',
	VSCODE_ENTER_VARIABLE_NAME: 'Neuen Variablennamen eingeben',
	VSCODE_ENTER_NEW_VARIABLE_NAME: 'Neuen Variablennamen eingeben (aktuell: {0})',
	VSCODE_VARIABLE_NAME_EMPTY: 'Variablenname darf nicht leer sein',
	VSCODE_VARIABLE_NAME_INVALID: 'Variablenname darf nur Buchstaben, Zahlen und Unterstriche enthalten und nicht mit einer Zahl beginnen',
	VSCODE_RELOAD: 'Neu laden',
	VSCODE_OK: 'OK',
	VSCODE_CANCEL: 'Abbrechen',
	VSCODE_OPEN_BLOCKLY_EDITOR: 'Blockly-Editor öffnen',

	// Error Messages
	ERROR_BOARD_NOT_SELECTED: 'Bitte zuerst ein Board auswählen',
	ERROR_INVALID_PIN: 'Ungültige Pin-Nummer',
	ERROR_INVALID_VALUE: 'Ungültiger Wert',
	ERROR_MISSING_TRANSLATION: 'Übersetzung fehlt',

	// Blockly core messages
	ADD: 'hinzufügen',
	REMOVE: 'entfernen',
	RENAME: 'umbenennen',
	NEW: 'neu',
	ADD_COMMENT: 'Kommentar hinzufügen',
	REMOVE_COMMENT: 'Kommentar entfernen',
	DUPLICATE_BLOCK: 'Duplizieren',
	HELP: 'Hilfe',
	UNDO: 'Rückgängig',
	REDO: 'Wiederherstellen',
	COLLAPSE_BLOCK: 'Block einklappen',
	EXPAND_BLOCK: 'Block ausklappen',
	DELETE_BLOCK: 'Block löschen',
	DELETE_X_BLOCKS: '%1 Blöcke löschen',
	DELETE_ALL_BLOCKS: 'Alle %1 Blöcke löschen?',
	CLEAN_UP: 'Blöcke aufräumen',
	COLLAPSE_ALL: 'Blöcke einklappen',
	EXPAND_ALL: 'Blöcke ausklappen',
	DISABLE_BLOCK: 'Block deaktivieren',
	ENABLE_BLOCK: 'Block aktivieren',
	INLINE_INPUTS: 'Inline-Eingaben',
	EXTERNAL_INPUTS: 'Externe Eingaben',

	// Variable & Function messages
	RENAME_VARIABLE: 'Variable umbenennen...',
	NEW_VARIABLE: 'Variable erstellen...',
	DELETE_VARIABLE: 'Variable %1 löschen',
	PROCEDURE_ALREADY_EXISTS: 'Eine Prozedur mit dem Namen "%1" existiert bereits.',

	// Logic block messages
	CONTROLS_IF_MSG_IF: 'wenn',
	CONTROLS_IF_MSG_THEN: 'dann',
	CONTROLS_IF_MSG_ELSE: 'sonst',
	CONTROLS_IF_MSG_ELSEIF: 'sonst wenn',
	CONTROLS_IF_IF_TITLE_IF: 'wenn',
	CONTROLS_IF_ELSEIF_TITLE_ELSEIF: 'sonst wenn',
	CONTROLS_IF_ELSE_TITLE_ELSE: 'sonst',
	LOGIC_COMPARE_TOOLTIP_EQ: 'Gibt wahr zurück, wenn beide Eingaben gleich sind.',
	LOGIC_COMPARE_TOOLTIP_NEQ: 'Gibt wahr zurück, wenn beide Eingaben ungleich sind.',
	LOGIC_COMPARE_TOOLTIP_LT: 'Gibt wahr zurück, wenn die erste Eingabe kleiner als die zweite Eingabe ist.',
	LOGIC_COMPARE_TOOLTIP_LTE: 'Gibt wahr zurück, wenn die erste Eingabe kleiner oder gleich der zweiten Eingabe ist.',
	LOGIC_COMPARE_TOOLTIP_GT: 'Gibt wahr zurück, wenn die erste Eingabe größer als die zweite Eingabe ist.',
	LOGIC_COMPARE_TOOLTIP_GTE: 'Gibt wahr zurück, wenn die erste Eingabe größer oder gleich der zweiten Eingabe ist.',
	LOGIC_OPERATION_AND: 'und',
	LOGIC_OPERATION_OR: 'oder',
	LOGIC_NEGATE_TITLE: 'nicht %1',
	LOGIC_BOOLEAN_TRUE: 'wahr',
	LOGIC_BOOLEAN_FALSE: 'falsch',
	LOGIC_NULL: 'null',

	// Additional Logic Block Messages
	LOGIC_COMPARE_HELPURL: 'https://de.wikipedia.org/wiki/Ungleichung_(Mathematik)',
	LOGIC_NEGATE_HELPURL: 'https://github.com/google/blockly/wiki/Logic#not',
	LOGIC_NEGATE_TOOLTIP: 'Gibt wahr zurück, wenn die Eingabe falsch ist. Gibt falsch zurück, wenn die Eingabe wahr ist.',
	LOGIC_OPERATION_TOOLTIP_AND: 'Gibt wahr zurück, wenn beide Eingaben wahr sind.',
	LOGIC_OPERATION_TOOLTIP_OR: 'Gibt wahr zurück, wenn mindestens eine der Eingaben wahr ist.',
	LOGIC_BOOLEAN_TOOLTIP: 'Gibt entweder wahr oder falsch zurück.',

	// Loop block messages
	CONTROLS_REPEAT_TITLE: 'wiederhole %1 mal',
	CONTROLS_WHILEUNTIL_OPERATOR_WHILE: 'wiederhole solange',
	CONTROLS_WHILEUNTIL_OPERATOR_UNTIL: 'wiederhole bis',
	CONTROLS_FOR_TITLE: 'zähle mit %1 von %2 bis %3 mit Schritt %4',
	CONTROLS_FLOW_STATEMENTS_OPERATOR_BREAK: 'Schleife abbrechen',
	CONTROLS_FLOW_STATEMENTS_OPERATOR_CONTINUE: 'mit nächster Iteration fortfahren',
	CONTROLS_REPEAT_TOOLTIP: 'Führt Anweisungen mehrmals aus.',
	CONTROLS_WHILEUNTIL_TOOLTIP_WHILE: 'Führt Anweisungen aus, solange ein Wert wahr ist.',
	CONTROLS_WHILEUNTIL_TOOLTIP_UNTIL: 'Führt Anweisungen aus, solange ein Wert falsch ist.',
	CONTROLS_FOR_TOOLTIP: 'Zählt von einer Startzahl bis zu einer Endzahl mit dem angegebenen Intervall.',
	CONTROLS_FLOW_STATEMENTS_WARNING: 'Warnung: Dieser Block kann nur in einer Schleife verwendet werden.',

	// Math block messages
	MATH_NUMBER_HELPURL: 'https://de.wikipedia.org/wiki/Zahl',
	MATH_NUMBER_TOOLTIP: 'Eine Zahl.',
	MATH_ARITHMETIC_OPERATOR_ADD: '+',
	MATH_ARITHMETIC_OPERATOR_MINUS: '-',
	MATH_ARITHMETIC_OPERATOR_MULTIPLY: '×',
	MATH_ARITHMETIC_OPERATOR_DIVIDE: '÷',
	MATH_ARITHMETIC_OPERATOR_POWER: '^',
	MATH_SINGLE_OPERATOR_ROOT: 'Quadratwurzel',
	MATH_SINGLE_OPERATOR_ABSOLUTE: 'Betrag',
	MATH_IS_EVEN: 'ist gerade',
	MATH_IS_ODD: 'ist ungerade',
	MATH_IS_PRIME: 'ist eine Primzahl',
	MATH_IS_WHOLE: 'ist eine ganze Zahl',
	MATH_IS_POSITIVE: 'ist positiv',
	MATH_IS_NEGATIVE: 'ist negativ',
	MATH_ARITHMETIC_HELPURL: 'https://de.wikipedia.org/wiki/Grundrechenart',
	MATH_ARITHMETIC_TOOLTIP_ADD: 'Gibt die Summe der beiden Zahlen zurück.',
	MATH_ARITHMETIC_TOOLTIP_MINUS: 'Gibt die Differenz der beiden Zahlen zurück.',
	MATH_ARITHMETIC_TOOLTIP_MULTIPLY: 'Gibt das Produkt der beiden Zahlen zurück.',
	MATH_ARITHMETIC_TOOLTIP_DIVIDE: 'Gibt den Quotienten der beiden Zahlen zurück.',
	MATH_ARITHMETIC_TOOLTIP_POWER: 'Gibt die erste Zahl potenziert mit der zweiten Zahl zurück.',

	// Text block messages
	TEXT_JOIN_TITLE_CREATEWITH: 'Erstelle Text mit',
	TEXT_CREATE_JOIN_TITLE_JOIN: 'verbinden',
	TEXT_LENGTH_TITLE: 'Länge von %1',
	TEXT_ISEMPTY_TITLE: '%1 ist leer',
	TEXT_INDEXOF_OPERATOR_FIRST: 'suche erstes Vorkommen des Texts',
	TEXT_INDEXOF_OPERATOR_LAST: 'suche letztes Vorkommen des Texts',
	TEXT_CHARAT_FROM_START: 'hole Buchstabe #',
	TEXT_CHARAT_FROM_END: 'hole Buchstabe # von hinten',
	TEXT_CHARAT_FIRST: 'hole ersten Buchstaben',
	TEXT_CHARAT_LAST: 'hole letzten Buchstaben',
	TEXT_CHARAT_RANDOM: 'hole zufälligen Buchstaben',
	TEXT_JOIN_TOOLTIP: 'Erstellt einen Text durch Zusammenfügen beliebig vieler Elemente.',
	TEXT_APPEND_VARIABLE: 'Element',
	TEXT_APPEND_TOOLTIP: 'Text an Variable "%1" anhängen.',
	TEXT_LENGTH_TOOLTIP: 'Gibt die Anzahl der Buchstaben (einschließlich Leerzeichen) im angegebenen Text zurück.',
	TEXT_ISEMPTY_TOOLTIP: 'Gibt wahr zurück, wenn der angegebene Text leer ist.',

	// List block messages
	LISTS_CREATE_EMPTY_TITLE: 'erstelle leere Liste',
	LISTS_CREATE_WITH_INPUT_WITH: 'erstelle Liste mit',
	LISTS_LENGTH_TITLE: 'Länge von %1',
	LISTS_ISEMPTY_TITLE: '%1 ist leer',
	LISTS_INDEXOF_FIRST: 'suche erstes Vorkommen von',
	LISTS_INDEXOF_LAST: 'suche letztes Vorkommen von',
	LISTS_GET_INDEX_GET: 'hole',
	LISTS_GET_INDEX_REMOVE: 'entferne',
	LISTS_GET_INDEX_FROM_START: '#',
	LISTS_GET_INDEX_FROM_END: '# von hinten',
	LISTS_GET_INDEX_FIRST: 'erstes',
	LISTS_GET_INDEX_LAST: 'letztes',
	LISTS_GET_INDEX_RANDOM: 'zufälliges',
	LISTS_CREATE_WITH_TOOLTIP: 'Erstellt eine Liste mit beliebig vielen Elementen.',
	LISTS_CREATE_EMPTY_TOOLTIP: 'Gibt eine leere Liste der Länge 0 zurück',
	LISTS_LENGTH_TOOLTIP: 'Gibt die Länge einer Liste zurück.',
	LISTS_ISEMPTY_TOOLTIP: 'Gibt wahr zurück, wenn die Liste leer ist.',

	// Variables
	VARIABLES_SET: '%1 auf %2 setzen',
	VARIABLES_GET: '%1',
	VARIABLES_DEFAULT_NAME: 'Element',

	// If conditions
	CONTROLS_IF_TOOLTIP_1: 'Wenn ein Wert wahr ist, dann führe einige Anweisungen aus.',
	CONTROLS_IF_TOOLTIP_2:
		'Wenn ein Wert wahr ist, dann führe den ersten Anweisungsblock aus. Ansonsten führe den zweiten Anweisungsblock aus.',
	CONTROLS_IF_TOOLTIP_3:
		'Wenn der erste Wert wahr ist, dann führe den ersten Anweisungsblock aus. Ansonsten, wenn der zweite Wert wahr ist, führe den zweiten Anweisungsblock aus.',
	CONTROLS_IF_TOOLTIP_4:
		'Wenn der erste Wert wahr ist, dann führe den ersten Anweisungsblock aus. Ansonsten, wenn der zweite Wert wahr ist, führe den zweiten Anweisungsblock aus. Wenn keiner der Werte wahr ist, führe den letzten Anweisungsblock aus.',

	// Procedures
	PROCEDURES_DEFNORETURN_TITLE: '',
	PROCEDURES_DEFNORETURN_PROCEDURE: 'etwas tun',
	PROCEDURES_BEFORE_PARAMS: 'mit:',
	PROCEDURES_CALL_BEFORE_PARAMS: 'mit:',
	PROCEDURES_DEFNORETURN_DO: '',
	PROCEDURES_DEFNORETURN_TOOLTIP: 'Erstellt eine Funktion ohne Rückgabewert.',
	PROCEDURES_DEFRETURN_RETURN: 'zurückgeben',
	PROCEDURES_DEFRETURN_TOOLTIP: 'Erstellt eine Funktion mit einem Rückgabewert.',
	PROCEDURES_DEFRETURN_COMMENT: 'Beschreibe diese Funktion...',
	PROCEDURES_DEFRETURN_PROCEDURE: 'etwas mit Rückgabe tun',
	PROCEDURES_DEFRETURN_DO: '',
	PROCEDURES_CALLNORETURN_HELPURL: 'https://de.wikipedia.org/wiki/Unterprogramm',
	PROCEDURES_CALLNORETURN_TOOLTIP: 'Führe die benutzerdefinierte Funktion aus.',
	PROCEDURES_CALLRETURN_HELPURL: 'https://de.wikipedia.org/wiki/Unterprogramm',
	PROCEDURES_CALLRETURN_TOOLTIP: 'Führe die benutzerdefinierte Funktion aus und verwende ihre Ausgabe.',

	// Seven Segment Display
	SEVEN_SEGMENT_DISPLAY: 'Siebensegmentanzeige',
	SEVEN_SEGMENT_COMMON_CATHODE: 'Gemeinsame Kathode',
	SEVEN_SEGMENT_COMMON_ANODE: 'Gemeinsame Anode',
	SEVEN_SEGMENT_NUMBER: 'Nummer (0-9):',
	SEVEN_SEGMENT_DECIMAL_POINT: 'Dezimalpunkt',
	SEVEN_SEGMENT_TOOLTIP: 'Zeigt eine Zahl (0-9) auf einer Siebensegmentanzeige mit optionalem Dezimalpunkt an.',
	// Seven Segment Display Pins
	SEVEN_SEGMENT_PINS_SET: 'Siebensegmentanzeige-Pins einstellen',
	SEVEN_SEGMENT_PINS_TOOLTIP: 'Konfiguriere Pins für jedes Segment (A-G) und den Dezimalpunkt (DP) der Siebensegmentanzeige.',
});
