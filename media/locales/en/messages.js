/**
 * @license
 * Copyright 2024 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file contains translations derived from Blockly project
 * Copyright 2012 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

// Define translations for English
window.languageManager.loadMessages('en', {
	// UI Elements
	BLOCKS_TAB: 'Blocks',
	CODE_TAB: 'Code',
	BOARD_SELECT_LABEL: 'Select Board:',

	// Preview Mode UI
	PREVIEW_BADGE: 'Preview',
	THEME_TOGGLE: 'Toggle Theme',
	PREVIEW_WINDOW_TITLE: 'Blockly Preview - {0}',
	PREVIEW_WINDOW_TITLE_WITH_NAME: 'Preview - {0}',

	// Backup Modal UI
	BACKUP_MANAGER_TITLE: 'Backup Manager',
	BACKUP_CREATE_NEW: 'Create New Backup',
	BACKUP_NAME_LABEL: 'Backup Name:',
	BACKUP_NAME_PLACEHOLDER: 'Enter backup name',
	BACKUP_CONFIRM: 'Confirm',
	BACKUP_CANCEL: 'Cancel',
	BACKUP_LIST_TITLE: 'Backup List',
	BACKUP_LIST_EMPTY: 'No backups available',
	BACKUP_BUTTON_TITLE: 'Backup Manager',
	BACKUP_PREVIEW_BTN: 'Preview',
	BACKUP_RESTORE_BTN: 'Restore',
	BACKUP_DELETE_BTN: 'Delete',
	AUTO_BACKUP_TITLE: 'Auto Backup Settings',
	AUTO_BACKUP_INTERVAL_LABEL: 'Backup Interval:',
	AUTO_BACKUP_MINUTES: 'minutes',
	AUTO_BACKUP_SAVE: 'Save Settings',
	AUTO_BACKUP_SAVED: 'Auto backup settings saved',
	AUTO_BACKUP_PREFIX: 'auto_',
	MANUAL_BACKUP_TITLE: 'Manual Backup',

	// Board Names
	BOARD_NONE: 'None',
	BOARD_UNO: 'Arduino Uno',
	BOARD_NANO: 'Arduino Nano',
	BOARD_MEGA: 'Arduino Mega',
	BOARD_ESP32: 'ESP32',
	BOARD_SUPERMINI: 'Super Mini',

	// Block Categories
	CATEGORY_LOGIC: 'Logic',
	CATEGORY_LOOPS: 'Loops',
	CATEGORY_MATH: 'Math',
	CATEGORY_TEXT: 'Text',
	CATEGORY_LISTS: 'Lists',
	CATEGORY_VARIABLES: 'Variables',
	CATEGORY_FUNCTIONS: 'Functions',
	CATEGORY_ARDUINO: 'Arduino',
	CATEGORY_SENSORS: 'Sensors',
	CATEGORY_MOTORS: 'Motors',
	// Servo Block Labels
	SERVO_SETUP: 'Setup Servo Motor',
	SERVO_PIN: 'Pin',
	SERVO_SETUP_TOOLTIP: 'Declare servo motor variable and set pin',
	SERVO_MOVE: 'Rotate Servo Motor',
	SERVO_ANGLE: 'Angle',
	SERVO_MOVE_TOOLTIP: 'Rotate servo motor to specific angle',
	SERVO_STOP: 'Stop Servo Motor',
	SERVO_STOP_TOOLTIP: 'Stop servo motor signal output',
	// Encoder Motor Block Labels
	ENCODER_SETUP: 'Setup Encoder Motor',
	ENCODER_NAME: 'Name',
	ENCODER_PIN_A: 'Pin A',
	ENCODER_PIN_B: 'Pin B',
	ENCODER_USE_INTERRUPT: 'Use Hardware Interrupt',
	ENCODER_SETUP_TOOLTIP: 'Setup encoder motor with pins A and B',
	ENCODER_READ: 'Read Encoder',
	ENCODER_READ_TOOLTIP: 'Read the current position of the encoder',
	ENCODER_RESET: 'Reset Encoder',
	ENCODER_RESET_TOOLTIP: 'Reset encoder to zero position',
	ENCODER_PID_SETUP: 'Setup PID Control',
	ENCODER_PID_MOTOR: 'Motor',
	ENCODER_PID_KP: 'Kp',
	ENCODER_PID_KI: 'Ki',
	ENCODER_PID_KD: 'Kd',
	ENCODER_PID_SETUP_TOOLTIP: 'Setup PID control for encoder motor',
	ENCODER_PID_COMPUTE: 'Compute PID',
	ENCODER_PID_TARGET: 'Target',
	ENCODER_PID_COMPUTE_TOOLTIP: 'Compute PID for encoder motor to reach target position',

	// Arduino Block Labels
	ARDUINO_SETUP: 'Setup',
	ARDUINO_LOOP: 'Loop',
	ARDUINO_DIGITAL_WRITE: 'Digital Write',
	ARDUINO_DIGITAL_READ: 'Digital Read',
	ARDUINO_ANALOG_WRITE: 'Analog Write',
	ARDUINO_ANALOG_READ: 'Analog Read',
	ARDUINO_PIN: 'Pin',
	ARDUINO_VALUE: 'Value',
	ARDUINO_DELAY: 'Delay',
	ARDUINO_DELAY_MS: 'milliseconds',
	ARDUINO_PULLUP: 'Enable Internal Pullup',
	ARDUINO_MODE: 'Mode',
	ARDUINO_MODE_INPUT: 'INPUT',
	ARDUINO_MODE_OUTPUT: 'OUTPUT',

	// Sensor Block Labels
	ULTRASONIC_SENSOR: 'Ultrasonic Sensor',
	ULTRASONIC_TRIG_PIN: 'Trig Pin',
	ULTRASONIC_ECHO_PIN: 'Echo Pin',
	ULTRASONIC_USE_INTERRUPT: 'Use Hardware Interrupt',
	ULTRASONIC_READ: 'Read Ultrasonic Distance (cm)',
	ULTRASONIC_TOOLTIP_SETUP: 'Configure ultrasonic sensor with Trig and Echo pins. Optional hardware interrupt for better accuracy.',
	ULTRASONIC_TOOLTIP_READ: 'Read distance measured by ultrasonic sensor in centimeters.',
	ULTRASONIC_WARNING: 'Selected Echo pin {0} does not support hardware interrupt. Please choose one of these pins: {1}',

	// Threshold Function Block Labels
	THRESHOLD_PIN: 'at',
	THRESHOLD_VALUE: 'if >',
	THRESHOLD_HIGH_VALUE: '=',
	THRESHOLD_LOW_VALUE: 'else',
	THRESHOLD_TOOLTIP_SETUP:
		'Configure a threshold function. When analog input exceeds threshold, returns first output, otherwise returns second output.',
	THRESHOLD_TOOLTIP_READ: 'Get value from the threshold function',

	// Duration block
	DURATION_REPEAT: 'Repeat for',
	DURATION_TIME: 'time',
	DURATION_MS: 'milliseconds',
	DURATION_DO: 'do',

	// Print block
	TEXT_PRINT_SHOW: 'print',
	TEXT_PRINT_NEWLINE: 'newline',

	// Pin Mode block
	PIN_MODE_SET: 'set',

	// Function Block Labels
	FUNCTION_CREATE: 'Create Function',
	FUNCTION_NAME: 'Name',
	FUNCTION_PARAMS: 'Parameters',
	FUNCTION_RETURN: 'Return',
	FUNCTION_CALL: 'Call',

	// Logic Block Labels
	LOGIC_IF: 'if',
	LOGIC_ELSE: 'else',
	LOGIC_THEN: 'then',
	LOGIC_AND: 'and',
	LOGIC_OR: 'or',
	LOGIC_NOT: 'not',
	LOGIC_TRUE: 'true',
	LOGIC_FALSE: 'false',

	// Loop Block Labels
	LOOP_REPEAT: 'repeat',
	LOOP_WHILE: 'while',
	LOOP_UNTIL: 'until',
	LOOP_FOR: 'for',
	LOOP_FOREACH: 'for each',
	LOOP_BREAK: 'break',
	LOOP_CONTINUE: 'continue',

	// Math Block Labels
	MATH_NUMBER: 'number',
	MATH_ARITHMETIC: 'arithmetic',
	MATH_OPERATIONS: 'operations',
	MATH_ADD: 'add',
	MATH_SUBTRACT: 'subtract',
	MATH_MULTIPLY: 'multiply',
	MATH_DIVIDE: 'divide',
	MATH_POWER: 'power',

	// Math Map Block
	MATH_MAP_VALUE: 'map',
	MATH_MAP_TOOLTIP:
		'Re-maps a number from one range to another. For example, map(value, 0, 1023, 0, 255) will scale an analog input to 8-bit PWM output.',

	// VS Code UI Messages
	VSCODE_OPEN_FOLDER: 'Open Folder',
	VSCODE_PLEASE_OPEN_PROJECT: 'Please open a project folder first!',
	VSCODE_FAILED_SAVE_FILE: 'Failed to save file: {0}',
	VSCODE_FAILED_UPDATE_INI: 'Failed to update platformio.ini: {0}',
	VSCODE_UNABLE_SAVE_WORKSPACE: 'Unable to save workspace state: {0}',
	VSCODE_FAILED_START: 'Failed to start Singular Blockly: {0}',
	VSCODE_CONFIRM_DELETE_VARIABLE: 'Are you sure you want to delete variable "{0}"?',
	VSCODE_BOARD_UPDATED: 'Board configuration updated to: {0}',
	VSCODE_RELOAD_REQUIRED: '，Please reload window to complete setup',
	VSCODE_ENTER_VARIABLE_NAME: 'Enter new variable name',
	VSCODE_ENTER_NEW_VARIABLE_NAME: 'Enter new variable name (current: {0})',
	VSCODE_VARIABLE_NAME_EMPTY: 'Variable name cannot be empty',
	VSCODE_VARIABLE_NAME_INVALID: 'Variable name can only contain letters, numbers and underscore, and cannot start with a number',
	VSCODE_RELOAD: 'Reload',
	VSCODE_OK: 'OK',
	VSCODE_CANCEL: 'Cancel',
	VSCODE_OPEN_BLOCKLY_EDITOR: 'Open Blockly Editor',

	// Error Messages
	ERROR_BOARD_NOT_SELECTED: 'Please select a board first',
	ERROR_INVALID_PIN: 'Invalid pin number',
	ERROR_INVALID_VALUE: 'Invalid value',
	ERROR_MISSING_TRANSLATION: 'Missing translation',

	// Blockly core messages
	ADD: 'add',
	REMOVE: 'remove',
	RENAME: 'rename',
	NEW: 'new',
	ADD_COMMENT: 'Add Comment',
	REMOVE_COMMENT: 'Remove Comment',
	DUPLICATE_BLOCK: 'Duplicate',
	HELP: 'Help',
	UNDO: 'Undo',
	REDO: 'Redo',
	COLLAPSE_BLOCK: 'Collapse Block',
	EXPAND_BLOCK: 'Expand Block',
	DELETE_BLOCK: 'Delete Block',
	DELETE_X_BLOCKS: 'Delete %1 Blocks',
	DELETE_ALL_BLOCKS: 'Delete all %1 blocks?',
	CLEAN_UP: 'Clean up Blocks',
	COLLAPSE_ALL: 'Collapse Blocks',
	EXPAND_ALL: 'Expand Blocks',
	DISABLE_BLOCK: 'Disable Block',
	ENABLE_BLOCK: 'Enable Block',
	INLINE_INPUTS: 'Inline Inputs',
	EXTERNAL_INPUTS: 'External Inputs',

	// Variable & Function messages
	RENAME_VARIABLE: 'Rename variable...',
	NEW_VARIABLE: 'Create variable...',
	DELETE_VARIABLE: 'Delete variable %1',
	PROCEDURE_ALREADY_EXISTS: 'A procedure named "%1" already exists.',

	// Logic block messages
	CONTROLS_IF_MSG_IF: 'if',
	CONTROLS_IF_MSG_THEN: 'then',
	CONTROLS_IF_MSG_ELSE: 'else',
	CONTROLS_IF_MSG_ELSEIF: 'else if',
	CONTROLS_IF_IF_TITLE_IF: 'if',
	CONTROLS_IF_ELSEIF_TITLE_ELSEIF: 'else if',
	CONTROLS_IF_ELSE_TITLE_ELSE: 'else',
	LOGIC_COMPARE_TOOLTIP_EQ: 'Return true if both inputs equal each other.',
	LOGIC_COMPARE_TOOLTIP_NEQ: 'Return true if both inputs are not equal to each other.',
	LOGIC_COMPARE_TOOLTIP_LT: 'Return true if the first input is smaller than the second input.',
	LOGIC_COMPARE_TOOLTIP_LTE: 'Return true if the first input is smaller than or equal to the second input.',
	LOGIC_COMPARE_TOOLTIP_GT: 'Return true if the first input is greater than the second input.',
	LOGIC_COMPARE_TOOLTIP_GTE: 'Return true if the first input is greater than or equal to the second input.',
	LOGIC_OPERATION_AND: 'and',
	LOGIC_OPERATION_OR: 'or',
	LOGIC_NEGATE_TITLE: 'not %1',
	LOGIC_BOOLEAN_TRUE: 'true',
	LOGIC_BOOLEAN_FALSE: 'false',
	LOGIC_NULL: 'null',

	// Additional Logic Block Messages
	LOGIC_COMPARE_HELPURL: 'https://en.wikipedia.org/wiki/Inequality_(mathematics)',
	LOGIC_NEGATE_HELPURL: 'https://github.com/google/blockly/wiki/Logic#not',
	LOGIC_NEGATE_TOOLTIP: 'Returns true if the input is false. Returns false if the input is true.',
	LOGIC_OPERATION_TOOLTIP_AND: 'Return true if both inputs are true.',
	LOGIC_OPERATION_TOOLTIP_OR: 'Return true if at least one of the inputs is true.',
	LOGIC_BOOLEAN_TOOLTIP: 'Returns either true or false.',

	// Loop block messages
	CONTROLS_REPEAT_TITLE: 'repeat %1 times',
	CONTROLS_WHILEUNTIL_OPERATOR_WHILE: 'repeat while',
	CONTROLS_WHILEUNTIL_OPERATOR_UNTIL: 'repeat until',
	CONTROLS_FOR_TITLE: 'count with %1 from %2 to %3 by %4',
	CONTROLS_FLOW_STATEMENTS_OPERATOR_BREAK: 'break out of loop',
	CONTROLS_FLOW_STATEMENTS_OPERATOR_CONTINUE: 'continue with next iteration',
	CONTROLS_REPEAT_TOOLTIP: 'Repeat some statements several times.',
	CONTROLS_WHILEUNTIL_TOOLTIP_WHILE: 'While a value is true, then do some statements.',
	CONTROLS_WHILEUNTIL_TOOLTIP_UNTIL: 'While a value is false, then do some statements.',
	CONTROLS_FOR_TOOLTIP: 'Count from the start number to the end number by the specified interval.',
	CONTROLS_FLOW_STATEMENTS_WARNING: 'Warning: This block may only be used within a loop.',

	// Math block messages
	MATH_NUMBER_HELPURL: 'https://en.wikipedia.org/wiki/Number',
	MATH_NUMBER_TOOLTIP: 'A number.',
	MATH_ARITHMETIC_OPERATOR_ADD: '+',
	MATH_ARITHMETIC_OPERATOR_MINUS: '-',
	MATH_ARITHMETIC_OPERATOR_MULTIPLY: '×',
	MATH_ARITHMETIC_OPERATOR_DIVIDE: '÷',
	MATH_ARITHMETIC_OPERATOR_POWER: '^',
	MATH_SINGLE_OPERATOR_ROOT: 'square root',
	MATH_SINGLE_OPERATOR_ABSOLUTE: 'absolute',
	MATH_IS_EVEN: 'is even',
	MATH_IS_ODD: 'is odd',
	MATH_IS_PRIME: 'is prime',
	MATH_IS_WHOLE: 'is whole',
	MATH_IS_POSITIVE: 'is positive',
	MATH_IS_NEGATIVE: 'is negative',
	MATH_ARITHMETIC_HELPURL: 'https://en.wikipedia.org/wiki/Arithmetic',
	MATH_ARITHMETIC_TOOLTIP_ADD: 'Return the sum of the two numbers.',
	MATH_ARITHMETIC_TOOLTIP_MINUS: 'Return the difference of the two numbers.',
	MATH_ARITHMETIC_TOOLTIP_MULTIPLY: 'Return the product of the two numbers.',
	MATH_ARITHMETIC_TOOLTIP_DIVIDE: 'Return the quotient of the two numbers.',
	MATH_ARITHMETIC_TOOLTIP_POWER: 'Return the first number raised to the power of the second number.',

	// Text block messages
	TEXT_JOIN_TITLE_CREATEWITH: 'create text with',
	TEXT_CREATE_JOIN_TITLE_JOIN: 'join',
	TEXT_LENGTH_TITLE: 'length of %1',
	TEXT_ISEMPTY_TITLE: '%1 is empty',
	TEXT_INDEXOF_OPERATOR_FIRST: 'find first occurrence of text',
	TEXT_INDEXOF_OPERATOR_LAST: 'find last occurrence of text',
	TEXT_CHARAT_FROM_START: 'get letter #',
	TEXT_CHARAT_FROM_END: 'get letter # from end',
	TEXT_CHARAT_FIRST: 'get first letter',
	TEXT_CHARAT_LAST: 'get last letter',
	TEXT_CHARAT_RANDOM: 'get random letter',
	TEXT_JOIN_TOOLTIP: 'Create a piece of text by joining together any number of items.',
	TEXT_APPEND_VARIABLE: 'item',
	TEXT_APPEND_TOOLTIP: 'Append some text to variable "%1".',
	TEXT_LENGTH_TOOLTIP: 'Returns the number of letters (including spaces) in the provided text.',
	TEXT_ISEMPTY_TOOLTIP: 'Returns true if the provided text is empty.',

	// List block messages
	LISTS_CREATE_EMPTY_TITLE: 'create empty list',
	LISTS_CREATE_WITH_INPUT_WITH: 'create list with',
	LISTS_LENGTH_TITLE: 'length of %1',
	LISTS_ISEMPTY_TITLE: '%1 is empty',
	LISTS_INDEXOF_FIRST: 'find first occurrence of item',
	LISTS_INDEXOF_LAST: 'find last occurrence of item',
	LISTS_GET_INDEX_GET: 'get',
	LISTS_GET_INDEX_REMOVE: 'remove',
	LISTS_GET_INDEX_FROM_START: '#',
	LISTS_GET_INDEX_FROM_END: '# from end',
	LISTS_GET_INDEX_FIRST: 'first',
	LISTS_GET_INDEX_LAST: 'last',
	LISTS_GET_INDEX_RANDOM: 'random',
	LISTS_CREATE_WITH_TOOLTIP: 'Create a list with any number of items.',
	LISTS_CREATE_EMPTY_TOOLTIP: 'Returns a list, of length 0, containing no data records',
	LISTS_LENGTH_TOOLTIP: 'Returns the length of a list.',
	LISTS_ISEMPTY_TOOLTIP: 'Returns true if the list is empty.',

	// Variables
	VARIABLES_SET: 'set %1 to %2',
	VARIABLES_GET: '%1',
	VARIABLES_DEFAULT_NAME: 'item',

	// If conditions
	CONTROLS_IF_TOOLTIP_1: 'If a value is true, then do some statements.',
	CONTROLS_IF_TOOLTIP_2: 'If a value is true, then do the first block of statements. Otherwise, do the second block of statements.',
	CONTROLS_IF_TOOLTIP_3:
		'If the first value is true, then do the first block of statements. Otherwise, if the second value is true, do the second block of statements.',
	CONTROLS_IF_TOOLTIP_4:
		'If the first value is true, then do the first block of statements. Otherwise, if the second value is true, do the second block of statements. If none of the values are true, do the last block of statements.',

	// Procedures
	PROCEDURES_DEFNORETURN_TITLE: '',
	PROCEDURES_DEFNORETURN_PROCEDURE: 'do something',
	PROCEDURES_BEFORE_PARAMS: 'with:',
	PROCEDURES_CALL_BEFORE_PARAMS: 'with:',
	PROCEDURES_DEFNORETURN_DO: '',
	PROCEDURES_DEFNORETURN_TOOLTIP: 'Creates a function with no output.',
	PROCEDURES_DEFRETURN_RETURN: 'return',
	PROCEDURES_DEFRETURN_TOOLTIP: 'Creates a function with an output.',
	PROCEDURES_DEFRETURN_COMMENT: 'Describe this function...',
	PROCEDURES_DEFRETURN_PROCEDURE: 'do something with return',
	PROCEDURES_DEFRETURN_DO: '',
	PROCEDURES_CALLNORETURN_HELPURL: 'https://en.wikipedia.org/wiki/Subroutine',
	PROCEDURES_CALLNORETURN_TOOLTIP: 'Run the user-defined function.',
	PROCEDURES_CALLRETURN_HELPURL: 'https://en.wikipedia.org/wiki/Subroutine',
	PROCEDURES_CALLRETURN_TOOLTIP: 'Run the user-defined function and use its output.',

	// Seven Segment Display
	SEVEN_SEGMENT_DISPLAY: 'Seven Segment Display',
	SEVEN_SEGMENT_COMMON_CATHODE: 'Common Cathode',
	SEVEN_SEGMENT_COMMON_ANODE: 'Common Anode',
	SEVEN_SEGMENT_NUMBER: 'Number (0-9):',
	SEVEN_SEGMENT_DECIMAL_POINT: 'Decimal Point',
	SEVEN_SEGMENT_TOOLTIP: 'Display a number (0-9) on a seven-segment display with optional decimal point.',
	// Seven Segment Display Pins
	SEVEN_SEGMENT_PINS_SET: 'Set seven segment display pins',
	SEVEN_SEGMENT_PINS_TOOLTIP: 'Configure pins for each segment (A-G) and decimal point (DP) of the seven-segment display.',
});
