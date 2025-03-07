/**
 * @license
 * Copyright 2024 Singular Blockly Contributors
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
	BOARD_SELECT_LABEL: 'Seleziona Scheda:',

	// Board Names
	BOARD_NONE: 'Nessuno',
	BOARD_UNO: 'Arduino Uno',
	BOARD_NANO: 'Arduino Nano',
	BOARD_MEGA: 'Arduino Mega',
	BOARD_ESP32: 'ESP32',
	BOARD_SUPERMINI: 'Super Mini',

	// Block Categories
	CATEGORY_LOGIC: 'Logica',
	CATEGORY_LOOPS: 'Cicli',
	CATEGORY_MATH: 'Matematica',
	CATEGORY_TEXT: 'Testo',
	CATEGORY_LISTS: 'Liste',
	CATEGORY_VARIABLES: 'Variabili',
	CATEGORY_FUNCTIONS: 'Funzioni',
	CATEGORY_ARDUINO: 'Arduino',

	// Arduino Block Labels
	ARDUINO_SETUP: 'Setup',
	ARDUINO_LOOP: 'Loop',
	ARDUINO_DIGITAL_WRITE: 'Scrivi Digitale',
	ARDUINO_DIGITAL_READ: 'Leggi Digitale',
	ARDUINO_ANALOG_WRITE: 'Scrivi Analogico',
	ARDUINO_ANALOG_READ: 'Leggi Analogico',
	ARDUINO_PIN: 'Pin',
	ARDUINO_VALUE: 'Valore',
	ARDUINO_DELAY: 'Ritardo',
	ARDUINO_DELAY_MS: 'millisecondi',
	ARDUINO_PULLUP: 'Attiva Pullup Interno',
	ARDUINO_MODE: 'Modalità',
	ARDUINO_MODE_INPUT: 'INPUT',
	ARDUINO_MODE_OUTPUT: 'OUTPUT',

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

	// Error Messages
	ERROR_BOARD_NOT_SELECTED: 'Seleziona prima una scheda',
	ERROR_INVALID_PIN: 'Numero pin non valido',
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
});
