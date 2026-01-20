/**
 * @license
 * Copyright 2025 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file contains translations derived from Blockly project
 * Copyright 2012 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

// Define translations for Italian
window.languageManager.loadMessages('it', {
	// UI Elements
	BLOCKS_TAB: 'Blocchi',
	CODE_TAB: 'Codice',
	BOARD_SELECT_LABEL: 'Seleziona scheda:',
	LANGUAGE_SELECT_TOOLTIP: 'Seleziona lingua',
	LANGUAGE_AUTO: 'Automatico (segui VS Code)',

	// Experimental Blocks Notice
	EXPERIMENTAL_BLOCKS_TITLE: 'Blocchi sperimentali rilevati',
	EXPERIMENTAL_BLOCKS_DESC:
		'Il tuo spazio di lavoro contiene blocchi sperimentali (evidenziati con bordi gialli tratteggiati). Queste funzionalità potrebbero cambiare o essere rimosse in futuri aggiornamenti, usale con cautela.',

	// Preview Mode UI
	PREVIEW_BADGE: 'Anteprima',
	THEME_TOGGLE: 'Cambia tema',
	PREVIEW_WINDOW_TITLE: 'Anteprima Blockly - {0}',
	PREVIEW_WINDOW_TITLE_WITH_NAME: 'Anteprima - {0}',

	// Backup Modal UI
	BACKUP_MANAGER_TITLE: 'Gestione backup',
	BACKUP_CREATE_NEW: 'Crea nuovo backup',
	BACKUP_NAME_LABEL: 'Nome backup:',
	BACKUP_NAME_PLACEHOLDER: 'Inserisci nome backup',
	BACKUP_CONFIRM: 'Conferma',
	BACKUP_CANCEL: 'Annulla',
	BACKUP_LIST_TITLE: 'Lista backup',
	BACKUP_LIST_EMPTY: 'Nessun backup disponibile',
	BACKUP_BUTTON_TITLE: 'Gestione backup',
	REFRESH_BUTTON_TITLE: 'Aggiorna codice',
	BACKUP_PREVIEW_BTN: 'Anteprima',
	BACKUP_RESTORE_BTN: 'Ripristina',
	BACKUP_DELETE_BTN: 'Elimina',
	AUTO_BACKUP_TITLE: 'Impostazioni backup automatico',
	AUTO_BACKUP_INTERVAL_LABEL: 'Intervallo di backup:',
	AUTO_BACKUP_MINUTES: 'minuti',
	AUTO_BACKUP_SAVE: 'Salva impostazioni',
	AUTO_BACKUP_SAVED: 'Impostazioni backup automatico salvate',
	AUTO_BACKUP_PREFIX: 'auto_',
	MANUAL_BACKUP_TITLE: 'Backup manuale',

	// Board Names
	BOARD_NONE: 'Nessuno',
	BOARD_UNO: 'Arduino Uno',
	BOARD_NANO: 'Arduino Nano',
	BOARD_MEGA: 'Arduino Mega',
	BOARD_ESP32: 'ESP32',
	BOARD_SUPERMINI: 'Super Mini',
	// Block Search UI
	FUNCTION_SEARCH_TITLE: 'Cerca Blocchi',
	FUNCTION_SEARCH_BUTTON_TITLE: 'Cerca Blocchi',
	FUNCTION_SEARCH_PLACEHOLDER: 'Inserisci nome blocco o parametri...',
	FUNCTION_SEARCH_BTN: 'Cerca',
	FUNCTION_SEARCH_PREV: 'Precedente',
	FUNCTION_SEARCH_NEXT: 'Successivo',
	FUNCTION_SEARCH_EMPTY: 'Ricerca non ancora effettuata',
	FUNCTION_SEARCH_NO_RESULTS: 'Nessun blocco corrispondente trovato',
	FUNCTION_RESULT_PREFIX: 'Blocco: ',
	FUNCTION_KEYBOARD_SHORTCUT_TIP: '(Scorciatoia: Ctrl+F)',
	FUNCTION_SEARCH_HISTORY_TITLE: 'Cronologia ricerche',

	// Block Categories
	CATEGORY_LOGIC: 'Logica',
	CATEGORY_LOOPS: 'Cicli',
	CATEGORY_MATH: 'Matematica',
	CATEGORY_TEXT: 'Testo',
	CATEGORY_LISTS: 'Liste',
	CATEGORY_VARIABLES: 'Variabili',
	CATEGORY_FUNCTIONS: 'Funzioni',
	CATEGORY_ARDUINO: 'Arduino',
	CATEGORY_SENSORS: 'Sensori',
	CATEGORY_MOTORS: 'Motori',
	VISION_SENSORS_CATEGORY: 'Sensori di Visione',
	// Servo Block Labels
	SERVO_SETUP: 'Configura Servo Motore',
	SERVO_PIN: 'Pin',
	SERVO_SETUP_TOOLTIP: 'Dichiara variabile servo motore e imposta pin',
	SERVO_MOVE: 'Ruota Servo Motore',
	SERVO_ANGLE: 'Angolo',
	SERVO_MOVE_TOOLTIP: 'Ruota servo motore ad un angolo specifico',
	SERVO_STOP: 'Ferma Servo Motore',
	SERVO_STOP_TOOLTIP: 'Interrompi segnale di uscita del servo motore',

	// Encoder Motor Control
	ENCODER_SETUP: 'Configura Motore Encoder',
	ENCODER_NAME: 'Nome',
	ENCODER_PIN_A: 'Pin A',
	ENCODER_PIN_B: 'Pin B',
	ENCODER_USE_INTERRUPT: 'Usa Interrupt',
	ENCODER_SETUP_TOOLTIP: 'Configura motore encoder con nome e configurazioni pin',
	ENCODER_READ: 'Leggi Encoder',
	ENCODER_READ_TOOLTIP: "Ottieni posizione attuale dell'encoder",
	ENCODER_RESET: 'Ripristina Encoder',
	ENCODER_RESET_TOOLTIP: 'Ripristina posizione encoder a zero',
	ENCODER_PID_SETUP: 'Configura Controllo PID',
	ENCODER_PID_MOTOR: 'Motore',
	ENCODER_PID_KP: 'Kp',
	ENCODER_PID_KI: 'Ki',
	ENCODER_PID_KD: 'Kd',
	ENCODER_PID_MODE: 'Modalità',
	ENCODER_PID_MODE_POSITION: 'Posizione',
	ENCODER_PID_MODE_SPEED: 'Velocità',
	ENCODER_PID_SETUP_TOOLTIP: 'Configura controllo PID per controllo motore preciso. Seleziona modalità posizione o velocità.',
	ENCODER_PID_COMPUTE: 'Calcola PID',
	ENCODER_PID_TARGET: 'Obiettivo',
	ENCODER_PID_COMPUTE_TOOLTIP: 'Calcola output controllo PID basato su posizione obiettivo',
	ENCODER_PID_RESET: 'Reimposta PID',
	ENCODER_PID_RESET_TOOLTIP: 'Reimposta lo stato del controller PID (cancella accumulo integrale, reimposta contatore)',

	// Arduino Block Labels
	ARDUINO_SETUP: 'Configurazione',
	ARDUINO_LOOP: 'Loop',
	ARDUINO_DIGITAL_WRITE: 'Scrittura Digitale',
	ARDUINO_DIGITAL_READ: 'Lettura Digitale',
	ARDUINO_ANALOG_WRITE: 'Scrittura Analogica',
	ARDUINO_ANALOG_READ: 'Lettura Analogica',
	ARDUINO_PIN: 'Pin',
	ARDUINO_VALUE: 'Valore',
	ARDUINO_DELAY: 'Ritardo',
	ARDUINO_DELAY_MS: 'millisecondi',
	ARDUINO_PULLUP: 'Attiva Resistenza di Pull-up Interna',
	ARDUINO_MODE: 'Modalità',
	ARDUINO_MODE_INPUT: 'INPUT',
	ARDUINO_MODE_OUTPUT: 'OUTPUT',

	// Sensor Block Labels
	ULTRASONIC_SENSOR: 'Sensore a Ultrasuoni',
	ULTRASONIC_TRIG_PIN: 'Pin Trig',
	ULTRASONIC_ECHO_PIN: 'Pin Echo',
	ULTRASONIC_USE_INTERRUPT: 'Usa Interrupt Hardware',
	ULTRASONIC_READ: 'Leggi Distanza Ultrasuoni (cm)',
	ULTRASONIC_TOOLTIP_SETUP:
		'Configura il sensore a ultrasuoni con i pin Trig ed Echo. Interrupt hardware opzionale per una maggiore precisione.',
	ULTRASONIC_TOOLTIP_READ: 'Legge la distanza misurata dal sensore a ultrasuoni in centimetri.',
	ULTRASONIC_WARNING: 'Il pin Echo {0} selezionato non supporta gli interrupt hardware. Si prega di scegliere uno di questi pin: {1}',

	// Duration block
	DURATION_REPEAT: 'Ripeti per',
	DURATION_TIME: 'tempo',
	DURATION_MS: 'millisecondi',
	DURATION_DO: 'esegui',

	// Threshold Function Block Labels
	THRESHOLD_PIN: 'su',
	THRESHOLD_VALUE: 'se >',
	THRESHOLD_HIGH_VALUE: '=',
	THRESHOLD_LOW_VALUE: 'altrimenti',
	THRESHOLD_TOOLTIP_SETUP:
		"Configura una funzione di soglia. Quando l'ingresso analogico supera la soglia, restituisce il primo output, altrimenti restituisce il secondo output.",
	THRESHOLD_TOOLTIP_READ: 'Ottieni il valore dalla funzione di soglia',

	// Print block
	TEXT_PRINT_SHOW: 'stampa',
	TEXT_PRINT_NEWLINE: 'nuova riga',

	// Pin Mode block
	PIN_MODE_SET: 'imposta',

	// Function Block Labels
	FUNCTION_CREATE: 'Crea Funzione',
	FUNCTION_NAME: 'Nome',
	FUNCTION_PARAMS: 'Parametri',
	FUNCTION_RETURN: 'Ritorna',
	FUNCTION_CALL: 'Chiama',

	// Logic Block Labels
	LOGIC_IF: 'se',
	LOGIC_ELSE: 'altrimenti',
	LOGIC_THEN: 'allora',
	LOGIC_AND: 'e',
	LOGIC_OR: 'o',
	LOGIC_NOT: 'non',
	LOGIC_TRUE: 'vero',
	LOGIC_FALSE: 'falso',

	// Loop Block Labels
	LOOP_REPEAT: 'ripeti',
	LOOP_WHILE: 'mentre',
	LOOP_UNTIL: 'fino a',
	LOOP_FOR: 'per',
	LOOP_FOREACH: 'per ogni',
	LOOP_BREAK: 'interrompi',
	LOOP_CONTINUE: 'continua',

	// Math Block Labels
	MATH_NUMBER: 'numero',
	MATH_ARITHMETIC: 'aritmetica',
	MATH_OPERATIONS: 'operazioni',
	MATH_ADD: 'aggiungi',
	MATH_SUBTRACT: 'sottrai',
	MATH_MULTIPLY: 'moltiplica',
	MATH_DIVIDE: 'dividi',
	MATH_POWER: 'potenza',

	// Math Map Block
	MATH_MAP_VALUE: 'mappa',
	MATH_MAP_TOOLTIP:
		'Rimappa un numero da un intervallo a un altro. Ad esempio, map(valore, 0, 1023, 0, 255) ridimensionerà un input analogico a un output PWM a 8 bit.',

	// VS Code UI Messages
	VSCODE_OPEN_FOLDER: 'Apri Cartella',
	VSCODE_PLEASE_OPEN_PROJECT: 'Per favore, apri prima una cartella di progetto!',
	VSCODE_FAILED_SAVE_FILE: 'Impossibile salvare il file: {0}',
	VSCODE_FAILED_UPDATE_INI: 'Impossibile aggiornare platformio.ini: {0}',
	VSCODE_UNABLE_SAVE_WORKSPACE: "Impossibile salvare lo stato dell'area di lavoro: {0}",
	VSCODE_FAILED_START: 'Avvio di Singular Blockly fallito: {0}',
	VSCODE_CONFIRM_DELETE_VARIABLE: 'Sei sicuro di voler eliminare la variabile "{0}"?',
	VSCODE_BOARD_UPDATED: 'Configurazione della scheda aggiornata a: {0}',
	VSCODE_RELOAD_REQUIRED: '，Riavviare la finestra per completare la configurazione',
	VSCODE_ENTER_VARIABLE_NAME: 'Inserisci il nome della nuova variabile',
	VSCODE_ENTER_NEW_VARIABLE_NAME: 'Inserisci il nuovo nome della variabile (attuale: {0})',
	VSCODE_VARIABLE_NAME_EMPTY: 'Il nome della variabile non può essere vuoto',
	VSCODE_VARIABLE_NAME_INVALID:
		'Il nome della variabile può contenere solo lettere, numeri e underscore, e non può iniziare con un numero',
	VSCODE_RELOAD: 'Riavvia',
	VSCODE_OK: 'OK',
	VSCODE_CANCEL: 'Annulla',
	VSCODE_OPEN_BLOCKLY_EDITOR: 'Apri Editor Blockly',

	// Error Messages
	ERROR_BOARD_NOT_SELECTED: 'Per favore, seleziona prima una scheda',
	ERROR_INVALID_PIN: 'Numero di pin non valido',
	ERROR_INVALID_VALUE: 'Valore non valido',
	ERROR_MISSING_TRANSLATION: 'Traduzione mancante',

	// Blockly core messages
	ADD: 'aggiungi',
	REMOVE: 'rimuovi',
	RENAME: 'rinomina',
	NEW: 'nuovo',
	ADD_COMMENT: 'Aggiungi Commento',
	REMOVE_COMMENT: 'Rimuovi Commento',
	DUPLICATE_BLOCK: 'Duplica',
	HELP: 'Aiuto',
	UNDO: 'Annulla',
	REDO: 'Ripeti',
	COLLAPSE_BLOCK: 'Compatta Blocco',
	EXPAND_BLOCK: 'Espandi Blocco',
	DELETE_BLOCK: 'Elimina Blocco',
	DELETE_X_BLOCKS: 'Elimina %1 Blocchi',
	DELETE_ALL_BLOCKS: 'Eliminare tutti i %1 blocchi?',
	CLEAN_UP: 'Riordina Blocchi',
	COLLAPSE_ALL: 'Compatta Blocchi',
	EXPAND_ALL: 'Espandi Blocchi',
	DISABLE_BLOCK: 'Disabilita Blocco',
	ENABLE_BLOCK: 'Abilita Blocco',
	INLINE_INPUTS: 'Input in Linea',
	EXTERNAL_INPUTS: 'Input Esterni',

	// Variable & Function messages
	RENAME_VARIABLE: 'Rinomina variabile...',
	NEW_VARIABLE: 'Crea variabile...',
	DELETE_VARIABLE: 'Elimina variabile %1',
	PROCEDURE_ALREADY_EXISTS: 'Una procedura chiamata "%1" esiste già.',

	// Logic block messages
	CONTROLS_IF_MSG_IF: 'se',
	CONTROLS_IF_MSG_THEN: 'allora',
	CONTROLS_IF_MSG_ELSE: 'altrimenti',
	CONTROLS_IF_MSG_ELSEIF: 'altrimenti se',
	CONTROLS_IF_IF_TITLE_IF: 'se',
	CONTROLS_IF_ELSEIF_TITLE_ELSEIF: 'altrimenti se',
	CONTROLS_IF_ELSE_TITLE_ELSE: 'altrimenti',
	LOGIC_COMPARE_TOOLTIP_EQ: 'Restituisce vero se entrambi gli input sono uguali.',
	LOGIC_COMPARE_TOOLTIP_NEQ: 'Restituisce vero se gli input non sono uguali tra loro.',
	LOGIC_COMPARE_TOOLTIP_LT: 'Restituisce vero se il primo input è minore del secondo.',
	LOGIC_COMPARE_TOOLTIP_LTE: 'Restituisce vero se il primo input è minore o uguale al secondo.',
	LOGIC_COMPARE_TOOLTIP_GT: 'Restituisce vero se il primo input è maggiore del secondo.',
	LOGIC_COMPARE_TOOLTIP_GTE: 'Restituisce vero se il primo input è maggiore o uguale al secondo.',
	LOGIC_OPERATION_AND: 'e',
	LOGIC_OPERATION_OR: 'o',
	LOGIC_NEGATE_TITLE: 'non %1',
	LOGIC_BOOLEAN_TRUE: 'vero',
	LOGIC_BOOLEAN_FALSE: 'falso',
	LOGIC_NULL: 'nullo',

	// Additional Logic Block Messages
	LOGIC_COMPARE_HELPURL: 'https://it.wikipedia.org/wiki/Disuguaglianza_(matematica)',
	LOGIC_NEGATE_HELPURL: 'https://github.com/google/blockly/wiki/Logic#not',
	LOGIC_NEGATE_TOOLTIP: "Restituisce vero se l'input è falso. Restituisce falso se l'input è vero.",
	LOGIC_OPERATION_TOOLTIP_AND: 'Restituisce vero se entrambi gli input sono veri.',
	LOGIC_OPERATION_TOOLTIP_OR: 'Restituisce vero se almeno uno degli input è vero.',
	LOGIC_BOOLEAN_TOOLTIP: 'Restituisce vero o falso.',

	// Loop block messages
	CONTROLS_REPEAT_TITLE: 'ripeti %1 volte',
	CONTROLS_REPEAT_INPUT_DO: 'fai',
	CONTROLS_WHILEUNTIL_OPERATOR_WHILE: 'ripeti finché',
	CONTROLS_WHILEUNTIL_OPERATOR_UNTIL: 'ripeti fino a',
	CONTROLS_FOR_TITLE: 'conta con %1 da %2 a %3 con incremento di %4',
	CONTROLS_FLOW_STATEMENTS_OPERATOR_BREAK: 'esci dal ciclo',
	CONTROLS_FLOW_STATEMENTS_OPERATOR_CONTINUE: 'continua con la prossima iterazione',
	CONTROLS_REPEAT_TOOLTIP: 'Ripeti alcune istruzioni più volte.',
	CONTROLS_WHILEUNTIL_TOOLTIP_WHILE: 'Esegui le istruzioni finché una condizione è vera.',
	CONTROLS_WHILEUNTIL_TOOLTIP_UNTIL: 'Esegui le istruzioni finché una condizione è falsa.',
	CONTROLS_FOR_TOOLTIP: "Conta dal numero iniziale a quello finale con l'intervallo specificato.",
	CONTROLS_FLOW_STATEMENTS_WARNING: "Attenzione: Questo blocco può essere usato solo all'interno di un ciclo.",

	// Math block messages
	MATH_NUMBER_HELPURL: 'https://it.wikipedia.org/wiki/Numero',
	MATH_NUMBER_TOOLTIP: 'Un numero.',
	MATH_ARITHMETIC_OPERATOR_ADD: '+',
	MATH_ARITHMETIC_OPERATOR_MINUS: '-',
	MATH_ARITHMETIC_OPERATOR_MULTIPLY: '×',
	MATH_ARITHMETIC_OPERATOR_DIVIDE: '÷',
	MATH_ARITHMETIC_OPERATOR_POWER: '^',
	MATH_SINGLE_OPERATOR_ROOT: 'radice quadrata',
	MATH_SINGLE_OPERATOR_ABSOLUTE: 'valore assoluto',
	MATH_IS_EVEN: 'è pari',
	MATH_IS_ODD: 'è dispari',
	MATH_IS_PRIME: 'è primo',
	MATH_IS_WHOLE: 'è intero',
	MATH_IS_POSITIVE: 'è positivo',
	MATH_IS_NEGATIVE: 'è negativo',
	MATH_ARITHMETIC_HELPURL: 'https://it.wikipedia.org/wiki/Aritmetica',
	MATH_ARITHMETIC_TOOLTIP_ADD: 'Restituisce la somma di due numeri.',
	MATH_ARITHMETIC_TOOLTIP_MINUS: 'Restituisce la differenza tra due numeri.',
	MATH_ARITHMETIC_TOOLTIP_MULTIPLY: 'Restituisce il prodotto di due numeri.',
	MATH_ARITHMETIC_TOOLTIP_DIVIDE: 'Restituisce il quoziente di due numeri.',
	MATH_ARITHMETIC_TOOLTIP_POWER: 'Restituisce il primo numero elevato alla potenza del secondo.',

	// Text block messages
	TEXT_JOIN_TITLE_CREATEWITH: 'crea testo con',
	TEXT_CREATE_JOIN_TITLE_JOIN: 'unisci',
	TEXT_LENGTH_TITLE: 'lunghezza di %1',
	TEXT_ISEMPTY_TITLE: '%1 è vuoto',
	TEXT_INDEXOF_OPERATOR_FIRST: 'trova la prima occorrenza del testo',
	TEXT_INDEXOF_OPERATOR_LAST: "trova l'ultima occorrenza del testo",
	TEXT_CHARAT_FROM_START: 'prendi lettera #',
	TEXT_CHARAT_FROM_END: 'prendi lettera # dalla fine',
	TEXT_CHARAT_FIRST: 'prendi la prima lettera',
	TEXT_CHARAT_LAST: "prendi l'ultima lettera",
	TEXT_CHARAT_RANDOM: 'prendi una lettera a caso',
	TEXT_JOIN_TOOLTIP: 'Crea un pezzo di testo unendo un qualsiasi numero di elementi.',
	TEXT_APPEND_VARIABLE: 'elemento',
	TEXT_APPEND_TOOLTIP: 'Aggiungi del testo alla variabile "%1".',
	TEXT_LENGTH_TOOLTIP: 'Restituisce il numero di lettere (inclusi gli spazi) nel testo fornito.',
	TEXT_ISEMPTY_TOOLTIP: 'Restituisce vero se il testo fornito è vuoto.',

	// List block messages
	LISTS_CREATE_EMPTY_TITLE: 'crea lista vuota',
	LISTS_CREATE_WITH_INPUT_WITH: 'crea lista con',
	LISTS_LENGTH_TITLE: 'lunghezza di %1',
	LISTS_ISEMPTY_TITLE: '%1 è vuota',
	LISTS_INDEXOF_FIRST: "trova la prima occorrenza dell'elemento",
	LISTS_INDEXOF_LAST: "trova l'ultima occorrenza dell'elemento",
	LISTS_GET_INDEX_GET: 'prendi',
	LISTS_GET_INDEX_REMOVE: 'rimuovi',
	LISTS_GET_INDEX_FROM_START: '#',
	LISTS_GET_INDEX_FROM_END: '# dalla fine',
	LISTS_GET_INDEX_FIRST: 'primo',
	LISTS_GET_INDEX_LAST: 'ultimo',
	LISTS_GET_INDEX_RANDOM: 'casuale',
	LISTS_CREATE_WITH_TOOLTIP: 'Crea una lista con un qualsiasi numero di elementi.',
	LISTS_CREATE_EMPTY_TOOLTIP: 'Restituisce una lista, di lunghezza 0, senza dati',
	LISTS_LENGTH_TOOLTIP: 'Restituisce la lunghezza di una lista.',
	LISTS_ISEMPTY_TOOLTIP: 'Restituisce vero se la lista è vuota.',

	// Variables
	VARIABLES_SET: 'imposta %1 a %2',
	VARIABLES_GET: '%1',
	VARIABLES_DEFAULT_NAME: 'elemento',

	// If conditions
	CONTROLS_IF_TOOLTIP_1: 'Se un valore è vero, esegui alcune istruzioni.',
	CONTROLS_IF_TOOLTIP_2: 'Se un valore è vero, esegui il primo blocco di istruzioni. Altrimenti, esegui il secondo blocco di istruzioni.',
	CONTROLS_IF_TOOLTIP_3:
		'Se il primo valore è vero, esegui il primo blocco di istruzioni. Altrimenti, se il secondo valore è vero, esegui il secondo blocco di istruzioni.',
	CONTROLS_IF_TOOLTIP_4:
		"Se il primo valore è vero, esegui il primo blocco di istruzioni. Altrimenti, se il secondo valore è vero, esegui il secondo blocco di istruzioni. Se nessuno dei valori è vero, esegui l'ultimo blocco di istruzioni.",

	// Procedures
	PROCEDURES_DEFNORETURN_TITLE: '',
	PROCEDURES_DEFNORETURN_PROCEDURE: 'fai qualcosa',
	PROCEDURES_BEFORE_PARAMS: 'con:',
	PROCEDURES_CALL_BEFORE_PARAMS: 'con:',
	PROCEDURES_DEFNORETURN_DO: '',
	PROCEDURES_DEFNORETURN_TOOLTIP: 'Crea una funzione senza output.',
	PROCEDURES_DEFRETURN_RETURN: 'ritorna',
	PROCEDURES_DEFRETURN_TOOLTIP: 'Crea una funzione con un output.',
	PROCEDURES_DEFRETURN_COMMENT: 'Descrivi questa funzione...',
	PROCEDURES_DEFRETURN_PROCEDURE: 'fai qualcosa con ritorno',
	PROCEDURES_DEFRETURN_DO: '',
	PROCEDURES_CALLNORETURN_HELPURL: 'https://it.wikipedia.org/wiki/Sottoprogramma',
	PROCEDURES_CALLNORETURN_TOOLTIP: "Esegui la funzione definita dall'utente.",
	PROCEDURES_CALLRETURN_HELPURL: 'https://it.wikipedia.org/wiki/Sottoprogramma',
	PROCEDURES_CALLRETURN_TOOLTIP: "Esegui la funzione definita dall'utente e usa il suo output.",

	// Seven Segment Display
	SEVEN_SEGMENT_DISPLAY: 'Display a Sette Segmenti',
	SEVEN_SEGMENT_COMMON_CATHODE: 'Catodo Comune',
	SEVEN_SEGMENT_COMMON_ANODE: 'Anodo Comune',
	SEVEN_SEGMENT_NUMBER: 'Numero (0-9):',
	SEVEN_SEGMENT_DECIMAL_POINT: 'Punto Decimale',
	SEVEN_SEGMENT_TOOLTIP: 'Visualizza un numero (0-9) su un display a sette segmenti con punto decimale opzionale.',
	// Seven Segment Display Pins
	SEVEN_SEGMENT_PINS_SET: 'Imposta i pin del display a sette segmenti',
	SEVEN_SEGMENT_PINS_TOOLTIP: 'Configura i pin per ciascun segmento (A-G) e il punto decimale (DP) del display a sette segmenti.',
	// Pixetto Smart Camera
	PIXETTO_INIT: 'Inizializza fotocamera intelligente Pixetto',
	PIXETTO_RX_PIN: 'Pin RX',
	PIXETTO_TX_PIN: 'Pin TX',
	PIXETTO_IS_DETECTED: 'Pixetto Oggetto Rilevato',
	PIXETTO_GET_TYPE_ID: 'Pixetto Ottieni ID Tipo',
	PIXETTO_GET_FUNC_ID: 'Pixetto Ottieni ID Funzione',
	PIXETTO_COLOR_DETECT: 'Pixetto Rilevamento colore',
	PIXETTO_SHAPE_DETECT: 'Pixetto Rilevamento forma',
	PIXETTO_FACE_DETECT: 'Pixetto Rilevamento volto',
	PIXETTO_APRILTAG_DETECT: 'Pixetto Rilevamento AprilTag',
	PIXETTO_NEURAL_NETWORK: 'Pixetto Riconoscimento rete neurale',
	PIXETTO_HANDWRITTEN_DIGIT: 'Pixetto Riconoscimento cifra scritta a mano',
	PIXETTO_GET_POSITION: 'Pixetto Ottieni oggetto rilevato',
	PIXETTO_ROAD_DETECT: 'Pixetto Rilevamento strada',
	PIXETTO_SET_MODE: 'Imposta modalità funzione Pixetto',
	PIXETTO_COLOR: 'Colore',
	PIXETTO_SHAPE: 'Forma',
	PIXETTO_MODE: 'Modalità',
	PIXETTO_TAG_ID: 'ID tag',
	PIXETTO_CLASS_ID: 'ID classe',
	PIXETTO_DIGIT: 'Cifra',
	PIXETTO_COORDINATE: 'Coordinata',
	PIXETTO_ROAD_INFO: 'Informazione', // Vision Sensors Category Labels
	PIXETTO_LABEL: 'Pixetto',
	HUSKYLENS_LABEL: 'HUSKYLENS',
	// HUSKYLENS Smart Camera
	HUSKYLENS_INIT_I2C: 'Inizializza HUSKYLENS (I2C)',
	HUSKYLENS_INIT_UART: 'Inizializza HUSKYLENS (UART)',
	HUSKYLENS_RX_PIN: 'Connetti a HuskyLens TX →',
	HUSKYLENS_TX_PIN: 'Connetti a HuskyLens RX →',
	HUSKYLENS_SET_ALGORITHM: 'Imposta algoritmo HUSKYLENS su',
	HUSKYLENS_ALGORITHM_FACE_RECOGNITION: 'Riconoscimento facciale',
	HUSKYLENS_ALGORITHM_OBJECT_TRACKING: 'Tracciamento oggetti',
	HUSKYLENS_ALGORITHM_OBJECT_RECOGNITION: 'Riconoscimento oggetti',
	HUSKYLENS_ALGORITHM_LINE_TRACKING: 'Tracciamento linee',
	HUSKYLENS_ALGORITHM_COLOR_RECOGNITION: 'Riconoscimento colori',
	HUSKYLENS_ALGORITHM_TAG_RECOGNITION: 'Riconoscimento tag',
	HUSKYLENS_ALGORITHM_OBJECT_CLASSIFICATION: 'Classificazione oggetti',
	HUSKYLENS_REQUEST: 'Richiedi risultato riconoscimento HUSKYLENS',
	HUSKYLENS_IS_LEARNED: 'HUSKYLENS ha appreso oggetti',
	HUSKYLENS_COUNT_BLOCKS: 'Numero blocchi rilevati HUSKYLENS',
	HUSKYLENS_COUNT_ARROWS: 'Numero frecce rilevate HUSKYLENS',
	HUSKYLENS_GET_BLOCK_INFO: 'Ottieni blocco',
	HUSKYLENS_GET_ARROW_INFO: 'Ottieni freccia',
	HUSKYLENS_BLOCK_INFO_TYPE: ' ',
	HUSKYLENS_ARROW_INFO_TYPE: ' ',
	HUSKYLENS_X_CENTER: 'Centro X',
	HUSKYLENS_Y_CENTER: 'Centro Y',
	HUSKYLENS_WIDTH: 'Larghezza',
	HUSKYLENS_HEIGHT: 'Altezza',
	HUSKYLENS_ID: 'ID',
	HUSKYLENS_X_ORIGIN: 'X origine',
	HUSKYLENS_Y_ORIGIN: 'Y origine',
	HUSKYLENS_X_TARGET: 'X destinazione',
	HUSKYLENS_Y_TARGET: 'Y destinazione',
	HUSKYLENS_LEARN: 'Lascia che HUSKYLENS apprenda ID',
	HUSKYLENS_FORGET: 'Lascia che HUSKYLENS dimentichi tutto appreso',

	// Pixetto Tooltips
	PIXETTO_INIT_TOOLTIP: 'Inizializza la fotocamera intelligente Pixetto e imposta i pin di comunicazione UART',
	PIXETTO_IS_DETECTED_TOOLTIP: 'Rileva se Pixetto rileva qualche oggetto',
	PIXETTO_GET_TYPE_ID_TOOLTIP: "Ottieni l'ID del tipo di oggetto rilevato da Pixetto (colore, forma, ecc.)",
	PIXETTO_GET_FUNC_ID_TOOLTIP: "Ottieni l'ID della funzione attualmente utilizzata da Pixetto (rilevamento colore, forma, ecc.)",
	PIXETTO_COLOR_DETECT_TOOLTIP: 'Rileva se Pixetto rileva un oggetto del colore specificato',
	PIXETTO_SHAPE_DETECT_TOOLTIP: 'Rileva se Pixetto rileva un oggetto della forma specificata',
	PIXETTO_FACE_DETECT_TOOLTIP: 'Rileva se Pixetto rileva un volto',
	PIXETTO_APRILTAG_DETECT_TOOLTIP: 'Rileva se Pixetto rileva un AprilTag con ID specificato',
	PIXETTO_NEURAL_NETWORK_TOOLTIP: 'Rileva se la rete neurale Pixetto riconosce un oggetto della classe specificata',
	PIXETTO_HANDWRITTEN_DIGIT_TOOLTIP: 'Rileva se Pixetto riconosce una cifra scritta a mano specificata',
	PIXETTO_GET_POSITION_TOOLTIP: "Ottieni informazioni sulla posizione o dimensione dell'oggetto rilevato da Pixetto",
	PIXETTO_ROAD_DETECT_TOOLTIP: 'Ottieni informazioni relative al rilevamento stradale da Pixetto',
	PIXETTO_SET_MODE_TOOLTIP: 'Imposta la modalità funzionale della fotocamera intelligente Pixetto',

	// Pixetto Color Options
	PIXETTO_COLOR_RED: 'Rosso',
	PIXETTO_COLOR_BLUE: 'Blu',
	PIXETTO_COLOR_GREEN: 'Verde',
	PIXETTO_COLOR_YELLOW: 'Giallo',
	PIXETTO_COLOR_ORANGE: 'Arancione',
	PIXETTO_COLOR_PURPLE: 'Viola',
	PIXETTO_COLOR_BLACK: 'Nero',
	PIXETTO_COLOR_WHITE: 'Bianco',

	// Pixetto Shape Options
	PIXETTO_SHAPE_TRIANGLE: 'Triangolo',
	PIXETTO_SHAPE_RECTANGLE: 'Rettangolo',
	PIXETTO_SHAPE_PENTAGON: 'Pentagono',
	PIXETTO_SHAPE_HEXAGON: 'Esagono',
	PIXETTO_SHAPE_CIRCLE: 'Cerchio',

	// Pixetto Position Options
	PIXETTO_POSITION_X: 'Coordinata X',
	PIXETTO_POSITION_Y: 'Coordinata Y',
	PIXETTO_POSITION_WIDTH: 'Larghezza',
	PIXETTO_POSITION_HEIGHT: 'Altezza',

	// Pixetto Road Info Options
	PIXETTO_ROAD_CENTER_X: 'Centro X',
	PIXETTO_ROAD_CENTER_Y: 'Centro Y',
	PIXETTO_ROAD_LEFT_X: 'Confine Sinistro X',
	PIXETTO_ROAD_RIGHT_X: 'Confine Destro X',

	// Pixetto Mode Options
	PIXETTO_MODE_COLOR_DETECTION: 'Rilevamento Colore',
	PIXETTO_MODE_SHAPE_DETECTION: 'Rilevamento Forma',
	PIXETTO_MODE_FACE_DETECTION: 'Rilevamento Volto',
	PIXETTO_MODE_APRILTAG_DETECTION: 'Rilevamento AprilTag',
	PIXETTO_MODE_NEURAL_NETWORK: 'Rete Neurale',
	PIXETTO_MODE_HANDWRITTEN_DIGIT: 'Cifra Scritta a Mano',
	PIXETTO_MODE_ROAD_DETECTION: 'Rilevamento Strada',
	PIXETTO_MODE_BALL_DETECTION: 'Rilevamento Palla',
	PIXETTO_MODE_TEMPLATE_MATCHING: 'Corrispondenza Modello',

	// HUSKYLENS Tooltips
	HUSKYLENS_INIT_I2C_TOOLTIP: 'Inizializza fotocamera intelligente HUSKYLENS usando I2C',
	HUSKYLENS_INIT_UART_TOOLTIP: 'Inizializza fotocamera intelligente HUSKYLENS usando UART, imposta pin RX/TX',
	HUSKYLENS_SET_ALGORITHM_TOOLTIP: 'Imposta algoritmo di riconoscimento usato da HUSKYLENS',
	HUSKYLENS_REQUEST_TOOLTIP: 'Richiedi ultimi risultati di riconoscimento da HUSKYLENS',
	HUSKYLENS_IS_LEARNED_TOOLTIP: 'Controlla se HUSKYLENS ha appreso qualche oggetto',
	HUSKYLENS_COUNT_BLOCKS_TOOLTIP: 'Ottieni il numero di blocchi rilevati da HUSKYLENS',
	HUSKYLENS_COUNT_ARROWS_TOOLTIP: 'Ottieni il numero di frecce rilevate da HUSKYLENS',
	HUSKYLENS_GET_BLOCK_INFO_TOOLTIP: 'Ottieni informazioni del blocco specificato (posizione, dimensione o ID)',
	HUSKYLENS_GET_ARROW_INFO_TOOLTIP: 'Ottieni informazioni della freccia specificata (origine, destinazione o ID)',
	HUSKYLENS_LEARN_TOOLTIP: 'Fai apprendere a HUSKYLENS oggetto con ID specificato (solo per modalità Classificazione Oggetti)',
	HUSKYLENS_FORGET_TOOLTIP: 'Cancella tutti gli oggetti appresi da HUSKYLENS (solo per modalità Classificazione Oggetti)',
	HUSKYLENS_I2C_PIN_HINT: 'Cablaggio: ',
	HUSKYLENS_UART_PIN_HINT: 'Pin consigliati: ',
	HUSKYLENS_UART_ANY_DIGITAL: 'Qualsiasi pin digitale',
	// ESP32 PWM Setup
	ESP32_PWM_SETUP: 'Configurazione PWM ESP32',
	ESP32_PWM_FREQUENCY: 'Frequenza',
	ESP32_PWM_RESOLUTION: 'Risoluzione',
	ESP32_PWM_FREQUENCY_TOOLTIP: 'Imposta frequenza PWM, intervallo 1-80000 Hz. Alta frequenza per chip driver motore (20-75KHz)',
	ESP32_PWM_RESOLUTION_TOOLTIP:
		'Imposta risoluzione PWM, influisce sulla precisione di uscita. Nota: frequenza × 2^risoluzione ≤ 80.000.000',
	ESP32_PWM_RESOLUTION_8BIT: '8 bits (0-255)',
	ESP32_PWM_RESOLUTION_10BIT: '10 bits (0-1023)',
	ESP32_PWM_RESOLUTION_12BIT: '12 bits (0-4095)',
	ESP32_PWM_RESOLUTION_13BIT: '13 bits (0-8191)',
	ESP32_PWM_RESOLUTION_14BIT: '14 bits (0-16383)',
	ESP32_PWM_RESOLUTION_15BIT: '15 bits (0-32767)',
	ESP32_PWM_RESOLUTION_16BIT: '16 bits (0-65535)',
	// Safety Guard (Project Safety Protection)
	SAFETY_WARNING_BODY_NO_TYPE:
		'Questo progetto non ha ancora blocchi Blockly. Se continui, verranno creati cartella e file blockly qui. Vuoi continuare?',
	SAFETY_WARNING_BODY_WITH_TYPE:
		'Rilevato progetto {0}. Questo progetto non ha ancora blocchi Blockly. Se continui, verranno creati cartella e file blockly qui. Vuoi continuare?',
	BUTTON_CONTINUE: 'Continua',
	BUTTON_CANCEL: 'Annulla',
	BUTTON_SUPPRESS: 'Non ricordarmelo più',
	SAFETY_GUARD_CANCELLED: "Apertura dell'editor Blockly annullata",
	SAFETY_GUARD_SUPPRESSED: 'Preferenza salvata, questo avviso non verrà più visualizzato',

	// Communication Category (WiFi/MQTT)
	CATEGORY_COMMUNICATION: 'Comunicazione',
	ESP32_WIFI_LABEL: 'WiFi',
	ESP32_MQTT_LABEL: 'MQTT',
	ESP32_WIFI_CONNECT: 'WiFi Connetti',
	ESP32_WIFI_CONNECT_SSID: 'SSID',
	ESP32_WIFI_CONNECT_PASSWORD: 'Password',
	ESP32_WIFI_CONNECT_TOOLTIP: 'Connetti alla rete WiFi (timeout 10 secondi)',
	ESP32_WIFI_DISCONNECT: 'WiFi Disconnetti',
	ESP32_WIFI_DISCONNECT_TOOLTIP: 'Disconnetti WiFi',
	ESP32_WIFI_STATUS: 'WiFi Connesso?',
	ESP32_WIFI_STATUS_TOOLTIP: 'Restituisce lo stato della connessione WiFi',
	ESP32_WIFI_GET_IP: 'Indirizzo IP WiFi',
	ESP32_WIFI_GET_IP_TOOLTIP: 'Ottieni indirizzo IP attuale',
	ESP32_WIFI_SCAN: 'Scansiona Reti WiFi',
	ESP32_WIFI_SCAN_TOOLTIP: 'Scansiona e restituisce il numero di reti WiFi vicine',
	ESP32_WIFI_GET_SSID: 'Ottieni SSID WiFi',
	ESP32_WIFI_GET_SSID_INDEX: 'indice',
	ESP32_WIFI_GET_SSID_TOOLTIP: "Ottieni nome WiFi all'indice specificato",
	ESP32_WIFI_GET_RSSI: 'Ottieni Forza Segnale WiFi',
	ESP32_WIFI_GET_RSSI_INDEX: 'indice',
	ESP32_WIFI_GET_RSSI_TOOLTIP: "Ottieni forza del segnale all'indice specificato (dBm)",
	ESP32_MQTT_SETUP: 'Configurazione MQTT',
	ESP32_MQTT_SETUP_SERVER: 'Server',
	ESP32_MQTT_SETUP_PORT: 'Porta',
	ESP32_MQTT_SETUP_CLIENT_ID: 'ID Client',
	ESP32_MQTT_SETUP_TOOLTIP: 'Configura parametri di connessione server MQTT',
	ESP32_MQTT_CONNECT: 'MQTT Connetti',
	ESP32_MQTT_CONNECT_USERNAME: 'Nome utente',
	ESP32_MQTT_CONNECT_PASSWORD: 'Password',
	ESP32_MQTT_CONNECT_TOOLTIP: 'Connetti al server MQTT',
	ESP32_MQTT_PUBLISH: 'MQTT Pubblica',
	ESP32_MQTT_PUBLISH_TOPIC: 'Argomento',
	ESP32_MQTT_PUBLISH_MESSAGE: 'Messaggio',
	ESP32_MQTT_PUBLISH_TOOLTIP: "Pubblica messaggio sull'argomento specificato",
	ESP32_MQTT_SUBSCRIBE: 'MQTT Iscriviti',
	ESP32_MQTT_SUBSCRIBE_TOPIC: 'Argomento',
	ESP32_MQTT_SUBSCRIBE_TOOLTIP: "Iscriviti ai messaggi dall'argomento specificato",
	ESP32_MQTT_LOOP: 'MQTT Elabora Messaggi',
	ESP32_MQTT_LOOP_TOOLTIP: 'Mantieni connessione ed elabora messaggi ricevuti (metti nel loop)',
	ESP32_MQTT_GET_TOPIC: 'MQTT Ultimo Argomento',
	ESP32_MQTT_GET_TOPIC_TOOLTIP: 'Ottieni argomento del messaggio più recente',
	ESP32_MQTT_GET_MESSAGE: 'MQTT Ultimo Messaggio',
	ESP32_MQTT_GET_MESSAGE_TOOLTIP: 'Ottieni contenuto del messaggio più recente',
	ESP32_MQTT_STATUS: 'MQTT Connesso',
	ESP32_MQTT_STATUS_TOOLTIP: 'Verifica se connesso al server MQTT',
	TEXT_TO_NUMBER: 'Testo a Numero',
	TEXT_TO_NUMBER_INT: 'Intero',
	TEXT_TO_NUMBER_FLOAT: 'Decimale',
	TEXT_TO_NUMBER_TOOLTIP: 'Converti testo in numero (input non valido restituisce 0)',

	// To String Block
	TO_STRING: 'A Testo',
	TO_STRING_TOOLTIP: 'Converti numero o booleano in testo',

	// ESP32 Only Block Warning
	ESP32_ONLY_BLOCK_WARNING: 'Questo blocco supporta solo schede ESP32',

	// Quick Backup Toast Messages
	BACKUP_QUICK_SAVE_SUCCESS: 'Backup salvato: {0}',
	BACKUP_QUICK_SAVE_EMPTY: 'Lo spazio di lavoro è vuoto, backup non necessario',
	BACKUP_QUICK_SAVE_COOLDOWN: 'Attendere, il backup è appena stato completato',
	MAIN_BLOCK_DUPLICATE_WARNING: 'Sono stati rilevati piu blocchi di programma principale. Elimina i blocchi in eccesso.',

	// Board Switch Warning
	BOARD_SWITCH_WARNING_TITLE: 'Cambia tipo di scheda',
	BOARD_SWITCH_WARNING_MESSAGE:
		'Il passaggio a un tipo di scheda diverso cancellerà lo spazio di lavoro corrente.\nIl tuo lavoro verrà automaticamente salvato prima.\n\nVuoi continuare?',

	// CyberBrick Board
	BOARD_CYBERBRICK: 'CyberBrick',

	// CyberBrick Category
	CATEGORY_CYBERBRICK_CORE: 'CyberBrick',
	CATEGORY_CYBERBRICK_LED: 'LED',
	CATEGORY_CYBERBRICK_GPIO: 'GPIO',
	CATEGORY_CYBERBRICK_TIME: 'Tempo',

	// CyberBrick Main Block
	CYBERBRICK_MAIN: 'Programma principale',
	CYBERBRICK_MAIN_TOOLTIP:
		'Punto di ingresso del programma principale CyberBrick. Tutto il codice dovrebbe essere inserito in questo blocco.',

	// CyberBrick LED Blocks
	CYBERBRICK_LED_SET_COLOR: 'Imposta colore LED',
	CYBERBRICK_LED_SET_COLOR_PREFIX: 'Imposta colore LED integrato',
	CYBERBRICK_LED_RED: 'Rosso',
	CYBERBRICK_LED_GREEN: 'Verde',
	CYBERBRICK_LED_BLUE: 'Blu',
	CYBERBRICK_LED_SET_COLOR_TOOLTIP: 'Imposta il colore del LED integrato (GPIO8) usando valori RGB (0-255)',
	CYBERBRICK_LED_OFF: 'Spegni LED',
	CYBERBRICK_LED_OFF_TOOLTIP: 'Spegni il LED integrato',

	// CyberBrick GPIO Blocks
	CYBERBRICK_GPIO_SET: 'Imposta GPIO',
	CYBERBRICK_GPIO_SET_PREFIX: 'GPIO',
	CYBERBRICK_GPIO_SET_TO: 'a',
	CYBERBRICK_GPIO_PIN: 'Pin',
	CYBERBRICK_GPIO_VALUE: 'Valore',
	CYBERBRICK_GPIO_HIGH: 'ALTO',
	CYBERBRICK_GPIO_LOW: 'BASSO',
	CYBERBRICK_GPIO_SET_TOOLTIP: 'Imposta pin GPIO su ALTO o BASSO',
	CYBERBRICK_GPIO_READ: 'Leggi GPIO',
	CYBERBRICK_GPIO_READ_TOOLTIP: 'Leggi valore digitale dal pin GPIO (restituisce 0 o 1)',

	// CyberBrick Time Blocks
	CYBERBRICK_DELAY_MS: 'Ritardo (ms)',
	CYBERBRICK_DELAY_MS_PREFIX: 'Ritardo',
	CYBERBRICK_DELAY_MS_SUFFIX: 'ms',
	CYBERBRICK_DELAY_MS_TOOLTIP: "Sospende l'esecuzione del programma per i millisecondi specificati",
	CYBERBRICK_DELAY_S: 'Ritardo (s)',
	CYBERBRICK_DELAY_S_PREFIX: 'Ritardo',
	CYBERBRICK_DELAY_S_SUFFIX: 'secondi',
	CYBERBRICK_DELAY_S_TOOLTIP: "Sospende l'esecuzione del programma per i secondi specificati",
	CYBERBRICK_TICKS_MS: 'Ottieni i millisecondi attuali',
	CYBERBRICK_TICKS_MS_TOOLTIP: 'Ottieni il contatore attuale di millisecondi',
	CYBERBRICK_TICKS_DIFF_PREFIX: 'Differenza di tempo',
	CYBERBRICK_TICKS_DIFF_NOW: 'adesso',
	CYBERBRICK_TICKS_DIFF_START: 'inizio',
	CYBERBRICK_TICKS_DIFF_TOOLTIP: 'Calcola i millisecondi tra adesso e l\'inizio',

	// CyberBrick WiFi Blocks
	CATEGORY_CYBERBRICK_WIFI: 'WiFi',
	CYBERBRICK_WIFI_CONNECT: 'Connetti WiFi',
	CYBERBRICK_WIFI_SSID: 'SSID',
	CYBERBRICK_WIFI_PASSWORD: 'Password',
	CYBERBRICK_WIFI_CONNECT_TOOLTIP: 'Connetti alla rete WiFi specificata',
	CYBERBRICK_WIFI_DISCONNECT: 'Disconnetti WiFi',
	CYBERBRICK_WIFI_DISCONNECT_TOOLTIP: 'Disconnetti dalla rete WiFi corrente',
	CYBERBRICK_WIFI_IS_CONNECTED: 'WiFi connesso?',
	CYBERBRICK_WIFI_IS_CONNECTED_TOOLTIP: 'Controlla se WiFi è connesso',
	CYBERBRICK_WIFI_GET_IP: 'Ottieni indirizzo IP',
	CYBERBRICK_WIFI_GET_IP_TOOLTIP: "Ottieni l'indirizzo IP corrente",

	// CyberBrick Upload
	UPLOAD_BUTTON_TITLE: 'Carica su CyberBrick',
	UPLOAD_BUTTON_DISABLED_TITLE: 'Salva prima lo spazio di lavoro per abilitare il caricamento',
	UPLOAD_STARTING: 'Avvio caricamento...',
	UPLOAD_SUCCESS: 'Caricamento riuscito!',
	UPLOAD_FAILED: 'Caricamento fallito: {0}',
	UPLOAD_NO_PORT: 'Nessun dispositivo CyberBrick trovato',
	UPLOAD_IN_PROGRESS: 'Caricamento in corso...',
	UPLOAD_EMPTY_WORKSPACE: 'Lo spazio di lavoro è vuoto, aggiungi prima dei blocchi',
	UPLOAD_NO_CODE: 'Impossibile generare il codice',

	// Upload progress stages
	UPLOAD_STAGE_PREPARING: 'Preparazione',
	UPLOAD_STAGE_CHECKING: 'Controllo strumenti',
	UPLOAD_STAGE_INSTALLING: 'Installazione strumenti',
	UPLOAD_STAGE_CONNECTING: 'Connessione dispositivo',
	UPLOAD_STAGE_RESETTING: 'Reset dispositivo',
	UPLOAD_STAGE_BACKUP: 'Backup',
	UPLOAD_STAGE_UPLOADING: 'Caricamento',
	UPLOAD_STAGE_RESTARTING: 'Riavvio dispositivo',
	UPLOAD_STAGE_COMPLETED: 'Completato',

	// Upload error messages
	ERROR_UPLOAD_BOARD_UNSUPPORTED: 'Supportata solo la scheda CyberBrick',
	ERROR_UPLOAD_CODE_EMPTY: 'Il codice non può essere vuoto',
	ERROR_UPLOAD_NO_PYTHON: 'Ambiente Python PlatformIO non trovato. Installa prima PlatformIO.',
	ERROR_UPLOAD_MPREMOTE_FAILED: 'Installazione mpremote fallita',
	ERROR_UPLOAD_DEVICE_NOT_FOUND: 'Dispositivo CyberBrick non trovato. Assicurati che sia collegato.',
	ERROR_UPLOAD_RESET_FAILED: 'Impossibile resettare il dispositivo',
	ERROR_UPLOAD_UPLOAD_FAILED: 'Impossibile caricare il programma',
	ERROR_UPLOAD_RESTART_FAILED: 'Impossibile riavviare il dispositivo',

	// Arduino Upload Button
	UPLOAD_BUTTON_TITLE_ARDUINO: 'Compila e Carica',
	UPLOAD_SELECT_BOARD: 'Seleziona prima una scheda',

	// Arduino Upload Stages
	ARDUINO_STAGE_SYNCING: 'Sincronizzazione impostazioni',
	ARDUINO_STAGE_SAVING: 'Salvataggio area di lavoro',
	ARDUINO_STAGE_CHECKING: 'Verifica compilatore',
	ARDUINO_STAGE_DETECTING: 'Rilevamento scheda',
	ARDUINO_STAGE_COMPILING: 'Compilazione',
	ARDUINO_STAGE_UPLOADING: 'Caricamento',

	// Arduino Upload Results
	ARDUINO_COMPILE_SUCCESS: 'Compilazione riuscita!',
	ARDUINO_UPLOAD_SUCCESS: 'Caricamento riuscito!',

	// Arduino Upload Errors
	ERROR_ARDUINO_PIO_NOT_FOUND: 'PlatformIO CLI non trovato. Installa prima PlatformIO.',
	ERROR_ARDUINO_COMPILE_FAILED: 'Compilazione fallita',
	ERROR_ARDUINO_UPLOAD_FAILED: 'Caricamento fallito',
	ERROR_ARDUINO_NO_WORKSPACE: 'Apri prima una cartella di progetto',
	ERROR_ARDUINO_TIMEOUT: 'Operazione scaduta',
	ERROR_ARDUINO_DEVICE_DISCONNECT: 'Dispositivo disconnesso',

	// Backup messages
	BACKUP_CONFIRM_DELETE: 'Sei sicuro di voler eliminare il backup "{0}"?',
	BACKUP_CONFIRM_RESTORE: 'Sei sicuro di voler ripristinare il backup "{0}"? Questo sovrascriverà lo spazio di lavoro corrente.',
	BACKUP_ERROR_NOT_FOUND: 'Backup "{0}" non trovato',
	BACKUP_ERROR_CREATE_FAILED: 'Impossibile creare il backup: {0}',
	BACKUP_ERROR_DELETE_FAILED: 'Impossibile eliminare il backup: {0}',
	BACKUP_ERROR_RESTORE_FAILED: 'Impossibile ripristinare il backup: {0}',
	BACKUP_ERROR_PREVIEW_FAILED: "Impossibile visualizzare l'anteprima del backup: {0}",
	BACKUP_ERROR_NAME_NOT_SPECIFIED: 'Nome backup non specificato',
	BACKUP_ERROR_MAIN_NOT_FOUND: 'Impossibile trovare il file main.json',
	BACKUP_ERROR_UPDATE_SETTINGS_FAILED: 'Impossibile aggiornare le impostazioni del backup automatico',

	// Button labels
	BUTTON_DELETE: 'Elimina',
	BUTTON_RESTORE: 'Ripristina',

	// Error messages
	ERROR_PROCESSING_MESSAGE: "Errore durante l'elaborazione del messaggio: {0}",
	ERROR_SETTINGS_UPDATE_FAILED: 'Impossibile aggiornare le impostazioni',
	ERROR_RELOAD_WORKSPACE_FAILED: 'Impossibile ricaricare lo spazio di lavoro: {0}',
	ERROR_OPEN_PROJECT_FOLDER_FIRST: 'Aprire prima una cartella del progetto',

	// Info messages
	INFO_NO_BACKUPS_TO_PREVIEW: 'Nessun file di backup da visualizzare in anteprima',

	// Dialog messages
	DIALOG_SELECT_BACKUP_TITLE: 'Seleziona il file di backup da visualizzare in anteprima',
	DIALOG_BACKUP_FILES_LABEL: 'File di backup',

	// Scheda di estensione X11
	CATEGORY_X11: 'Estensione X11',
	X11_LABEL_SERVOS: 'Servomotori',
	X11_LABEL_MOTORS: 'Motori',
	X11_LABEL_LEDS: 'LED',

	// Blocchi servo 180° X11
	X11_SERVO_180_ANGLE_PREFIX: 'Imposta servo',
	X11_SERVO_180_ANGLE_SUFFIX: 'angolo',
	X11_SERVO_180_ANGLE_TOOLTIP: "Imposta l'angolo del servo 180° (0-180 gradi)",

	// Blocchi servo 360° X11
	X11_SERVO_360_SPEED_PREFIX: 'Imposta servo',
	X11_SERVO_360_SPEED_SUFFIX: 'velocità',
	X11_SERVO_360_SPEED_TOOLTIP: 'Imposta la velocità del servo a rotazione continua 360° (-100 a 100, negativo=inverso)',

	// Blocco arresto servo X11
	X11_SERVO_STOP: 'Ferma servo',
	X11_SERVO_STOP_TOOLTIP: 'Ferma il servo specificato',

	// Blocchi motore X11
	X11_MOTOR_SPEED_PREFIX: 'Imposta motore',
	X11_MOTOR_SPEED_SUFFIX: 'velocità',
	X11_MOTOR_SPEED_TOOLTIP: 'Imposta la velocità del motore CC (-2048 a 2048, negativo=inverso)',
	X11_MOTOR_STOP: 'Ferma motore',
	X11_MOTOR_STOP_TOOLTIP: 'Ferma il motore specificato',

	// Blocchi LED X11
	X11_LED_SET_COLOR_PREFIX: 'Striscia LED',
	X11_LED_SET_COLOR_INDEX: 'indice',
	X11_LED_SET_COLOR_INDEX_SUFFIX: 'imposta colore R',
	X11_LED_SET_COLOR_TOOLTIP: 'Imposta il colore del pixel della striscia LED (indice 0=primo pixel, o tutti)',
	X11_LED_INDEX_ALL: 'Tutti',

	// === Scheda di espansione X12 Trasmettitore ===
	CATEGORY_X12: 'X12 Estensione',
	X12_LABEL_JOYSTICK: 'Joystick',
	X12_LABEL_BUTTON: 'Pulsante',

	// Blocchi Joystick X12
	X12_GET_JOYSTICK_PREFIX: 'Joystick',
	X12_GET_JOYSTICK_SUFFIX: 'valore',
	X12_GET_JOYSTICK_TOOLTIP: 'Leggi valore ADC del joystick (0-4095)',
	X12_GET_JOYSTICK_MAPPED_PREFIX: 'Joystick',
	X12_GET_JOYSTICK_MAPPED_MIN: 'mappa su',
	X12_GET_JOYSTICK_MAPPED_MAX: '~',
	X12_GET_JOYSTICK_MAPPED_TOOLTIP: "Leggi joystick e mappa sull'intervallo specificato",

	// Blocchi Pulsante X12
	X12_IS_BUTTON_PRESSED_PREFIX: 'Pulsante',
	X12_IS_BUTTON_PRESSED_SUFFIX: 'premuto?',
	X12_IS_BUTTON_PRESSED_TOOLTIP: 'Controlla se il pulsante è premuto',

	// === Telecomando RC ===

	// Blocchi Inizializzazione RC

	// Blocchi Joystick RC

	// Blocchi Pulsante RC

	// Blocchi Stato RC

	// === Connessione RC ===
	CATEGORY_RC: 'Connessione RC',
	RC_LABEL_MASTER: '📡 Trasmettitore',
	RC_LABEL_SLAVE: '📻 Ricevitore',
	RC_LABEL_DATA: '📊 Lettura dati',
	RC_LABEL_STATUS: '🔗 Stato connessione',

	// Blocchi Trasmettitore RC
	RC_MASTER_INIT: 'Inizializza trasmettitore RC',
	RC_MASTER_INIT_PAIR_ID: 'ID coppia',
	RC_MASTER_INIT_CHANNEL: 'Canale',
	RC_MASTER_INIT_TOOLTIP: 'Inizializza trasmettitore RC con ID coppia (1-255) e canale (1-11)',
	RC_SEND: 'Invia dati RC',
	RC_SEND_TOOLTIP: 'Leggi dati joystick/pulsanti X12 e invia al ricevitore',

	// Blocchi Ricevitore RC
	RC_SLAVE_INIT: 'Inizializza ricevitore RC',
	RC_SLAVE_INIT_PAIR_ID: 'ID coppia',
	RC_SLAVE_INIT_CHANNEL: 'Canale',
	RC_SLAVE_INIT_TOOLTIP: 'Inizializza ricevitore RC con ID coppia (1-255) e canale (1-11)',
	RC_WAIT_CONNECTION: 'Attendi accoppiamento',
	RC_WAIT_TIMEOUT: 'timeout',
	RC_WAIT_SECONDS: 'secondi',
	RC_WAIT_TOOLTIP: 'Attendi connessione trasmettitore, LED lampeggia blu, continua dopo timeout',
	RC_IS_CONNECTED: 'RC connesso?',
	RC_IS_CONNECTED_TOOLTIP: 'Controlla se dati ricevuti entro 500ms',

	// Blocchi Lettura dati RC
	RC_GET_JOYSTICK_PREFIX: 'RC joystick',
	RC_GET_JOYSTICK_TOOLTIP: 'Leggi valore joystick remoto (0-4095), 2048 è centro',
	RC_GET_JOYSTICK_MAPPED_PREFIX: 'RC joystick',
	RC_GET_JOYSTICK_MAPPED_MIN: 'mappa su',
	RC_GET_JOYSTICK_MAPPED_MAX: '~',
	RC_GET_JOYSTICK_MAPPED_TOOLTIP: 'Leggi joystick remoto e mappa su intervallo specificato',
	RC_IS_BUTTON_PRESSED_PREFIX: 'RC pulsante',
	RC_IS_BUTTON_PRESSED_SUFFIX: 'premuto?',
	RC_IS_BUTTON_PRESSED_TOOLTIP: 'Controlla se pulsante remoto è premuto',
	RC_GET_BUTTON_PREFIX: 'RC pulsante',
	RC_GET_BUTTON_SUFFIX: 'stato',
	RC_GET_BUTTON_TOOLTIP: 'Leggi stato pulsante remoto (0=premuto, 1=rilasciato)',
});

