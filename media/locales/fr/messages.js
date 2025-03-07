/**
 * @license
 * Copyright 2024 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file contains translations derived from Blockly project
 * Copyright 2012 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

// Define translations for French
window.languageManager.loadMessages('fr', {
	// UI Elements
	BLOCKS_TAB: 'Blocs',
	CODE_TAB: 'Code',
	BOARD_SELECT_LABEL: 'Sélectionner la carte :',

	// Board Names
	BOARD_NONE: 'Aucune',
	BOARD_UNO: 'Arduino Uno',
	BOARD_NANO: 'Arduino Nano',
	BOARD_MEGA: 'Arduino Mega',
	BOARD_ESP32: 'ESP32',
	BOARD_SUPERMINI: 'Super Mini',

	// Block Categories
	CATEGORY_LOGIC: 'Logique',
	CATEGORY_LOOPS: 'Boucles',
	CATEGORY_MATH: 'Math',
	CATEGORY_TEXT: 'Texte',
	CATEGORY_LISTS: 'Listes',
	CATEGORY_VARIABLES: 'Variables',
	CATEGORY_FUNCTIONS: 'Fonctions',
	CATEGORY_ARDUINO: 'Arduino',

	// Arduino Block Labels
	ARDUINO_SETUP: 'Configuration',
	ARDUINO_LOOP: 'Boucle',
	ARDUINO_DIGITAL_WRITE: 'Écriture numérique',
	ARDUINO_DIGITAL_READ: 'Lecture numérique',
	ARDUINO_ANALOG_WRITE: 'Écriture analogique',
	ARDUINO_ANALOG_READ: 'Lecture analogique',
	ARDUINO_PIN: 'Broche',
	ARDUINO_VALUE: 'Valeur',
	ARDUINO_DELAY: 'Délai',
	ARDUINO_DELAY_MS: 'millisecondes',
	ARDUINO_PULLUP: 'Activer résistance de rappel interne',
	ARDUINO_MODE: 'Mode',
	ARDUINO_MODE_INPUT: 'ENTRÉE',
	ARDUINO_MODE_OUTPUT: 'SORTIE',

	// Threshold Function Block Labels
	THRESHOLD_PIN: 'à',
	THRESHOLD_VALUE: 'si >',
	THRESHOLD_HIGH_VALUE: '=',
	THRESHOLD_LOW_VALUE: 'sinon',
	THRESHOLD_TOOLTIP_SETUP:
		"Configure une fonction de seuil. Lorsque l'entrée analogique dépasse le seuil, renvoie la première sortie, sinon renvoie la seconde sortie.",
	THRESHOLD_TOOLTIP_READ: 'Obtenir la valeur de la fonction de seuil',

	// Duration block
	DURATION_REPEAT: 'Répéter pendant',
	DURATION_TIME: 'temps',
	DURATION_MS: 'millisecondes',
	DURATION_DO: 'faire',

	// Print block
	TEXT_PRINT_SHOW: 'afficher',
	TEXT_PRINT_NEWLINE: 'nouvelle ligne',

	// Pin Mode block
	PIN_MODE_SET: 'définir',

	// Function Block Labels
	FUNCTION_CREATE: 'Créer une fonction',
	FUNCTION_NAME: 'Nom',
	FUNCTION_PARAMS: 'Paramètres',
	FUNCTION_RETURN: 'Retour',
	FUNCTION_CALL: 'Appel',

	// Logic Block Labels
	LOGIC_IF: 'si',
	LOGIC_ELSE: 'sinon',
	LOGIC_THEN: 'alors',
	LOGIC_AND: 'et',
	LOGIC_OR: 'ou',
	LOGIC_NOT: 'non',
	LOGIC_TRUE: 'vrai',
	LOGIC_FALSE: 'faux',

	// Loop Block Labels
	LOOP_REPEAT: 'répéter',
	LOOP_WHILE: 'tant que',
	LOOP_UNTIL: "jusqu'à",
	LOOP_FOR: 'pour',
	LOOP_FOREACH: 'pour chaque',
	LOOP_BREAK: 'sortir',
	LOOP_CONTINUE: 'continuer',

	// Math Block Labels
	MATH_NUMBER: 'nombre',
	MATH_ARITHMETIC: 'arithmétique',
	MATH_OPERATIONS: 'opérations',
	MATH_ADD: 'ajouter',
	MATH_SUBTRACT: 'soustraire',
	MATH_MULTIPLY: 'multiplier',
	MATH_DIVIDE: 'diviser',
	MATH_POWER: 'puissance',

	// Math Map Block
	MATH_MAP_VALUE: 'mapper',
	MATH_MAP_TOOLTIP:
		"Fait correspondre un nombre d'une plage à une autre. Par exemple, map(valeur, 0, 1023, 0, 255) mettra à l'échelle une entrée analogique vers une sortie PWM 8 bits.",

	// Error Messages
	ERROR_BOARD_NOT_SELECTED: "Veuillez d'abord sélectionner une carte",
	ERROR_INVALID_PIN: 'Numéro de broche invalide',
	ERROR_INVALID_VALUE: 'Valeur invalide',
	ERROR_MISSING_TRANSLATION: 'Traduction manquante',

	// Blockly core messages
	ADD: 'ajouter',
	REMOVE: 'supprimer',
	RENAME: 'renommer',
	NEW: 'nouveau',
	ADD_COMMENT: 'Ajouter un commentaire',
	REMOVE_COMMENT: 'Supprimer le commentaire',
	DUPLICATE_BLOCK: 'Dupliquer',
	HELP: 'Aide',
	UNDO: 'Annuler',
	REDO: 'Rétablir',
	COLLAPSE_BLOCK: 'Réduire le bloc',
	EXPAND_BLOCK: 'Développer le bloc',
	DELETE_BLOCK: 'Supprimer le bloc',
	DELETE_X_BLOCKS: 'Supprimer %1 blocs',
	DELETE_ALL_BLOCKS: 'Supprimer tous les %1 blocs ?',
	CLEAN_UP: 'Ranger les blocs',
	COLLAPSE_ALL: 'Réduire les blocs',
	EXPAND_ALL: 'Développer les blocs',
	DISABLE_BLOCK: 'Désactiver le bloc',
	ENABLE_BLOCK: 'Activer le bloc',
	INLINE_INPUTS: 'Entrées en ligne',
	EXTERNAL_INPUTS: 'Entrées externes',

	// Variable & Function messages
	RENAME_VARIABLE: 'Renommer la variable...',
	NEW_VARIABLE: 'Créer une variable...',
	DELETE_VARIABLE: 'Supprimer la variable %1',
	PROCEDURE_ALREADY_EXISTS: 'Une procédure nommée "%1" existe déjà.',

	// Logic block messages
	CONTROLS_IF_MSG_IF: 'si',
	CONTROLS_IF_MSG_THEN: 'alors',
	CONTROLS_IF_MSG_ELSE: 'sinon',
	CONTROLS_IF_MSG_ELSEIF: 'sinon si',
	CONTROLS_IF_IF_TITLE_IF: 'si',
	CONTROLS_IF_ELSEIF_TITLE_ELSEIF: 'sinon si',
	CONTROLS_IF_ELSE_TITLE_ELSE: 'sinon',
	LOGIC_COMPARE_TOOLTIP_EQ: 'Renvoie vrai si les deux entrées sont égales.',
	LOGIC_COMPARE_TOOLTIP_NEQ: 'Renvoie vrai si les deux entrées sont différentes.',
	LOGIC_COMPARE_TOOLTIP_LT: 'Renvoie vrai si la première entrée est plus petite que la seconde.',
	LOGIC_COMPARE_TOOLTIP_LTE: 'Renvoie vrai si la première entrée est plus petite ou égale à la seconde.',
	LOGIC_COMPARE_TOOLTIP_GT: 'Renvoie vrai si la première entrée est plus grande que la seconde.',
	LOGIC_COMPARE_TOOLTIP_GTE: 'Renvoie vrai si la première entrée est plus grande ou égale à la seconde.',
	LOGIC_OPERATION_AND: 'et',
	LOGIC_OPERATION_OR: 'ou',
	LOGIC_NEGATE_TITLE: 'non %1',
	LOGIC_BOOLEAN_TRUE: 'vrai',
	LOGIC_BOOLEAN_FALSE: 'faux',
	LOGIC_NULL: 'nul',

	// Additional Logic Block Messages
	LOGIC_COMPARE_HELPURL: 'https://fr.wikipedia.org/wiki/Inégalité_(mathématiques)',
	LOGIC_NEGATE_HELPURL: 'https://github.com/google/blockly/wiki/Logic#not',
	LOGIC_NEGATE_TOOLTIP: "Renvoie vrai si l'entrée est fausse. Renvoie faux si l'entrée est vraie.",
	LOGIC_OPERATION_TOOLTIP_AND: 'Renvoie vrai si les deux entrées sont vraies.',
	LOGIC_OPERATION_TOOLTIP_OR: "Renvoie vrai si au moins l'une des entrées est vraie.",
	LOGIC_BOOLEAN_TOOLTIP: 'Renvoie soit vrai soit faux.',

	// Loop block messages
	CONTROLS_REPEAT_TITLE: 'répéter %1 fois',
	CONTROLS_WHILEUNTIL_OPERATOR_WHILE: 'répéter tant que',
	CONTROLS_WHILEUNTIL_OPERATOR_UNTIL: "répéter jusqu'à",
	CONTROLS_FOR_TITLE: 'compter avec %1 de %2 à %3 par %4',
	CONTROLS_FLOW_STATEMENTS_OPERATOR_BREAK: 'sortir de la boucle',
	CONTROLS_FLOW_STATEMENTS_OPERATOR_CONTINUE: 'continuer avec la prochaine itération',
	CONTROLS_REPEAT_TOOLTIP: 'Exécute plusieurs fois des instructions.',
	CONTROLS_WHILEUNTIL_TOOLTIP_WHILE: "Tant qu'une valeur est vraie, exécute des instructions.",
	CONTROLS_WHILEUNTIL_TOOLTIP_UNTIL: "Tant qu'une valeur est fausse, exécute des instructions.",
	CONTROLS_FOR_TOOLTIP: "Compte du nombre de départ au nombre final à l'intervalle spécifié.",
	CONTROLS_FLOW_STATEMENTS_WARNING: 'Ce bloc ne peut être utilisé que dans une boucle.',

	// Math block messages
	MATH_NUMBER_HELPURL: 'https://fr.wikipedia.org/wiki/Nombre',
	MATH_NUMBER_TOOLTIP: 'Un nombre.',
	MATH_ARITHMETIC_OPERATOR_ADD: '+',
	MATH_ARITHMETIC_OPERATOR_MINUS: '-',
	MATH_ARITHMETIC_OPERATOR_MULTIPLY: '×',
	MATH_ARITHMETIC_OPERATOR_DIVIDE: '÷',
	MATH_ARITHMETIC_OPERATOR_POWER: '^',
	MATH_SINGLE_OPERATOR_ROOT: 'racine carrée',
	MATH_SINGLE_OPERATOR_ABSOLUTE: 'valeur absolue',
	MATH_IS_EVEN: 'est pair',
	MATH_IS_ODD: 'est impair',
	MATH_IS_PRIME: 'est premier',
	MATH_IS_WHOLE: 'est entier',
	MATH_IS_POSITIVE: 'est positif',
	MATH_IS_NEGATIVE: 'est négatif',
	MATH_ARITHMETIC_HELPURL: 'https://fr.wikipedia.org/wiki/Arithmétique',
	MATH_ARITHMETIC_TOOLTIP_ADD: 'Renvoie la somme des deux nombres.',
	MATH_ARITHMETIC_TOOLTIP_MINUS: 'Renvoie la différence des deux nombres.',
	MATH_ARITHMETIC_TOOLTIP_MULTIPLY: 'Renvoie le produit des deux nombres.',
	MATH_ARITHMETIC_TOOLTIP_DIVIDE: 'Renvoie le quotient des deux nombres.',
	MATH_ARITHMETIC_TOOLTIP_POWER: 'Renvoie le premier nombre élevé à la puissance du second nombre.',

	// Text block messages
	TEXT_JOIN_TITLE_CREATEWITH: 'créer un texte avec',
	TEXT_CREATE_JOIN_TITLE_JOIN: 'joindre',
	TEXT_LENGTH_TITLE: 'longueur de %1',
	TEXT_ISEMPTY_TITLE: '%1 est vide',
	TEXT_INDEXOF_OPERATOR_FIRST: 'trouver la première occurrence du texte',
	TEXT_INDEXOF_OPERATOR_LAST: 'trouver la dernière occurrence du texte',
	TEXT_CHARAT_FROM_START: 'obtenir la lettre n°',
	TEXT_CHARAT_FROM_END: 'obtenir la lettre n° depuis la fin',
	TEXT_CHARAT_FIRST: 'obtenir la première lettre',
	TEXT_CHARAT_LAST: 'obtenir la dernière lettre',
	TEXT_CHARAT_RANDOM: 'obtenir une lettre au hasard',
	TEXT_JOIN_TOOLTIP: "Crée un texte en assemblant n'importe quel nombre d'éléments.",
	TEXT_APPEND_VARIABLE: 'élément',
	TEXT_APPEND_TOOLTIP: 'Ajouter du texte à la variable "%1".',
	TEXT_LENGTH_TOOLTIP: 'Renvoie le nombre de lettres (espaces compris) dans le texte fourni.',
	TEXT_ISEMPTY_TOOLTIP: 'Renvoie vrai si le texte fourni est vide.',

	// List block messages
	LISTS_CREATE_EMPTY_TITLE: 'créer une liste vide',
	LISTS_CREATE_WITH_INPUT_WITH: 'créer une liste avec',
	LISTS_LENGTH_TITLE: 'longueur de %1',
	LISTS_ISEMPTY_TITLE: '%1 est vide',
	LISTS_INDEXOF_FIRST: 'trouver la première occurrence de',
	LISTS_INDEXOF_LAST: 'trouver la dernière occurrence de',
	LISTS_GET_INDEX_GET: 'obtenir',
	LISTS_GET_INDEX_REMOVE: 'supprimer',
	LISTS_GET_INDEX_FROM_START: '#',
	LISTS_GET_INDEX_FROM_END: '# depuis la fin',
	LISTS_GET_INDEX_FIRST: 'premier',
	LISTS_GET_INDEX_LAST: 'dernier',
	LISTS_GET_INDEX_RANDOM: 'aléatoire',
	LISTS_CREATE_WITH_TOOLTIP: "Crée une liste avec n'importe quel nombre d'éléments.",
	LISTS_CREATE_EMPTY_TOOLTIP: 'Renvoie une liste vide, de longueur 0',
	LISTS_LENGTH_TOOLTIP: "Renvoie la longueur d'une liste.",
	LISTS_ISEMPTY_TOOLTIP: 'Renvoie vrai si la liste est vide.',

	// Variables
	VARIABLES_SET: 'définir %1 à %2',
	VARIABLES_GET: '%1',
	VARIABLES_DEFAULT_NAME: 'élément',

	// If conditions
	CONTROLS_IF_TOOLTIP_1: 'Si une valeur est vraie, alors exécute certaines instructions.',
	CONTROLS_IF_TOOLTIP_2:
		"Si une valeur est vraie, alors exécute le premier bloc d'instructions. Sinon, exécute le second bloc d'instructions.",
	CONTROLS_IF_TOOLTIP_3:
		"Si la première valeur est vraie, alors exécute le premier bloc d'instructions. Sinon, si la seconde valeur est vraie, exécute le second bloc d'instructions.",
	CONTROLS_IF_TOOLTIP_4:
		"Si la première valeur est vraie, alors exécute le premier bloc d'instructions. Sinon, si la seconde valeur est vraie, exécute le second bloc d'instructions. Si aucune des valeurs n'est vraie, exécute le dernier bloc d'instructions.",

	// Procedures
	PROCEDURES_DEFNORETURN_TITLE: '',
	PROCEDURES_DEFNORETURN_PROCEDURE: 'faire quelque chose',
	PROCEDURES_BEFORE_PARAMS: 'avec :',
	PROCEDURES_CALL_BEFORE_PARAMS: 'avec :',
	PROCEDURES_DEFNORETURN_DO: '',
	PROCEDURES_DEFNORETURN_TOOLTIP: 'Crée une fonction sans retour.',
	PROCEDURES_DEFRETURN_RETURN: 'retourner',
	PROCEDURES_DEFRETURN_TOOLTIP: 'Crée une fonction avec un retour.',
	PROCEDURES_DEFRETURN_COMMENT: 'Décrivez cette fonction...',
	PROCEDURES_DEFRETURN_PROCEDURE: 'faire quelque chose avec retour',
	PROCEDURES_DEFRETURN_DO: '',
	PROCEDURES_CALLNORETURN_HELPURL: 'https://fr.wikipedia.org/wiki/Sous-programme',
	PROCEDURES_CALLNORETURN_TOOLTIP: "Exécute la fonction définie par l'utilisateur.",
	PROCEDURES_CALLRETURN_HELPURL: 'https://fr.wikipedia.org/wiki/Sous-programme',
	PROCEDURES_CALLRETURN_TOOLTIP: "Exécute la fonction définie par l'utilisateur et utilise son résultat.",

	// Seven Segment Display
	SEVEN_SEGMENT_DISPLAY: 'Afficheur sept segments',
	SEVEN_SEGMENT_COMMON_CATHODE: 'Cathode commune',
	SEVEN_SEGMENT_COMMON_ANODE: 'Anode commune',
	SEVEN_SEGMENT_NUMBER: 'Nombre (0-9) :',
	SEVEN_SEGMENT_DECIMAL_POINT: 'Point décimal',
	SEVEN_SEGMENT_TOOLTIP: 'Affiche un nombre (0-9) sur un afficheur sept segments avec point décimal optionnel.',
	// Seven Segment Display Pins
	SEVEN_SEGMENT_PINS_SET: "Configurer les broches de l'afficheur sept segments",
	SEVEN_SEGMENT_PINS_TOOLTIP: "Configure les broches pour chaque segment (A-G) et le point décimal (DP) de l'afficheur sept segments.",
});
