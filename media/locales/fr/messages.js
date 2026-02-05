/**
 * @license
 * Copyright 2025 Singular Blockly Contributors
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
	BOARD_SELECT_LABEL: 'Sélectionner une carte:',
	LANGUAGE_SELECT_TOOLTIP: 'Sélectionner la langue',
	LANGUAGE_AUTO: 'Auto (suivre VS Code)',

	// Experimental Blocks Notice
	EXPERIMENTAL_BLOCKS_TITLE: 'Blocs expérimentaux détectés',
	EXPERIMENTAL_BLOCKS_DESC:
		'Votre espace de travail contient des blocs expérimentaux (surlignés avec des bordures jaunes en pointillés). Ces fonctionnalités peuvent changer ou être supprimées dans les futures mises à jour, utilisez-les avec prudence.',

	// Preview Mode UI
	PREVIEW_BADGE: 'Aperçu',
	THEME_TOGGLE: 'Changer de thème',
	PREVIEW_WINDOW_TITLE: 'Aperçu Blockly - {0}',
	PREVIEW_WINDOW_TITLE_WITH_NAME: 'Aperçu - {0}',

	// Backup Modal UI
	BACKUP_MANAGER_TITLE: 'Gestionnaire de sauvegardes',
	BACKUP_CREATE_NEW: 'Créer une nouvelle sauvegarde',
	BACKUP_NAME_LABEL: 'Nom de la sauvegarde:',
	BACKUP_NAME_PLACEHOLDER: 'Entrez un nom de sauvegarde',
	BACKUP_CONFIRM: 'Confirmer',
	BACKUP_CANCEL: 'Annuler',
	BACKUP_LIST_TITLE: 'Liste des sauvegardes',
	BACKUP_LIST_EMPTY: 'Aucune sauvegarde disponible',
	BACKUP_BUTTON_TITLE: 'Gestionnaire de sauvegardes',
	REFRESH_BUTTON_TITLE: 'Actualiser le code',
	BACKUP_PREVIEW_BTN: 'Aperçu',
	BACKUP_RESTORE_BTN: 'Restaurer',
	BACKUP_DELETE_BTN: 'Supprimer',
	AUTO_BACKUP_TITLE: 'Paramètres de sauvegarde automatique',
	AUTO_BACKUP_INTERVAL_LABEL: 'Intervalle de sauvegarde:',
	AUTO_BACKUP_MINUTES: 'minutes',
	AUTO_BACKUP_SAVE: 'Enregistrer les paramètres',
	AUTO_BACKUP_SAVED: 'Paramètres de sauvegarde automatique enregistrés',
	AUTO_BACKUP_PREFIX: 'auto_',
	MANUAL_BACKUP_TITLE: 'Sauvegarde manuelle',

	// Board Names
	BOARD_NONE: 'Aucune',
	BOARD_UNO: 'Arduino Uno',
	BOARD_NANO: 'Arduino Nano',
	BOARD_MEGA: 'Arduino Mega',
	BOARD_ESP32: 'ESP32',
	BOARD_SUPERMINI: 'Super Mini',
	// Block Search UI
	FUNCTION_SEARCH_TITLE: 'Rechercher des blocs',
	FUNCTION_SEARCH_BUTTON_TITLE: 'Rechercher des blocs',
	FUNCTION_SEARCH_PLACEHOLDER: 'Entrez le nom ou les paramètres du bloc...',
	FUNCTION_SEARCH_BTN: 'Rechercher',
	FUNCTION_SEARCH_PREV: 'Précédent',
	FUNCTION_SEARCH_NEXT: 'Suivant',
	FUNCTION_SEARCH_EMPTY: 'Pas encore recherché',
	FUNCTION_SEARCH_NO_RESULTS: 'Aucun bloc correspondant trouvé',
	FUNCTION_RESULT_PREFIX: 'Bloc: ',
	FUNCTION_KEYBOARD_SHORTCUT_TIP: '(Raccourci: Ctrl+F)',
	FUNCTION_SEARCH_HISTORY_TITLE: 'Historique de recherche',

	// Block Categories
	CATEGORY_LOGIC: 'Logique',
	CATEGORY_LOOPS: 'Boucles',
	CATEGORY_MATH: 'Math',
	CATEGORY_TEXT: 'Texte',
	CATEGORY_LISTS: 'Listes',
	CATEGORY_VARIABLES: 'Variables',
	CATEGORY_FUNCTIONS: 'Fonctions',
	CATEGORY_ARDUINO: 'Arduino',
	CATEGORY_SENSORS: 'Capteurs',
	CATEGORY_MOTORS: 'Moteurs',
	VISION_SENSORS_CATEGORY: 'Capteurs de Vision',
	// Servo Block Labels
	SERVO_SETUP: 'Configurer Servo-moteur',
	SERVO_PIN: 'Broche',
	SERVO_SETUP_TOOLTIP: 'Déclarer une variable de servo-moteur et définir la broche',
	SERVO_MOVE: 'Tourner Servo-moteur',
	SERVO_ANGLE: 'Angle',
	SERVO_MOVE_TOOLTIP: 'Tourner le servo-moteur à un angle spécifique',
	SERVO_STOP: 'Arrêter Servo-moteur',
	SERVO_STOP_TOOLTIP: 'Arrêter le signal de sortie du servo-moteur',

	// Encoder Motor Control
	ENCODER_SETUP: 'Configurer Moteur Encodeur',
	ENCODER_NAME: 'Nom',
	ENCODER_PIN_A: 'Broche A',
	ENCODER_PIN_B: 'Broche B',
	ENCODER_USE_INTERRUPT: 'Utiliser Interruption',
	ENCODER_SETUP_TOOLTIP: 'Configurer le moteur encodeur avec les configurations de nom et de broches',
	ENCODER_READ: 'Lire Encodeur',
	ENCODER_READ_TOOLTIP: "Obtenir la position actuelle de l'encodeur",
	ENCODER_RESET: 'Réinitialiser Encodeur',
	ENCODER_RESET_TOOLTIP: "Réinitialiser la position de l'encodeur à zéro",
	ENCODER_PID_SETUP: 'Configurer Contrôle PID',
	ENCODER_PID_MOTOR: 'Moteur',
	ENCODER_PID_KP: 'Kp',
	ENCODER_PID_KI: 'Ki',
	ENCODER_PID_KD: 'Kd',
	ENCODER_PID_MODE: 'Mode',
	ENCODER_PID_MODE_POSITION: 'Position',
	ENCODER_PID_MODE_SPEED: 'Vitesse',
	ENCODER_PID_SETUP_TOOLTIP: 'Configurer le contrôle PID pour un contrôle moteur précis. Sélectionnez le mode position ou vitesse.',
	ENCODER_PID_COMPUTE: 'Calculer PID',
	ENCODER_PID_TARGET: 'Cible',
	ENCODER_PID_COMPUTE_TOOLTIP: 'Calculer la sortie du contrôle PID basée sur la position cible',
	ENCODER_PID_RESET: 'Réinitialiser PID',
	ENCODER_PID_RESET_TOOLTIP: "Réinitialiser l'état du contrôleur PID (effacer l'accumulation intégrale, réinitialiser le compteur)",

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

	// Sensor Block Labels
	ULTRASONIC_SENSOR: 'Capteur ultrason',
	ULTRASONIC_TRIG_PIN: 'Broche Trig',
	ULTRASONIC_ECHO_PIN: 'Broche Echo',
	ULTRASONIC_USE_INTERRUPT: 'Utiliser interruption matérielle',
	ULTRASONIC_READ: 'Lire distance ultrason (cm)',
	ULTRASONIC_TOOLTIP_SETUP:
		'Configure le capteur ultrason avec les broches Trig et Echo. Interruption matérielle optionnelle pour une meilleure précision.',
	ULTRASONIC_TOOLTIP_READ: 'Lire la distance mesurée par le capteur ultrason en centimètres.',
	ULTRASONIC_WARNING:
		"La broche Echo {0} sélectionnée ne prend pas en charge les interruptions matérielles. Veuillez choisir l'une de ces broches: {1}",

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

	// VS Code UI Messages
	VSCODE_OPEN_FOLDER: 'Ouvrir un Dossier',
	VSCODE_PLEASE_OPEN_PROJECT: "Veuillez d'abord ouvrir un dossier de projet !",
	VSCODE_FAILED_SAVE_FILE: "Échec de l'enregistrement du fichier : {0}",
	VSCODE_FAILED_UPDATE_INI: 'Échec de la mise à jour de platformio.ini : {0}',
	VSCODE_UNABLE_SAVE_WORKSPACE: "Impossible d'enregistrer l'état de l'espace de travail : {0}",
	VSCODE_FAILED_START: 'Échec du démarrage de Singular Blockly : {0}',
	VSCODE_CONFIRM_DELETE_VARIABLE: 'Êtes-vous sûr de vouloir supprimer la variable "{0}" ?',
	VSCODE_BOARD_UPDATED: 'Configuration de la carte mise à jour vers : {0}',
	VSCODE_RELOAD_REQUIRED: '，Veuillez recharger la fenêtre pour terminer la configuration',
	VSCODE_ENTER_VARIABLE_NAME: 'Entrez un nouveau nom de variable',
	VSCODE_ENTER_NEW_VARIABLE_NAME: 'Entrez un nouveau nom de variable (actuel : {0})',
	VSCODE_VARIABLE_NAME_EMPTY: 'Le nom de la variable ne peut pas être vide',
	VSCODE_VARIABLE_NAME_INVALID:
		'Le nom de la variable ne peut contenir que des lettres, des chiffres et des tirets bas, et ne peut pas commencer par un chiffre',
	VSCODE_RELOAD: 'Recharger',
	VSCODE_OK: 'OK',
	VSCODE_CANCEL: 'Annuler',
	VSCODE_OPEN_BLOCKLY_EDITOR: "Ouvrir l'éditeur Blockly",
	// MCP Graceful Degradation Messages
	WARNING_NODE_NOT_AVAILABLE: 'Node.js 22.16.0 ou supérieur non détecté. Les fonctionnalités MCP ne seront pas disponibles, mais les fonctionnalités d\'édition Blockly fonctionneront normalement.\n\nErreur : {0}',
	BUTTON_INSTALL_GUIDE: 'Guide d\'installation',
	BUTTON_REMIND_LATER: 'Rappeler plus tard',
	WARNING_INVALID_NODE_PATH: 'Le chemin Node.js spécifié n\'est pas valide : {0}. Erreur : {1}. Veuillez corriger le chemin ou effacer le paramètre pour utiliser la commande "node" par défaut.',
	INFO_NODE_PATH_VALID: 'Chemin Node.js valide : {0}',
	PROGRESS_VALIDATING_NODE_PATH: 'Validation du chemin Node.js...',
	PROGRESS_CHECKING_MCP: 'Vérification de l\'état du serveur MCP...',
	BUTTON_COPY_DIAGNOSTICS: 'Copier le diagnostic',
	INFO_COPIED_TO_CLIPBOARD: 'Copié dans le presse-papiers',
	ERROR_DIAGNOSTIC_COMMAND_FAILED: 'La commande de diagnostic MCP a échoué : {0}',

	// MCP Diagnostic Report Labels
	DIAG_REPORT_TITLE: 'Rapport de Diagnostic du MCP Server',
	DIAG_NODEJS_VERSION: 'Version de Node.js',
	DIAG_VERSION_TOO_LOW: 'Version trop basse ({0}, requiert >= 22.16.0)',
	DIAG_MCP_BUNDLE: 'MCP Server Bundle',
	DIAG_EXISTS: 'Existe',
	DIAG_FILE_NOT_FOUND: 'Fichier non trouvé',
	DIAG_VSCODE_API_VERSION: 'Version de l\'API VSCode',
	DIAG_REQUIRES_VERSION: 'requiert >= {0}',
	DIAG_WORKSPACE_PATH: 'Chemin de l\'espace de travail',
	DIAG_NONE: 'Aucun',
	DIAG_NODEJS_PATH: 'Chemin de Node.js',
	DIAG_SYSTEM_PATH: 'PATH système',
	DIAG_STATUS: 'Statut',
	DIAG_STATUS_OPERATIONAL: 'MCP Server est opérationnel',
	DIAG_STATUS_PARTIAL: 'MCP Server est partiellement disponible',
	DIAG_STATUS_UNAVAILABLE: 'MCP Server n\'est pas disponible',
	DIAG_RECOMMENDATIONS: 'Recommandations',
	DIAG_GENERATED_AT: 'Généré le',
	DIAG_NODEJS_STATUS: 'Statut de Node.js',
	DIAG_AVAILABLE: 'Disponible',
	DIAG_YES: 'Oui',
	DIAG_NO: 'Non',
	DIAG_COMPATIBLE: 'Compatible',
	DIAG_ERROR: 'Erreur',
	DIAG_PATH: 'Chemin',
	DIAG_SUPPORTED: 'Pris en charge',
	DIAG_VERSION: 'Version',
	DIAG_OVERALL_STATUS: 'Statut général',
	DIAG_OPERATIONAL_SHORT: 'Opérationnel',
	DIAG_PARTIAL_SHORT: 'Partiellement disponible',
	DIAG_UNAVAILABLE_SHORT: 'Non disponible',
	REC_INSTALL_NODEJS: 'Installez Node.js 22.16.0 ou ultérieur',
	REC_SET_NODEJS_PATH: 'Si déjà installé, spécifiez le chemin de Node.js dans les paramètres (singularBlockly.mcp.nodePath)',
	REC_UPGRADE_NODEJS: 'Mettez à niveau Node.js vers 22.16.0 ou ultérieur (actuel : {0})',
	REC_RUN_COMPILE: 'Exécutez `npm run compile` ou réinstallez l\'extension',
	REC_UPGRADE_VSCODE: 'Mettez à niveau VSCode vers 1.105.0 ou ultérieur',
	REC_OPEN_PROJECT: 'Ouvrez un dossier de projet pour utiliser toutes les fonctionnalités',

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
	CONTROLS_REPEAT_INPUT_DO: 'faire',
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
	// Pixetto Smart Camera
	PIXETTO_INIT: 'Initialiser la caméra intelligente Pixetto',
	PIXETTO_RX_PIN: 'Broche RX',
	PIXETTO_TX_PIN: 'Broche TX',
	PIXETTO_IS_DETECTED: 'Pixetto Objet Détecté',
	PIXETTO_GET_TYPE_ID: 'Pixetto Obtenir ID de Type',
	PIXETTO_GET_FUNC_ID: 'Pixetto Obtenir ID de Fonction',
	PIXETTO_COLOR_DETECT: 'Pixetto Détection de couleur',
	PIXETTO_SHAPE_DETECT: 'Pixetto Détection de forme',
	PIXETTO_FACE_DETECT: 'Pixetto Détection de visage',
	PIXETTO_APRILTAG_DETECT: "Pixetto Détection d'AprilTag",
	PIXETTO_NEURAL_NETWORK: 'Pixetto Reconnaissance de réseau neuronal',
	PIXETTO_HANDWRITTEN_DIGIT: 'Pixetto Reconnaissance de chiffre manuscrit',
	PIXETTO_GET_POSITION: 'Pixetto Obtenir objet détecté',
	PIXETTO_ROAD_DETECT: 'Pixetto Détection de route',
	PIXETTO_SET_MODE: 'Définir le mode de fonction Pixetto',
	PIXETTO_COLOR: 'Couleur',
	PIXETTO_SHAPE: 'Forme',
	PIXETTO_MODE: 'Mode',
	PIXETTO_TAG_ID: 'ID de tag',
	PIXETTO_CLASS_ID: 'ID de classe',
	PIXETTO_DIGIT: 'Chiffre',
	PIXETTO_COORDINATE: 'Coordonnée',
	PIXETTO_ROAD_INFO: 'Information',
	// Vision Sensors Category Labels
	PIXETTO_LABEL: 'Pixetto',
	HUSKYLENS_LABEL: 'HUSKYLENS',

	// Pixetto Tooltips
	PIXETTO_INIT_TOOLTIP: 'Initialiser la caméra intelligente Pixetto et configurer les broches de communication UART',
	PIXETTO_IS_DETECTED_TOOLTIP: 'Détecter si Pixetto détecte un objet',
	PIXETTO_GET_TYPE_ID_TOOLTIP: "Obtenir l'ID du type d'objet détecté par Pixetto (couleur, forme, etc.)",
	PIXETTO_GET_FUNC_ID_TOOLTIP: "Obtenir l'ID de la fonction actuellement utilisée par Pixetto (détection couleur, forme, etc.)",
	PIXETTO_COLOR_DETECT_TOOLTIP: 'Détecter si Pixetto détecte un objet de couleur spécifiée',
	PIXETTO_SHAPE_DETECT_TOOLTIP: 'Détecter si Pixetto détecte un objet de forme spécifiée',
	PIXETTO_FACE_DETECT_TOOLTIP: 'Détecter si Pixetto détecte un visage',
	PIXETTO_APRILTAG_DETECT_TOOLTIP: "Détecter si Pixetto détecte un AprilTag avec l'ID spécifié",
	PIXETTO_NEURAL_NETWORK_TOOLTIP: 'Détecter si le réseau de neurones Pixetto reconnaît un objet de classe spécifiée',
	PIXETTO_HANDWRITTEN_DIGIT_TOOLTIP: 'Détecter si Pixetto reconnaît un chiffre manuscrit spécifié',
	PIXETTO_GET_POSITION_TOOLTIP: "Obtenir les informations de position ou de taille de l'objet détecté par Pixetto",
	PIXETTO_ROAD_DETECT_TOOLTIP: 'Obtenir les informations liées à la détection de route de Pixetto',
	PIXETTO_SET_MODE_TOOLTIP: 'Configurer le mode fonctionnel de la caméra intelligente Pixetto',

	// Pixetto Color Options
	PIXETTO_COLOR_RED: 'Rouge',
	PIXETTO_COLOR_BLUE: 'Bleu',
	PIXETTO_COLOR_GREEN: 'Vert',
	PIXETTO_COLOR_YELLOW: 'Jaune',
	PIXETTO_COLOR_ORANGE: 'Orange',
	PIXETTO_COLOR_PURPLE: 'Violet',
	PIXETTO_COLOR_BLACK: 'Noir',
	PIXETTO_COLOR_WHITE: 'Blanc',

	// Pixetto Shape Options
	PIXETTO_SHAPE_TRIANGLE: 'Triangle',
	PIXETTO_SHAPE_RECTANGLE: 'Rectangle',
	PIXETTO_SHAPE_PENTAGON: 'Pentagone',
	PIXETTO_SHAPE_HEXAGON: 'Hexagone',
	PIXETTO_SHAPE_CIRCLE: 'Cercle',

	// Pixetto Position Options
	PIXETTO_POSITION_X: 'Coordonnée X',
	PIXETTO_POSITION_Y: 'Coordonnée Y',
	PIXETTO_POSITION_WIDTH: 'Largeur',
	PIXETTO_POSITION_HEIGHT: 'Hauteur',

	// Pixetto Road Info Options
	PIXETTO_ROAD_CENTER_X: 'Centre X',
	PIXETTO_ROAD_CENTER_Y: 'Centre Y',
	PIXETTO_ROAD_LEFT_X: 'Limite Gauche X',
	PIXETTO_ROAD_RIGHT_X: 'Limite Droite X',

	// Pixetto Mode Options
	PIXETTO_MODE_COLOR_DETECTION: 'Détection de Couleur',
	PIXETTO_MODE_SHAPE_DETECTION: 'Détection de Forme',
	PIXETTO_MODE_FACE_DETECTION: 'Détection de Visage',
	PIXETTO_MODE_APRILTAG_DETECTION: "Détection d'AprilTag",
	PIXETTO_MODE_NEURAL_NETWORK: 'Réseau de Neurones',
	PIXETTO_MODE_HANDWRITTEN_DIGIT: 'Chiffre Manuscrit',
	PIXETTO_MODE_ROAD_DETECTION: 'Détection de Route',
	PIXETTO_MODE_BALL_DETECTION: 'Détection de Balle',
	PIXETTO_MODE_TEMPLATE_MATCHING: 'Correspondance de Modèle',

	// HUSKYLENS Smart Camera
	HUSKYLENS_INIT_I2C: 'Initialiser HUSKYLENS (I2C)',
	HUSKYLENS_INIT_UART: 'Initialiser HUSKYLENS (UART)',
	HUSKYLENS_RX_PIN: 'Connecter à HuskyLens TX →',
	HUSKYLENS_TX_PIN: 'Connecter à HuskyLens RX →',
	HUSKYLENS_SET_ALGORITHM: 'Définir Algorithme HUSKYLENS',
	HUSKYLENS_ALGORITHM_FACE_RECOGNITION: 'Reconnaissance Faciale',
	HUSKYLENS_ALGORITHM_OBJECT_TRACKING: "Suivi d'Objet",
	HUSKYLENS_ALGORITHM_OBJECT_RECOGNITION: "Reconnaissance d'Objet",
	HUSKYLENS_ALGORITHM_LINE_TRACKING: 'Suivi de Ligne',
	HUSKYLENS_ALGORITHM_COLOR_RECOGNITION: 'Reconnaissance de Couleur',
	HUSKYLENS_ALGORITHM_TAG_RECOGNITION: 'Reconnaissance de Tag',
	HUSKYLENS_ALGORITHM_OBJECT_CLASSIFICATION: "Classification d'Objet",
	HUSKYLENS_REQUEST: 'Demander Données HUSKYLENS',
	HUSKYLENS_IS_LEARNED: 'HUSKYLENS a Appris',
	HUSKYLENS_COUNT_BLOCKS: 'Nombre de Blocs HUSKYLENS',
	HUSKYLENS_COUNT_ARROWS: 'Nombre de Flèches HUSKYLENS',
	HUSKYLENS_GET_BLOCK_INFO: 'Obtenir Bloc',
	HUSKYLENS_GET_ARROW_INFO: 'Obtenir Flèche',
	HUSKYLENS_BLOCK_INFO_TYPE: ' ',
	HUSKYLENS_ARROW_INFO_TYPE: ' ',
	HUSKYLENS_X_CENTER: 'Centre X',
	HUSKYLENS_Y_CENTER: 'Centre Y',
	HUSKYLENS_WIDTH: 'Largeur',
	HUSKYLENS_HEIGHT: 'Hauteur',
	HUSKYLENS_ID: 'ID',
	HUSKYLENS_X_ORIGIN: 'Origine X',
	HUSKYLENS_Y_ORIGIN: 'Origine Y',
	HUSKYLENS_X_TARGET: 'Cible X',
	HUSKYLENS_Y_TARGET: 'Cible Y',
	HUSKYLENS_LEARN: 'HUSKYLENS Apprendre ID',
	HUSKYLENS_FORGET: 'HUSKYLENS Oublier Tout',

	// HuskyLens ID-Based Blocs
	HUSKYLENS_BY_ID_LABEL: 'Requête par ID',
	HUSKYLENS_REQUEST_BLOCKS_ID: 'demander blocs HUSKYLENS avec ID',
	HUSKYLENS_REQUEST_BLOCKS_ID_SUFFIX: '',
	HUSKYLENS_REQUEST_BLOCKS_ID_TOOLTIP: 'Demander uniquement les blocs avec un ID spécifique pour une meilleure efficacité',
	HUSKYLENS_COUNT_BLOCKS_ID: 'nombre de blocs HUSKYLENS avec ID',
	HUSKYLENS_COUNT_BLOCKS_ID_SUFFIX: '',
	HUSKYLENS_COUNT_BLOCKS_ID_TOOLTIP: 'Obtenir le nombre de blocs avec un ID spécifique',
	HUSKYLENS_GET_BLOCK_ID: 'obtenir bloc avec ID',
	HUSKYLENS_GET_BLOCK_ID_INDEX: 'index',
	HUSKYLENS_GET_BLOCK_ID_INDEX_SUFFIX: '',
	HUSKYLENS_GET_BLOCK_ID_TOOLTIP: "Obtenir la position, taille ou ID d'un bloc avec un ID spécifique",

	// HUSKYLENS Tooltips
	HUSKYLENS_INIT_I2C_TOOLTIP: 'Initialiser la caméra intelligente HUSKYLENS avec I2C',
	HUSKYLENS_INIT_UART_TOOLTIP: 'Initialiser la caméra intelligente HUSKYLENS avec UART, définir les broches RX/TX',
	HUSKYLENS_SET_ALGORITHM_TOOLTIP: "Définir l'algorithme de reconnaissance utilisé par HUSKYLENS",
	HUSKYLENS_REQUEST_TOOLTIP: 'Demander les derniers résultats de reconnaissance de HUSKYLENS',
	HUSKYLENS_IS_LEARNED_TOOLTIP: 'Vérifier si HUSKYLENS a appris quelque chose',
	HUSKYLENS_COUNT_BLOCKS_TOOLTIP: 'Obtenir le nombre de blocs détectés par HUSKYLENS',
	HUSKYLENS_COUNT_ARROWS_TOOLTIP: 'Obtenir le nombre de flèches détectées par HUSKYLENS',
	HUSKYLENS_GET_BLOCK_INFO_TOOLTIP: 'Obtenir les informations du bloc spécifié (position, taille ou ID)',
	HUSKYLENS_GET_ARROW_INFO_TOOLTIP: 'Obtenir les informations de la flèche spécifiée (origine, cible ou ID)',
	HUSKYLENS_LEARN_TOOLTIP: "Faire apprendre à HUSKYLENS l'objet avec l'ID spécifié (mode classification d'objet uniquement)",
	HUSKYLENS_FORGET_TOOLTIP: "Effacer tous les objets appris par HUSKYLENS (mode classification d'objet uniquement)",
	HUSKYLENS_I2C_PIN_HINT: 'Câblage: ',
	HUSKYLENS_UART_PIN_HINT: 'Broches recommandées: ',
	HUSKYLENS_UART_ANY_DIGITAL: "N'importe quelle broche numérique",
	// ESP32 PWM Setup
	ESP32_PWM_SETUP: 'Configuration PWM ESP32',
	ESP32_PWM_FREQUENCY: 'Fréquence',
	ESP32_PWM_RESOLUTION: 'Résolution',
	ESP32_PWM_FREQUENCY_TOOLTIP:
		'Définir la fréquence PWM, plage 1-80000 Hz. Haute fréquence pour les puces de pilotage de moteur (20-75KHz)',
	ESP32_PWM_RESOLUTION_TOOLTIP: 'Définir la résolution PWM, affecte la précision de sortie. Note: fréquence × 2^résolution ≤ 80 000 000',
	ESP32_PWM_RESOLUTION_8BIT: '8 bits (0-255)',
	ESP32_PWM_RESOLUTION_10BIT: '10 bits (0-1023)',
	ESP32_PWM_RESOLUTION_12BIT: '12 bits (0-4095)',
	ESP32_PWM_RESOLUTION_13BIT: '13 bits (0-8191)',
	ESP32_PWM_RESOLUTION_14BIT: '14 bits (0-16383)',
	ESP32_PWM_RESOLUTION_15BIT: '15 bits (0-32767)',
	ESP32_PWM_RESOLUTION_16BIT: '16 bits (0-65535)',
	// Safety Guard (Project Safety Protection)
	SAFETY_WARNING_BODY_NO_TYPE:
		"Ce projet n'a pas encore de blocs Blockly. Si vous continuez, le dossier et les fichiers blockly seront créés ici. Voulez-vous continuer?",
	SAFETY_WARNING_BODY_WITH_TYPE:
		"Projet {0} détecté. Ce projet n'a pas encore de blocs Blockly. Si vous continuez, le dossier et les fichiers blockly seront créés ici. Voulez-vous continuer?",
	BUTTON_CONTINUE: 'Continuer',
	BUTTON_CANCEL: 'Annuler',
	BUTTON_SUPPRESS: 'Ne plus me rappeler',
	SAFETY_GUARD_CANCELLED: "Ouverture de l'éditeur Blockly annulée",
	SAFETY_GUARD_SUPPRESSED: 'Préférence enregistrée, cet avertissement ne sera plus affiché',

	// Communication Category (WiFi/MQTT)
	CATEGORY_COMMUNICATION: 'Communication',
	ESP32_WIFI_LABEL: 'WiFi',
	ESP32_MQTT_LABEL: 'MQTT',
	ESP32_WIFI_CONNECT: 'WiFi Connecter',
	ESP32_WIFI_CONNECT_SSID: 'SSID',
	ESP32_WIFI_CONNECT_PASSWORD: 'Mot de passe',
	ESP32_WIFI_CONNECT_TOOLTIP: 'Se connecter au réseau WiFi (délai 10 secondes)',
	ESP32_WIFI_DISCONNECT: 'WiFi Déconnecter',
	ESP32_WIFI_DISCONNECT_TOOLTIP: 'Déconnecter WiFi',
	ESP32_WIFI_STATUS: 'WiFi Connecté?',
	ESP32_WIFI_STATUS_TOOLTIP: "Retourne l'état de connexion WiFi",
	ESP32_WIFI_GET_IP: 'Adresse IP WiFi',
	ESP32_WIFI_GET_IP_TOOLTIP: "Obtenir l'adresse IP actuelle",
	ESP32_WIFI_SCAN: 'Scanner Réseaux WiFi',
	ESP32_WIFI_SCAN_TOOLTIP: 'Scanner et retourner le nombre de réseaux WiFi à proximité',
	ESP32_WIFI_GET_SSID: 'Obtenir SSID WiFi',
	ESP32_WIFI_GET_SSID_INDEX: 'index',
	ESP32_WIFI_GET_SSID_TOOLTIP: "Obtenir le nom WiFi à l'index spécifié",
	ESP32_WIFI_GET_RSSI: 'Obtenir Force Signal WiFi',
	ESP32_WIFI_GET_RSSI_INDEX: 'index',
	ESP32_WIFI_GET_RSSI_TOOLTIP: "Obtenir la force du signal à l'index spécifié (dBm)",
	ESP32_MQTT_SETUP: 'Configuration MQTT',
	ESP32_MQTT_SETUP_SERVER: 'Serveur',
	ESP32_MQTT_SETUP_PORT: 'Port',
	ESP32_MQTT_SETUP_CLIENT_ID: 'ID Client',
	ESP32_MQTT_SETUP_TOOLTIP: 'Configurer les paramètres de connexion du serveur MQTT',
	ESP32_MQTT_CONNECT: 'MQTT Connecter',
	ESP32_MQTT_CONNECT_USERNAME: 'Utilisateur',
	ESP32_MQTT_CONNECT_PASSWORD: 'Mot de passe',
	ESP32_MQTT_CONNECT_TOOLTIP: 'Se connecter au serveur MQTT',
	ESP32_MQTT_PUBLISH: 'MQTT Publier',
	ESP32_MQTT_PUBLISH_TOPIC: 'Sujet',
	ESP32_MQTT_PUBLISH_MESSAGE: 'Message',
	ESP32_MQTT_PUBLISH_TOOLTIP: 'Publier un message sur le sujet spécifié',
	ESP32_MQTT_SUBSCRIBE: "MQTT S'abonner",
	ESP32_MQTT_SUBSCRIBE_TOPIC: 'Sujet',
	ESP32_MQTT_SUBSCRIBE_TOOLTIP: "S'abonner aux messages du sujet spécifié",
	ESP32_MQTT_LOOP: 'MQTT Traiter Messages',
	ESP32_MQTT_LOOP_TOOLTIP: 'Maintenir la connexion et traiter les messages reçus (mettre dans loop)',
	ESP32_MQTT_GET_TOPIC: 'MQTT Dernier Sujet',
	ESP32_MQTT_GET_TOPIC_TOOLTIP: 'Obtenir le sujet du message le plus récent',
	ESP32_MQTT_GET_MESSAGE: 'MQTT Dernier Message',
	ESP32_MQTT_GET_MESSAGE_TOOLTIP: 'Obtenir le contenu du message le plus récent',
	ESP32_MQTT_STATUS: 'MQTT Connecté',
	ESP32_MQTT_STATUS_TOOLTIP: 'Vérifier si connecté au serveur MQTT',
	TEXT_TO_NUMBER: 'Texte vers Nombre',
	TEXT_TO_NUMBER_INT: 'Entier',
	TEXT_TO_NUMBER_FLOAT: 'Décimal',
	TEXT_TO_NUMBER_TOOLTIP: 'Convertir le texte en nombre (entrée invalide retourne 0)',

	// To String Block
	TO_STRING: 'Vers Texte',
	TO_STRING_TOOLTIP: 'Convertir un nombre ou un booléen en texte',

	// ESP32 Only Block Warning
	ESP32_ONLY_BLOCK_WARNING: 'Ce bloc ne supporte que les cartes ESP32',

	// Quick Backup Toast Messages
	BACKUP_QUICK_SAVE_SUCCESS: 'Sauvegarde enregistrée : {0}',
	BACKUP_QUICK_SAVE_EMPTY: "L'espace de travail est vide, aucune sauvegarde nécessaire",
	BACKUP_QUICK_SAVE_COOLDOWN: 'Veuillez patienter, la sauvegarde vient de se terminer',
	MAIN_BLOCK_DUPLICATE_WARNING: 'Plusieurs blocs de programme principal ont été détectés. Veuillez supprimer les blocs en trop.',

	// Board Switch Warning
	BOARD_SWITCH_WARNING_TITLE: 'Changer de type de carte',
	BOARD_SWITCH_WARNING_MESSAGE:
		"Passer à un autre type de carte effacera l'espace de travail actuel.\nVotre travail sera automatiquement sauvegardé d'abord.\n\nVoulez-vous continuer ?",

	// CyberBrick Board
	BOARD_CYBERBRICK: 'CyberBrick',

	// CyberBrick Category
	CATEGORY_CYBERBRICK_CORE: 'CyberBrick',
	CATEGORY_CYBERBRICK_LED: 'LED',
	CATEGORY_CYBERBRICK_GPIO: 'GPIO',
	CATEGORY_CYBERBRICK_TIME: 'Temps',

	// CyberBrick Main Block
	CYBERBRICK_MAIN: 'Programme principal',
	CYBERBRICK_MAIN_TOOLTIP: "Point d'entrée du programme principal CyberBrick. Tout le code doit être placé dans ce bloc.",

	// CyberBrick LED Blocks
	CYBERBRICK_LED_SET_COLOR: 'Définir couleur LED',
	CYBERBRICK_LED_SET_COLOR_PREFIX: 'Définir couleur LED intégrée',
	CYBERBRICK_LED_RED: 'Rouge',
	CYBERBRICK_LED_GREEN: 'Vert',
	CYBERBRICK_LED_BLUE: 'Bleu',
	CYBERBRICK_LED_SET_COLOR_TOOLTIP: 'Définir la couleur de la LED intégrée (GPIO8) avec valeurs RVB (0-255)',
	CYBERBRICK_LED_OFF: 'Éteindre LED',
	CYBERBRICK_LED_OFF_TOOLTIP: 'Éteindre la LED intégrée',

	// CyberBrick GPIO Blocks
	CYBERBRICK_GPIO_SET: 'Définir GPIO',
	CYBERBRICK_GPIO_SET_PREFIX: 'GPIO',
	CYBERBRICK_GPIO_SET_TO: 'à',
	CYBERBRICK_GPIO_PIN: 'Broche',
	CYBERBRICK_GPIO_VALUE: 'Valeur',
	CYBERBRICK_GPIO_HIGH: 'HAUT',
	CYBERBRICK_GPIO_LOW: 'BAS',
	CYBERBRICK_GPIO_SET_TOOLTIP: 'Définir broche GPIO à HAUT ou BAS',
	CYBERBRICK_GPIO_READ: 'Lire GPIO',
	CYBERBRICK_GPIO_READ_TOOLTIP: 'Lire valeur numérique de la broche GPIO (retourne 0 ou 1)',

	// CyberBrick Time Blocks
	CYBERBRICK_DELAY_MS: 'Délai (ms)',
	CYBERBRICK_DELAY_MS_PREFIX: 'Délai',
	CYBERBRICK_DELAY_MS_SUFFIX: 'ms',
	CYBERBRICK_DELAY_MS_TOOLTIP: "Suspendre l'exécution du programme pendant les millisecondes spécifiées",
	CYBERBRICK_DELAY_S: 'Délai (s)',
	CYBERBRICK_DELAY_S_PREFIX: 'Délai',
	CYBERBRICK_DELAY_S_SUFFIX: 'secondes',
	CYBERBRICK_DELAY_S_TOOLTIP: "Suspendre l'exécution du programme pendant les secondes spécifiées",
	CYBERBRICK_TICKS_MS: 'Obtenir les millisecondes actuelles',
	CYBERBRICK_TICKS_MS_TOOLTIP: 'Obtenir le compteur actuel de millisecondes',
	CYBERBRICK_TICKS_DIFF_PREFIX: 'Différence de temps',
	CYBERBRICK_TICKS_DIFF_NOW: 'maintenant',
	CYBERBRICK_TICKS_DIFF_START: 'début',
	CYBERBRICK_TICKS_DIFF_TOOLTIP: 'Calculer les millisecondes entre maintenant et le début',

	// CyberBrick WiFi Blocks
	CATEGORY_CYBERBRICK_WIFI: 'WiFi',
	CYBERBRICK_WIFI_CONNECT: 'Connecter WiFi',
	CYBERBRICK_WIFI_SSID: 'SSID',
	CYBERBRICK_WIFI_PASSWORD: 'Mot de passe',
	CYBERBRICK_WIFI_CONNECT_TOOLTIP: 'Se connecter au réseau WiFi spécifié',
	CYBERBRICK_WIFI_DISCONNECT: 'Déconnecter WiFi',
	CYBERBRICK_WIFI_DISCONNECT_TOOLTIP: 'Se déconnecter du réseau WiFi actuel',
	CYBERBRICK_WIFI_IS_CONNECTED: 'WiFi connecté ?',
	CYBERBRICK_WIFI_IS_CONNECTED_TOOLTIP: 'Vérifier si WiFi est connecté',
	CYBERBRICK_WIFI_GET_IP: 'Obtenir adresse IP',
	CYBERBRICK_WIFI_GET_IP_TOOLTIP: "Obtenir l'adresse IP actuelle",

	// CyberBrick Upload
	UPLOAD_BUTTON_TITLE: 'Téléverser vers CyberBrick',
	UPLOAD_BUTTON_DISABLED_TITLE: "Enregistrez d'abord l'espace de travail pour activer le téléversement",
	UPLOAD_STARTING: 'Démarrage du téléversement...',
	UPLOAD_SUCCESS: 'Téléversement réussi !',
	UPLOAD_FAILED: 'Téléversement échoué : {0}',
	UPLOAD_NO_PORT: 'Aucun appareil CyberBrick trouvé',
	UPLOAD_IN_PROGRESS: 'Téléversement en cours...',
	UPLOAD_EMPTY_WORKSPACE: "L'espace de travail est vide, ajoutez des blocs d'abord",
	UPLOAD_NO_CODE: 'Impossible de générer le code',

	// Upload progress stages
	UPLOAD_STAGE_PREPARING: 'Préparation',
	UPLOAD_STAGE_CHECKING: 'Vérification des outils',
	UPLOAD_STAGE_INSTALLING: 'Installation des outils',
	UPLOAD_STAGE_CONNECTING: 'Connexion au dispositif',
	UPLOAD_STAGE_RESETTING: 'Réinitialisation du dispositif',
	UPLOAD_STAGE_BACKUP: 'Sauvegarde',
	UPLOAD_STAGE_UPLOADING: 'Téléversement',
	UPLOAD_STAGE_RESTARTING: 'Redémarrage du dispositif',
	UPLOAD_STAGE_COMPLETED: 'Terminé',

	// Upload error messages
	ERROR_UPLOAD_BOARD_UNSUPPORTED: 'Seule la carte CyberBrick est prise en charge',
	ERROR_UPLOAD_CODE_EMPTY: 'Le code ne peut pas être vide',
	ERROR_UPLOAD_NO_PYTHON: "Environnement Python PlatformIO introuvable. Veuillez d'abord installer PlatformIO.",
	ERROR_UPLOAD_MPREMOTE_FAILED: "Échec de l'installation de mpremote",
	ERROR_UPLOAD_DEVICE_NOT_FOUND: "Appareil CyberBrick introuvable. Veuillez vérifier qu'il est connecté.",
	ERROR_UPLOAD_RESET_FAILED: "Échec de la réinitialisation de l'appareil",
	ERROR_UPLOAD_UPLOAD_FAILED: 'Échec du téléversement du programme',
	ERROR_UPLOAD_RESTART_FAILED: "Échec du redémarrage de l'appareil",

	// Arduino Upload Button
	UPLOAD_BUTTON_TITLE_ARDUINO: 'Compiler & Téléverser',
	UPLOAD_SELECT_BOARD: "Veuillez d'abord sélectionner une carte",

	// Arduino Upload Stages
	ARDUINO_STAGE_SYNCING: 'Synchronisation des paramètres',
	ARDUINO_STAGE_SAVING: "Enregistrement de l'espace de travail",
	ARDUINO_STAGE_CHECKING: 'Vérification du compilateur',
	ARDUINO_STAGE_DETECTING: 'Détection de la carte',
	ARDUINO_STAGE_COMPILING: 'Compilation',
	ARDUINO_STAGE_UPLOADING: 'Téléversement',

	// Arduino Upload Results
	ARDUINO_COMPILE_SUCCESS: 'Compilation réussie !',
	ARDUINO_UPLOAD_SUCCESS: 'Téléversement réussi !',

	// Arduino Upload Errors
	ERROR_ARDUINO_PIO_NOT_FOUND: "PlatformIO CLI introuvable. Veuillez d'abord installer PlatformIO.",
	ERROR_ARDUINO_COMPILE_FAILED: 'Échec de la compilation',
	ERROR_ARDUINO_UPLOAD_FAILED: 'Échec du téléversement',
	ERROR_ARDUINO_NO_WORKSPACE: "Veuillez d'abord ouvrir un dossier de projet",
	ERROR_ARDUINO_TIMEOUT: "L'opération a expiré",
	ERROR_ARDUINO_DEVICE_DISCONNECT: "L'appareil a été déconnecté",

	// Backup messages
	BACKUP_CONFIRM_DELETE: 'Êtes-vous sûr de vouloir supprimer la sauvegarde "{0}" ?',
	BACKUP_CONFIRM_RESTORE: 'Êtes-vous sûr de vouloir restaurer la sauvegarde "{0}" ? Cela écrasera l\'espace de travail actuel.',
	BACKUP_ERROR_NOT_FOUND: 'Sauvegarde "{0}" introuvable',
	BACKUP_ERROR_CREATE_FAILED: 'Échec de la création de la sauvegarde : {0}',
	BACKUP_ERROR_DELETE_FAILED: 'Échec de la suppression de la sauvegarde : {0}',
	BACKUP_ERROR_RESTORE_FAILED: 'Échec de la restauration de la sauvegarde : {0}',
	BACKUP_ERROR_PREVIEW_FAILED: "Échec de l'aperçu de la sauvegarde : {0}",
	BACKUP_ERROR_NAME_NOT_SPECIFIED: 'Nom de sauvegarde non spécifié',
	BACKUP_ERROR_MAIN_NOT_FOUND: 'Impossible de trouver le fichier main.json',
	BACKUP_ERROR_UPDATE_SETTINGS_FAILED: 'Échec de la mise à jour des paramètres de sauvegarde automatique',

	// Button labels
	BUTTON_DELETE: 'Supprimer',
	BUTTON_RESTORE: 'Restaurer',

	// Error messages
	ERROR_PROCESSING_MESSAGE: 'Erreur lors du traitement du message : {0}',
	ERROR_SETTINGS_UPDATE_FAILED: 'Échec de la mise à jour des paramètres',
	ERROR_RELOAD_WORKSPACE_FAILED: "Échec du rechargement de l'espace de travail : {0}",
	ERROR_OPEN_PROJECT_FOLDER_FIRST: "Veuillez d'abord ouvrir un dossier de projet",

	// Info messages
	INFO_NO_BACKUPS_TO_PREVIEW: 'Aucun fichier de sauvegarde à prévisualiser',

	// Dialog messages
	DIALOG_SELECT_BACKUP_TITLE: 'Sélectionner le fichier de sauvegarde à prévisualiser',
	DIALOG_BACKUP_FILES_LABEL: 'Fichiers de sauvegarde',

	// Carte d'extension X11
	CATEGORY_X11: 'Extension X11',
	X11_LABEL_SERVOS: 'Servomoteurs',
	X11_LABEL_MOTORS: 'Moteurs',
	X11_LABEL_LEDS: 'LEDs',

	// Blocs servo 180° X11
	X11_SERVO_180_ANGLE_PREFIX: 'Définir servo',
	X11_SERVO_180_ANGLE_SUFFIX: 'angle',
	X11_SERVO_180_ANGLE_TOOLTIP: "Définir l'angle du servo 180° (0-180 degrés)",

	// Blocs servo 360° X11
	X11_SERVO_360_SPEED_PREFIX: 'Définir servo',
	X11_SERVO_360_SPEED_SUFFIX: 'vitesse',
	X11_SERVO_360_SPEED_TOOLTIP: 'Définir la vitesse du servo à rotation continue 360° (-100 à 100, négatif=inverse)',

	// Bloc d'arrêt servo X11
	X11_SERVO_STOP: 'Arrêter servo',
	X11_SERVO_STOP_TOOLTIP: 'Arrêter le servo spécifié',

	// Blocs moteur X11
	X11_MOTOR_SPEED_PREFIX: 'Définir moteur',
	X11_MOTOR_SPEED_SUFFIX: 'vitesse',
	X11_MOTOR_SPEED_TOOLTIP: 'Définir la vitesse du moteur CC (-2048 à 2048, négatif=inverse)',
	X11_MOTOR_STOP: 'Arrêter moteur',
	X11_MOTOR_STOP_TOOLTIP: 'Arrêter le moteur spécifié',

	// Blocs LED X11
	X11_LED_SET_COLOR_PREFIX: 'Bande LED',
	X11_LED_SET_COLOR_INDEX: 'index',
	X11_LED_SET_COLOR_INDEX_SUFFIX: 'définir couleur R',
	X11_LED_SET_COLOR_TOOLTIP: 'Définir la couleur du pixel de la bande LED (index 0=premier pixel, ou tous)',
	X11_LED_INDEX_ALL: 'Tous',

	// === Carte d'extension X12 Émetteur ===
	CATEGORY_X12: 'X12 Extension',
	X12_LABEL_JOYSTICK: 'Joystick',
	X12_LABEL_BUTTON: 'Bouton',

	// Blocs Joystick X12
	X12_GET_JOYSTICK_PREFIX: 'Joystick',
	X12_GET_JOYSTICK_SUFFIX: 'valeur',
	X12_GET_JOYSTICK_TOOLTIP: 'Lire la valeur ADC du joystick (0-4095)',
	X12_GET_JOYSTICK_MAPPED_PREFIX: 'Joystick',
	X12_GET_JOYSTICK_MAPPED_MIN: 'mapper vers',
	X12_GET_JOYSTICK_MAPPED_MAX: '~',
	X12_GET_JOYSTICK_MAPPED_TOOLTIP: 'Lire le joystick et mapper vers une plage spécifiée',

	// Blocs Bouton X12
	X12_IS_BUTTON_PRESSED_PREFIX: 'Bouton',
	X12_IS_BUTTON_PRESSED_SUFFIX: 'appuyé?',
	X12_IS_BUTTON_PRESSED_TOOLTIP: 'Vérifier si le bouton est appuyé',

	// === ESP-NOW RC Appairage Personnalisé ===
	CATEGORY_RC: 'Connexion RC',
	RC_LABEL_MASTER: '📡 Émetteur',
	RC_LABEL_SLAVE: '📻 Récepteur',
	RC_LABEL_DATA: '📊 Lecture de données',
	RC_LABEL_STATUS: '🔗 État de connexion',

	// Blocs Émetteur RC
	RC_MASTER_INIT: 'Initialiser émetteur RC',
	RC_MASTER_INIT_PAIR_ID: 'ID paire',
	RC_MASTER_INIT_CHANNEL: 'Canal',
	RC_MASTER_INIT_TOOLTIP: 'Initialiser émetteur RC avec ID paire (1-255) et canal (1-11)',
	RC_SEND: 'Envoyer données RC',
	RC_SEND_TOOLTIP: 'Lire données joystick/boutons X12 et envoyer au récepteur',

	// Blocs Récepteur RC
	RC_SLAVE_INIT: 'Initialiser récepteur RC',
	RC_SLAVE_INIT_PAIR_ID: 'ID paire',
	RC_SLAVE_INIT_CHANNEL: 'Canal',
	RC_SLAVE_INIT_TOOLTIP: 'Initialiser récepteur RC avec ID paire (1-255) et canal (1-11)',
	RC_WAIT_CONNECTION: 'Attendre appairage',
	RC_WAIT_TIMEOUT: 'délai',
	RC_WAIT_SECONDS: 'secondes',
	RC_WAIT_TOOLTIP: 'Attendre connexion émetteur, LED clignote bleu, continue après délai',
	RC_IS_CONNECTED: 'RC connecté?',
	RC_IS_CONNECTED_TOOLTIP: 'Vérifier si données reçues dans 500ms',

	// Blocs Lecture de données RC
	RC_GET_JOYSTICK_PREFIX: 'RC joystick',
	RC_GET_JOYSTICK_TOOLTIP: 'Lire valeur joystick distant (0-4095), 2048 est centre',
	RC_GET_JOYSTICK_MAPPED_PREFIX: 'RC joystick',
	RC_GET_JOYSTICK_MAPPED_MIN: 'mapper vers',
	RC_GET_JOYSTICK_MAPPED_MAX: '~',
	RC_GET_JOYSTICK_MAPPED_TOOLTIP: 'Lire joystick distant et mapper vers plage spécifiée',
	RC_IS_BUTTON_PRESSED_PREFIX: 'RC bouton',
	RC_IS_BUTTON_PRESSED_SUFFIX: 'appuyé?',
	RC_IS_BUTTON_PRESSED_TOOLTIP: 'Vérifier si bouton distant est appuyé',
	RC_GET_BUTTON_PREFIX: 'RC bouton',
	RC_GET_BUTTON_SUFFIX: 'état',
	RC_GET_BUTTON_TOOLTIP: 'Lire état bouton distant (0=appuyé, 1=relâché)',

	// === Serial Monitor ===
	MONITOR_BUTTON_TITLE: 'Ouvrir le moniteur',
	MONITOR_BUTTON_STOP_TITLE: 'Arrêter le moniteur',
	MONITOR_BUTTON_DISABLED_TITLE: 'Moniteur (uniquement pour CyberBrick)',
	MONITOR_STARTING: 'Démarrage du moniteur...',
	MONITOR_CONNECTED: 'Connecté à {0}',
	MONITOR_STOPPED: 'Moniteur arrêté',
	MONITOR_DEVICE_NOT_FOUND: 'Appareil CyberBrick introuvable',
	MONITOR_DEVICE_DISCONNECTED: 'Appareil CyberBrick déconnecté',
	MONITOR_CONNECTION_FAILED: 'Échec de connexion à l\'appareil',
	MONITOR_CLOSED_FOR_UPLOAD: 'Moniteur mis en pause pour le téléchargement',
});
        MONITOR_DEVICE_DISCONNECTED: 'Appareil CyberBrick déconnecté',
        MONITOR_CONNECTION_FAILED: 'Échec de connexion à l\'appareil',
        MONITOR_CLOSED_FOR_UPLOAD: 'Moniteur mis en pause pour le téléchargement',
