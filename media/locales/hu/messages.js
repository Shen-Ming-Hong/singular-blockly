/**
 * @license
 * Copyright 2024 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file contains translations derived from Blockly project
 * Copyright 2012 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

// Define translations for Hungarian
window.languageManager.loadMessages('hu', {
	// UI Elements
	BLOCKS_TAB: 'Blokkok',
	CODE_TAB: 'Kód',
	BOARD_SELECT_LABEL: 'Válassz táblát:',

	// Preview Mode UI
	PREVIEW_BADGE: 'Előnézet',
	THEME_TOGGLE: 'Téma váltása',
	PREVIEW_WINDOW_TITLE: 'Blockly Előnézet - {0}',
	PREVIEW_WINDOW_TITLE_WITH_NAME: 'Előnézet - {0}',

	// Backup Modal UI
	BACKUP_MANAGER_TITLE: 'Mentés kezelő',
	BACKUP_CREATE_NEW: 'Új mentés létrehozása',
	BACKUP_NAME_LABEL: 'Mentés neve:',
	BACKUP_NAME_PLACEHOLDER: 'Adja meg a mentés nevét',
	BACKUP_CONFIRM: 'Megerősítés',
	BACKUP_CANCEL: 'Mégse',
	BACKUP_LIST_TITLE: 'Mentések listája',
	BACKUP_LIST_EMPTY: 'Nincs elérhető mentés',
	BACKUP_BUTTON_TITLE: 'Mentés kezelő',
	BACKUP_PREVIEW_BTN: 'Előnézet',
	BACKUP_RESTORE_BTN: 'Visszaállítás',
	BACKUP_DELETE_BTN: 'Törlés',

	// Board Names
	BOARD_NONE: 'Nincs',
	BOARD_UNO: 'Arduino Uno',
	BOARD_NANO: 'Arduino Nano',
	BOARD_MEGA: 'Arduino Mega',
	BOARD_ESP32: 'ESP32',
	BOARD_SUPERMINI: 'Super Mini',

	// Block Categories
	CATEGORY_LOGIC: 'Logika',
	CATEGORY_LOOPS: 'Ciklusok',
	CATEGORY_MATH: 'Matematika',
	CATEGORY_TEXT: 'Szöveg',
	CATEGORY_LISTS: 'Listák',
	CATEGORY_VARIABLES: 'Változók',
	CATEGORY_FUNCTIONS: 'Függvények',
	CATEGORY_ARDUINO: 'Arduino',
	CATEGORY_SENSORS: 'Érzékelők',
	CATEGORY_MOTORS: 'Motorok',

	// Servo Block Labels
	SERVO_SETUP: 'Szervomotor beállítása',
	SERVO_PIN: 'Láb',
	SERVO_SETUP_TOOLTIP: 'Szervomotor változó deklarálása és láb beállítása',
	SERVO_MOVE: 'Szervomotor forgatása',
	SERVO_ANGLE: 'Szög',
	SERVO_MOVE_TOOLTIP: 'Szervomotor forgatása egy adott szögbe',

	// Arduino Block Labels
	ARDUINO_SETUP: 'Beállítás',
	ARDUINO_LOOP: 'Ciklus',
	ARDUINO_DIGITAL_WRITE: 'Digitális írás',
	ARDUINO_DIGITAL_READ: 'Digitális olvasás',
	ARDUINO_ANALOG_WRITE: 'Analóg írás',
	ARDUINO_ANALOG_READ: 'Analóg olvasás',
	ARDUINO_PIN: 'Láb',
	ARDUINO_VALUE: 'Érték',
	ARDUINO_DELAY: 'Késleltetés',
	ARDUINO_DELAY_MS: 'ezredmásodperc',
	ARDUINO_PULLUP: 'Belső felhúzó ellenállás engedélyezése',
	ARDUINO_MODE: 'Mód',
	ARDUINO_MODE_INPUT: 'BEMENET',
	ARDUINO_MODE_OUTPUT: 'KIMENET',

	// Sensor Block Labels
	ULTRASONIC_SENSOR: 'Ultrahangos érzékelő',
	ULTRASONIC_TRIG_PIN: 'Trig láb',
	ULTRASONIC_ECHO_PIN: 'Echo láb',
	ULTRASONIC_USE_INTERRUPT: 'Hardveres megszakítás használata',
	ULTRASONIC_READ: 'Ultrahangos távolság olvasása (cm)',
	ULTRASONIC_TOOLTIP_SETUP:
		'Ultrahangos érzékelő beállítása Trig és Echo lábakkal. Opcionális hardveres megszakítás a nagyobb pontosság érdekében.',
	ULTRASONIC_TOOLTIP_READ: 'Az ultrahangos érzékelő által mért távolság olvasása centiméterben.',
	ULTRASONIC_WARNING: 'A kiválasztott Echo láb {0} nem támogatja a hardveres megszakítást. Kérjük, válasszon egyet ezek közül: {1}',

	// Threshold Function Block Labels
	THRESHOLD_PIN: 'nál',
	THRESHOLD_VALUE: 'ha >',
	THRESHOLD_HIGH_VALUE: '=',
	THRESHOLD_LOW_VALUE: 'különben',
	THRESHOLD_TOOLTIP_SETUP:
		'Küszöbérték funkció konfigurálása. Amikor az analóg bemenet meghaladja a küszöbértéket, az első kimenetet adja vissza, különben a második kimenetet.',
	THRESHOLD_TOOLTIP_READ: 'Küszöbérték funkció értékének lekérdezése',

	// Duration block
	DURATION_REPEAT: 'Ismétlés',
	DURATION_TIME: 'idő',
	DURATION_MS: 'milliszekundum',
	DURATION_DO: 'végrehajtani',

	// Print block
	TEXT_PRINT_SHOW: 'kiírás',
	TEXT_PRINT_NEWLINE: 'új sor',

	// Pin Mode block
	PIN_MODE_SET: 'beállítás',

	// Function Block Labels
	FUNCTION_CREATE: 'Függvény létrehozása',
	FUNCTION_NAME: 'Név',
	FUNCTION_PARAMS: 'Paraméterek',
	FUNCTION_RETURN: 'Visszatérés',
	FUNCTION_CALL: 'Hívás',

	// Logic Block Labels
	LOGIC_IF: 'ha',
	LOGIC_ELSE: 'különben',
	LOGIC_THEN: 'akkor',
	LOGIC_AND: 'és',
	LOGIC_OR: 'vagy',
	LOGIC_NOT: 'nem',
	LOGIC_TRUE: 'igaz',
	LOGIC_FALSE: 'hamis',

	// Loop Block Labels
	LOOP_REPEAT: 'ismételd',
	LOOP_WHILE: 'amíg',
	LOOP_UNTIL: 'amíg nem',
	LOOP_FOR: 'ciklus',
	LOOP_FOREACH: 'minden elemre',
	LOOP_BREAK: 'kilépés',
	LOOP_CONTINUE: 'folytatás',

	// Math Block Labels
	MATH_NUMBER: 'szám',
	MATH_ARITHMETIC: 'aritmetika',
	MATH_OPERATIONS: 'műveletek',
	MATH_ADD: 'összeadás',
	MATH_SUBTRACT: 'kivonás',
	MATH_MULTIPLY: 'szorzás',
	MATH_DIVIDE: 'osztás',
	MATH_POWER: 'hatvány',

	// Math Map Block
	MATH_MAP_VALUE: 'leképez',
	MATH_MAP_TOOLTIP:
		'Egy számot leképez egyik tartományból egy másikra. Például a map(érték, 0, 1023, 0, 255) egy analóg bemenetet 8-bites PWM kimenetre skáláz.',

	// VS Code UI Messages
	VSCODE_OPEN_FOLDER: 'Mappa megnyitása',
	VSCODE_PLEASE_OPEN_PROJECT: 'Kérjük, először nyisson meg egy projektmappát!',
	VSCODE_FAILED_SAVE_FILE: 'Nem sikerült menteni a fájlt: {0}',
	VSCODE_FAILED_UPDATE_INI: 'Nem sikerült frissíteni a platformio.ini fájlt: {0}',
	VSCODE_UNABLE_SAVE_WORKSPACE: 'Nem sikerült menteni a munkaterület állapotát: {0}',
	VSCODE_FAILED_START: 'A Singular Blockly indítása nem sikerült: {0}',
	VSCODE_CONFIRM_DELETE_VARIABLE: 'Biztosan törli a(z) "{0}" változót?',
	VSCODE_BOARD_UPDATED: 'A panel konfigurációja frissítve: {0}',
	VSCODE_RELOAD_REQUIRED: '，Kérjük, töltse újra az ablakot a beállítás befejezéséhez',
	VSCODE_ENTER_VARIABLE_NAME: 'Adja meg az új változó nevét',
	VSCODE_ENTER_NEW_VARIABLE_NAME: 'Adja meg az új változó nevét (jelenlegi: {0})',
	VSCODE_VARIABLE_NAME_EMPTY: 'A változó neve nem lehet üres',
	VSCODE_VARIABLE_NAME_INVALID: 'A változó neve csak betűket, számokat és aláhúzásjeleket tartalmazhat, és nem kezdődhet számmal',
	VSCODE_RELOAD: 'Újratöltés',
	VSCODE_OK: 'OK',
	VSCODE_CANCEL: 'Mégse',
	VSCODE_OPEN_BLOCKLY_EDITOR: 'Blockly szerkesztő megnyitása',

	// Error Messages
	ERROR_BOARD_NOT_SELECTED: 'Kérjük, először válasszon egy panelt',
	ERROR_INVALID_PIN: 'Érvénytelen tűszám',
	ERROR_INVALID_VALUE: 'Érvénytelen érték',
	ERROR_MISSING_TRANSLATION: 'Hiányzó fordítás',

	// Blockly core messages
	ADD: 'hozzáadás',
	REMOVE: 'eltávolítás',
	RENAME: 'átnevezés',
	NEW: 'új',
	ADD_COMMENT: 'Megjegyzés hozzáadása',
	REMOVE_COMMENT: 'Megjegyzés eltávolítása',
	DUPLICATE_BLOCK: 'Duplikálás',
	HELP: 'Súgó',
	UNDO: 'Visszavonás',
	REDO: 'Ismét végrehajtás',
	COLLAPSE_BLOCK: 'Blokk összecsukása',
	EXPAND_BLOCK: 'Blokk kibontása',
	DELETE_BLOCK: 'Blokk törlése',
	DELETE_X_BLOCKS: '%1 blokk törlése',
	DELETE_ALL_BLOCKS: 'Töröljük mind a %1 blokkot?',
	CLEAN_UP: 'Blokkok rendezése',
	COLLAPSE_ALL: 'Blokkok összecsukása',
	EXPAND_ALL: 'Blokkok kibontása',
	DISABLE_BLOCK: 'Blokk letiltása',
	ENABLE_BLOCK: 'Blokk engedélyezése',
	INLINE_INPUTS: 'Beágyazott bemenetek',
	EXTERNAL_INPUTS: 'Külső bemenetek',

	// Variable & Function messages
	RENAME_VARIABLE: 'Változó átnevezése...',
	NEW_VARIABLE: 'Változó létrehozása...',
	DELETE_VARIABLE: '%1 változó törlése',
	PROCEDURE_ALREADY_EXISTS: 'A(z) "%1" nevű eljárás már létezik.',

	// Logic block messages
	CONTROLS_IF_MSG_IF: 'ha',
	CONTROLS_IF_MSG_THEN: 'akkor',
	CONTROLS_IF_MSG_ELSE: 'különben',
	CONTROLS_IF_MSG_ELSEIF: 'különben ha',
	CONTROLS_IF_IF_TITLE_IF: 'ha',
	CONTROLS_IF_ELSEIF_TITLE_ELSEIF: 'különben ha',
	CONTROLS_IF_ELSE_TITLE_ELSE: 'különben',
	LOGIC_COMPARE_TOOLTIP_EQ: 'Igaz ha a két bemenet egyenlő.',
	LOGIC_COMPARE_TOOLTIP_NEQ: 'Igaz ha a két bemenet nem egyenlő.',
	LOGIC_COMPARE_TOOLTIP_LT: 'Igaz ha az első bemenet kisebb, mint a második bemenet.',
	LOGIC_COMPARE_TOOLTIP_LTE: 'Igaz ha az első bemenet kisebb vagy egyenlő, mint a második bemenet.',
	LOGIC_COMPARE_TOOLTIP_GT: 'Igaz ha az első bemenet nagyobb, mint a második bemenet.',
	LOGIC_COMPARE_TOOLTIP_GTE: 'Igaz ha az első bemenet nagyobb vagy egyenlő, mint a második bemenet.',
	LOGIC_OPERATION_AND: 'és',
	LOGIC_OPERATION_OR: 'vagy',
	LOGIC_NEGATE_TITLE: 'nem %1',
	LOGIC_BOOLEAN_TRUE: 'igaz',
	LOGIC_BOOLEAN_FALSE: 'hamis',
	LOGIC_NULL: 'null',

	// Additional Logic Block Messages
	LOGIC_COMPARE_HELPURL: 'https://hu.wikipedia.org/wiki/Egyenlőtlenség_(matematika)',
	LOGIC_NEGATE_HELPURL: 'https://github.com/google/blockly/wiki/Logic#not',
	LOGIC_NEGATE_TOOLTIP: 'Igaz, ha a bemenet hamis. Hamis, ha a bemenet igaz.',
	LOGIC_OPERATION_TOOLTIP_AND: 'Igaz, ha mindkét bemenet igaz.',
	LOGIC_OPERATION_TOOLTIP_OR: 'Igaz, ha legalább az egyik bemenet igaz.',
	LOGIC_BOOLEAN_TOOLTIP: 'Igaz vagy hamis értéket ad vissza.',

	// Loop block messages
	CONTROLS_REPEAT_TITLE: 'ismételd %1 alkalommal',
	CONTROLS_WHILEUNTIL_OPERATOR_WHILE: 'ismételd amíg',
	CONTROLS_WHILEUNTIL_OPERATOR_UNTIL: 'ismételd amíg nem',
	CONTROLS_FOR_TITLE: 'számláló %1 értéke %2 és %3 között, lépésköz %4',
	CONTROLS_FLOW_STATEMENTS_OPERATOR_BREAK: 'kilépés a ciklusból',
	CONTROLS_FLOW_STATEMENTS_OPERATOR_CONTINUE: 'folytatás a ciklus következő lépésével',
	CONTROLS_REPEAT_TOOLTIP: 'Bizonyos utasítások többszöri végrehajtása.',
	CONTROLS_WHILEUNTIL_TOOLTIP_WHILE: 'Amíg egy érték igaz, végrehajtja az utasításokat.',
	CONTROLS_WHILEUNTIL_TOOLTIP_UNTIL: 'Amíg egy érték hamis, végrehajtja az utasításokat.',
	CONTROLS_FOR_TOOLTIP: 'Számol a kezdőértéktől a végértékig a megadott lépésközzel.',
	CONTROLS_FLOW_STATEMENTS_WARNING: 'Figyelem: Ez a blokk csak ciklusban használható.',

	// Math block messages
	MATH_NUMBER_HELPURL: 'https://hu.wikipedia.org/wiki/Szám',
	MATH_NUMBER_TOOLTIP: 'Egy szám.',
	MATH_ARITHMETIC_OPERATOR_ADD: '+',
	MATH_ARITHMETIC_OPERATOR_MINUS: '-',
	MATH_ARITHMETIC_OPERATOR_MULTIPLY: '×',
	MATH_ARITHMETIC_OPERATOR_DIVIDE: '÷',
	MATH_ARITHMETIC_OPERATOR_POWER: '^',
	MATH_SINGLE_OPERATOR_ROOT: 'négyzetgyök',
	MATH_SINGLE_OPERATOR_ABSOLUTE: 'abszolút érték',
	MATH_IS_EVEN: 'páros',
	MATH_IS_ODD: 'páratlan',
	MATH_IS_PRIME: 'prímszám',
	MATH_IS_WHOLE: 'egész szám',
	MATH_IS_POSITIVE: 'pozitív',
	MATH_IS_NEGATIVE: 'negatív',
	MATH_ARITHMETIC_HELPURL: 'https://hu.wikipedia.org/wiki/Számtani_alapműveletek',
	MATH_ARITHMETIC_TOOLTIP_ADD: 'Két szám összegét adja eredményül.',
	MATH_ARITHMETIC_TOOLTIP_MINUS: 'Két szám különbségét adja eredményül.',
	MATH_ARITHMETIC_TOOLTIP_MULTIPLY: 'Két szám szorzatát adja eredményül.',
	MATH_ARITHMETIC_TOOLTIP_DIVIDE: 'Két szám hányadosát adja eredményül.',
	MATH_ARITHMETIC_TOOLTIP_POWER: 'Az első számot a második hatványára emeli.',

	// Text block messages
	TEXT_JOIN_TITLE_CREATEWITH: 'szöveg létrehozása',
	TEXT_CREATE_JOIN_TITLE_JOIN: 'összefűzés',
	TEXT_LENGTH_TITLE: '%1 hossza',
	TEXT_ISEMPTY_TITLE: '%1 üres',
	TEXT_INDEXOF_OPERATOR_FIRST: 'szöveg első előfordulása',
	TEXT_INDEXOF_OPERATOR_LAST: 'szöveg utolsó előfordulása',
	TEXT_CHARAT_FROM_START: 'betű lekérdezése #',
	TEXT_CHARAT_FROM_END: 'betű lekérdezése # a végétől',
	TEXT_CHARAT_FIRST: 'első betű lekérdezése',
	TEXT_CHARAT_LAST: 'utolsó betű lekérdezése',
	TEXT_CHARAT_RANDOM: 'véletlen betű lekérdezése',
	TEXT_JOIN_TOOLTIP: 'Szöveg létrehozása tetszőleges számú elem összefűzésével.',
	TEXT_APPEND_VARIABLE: 'elem',
	TEXT_APPEND_TOOLTIP: 'Szöveget fűz a "%1" változóhoz.',
	TEXT_LENGTH_TOOLTIP: 'A megadott szövegben lévő betűk (beleértve a szóközöket) számát adja eredményül.',
	TEXT_ISEMPTY_TOOLTIP: 'Igaz, ha a megadott szöveg üres.',

	// List block messages
	LISTS_CREATE_EMPTY_TITLE: 'üres lista létrehozása',
	LISTS_CREATE_WITH_INPUT_WITH: 'lista létrehozása',
	LISTS_LENGTH_TITLE: '%1 hossza',
	LISTS_ISEMPTY_TITLE: '%1 üres',
	LISTS_INDEXOF_FIRST: 'elem első előfordulása',
	LISTS_INDEXOF_LAST: 'elem utolsó előfordulása',
	LISTS_GET_INDEX_GET: 'lekérdez',
	LISTS_GET_INDEX_REMOVE: 'eltávolít',
	LISTS_GET_INDEX_FROM_START: '#',
	LISTS_GET_INDEX_FROM_END: '# a végétől',
	LISTS_GET_INDEX_FIRST: 'első',
	LISTS_GET_INDEX_LAST: 'utolsó',
	LISTS_GET_INDEX_RANDOM: 'véletlen',
	LISTS_CREATE_WITH_TOOLTIP: 'Lista létrehozása tetszőleges számú elemmel.',
	LISTS_CREATE_EMPTY_TOOLTIP: 'Üres, 0 hosszúságú listát ad eredményül.',
	LISTS_LENGTH_TOOLTIP: 'A lista hosszát adja eredményül.',
	LISTS_ISEMPTY_TOOLTIP: 'Igaz, ha a lista üres.',

	// Variables
	VARIABLES_SET: '%1 = %2',
	VARIABLES_GET: '%1',
	VARIABLES_DEFAULT_NAME: 'elem',

	// If conditions
	CONTROLS_IF_TOOLTIP_1: 'Ha egy érték igaz, akkor végrehajtja az utasításokat.',
	CONTROLS_IF_TOOLTIP_2: 'Ha egy érték igaz, akkor végrehajtja az első utasításblokkot. Különben a második utasításblokkot hajtja végre.',
	CONTROLS_IF_TOOLTIP_3:
		'Ha az első érték igaz, akkor végrehajtja az első utasításblokkot. Különben, ha a második érték igaz, a második utasításblokkot hajtja végre.',
	CONTROLS_IF_TOOLTIP_4:
		'Ha az első érték igaz, akkor végrehajtja az első utasításblokkot. Különben, ha a második érték igaz, a második utasításblokkot hajtja végre. Ha egyik érték sem igaz, az utolsó utasításblokkot hajtja végre.',

	// Procedures
	PROCEDURES_DEFNORETURN_TITLE: '',
	PROCEDURES_DEFNORETURN_PROCEDURE: 'valami végrehajtása',
	PROCEDURES_BEFORE_PARAMS: 'paraméterek:',
	PROCEDURES_CALL_BEFORE_PARAMS: 'paraméterek:',
	PROCEDURES_DEFNORETURN_DO: '',
	PROCEDURES_DEFNORETURN_TOOLTIP: 'Függvény létrehozása visszatérési érték nélkül.',
	PROCEDURES_DEFRETURN_RETURN: 'vissza',
	PROCEDURES_DEFRETURN_TOOLTIP: 'Függvény létrehozása visszatérési értékkel.',
	PROCEDURES_DEFRETURN_COMMENT: 'Függvény leírása...',
	PROCEDURES_DEFRETURN_PROCEDURE: 'valami végrehajtása visszatérési értékkel',
	PROCEDURES_DEFRETURN_DO: '',
	PROCEDURES_CALLNORETURN_HELPURL: 'https://hu.wikipedia.org/wiki/Eljárás_(programozás)',
	PROCEDURES_CALLNORETURN_TOOLTIP: 'Felhasználó által definiált függvény futtatása.',
	PROCEDURES_CALLRETURN_HELPURL: 'https://hu.wikipedia.org/wiki/Eljárás_(programozás)',
	PROCEDURES_CALLRETURN_TOOLTIP: 'Felhasználó által definiált függvény futtatása és eredményének felhasználása.',

	// Seven Segment Display
	SEVEN_SEGMENT_DISPLAY: 'Hétszegmenses kijelző',
	SEVEN_SEGMENT_COMMON_CATHODE: 'Közös katód',
	SEVEN_SEGMENT_COMMON_ANODE: 'Közös anód',
	SEVEN_SEGMENT_NUMBER: 'Szám (0-9):',
	SEVEN_SEGMENT_DECIMAL_POINT: 'Tizedespont',
	SEVEN_SEGMENT_TOOLTIP: 'Számjegy (0-9) megjelenítése hétszegmenses kijelzőn opcionális tizedesponttal.',
	// Seven Segment Display Pins
	SEVEN_SEGMENT_PINS_SET: 'Hétszegmenses kijelző pinek beállítása',
	SEVEN_SEGMENT_PINS_TOOLTIP: 'A hétszegmenses kijelző minden szegmensének (A-G) és tizedespontjának (DP) konfigurálása.',
});
