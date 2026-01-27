/**
 * @license
 * Copyright 2025 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file contains translations derived from Blockly project
 * Copyright 2012 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

// Define translations for Brazilian Portuguese
window.languageManager.loadMessages('pt-br', {
	// UI Elements
	BLOCKS_TAB: 'Blocos',
	CODE_TAB: 'Código',
	BOARD_SELECT_LABEL: 'Selecionar placa:',
	LANGUAGE_SELECT_TOOLTIP: 'Selecionar idioma',
	LANGUAGE_AUTO: 'Automático (seguir o VS Code)',

	// Experimental Blocks Notice
	EXPERIMENTAL_BLOCKS_TITLE: 'Blocos experimentais detectados',
	EXPERIMENTAL_BLOCKS_DESC:
		'Seu espaço de trabalho contém blocos experimentais (destacados com bordas amarelas tracejadas). Esses recursos podem ser alterados ou removidos em atualizações futuras, use com cautela.',

	// Preview Mode UI
	PREVIEW_BADGE: 'Pré-visualização',
	THEME_TOGGLE: 'Alternar tema',
	PREVIEW_WINDOW_TITLE: 'Pré-visualização Blockly - {0}',
	PREVIEW_WINDOW_TITLE_WITH_NAME: 'Pré-visualização - {0}',

	// Backup Modal UI
	BACKUP_MANAGER_TITLE: 'Gerenciador de backup',
	BACKUP_CREATE_NEW: 'Criar novo backup',
	BACKUP_NAME_LABEL: 'Nome do backup:',
	BACKUP_NAME_PLACEHOLDER: 'Digite o nome do backup',
	BACKUP_CONFIRM: 'Confirmar',
	BACKUP_CANCEL: 'Cancelar',
	BACKUP_LIST_TITLE: 'Lista de backups',
	BACKUP_LIST_EMPTY: 'Nenhum backup disponível',
	BACKUP_BUTTON_TITLE: 'Gerenciador de backup',
	REFRESH_BUTTON_TITLE: 'Atualizar código',
	BACKUP_PREVIEW_BTN: 'Visualizar',
	BACKUP_RESTORE_BTN: 'Restaurar',
	BACKUP_DELETE_BTN: 'Excluir',
	AUTO_BACKUP_TITLE: 'Configurações de backup automático',
	AUTO_BACKUP_INTERVAL_LABEL: 'Intervalo de backup:',
	AUTO_BACKUP_MINUTES: 'minutos',
	AUTO_BACKUP_SAVE: 'Salvar configurações',
	AUTO_BACKUP_SAVED: 'Configurações de backup automático salvas',
	AUTO_BACKUP_PREFIX: 'auto_',
	MANUAL_BACKUP_TITLE: 'Backup manual',

	// Board Names
	BOARD_NONE: 'Nenhuma',
	BOARD_UNO: 'Arduino Uno',
	BOARD_NANO: 'Arduino Nano',
	BOARD_MEGA: 'Arduino Mega',
	BOARD_ESP32: 'ESP32',
	BOARD_SUPERMINI: 'Super Mini',
	// Block Search UI
	FUNCTION_SEARCH_TITLE: 'Pesquisar Blocos',
	FUNCTION_SEARCH_BUTTON_TITLE: 'Pesquisar Blocos',
	FUNCTION_SEARCH_PLACEHOLDER: 'Digite o nome ou parâmetros do bloco...',
	FUNCTION_SEARCH_BTN: 'Pesquisar',
	FUNCTION_SEARCH_PREV: 'Anterior',
	FUNCTION_SEARCH_NEXT: 'Próximo',
	FUNCTION_SEARCH_EMPTY: 'Ainda não pesquisado',
	FUNCTION_SEARCH_NO_RESULTS: 'Nenhum bloco correspondente encontrado',
	FUNCTION_RESULT_PREFIX: 'Bloco: ',
	FUNCTION_KEYBOARD_SHORTCUT_TIP: '(Atalho: Ctrl+F)',
	FUNCTION_SEARCH_HISTORY_TITLE: 'Histórico de pesquisa',

	// Block Categories
	CATEGORY_LOGIC: 'Lógica',
	CATEGORY_LOOPS: 'Loops',
	CATEGORY_MATH: 'Matemática',
	CATEGORY_TEXT: 'Texto',
	CATEGORY_LISTS: 'Listas',
	CATEGORY_VARIABLES: 'Variáveis',
	CATEGORY_FUNCTIONS: 'Funções',
	CATEGORY_ARDUINO: 'Arduino',
	CATEGORY_SENSORS: 'Sensores',
	CATEGORY_MOTORS: 'Motores',
	VISION_SENSORS_CATEGORY: 'Sensores de Visão',
	// Servo Block Labels
	SERVO_SETUP: 'Configurar Motor Servo',
	SERVO_PIN: 'Pino',
	SERVO_SETUP_TOOLTIP: 'Declarar variável de motor servo e definir pino',
	SERVO_MOVE: 'Girar Motor Servo',
	SERVO_ANGLE: 'Ângulo',
	SERVO_MOVE_TOOLTIP: 'Girar motor servo para um ângulo específico',
	SERVO_STOP: 'Parar Motor Servo',
	SERVO_STOP_TOOLTIP: 'Interromper sinal de saída do motor servo',

	// Encoder Motor Control
	ENCODER_SETUP: 'Configurar Motor Encoder',
	ENCODER_NAME: 'Nome',
	ENCODER_PIN_A: 'Pino A',
	ENCODER_PIN_B: 'Pino B',
	ENCODER_USE_INTERRUPT: 'Usar Interrupção',
	ENCODER_SETUP_TOOLTIP: 'Configurar motor encoder com configurações de nome e pinos',
	ENCODER_READ: 'Ler Encoder',
	ENCODER_READ_TOOLTIP: 'Obter posição atual do encoder',
	ENCODER_RESET: 'Resetar Encoder',
	ENCODER_RESET_TOOLTIP: 'Resetar posição do encoder para zero',
	ENCODER_PID_SETUP: 'Configurar Controle PID',
	ENCODER_PID_MOTOR: 'Motor',
	ENCODER_PID_KP: 'Kp',
	ENCODER_PID_KI: 'Ki',
	ENCODER_PID_KD: 'Kd',
	ENCODER_PID_MODE: 'Modo',
	ENCODER_PID_MODE_POSITION: 'Posição',
	ENCODER_PID_MODE_SPEED: 'Velocidade',
	ENCODER_PID_SETUP_TOOLTIP: 'Configurar controle PID para controle preciso do motor. Selecione modo de posição ou velocidade.',
	ENCODER_PID_COMPUTE: 'Calcular PID',
	ENCODER_PID_TARGET: 'Alvo',
	ENCODER_PID_COMPUTE_TOOLTIP: 'Calcular saída de controle PID baseado na posição alvo',
	ENCODER_PID_RESET: 'Reiniciar PID',
	ENCODER_PID_RESET_TOOLTIP: 'Reiniciar o estado do controlador PID (limpar acumulação integral, reiniciar contador)',

	// Arduino Block Labels
	ARDUINO_SETUP: 'Configuração',
	ARDUINO_LOOP: 'Loop',
	ARDUINO_DIGITAL_WRITE: 'Escrita Digital',
	ARDUINO_DIGITAL_READ: 'Leitura Digital',
	ARDUINO_ANALOG_WRITE: 'Escrita Analógica',
	ARDUINO_ANALOG_READ: 'Leitura Analógica',
	ARDUINO_PIN: 'Pino',
	ARDUINO_VALUE: 'Valor',
	ARDUINO_DELAY: 'Atraso',
	ARDUINO_DELAY_MS: 'milissegundos',
	ARDUINO_PULLUP: 'Ativar Resistor Interno',
	ARDUINO_MODE: 'Modo',
	ARDUINO_MODE_INPUT: 'ENTRADA',
	ARDUINO_MODE_OUTPUT: 'SAÍDA',

	// Sensor Block Labels
	ULTRASONIC_SENSOR: 'Sensor Ultrassônico',
	ULTRASONIC_TRIG_PIN: 'Pino Trig',
	ULTRASONIC_ECHO_PIN: 'Pino Echo',
	ULTRASONIC_USE_INTERRUPT: 'Usar Interrupção de Hardware',
	ULTRASONIC_READ: 'Ler Distância Ultrassônica (cm)',
	ULTRASONIC_TOOLTIP_SETUP:
		'Configura o sensor ultrassônico com os pinos Trig e Echo. Interrupção de hardware opcional para maior precisão.',
	ULTRASONIC_TOOLTIP_READ: 'Lê a distância medida pelo sensor ultrassônico em centímetros.',
	ULTRASONIC_WARNING: 'O pino Echo {0} selecionado não suporta interrupções de hardware. Por favor, escolha um destes pinos: {1}',

	// Duration block
	DURATION_REPEAT: 'Repetir por',
	DURATION_TIME: 'tempo',
	DURATION_MS: 'milissegundos',
	DURATION_DO: 'faça',

	// Print block
	TEXT_PRINT_SHOW: 'imprimir',
	TEXT_PRINT_NEWLINE: 'nova linha',

	// Pin Mode block
	PIN_MODE_SET: 'definir',

	// Function Block Labels
	FUNCTION_CREATE: 'Criar Função',
	FUNCTION_NAME: 'Nome',
	FUNCTION_PARAMS: 'Parâmetros',
	FUNCTION_RETURN: 'Retornar',
	FUNCTION_CALL: 'Chamar',

	// Logic Block Labels
	LOGIC_IF: 'se',
	LOGIC_ELSE: 'senão',
	LOGIC_THEN: 'então',
	LOGIC_AND: 'e',
	LOGIC_OR: 'ou',
	LOGIC_NOT: 'não',
	LOGIC_TRUE: 'verdadeiro',
	LOGIC_FALSE: 'falso',

	// Loop Block Labels
	LOOP_REPEAT: 'repetir',
	LOOP_WHILE: 'enquanto',
	LOOP_UNTIL: 'até',
	LOOP_FOR: 'para',
	LOOP_FOREACH: 'para cada',
	LOOP_BREAK: 'interromper',
	LOOP_CONTINUE: 'continuar',

	// Threshold Function Block Labels
	THRESHOLD_PIN: 'em',
	THRESHOLD_VALUE: 'se >',
	THRESHOLD_HIGH_VALUE: '=',
	THRESHOLD_LOW_VALUE: 'senão',
	THRESHOLD_TOOLTIP_SETUP:
		'Configura uma função de limiar. Quando a entrada analógica excede o limiar, retorna a primeira saída, caso contrário, retorna a segunda saída.',
	THRESHOLD_TOOLTIP_READ: 'Obter o valor da função de limiar',

	// Math Block Labels
	MATH_NUMBER: 'número',
	MATH_ARITHMETIC: 'aritmética',
	MATH_OPERATIONS: 'operações',
	MATH_ADD: 'adicionar',
	MATH_SUBTRACT: 'subtrair',
	MATH_MULTIPLY: 'multiplicar',
	MATH_DIVIDE: 'dividir',
	MATH_POWER: 'potência',

	// Math Map Block
	MATH_MAP_VALUE: 'mapear',
	MATH_MAP_TOOLTIP:
		'Remapeia um número de um intervalo para outro. Por exemplo, map(valor, 0, 1023, 0, 255) escalonará uma entrada analógica para uma saída PWM de 8 bits.',

	// VS Code UI Messages
	VSCODE_OPEN_FOLDER: 'Abrir Pasta',
	VSCODE_PLEASE_OPEN_PROJECT: 'Por favor, abra primeiro uma pasta de projeto!',
	VSCODE_FAILED_SAVE_FILE: 'Falha ao salvar o arquivo: {0}',
	VSCODE_FAILED_UPDATE_INI: 'Falha ao atualizar platformio.ini: {0}',
	VSCODE_UNABLE_SAVE_WORKSPACE: 'Não foi possível salvar o estado do espaço de trabalho: {0}',
	VSCODE_FAILED_START: 'Falha ao iniciar o Singular Blockly: {0}',
	VSCODE_CONFIRM_DELETE_VARIABLE: 'Tem certeza que deseja excluir a variável "{0}"?',
	VSCODE_BOARD_UPDATED: 'Configuração da placa atualizada para: {0}',
	VSCODE_RELOAD_REQUIRED: '，Por favor, recarregue a janela para completar a configuração',
	VSCODE_ENTER_VARIABLE_NAME: 'Digite o nome da nova variável',
	VSCODE_ENTER_NEW_VARIABLE_NAME: 'Digite o novo nome da variável (atual: {0})',
	VSCODE_VARIABLE_NAME_EMPTY: 'O nome da variável não pode estar vazio',
	VSCODE_VARIABLE_NAME_INVALID: 'O nome da variável só pode conter letras, números e sublinhados, e não pode começar com um número',
	VSCODE_RELOAD: 'Recarregar',
	VSCODE_OK: 'OK',
	VSCODE_CANCEL: 'Cancelar',
	VSCODE_OPEN_BLOCKLY_EDITOR: 'Abrir Editor Blockly',

	// Error Messages
	ERROR_BOARD_NOT_SELECTED: 'Por favor, selecione uma placa primeiro',
	ERROR_INVALID_PIN: 'Número de pino inválido',
	ERROR_INVALID_VALUE: 'Valor inválido',
	ERROR_MISSING_TRANSLATION: 'Tradução ausente',

	// Blockly core messages
	ADD: 'adicionar',
	REMOVE: 'remover',
	RENAME: 'renomear',
	NEW: 'novo',
	ADD_COMMENT: 'Adicionar Comentário',
	REMOVE_COMMENT: 'Remover Comentário',
	DUPLICATE_BLOCK: 'Duplicar',
	HELP: 'Ajuda',
	UNDO: 'Desfazer',
	REDO: 'Refazer',
	COLLAPSE_BLOCK: 'Recolher Bloco',
	EXPAND_BLOCK: 'Expandir Bloco',
	DELETE_BLOCK: 'Excluir Bloco',
	DELETE_X_BLOCKS: 'Excluir %1 Blocos',
	DELETE_ALL_BLOCKS: 'Excluir todos os %1 blocos?',
	CLEAN_UP: 'Organizar Blocos',
	COLLAPSE_ALL: 'Recolher Blocos',
	EXPAND_ALL: 'Expandir Blocos',
	DISABLE_BLOCK: 'Desabilitar Bloco',
	ENABLE_BLOCK: 'Habilitar Bloco',
	INLINE_INPUTS: 'Entradas Inline',
	EXTERNAL_INPUTS: 'Entradas Externas',

	// Variable & Function messages
	RENAME_VARIABLE: 'Renomear variável...',
	NEW_VARIABLE: 'Criar variável...',
	DELETE_VARIABLE: 'Excluir variável %1',
	PROCEDURE_ALREADY_EXISTS: 'Um procedimento chamado "%1" já existe.',

	// Logic block messages
	CONTROLS_IF_MSG_IF: 'se',
	CONTROLS_IF_MSG_THEN: 'então',
	CONTROLS_IF_MSG_ELSE: 'senão',
	CONTROLS_IF_MSG_ELSEIF: 'senão se',
	CONTROLS_IF_IF_TITLE_IF: 'se',
	CONTROLS_IF_ELSEIF_TITLE_ELSEIF: 'senão se',
	CONTROLS_IF_ELSE_TITLE_ELSE: 'senão',
	LOGIC_COMPARE_TOOLTIP_EQ: 'Retorna verdadeiro se ambas as entradas forem iguais.',
	LOGIC_COMPARE_TOOLTIP_NEQ: 'Retorna verdadeiro se ambas as entradas não forem iguais.',
	LOGIC_COMPARE_TOOLTIP_LT: 'Retorna verdadeiro se a primeira entrada for menor que a segunda.',
	LOGIC_COMPARE_TOOLTIP_LTE: 'Retorna verdadeiro se a primeira entrada for menor ou igual à segunda.',
	LOGIC_COMPARE_TOOLTIP_GT: 'Retorna verdadeiro se a primeira entrada for maior que a segunda.',
	LOGIC_COMPARE_TOOLTIP_GTE: 'Retorna verdadeiro se a primeira entrada for maior ou igual à segunda.',
	LOGIC_OPERATION_AND: 'e',
	LOGIC_OPERATION_OR: 'ou',
	LOGIC_NEGATE_TITLE: 'não %1',
	LOGIC_BOOLEAN_TRUE: 'verdadeiro',
	LOGIC_BOOLEAN_FALSE: 'falso',
	LOGIC_NULL: 'nulo',

	// Additional Logic Block Messages
	LOGIC_COMPARE_HELPURL: 'https://pt.wikipedia.org/wiki/Inequação',
	LOGIC_NEGATE_HELPURL: 'https://github.com/google/blockly/wiki/Logic#not',
	LOGIC_NEGATE_TOOLTIP: 'Retorna verdadeiro se a entrada for falsa. Retorna falso se a entrada for verdadeira.',
	LOGIC_OPERATION_TOOLTIP_AND: 'Retorna verdadeiro se ambas as entradas forem verdadeiras.',
	LOGIC_OPERATION_TOOLTIP_OR: 'Retorna verdadeiro se pelo menos uma das entradas for verdadeira.',
	LOGIC_BOOLEAN_TOOLTIP: 'Retorna verdadeiro ou falso.',

	// Loop block messages
	CONTROLS_REPEAT_TITLE: 'repetir %1 vezes',
	CONTROLS_REPEAT_INPUT_DO: 'faca',
	CONTROLS_WHILEUNTIL_OPERATOR_WHILE: 'repetir enquanto',
	CONTROLS_WHILEUNTIL_OPERATOR_UNTIL: 'repetir até',
	CONTROLS_FOR_TITLE: 'contar com %1 de %2 até %3 por %4',
	CONTROLS_FLOW_STATEMENTS_OPERATOR_BREAK: 'sair do loop',
	CONTROLS_FLOW_STATEMENTS_OPERATOR_CONTINUE: 'continuar com a próxima iteração',
	CONTROLS_REPEAT_TOOLTIP: 'Repete algumas instruções várias vezes.',
	CONTROLS_WHILEUNTIL_TOOLTIP_WHILE: 'Enquanto um valor for verdadeiro, executa algumas instruções.',
	CONTROLS_WHILEUNTIL_TOOLTIP_UNTIL: 'Enquanto um valor for falso, executa algumas instruções.',
	CONTROLS_FOR_TOOLTIP: 'Conta do número inicial até o final pelo intervalo especificado.',
	CONTROLS_FLOW_STATEMENTS_WARNING: 'Aviso: Este bloco só pode ser usado dentro de um loop.',

	// Math block messages
	MATH_NUMBER_HELPURL: 'https://pt.wikipedia.org/wiki/Número',
	MATH_NUMBER_TOOLTIP: 'Um número.',
	MATH_ARITHMETIC_OPERATOR_ADD: '+',
	MATH_ARITHMETIC_OPERATOR_MINUS: '-',
	MATH_ARITHMETIC_OPERATOR_MULTIPLY: '×',
	MATH_ARITHMETIC_OPERATOR_DIVIDE: '÷',
	MATH_ARITHMETIC_OPERATOR_POWER: '^',
	MATH_SINGLE_OPERATOR_ROOT: 'raiz quadrada',
	MATH_SINGLE_OPERATOR_ABSOLUTE: 'absoluto',
	MATH_IS_EVEN: 'é par',
	MATH_IS_ODD: 'é ímpar',
	MATH_IS_PRIME: 'é primo',
	MATH_IS_WHOLE: 'é inteiro',
	MATH_IS_POSITIVE: 'é positivo',
	MATH_IS_NEGATIVE: 'é negativo',
	MATH_ARITHMETIC_HELPURL: 'https://pt.wikipedia.org/wiki/Aritmética',
	MATH_ARITHMETIC_TOOLTIP_ADD: 'Retorna a soma dos dois números.',
	MATH_ARITHMETIC_TOOLTIP_MINUS: 'Retorna a diferença dos dois números.',
	MATH_ARITHMETIC_TOOLTIP_MULTIPLY: 'Retorna o produto dos dois números.',
	MATH_ARITHMETIC_TOOLTIP_DIVIDE: 'Retorna o quociente dos dois números.',
	MATH_ARITHMETIC_TOOLTIP_POWER: 'Retorna o primeiro número elevado à potência do segundo número.',

	// Text block messages
	TEXT_JOIN_TITLE_CREATEWITH: 'criar texto com',
	TEXT_CREATE_JOIN_TITLE_JOIN: 'juntar',
	TEXT_LENGTH_TITLE: 'tamanho de %1',
	TEXT_ISEMPTY_TITLE: '%1 está vazio',
	TEXT_INDEXOF_OPERATOR_FIRST: 'encontrar primeira ocorrência do texto',
	TEXT_INDEXOF_OPERATOR_LAST: 'encontrar última ocorrência do texto',
	TEXT_CHARAT_FROM_START: 'obter letra #',
	TEXT_CHARAT_FROM_END: 'obter letra # do fim',
	TEXT_CHARAT_FIRST: 'obter primeira letra',
	TEXT_CHARAT_LAST: 'obter última letra',
	TEXT_CHARAT_RANDOM: 'obter letra aleatória',
	TEXT_JOIN_TOOLTIP: 'Cria um pedaço de texto juntando qualquer número de itens.',
	TEXT_APPEND_VARIABLE: 'item',
	TEXT_APPEND_TOOLTIP: 'Adiciona texto à variável "%1".',
	TEXT_LENGTH_TOOLTIP: 'Retorna o número de letras (incluindo espaços) no texto fornecido.',
	TEXT_ISEMPTY_TOOLTIP: 'Retorna verdadeiro se o texto fornecido estiver vazio.',

	// List block messages
	LISTS_CREATE_EMPTY_TITLE: 'criar lista vazia',
	LISTS_CREATE_WITH_INPUT_WITH: 'criar lista com',
	LISTS_LENGTH_TITLE: 'tamanho de %1',
	LISTS_ISEMPTY_TITLE: '%1 está vazia',
	LISTS_INDEXOF_FIRST: 'encontrar primeira ocorrência do item',
	LISTS_INDEXOF_LAST: 'encontrar última ocorrência do item',
	LISTS_GET_INDEX_GET: 'obter',
	LISTS_GET_INDEX_REMOVE: 'remover',
	LISTS_GET_INDEX_FROM_START: '#',
	LISTS_GET_INDEX_FROM_END: '# do fim',
	LISTS_GET_INDEX_FIRST: 'primeiro',
	LISTS_GET_INDEX_LAST: 'último',
	LISTS_GET_INDEX_RANDOM: 'aleatório',
	LISTS_CREATE_WITH_TOOLTIP: 'Cria uma lista com qualquer número de itens.',
	LISTS_CREATE_EMPTY_TOOLTIP: 'Retorna uma lista, de comprimento 0, sem dados',
	LISTS_LENGTH_TOOLTIP: 'Retorna o tamanho de uma lista.',
	LISTS_ISEMPTY_TOOLTIP: 'Retorna verdadeiro se a lista estiver vazia.',

	// Variables
	VARIABLES_SET: 'definir %1 para %2',
	VARIABLES_GET: '%1',
	VARIABLES_DEFAULT_NAME: 'item',

	// If conditions
	CONTROLS_IF_TOOLTIP_1: 'Se um valor for verdadeiro, então execute algumas instruções.',
	CONTROLS_IF_TOOLTIP_2:
		'Se um valor for verdadeiro, então execute o primeiro bloco de instruções. Caso contrário, execute o segundo bloco de instruções.',
	CONTROLS_IF_TOOLTIP_3:
		'Se o primeiro valor for verdadeiro, então execute o primeiro bloco de instruções. Se não, se o segundo valor for verdadeiro, execute o segundo bloco de instruções.',
	CONTROLS_IF_TOOLTIP_4:
		'Se o primeiro valor for verdadeiro, execute o primeiro bloco de instruções. Se não, se o segundo valor for verdadeiro, execute o segundo bloco de instruções. Se nenhum dos valores for verdadeiro, execute o último bloco de instruções.',

	// Procedures
	PROCEDURES_DEFNORETURN_TITLE: '',
	PROCEDURES_DEFNORETURN_PROCEDURE: 'fazer algo',
	PROCEDURES_BEFORE_PARAMS: 'com:',
	PROCEDURES_CALL_BEFORE_PARAMS: 'com:',
	PROCEDURES_DEFNORETURN_DO: '',
	PROCEDURES_DEFNORETURN_TOOLTIP: 'Cria uma função sem saída.',
	PROCEDURES_DEFRETURN_RETURN: 'retornar',
	PROCEDURES_DEFRETURN_TOOLTIP: 'Cria uma função com uma saída.',
	PROCEDURES_DEFRETURN_COMMENT: 'Descreva esta função...',
	PROCEDURES_DEFRETURN_PROCEDURE: 'fazer algo com retorno',
	PROCEDURES_DEFRETURN_DO: '',
	PROCEDURES_CALLNORETURN_HELPURL: 'https://pt.wikipedia.org/wiki/Subrotina',
	PROCEDURES_CALLNORETURN_TOOLTIP: 'Execute a função definida pelo usuário.',
	PROCEDURES_CALLRETURN_HELPURL: 'https://pt.wikipedia.org/wiki/Subrotina',
	PROCEDURES_CALLRETURN_TOOLTIP: 'Execute a função definida pelo usuário e use sua saída.',

	// Seven Segment Display
	SEVEN_SEGMENT_DISPLAY: 'Display de Sete Segmentos',
	SEVEN_SEGMENT_COMMON_CATHODE: 'Cátodo Comum',
	SEVEN_SEGMENT_COMMON_ANODE: 'Ânodo Comum',
	SEVEN_SEGMENT_NUMBER: 'Número (0-9):',
	SEVEN_SEGMENT_DECIMAL_POINT: 'Ponto Decimal',
	SEVEN_SEGMENT_TOOLTIP: 'Exibe um número (0-9) em um display de sete segmentos com ponto decimal opcional.',
	// Seven Segment Display Pins
	SEVEN_SEGMENT_PINS_SET: 'Definir pinos do display de sete segmentos',
	SEVEN_SEGMENT_PINS_TOOLTIP: 'Configura pinos para cada segmento (A-G) e ponto decimal (DP) do display de sete segmentos.',
	// Pixetto Smart Camera
	PIXETTO_INIT: 'Inicializar câmera inteligente Pixetto',
	PIXETTO_RX_PIN: 'Pino RX',
	PIXETTO_TX_PIN: 'Pino TX',
	PIXETTO_IS_DETECTED: 'Pixetto Objeto Detectado',
	PIXETTO_GET_TYPE_ID: 'Pixetto Obter ID do Tipo',
	PIXETTO_GET_FUNC_ID: 'Pixetto Obter ID da Função',
	PIXETTO_COLOR_DETECT: 'Pixetto detectar cor',
	PIXETTO_SHAPE_DETECT: 'Pixetto detectar forma',
	PIXETTO_FACE_DETECT: 'Pixetto detectar rosto',
	PIXETTO_APRILTAG_DETECT: 'Pixetto detectar AprilTag',
	PIXETTO_NEURAL_NETWORK: 'Pixetto reconhecimento de rede neural',
	PIXETTO_HANDWRITTEN_DIGIT: 'Pixetto reconhecer dígito manuscrito',
	PIXETTO_GET_POSITION: 'Pixetto obter objeto detectado',
	PIXETTO_ROAD_DETECT: 'Pixetto detecção de estrada',
	PIXETTO_SET_MODE: 'Definir modo de função Pixetto',
	PIXETTO_COLOR: 'Cor',
	PIXETTO_SHAPE: 'Forma',
	PIXETTO_MODE: 'Modo',
	PIXETTO_TAG_ID: 'ID da etiqueta',
	PIXETTO_CLASS_ID: 'ID da classe',
	PIXETTO_DIGIT: 'Dígito',
	PIXETTO_COORDINATE: 'Coordenada',
	PIXETTO_ROAD_INFO: 'Informação', // Vision Sensors Category Labels
	PIXETTO_LABEL: 'Pixetto',
	HUSKYLENS_LABEL: 'HUSKYLENS',
	// HUSKYLENS Câmera Inteligente
	HUSKYLENS_INIT_I2C: 'Inicializar HUSKYLENS (I2C)',
	HUSKYLENS_INIT_UART: 'Inicializar HUSKYLENS (UART)',
	HUSKYLENS_RX_PIN: 'Conectar ao HuskyLens TX →',
	HUSKYLENS_TX_PIN: 'Conectar ao HuskyLens RX →',
	HUSKYLENS_SET_ALGORITHM: 'Definir algoritmo HUSKYLENS para',
	HUSKYLENS_ALGORITHM_FACE_RECOGNITION: 'Reconhecimento facial',
	HUSKYLENS_ALGORITHM_OBJECT_TRACKING: 'Rastreamento de objetos',
	HUSKYLENS_ALGORITHM_OBJECT_RECOGNITION: 'Reconhecimento de objetos',
	HUSKYLENS_ALGORITHM_LINE_TRACKING: 'Rastreamento de linha',
	HUSKYLENS_ALGORITHM_COLOR_RECOGNITION: 'Reconhecimento de cores',
	HUSKYLENS_ALGORITHM_TAG_RECOGNITION: 'Reconhecimento de etiquetas',
	HUSKYLENS_ALGORITHM_OBJECT_CLASSIFICATION: 'Classificação de objetos',
	HUSKYLENS_REQUEST: 'Solicitar resultado de reconhecimento HUSKYLENS',
	HUSKYLENS_IS_LEARNED: 'HUSKYLENS aprendeu objetos',
	HUSKYLENS_COUNT_BLOCKS: 'Contagem de blocos detectados HUSKYLENS',
	HUSKYLENS_COUNT_ARROWS: 'Contagem de setas detectadas HUSKYLENS',
	HUSKYLENS_GET_BLOCK_INFO: 'Obter bloco',
	HUSKYLENS_GET_ARROW_INFO: 'Obter seta',
	HUSKYLENS_BLOCK_INFO_TYPE: ' ',
	HUSKYLENS_ARROW_INFO_TYPE: ' ',
	HUSKYLENS_X_CENTER: 'Centro X',
	HUSKYLENS_Y_CENTER: 'Centro Y',
	HUSKYLENS_WIDTH: 'Largura',
	HUSKYLENS_HEIGHT: 'Altura',
	HUSKYLENS_ID: 'ID',
	HUSKYLENS_X_ORIGIN: 'X origem',
	HUSKYLENS_Y_ORIGIN: 'Y origem',
	HUSKYLENS_X_TARGET: 'X destino',
	HUSKYLENS_Y_TARGET: 'Y destino',
	HUSKYLENS_LEARN: 'Deixe HUSKYLENS aprender ID',
	HUSKYLENS_FORGET: 'Deixe HUSKYLENS esquecer tudo aprendido',

	// HuskyLens ID-Based Blocos
	HUSKYLENS_BY_ID_LABEL: 'Consultar por ID',
	HUSKYLENS_REQUEST_BLOCKS_ID: 'solicitar blocos HUSKYLENS com ID',
	HUSKYLENS_REQUEST_BLOCKS_ID_SUFFIX: '',
	HUSKYLENS_REQUEST_BLOCKS_ID_TOOLTIP: 'Solicitar apenas blocos com ID específico para maior eficiência',
	HUSKYLENS_COUNT_BLOCKS_ID: 'contagem de blocos HUSKYLENS com ID',
	HUSKYLENS_COUNT_BLOCKS_ID_SUFFIX: '',
	HUSKYLENS_COUNT_BLOCKS_ID_TOOLTIP: 'Obter a contagem de blocos com ID específico',
	HUSKYLENS_GET_BLOCK_ID: 'obter bloco com ID',
	HUSKYLENS_GET_BLOCK_ID_INDEX: 'índice',
	HUSKYLENS_GET_BLOCK_ID_INDEX_SUFFIX: '',
	HUSKYLENS_GET_BLOCK_ID_TOOLTIP: 'Obter posição, tamanho ou ID de um bloco com ID específico',

	// Pixetto Tooltips
	PIXETTO_INIT_TOOLTIP: 'Inicializar a câmera inteligente Pixetto e configurar os pinos de comunicação UART',
	PIXETTO_IS_DETECTED_TOOLTIP: 'Detectar se o Pixetto detecta algum objeto',
	PIXETTO_GET_TYPE_ID_TOOLTIP: 'Obter o ID do tipo de objeto detectado pelo Pixetto (cor, forma, etc.)',
	PIXETTO_GET_FUNC_ID_TOOLTIP: 'Obter o ID da função atualmente usada pelo Pixetto (detecção de cor, forma, etc.)',
	PIXETTO_COLOR_DETECT_TOOLTIP: 'Detectar se o Pixetto detecta um objeto da cor especificada',
	PIXETTO_SHAPE_DETECT_TOOLTIP: 'Detectar se o Pixetto detecta um objeto da forma especificada',
	PIXETTO_FACE_DETECT_TOOLTIP: 'Detectar se o Pixetto detecta um rosto',
	PIXETTO_APRILTAG_DETECT_TOOLTIP: 'Detectar se o Pixetto detecta um AprilTag com ID especificado',
	PIXETTO_NEURAL_NETWORK_TOOLTIP: 'Detectar se a rede neural do Pixetto reconhece um objeto da classe especificada',
	PIXETTO_HANDWRITTEN_DIGIT_TOOLTIP: 'Detectar se o Pixetto reconhece um dígito manuscrito especificado',
	PIXETTO_GET_POSITION_TOOLTIP: 'Obter informações de posição ou tamanho do objeto detectado pelo Pixetto',
	PIXETTO_ROAD_DETECT_TOOLTIP: 'Obter informações relacionadas à detecção de estrada do Pixetto',
	PIXETTO_SET_MODE_TOOLTIP: 'Configurar o modo funcional da câmera inteligente Pixetto',
	// HUSKYLENS Tooltips
	HUSKYLENS_INIT_I2C_TOOLTIP: 'Inicializar câmera inteligente HUSKYLENS usando I2C',
	HUSKYLENS_INIT_UART_TOOLTIP: 'Inicializar câmera inteligente HUSKYLENS usando UART com configuração de pinos RX/TX',
	HUSKYLENS_SET_ALGORITHM_TOOLTIP: 'Definir o algoritmo de reconhecimento a ser usado no HUSKYLENS',
	HUSKYLENS_REQUEST_TOOLTIP: 'Solicitar os resultados de reconhecimento mais recentes do HUSKYLENS',
	HUSKYLENS_IS_LEARNED_TOOLTIP: 'Verificar se o HUSKYLENS aprendeu objetos',
	HUSKYLENS_COUNT_BLOCKS_TOOLTIP: 'Obter o número de blocos detectados pelo HUSKYLENS',
	HUSKYLENS_COUNT_ARROWS_TOOLTIP: 'Obter o número de setas detectadas pelo HUSKYLENS',
	HUSKYLENS_GET_BLOCK_INFO_TOOLTIP: 'Obter informações do bloco especificado (posição, tamanho ou ID)',
	HUSKYLENS_GET_ARROW_INFO_TOOLTIP: 'Obter informações da seta especificada (origem, destino ou ID)',
	HUSKYLENS_LEARN_TOOLTIP: 'Fazer o HUSKYLENS aprender objeto com ID especificado (apenas no modo de classificação de objetos)',
	HUSKYLENS_FORGET_TOOLTIP: 'Fazer o HUSKYLENS esquecer todos os objetos aprendidos (apenas no modo de classificação de objetos)',
	HUSKYLENS_I2C_PIN_HINT: 'Fiação: ',
	HUSKYLENS_UART_PIN_HINT: 'Pinos recomendados: ',
	HUSKYLENS_UART_ANY_DIGITAL: 'Qualquer pino digital',

	// Pixetto Color Options
	PIXETTO_COLOR_RED: 'Vermelho',
	PIXETTO_COLOR_BLUE: 'Azul',
	PIXETTO_COLOR_GREEN: 'Verde',
	PIXETTO_COLOR_YELLOW: 'Amarelo',
	PIXETTO_COLOR_ORANGE: 'Laranja',
	PIXETTO_COLOR_PURPLE: 'Roxo',
	PIXETTO_COLOR_BLACK: 'Preto',
	PIXETTO_COLOR_WHITE: 'Branco',

	// Pixetto Shape Options
	PIXETTO_SHAPE_TRIANGLE: 'Triângulo',
	PIXETTO_SHAPE_RECTANGLE: 'Retângulo',
	PIXETTO_SHAPE_PENTAGON: 'Pentágono',
	PIXETTO_SHAPE_HEXAGON: 'Hexágono',
	PIXETTO_SHAPE_CIRCLE: 'Círculo',

	// Pixetto Position Options
	PIXETTO_POSITION_X: 'Coordenada X',
	PIXETTO_POSITION_Y: 'Coordenada Y',
	PIXETTO_POSITION_WIDTH: 'Largura',
	PIXETTO_POSITION_HEIGHT: 'Altura',

	// Pixetto Road Info Options
	PIXETTO_ROAD_CENTER_X: 'Centro X',
	PIXETTO_ROAD_CENTER_Y: 'Centro Y',
	PIXETTO_ROAD_LEFT_X: 'Limite Esquerdo X',
	PIXETTO_ROAD_RIGHT_X: 'Limite Direito X',

	// Pixetto Mode Options
	PIXETTO_MODE_COLOR_DETECTION: 'Detecção de Cor',
	PIXETTO_MODE_SHAPE_DETECTION: 'Detecção de Forma',
	PIXETTO_MODE_FACE_DETECTION: 'Detecção de Rosto',
	PIXETTO_MODE_APRILTAG_DETECTION: 'Detecção de AprilTag',
	PIXETTO_MODE_NEURAL_NETWORK: 'Rede Neural',
	PIXETTO_MODE_HANDWRITTEN_DIGIT: 'Dígito Manuscrito',
	PIXETTO_MODE_ROAD_DETECTION: 'Detecção de Estrada',
	PIXETTO_MODE_BALL_DETECTION: 'Detecção de Bola',
	PIXETTO_MODE_TEMPLATE_MATCHING: 'Correspondência de Modelo',
	// ESP32 PWM Setup
	ESP32_PWM_SETUP: 'Configuração PWM ESP32',
	ESP32_PWM_FREQUENCY: 'Frequência',
	ESP32_PWM_RESOLUTION: 'Resolução',
	ESP32_PWM_FREQUENCY_TOOLTIP: 'Definir frequência PWM, faixa 1-80000 Hz. Alta frequência para chips de driver de motor (20-75KHz)',
	ESP32_PWM_RESOLUTION_TOOLTIP: 'Definir resolução PWM, afeta a precisão de saída. Nota: frequência × 2^resolução ≤ 80.000.000',
	ESP32_PWM_RESOLUTION_8BIT: '8 bits (0-255)',
	ESP32_PWM_RESOLUTION_10BIT: '10 bits (0-1023)',
	ESP32_PWM_RESOLUTION_12BIT: '12 bits (0-4095)',
	ESP32_PWM_RESOLUTION_13BIT: '13 bits (0-8191)',
	ESP32_PWM_RESOLUTION_14BIT: '14 bits (0-16383)',
	ESP32_PWM_RESOLUTION_15BIT: '15 bits (0-32767)',
	ESP32_PWM_RESOLUTION_16BIT: '16 bits (0-65535)',
	// Safety Guard (Project Safety Protection)
	SAFETY_WARNING_BODY_NO_TYPE:
		'Este projeto ainda não tem blocos Blockly. Se continuar, pasta e arquivos blockly serão criados aqui. Deseja continuar?',
	SAFETY_WARNING_BODY_WITH_TYPE:
		'Projeto {0} detectado. Este projeto ainda não tem blocos Blockly. Se continuar, pasta e arquivos blockly serão criados aqui. Deseja continuar?',
	BUTTON_CONTINUE: 'Continuar',
	BUTTON_CANCEL: 'Cancelar',
	BUTTON_SUPPRESS: 'Não Lembrar',
	SAFETY_GUARD_CANCELLED: 'Abertura do editor Blockly cancelada',
	SAFETY_GUARD_SUPPRESSED: 'Preferência salva, este aviso não será exibido novamente',

	// Communication Category (WiFi/MQTT)
	CATEGORY_COMMUNICATION: 'Comunicação',
	ESP32_WIFI_LABEL: 'WiFi',
	ESP32_MQTT_LABEL: 'MQTT',
	ESP32_WIFI_CONNECT: 'WiFi Conectar',
	ESP32_WIFI_CONNECT_SSID: 'SSID',
	ESP32_WIFI_CONNECT_PASSWORD: 'Senha',
	ESP32_WIFI_CONNECT_TOOLTIP: 'Conectar à rede WiFi (tempo limite 10 segundos)',
	ESP32_WIFI_DISCONNECT: 'WiFi Desconectar',
	ESP32_WIFI_DISCONNECT_TOOLTIP: 'Desconectar WiFi',
	ESP32_WIFI_STATUS: 'WiFi Conectado?',
	ESP32_WIFI_STATUS_TOOLTIP: 'Retorna o status da conexão WiFi',
	ESP32_WIFI_GET_IP: 'Endereço IP WiFi',
	ESP32_WIFI_GET_IP_TOOLTIP: 'Obter endereço IP atual',
	ESP32_WIFI_SCAN: 'Escanear Redes WiFi',
	ESP32_WIFI_SCAN_TOOLTIP: 'Escanear e retornar quantidade de redes WiFi próximas',
	ESP32_WIFI_GET_SSID: 'Obter SSID WiFi',
	ESP32_WIFI_GET_SSID_INDEX: 'índice',
	ESP32_WIFI_GET_SSID_TOOLTIP: 'Obter nome do WiFi no índice especificado',
	ESP32_WIFI_GET_RSSI: 'Obter Força do Sinal WiFi',
	ESP32_WIFI_GET_RSSI_INDEX: 'índice',
	ESP32_WIFI_GET_RSSI_TOOLTIP: 'Obter força do sinal no índice especificado (dBm)',
	ESP32_MQTT_SETUP: 'Configuração MQTT',
	ESP32_MQTT_SETUP_SERVER: 'Servidor',
	ESP32_MQTT_SETUP_PORT: 'Porta',
	ESP32_MQTT_SETUP_CLIENT_ID: 'ID do Cliente',
	ESP32_MQTT_SETUP_TOOLTIP: 'Configurar parâmetros de conexão do servidor MQTT',
	ESP32_MQTT_CONNECT: 'MQTT Conectar',
	ESP32_MQTT_CONNECT_USERNAME: 'Usuário',
	ESP32_MQTT_CONNECT_PASSWORD: 'Senha',
	ESP32_MQTT_CONNECT_TOOLTIP: 'Conectar ao servidor MQTT',
	ESP32_MQTT_PUBLISH: 'MQTT Publicar',
	ESP32_MQTT_PUBLISH_TOPIC: 'Tópico',
	ESP32_MQTT_PUBLISH_MESSAGE: 'Mensagem',
	ESP32_MQTT_PUBLISH_TOOLTIP: 'Publicar mensagem no tópico especificado',
	ESP32_MQTT_SUBSCRIBE: 'MQTT Inscrever',
	ESP32_MQTT_SUBSCRIBE_TOPIC: 'Tópico',
	ESP32_MQTT_SUBSCRIBE_TOOLTIP: 'Inscrever-se em mensagens do tópico especificado',
	ESP32_MQTT_LOOP: 'MQTT Processar Mensagens',
	ESP32_MQTT_LOOP_TOOLTIP: 'Manter conexão e processar mensagens recebidas (colocar no loop)',
	ESP32_MQTT_GET_TOPIC: 'MQTT Último Tópico',
	ESP32_MQTT_GET_TOPIC_TOOLTIP: 'Obter tópico da mensagem mais recente',
	ESP32_MQTT_GET_MESSAGE: 'MQTT Última Mensagem',
	ESP32_MQTT_GET_MESSAGE_TOOLTIP: 'Obter conteúdo da mensagem mais recente',
	ESP32_MQTT_STATUS: 'MQTT Conectado',
	ESP32_MQTT_STATUS_TOOLTIP: 'Verificar se está conectado ao servidor MQTT',
	TEXT_TO_NUMBER: 'Texto para Número',
	TEXT_TO_NUMBER_INT: 'Inteiro',
	TEXT_TO_NUMBER_FLOAT: 'Decimal',
	TEXT_TO_NUMBER_TOOLTIP: 'Converter texto para número (entrada inválida retorna 0)',

	// To String Block
	TO_STRING: 'Para Texto',
	TO_STRING_TOOLTIP: 'Converter número ou booleano para texto',

	// ESP32 Only Block Warning
	ESP32_ONLY_BLOCK_WARNING: 'Este bloco suporta apenas placas ESP32',

	// Quick Backup Toast Messages
	BACKUP_QUICK_SAVE_SUCCESS: 'Backup salvo: {0}',
	BACKUP_QUICK_SAVE_EMPTY: 'O espaço de trabalho está vazio, backup não necessário',
	BACKUP_QUICK_SAVE_COOLDOWN: 'Por favor aguarde, o backup acabou de ser concluído',
	MAIN_BLOCK_DUPLICATE_WARNING: 'Foram detectados varios blocos do programa principal. Exclua os blocos extras.',

	// Board Switch Warning
	BOARD_SWITCH_WARNING_TITLE: 'Trocar tipo de placa',
	BOARD_SWITCH_WARNING_MESSAGE:
		'Mudar para um tipo de placa diferente limpará o espaço de trabalho atual.\nSeu trabalho será automaticamente salvo primeiro.\n\nDeseja continuar?',

	// CyberBrick Board
	BOARD_CYBERBRICK: 'CyberBrick',

	// CyberBrick Category
	CATEGORY_CYBERBRICK_CORE: 'CyberBrick',
	CATEGORY_CYBERBRICK_LED: 'LED',
	CATEGORY_CYBERBRICK_GPIO: 'GPIO',
	CATEGORY_CYBERBRICK_TIME: 'Tempo',

	// CyberBrick Main Block
	CYBERBRICK_MAIN: 'Programa principal',
	CYBERBRICK_MAIN_TOOLTIP: 'Ponto de entrada do programa principal CyberBrick. Todo código deve ser colocado dentro deste bloco.',

	// CyberBrick LED Blocks
	CYBERBRICK_LED_SET_COLOR: 'Definir cor do LED',
	CYBERBRICK_LED_SET_COLOR_PREFIX: 'Definir cor do LED integrado',
	CYBERBRICK_LED_RED: 'Vermelho',
	CYBERBRICK_LED_GREEN: 'Verde',
	CYBERBRICK_LED_BLUE: 'Azul',
	CYBERBRICK_LED_SET_COLOR_TOOLTIP: 'Definir cor do LED integrado (GPIO8) usando valores RGB (0-255)',
	CYBERBRICK_LED_OFF: 'Desligar LED',
	CYBERBRICK_LED_OFF_TOOLTIP: 'Desligar o LED integrado',

	// CyberBrick GPIO Blocks
	CYBERBRICK_GPIO_SET: 'Definir GPIO',
	CYBERBRICK_GPIO_SET_PREFIX: 'GPIO',
	CYBERBRICK_GPIO_SET_TO: 'para',
	CYBERBRICK_GPIO_PIN: 'Pino',
	CYBERBRICK_GPIO_VALUE: 'Valor',
	CYBERBRICK_GPIO_HIGH: 'ALTO',
	CYBERBRICK_GPIO_LOW: 'BAIXO',
	CYBERBRICK_GPIO_SET_TOOLTIP: 'Definir pino GPIO como ALTO ou BAIXO',
	CYBERBRICK_GPIO_READ: 'Ler GPIO',
	CYBERBRICK_GPIO_READ_TOOLTIP: 'Ler valor digital do pino GPIO (retorna 0 ou 1)',

	// CyberBrick Time Blocks
	CYBERBRICK_DELAY_MS: 'Atraso (ms)',
	CYBERBRICK_DELAY_MS_PREFIX: 'Atraso',
	CYBERBRICK_DELAY_MS_SUFFIX: 'ms',
	CYBERBRICK_DELAY_MS_TOOLTIP: 'Pausar execução do programa pelos milissegundos especificados',
	CYBERBRICK_DELAY_S: 'Atraso (s)',
	CYBERBRICK_DELAY_S_PREFIX: 'Atraso',
	CYBERBRICK_DELAY_S_SUFFIX: 'segundos',
	CYBERBRICK_DELAY_S_TOOLTIP: 'Pausar execução do programa pelos segundos especificados',
	CYBERBRICK_TICKS_MS: 'Obter milissegundos atuais',
	CYBERBRICK_TICKS_MS_TOOLTIP: 'Obter o contador atual de milissegundos',
	CYBERBRICK_TICKS_DIFF_PREFIX: 'Diferença de tempo',
	CYBERBRICK_TICKS_DIFF_NOW: 'agora',
	CYBERBRICK_TICKS_DIFF_START: 'início',
	CYBERBRICK_TICKS_DIFF_TOOLTIP: 'Calcular os milissegundos entre agora e o início',

	// CyberBrick WiFi Blocks
	CATEGORY_CYBERBRICK_WIFI: 'WiFi',
	CYBERBRICK_WIFI_CONNECT: 'Conectar WiFi',
	CYBERBRICK_WIFI_SSID: 'SSID',
	CYBERBRICK_WIFI_PASSWORD: 'Senha',
	CYBERBRICK_WIFI_CONNECT_TOOLTIP: 'Conectar à rede WiFi especificada',
	CYBERBRICK_WIFI_DISCONNECT: 'Desconectar WiFi',
	CYBERBRICK_WIFI_DISCONNECT_TOOLTIP: 'Desconectar da rede WiFi atual',
	CYBERBRICK_WIFI_IS_CONNECTED: 'WiFi conectado?',
	CYBERBRICK_WIFI_IS_CONNECTED_TOOLTIP: 'Verificar se WiFi está conectado',
	CYBERBRICK_WIFI_GET_IP: 'Obter endereço IP',
	CYBERBRICK_WIFI_GET_IP_TOOLTIP: 'Obter endereço IP atual',

	// CyberBrick Upload
	UPLOAD_BUTTON_TITLE: 'Enviar para CyberBrick',
	UPLOAD_BUTTON_DISABLED_TITLE: 'Salve o espaço de trabalho primeiro para habilitar o envio',
	UPLOAD_STARTING: 'Iniciando envio...',
	UPLOAD_SUCCESS: 'Envio bem-sucedido!',
	UPLOAD_FAILED: 'Envio falhou: {0}',
	UPLOAD_NO_PORT: 'Nenhum dispositivo CyberBrick encontrado',
	UPLOAD_IN_PROGRESS: 'Enviando...',
	UPLOAD_EMPTY_WORKSPACE: 'O espaço de trabalho está vazio, adicione blocos primeiro',
	UPLOAD_NO_CODE: 'Não foi possível gerar código',

	// Upload progress stages
	UPLOAD_STAGE_PREPARING: 'Preparando',
	UPLOAD_STAGE_CHECKING: 'Verificando ferramentas',
	UPLOAD_STAGE_INSTALLING: 'Instalando ferramentas',
	UPLOAD_STAGE_CONNECTING: 'Conectando dispositivo',
	UPLOAD_STAGE_RESETTING: 'Reiniciando dispositivo',
	UPLOAD_STAGE_BACKUP: 'Fazendo backup',
	UPLOAD_STAGE_UPLOADING: 'Enviando',
	UPLOAD_STAGE_RESTARTING: 'Reiniciando dispositivo',
	UPLOAD_STAGE_COMPLETED: 'Concluído',

	// Upload error messages
	ERROR_UPLOAD_BOARD_UNSUPPORTED: 'Apenas a placa CyberBrick é suportada',
	ERROR_UPLOAD_CODE_EMPTY: 'O código não pode estar vazio',
	ERROR_UPLOAD_NO_PYTHON: 'Ambiente Python do PlatformIO não encontrado. Por favor, instale o PlatformIO primeiro.',
	ERROR_UPLOAD_MPREMOTE_FAILED: 'Falha na instalação do mpremote',
	ERROR_UPLOAD_DEVICE_NOT_FOUND: 'Dispositivo CyberBrick não encontrado. Certifique-se de que está conectado.',
	ERROR_UPLOAD_RESET_FAILED: 'Falha ao reiniciar o dispositivo',
	ERROR_UPLOAD_UPLOAD_FAILED: 'Falha ao enviar o programa',
	ERROR_UPLOAD_RESTART_FAILED: 'Falha ao reiniciar o dispositivo',

	// Arduino Upload Button
	UPLOAD_BUTTON_TITLE_ARDUINO: 'Compilar e Enviar',
	UPLOAD_SELECT_BOARD: 'Por favor, selecione uma placa primeiro',

	// Arduino Upload Stages
	ARDUINO_STAGE_SYNCING: 'Sincronizando configurações',
	ARDUINO_STAGE_SAVING: 'Área de trabalho salva',
	ARDUINO_STAGE_CHECKING: 'Verificando compilador',
	ARDUINO_STAGE_DETECTING: 'Detectando placa',
	ARDUINO_STAGE_COMPILING: 'Compilando',
	ARDUINO_STAGE_UPLOADING: 'Enviando',

	// Arduino Upload Results
	ARDUINO_COMPILE_SUCCESS: 'Compilação bem-sucedida!',
	ARDUINO_UPLOAD_SUCCESS: 'Envio bem-sucedido!',

	// Arduino Upload Errors
	ERROR_ARDUINO_PIO_NOT_FOUND: 'PlatformIO CLI não encontrado. Por favor, instale o PlatformIO primeiro.',
	ERROR_ARDUINO_COMPILE_FAILED: 'Falha na compilação',
	ERROR_ARDUINO_UPLOAD_FAILED: 'Falha no envio',
	ERROR_ARDUINO_NO_WORKSPACE: 'Por favor, abra uma pasta de projeto primeiro',
	ERROR_ARDUINO_TIMEOUT: 'Operação expirou',
	ERROR_ARDUINO_DEVICE_DISCONNECT: 'Dispositivo desconectado',

	// Backup messages
	BACKUP_CONFIRM_DELETE: 'Tem certeza de que deseja excluir o backup "{0}"?',
	BACKUP_CONFIRM_RESTORE: 'Tem certeza de que deseja restaurar o backup "{0}"? Isso substituirá o espaço de trabalho atual.',
	BACKUP_ERROR_NOT_FOUND: 'Backup "{0}" não encontrado',
	BACKUP_ERROR_CREATE_FAILED: 'Falha ao criar backup: {0}',
	BACKUP_ERROR_DELETE_FAILED: 'Falha ao excluir backup: {0}',
	BACKUP_ERROR_RESTORE_FAILED: 'Falha ao restaurar backup: {0}',
	BACKUP_ERROR_PREVIEW_FAILED: 'Falha ao visualizar backup: {0}',
	BACKUP_ERROR_NAME_NOT_SPECIFIED: 'Nome do backup não especificado',
	BACKUP_ERROR_MAIN_NOT_FOUND: 'Não foi possível encontrar o arquivo main.json',
	BACKUP_ERROR_UPDATE_SETTINGS_FAILED: 'Falha ao atualizar configurações de backup automático',

	// Button labels
	BUTTON_DELETE: 'Excluir',
	BUTTON_RESTORE: 'Restaurar',

	// Error messages
	ERROR_PROCESSING_MESSAGE: 'Erro ao processar mensagem: {0}',
	ERROR_SETTINGS_UPDATE_FAILED: 'Falha ao atualizar configurações',
	ERROR_RELOAD_WORKSPACE_FAILED: 'Falha ao recarregar o espaço de trabalho: {0}',
	ERROR_OPEN_PROJECT_FOLDER_FIRST: 'Por favor, abra uma pasta de projeto primeiro',

	// Info messages
	INFO_NO_BACKUPS_TO_PREVIEW: 'Nenhum arquivo de backup para visualizar',

	// Dialog messages
	DIALOG_SELECT_BACKUP_TITLE: 'Selecione o arquivo de backup para visualizar',
	DIALOG_BACKUP_FILES_LABEL: 'Arquivos de backup',

	// Placa de extensão X11
	CATEGORY_X11: 'Extensão X11',
	X11_LABEL_SERVOS: 'Servomotores',
	X11_LABEL_MOTORS: 'Motores',
	X11_LABEL_LEDS: 'LEDs',

	// Blocos de servo 180° X11
	X11_SERVO_180_ANGLE_PREFIX: 'Definir servo',
	X11_SERVO_180_ANGLE_SUFFIX: 'ângulo',
	X11_SERVO_180_ANGLE_TOOLTIP: 'Definir ângulo do servo 180° (0-180 graus)',

	// Blocos de servo 360° X11
	X11_SERVO_360_SPEED_PREFIX: 'Definir servo',
	X11_SERVO_360_SPEED_SUFFIX: 'velocidade',
	X11_SERVO_360_SPEED_TOOLTIP: 'Definir velocidade do servo de rotação contínua 360° (-100 a 100, negativo=reverso)',

	// Bloco de parada de servo X11
	X11_SERVO_STOP: 'Parar servo',
	X11_SERVO_STOP_TOOLTIP: 'Parar o servo especificado',

	// Blocos de motor X11
	X11_MOTOR_SPEED_PREFIX: 'Definir motor',
	X11_MOTOR_SPEED_SUFFIX: 'velocidade',
	X11_MOTOR_SPEED_TOOLTIP: 'Definir velocidade do motor DC (-2048 a 2048, negativo=reverso)',
	X11_MOTOR_STOP: 'Parar motor',
	X11_MOTOR_STOP_TOOLTIP: 'Parar o motor especificado',

	// Blocos de LED X11
	X11_LED_SET_COLOR_PREFIX: 'Fita LED',
	X11_LED_SET_COLOR_INDEX: 'índice',
	X11_LED_SET_COLOR_INDEX_SUFFIX: 'definir cor R',
	X11_LED_SET_COLOR_TOOLTIP: 'Definir cor do pixel da fita LED (índice 0=primeiro pixel, ou todos)',
	X11_LED_INDEX_ALL: 'Todos',

	// === Placa de extensão X12 Transmissor ===
	CATEGORY_X12: 'X12 Extensão',
	X12_LABEL_JOYSTICK: 'Joystick',
	X12_LABEL_BUTTON: 'Botão',

	// Blocos de Joystick X12
	X12_GET_JOYSTICK_PREFIX: 'Joystick',
	X12_GET_JOYSTICK_SUFFIX: 'valor',
	X12_GET_JOYSTICK_TOOLTIP: 'Ler valor ADC do joystick (0-4095)',
	X12_GET_JOYSTICK_MAPPED_PREFIX: 'Joystick',
	X12_GET_JOYSTICK_MAPPED_MIN: 'mapear para',
	X12_GET_JOYSTICK_MAPPED_MAX: '~',
	X12_GET_JOYSTICK_MAPPED_TOOLTIP: 'Ler joystick e mapear para intervalo especificado',

	// Blocos de Botão X12
	X12_IS_BUTTON_PRESSED_PREFIX: 'Botão',
	X12_IS_BUTTON_PRESSED_SUFFIX: 'pressionado?',
	X12_IS_BUTTON_PRESSED_TOOLTIP: 'Verificar se o botão está pressionado',

	// === Controle Remoto RC ===

	// Blocos de Inicialização RC

	// Blocos de Joystick RC

	// Blocos de Botão RC

	// Blocos de Status RC

	// === Conexão RC ===
	CATEGORY_RC: 'Conexão RC',
	RC_LABEL_MASTER: '📡 Transmissor',
	RC_LABEL_SLAVE: '📻 Receptor',
	RC_LABEL_DATA: '📊 Dados',
	RC_LABEL_STATUS: '🔗 Status',

	// Blocos transmissor RC
	RC_MASTER_INIT: 'Inicializar transmissor RC',
	RC_MASTER_INIT_PAIR_ID: 'ID pareamento',
	RC_MASTER_INIT_CHANNEL: 'canal',
	RC_MASTER_INIT_TOOLTIP: 'Inicializar transmissor RC com ID pareamento (1-255) e canal (1-11)',
	RC_SEND: 'Enviar dados RC',
	RC_SEND_TOOLTIP: 'Ler dados joysticks/botões X12 e enviar ao receptor',

	// Blocos receptor RC
	RC_SLAVE_INIT: 'Inicializar receptor RC',
	RC_SLAVE_INIT_PAIR_ID: 'ID pareamento',
	RC_SLAVE_INIT_CHANNEL: 'canal',
	RC_SLAVE_INIT_TOOLTIP: 'Inicializar receptor RC com ID pareamento (1-255) e canal (1-11)',
	RC_WAIT_CONNECTION: 'Aguardar pareamento',
	RC_WAIT_TIMEOUT: 'timeout',
	RC_WAIT_SECONDS: 'seg',
	RC_WAIT_TOOLTIP: 'Aguardar conexão transmissor, LED pisca azul, continua após timeout',

	// Blocos leitura dados RC
	RC_GET_JOYSTICK_PREFIX: 'RC joystick',
	RC_GET_JOYSTICK_TOOLTIP: 'Ler valor joystick remoto (0-4095), 2048 é centro',
	RC_GET_JOYSTICK_MAPPED_PREFIX: 'RC joystick',
	RC_GET_JOYSTICK_MAPPED_MIN: 'mapear para',
	RC_GET_JOYSTICK_MAPPED_MAX: '~',
	RC_GET_JOYSTICK_MAPPED_TOOLTIP: 'Ler joystick remoto e mapear para intervalo especificado',
	RC_GET_BUTTON_PREFIX: 'RC botão',
	RC_GET_BUTTON_SUFFIX: 'estado',
	RC_GET_BUTTON_TOOLTIP: 'Ler estado botão remoto (0=pressionado, 1=solto)',
	RC_IS_BUTTON_PRESSED_PREFIX: 'RC botão',
	RC_IS_BUTTON_PRESSED_SUFFIX: 'pressionado?',
	RC_IS_BUTTON_PRESSED_TOOLTIP: 'Verificar se botão remoto está pressionado',

	// Blocos status RC
	RC_IS_CONNECTED: 'RC conectado?',
	RC_IS_CONNECTED_TOOLTIP: 'Verificar se dados recebidos em 500ms',

        // === Serial Monitor ===
        MONITOR_BUTTON_TITLE: 'Abrir monitor',
        MONITOR_BUTTON_STOP_TITLE: 'Parar monitor',
        MONITOR_BUTTON_DISABLED_TITLE: 'Monitor (apenas para CyberBrick)',
        MONITOR_STARTING: 'Iniciando monitor...',
        MONITOR_CONNECTED: 'Conectado a {0}',
        MONITOR_STOPPED: 'Monitor parado',
        MONITOR_DEVICE_NOT_FOUND: 'Dispositivo CyberBrick não encontrado',
        MONITOR_DEVICE_DISCONNECTED: 'Dispositivo CyberBrick desconectado',
        MONITOR_CONNECTION_FAILED: 'Falha ao conectar ao dispositivo',
        MONITOR_CLOSED_FOR_UPLOAD: 'Monitor pausado para upload',
