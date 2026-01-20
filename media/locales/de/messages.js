/**
 * @license
 * Copyright 2025 Singular Blockly Contributors
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
	LANGUAGE_SELECT_TOOLTIP: 'Sprache auswählen',
	LANGUAGE_AUTO: 'Auto (VS Code folgen)',

	// Experimental Blocks Notice
	EXPERIMENTAL_BLOCKS_TITLE: 'Experimentelle Blöcke erkannt',
	EXPERIMENTAL_BLOCKS_DESC:
		'Ihr Arbeitsbereich enthält experimentelle Blöcke (mit gelben gestrichelten Rändern markiert). Diese Funktionen können sich in zukünftigen Updates ändern oder entfernt werden, nutzen Sie sie mit Vorsicht.',

	// Preview Mode UI
	PREVIEW_BADGE: 'Vorschau',
	THEME_TOGGLE: 'Design wechseln',
	PREVIEW_WINDOW_TITLE: 'Blockly Vorschau - {0}',
	PREVIEW_WINDOW_TITLE_WITH_NAME: 'Vorschau - {0}',

	// Backup Modal UI
	BACKUP_MANAGER_TITLE: 'Backup-Verwaltung',
	BACKUP_CREATE_NEW: 'Neues Backup erstellen',
	BACKUP_NAME_LABEL: 'Backup-Name:',
	BACKUP_NAME_PLACEHOLDER: 'Backup-Namen eingeben',
	BACKUP_CONFIRM: 'Bestätigen',
	BACKUP_CANCEL: 'Abbrechen',
	BACKUP_LIST_TITLE: 'Backup-Liste',
	BACKUP_LIST_EMPTY: 'Keine Backups vorhanden',
	BACKUP_BUTTON_TITLE: 'Backup-Verwaltung',
	REFRESH_BUTTON_TITLE: 'Code aktualisieren',
	BACKUP_PREVIEW_BTN: 'Vorschau',
	BACKUP_RESTORE_BTN: 'Wiederherstellen',
	BACKUP_DELETE_BTN: 'Löschen',
	AUTO_BACKUP_TITLE: 'Automatische Backup-Einstellungen',
	AUTO_BACKUP_INTERVAL_LABEL: 'Backup-Intervall:',
	AUTO_BACKUP_MINUTES: 'Minuten',
	AUTO_BACKUP_SAVE: 'Einstellungen speichern',
	AUTO_BACKUP_SAVED: 'Automatische Backup-Einstellungen gespeichert',
	AUTO_BACKUP_PREFIX: 'auto_',
	MANUAL_BACKUP_TITLE: 'Manuelles Backup',

	// Board Names
	BOARD_NONE: 'Keine',
	BOARD_UNO: 'Arduino Uno',
	BOARD_NANO: 'Arduino Nano',
	BOARD_MEGA: 'Arduino Mega',
	BOARD_ESP32: 'ESP32',
	BOARD_SUPERMINI: 'Super Mini',
	// Block Search UI
	FUNCTION_SEARCH_TITLE: 'Blöcke suchen',
	FUNCTION_SEARCH_BUTTON_TITLE: 'Blöcke suchen',
	FUNCTION_SEARCH_PLACEHOLDER: 'Blockname oder Parameter eingeben...',
	FUNCTION_SEARCH_BTN: 'Suchen',
	FUNCTION_SEARCH_PREV: 'Vorheriger',
	FUNCTION_SEARCH_NEXT: 'Nächster',
	FUNCTION_SEARCH_EMPTY: 'Noch nicht gesucht',
	FUNCTION_SEARCH_NO_RESULTS: 'Keine passenden Blöcke gefunden',
	FUNCTION_RESULT_PREFIX: 'Block: ',
	FUNCTION_KEYBOARD_SHORTCUT_TIP: '(Tastenkürzel: Strg+F)',
	FUNCTION_SEARCH_HISTORY_TITLE: 'Suchverlauf',

	// Block Categories
	CATEGORY_LOGIC: 'Logik',
	CATEGORY_LOOPS: 'Schleifen',
	CATEGORY_MATH: 'Mathematik',
	CATEGORY_TEXT: 'Text',
	CATEGORY_LISTS: 'Listen',
	CATEGORY_VARIABLES: 'Variablen',
	CATEGORY_FUNCTIONS: 'Funktionen',
	CATEGORY_ARDUINO: 'Arduino',
	CATEGORY_SENSORS: 'Sensoren',
	CATEGORY_MOTORS: 'Motoren',
	VISION_SENSORS_CATEGORY: 'Bildverarbeitung',
	// Servo Block Labels
	SERVO_SETUP: 'Servomotor einrichten',
	SERVO_PIN: 'Pin',
	SERVO_SETUP_TOOLTIP: 'Servomotor-Variable deklarieren und Pin festlegen',
	SERVO_MOVE: 'Servomotor drehen',
	SERVO_ANGLE: 'Winkel',
	SERVO_MOVE_TOOLTIP: 'Servomotor auf bestimmten Winkel drehen',
	SERVO_STOP: 'Servomotor stoppen',
	SERVO_STOP_TOOLTIP: 'Ausgangssignal des Servomotors stoppen',

	// Encoder Motor Control
	ENCODER_SETUP: 'Encoder-Motor einrichten',
	ENCODER_NAME: 'Name',
	ENCODER_PIN_A: 'Pin A',
	ENCODER_PIN_B: 'Pin B',
	ENCODER_USE_INTERRUPT: 'Interrupt verwenden',
	ENCODER_SETUP_TOOLTIP: 'Encoder-Motor mit Namens- und Pin-Konfigurationen einrichten',
	ENCODER_READ: 'Encoder lesen',
	ENCODER_READ_TOOLTIP: 'Aktuelle Position des Encoders abrufen',
	ENCODER_RESET: 'Encoder zurücksetzen',
	ENCODER_RESET_TOOLTIP: 'Encoder-Position auf Null zurücksetzen',
	ENCODER_PID_SETUP: 'PID-Steuerung einrichten',
	ENCODER_PID_MOTOR: 'Motor',
	ENCODER_PID_KP: 'Kp',
	ENCODER_PID_KI: 'Ki',
	ENCODER_PID_KD: 'Kd',
	ENCODER_PID_MODE: 'Modus',
	ENCODER_PID_MODE_POSITION: 'Position',
	ENCODER_PID_MODE_SPEED: 'Geschwindigkeit',
	ENCODER_PID_SETUP_TOOLTIP: 'PID-Regelung für präzise Motorsteuerung konfigurieren. Wählen Sie Positions- oder Geschwindigkeitsmodus.',
	ENCODER_PID_COMPUTE: 'PID berechnen',
	ENCODER_PID_TARGET: 'Ziel',
	ENCODER_PID_COMPUTE_TOOLTIP: 'PID-Steuerungsausgabe basierend auf Zielposition berechnen',
	ENCODER_PID_RESET: 'PID zurücksetzen',
	ENCODER_PID_RESET_TOOLTIP: 'PID-Regler-Status zurücksetzen (Integralakkumulation löschen, Zähler zurücksetzen)',

	// Arduino Block Labels
	ARDUINO_SETUP: 'Setup',
	ARDUINO_LOOP: 'Schleife',
	ARDUINO_DIGITAL_WRITE: 'Digitales Schreiben',
	ARDUINO_DIGITAL_READ: 'Digitales Lesen',
	ARDUINO_ANALOG_WRITE: 'Analoges Schreiben',
	ARDUINO_ANALOG_READ: 'Analoges Lesen',
	ARDUINO_PIN: 'Pin',
	ARDUINO_VALUE: 'Wert',
	ARDUINO_DELAY: 'Verzögerung',
	ARDUINO_DELAY_MS: 'Millisekunden',
	ARDUINO_PULLUP: 'Internen Pullup aktivieren',
	ARDUINO_MODE: 'Modus',
	ARDUINO_MODE_INPUT: 'EINGANG',
	ARDUINO_MODE_OUTPUT: 'AUSGANG',

	// Sensor Block Labels
	ULTRASONIC_SENSOR: 'Ultraschallsensor',
	ULTRASONIC_TRIG_PIN: 'Trig Pin',
	ULTRASONIC_ECHO_PIN: 'Echo Pin',
	ULTRASONIC_USE_INTERRUPT: 'Hardware-Interrupt verwenden',
	ULTRASONIC_READ: 'Ultraschall-Entfernung lesen (cm)',
	ULTRASONIC_TOOLTIP_SETUP:
		'Konfiguriert den Ultraschallsensor mit Trig- und Echo-Pins. Optionaler Hardware-Interrupt für höhere Genauigkeit.',
	ULTRASONIC_TOOLTIP_READ: 'Liest die vom Ultraschallsensor gemessene Entfernung in Zentimetern.',
	ULTRASONIC_WARNING: 'Der ausgewählte Echo-Pin {0} unterstützt keine Hardware-Interrupts. Bitte wählen Sie einen dieser Pins: {1}',

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
	CONTROLS_REPEAT_INPUT_DO: 'mache',
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
	// Pixetto Smart Camera
	PIXETTO_INIT: 'Pixetto Smart-Kamera initialisieren',
	PIXETTO_RX_PIN: 'RX-Pin',
	PIXETTO_TX_PIN: 'TX-Pin',
	PIXETTO_IS_DETECTED: 'Pixetto Objekt erkannt',
	PIXETTO_GET_TYPE_ID: 'Pixetto Typ-ID abrufen',
	PIXETTO_GET_FUNC_ID: 'Pixetto Funktions-ID abrufen',
	PIXETTO_COLOR_DETECT: 'Pixetto Farberkennung',
	PIXETTO_SHAPE_DETECT: 'Pixetto Formerkennung',
	PIXETTO_FACE_DETECT: 'Pixetto Gesichtserkennung',
	PIXETTO_APRILTAG_DETECT: 'Pixetto AprilTag-Erkennung',
	PIXETTO_NEURAL_NETWORK: 'Pixetto Neuronales Netzwerk Erkennung',
	PIXETTO_HANDWRITTEN_DIGIT: 'Pixetto Handgeschriebene Ziffer erkennen',
	PIXETTO_GET_POSITION: 'Pixetto Erkanntes Objekt abrufen',
	PIXETTO_ROAD_DETECT: 'Pixetto Straßenerkennung',
	PIXETTO_SET_MODE: 'Pixetto Funktionsmodus einstellen',
	PIXETTO_COLOR: 'Farbe',
	PIXETTO_SHAPE: 'Form',
	PIXETTO_MODE: 'Modus',
	PIXETTO_TAG_ID: 'Tag-ID',
	PIXETTO_CLASS_ID: 'Klassen-ID',
	PIXETTO_DIGIT: 'Ziffer',
	PIXETTO_COORDINATE: 'Koordinate',
	PIXETTO_ROAD_INFO: 'Information',
	// Vision Sensors Category Labels
	PIXETTO_LABEL: 'Pixetto',
	HUSKYLENS_LABEL: 'HUSKYLENS',

	// Pixetto Tooltips
	PIXETTO_INIT_TOOLTIP: 'Pixetto Smart-Kamera initialisieren und UART-Kommunikations-Pins einstellen',
	PIXETTO_IS_DETECTED_TOOLTIP: 'Erkennen, ob Pixetto ein Objekt detektiert',
	PIXETTO_GET_TYPE_ID_TOOLTIP: 'Typ-ID des von Pixetto erkannten Objekts abrufen (Farbe, Form usw.)',
	PIXETTO_GET_FUNC_ID_TOOLTIP: 'ID der aktuell von Pixetto verwendeten Funktion abrufen (Farberkennung, Formerkennung usw.)',
	PIXETTO_COLOR_DETECT_TOOLTIP: 'Erkennen, ob Pixetto ein Objekt der angegebenen Farbe erkennt',
	PIXETTO_SHAPE_DETECT_TOOLTIP: 'Erkennen, ob Pixetto ein Objekt der angegebenen Form erkennt',
	PIXETTO_FACE_DETECT_TOOLTIP: 'Erkennen, ob Pixetto ein Gesicht erkennt',
	PIXETTO_APRILTAG_DETECT_TOOLTIP: 'Erkennen, ob Pixetto einen AprilTag mit angegebener ID erkennt',
	PIXETTO_NEURAL_NETWORK_TOOLTIP: 'Erkennen, ob das Pixetto-Neuronale-Netzwerk ein Objekt der angegebenen Klasse erkennt',
	PIXETTO_HANDWRITTEN_DIGIT_TOOLTIP: 'Erkennen, ob Pixetto eine angegebene handgeschriebene Ziffer erkennt',
	PIXETTO_GET_POSITION_TOOLTIP: 'Position oder Größeninformationen des von Pixetto erkannten Objekts abrufen',
	PIXETTO_ROAD_DETECT_TOOLTIP: 'Straßenerkennungsbezogene Informationen von Pixetto abrufen',
	PIXETTO_SET_MODE_TOOLTIP: 'Funktionsmodus der Pixetto Smart-Kamera einstellen',

	// Pixetto Color Options
	PIXETTO_COLOR_RED: 'Rot',
	PIXETTO_COLOR_BLUE: 'Blau',
	PIXETTO_COLOR_GREEN: 'Grün',
	PIXETTO_COLOR_YELLOW: 'Gelb',
	PIXETTO_COLOR_ORANGE: 'Orange',
	PIXETTO_COLOR_PURPLE: 'Lila',
	PIXETTO_COLOR_BLACK: 'Schwarz',
	PIXETTO_COLOR_WHITE: 'Weiß',

	// Pixetto Shape Options
	PIXETTO_SHAPE_TRIANGLE: 'Dreieck',
	PIXETTO_SHAPE_RECTANGLE: 'Rechteck',
	PIXETTO_SHAPE_PENTAGON: 'Fünfeck',
	PIXETTO_SHAPE_HEXAGON: 'Sechseck',
	PIXETTO_SHAPE_CIRCLE: 'Kreis',

	// Pixetto Position Options
	PIXETTO_POSITION_X: 'X-Koordinate',
	PIXETTO_POSITION_Y: 'Y-Koordinate',
	PIXETTO_POSITION_WIDTH: 'Breite',
	PIXETTO_POSITION_HEIGHT: 'Höhe',

	// Pixetto Road Info Options
	PIXETTO_ROAD_CENTER_X: 'Mitte X',
	PIXETTO_ROAD_CENTER_Y: 'Mitte Y',
	PIXETTO_ROAD_LEFT_X: 'Linke Grenze X',
	PIXETTO_ROAD_RIGHT_X: 'Rechte Grenze X',

	// Pixetto Mode Options
	PIXETTO_MODE_COLOR_DETECTION: 'Farberkennung',
	PIXETTO_MODE_SHAPE_DETECTION: 'Formerkennung',
	PIXETTO_MODE_FACE_DETECTION: 'Gesichtserkennung',
	PIXETTO_MODE_APRILTAG_DETECTION: 'AprilTag-Erkennung',
	PIXETTO_MODE_NEURAL_NETWORK: 'Neuronales Netzwerk',
	PIXETTO_MODE_HANDWRITTEN_DIGIT: 'Handgeschriebene Ziffer',
	PIXETTO_MODE_ROAD_DETECTION: 'Straßenerkennung',
	PIXETTO_MODE_BALL_DETECTION: 'Ballerkennung',
	PIXETTO_MODE_TEMPLATE_MATCHING: 'Vorlagenabgleich',

	// HUSKYLENS Smart Camera
	HUSKYLENS_INIT_I2C: 'HUSKYLENS initialisieren (I2C)',
	HUSKYLENS_INIT_UART: 'HUSKYLENS initialisieren (UART)',
	HUSKYLENS_RX_PIN: 'Mit HuskyLens TX verbinden →',
	HUSKYLENS_TX_PIN: 'Mit HuskyLens RX verbinden →',
	HUSKYLENS_SET_ALGORITHM: 'HUSKYLENS Algorithmus setzen',
	HUSKYLENS_ALGORITHM_FACE_RECOGNITION: 'Gesichtserkennung',
	HUSKYLENS_ALGORITHM_OBJECT_TRACKING: 'Objektverfolgung',
	HUSKYLENS_ALGORITHM_OBJECT_RECOGNITION: 'Objekterkennung',
	HUSKYLENS_ALGORITHM_LINE_TRACKING: 'Linienverfolgung',
	HUSKYLENS_ALGORITHM_COLOR_RECOGNITION: 'Farberkennung',
	HUSKYLENS_ALGORITHM_TAG_RECOGNITION: 'Tag-Erkennung',
	HUSKYLENS_ALGORITHM_OBJECT_CLASSIFICATION: 'Objektklassifizierung',
	HUSKYLENS_REQUEST: 'HUSKYLENS Daten anfordern',
	HUSKYLENS_IS_LEARNED: 'HUSKYLENS gelernt',
	HUSKYLENS_COUNT_BLOCKS: 'HUSKYLENS Blockanzahl',
	HUSKYLENS_COUNT_ARROWS: 'HUSKYLENS Pfeilanzahl',
	HUSKYLENS_GET_BLOCK_INFO: 'Block abrufen',
	HUSKYLENS_GET_ARROW_INFO: 'Pfeil abrufen',
	HUSKYLENS_BLOCK_INFO_TYPE: ' ',
	HUSKYLENS_ARROW_INFO_TYPE: ' ',
	HUSKYLENS_X_CENTER: 'X-Zentrum',
	HUSKYLENS_Y_CENTER: 'Y-Zentrum',
	HUSKYLENS_WIDTH: 'Breite',
	HUSKYLENS_HEIGHT: 'Höhe',
	HUSKYLENS_ID: 'ID',
	HUSKYLENS_X_ORIGIN: 'X-Startpunkt',
	HUSKYLENS_Y_ORIGIN: 'Y-Startpunkt',
	HUSKYLENS_X_TARGET: 'X-Endpunkt',
	HUSKYLENS_Y_TARGET: 'Y-Endpunkt',
	HUSKYLENS_LEARN: 'HUSKYLENS ID lernen',
	HUSKYLENS_FORGET: 'HUSKYLENS alle lernen vergessen',

	// HUSKYLENS Tooltips
	HUSKYLENS_INIT_I2C_TOOLTIP: 'HUSKYLENS Smart-Kamera mit I2C initialisieren',
	HUSKYLENS_INIT_UART_TOOLTIP: 'HUSKYLENS Smart-Kamera mit UART initialisieren, RX/TX-Pins einstellen',
	HUSKYLENS_SET_ALGORITHM_TOOLTIP: 'Erkennungsalgorithmus für HUSKYLENS einstellen',
	HUSKYLENS_REQUEST_TOOLTIP: 'Neueste Erkennungsergebnisse von HUSKYLENS abrufen',
	HUSKYLENS_IS_LEARNED_TOOLTIP: 'Prüfen, ob HUSKYLENS etwas gelernt hat',
	HUSKYLENS_COUNT_BLOCKS_TOOLTIP: 'Anzahl der von HUSKYLENS erkannten Blöcke abrufen',
	HUSKYLENS_COUNT_ARROWS_TOOLTIP: 'Anzahl der von HUSKYLENS erkannten Pfeile abrufen',
	HUSKYLENS_GET_BLOCK_INFO_TOOLTIP: 'Informationen des angegebenen Blocks abrufen (Position, Größe oder ID)',
	HUSKYLENS_GET_ARROW_INFO_TOOLTIP: 'Informationen des angegebenen Pfeils abrufen (Ursprung, Ziel oder ID)',
	HUSKYLENS_LEARN_TOOLTIP: 'HUSKYLENS Objekt mit angegebener ID lernen lassen (nur im Objektklassifizierungsmodus)',
	HUSKYLENS_FORGET_TOOLTIP: 'Alle gelernten Objekte von HUSKYLENS löschen (nur im Objektklassifizierungsmodus)',
	HUSKYLENS_I2C_PIN_HINT: 'Verkabelung: ',
	HUSKYLENS_UART_PIN_HINT: 'Empfohlene Pins: ',
	HUSKYLENS_UART_ANY_DIGITAL: 'Beliebiger Digitalpin',

	// Safety Guard (Project Safety Protection)
	// ESP32 PWM Setup
	ESP32_PWM_SETUP: 'ESP32 PWM-Einstellung',
	ESP32_PWM_FREQUENCY: 'Frequenz',
	ESP32_PWM_RESOLUTION: 'Auflösung',
	ESP32_PWM_FREQUENCY_TOOLTIP: 'PWM-Frequenz einstellen, Bereich 1-80000 Hz. Hohe Frequenz für Motortreiber-Chips (20-75KHz)',
	ESP32_PWM_RESOLUTION_TOOLTIP: 'PWM-Auflösung einstellen, beeinflusst Ausgangspräzision. Hinweis: Frequenz × 2^Auflösung ≤ 80.000.000',
	ESP32_PWM_RESOLUTION_8BIT: '8 Bit (0-255)',
	ESP32_PWM_RESOLUTION_10BIT: '10 Bit (0-1023)',
	ESP32_PWM_RESOLUTION_12BIT: '12 Bit (0-4095)',
	ESP32_PWM_RESOLUTION_13BIT: '13 Bit (0-8191)',
	ESP32_PWM_RESOLUTION_14BIT: '14 Bit (0-16383)',
	ESP32_PWM_RESOLUTION_15BIT: '15 Bit (0-32767)',
	ESP32_PWM_RESOLUTION_16BIT: '16 Bit (0-65535)',

	// Safety Guard (Project Safety Protection)
	SAFETY_WARNING_BODY_NO_TYPE:
		'Dieses Projekt hat noch keine Blockly-Blöcke. Wenn Sie fortfahren, werden hier blockly-Ordner und -Dateien erstellt. Möchten Sie fortfahren?',
	SAFETY_WARNING_BODY_WITH_TYPE:
		'{0}-Projekt erkannt. Dieses Projekt hat noch keine Blockly-Blöcke. Wenn Sie fortfahren, werden hier blockly-Ordner und -Dateien erstellt. Möchten Sie fortfahren?',
	BUTTON_CONTINUE: 'Fortfahren',
	BUTTON_CANCEL: 'Abbrechen',
	BUTTON_SUPPRESS: 'Nicht mehr erinnern',
	SAFETY_GUARD_CANCELLED: 'Öffnen des Blockly-Editors abgebrochen',
	SAFETY_GUARD_SUPPRESSED: 'Einstellung gespeichert, diese Warnung wird nicht mehr angezeigt',

	// Communication Category (WiFi/MQTT)
	CATEGORY_COMMUNICATION: 'Kommunikation',
	ESP32_WIFI_LABEL: 'WiFi',
	ESP32_MQTT_LABEL: 'MQTT',
	ESP32_WIFI_CONNECT: 'WiFi Verbinden',
	ESP32_WIFI_CONNECT_SSID: 'SSID',
	ESP32_WIFI_CONNECT_PASSWORD: 'Passwort',
	ESP32_WIFI_CONNECT_TOOLTIP: 'Mit WiFi-Netzwerk verbinden (Zeitüberschreitung 10 Sekunden)',
	ESP32_WIFI_DISCONNECT: 'WiFi Trennen',
	ESP32_WIFI_DISCONNECT_TOOLTIP: 'WiFi-Verbindung trennen',
	ESP32_WIFI_STATUS: 'WiFi Verbunden?',
	ESP32_WIFI_STATUS_TOOLTIP: 'Gibt WiFi-Verbindungsstatus zurück',
	ESP32_WIFI_GET_IP: 'WiFi IP-Adresse',
	ESP32_WIFI_GET_IP_TOOLTIP: 'Aktuelle IP-Adresse abrufen',
	ESP32_WIFI_SCAN: 'WiFi-Netzwerke Scannen',
	ESP32_WIFI_SCAN_TOOLTIP: 'Scannen und Anzahl nahegelegener WiFi-Netzwerke zurückgeben',
	ESP32_WIFI_GET_SSID: 'WiFi SSID Abrufen',
	ESP32_WIFI_GET_SSID_INDEX: 'Index',
	ESP32_WIFI_GET_SSID_TOOLTIP: 'WiFi-Name am angegebenen Index abrufen',
	ESP32_WIFI_GET_RSSI: 'WiFi Signalstärke Abrufen',
	ESP32_WIFI_GET_RSSI_INDEX: 'Index',
	ESP32_WIFI_GET_RSSI_TOOLTIP: 'Signalstärke am angegebenen Index abrufen (dBm)',
	ESP32_MQTT_SETUP: 'MQTT Einrichtung',
	ESP32_MQTT_SETUP_SERVER: 'Server',
	ESP32_MQTT_SETUP_PORT: 'Port',
	ESP32_MQTT_SETUP_CLIENT_ID: 'Client-ID',
	ESP32_MQTT_SETUP_TOOLTIP: 'MQTT-Server-Verbindungsparameter konfigurieren',
	ESP32_MQTT_CONNECT: 'MQTT Verbinden',
	ESP32_MQTT_CONNECT_USERNAME: 'Benutzername',
	ESP32_MQTT_CONNECT_PASSWORD: 'Passwort',
	ESP32_MQTT_CONNECT_TOOLTIP: 'Mit MQTT-Server verbinden',
	ESP32_MQTT_PUBLISH: 'MQTT Veröffentlichen',
	ESP32_MQTT_PUBLISH_TOPIC: 'Thema',
	ESP32_MQTT_PUBLISH_MESSAGE: 'Nachricht',
	ESP32_MQTT_PUBLISH_TOOLTIP: 'Nachricht zum angegebenen Thema veröffentlichen',
	ESP32_MQTT_SUBSCRIBE: 'MQTT Abonnieren',
	ESP32_MQTT_SUBSCRIBE_TOPIC: 'Thema',
	ESP32_MQTT_SUBSCRIBE_TOOLTIP: 'Nachrichten vom angegebenen Thema abonnieren',
	ESP32_MQTT_LOOP: 'MQTT Nachrichten Verarbeiten',
	ESP32_MQTT_LOOP_TOOLTIP: 'Verbindung aufrechterhalten und empfangene Nachrichten verarbeiten (in loop setzen)',
	ESP32_MQTT_GET_TOPIC: 'MQTT Letztes Thema',
	ESP32_MQTT_GET_TOPIC_TOOLTIP: 'Thema der zuletzt empfangenen Nachricht abrufen',
	ESP32_MQTT_GET_MESSAGE: 'MQTT Letzte Nachricht',
	ESP32_MQTT_GET_MESSAGE_TOOLTIP: 'Inhalt der zuletzt empfangenen Nachricht abrufen',
	ESP32_MQTT_STATUS: 'MQTT Verbunden',
	ESP32_MQTT_STATUS_TOOLTIP: 'Prüfen ob mit MQTT-Server verbunden',
	TEXT_TO_NUMBER: 'Text zu Zahl',
	TEXT_TO_NUMBER_INT: 'Ganzzahl',
	TEXT_TO_NUMBER_FLOAT: 'Dezimalzahl',
	TEXT_TO_NUMBER_TOOLTIP: 'Text in Zahl umwandeln (ungültige Eingabe gibt 0 zurück)',

	// To String Block
	TO_STRING: 'Zu Text',
	TO_STRING_TOOLTIP: 'Zahl oder Wahrheitswert in Text umwandeln',

	// ESP32 Only Block Warning
	ESP32_ONLY_BLOCK_WARNING: 'Dieser Block unterstützt nur ESP32-Boards',

	// Quick Backup Toast Messages
	BACKUP_QUICK_SAVE_SUCCESS: 'Backup gespeichert: {0}',
	BACKUP_QUICK_SAVE_EMPTY: 'Arbeitsbereich ist leer, kein Backup erforderlich',
	BACKUP_QUICK_SAVE_COOLDOWN: 'Bitte warten, Backup wurde gerade abgeschlossen',
	MAIN_BLOCK_DUPLICATE_WARNING: 'Mehrere Hauptprogramm-Blocks erkannt. Bitte löschen Sie die überflüssigen Blocks.',

	// Board Switch Warning
	BOARD_SWITCH_WARNING_TITLE: 'Board-Typ wechseln',
	BOARD_SWITCH_WARNING_MESSAGE:
		'Beim Wechsel zu einem anderen Board-Typ wird der aktuelle Arbeitsbereich gelöscht.\nIhre Arbeit wird vorher automatisch gesichert.\n\nMöchten Sie fortfahren?',

	// CyberBrick Board
	BOARD_CYBERBRICK: 'CyberBrick',

	// CyberBrick Category
	CATEGORY_CYBERBRICK_CORE: 'CyberBrick',
	CATEGORY_CYBERBRICK_LED: 'LED',
	CATEGORY_CYBERBRICK_GPIO: 'GPIO',
	CATEGORY_CYBERBRICK_TIME: 'Zeit',

	// CyberBrick Main Block
	CYBERBRICK_MAIN: 'Hauptprogramm',
	CYBERBRICK_MAIN_TOOLTIP: 'CyberBrick Hauptprogramm-Einstiegspunkt. Aller Code sollte in diesem Block platziert werden.',

	// CyberBrick LED Blocks
	CYBERBRICK_LED_SET_COLOR: 'LED-Farbe einstellen',
	CYBERBRICK_LED_SET_COLOR_PREFIX: 'Onboard-LED-Farbe einstellen',
	CYBERBRICK_LED_RED: 'Rot',
	CYBERBRICK_LED_GREEN: 'Grün',
	CYBERBRICK_LED_BLUE: 'Blau',
	CYBERBRICK_LED_SET_COLOR_TOOLTIP: 'Onboard-LED (GPIO8) Farbe mit RGB-Werten (0-255) einstellen',
	CYBERBRICK_LED_OFF: 'LED ausschalten',
	CYBERBRICK_LED_OFF_TOOLTIP: 'Onboard-LED ausschalten',

	// CyberBrick GPIO Blocks
	CYBERBRICK_GPIO_SET: 'GPIO einstellen',
	CYBERBRICK_GPIO_SET_PREFIX: 'GPIO',
	CYBERBRICK_GPIO_SET_TO: 'auf',
	CYBERBRICK_GPIO_PIN: 'Pin',
	CYBERBRICK_GPIO_VALUE: 'Wert',
	CYBERBRICK_GPIO_HIGH: 'HIGH',
	CYBERBRICK_GPIO_LOW: 'LOW',
	CYBERBRICK_GPIO_SET_TOOLTIP: 'GPIO-Pin auf HIGH oder LOW setzen',
	CYBERBRICK_GPIO_READ: 'GPIO lesen',
	CYBERBRICK_GPIO_READ_TOOLTIP: 'Digitalwert vom GPIO-Pin lesen (gibt 0 oder 1 zurück)',

	// CyberBrick Time Blocks
	CYBERBRICK_DELAY_MS: 'Verzögerung (ms)',
	CYBERBRICK_DELAY_MS_PREFIX: 'Verzögerung',
	CYBERBRICK_DELAY_MS_SUFFIX: 'ms',
	CYBERBRICK_DELAY_MS_TOOLTIP: 'Programmausführung für angegebene Millisekunden pausieren',
	CYBERBRICK_DELAY_S: 'Verzögerung (s)',
	CYBERBRICK_DELAY_S_PREFIX: 'Verzögerung',
	CYBERBRICK_DELAY_S_SUFFIX: 'Sekunden',
	CYBERBRICK_DELAY_S_TOOLTIP: 'Programmausführung für angegebene Sekunden pausieren',
	CYBERBRICK_TICKS_MS: 'Aktuelle Millisekunden abrufen',
	CYBERBRICK_TICKS_MS_TOOLTIP: 'Aktuellen Millisekunden-Zähler abrufen',
	CYBERBRICK_TICKS_DIFF_PREFIX: 'Zeitdifferenz',
	CYBERBRICK_TICKS_DIFF_NOW: 'jetzt',
	CYBERBRICK_TICKS_DIFF_START: 'Start',
	CYBERBRICK_TICKS_DIFF_TOOLTIP: 'Millisekunden zwischen jetzt und Start berechnen',

	// CyberBrick WiFi Blocks
	CATEGORY_CYBERBRICK_WIFI: 'WLAN',
	CYBERBRICK_WIFI_CONNECT: 'WLAN verbinden',
	CYBERBRICK_WIFI_SSID: 'SSID',
	CYBERBRICK_WIFI_PASSWORD: 'Passwort',
	CYBERBRICK_WIFI_CONNECT_TOOLTIP: 'Mit angegebenem WLAN-Netzwerk verbinden',
	CYBERBRICK_WIFI_DISCONNECT: 'WLAN trennen',
	CYBERBRICK_WIFI_DISCONNECT_TOOLTIP: 'Vom aktuellen WLAN-Netzwerk trennen',
	CYBERBRICK_WIFI_IS_CONNECTED: 'WLAN verbunden?',
	CYBERBRICK_WIFI_IS_CONNECTED_TOOLTIP: 'Prüfen ob WLAN verbunden ist',
	CYBERBRICK_WIFI_GET_IP: 'IP-Adresse abrufen',
	CYBERBRICK_WIFI_GET_IP_TOOLTIP: 'Aktuelle IP-Adresse abrufen',

	// CyberBrick Upload
	UPLOAD_BUTTON_TITLE: 'Auf CyberBrick hochladen',
	UPLOAD_BUTTON_DISABLED_TITLE: 'Arbeitsbereich zuerst speichern um Upload zu aktivieren',
	UPLOAD_STARTING: 'Upload wird gestartet...',
	UPLOAD_SUCCESS: 'Upload erfolgreich!',
	UPLOAD_FAILED: 'Upload fehlgeschlagen: {0}',
	UPLOAD_NO_PORT: 'Kein CyberBrick-Gerät gefunden',
	UPLOAD_IN_PROGRESS: 'Upload läuft...',
	UPLOAD_EMPTY_WORKSPACE: 'Arbeitsbereich ist leer, bitte zuerst Blöcke hinzufügen',
	UPLOAD_NO_CODE: 'Code kann nicht generiert werden',

	// Upload progress stages
	UPLOAD_STAGE_PREPARING: 'Vorbereitung',
	UPLOAD_STAGE_CHECKING: 'Werkzeuge prüfen',
	UPLOAD_STAGE_INSTALLING: 'Werkzeuge installieren',
	UPLOAD_STAGE_CONNECTING: 'Gerät verbinden',
	UPLOAD_STAGE_RESETTING: 'Gerät zurücksetzen',
	UPLOAD_STAGE_BACKUP: 'Sicherung',
	UPLOAD_STAGE_UPLOADING: 'Hochladen',
	UPLOAD_STAGE_RESTARTING: 'Gerät neustarten',
	UPLOAD_STAGE_COMPLETED: 'Abgeschlossen',

	// Upload error messages
	ERROR_UPLOAD_BOARD_UNSUPPORTED: 'Nur CyberBrick-Board wird unterstützt',
	ERROR_UPLOAD_CODE_EMPTY: 'Code darf nicht leer sein',
	ERROR_UPLOAD_NO_PYTHON: 'PlatformIO Python-Umgebung nicht gefunden. Bitte installieren Sie zuerst PlatformIO.',
	ERROR_UPLOAD_MPREMOTE_FAILED: 'mpremote-Installation fehlgeschlagen',
	ERROR_UPLOAD_DEVICE_NOT_FOUND: 'CyberBrick-Gerät nicht gefunden. Bitte stellen Sie sicher, dass es angeschlossen ist.',
	ERROR_UPLOAD_RESET_FAILED: 'Gerät konnte nicht zurückgesetzt werden',
	ERROR_UPLOAD_UPLOAD_FAILED: 'Programm konnte nicht hochgeladen werden',
	ERROR_UPLOAD_RESTART_FAILED: 'Gerät konnte nicht neu gestartet werden',

	// Arduino Upload Button
	UPLOAD_BUTTON_TITLE_ARDUINO: 'Kompilieren & Hochladen',
	UPLOAD_SELECT_BOARD: 'Bitte zuerst ein Board auswählen',

	// Arduino Upload Stages
	ARDUINO_STAGE_SYNCING: 'Einstellungen synchronisieren',
	ARDUINO_STAGE_SAVING: 'Arbeitsbereich speichern',
	ARDUINO_STAGE_CHECKING: 'Compiler überprüfen',
	ARDUINO_STAGE_DETECTING: 'Board erkennen',
	ARDUINO_STAGE_COMPILING: 'Kompilieren',
	ARDUINO_STAGE_UPLOADING: 'Hochladen',

	// Arduino Upload Results
	ARDUINO_COMPILE_SUCCESS: 'Kompilierung erfolgreich!',
	ARDUINO_UPLOAD_SUCCESS: 'Hochladen erfolgreich!',

	// Arduino Upload Errors
	ERROR_ARDUINO_PIO_NOT_FOUND: 'PlatformIO CLI nicht gefunden. Bitte installieren Sie zuerst PlatformIO.',
	ERROR_ARDUINO_COMPILE_FAILED: 'Kompilierung fehlgeschlagen',
	ERROR_ARDUINO_UPLOAD_FAILED: 'Hochladen fehlgeschlagen',
	ERROR_ARDUINO_NO_WORKSPACE: 'Bitte öffnen Sie zuerst einen Projektordner',
	ERROR_ARDUINO_TIMEOUT: 'Vorgang abgelaufen',
	ERROR_ARDUINO_DEVICE_DISCONNECT: 'Gerät wurde getrennt',

	// Backup messages
	BACKUP_CONFIRM_DELETE: 'Sind Sie sicher, dass Sie das Backup "{0}" löschen möchten?',
	BACKUP_CONFIRM_RESTORE:
		'Sind Sie sicher, dass Sie das Backup "{0}" wiederherstellen möchten? Dies überschreibt den aktuellen Arbeitsbereich.',
	BACKUP_ERROR_NOT_FOUND: 'Backup "{0}" nicht gefunden',
	BACKUP_ERROR_CREATE_FAILED: 'Fehler beim Erstellen des Backups: {0}',
	BACKUP_ERROR_DELETE_FAILED: 'Fehler beim Löschen des Backups: {0}',
	BACKUP_ERROR_RESTORE_FAILED: 'Fehler beim Wiederherstellen des Backups: {0}',
	BACKUP_ERROR_PREVIEW_FAILED: 'Fehler bei der Vorschau des Backups: {0}',
	BACKUP_ERROR_NAME_NOT_SPECIFIED: 'Backup-Name nicht angegeben',
	BACKUP_ERROR_MAIN_NOT_FOUND: 'main.json-Datei nicht gefunden',
	BACKUP_ERROR_UPDATE_SETTINGS_FAILED: 'Fehler beim Aktualisieren der automatischen Backup-Einstellungen',

	// Button labels
	BUTTON_DELETE: 'Löschen',
	BUTTON_RESTORE: 'Wiederherstellen',

	// Error messages
	ERROR_PROCESSING_MESSAGE: 'Fehler bei der Nachrichtenverarbeitung: {0}',
	ERROR_SETTINGS_UPDATE_FAILED: 'Fehler beim Aktualisieren der Einstellungen',
	ERROR_RELOAD_WORKSPACE_FAILED: 'Fehler beim Neuladen des Arbeitsbereichs: {0}',
	ERROR_OPEN_PROJECT_FOLDER_FIRST: 'Bitte öffnen Sie zuerst einen Projektordner',

	// Info messages
	INFO_NO_BACKUPS_TO_PREVIEW: 'Keine Backup-Dateien zur Vorschau',

	// Dialog messages
	DIALOG_SELECT_BACKUP_TITLE: 'Backup-Datei zur Vorschau auswählen',
	DIALOG_BACKUP_FILES_LABEL: 'Backup-Dateien',

	// X11 Erweiterungsboard
	CATEGORY_X11: 'X11 Erweiterung',
	X11_LABEL_SERVOS: 'Servomotoren',
	X11_LABEL_MOTORS: 'Motoren',
	X11_LABEL_LEDS: 'LEDs',

	// X11 180° Servo Blöcke
	X11_SERVO_180_ANGLE_PREFIX: 'Setze Servo',
	X11_SERVO_180_ANGLE_SUFFIX: 'Winkel',
	X11_SERVO_180_ANGLE_TOOLTIP: 'Setze 180° Servo-Winkel (0-180 Grad)',

	// X11 360° Servo Blöcke
	X11_SERVO_360_SPEED_PREFIX: 'Setze Servo',
	X11_SERVO_360_SPEED_SUFFIX: 'Geschwindigkeit',
	X11_SERVO_360_SPEED_TOOLTIP: 'Setze 360° Endlos-Drehservo Geschwindigkeit (-100 bis 100, negativ=rückwärts)',

	// X11 Servo Stop Block
	X11_SERVO_STOP: 'Stoppe Servo',
	X11_SERVO_STOP_TOOLTIP: 'Stoppe den angegebenen Servo',

	// X11 Motor Blöcke
	X11_MOTOR_SPEED_PREFIX: 'Setze Motor',
	X11_MOTOR_SPEED_SUFFIX: 'Geschwindigkeit',
	X11_MOTOR_SPEED_TOOLTIP: 'Setze DC-Motor Geschwindigkeit (-2048 bis 2048, negativ=rückwärts)',
	X11_MOTOR_STOP: 'Stoppe Motor',
	X11_MOTOR_STOP_TOOLTIP: 'Stoppe den angegebenen Motor',

	// X11 LED Blöcke
	X11_LED_SET_COLOR_PREFIX: 'LED-Streifen',
	X11_LED_SET_COLOR_INDEX: 'Index',
	X11_LED_SET_COLOR_INDEX_SUFFIX: 'setze Farbe R',
	X11_LED_SET_COLOR_TOOLTIP: 'Setze LED-Streifen Pixel-Farbe (Index 0=erstes Pixel, oder alle)',
	X11_LED_INDEX_ALL: 'Alle',

	// === X12 Sender Erweiterungsplatine ===
	CATEGORY_X12: 'X12 Erweiterung',
	X12_LABEL_JOYSTICK: 'Joystick',
	X12_LABEL_BUTTON: 'Taste',

	// X12 Joystick Blöcke
	X12_GET_JOYSTICK_PREFIX: 'Joystick',
	X12_GET_JOYSTICK_SUFFIX: 'Wert',
	X12_GET_JOYSTICK_TOOLTIP: 'Joystick ADC-Wert lesen (0-4095)',
	X12_GET_JOYSTICK_MAPPED_PREFIX: 'Joystick',
	X12_GET_JOYSTICK_MAPPED_MIN: 'mappen auf',
	X12_GET_JOYSTICK_MAPPED_MAX: '~',
	X12_GET_JOYSTICK_MAPPED_TOOLTIP: 'Joystick lesen und auf Bereich mappen',

	// X12 Tasten Blöcke
	X12_IS_BUTTON_PRESSED_PREFIX: 'Taste',
	X12_IS_BUTTON_PRESSED_SUFFIX: 'gedrückt?',
	X12_IS_BUTTON_PRESSED_TOOLTIP: 'Prüfen ob Taste gedrückt ist',

	// === RC Fernsteuerung ===

	// RC Initialisierungsblöcke

	// RC Joystick Blöcke

	// RC Tasten Blöcke

	// RC Status Blöcke

	// === RC-Verbindung ===
	CATEGORY_RC: 'RC-Verbindung',
	RC_LABEL_MASTER: '📡 Sender',
	RC_LABEL_SLAVE: '📻 Empfänger',
	RC_LABEL_DATA: '📊 Daten lesen',
	RC_LABEL_STATUS: '🔗 Verbindungsstatus',

	// RC Sender Blöcke
	RC_MASTER_INIT: 'RC-Sender initialisieren',
	RC_MASTER_INIT_PAIR_ID: 'Paar-ID',
	RC_MASTER_INIT_CHANNEL: 'Kanal',
	RC_MASTER_INIT_TOOLTIP: 'RC-Sender mit Paar-ID (1-255) und Kanal (1-11) initialisieren',
	RC_SEND: 'RC-Daten senden',
	RC_SEND_TOOLTIP: 'X12 Joystick/Tasten-Daten lesen und an Empfänger senden',

	// RC Empfänger Blöcke
	RC_SLAVE_INIT: 'RC-Empfänger initialisieren',
	RC_SLAVE_INIT_PAIR_ID: 'Paar-ID',
	RC_SLAVE_INIT_CHANNEL: 'Kanal',
	RC_SLAVE_INIT_TOOLTIP: 'RC-Empfänger mit Paar-ID (1-255) und Kanal (1-11) initialisieren',
	RC_WAIT_CONNECTION: 'Auf Pairing warten',
	RC_WAIT_TIMEOUT: 'Timeout',
	RC_WAIT_SECONDS: 'Sekunden',
	RC_WAIT_TOOLTIP: 'Auf Sender-Verbindung warten, LED blinkt blau, fährt nach Timeout fort',
	RC_IS_CONNECTED: 'RC verbunden?',
	RC_IS_CONNECTED_TOOLTIP: 'Prüfen ob Daten innerhalb 500ms empfangen',

	// RC Daten lesen Blöcke
	RC_GET_JOYSTICK_PREFIX: 'RC Joystick',
	RC_GET_JOYSTICK_TOOLTIP: 'Remote-Joystick-Wert lesen (0-4095), 2048 ist Mitte',
	RC_GET_JOYSTICK_MAPPED_PREFIX: 'RC Joystick',
	RC_GET_JOYSTICK_MAPPED_MIN: 'mappen auf',
	RC_GET_JOYSTICK_MAPPED_MAX: '~',
	RC_GET_JOYSTICK_MAPPED_TOOLTIP: 'Remote-Joystick lesen und auf Bereich mappen',
	RC_IS_BUTTON_PRESSED_PREFIX: 'RC Taste',
	RC_IS_BUTTON_PRESSED_SUFFIX: 'gedrückt?',
	RC_IS_BUTTON_PRESSED_TOOLTIP: 'Prüfen ob Remote-Taste gedrückt ist',
	RC_GET_BUTTON_PREFIX: 'RC Taste',
	RC_GET_BUTTON_SUFFIX: 'Status',
	RC_GET_BUTTON_TOOLTIP: 'Remote-Tasten-Status lesen (0=gedrückt, 1=losgelassen)',
});

