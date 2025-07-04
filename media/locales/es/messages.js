/**
 * @license
 * Copyright 2024 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file contains translations derived from Blockly project
 * Copyright 2012 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

// Define translations for Spanish
window.languageManager.loadMessages('es', {
	// UI Elements
	BLOCKS_TAB: 'Bloques',
	CODE_TAB: 'Código',
	BOARD_SELECT_LABEL: 'Seleccionar placa:',

	// Experimental Blocks Notice
	EXPERIMENTAL_BLOCKS_TITLE: 'Bloques experimentales detectados',
	EXPERIMENTAL_BLOCKS_DESC:
		'Su espacio de trabajo contiene bloques experimentales (resaltados con bordes amarillos discontinuos). Estas funciones pueden cambiar o eliminarse en futuras actualizaciones, úselas con precaución.',

	// Preview Mode UI
	PREVIEW_BADGE: 'Vista previa',
	THEME_TOGGLE: 'Cambiar tema',
	PREVIEW_WINDOW_TITLE: 'Vista previa Blockly - {0}',
	PREVIEW_WINDOW_TITLE_WITH_NAME: 'Vista previa - {0}',

	// Backup Modal UI
	BACKUP_MANAGER_TITLE: 'Gestor de copias de seguridad',
	BACKUP_CREATE_NEW: 'Crear nueva copia',
	BACKUP_NAME_LABEL: 'Nombre:',
	BACKUP_NAME_PLACEHOLDER: 'Introduzca nombre de la copia',
	BACKUP_CONFIRM: 'Confirmar',
	BACKUP_CANCEL: 'Cancelar',
	BACKUP_LIST_TITLE: 'Lista de copias',
	BACKUP_LIST_EMPTY: 'No hay copias disponibles',
	BACKUP_BUTTON_TITLE: 'Gestor de copias',
	REFRESH_BUTTON_TITLE: 'Actualizar código',
	BACKUP_PREVIEW_BTN: 'Previsualizar',
	BACKUP_RESTORE_BTN: 'Restaurar',
	BACKUP_DELETE_BTN: 'Eliminar',
	AUTO_BACKUP_TITLE: 'Configuración de copia automática',
	AUTO_BACKUP_INTERVAL_LABEL: 'Intervalo de copia:',
	AUTO_BACKUP_MINUTES: 'minutos',
	AUTO_BACKUP_SAVE: 'Guardar configuración',
	AUTO_BACKUP_SAVED: 'Configuración de copia automática guardada',
	AUTO_BACKUP_PREFIX: 'auto_',
	MANUAL_BACKUP_TITLE: 'Copia manual',

	// Board Names
	BOARD_NONE: 'Ninguna',
	BOARD_UNO: 'Arduino Uno',
	BOARD_NANO: 'Arduino Nano',
	BOARD_MEGA: 'Arduino Mega',
	BOARD_ESP32: 'ESP32',
	BOARD_SUPERMINI: 'Super Mini',
	// Block Search UI
	FUNCTION_SEARCH_TITLE: 'Buscar Bloques',
	FUNCTION_SEARCH_BUTTON_TITLE: 'Buscar Bloques',
	FUNCTION_SEARCH_PLACEHOLDER: 'Introduzca nombre o parámetros del bloque...',
	FUNCTION_SEARCH_BTN: 'Buscar',
	FUNCTION_SEARCH_PREV: 'Anterior',
	FUNCTION_SEARCH_NEXT: 'Siguiente',
	FUNCTION_SEARCH_EMPTY: 'Aún no se ha buscado',
	FUNCTION_SEARCH_NO_RESULTS: 'No se encontraron bloques coincidentes',
	FUNCTION_RESULT_PREFIX: 'Bloque: ',
	FUNCTION_KEYBOARD_SHORTCUT_TIP: '(Atajo: Ctrl+F)',
	FUNCTION_SEARCH_HISTORY_TITLE: 'Historial de búsqueda',

	// Block Categories
	CATEGORY_LOGIC: 'Lógica',
	CATEGORY_LOOPS: 'Bucles',
	CATEGORY_MATH: 'Matemáticas',
	CATEGORY_TEXT: 'Texto',
	CATEGORY_LISTS: 'Listas',
	CATEGORY_VARIABLES: 'Variables',
	CATEGORY_FUNCTIONS: 'Funciones',
	CATEGORY_ARDUINO: 'Arduino',
	CATEGORY_SENSORS: 'Sensores',
	CATEGORY_MOTORS: 'Motores',
	VISION_SENSORS_CATEGORY: 'Sensores de Visión',
	// Servo Block Labels
	SERVO_SETUP: 'Configurar Motor Servo',
	SERVO_PIN: 'Pin',
	SERVO_SETUP_TOOLTIP: 'Declarar variable de motor servo y establecer pin',
	SERVO_MOVE: 'Girar Motor Servo',
	SERVO_ANGLE: 'Ángulo',
	SERVO_MOVE_TOOLTIP: 'Girar motor servo a un ángulo específico',
	SERVO_STOP: 'Detener Motor Servo',
	SERVO_STOP_TOOLTIP: 'Detener señal de salida del motor servo',

	// Arduino Block Labels
	ARDUINO_SETUP: 'Configuración',
	ARDUINO_LOOP: 'Bucle',
	ARDUINO_DIGITAL_WRITE: 'Escribir Digital',
	ARDUINO_DIGITAL_READ: 'Leer Digital',
	ARDUINO_ANALOG_WRITE: 'Escribir Analógico',
	ARDUINO_ANALOG_READ: 'Leer Analógico',
	ARDUINO_PIN: 'Pin',
	ARDUINO_VALUE: 'Valor',
	ARDUINO_DELAY: 'Retardo',
	ARDUINO_DELAY_MS: 'milisegundos',
	ARDUINO_PULLUP: 'Activar Resistencia Interna',
	ARDUINO_MODE: 'Modo',
	ARDUINO_MODE_INPUT: 'ENTRADA',
	ARDUINO_MODE_OUTPUT: 'SALIDA',

	// Sensor Block Labels
	ULTRASONIC_SENSOR: 'Sensor Ultrasónico',
	ULTRASONIC_TRIG_PIN: 'Pin Trig',
	ULTRASONIC_ECHO_PIN: 'Pin Echo',
	ULTRASONIC_USE_INTERRUPT: 'Usar Interrupción Hardware',
	ULTRASONIC_READ: 'Leer Distancia Ultrasónica (cm)',
	ULTRASONIC_TOOLTIP_SETUP: 'Configura el sensor ultrasónico con pines Trig y Echo. Interrupción hardware opcional para mayor precisión.',
	ULTRASONIC_TOOLTIP_READ: 'Lee la distancia medida por el sensor ultrasónico en centímetros.',
	ULTRASONIC_WARNING: 'El pin Echo {0} seleccionado no soporta interrupciones hardware. Por favor, elija uno de estos pines: {1}',

	// Threshold Function Block Labels
	THRESHOLD_PIN: 'en',
	THRESHOLD_VALUE: 'si >',
	THRESHOLD_HIGH_VALUE: '=',
	THRESHOLD_LOW_VALUE: 'sino',
	THRESHOLD_TOOLTIP_SETUP:
		'Configura una función de umbral. Cuando la entrada analógica excede el umbral, devuelve la primera salida, de lo contrario devuelve la segunda.',
	THRESHOLD_TOOLTIP_READ: 'Obtener el valor de la función de umbral',

	// Duration block
	DURATION_REPEAT: 'Repetir por',
	DURATION_TIME: 'tiempo',
	DURATION_MS: 'milisegundos',
	DURATION_DO: 'hacer',

	// Print block
	TEXT_PRINT_SHOW: 'imprimir',
	TEXT_PRINT_NEWLINE: 'nueva línea',

	// Pin Mode block
	PIN_MODE_SET: 'establecer',

	// Function Block Labels
	FUNCTION_CREATE: 'Crear Función',
	FUNCTION_NAME: 'Nombre',
	FUNCTION_PARAMS: 'Parámetros',
	FUNCTION_RETURN: 'Retorno',
	FUNCTION_CALL: 'Llamar',

	// Logic Block Labels
	LOGIC_IF: 'si',
	LOGIC_ELSE: 'sino',
	LOGIC_THEN: 'entonces',
	LOGIC_AND: 'y',
	LOGIC_OR: 'o',
	LOGIC_NOT: 'no',
	LOGIC_TRUE: 'verdadero',
	LOGIC_FALSE: 'falso',

	// Loop Block Labels
	LOOP_REPEAT: 'repetir',
	LOOP_WHILE: 'mientras',
	LOOP_UNTIL: 'hasta que',
	LOOP_FOR: 'para',
	LOOP_FOREACH: 'para cada',
	LOOP_BREAK: 'romper',
	LOOP_CONTINUE: 'continuar',

	// Math Block Labels
	MATH_NUMBER: 'número',
	MATH_ARITHMETIC: 'aritmética',
	MATH_OPERATIONS: 'operaciones',
	MATH_ADD: 'sumar',
	MATH_SUBTRACT: 'restar',
	MATH_MULTIPLY: 'multiplicar',
	MATH_DIVIDE: 'dividir',
	MATH_POWER: 'potencia',

	// Math Map Block
	MATH_MAP_VALUE: 'mapear',
	MATH_MAP_TOOLTIP:
		'Remapea un número de un rango a otro. Por ejemplo, map(valor, 0, 1023, 0, 255) escalará una entrada analógica a una salida PWM de 8 bits.',

	// VS Code UI Messages
	VSCODE_OPEN_FOLDER: 'Abrir Carpeta',
	VSCODE_PLEASE_OPEN_PROJECT: '¡Por favor, abra primero una carpeta de proyecto!',
	VSCODE_FAILED_SAVE_FILE: 'Error al guardar el archivo: {0}',
	VSCODE_FAILED_UPDATE_INI: 'Error al actualizar platformio.ini: {0}',
	VSCODE_UNABLE_SAVE_WORKSPACE: 'No se pudo guardar el estado del espacio de trabajo: {0}',
	VSCODE_FAILED_START: 'Error al iniciar Singular Blockly: {0}',
	VSCODE_CONFIRM_DELETE_VARIABLE: '¿Está seguro de que desea eliminar la variable "{0}"?',
	VSCODE_BOARD_UPDATED: 'Configuración de la placa actualizada a: {0}',
	VSCODE_RELOAD_REQUIRED: '，Por favor, recargue la ventana para completar la configuración',
	VSCODE_ENTER_VARIABLE_NAME: 'Introduzca el nombre de la nueva variable',
	VSCODE_ENTER_NEW_VARIABLE_NAME: 'Introduzca el nuevo nombre de la variable (actual: {0})',
	VSCODE_VARIABLE_NAME_EMPTY: 'El nombre de la variable no puede estar vacío',
	VSCODE_VARIABLE_NAME_INVALID:
		'El nombre de la variable solo puede contener letras, números y guiones bajos, y no puede comenzar con un número',
	VSCODE_RELOAD: 'Recargar',
	VSCODE_OK: 'Aceptar',
	VSCODE_CANCEL: 'Cancelar',
	VSCODE_OPEN_BLOCKLY_EDITOR: 'Abrir Editor Blockly',

	// Error Messages
	ERROR_BOARD_NOT_SELECTED: 'Por favor, seleccione una placa primero',
	ERROR_INVALID_PIN: 'Número de pin inválido',
	ERROR_INVALID_VALUE: 'Valor inválido',
	ERROR_MISSING_TRANSLATION: 'Traducción faltante',

	// Blockly core messages
	ADD: 'añadir',
	REMOVE: 'eliminar',
	RENAME: 'renombrar',
	NEW: 'nuevo',
	ADD_COMMENT: 'Añadir Comentario',
	REMOVE_COMMENT: 'Eliminar Comentario',
	DUPLICATE_BLOCK: 'Duplicar',
	HELP: 'Ayuda',
	UNDO: 'Deshacer',
	REDO: 'Rehacer',
	COLLAPSE_BLOCK: 'Colapsar Bloque',
	EXPAND_BLOCK: 'Expandir Bloque',
	DELETE_BLOCK: 'Eliminar Bloque',
	DELETE_X_BLOCKS: 'Eliminar %1 Bloques',
	DELETE_ALL_BLOCKS: '¿Eliminar todos los %1 bloques?',
	CLEAN_UP: 'Ordenar Bloques',
	COLLAPSE_ALL: 'Colapsar Bloques',
	EXPAND_ALL: 'Expandir Bloques',
	DISABLE_BLOCK: 'Deshabilitar Bloque',
	ENABLE_BLOCK: 'Habilitar Bloque',
	INLINE_INPUTS: 'Entradas en Línea',
	EXTERNAL_INPUTS: 'Entradas Externas',

	// Variable & Function messages
	RENAME_VARIABLE: 'Renombrar variable...',
	NEW_VARIABLE: 'Crear variable...',
	DELETE_VARIABLE: 'Eliminar variable %1',
	PROCEDURE_ALREADY_EXISTS: 'Ya existe un procedimiento con el nombre "%1".',

	// Logic block messages
	CONTROLS_IF_MSG_IF: 'si',
	CONTROLS_IF_MSG_THEN: 'entonces',
	CONTROLS_IF_MSG_ELSE: 'sino',
	CONTROLS_IF_MSG_ELSEIF: 'sino si',
	CONTROLS_IF_IF_TITLE_IF: 'si',
	CONTROLS_IF_ELSEIF_TITLE_ELSEIF: 'sino si',
	CONTROLS_IF_ELSE_TITLE_ELSE: 'sino',
	LOGIC_COMPARE_TOOLTIP_EQ: 'Retorna verdadero si ambas entradas son iguales.',
	LOGIC_COMPARE_TOOLTIP_NEQ: 'Retorna verdadero si ambas entradas no son iguales.',
	LOGIC_COMPARE_TOOLTIP_LT: 'Retorna verdadero si la primera entrada es menor que la segunda entrada.',
	LOGIC_COMPARE_TOOLTIP_LTE: 'Retorna verdadero si la primera entrada es menor o igual a la segunda entrada.',
	LOGIC_COMPARE_TOOLTIP_GT: 'Retorna verdadero si la primera entrada es mayor que la segunda entrada.',
	LOGIC_COMPARE_TOOLTIP_GTE: 'Retorna verdadero si la primera entrada es mayor o igual a la segunda entrada.',
	LOGIC_OPERATION_AND: 'y',
	LOGIC_OPERATION_OR: 'o',
	LOGIC_NEGATE_TITLE: 'no %1',
	LOGIC_BOOLEAN_TRUE: 'verdadero',
	LOGIC_BOOLEAN_FALSE: 'falso',
	LOGIC_NULL: 'nulo',

	// Additional Logic Block Messages
	LOGIC_COMPARE_HELPURL: 'https://es.wikipedia.org/wiki/Desigualdad_(matemáticas)',
	LOGIC_NEGATE_HELPURL: 'https://github.com/google/blockly/wiki/Logic#not',
	LOGIC_NEGATE_TOOLTIP: 'Retorna verdadero si la entrada es falsa. Retorna falso si la entrada es verdadera.',
	LOGIC_OPERATION_TOOLTIP_AND: 'Retorna verdadero si ambas entradas son verdaderas.',
	LOGIC_OPERATION_TOOLTIP_OR: 'Retorna verdadero si al menos una de las entradas es verdadera.',
	LOGIC_BOOLEAN_TOOLTIP: 'Retorna verdadero o falso.',

	// Loop block messages
	CONTROLS_REPEAT_TITLE: 'repetir %1 veces',
	CONTROLS_WHILEUNTIL_OPERATOR_WHILE: 'repetir mientras',
	CONTROLS_WHILEUNTIL_OPERATOR_UNTIL: 'repetir hasta que',
	CONTROLS_FOR_TITLE: 'contar con %1 desde %2 hasta %3 de %4 en %4',
	CONTROLS_FLOW_STATEMENTS_OPERATOR_BREAK: 'salir del bucle',
	CONTROLS_FLOW_STATEMENTS_OPERATOR_CONTINUE: 'continuar con la siguiente iteración',
	CONTROLS_REPEAT_TOOLTIP: 'Repite algunas instrucciones varias veces.',
	CONTROLS_WHILEUNTIL_TOOLTIP_WHILE: 'Mientras un valor sea verdadero, ejecuta algunas instrucciones.',
	CONTROLS_WHILEUNTIL_TOOLTIP_UNTIL: 'Mientras un valor sea falso, ejecuta algunas instrucciones.',
	CONTROLS_FOR_TOOLTIP: 'Cuenta desde el número inicial hasta el número final con el intervalo especificado.',
	CONTROLS_FLOW_STATEMENTS_WARNING: 'Advertencia: Este bloque solo puede ser usado dentro de un bucle.',

	// Math block messages
	MATH_NUMBER_HELPURL: 'https://es.wikipedia.org/wiki/Número',
	MATH_NUMBER_TOOLTIP: 'Un número.',
	MATH_ARITHMETIC_OPERATOR_ADD: '+',
	MATH_ARITHMETIC_OPERATOR_MINUS: '-',
	MATH_ARITHMETIC_OPERATOR_MULTIPLY: '×',
	MATH_ARITHMETIC_OPERATOR_DIVIDE: '÷',
	MATH_ARITHMETIC_OPERATOR_POWER: '^',
	MATH_SINGLE_OPERATOR_ROOT: 'raíz cuadrada',
	MATH_SINGLE_OPERATOR_ABSOLUTE: 'valor absoluto',
	MATH_IS_EVEN: 'es par',
	MATH_IS_ODD: 'es impar',
	MATH_IS_PRIME: 'es primo',
	MATH_IS_WHOLE: 'es entero',
	MATH_IS_POSITIVE: 'es positivo',
	MATH_IS_NEGATIVE: 'es negativo',
	MATH_ARITHMETIC_HELPURL: 'https://es.wikipedia.org/wiki/Aritmética',
	MATH_ARITHMETIC_TOOLTIP_ADD: 'Retorna la suma de los dos números.',
	MATH_ARITHMETIC_TOOLTIP_MINUS: 'Retorna la diferencia de los dos números.',
	MATH_ARITHMETIC_TOOLTIP_MULTIPLY: 'Retorna el producto de los dos números.',
	MATH_ARITHMETIC_TOOLTIP_DIVIDE: 'Retorna el cociente de los dos números.',
	MATH_ARITHMETIC_TOOLTIP_POWER: 'Retorna el primer número elevado a la potencia del segundo número.',

	// Text block messages
	TEXT_JOIN_TITLE_CREATEWITH: 'crear texto con',
	TEXT_CREATE_JOIN_TITLE_JOIN: 'unir',
	TEXT_LENGTH_TITLE: 'longitud de %1',
	TEXT_ISEMPTY_TITLE: '%1 está vacío',
	TEXT_INDEXOF_OPERATOR_FIRST: 'encontrar primera aparición del texto',
	TEXT_INDEXOF_OPERATOR_LAST: 'encontrar última aparición del texto',
	TEXT_CHARAT_FROM_START: 'obtener letra #',
	TEXT_CHARAT_FROM_END: 'obtener letra # desde el final',
	TEXT_CHARAT_FIRST: 'obtener primera letra',
	TEXT_CHARAT_LAST: 'obtener última letra',
	TEXT_CHARAT_RANDOM: 'obtener letra aleatoria',
	TEXT_JOIN_TOOLTIP: 'Crea un fragmento de texto uniendo cualquier número de elementos.',
	TEXT_APPEND_VARIABLE: 'elemento',
	TEXT_APPEND_TOOLTIP: 'Añade texto a la variable "%1".',
	TEXT_LENGTH_TOOLTIP: 'Retorna el número de letras (incluyendo espacios) en el texto proporcionado.',
	TEXT_ISEMPTY_TOOLTIP: 'Retorna verdadero si el texto proporcionado está vacío.',

	// List block messages
	LISTS_CREATE_EMPTY_TITLE: 'crear lista vacía',
	LISTS_CREATE_WITH_INPUT_WITH: 'crear lista con',
	LISTS_LENGTH_TITLE: 'longitud de %1',
	LISTS_ISEMPTY_TITLE: '%1 está vacía',
	LISTS_INDEXOF_FIRST: 'encontrar primera aparición del elemento',
	LISTS_INDEXOF_LAST: 'encontrar última aparición del elemento',
	LISTS_GET_INDEX_GET: 'obtener',
	LISTS_GET_INDEX_REMOVE: 'eliminar',
	LISTS_GET_INDEX_FROM_START: '#',
	LISTS_GET_INDEX_FROM_END: '# desde el final',
	LISTS_GET_INDEX_FIRST: 'primero',
	LISTS_GET_INDEX_LAST: 'último',
	LISTS_GET_INDEX_RANDOM: 'aleatorio',
	LISTS_CREATE_WITH_TOOLTIP: 'Crea una lista con cualquier número de elementos.',
	LISTS_CREATE_EMPTY_TOOLTIP: 'Retorna una lista de longitud 0, que no contiene registros de datos',
	LISTS_LENGTH_TOOLTIP: 'Retorna la longitud de una lista.',
	LISTS_ISEMPTY_TOOLTIP: 'Retorna verdadero si la lista está vacía.',

	// Variables
	VARIABLES_SET: 'establecer %1 a %2',
	VARIABLES_GET: '%1',
	VARIABLES_DEFAULT_NAME: 'elemento',

	// If conditions
	CONTROLS_IF_TOOLTIP_1: 'Si un valor es verdadero, entonces ejecuta algunas instrucciones.',
	CONTROLS_IF_TOOLTIP_2:
		'Si un valor es verdadero, entonces ejecuta el primer bloque de instrucciones. De lo contrario, ejecuta el segundo bloque de instrucciones.',
	CONTROLS_IF_TOOLTIP_3:
		'Si el primer valor es verdadero, entonces ejecuta el primer bloque de instrucciones. De lo contrario, si el segundo valor es verdadero, ejecuta el segundo bloque de instrucciones.',
	CONTROLS_IF_TOOLTIP_4:
		'Si el primer valor es verdadero, entonces ejecuta el primer bloque de instrucciones. De lo contrario, si el segundo valor es verdadero, ejecuta el segundo bloque de instrucciones. Si ninguno de los valores es verdadero, ejecuta el último bloque de instrucciones.',

	// Procedures
	PROCEDURES_DEFNORETURN_TITLE: '',
	PROCEDURES_DEFNORETURN_PROCEDURE: 'hacer algo',
	PROCEDURES_BEFORE_PARAMS: 'con:',
	PROCEDURES_CALL_BEFORE_PARAMS: 'con:',
	PROCEDURES_DEFNORETURN_DO: '',
	PROCEDURES_DEFNORETURN_TOOLTIP: 'Crea una función sin salida.',
	PROCEDURES_DEFRETURN_RETURN: 'retornar',
	PROCEDURES_DEFRETURN_TOOLTIP: 'Crea una función con una salida.',
	PROCEDURES_DEFRETURN_COMMENT: 'Describe esta función...',
	PROCEDURES_DEFRETURN_PROCEDURE: 'hacer algo con retorno',
	PROCEDURES_DEFRETURN_DO: '',
	PROCEDURES_CALLNORETURN_HELPURL: 'https://es.wikipedia.org/wiki/Subrutina',
	PROCEDURES_CALLNORETURN_TOOLTIP: 'Ejecuta la función definida por el usuario.',
	PROCEDURES_CALLRETURN_HELPURL: 'https://es.wikipedia.org/wiki/Subrutina',
	PROCEDURES_CALLRETURN_TOOLTIP: 'Ejecuta la función definida por el usuario y usa su salida.',

	// Seven Segment Display
	SEVEN_SEGMENT_DISPLAY: 'Pantalla de Siete Segmentos',
	SEVEN_SEGMENT_COMMON_CATHODE: 'Cátodo Común',
	SEVEN_SEGMENT_COMMON_ANODE: 'Ánodo Común',
	SEVEN_SEGMENT_NUMBER: 'Número (0-9):',
	SEVEN_SEGMENT_DECIMAL_POINT: 'Punto Decimal',
	SEVEN_SEGMENT_TOOLTIP: 'Muestra un número (0-9) en una pantalla de siete segmentos con punto decimal opcional.',
	// Seven Segment Display Pins
	SEVEN_SEGMENT_PINS_SET: 'Configurar pines de pantalla de siete segmentos',
	SEVEN_SEGMENT_PINS_TOOLTIP: 'Configura pines para cada segmento (A-G) y punto decimal (DP) de la pantalla de siete segmentos.',

	// Pixetto Smart Camera
	PIXETTO_INIT: 'Inicializar Cámara Inteligente Pixetto',
	PIXETTO_RX_PIN: 'Pin RX',
	PIXETTO_TX_PIN: 'Pin TX',
	PIXETTO_IS_DETECTED: 'Pixetto Objeto Detectado',
	PIXETTO_GET_TYPE_ID: 'Pixetto Obtener ID de Tipo',
	PIXETTO_GET_FUNC_ID: 'Pixetto Obtener ID de Función',
	PIXETTO_COLOR_DETECT: 'Pixetto Detectar Color',
	PIXETTO_SHAPE_DETECT: 'Pixetto Detectar Forma',
	PIXETTO_FACE_DETECT: 'Pixetto Detectar Rostro',
	PIXETTO_APRILTAG_DETECT: 'Pixetto Detectar AprilTag',
	PIXETTO_NEURAL_NETWORK: 'Pixetto Reconocimiento de Red Neuronal',
	PIXETTO_HANDWRITTEN_DIGIT: 'Pixetto Reconocer Dígito Manuscrito',
	PIXETTO_GET_POSITION: 'Pixetto Obtener Objeto Detectado',
	PIXETTO_ROAD_DETECT: 'Pixetto Detección de Carretera',
	PIXETTO_SET_MODE: 'Configurar Modo de Función Pixetto',
	PIXETTO_COLOR: 'Color',
	PIXETTO_SHAPE: 'Forma',
	PIXETTO_MODE: 'Modo',
	PIXETTO_TAG_ID: 'ID de Etiqueta',
	PIXETTO_CLASS_ID: 'ID de Clase',
	PIXETTO_DIGIT: 'Dígito',
	PIXETTO_COORDINATE: 'Coordenada',
	PIXETTO_ROAD_INFO: 'Información',
	// Vision Sensors Category Labels
	PIXETTO_LABEL: 'Pixetto',
	HUSKYLENS_LABEL: 'HUSKYLENS',

	// Pixetto Tooltips
	PIXETTO_INIT_TOOLTIP: 'Inicializar la cámara inteligente Pixetto y configurar los pines de comunicación UART',
	PIXETTO_IS_DETECTED_TOOLTIP: 'Detectar si Pixetto detecta algún objeto',
	PIXETTO_GET_TYPE_ID_TOOLTIP: 'Obtener el ID del tipo de objeto detectado por Pixetto (color, forma, etc.)',
	PIXETTO_GET_FUNC_ID_TOOLTIP: 'Obtener el ID de la función actualmente utilizada por Pixetto (detección de color, forma, etc.)',
	PIXETTO_COLOR_DETECT_TOOLTIP: 'Detectar si Pixetto detecta un objeto del color especificado',
	PIXETTO_SHAPE_DETECT_TOOLTIP: 'Detectar si Pixetto detecta un objeto de la forma especificada',
	PIXETTO_FACE_DETECT_TOOLTIP: 'Detectar si Pixetto detecta una cara',
	PIXETTO_APRILTAG_DETECT_TOOLTIP: 'Detectar si Pixetto detecta un AprilTag con el ID especificado',
	PIXETTO_NEURAL_NETWORK_TOOLTIP: 'Detectar si la red neuronal de Pixetto reconoce un objeto de la clase especificada',
	PIXETTO_HANDWRITTEN_DIGIT_TOOLTIP: 'Detectar si Pixetto reconoce un dígito manuscrito especificado',
	PIXETTO_GET_POSITION_TOOLTIP: 'Obtener información de posición o tamaño del objeto detectado por Pixetto',
	PIXETTO_ROAD_DETECT_TOOLTIP: 'Obtener información relacionada con la detección de carreteras de Pixetto',
	PIXETTO_SET_MODE_TOOLTIP: 'Configurar el modo funcional de la cámara inteligente Pixetto',

	// Pixetto Color Options
	PIXETTO_COLOR_RED: 'Rojo',
	PIXETTO_COLOR_BLUE: 'Azul',
	PIXETTO_COLOR_GREEN: 'Verde',
	PIXETTO_COLOR_YELLOW: 'Amarillo',
	PIXETTO_COLOR_ORANGE: 'Naranja',
	PIXETTO_COLOR_PURPLE: 'Púrpura',
	PIXETTO_COLOR_BLACK: 'Negro',
	PIXETTO_COLOR_WHITE: 'Blanco',

	// Pixetto Shape Options
	PIXETTO_SHAPE_TRIANGLE: 'Triángulo',
	PIXETTO_SHAPE_RECTANGLE: 'Rectángulo',
	PIXETTO_SHAPE_PENTAGON: 'Pentágono',
	PIXETTO_SHAPE_HEXAGON: 'Hexágono',
	PIXETTO_SHAPE_CIRCLE: 'Círculo',

	// Pixetto Position Options
	PIXETTO_POSITION_X: 'Coordenada X',
	PIXETTO_POSITION_Y: 'Coordenada Y',
	PIXETTO_POSITION_WIDTH: 'Ancho',
	PIXETTO_POSITION_HEIGHT: 'Alto',

	// Pixetto Road Info Options
	PIXETTO_ROAD_CENTER_X: 'Centro X',
	PIXETTO_ROAD_CENTER_Y: 'Centro Y',
	PIXETTO_ROAD_LEFT_X: 'Límite Izquierdo X',
	PIXETTO_ROAD_RIGHT_X: 'Límite Derecho X',

	// Pixetto Mode Options
	PIXETTO_MODE_COLOR_DETECTION: 'Detección de Color',
	PIXETTO_MODE_SHAPE_DETECTION: 'Detección de Forma',
	PIXETTO_MODE_FACE_DETECTION: 'Detección de Cara',
	PIXETTO_MODE_APRILTAG_DETECTION: 'Detección de AprilTag',
	PIXETTO_MODE_NEURAL_NETWORK: 'Red Neuronal',
	PIXETTO_MODE_HANDWRITTEN_DIGIT: 'Dígito Manuscrito',
	PIXETTO_MODE_ROAD_DETECTION: 'Detección de Carretera',
	PIXETTO_MODE_BALL_DETECTION: 'Detección de Pelota',
	PIXETTO_MODE_TEMPLATE_MATCHING: 'Coincidencia de Plantilla',

	// HUSKYLENS Smart Camera
	HUSKYLENS_INIT_I2C: 'Inicializar HUSKYLENS (I2C)',
	HUSKYLENS_INIT_UART: 'Inicializar HUSKYLENS (UART)',
	HUSKYLENS_RX_PIN: 'Pin RX',
	HUSKYLENS_TX_PIN: 'Pin TX',
	HUSKYLENS_SET_ALGORITHM: 'Configurar Algoritmo HUSKYLENS',
	HUSKYLENS_ALGORITHM_FACE_RECOGNITION: 'Reconocimiento Facial',
	HUSKYLENS_ALGORITHM_OBJECT_TRACKING: 'Seguimiento de Objeto',
	HUSKYLENS_ALGORITHM_OBJECT_RECOGNITION: 'Reconocimiento de Objeto',
	HUSKYLENS_ALGORITHM_LINE_TRACKING: 'Seguimiento de Línea',
	HUSKYLENS_ALGORITHM_COLOR_RECOGNITION: 'Reconocimiento de Color',
	HUSKYLENS_ALGORITHM_TAG_RECOGNITION: 'Reconocimiento de Etiqueta',
	HUSKYLENS_ALGORITHM_OBJECT_CLASSIFICATION: 'Clasificación de Objeto',
	HUSKYLENS_REQUEST: 'Solicitar Datos HUSKYLENS',
	HUSKYLENS_IS_LEARNED: 'HUSKYLENS Ha Aprendido',
	HUSKYLENS_COUNT_BLOCKS: 'Número de Bloques HUSKYLENS',
	HUSKYLENS_COUNT_ARROWS: 'Número de Flechas HUSKYLENS',
	HUSKYLENS_GET_BLOCK_INFO: 'Obtener Bloque',
	HUSKYLENS_GET_ARROW_INFO: 'Obtener Flecha',
	HUSKYLENS_BLOCK_INFO_TYPE: ' ',
	HUSKYLENS_ARROW_INFO_TYPE: ' ',
	HUSKYLENS_X_CENTER: 'Centro X',
	HUSKYLENS_Y_CENTER: 'Centro Y',
	HUSKYLENS_WIDTH: 'Ancho',
	HUSKYLENS_HEIGHT: 'Alto',
	HUSKYLENS_ID: 'ID',
	HUSKYLENS_X_ORIGIN: 'Origen X',
	HUSKYLENS_Y_ORIGIN: 'Origen Y',
	HUSKYLENS_X_TARGET: 'Destino X',
	HUSKYLENS_Y_TARGET: 'Destino Y',
	HUSKYLENS_LEARN: 'HUSKYLENS Aprender ID',
	HUSKYLENS_FORGET: 'HUSKYLENS Olvidar Todo',

	// HUSKYLENS Tooltips
	HUSKYLENS_INIT_I2C_TOOLTIP: 'Inicializar cámara inteligente HUSKYLENS usando I2C',
	HUSKYLENS_INIT_UART_TOOLTIP: 'Inicializar cámara inteligente HUSKYLENS usando UART, configurar pines RX/TX',
	HUSKYLENS_SET_ALGORITHM_TOOLTIP: 'Configurar el algoritmo de reconocimiento usado por HUSKYLENS',
	HUSKYLENS_REQUEST_TOOLTIP: 'Solicitar los últimos resultados de reconocimiento de HUSKYLENS',
	HUSKYLENS_IS_LEARNED_TOOLTIP: 'Verificar si HUSKYLENS ha aprendido algo',
	HUSKYLENS_COUNT_BLOCKS_TOOLTIP: 'Obtener el número de bloques detectados por HUSKYLENS',
	HUSKYLENS_COUNT_ARROWS_TOOLTIP: 'Obtener el número de flechas detectadas por HUSKYLENS',
	HUSKYLENS_GET_BLOCK_INFO_TOOLTIP: 'Obtener información del bloque especificado (posición, tamaño o ID)',
	HUSKYLENS_GET_ARROW_INFO_TOOLTIP: 'Obtener información de la flecha especificada (origen, destino o ID)',
	HUSKYLENS_LEARN_TOOLTIP: 'Hacer que HUSKYLENS aprenda el objeto con ID especificado (solo modo clasificación de objeto)',
	HUSKYLENS_FORGET_TOOLTIP: 'Borrar todos los objetos aprendidos por HUSKYLENS (solo modo clasificación de objeto)',
});
