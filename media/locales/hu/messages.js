/**
 * @license
 * Copyright 2025 Singular Blockly Contributors
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

	// Experimental Blocks Notice
	EXPERIMENTAL_BLOCKS_TITLE: 'Kísérleti blokkok észlelve',
	EXPERIMENTAL_BLOCKS_DESC:
		'A munkaterület kísérleti blokkokat tartalmaz (sárga szaggatott szegéllyel kiemelve). Ezek a funkciók változhatnak vagy eltávolításra kerülhetnek a jövőbeni frissítésekben, óvatosan használja őket.',

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
	REFRESH_BUTTON_TITLE: 'Kód frissítése',
	BACKUP_PREVIEW_BTN: 'Előnézet',
	BACKUP_RESTORE_BTN: 'Visszaállítás',
	BACKUP_DELETE_BTN: 'Törlés',
	AUTO_BACKUP_TITLE: 'Automatikus mentés beállításai',
	AUTO_BACKUP_INTERVAL_LABEL: 'Mentés időköze:',
	AUTO_BACKUP_MINUTES: 'perc',
	AUTO_BACKUP_SAVE: 'Beállítások mentése',
	AUTO_BACKUP_SAVED: 'Automatikus mentés beállításai elmentve',
	AUTO_BACKUP_PREFIX: 'auto_',
	MANUAL_BACKUP_TITLE: 'Kézi mentés',

	// Board Names
	BOARD_NONE: 'Nincs',
	BOARD_UNO: 'Arduino Uno',
	BOARD_NANO: 'Arduino Nano',
	BOARD_MEGA: 'Arduino Mega',
	BOARD_ESP32: 'ESP32',
	BOARD_SUPERMINI: 'Super Mini',
	// Block Search UI
	FUNCTION_SEARCH_TITLE: 'Blokkok keresése',
	FUNCTION_SEARCH_BUTTON_TITLE: 'Blokkok keresése',
	FUNCTION_SEARCH_PLACEHOLDER: 'Írja be a blokk nevét vagy paramétereit...',
	FUNCTION_SEARCH_BTN: 'Keresés',
	FUNCTION_SEARCH_PREV: 'Előző',
	FUNCTION_SEARCH_NEXT: 'Következő',
	FUNCTION_SEARCH_EMPTY: 'Még nem keresett',
	FUNCTION_SEARCH_NO_RESULTS: 'Nem található egyező blokk',
	FUNCTION_RESULT_PREFIX: 'Blokk: ',
	FUNCTION_KEYBOARD_SHORTCUT_TIP: '(Gyorsbillentyű: Ctrl+F)',
	FUNCTION_SEARCH_HISTORY_TITLE: 'Keresési előzmények',

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
	VISION_SENSORS_CATEGORY: 'Látás Érzékelők',
	// Servo Block Labels
	SERVO_SETUP: 'Szervomotor beállítása',
	SERVO_PIN: 'Láb',
	SERVO_SETUP_TOOLTIP: 'Szervomotor változó deklarálása és láb beállítása',
	SERVO_MOVE: 'Szervomotor forgatása',
	SERVO_ANGLE: 'Szög',
	SERVO_MOVE_TOOLTIP: 'Szervomotor forgatása egy adott szögbe',
	SERVO_STOP: 'Szervomotor leállítása',
	SERVO_STOP_TOOLTIP: 'Szervomotor jelkimenet leállítása',

	// Encoder Motor Control
	ENCODER_SETUP: 'Enkóderes motor beállítása',
	ENCODER_NAME: 'Név',
	ENCODER_PIN_A: 'A láb',
	ENCODER_PIN_B: 'B láb',
	ENCODER_USE_INTERRUPT: 'Megszakítás használata',
	ENCODER_SETUP_TOOLTIP: 'Enkóderes motor beállítása névvel és lábkonfigurációval',
	ENCODER_READ: 'Enkóder olvasása',
	ENCODER_READ_TOOLTIP: 'Enkóder aktuális pozíciójának lekérdezése',
	ENCODER_RESET: 'Enkóder visszaállítása',
	ENCODER_RESET_TOOLTIP: 'Enkóder pozíciójának visszaállítása nullára',
	ENCODER_PID_SETUP: 'PID szabályozás beállítása',
	ENCODER_PID_MOTOR: 'Motor',
	ENCODER_PID_KP: 'Kp',
	ENCODER_PID_KI: 'Ki',
	ENCODER_PID_KD: 'Kd',
	ENCODER_PID_MODE: 'Mód',
	ENCODER_PID_MODE_POSITION: 'Pozíció',
	ENCODER_PID_MODE_SPEED: 'Sebesség',
	ENCODER_PID_SETUP_TOOLTIP: 'PID szabályozás konfigurálása pontos motor vezérléshez. Válasszon pozíció vagy sebesség módot.',
	ENCODER_PID_COMPUTE: 'PID számítása',
	ENCODER_PID_TARGET: 'Cél',
	ENCODER_PID_COMPUTE_TOOLTIP: 'PID szabályozás kimenetének számítása célpozíció alapján',
	ENCODER_PID_RESET: 'PID visszaállítása',
	ENCODER_PID_RESET_TOOLTIP: 'PID szabályozó állapotának visszaállítása (integrál felhalmozódás törlése, számláló visszaállítása)',

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
	// Pixetto Smart Camera
	PIXETTO_INIT: 'Pixetto intelligens kamera inicializálása',
	PIXETTO_RX_PIN: 'RX pin',
	PIXETTO_TX_PIN: 'TX pin',
	PIXETTO_IS_DETECTED: 'Pixetto Objektum Észlelve',
	PIXETTO_GET_TYPE_ID: 'Pixetto Típus ID Lekérése',
	PIXETTO_GET_FUNC_ID: 'Pixetto Funkció ID Lekérése',
	PIXETTO_COLOR_DETECT: 'Pixetto színfelismerés',
	PIXETTO_SHAPE_DETECT: 'Pixetto alakzatfelismerés',
	PIXETTO_FACE_DETECT: 'Pixetto arcfelismerés',
	PIXETTO_APRILTAG_DETECT: 'Pixetto AprilTag felismerés',
	PIXETTO_NEURAL_NETWORK: 'Pixetto neurális hálózat felismerés',
	PIXETTO_HANDWRITTEN_DIGIT: 'Pixetto kézzel írt számjegy felismerés',
	PIXETTO_GET_POSITION: 'Pixetto észlelt objektum lekérése',
	PIXETTO_ROAD_DETECT: 'Pixetto útfelismerés',
	PIXETTO_SET_MODE: 'Pixetto funkciós mód beállítása',
	PIXETTO_COLOR: 'Szín',
	PIXETTO_SHAPE: 'Alakzat',
	PIXETTO_MODE: 'Mód',
	PIXETTO_TAG_ID: 'Címke ID',
	PIXETTO_CLASS_ID: 'Osztály ID',
	PIXETTO_DIGIT: 'Számjegy',
	PIXETTO_COORDINATE: 'Koordináta',
	PIXETTO_ROAD_INFO: 'Információ', // Vision Sensors Category Labels
	PIXETTO_LABEL: 'Pixetto',
	HUSKYLENS_LABEL: 'HUSKYLENS',
	// HUSKYLENS Intelligens Kamera
	HUSKYLENS_INIT_I2C: 'HUSKYLENS inicializálása (I2C)',
	HUSKYLENS_INIT_UART: 'HUSKYLENS inicializálása (UART)',
	HUSKYLENS_RX_PIN: 'Csatlakozás HuskyLens TX-hez →',
	HUSKYLENS_TX_PIN: 'Csatlakozás HuskyLens RX-hez →',
	HUSKYLENS_SET_ALGORITHM: 'HUSKYLENS algoritmus beállítása erre',
	HUSKYLENS_ALGORITHM_FACE_RECOGNITION: 'Arcfelismerés',
	HUSKYLENS_ALGORITHM_OBJECT_TRACKING: 'Objektumkövetés',
	HUSKYLENS_ALGORITHM_OBJECT_RECOGNITION: 'Objektumfelismerés',
	HUSKYLENS_ALGORITHM_LINE_TRACKING: 'Vonalkövetés',
	HUSKYLENS_ALGORITHM_COLOR_RECOGNITION: 'Színfelismerés',
	HUSKYLENS_ALGORITHM_TAG_RECOGNITION: 'Címkefelismerés',
	HUSKYLENS_ALGORITHM_OBJECT_CLASSIFICATION: 'Objektumosztályozás',
	HUSKYLENS_REQUEST: 'HUSKYLENS felismerési eredmény kérése',
	HUSKYLENS_IS_LEARNED: 'HUSKYLENS megtanult objektumokat',
	HUSKYLENS_COUNT_BLOCKS: 'HUSKYLENS észlelt blokkok száma',
	HUSKYLENS_COUNT_ARROWS: 'HUSKYLENS észlelt nyilak száma',
	HUSKYLENS_GET_BLOCK_INFO: 'Blokk lekérése',
	HUSKYLENS_GET_ARROW_INFO: 'Nyíl lekérése',
	HUSKYLENS_BLOCK_INFO_TYPE: ' ',
	HUSKYLENS_ARROW_INFO_TYPE: ' ',
	HUSKYLENS_X_CENTER: 'X központ',
	HUSKYLENS_Y_CENTER: 'Y központ',
	HUSKYLENS_WIDTH: 'Szélesség',
	HUSKYLENS_HEIGHT: 'Magasság',
	HUSKYLENS_ID: 'ID',
	HUSKYLENS_X_ORIGIN: 'X kezdet',
	HUSKYLENS_Y_ORIGIN: 'Y kezdet',
	HUSKYLENS_X_TARGET: 'X cél',
	HUSKYLENS_Y_TARGET: 'Y cél',
	HUSKYLENS_LEARN: 'HUSKYLENS tanítása ID-ra',
	HUSKYLENS_FORGET: 'HUSKYLENS minden tanult elfelejtése',

	// Pixetto Tooltips
	PIXETTO_INIT_TOOLTIP: 'Pixetto intelligens kamera inicializálása és UART kommunikációs pinek beállítása',
	PIXETTO_IS_DETECTED_TOOLTIP: 'Annak észlelése, hogy a Pixetto érzékel-e objektumot',
	PIXETTO_GET_TYPE_ID_TOOLTIP: 'A Pixetto által észlelt objektum típus ID-jának lekérése (szín, forma stb.)',
	PIXETTO_GET_FUNC_ID_TOOLTIP: 'A Pixetto által jelenleg használt funkció ID-jának lekérése (színészlelés, formaészlelés stb.)',
	PIXETTO_COLOR_DETECT_TOOLTIP: 'Észleli, hogy a Pixetto meghatározott színű objektumot érzékel-e',
	PIXETTO_SHAPE_DETECT_TOOLTIP: 'Észleli, hogy a Pixetto meghatározott alakú objektumot érzékel-e',
	PIXETTO_FACE_DETECT_TOOLTIP: 'Észleli, hogy a Pixetto arcot érzékel-e',
	PIXETTO_APRILTAG_DETECT_TOOLTIP: 'Észleli, hogy a Pixetto meghatározott ID-jű AprilTag-et érzékel-e',
	PIXETTO_NEURAL_NETWORK_TOOLTIP: 'Észleli, hogy a Pixetto neurális hálózat meghatározott osztályú objektumot ismer-e fel',
	PIXETTO_HANDWRITTEN_DIGIT_TOOLTIP: 'Észleli, hogy a Pixetto meghatározott kézzel írt számjegyet ismer-e fel',
	PIXETTO_GET_POSITION_TOOLTIP: 'A Pixetto által észlelt objektum pozíció vagy méret információjának megszerzése',
	PIXETTO_ROAD_DETECT_TOOLTIP: 'Útészleléshez kapcsolódó információk megszerzése a Pixetto-tól',
	PIXETTO_SET_MODE_TOOLTIP: 'A Pixetto intelligens kamera funkcionális módjának beállítása',

	// Pixetto Color Options
	PIXETTO_COLOR_RED: 'Piros',
	PIXETTO_COLOR_BLUE: 'Kék',
	PIXETTO_COLOR_GREEN: 'Zöld',
	PIXETTO_COLOR_YELLOW: 'Sárga',
	PIXETTO_COLOR_ORANGE: 'Narancssárga',
	PIXETTO_COLOR_PURPLE: 'Lila',
	PIXETTO_COLOR_BLACK: 'Fekete',
	PIXETTO_COLOR_WHITE: 'Fehér',

	// Pixetto Shape Options
	PIXETTO_SHAPE_TRIANGLE: 'Háromszög',
	PIXETTO_SHAPE_RECTANGLE: 'Téglalap',
	PIXETTO_SHAPE_PENTAGON: 'Ötszög',
	PIXETTO_SHAPE_HEXAGON: 'Hatszög',
	PIXETTO_SHAPE_CIRCLE: 'Kör',

	// Pixetto Position Options
	PIXETTO_POSITION_X: 'X koordináta',
	PIXETTO_POSITION_Y: 'Y koordináta',
	PIXETTO_POSITION_WIDTH: 'Szélesség',
	PIXETTO_POSITION_HEIGHT: 'Magasság',

	// Pixetto Road Info Options
	PIXETTO_ROAD_CENTER_X: 'Központ X',
	PIXETTO_ROAD_CENTER_Y: 'Központ Y',
	PIXETTO_ROAD_LEFT_X: 'Bal határ X',
	PIXETTO_ROAD_RIGHT_X: 'Jobb határ X',

	// Pixetto Mode Options
	PIXETTO_MODE_COLOR_DETECTION: 'Színészlelés',
	PIXETTO_MODE_SHAPE_DETECTION: 'Alakzatészlelés',
	PIXETTO_MODE_FACE_DETECTION: 'Arcfelismerés',
	PIXETTO_MODE_APRILTAG_DETECTION: 'AprilTag észlelés',
	PIXETTO_MODE_NEURAL_NETWORK: 'Neurális hálózat',
	PIXETTO_MODE_HANDWRITTEN_DIGIT: 'Kézzel írt számjegy',
	PIXETTO_MODE_ROAD_DETECTION: 'Útészlelés',
	PIXETTO_MODE_BALL_DETECTION: 'Labdaészlelés',
	PIXETTO_MODE_TEMPLATE_MATCHING: 'Sablon egyeztetés',

	// HUSKYLENS Tooltips
	HUSKYLENS_INIT_I2C_TOOLTIP: 'HUSKYLENS intelligens kamera inicializálása I2C használatával',
	HUSKYLENS_INIT_UART_TOOLTIP: 'HUSKYLENS intelligens kamera inicializálása UART használatával, RX/TX lábak beállítása',
	HUSKYLENS_SET_ALGORITHM_TOOLTIP: 'A HUSKYLENS által használt felismerési algoritmus beállítása',
	HUSKYLENS_REQUEST_TOOLTIP: 'Legfrissebb felismerési eredmények kérése a HUSKYLENS-től',
	HUSKYLENS_IS_LEARNED_TOOLTIP: 'Ellenőrizze, hogy a HUSKYLENS megtanult-e objektumokat',
	HUSKYLENS_COUNT_BLOCKS_TOOLTIP: 'A HUSKYLENS által észlelt blokkok számának lekérése',
	HUSKYLENS_COUNT_ARROWS_TOOLTIP: 'A HUSKYLENS által észlelt nyilak számának lekérése',
	HUSKYLENS_GET_BLOCK_INFO_TOOLTIP: 'Meghatározott blokk információjának megszerzése (pozíció, méret vagy ID)',
	HUSKYLENS_GET_ARROW_INFO_TOOLTIP: 'Meghatározott nyíl információjának megszerzése (eredet, cél vagy ID)',
	HUSKYLENS_LEARN_TOOLTIP: 'HUSKYLENS tanítása meghatározott ID-val (csak Objektumosztályozás módban)',
	HUSKYLENS_FORGET_TOOLTIP: 'Minden tanult objektum törlése a HUSKYLENS-ből (csak Objektumosztályozás módban)',
	HUSKYLENS_I2C_PIN_HINT: 'Bekötés: ',
	HUSKYLENS_UART_PIN_HINT: 'Ajánlott pinek: ',
	HUSKYLENS_UART_ANY_DIGITAL: 'Bármely digitális pin',

	// ESP32 PWM Setup
	ESP32_PWM_SETUP: 'ESP32 PWM Beállítás',
	ESP32_PWM_FREQUENCY: 'Frekvencia',
	ESP32_PWM_RESOLUTION: 'Felbontás',
	ESP32_PWM_FREQUENCY_TOOLTIP: 'PWM frekvencia beállítása, tartomány 1-80000 Hz. Magas frekvencia motor meghajtó chipekhez (20-75KHz)',
	ESP32_PWM_RESOLUTION_TOOLTIP:
		'PWM felbontás beállítása, befolyásolja a kimeneti pontosságot. Megjegyzés: frekvencia × 2^felbontás ≤ 80 000 000',
	ESP32_PWM_RESOLUTION_8BIT: '8 bit (0-255)',
	ESP32_PWM_RESOLUTION_10BIT: '10 bit (0-1023)',
	ESP32_PWM_RESOLUTION_12BIT: '12 bit (0-4095)',
	ESP32_PWM_RESOLUTION_13BIT: '13 bit (0-8191)',
	ESP32_PWM_RESOLUTION_14BIT: '14 bit (0-16383)',
	ESP32_PWM_RESOLUTION_15BIT: '15 bit (0-32767)',
	ESP32_PWM_RESOLUTION_16BIT: '16 bit (0-65535)',

	// Safety Guard (Project Safety Protection)
	SAFETY_WARNING_BODY_NO_TYPE:
		'Ez a projekt még nem rendelkezik Blockly blokkokkal. Ha folytatja, blockly mappa és fájlok jönnek létre itt. Folytatja?',
	SAFETY_WARNING_BODY_WITH_TYPE:
		'{0} projekt észlelve. Ez a projekt még nem rendelkezik Blockly blokkokkal. Ha folytatja, blockly mappa és fájlok jönnek létre itt. Folytatja?',
	BUTTON_CONTINUE: 'Folytatás',
	BUTTON_CANCEL: 'Mégse',
	BUTTON_SUPPRESS: 'Ne emlékeztessen többé',
	SAFETY_GUARD_CANCELLED: 'A Blockly szerkesztő megnyitása megszakítva',
	SAFETY_GUARD_SUPPRESSED: 'Beállítás mentve, ez a figyelmeztetés nem fog újra megjelenni',

	// Communication Category
	CATEGORY_COMMUNICATION: 'Kommunikáció',

	// ESP32 WiFi
	ESP32_WIFI_LABEL: 'WiFi',
	ESP32_WIFI_CONNECT: 'WiFi csatlakozás',
	ESP32_WIFI_CONNECT_SSID: 'SSID',
	ESP32_WIFI_CONNECT_PASSWORD: 'Jelszó',
	ESP32_WIFI_CONNECT_TOOLTIP: 'ESP32 csatlakoztatása WiFi hálózathoz a megadott SSID-del és jelszóval',
	ESP32_WIFI_DISCONNECT: 'WiFi leválasztás',
	ESP32_WIFI_DISCONNECT_TOOLTIP: 'ESP32 leválasztása a WiFi hálózatról',
	ESP32_WIFI_STATUS: 'WiFi állapot',
	ESP32_WIFI_STATUS_TOOLTIP: 'Ellenőrizze, hogy az ESP32 csatlakozik-e WiFi hálózathoz',
	ESP32_WIFI_GET_IP: 'WiFi IP cím lekérése',
	ESP32_WIFI_GET_IP_TOOLTIP: 'Az ESP32 helyi IP címének lekérése szövegként',
	ESP32_WIFI_SCAN: 'WiFi hálózatok keresése',
	ESP32_WIFI_SCAN_TOOLTIP: 'Elérhető WiFi hálózatok keresése és a talált hálózatok számának visszaadása',
	ESP32_WIFI_GET_SSID: 'Hálózat SSID lekérése',
	ESP32_WIFI_GET_SSID_INDEX: 'index',
	ESP32_WIFI_GET_SSID_TOOLTIP: 'A megadott indexű WiFi hálózat SSID nevének lekérése',
	ESP32_WIFI_GET_RSSI: 'Hálózat RSSI lekérése',
	ESP32_WIFI_GET_RSSI_INDEX: 'index',
	ESP32_WIFI_GET_RSSI_TOOLTIP: 'A megadott indexű WiFi hálózat jelerősségének (RSSI) lekérése',

	// ESP32 MQTT
	ESP32_MQTT_LABEL: 'MQTT',
	ESP32_MQTT_SETUP: 'MQTT beállítás',
	ESP32_MQTT_SETUP_SERVER: 'Szerver',
	ESP32_MQTT_SETUP_PORT: 'Port',
	ESP32_MQTT_SETUP_CLIENT_ID: 'Kliens ID',
	ESP32_MQTT_SETUP_TOOLTIP: 'MQTT kliens konfigurálása szervercímmel, porttal és kliens azonosítóval',
	ESP32_MQTT_CONNECT: 'MQTT csatlakozás',
	ESP32_MQTT_CONNECT_USERNAME: 'Felhasználónév',
	ESP32_MQTT_CONNECT_PASSWORD: 'Jelszó',
	ESP32_MQTT_CONNECT_TOOLTIP: 'Csatlakozás MQTT brókerhez opcionális felhasználónévvel és jelszóval',
	ESP32_MQTT_PUBLISH: 'MQTT publikálás',
	ESP32_MQTT_PUBLISH_TOPIC: 'Téma',
	ESP32_MQTT_PUBLISH_MESSAGE: 'Üzenet',
	ESP32_MQTT_PUBLISH_TOOLTIP: 'Üzenet publikálása egy MQTT témába',
	ESP32_MQTT_SUBSCRIBE: 'MQTT feliratkozás',
	ESP32_MQTT_SUBSCRIBE_TOPIC: 'Téma',
	ESP32_MQTT_SUBSCRIBE_TOOLTIP: 'Feliratkozás egy MQTT témára üzenetek fogadásához',
	ESP32_MQTT_LOOP: 'MQTT ciklus',
	ESP32_MQTT_LOOP_TOOLTIP: 'Bejövő MQTT üzenetek feldolgozása (hívja a fő ciklusban)',
	ESP32_MQTT_GET_TOPIC: 'MQTT téma lekérése',
	ESP32_MQTT_GET_TOPIC_TOOLTIP: 'A legutóbb fogadott MQTT üzenet témájának lekérése',
	ESP32_MQTT_GET_MESSAGE: 'MQTT üzenet lekérése',
	ESP32_MQTT_GET_MESSAGE_TOOLTIP: 'A legutóbb fogadott MQTT üzenet tartalmának lekérése',
	ESP32_MQTT_STATUS: 'MQTT Csatlakozva',
	ESP32_MQTT_STATUS_TOOLTIP: 'Ellenőrizze, hogy csatlakozott-e az MQTT szerverhez',

	// Text to Number
	TEXT_TO_NUMBER: 'Szöveg számmá',
	TEXT_TO_NUMBER_INT: 'egész',
	TEXT_TO_NUMBER_FLOAT: 'tört',
	TEXT_TO_NUMBER_TOOLTIP: 'Szöveg átalakítása számmá (egész vagy tört)',

	// To String Block
	TO_STRING: 'Szöveggé',
	TO_STRING_TOOLTIP: 'Szám vagy logikai érték átalakítása szöveggé',

	// ESP32 Only Block Warning
	ESP32_ONLY_BLOCK_WARNING: 'Ez a blokk csak ESP32 lapkákat támogat',

	// Quick Backup Toast Messages
	BACKUP_QUICK_SAVE_SUCCESS: 'Biztonsági mentés mentve: {0}',
	BACKUP_QUICK_SAVE_EMPTY: 'A munkaterület üres, nincs szükség biztonsági mentésre',
	BACKUP_QUICK_SAVE_COOLDOWN: 'Kérem várjon, a biztonsági mentés éppen befejeződött',

	// Board Switch Warning
	BOARD_SWITCH_WARNING_TITLE: 'Lapka típus váltás',
	BOARD_SWITCH_WARNING_MESSAGE:
		'A másik lapka típusra váltás törli a jelenlegi munkaterületet.\nA munkája először automatikusan mentésre kerül.\n\nFolytatja?',

	// CyberBrick Board
	BOARD_CYBERBRICK: 'CyberBrick',

	// CyberBrick Category
	CATEGORY_CYBERBRICK_CORE: 'CyberBrick',
	CATEGORY_CYBERBRICK_LED: 'LED',
	CATEGORY_CYBERBRICK_GPIO: 'GPIO',
	CATEGORY_CYBERBRICK_TIME: 'Idő',

	// CyberBrick Main Block
	CYBERBRICK_MAIN: 'Főprogram',
	CYBERBRICK_MAIN_TOOLTIP: 'CyberBrick főprogram belépési pontja. Minden kódot ebbe a blokkba kell helyezni.',

	// CyberBrick LED Blocks
	CYBERBRICK_LED_SET_COLOR: 'LED szín beállítása',
	CYBERBRICK_LED_SET_COLOR_PREFIX: 'Beépített LED szín beállítása',
	CYBERBRICK_LED_RED: 'Piros',
	CYBERBRICK_LED_GREEN: 'Zöld',
	CYBERBRICK_LED_BLUE: 'Kék',
	CYBERBRICK_LED_SET_COLOR_TOOLTIP: 'A beépített LED (GPIO8) színének beállítása RGB értékekkel (0-255)',
	CYBERBRICK_LED_OFF: 'LED kikapcsolása',
	CYBERBRICK_LED_OFF_TOOLTIP: 'A beépített LED kikapcsolása',

	// CyberBrick GPIO Blocks
	CYBERBRICK_GPIO_SET: 'GPIO beállítása',
	CYBERBRICK_GPIO_SET_PREFIX: 'GPIO',
	CYBERBRICK_GPIO_SET_TO: 'értéke',
	CYBERBRICK_GPIO_PIN: 'Pin',
	CYBERBRICK_GPIO_VALUE: 'Érték',
	CYBERBRICK_GPIO_HIGH: 'MAGAS',
	CYBERBRICK_GPIO_LOW: 'ALACSONY',
	CYBERBRICK_GPIO_SET_TOOLTIP: 'GPIO pin beállítása MAGAS vagy ALACSONY értékre',
	CYBERBRICK_GPIO_READ: 'GPIO olvasása',
	CYBERBRICK_GPIO_READ_TOOLTIP: 'Digitális érték olvasása GPIO pinről (0 vagy 1 értéket ad vissza)',

	// CyberBrick Time Blocks
	CYBERBRICK_DELAY_MS: 'Várakozás (ms)',
	CYBERBRICK_DELAY_MS_PREFIX: 'Várakozás',
	CYBERBRICK_DELAY_MS_SUFFIX: 'ms',
	CYBERBRICK_DELAY_MS_TOOLTIP: 'Program végrehajtásának szüneteltetése a megadott ezredmásodpercig',
	CYBERBRICK_DELAY_S: 'Várakozás (mp)',
	CYBERBRICK_DELAY_S_PREFIX: 'Várakozás',
	CYBERBRICK_DELAY_S_SUFFIX: 'másodperc',
	CYBERBRICK_DELAY_S_TOOLTIP: 'Program végrehajtásának szüneteltetése a megadott másodpercig',

	// CyberBrick WiFi Blocks
	CATEGORY_CYBERBRICK_WIFI: 'WiFi',
	CYBERBRICK_WIFI_CONNECT: 'WiFi csatlakozás',
	CYBERBRICK_WIFI_SSID: 'SSID',
	CYBERBRICK_WIFI_PASSWORD: 'Jelszó',
	CYBERBRICK_WIFI_CONNECT_TOOLTIP: 'Csatlakozás a megadott WiFi hálózathoz',
	CYBERBRICK_WIFI_DISCONNECT: 'WiFi leválasztás',
	CYBERBRICK_WIFI_DISCONNECT_TOOLTIP: 'Leválasztás a jelenlegi WiFi hálózatról',
	CYBERBRICK_WIFI_IS_CONNECTED: 'WiFi csatlakozva?',
	CYBERBRICK_WIFI_IS_CONNECTED_TOOLTIP: 'Ellenőrizze, hogy csatlakozik-e a WiFi-hez',
	CYBERBRICK_WIFI_GET_IP: 'IP cím lekérése',
	CYBERBRICK_WIFI_GET_IP_TOOLTIP: 'Aktuális IP cím lekérése',

	// CyberBrick Upload
	UPLOAD_BUTTON_TITLE: 'Feltöltés CyberBrick-re',
	UPLOAD_BUTTON_DISABLED_TITLE: 'Először mentse el a munkaterületet a feltöltés engedélyezéséhez',
	UPLOAD_STARTING: 'Feltöltés indítása...',
	UPLOAD_SUCCESS: 'Feltöltés sikeres!',
	UPLOAD_FAILED: 'Feltöltés sikertelen: {0}',
	UPLOAD_NO_PORT: 'CyberBrick eszköz nem található',
	UPLOAD_IN_PROGRESS: 'Feltöltés folyamatban...',
	UPLOAD_EMPTY_WORKSPACE: 'A munkaterület üres, először adjon hozzá blokkokat',
	UPLOAD_NO_CODE: 'Nem sikerült kódot generálni',

	// Upload progress stages
	UPLOAD_STAGE_PREPARING: 'Előkészítés',
	UPLOAD_STAGE_CHECKING: 'Eszközök ellenőrzése',
	UPLOAD_STAGE_INSTALLING: 'Eszközök telepítése',
	UPLOAD_STAGE_CONNECTING: 'Eszköz csatlakoztatása',
	UPLOAD_STAGE_RESETTING: 'Eszköz visszaállítása',
	UPLOAD_STAGE_BACKUP: 'Biztonsági mentés',
	UPLOAD_STAGE_UPLOADING: 'Feltöltés',
	UPLOAD_STAGE_RESTARTING: 'Eszköz újraindítása',
	UPLOAD_STAGE_COMPLETED: 'Befejezve',

	// Upload error messages
	ERROR_UPLOAD_BOARD_UNSUPPORTED: 'Csak a CyberBrick kártya támogatott',
	ERROR_UPLOAD_CODE_EMPTY: 'A kód nem lehet üres',
	ERROR_UPLOAD_NO_PYTHON: 'PlatformIO Python környezet nem található. Először telepítse a PlatformIO-t.',
	ERROR_UPLOAD_MPREMOTE_FAILED: 'mpremote telepítése sikertelen',
	ERROR_UPLOAD_DEVICE_NOT_FOUND: 'CyberBrick eszköz nem található. Győződjön meg róla, hogy csatlakoztatva van.',
	ERROR_UPLOAD_RESET_FAILED: 'Nem sikerült visszaállítani az eszközt',
	ERROR_UPLOAD_UPLOAD_FAILED: 'Nem sikerült feltölteni a programot',
	ERROR_UPLOAD_RESTART_FAILED: 'Nem sikerült újraindítani az eszközt',

	// Arduino Upload Button
	UPLOAD_BUTTON_TITLE_ARDUINO: 'Fordítás és Feltöltés',
	UPLOAD_SELECT_BOARD: 'Kérjük, először válasszon egy panelt',

	// Arduino Upload Stages
	ARDUINO_STAGE_SYNCING: 'Beállítások szinkronizálása',
	ARDUINO_STAGE_SAVING: 'Munkaterület mentése',
	ARDUINO_STAGE_CHECKING: 'Fordító ellenőrzése',
	ARDUINO_STAGE_DETECTING: 'Panel észlelése',
	ARDUINO_STAGE_COMPILING: 'Fordítás',
	ARDUINO_STAGE_UPLOADING: 'Feltöltés',

	// Arduino Upload Results
	ARDUINO_COMPILE_SUCCESS: 'Fordítás sikeres!',
	ARDUINO_UPLOAD_SUCCESS: 'Feltöltés sikeres!',

	// Arduino Upload Errors
	ERROR_ARDUINO_PIO_NOT_FOUND: 'PlatformIO CLI nem található. Kérjük, először telepítse a PlatformIO-t.',
	ERROR_ARDUINO_COMPILE_FAILED: 'Fordítás sikertelen',
	ERROR_ARDUINO_UPLOAD_FAILED: 'Feltöltés sikertelen',
	ERROR_ARDUINO_NO_WORKSPACE: 'Kérjük, először nyisson meg egy projektmappát',
	ERROR_ARDUINO_TIMEOUT: 'A művelet időtúllépése',
	ERROR_ARDUINO_DEVICE_DISCONNECT: 'Az eszköz lecsatlakozott',

	// Backup messages
	BACKUP_CONFIRM_DELETE: 'Biztosan törölni szeretné a(z) "{0}" biztonsági mentést?',
	BACKUP_CONFIRM_RESTORE: 'Biztosan visszaállítja a(z) "{0}" biztonsági mentést? Ez felülírja az aktuális munkaterületet.',
	BACKUP_ERROR_NOT_FOUND: 'A(z) "{0}" biztonsági mentés nem található',
	BACKUP_ERROR_CREATE_FAILED: 'Nem sikerült létrehozni a biztonsági mentést: {0}',
	BACKUP_ERROR_DELETE_FAILED: 'Nem sikerült törölni a biztonsági mentést: {0}',
	BACKUP_ERROR_RESTORE_FAILED: 'Nem sikerült visszaállítani a biztonsági mentést: {0}',
	BACKUP_ERROR_PREVIEW_FAILED: 'Nem sikerült előnézni a biztonsági mentést: {0}',
	BACKUP_ERROR_NAME_NOT_SPECIFIED: 'Nincs megadva a biztonsági mentés neve',
	BACKUP_ERROR_MAIN_NOT_FOUND: 'A main.json fájl nem található',
	BACKUP_ERROR_UPDATE_SETTINGS_FAILED: 'Nem sikerült frissíteni az automatikus biztonsági mentés beállításait',

	// Button labels
	BUTTON_DELETE: 'Törlés',
	BUTTON_RESTORE: 'Visszaállítás',

	// Error messages
	ERROR_PROCESSING_MESSAGE: 'Hiba az üzenet feldolgozása közben: {0}',
	ERROR_SETTINGS_UPDATE_FAILED: 'Nem sikerült frissíteni a beállításokat',
	ERROR_RELOAD_WORKSPACE_FAILED: 'Nem sikerült újratölteni a munkaterületet: {0}',
	ERROR_OPEN_PROJECT_FOLDER_FIRST: 'Kérjük, először nyisson meg egy projektmappát',

	// Info messages
	INFO_NO_BACKUPS_TO_PREVIEW: 'Nincsenek biztonsági mentés fájlok az előnézethez',

	// Dialog messages
	DIALOG_SELECT_BACKUP_TITLE: 'Válassza ki a biztonsági mentés fájlt az előnézethez',
	DIALOG_BACKUP_FILES_LABEL: 'Biztonsági mentés fájlok',
});
