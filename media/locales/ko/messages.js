/**
 * @license
 * Copyright 2024 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file contains translations derived from Blockly project
 * Copyright 2012 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

// Define translations for Korean
window.languageManager.loadMessages('ko', {
	// UI Elements
	BLOCKS_TAB: '블록',
	CODE_TAB: '코드',
	BOARD_SELECT_LABEL: '보드 선택:',

	// Board Names
	BOARD_NONE: '없음',
	BOARD_UNO: '아두이노 우노',
	BOARD_NANO: '아두이노 나노',
	BOARD_MEGA: '아두이노 메가',
	BOARD_ESP32: 'ESP32',
	BOARD_SUPERMINI: '수퍼 미니',

	// Block Categories
	CATEGORY_LOGIC: '논리',
	CATEGORY_LOOPS: '반복',
	CATEGORY_MATH: '수학',
	CATEGORY_TEXT: '텍스트',
	CATEGORY_LISTS: '리스트',
	CATEGORY_VARIABLES: '변수',
	CATEGORY_FUNCTIONS: '함수',
	CATEGORY_ARDUINO: '아두이노',

	// Arduino Block Labels
	ARDUINO_SETUP: '설정',
	ARDUINO_LOOP: '루프',
	ARDUINO_DIGITAL_WRITE: '디지털 쓰기',
	ARDUINO_DIGITAL_READ: '디지털 읽기',
	ARDUINO_ANALOG_WRITE: '아날로그 쓰기',
	ARDUINO_ANALOG_READ: '아날로그 읽기',
	ARDUINO_PIN: '핀',
	ARDUINO_VALUE: '값',
	ARDUINO_DELAY: '지연',
	ARDUINO_DELAY_MS: '밀리초',
	ARDUINO_PULLUP: '내부 풀업 활성화',
	ARDUINO_MODE: '모드',
	ARDUINO_MODE_INPUT: '입력',
	ARDUINO_MODE_OUTPUT: '출력',

	// Threshold Function Block Labels
	THRESHOLD_PIN: '에서',
	THRESHOLD_VALUE: '만약 >',
	THRESHOLD_HIGH_VALUE: '=',
	THRESHOLD_LOW_VALUE: '아니면',
	THRESHOLD_TOOLTIP_SETUP:
		'임계값 함수를 구성합니다. 아날로그 입력이 임계값을 초과하면 첫 번째 출력을 반환하고, 그렇지 않으면 두 번째 출력을 반환합니다.',
	THRESHOLD_TOOLTIP_READ: '임계값 함수에서 값 가져오기',

	// Duration block
	DURATION_REPEAT: '반복',
	DURATION_TIME: '시간',
	DURATION_MS: '밀리초',
	DURATION_DO: '실행',

	// Print block
	TEXT_PRINT_SHOW: '출력',
	TEXT_PRINT_NEWLINE: '줄바꿈',

	// Pin Mode block
	PIN_MODE_SET: '설정',

	// Function Block Labels
	FUNCTION_CREATE: '함수 생성',
	FUNCTION_NAME: '이름',
	FUNCTION_PARAMS: '매개변수',
	FUNCTION_RETURN: '반환',
	FUNCTION_CALL: '호출',

	// Logic Block Labels
	LOGIC_IF: '만약',
	LOGIC_ELSE: '아니면',
	LOGIC_THEN: '이면',
	LOGIC_AND: '그리고',
	LOGIC_OR: '또는',
	LOGIC_NOT: '아님',
	LOGIC_TRUE: '참',
	LOGIC_FALSE: '거짓',

	// Loop Block Labels
	LOOP_REPEAT: '반복',
	LOOP_WHILE: '동안',
	LOOP_UNTIL: '까지',
	LOOP_FOR: '위한',
	LOOP_FOREACH: '각각에 대해',
	LOOP_BREAK: '중단',
	LOOP_CONTINUE: '계속',

	// Math Block Labels
	MATH_NUMBER: '숫자',
	MATH_ARITHMETIC: '산술',
	MATH_OPERATIONS: '연산',
	MATH_ADD: '더하기',
	MATH_SUBTRACT: '빼기',
	MATH_MULTIPLY: '곱하기',
	MATH_DIVIDE: '나누기',
	MATH_POWER: '제곱',

	// Math Map Block
	MATH_MAP_VALUE: '매핑',
	MATH_MAP_TOOLTIP:
		'숫자를 한 범위에서 다른 범위로 다시 매핑합니다. 예를 들어, map(value, 0, 1023, 0, 255)는 아날로그 입력을 8비트 PWM 출력으로 스케일링합니다.',

	// Error Messages
	ERROR_BOARD_NOT_SELECTED: '보드를 먼저 선택하세요',
	ERROR_INVALID_PIN: '잘못된 핀 번호',
	ERROR_INVALID_VALUE: '잘못된 값',
	ERROR_MISSING_TRANSLATION: '번역 누락',

	// Blockly core messages
	ADD: '추가',
	REMOVE: '제거',
	RENAME: '이름 바꾸기',
	NEW: '새로 만들기',
	ADD_COMMENT: '주석 추가',
	REMOVE_COMMENT: '주석 제거',
	DUPLICATE_BLOCK: '복제',
	HELP: '도움말',
	UNDO: '실행 취소',
	REDO: '다시 실행',
	COLLAPSE_BLOCK: '블록 접기',
	EXPAND_BLOCK: '블록 펼치기',
	DELETE_BLOCK: '블록 삭제',
	DELETE_X_BLOCKS: '%1 블록 삭제',
	DELETE_ALL_BLOCKS: '모든 %1 블록을 삭제하시겠습니까?',
	CLEAN_UP: '블록 정리',
	COLLAPSE_ALL: '블록 모두 접기',
	EXPAND_ALL: '블록 모두 펼치기',
	DISABLE_BLOCK: '블록 비활성화',
	ENABLE_BLOCK: '블록 활성화',
	INLINE_INPUTS: '인라인 입력',
	EXTERNAL_INPUTS: '외부 입력',

	// Variable & Function messages
	RENAME_VARIABLE: '변수 이름 바꾸기...',
	NEW_VARIABLE: '변수 만들기...',
	DELETE_VARIABLE: '%1 변수 삭제',
	PROCEDURE_ALREADY_EXISTS: '"%1"이라는 이름의 프로시저가 이미 존재합니다.',

	// Logic block messages
	CONTROLS_IF_MSG_IF: '만약',
	CONTROLS_IF_MSG_THEN: '이면',
	CONTROLS_IF_MSG_ELSE: '아니면',
	CONTROLS_IF_MSG_ELSEIF: '아니면 만약',
	CONTROLS_IF_IF_TITLE_IF: '만약',
	CONTROLS_IF_ELSEIF_TITLE_ELSEIF: '아니면 만약',
	CONTROLS_IF_ELSE_TITLE_ELSE: '아니면',
	LOGIC_COMPARE_TOOLTIP_EQ: '두 입력이 같으면 참을 반환합니다.',
	LOGIC_COMPARE_TOOLTIP_NEQ: '두 입력이 같지 않으면 참을 반환합니다.',
	LOGIC_COMPARE_TOOLTIP_LT: '첫 번째 입력이 두 번째 입력보다 작으면 참을 반환합니다.',
	LOGIC_COMPARE_TOOLTIP_LTE: '첫 번째 입력이 두 번째 입력보다 작거나 같으면 참을 반환합니다.',
	LOGIC_COMPARE_TOOLTIP_GT: '첫 번째 입력이 두 번째 입력보다 크면 참을 반환합니다.',
	LOGIC_COMPARE_TOOLTIP_GTE: '첫 번째 입력이 두 번째 입력보다 크거나 같으면 참을 반환합니다.',
	LOGIC_OPERATION_AND: '그리고',
	LOGIC_OPERATION_OR: '또는',
	LOGIC_NEGATE_TITLE: '아님 %1',
	LOGIC_BOOLEAN_TRUE: '참',
	LOGIC_BOOLEAN_FALSE: '거짓',
	LOGIC_NULL: '널',

	// Additional Logic Block Messages
	LOGIC_COMPARE_HELPURL: 'https://ko.wikipedia.org/wiki/부등식',
	LOGIC_NEGATE_HELPURL: 'https://github.com/google/blockly/wiki/Logic#not',
	LOGIC_NEGATE_TOOLTIP: '입력이 거짓이면 참을 반환합니다. 입력이 참이면 거짓을 반환합니다.',
	LOGIC_OPERATION_TOOLTIP_AND: '두 입력이 모두 참이면 참을 반환합니다.',
	LOGIC_OPERATION_TOOLTIP_OR: '입력 중 하나라도 참이면 참을 반환합니다.',
	LOGIC_BOOLEAN_TOOLTIP: '참 또는 거짓을 반환합니다.',

	// Loop block messages
	CONTROLS_REPEAT_TITLE: '%1 번 반복',
	CONTROLS_WHILEUNTIL_OPERATOR_WHILE: '다음 동안 반복:',
	CONTROLS_WHILEUNTIL_OPERATOR_UNTIL: '다음까지 반복:',
	CONTROLS_FOR_TITLE: '%1을(를) %2에서 %3까지 %4 단계로 세기',
	CONTROLS_FLOW_STATEMENTS_OPERATOR_BREAK: '반복문 탈출',
	CONTROLS_FLOW_STATEMENTS_OPERATOR_CONTINUE: '다음 반복으로 계속',
	CONTROLS_REPEAT_TOOLTIP: '명령을 여러 번 실행합니다.',
	CONTROLS_WHILEUNTIL_TOOLTIP_WHILE: '값이 참인 동안 명령을 실행합니다.',
	CONTROLS_WHILEUNTIL_TOOLTIP_UNTIL: '값이 거짓인 동안 명령을 실행합니다.',
	CONTROLS_FOR_TOOLTIP: '시작 숫자부터 끝 숫자까지 지정된 간격으로 카운트합니다.',
	CONTROLS_FLOW_STATEMENTS_WARNING: '경고: 이 블록은 반복문 안에서만 사용할 수 있습니다.',

	// Math block messages
	MATH_NUMBER_HELPURL: 'https://ko.wikipedia.org/wiki/수_(수학)',
	MATH_NUMBER_TOOLTIP: '숫자입니다.',
	MATH_ARITHMETIC_OPERATOR_ADD: '+',
	MATH_ARITHMETIC_OPERATOR_MINUS: '-',
	MATH_ARITHMETIC_OPERATOR_MULTIPLY: '×',
	MATH_ARITHMETIC_OPERATOR_DIVIDE: '÷',
	MATH_ARITHMETIC_OPERATOR_POWER: '^',
	MATH_SINGLE_OPERATOR_ROOT: '제곱근',
	MATH_SINGLE_OPERATOR_ABSOLUTE: '절댓값',
	MATH_IS_EVEN: '짝수입니까',
	MATH_IS_ODD: '홀수입니까',
	MATH_IS_PRIME: '소수입니까',
	MATH_IS_WHOLE: '정수입니까',
	MATH_IS_POSITIVE: '양수입니까',
	MATH_IS_NEGATIVE: '음수입니까',
	MATH_ARITHMETIC_HELPURL: 'https://ko.wikipedia.org/wiki/산술',
	MATH_ARITHMETIC_TOOLTIP_ADD: '두 숫자의 합을 반환합니다.',
	MATH_ARITHMETIC_TOOLTIP_MINUS: '두 숫자의 차를 반환합니다.',
	MATH_ARITHMETIC_TOOLTIP_MULTIPLY: '두 숫자의 곱을 반환합니다.',
	MATH_ARITHMETIC_TOOLTIP_DIVIDE: '두 숫자의 몫을 반환합니다.',
	MATH_ARITHMETIC_TOOLTIP_POWER: '첫 번째 숫자에 두 번째 숫자를 제곱한 결과를 반환합니다.',

	// Text block messages
	TEXT_JOIN_TITLE_CREATEWITH: '텍스트 만들기:',
	TEXT_CREATE_JOIN_TITLE_JOIN: '결합',
	TEXT_LENGTH_TITLE: '%1의 길이',
	TEXT_ISEMPTY_TITLE: '%1이(가) 비어 있습니까',
	TEXT_INDEXOF_OPERATOR_FIRST: '텍스트의 첫 번째 위치 찾기',
	TEXT_INDEXOF_OPERATOR_LAST: '텍스트의 마지막 위치 찾기',
	TEXT_CHARAT_FROM_START: '글자 가져오기 #',
	TEXT_CHARAT_FROM_END: '끝에서부터 글자 가져오기 #',
	TEXT_CHARAT_FIRST: '첫 번째 글자 가져오기',
	TEXT_CHARAT_LAST: '마지막 글자 가져오기',
	TEXT_CHARAT_RANDOM: '임의의 글자 가져오기',
	TEXT_JOIN_TOOLTIP: '여러 항목을 결합하여 텍스트를 만듭니다.',
	TEXT_APPEND_VARIABLE: '항목',
	TEXT_APPEND_TOOLTIP: '"%1" 변수에 텍스트를 추가합니다.',
	TEXT_LENGTH_TOOLTIP: '제공된 텍스트의 글자 수(공백 포함)를 반환합니다.',
	TEXT_ISEMPTY_TOOLTIP: '제공된 텍스트가 비어 있으면 참을 반환합니다.',

	// List block messages
	LISTS_CREATE_EMPTY_TITLE: '빈 리스트 만들기',
	LISTS_CREATE_WITH_INPUT_WITH: '리스트 만들기:',
	LISTS_LENGTH_TITLE: '%1의 길이',
	LISTS_ISEMPTY_TITLE: '%1이(가) 비어 있습니까',
	LISTS_INDEXOF_FIRST: '항목의 첫 번째 위치 찾기',
	LISTS_INDEXOF_LAST: '항목의 마지막 위치 찾기',
	LISTS_GET_INDEX_GET: '가져오기',
	LISTS_GET_INDEX_REMOVE: '제거',
	LISTS_GET_INDEX_FROM_START: '#',
	LISTS_GET_INDEX_FROM_END: '끝에서부터 #',
	LISTS_GET_INDEX_FIRST: '첫 번째',
	LISTS_GET_INDEX_LAST: '마지막',
	LISTS_GET_INDEX_RANDOM: '임의',
	LISTS_CREATE_WITH_TOOLTIP: '원하는 수의 항목으로 리스트를 만듭니다.',
	LISTS_CREATE_EMPTY_TOOLTIP: '데이터 레코드가 없는 길이가 0인 리스트를 반환합니다.',
	LISTS_LENGTH_TOOLTIP: '리스트의 길이를 반환합니다.',
	LISTS_ISEMPTY_TOOLTIP: '리스트가 비어 있으면 참을 반환합니다.',

	// Variables
	VARIABLES_SET: '%1을(를) %2(으)로 설정',
	VARIABLES_GET: '%1',
	VARIABLES_DEFAULT_NAME: '항목',

	// If conditions
	CONTROLS_IF_TOOLTIP_1: '값이 참이면 명령을 실행합니다.',
	CONTROLS_IF_TOOLTIP_2: '값이 참이면 첫 번째 명령 블록을 실행하고, 그렇지 않으면 두 번째 명령 블록을 실행합니다.',
	CONTROLS_IF_TOOLTIP_3:
		'첫 번째 값이 참이면 첫 번째 명령 블록을 실행합니다. 그렇지 않고, 두 번째 값이 참이면 두 번째 명령 블록을 실행합니다.',
	CONTROLS_IF_TOOLTIP_4:
		'첫 번째 값이 참이면 첫 번째 명령 블록을 실행합니다. 그렇지 않고, 두 번째 값이 참이면 두 번째 명령 블록을 실행합니다. 모든 값이 거짓이면 마지막 명령 블록을 실행합니다.',

	// Procedures
	PROCEDURES_DEFNORETURN_TITLE: '',
	PROCEDURES_DEFNORETURN_PROCEDURE: '무언가 실행',
	PROCEDURES_BEFORE_PARAMS: '매개변수:',
	PROCEDURES_CALL_BEFORE_PARAMS: '매개변수:',
	PROCEDURES_DEFNORETURN_DO: '',
	PROCEDURES_DEFNORETURN_TOOLTIP: '출력이 없는 함수를 만듭니다.',
	PROCEDURES_DEFRETURN_RETURN: '반환',
	PROCEDURES_DEFRETURN_TOOLTIP: '출력이 있는 함수를 만듭니다.',
	PROCEDURES_DEFRETURN_COMMENT: '이 함수를 설명하세요...',
	PROCEDURES_DEFRETURN_PROCEDURE: '반환값이 있는 함수',
	PROCEDURES_DEFRETURN_DO: '',
	PROCEDURES_CALLNORETURN_HELPURL: 'https://ko.wikipedia.org/wiki/프로시저_(컴퓨터_과학)',
	PROCEDURES_CALLNORETURN_TOOLTIP: '사용자 정의 함수를 실행합니다.',
	PROCEDURES_CALLRETURN_HELPURL: 'https://ko.wikipedia.org/wiki/프로시저_(컴퓨터_과학)',
	PROCEDURES_CALLRETURN_TOOLTIP: '사용자 정의 함수를 실행하고 그 출력을 사용합니다.',

	// Seven Segment Display
	SEVEN_SEGMENT_DISPLAY: '7세그먼트 디스플레이',
	SEVEN_SEGMENT_COMMON_CATHODE: '공통 캐소드',
	SEVEN_SEGMENT_COMMON_ANODE: '공통 애노드',
	SEVEN_SEGMENT_NUMBER: '숫자 (0-9):',
	SEVEN_SEGMENT_DECIMAL_POINT: '소수점',
	SEVEN_SEGMENT_TOOLTIP: '7세그먼트 디스플레이에 숫자(0-9)와 선택적으로 소수점을 표시합니다.',
	// Seven Segment Display Pins
	SEVEN_SEGMENT_PINS_SET: '7세그먼트 디스플레이 핀 설정',
	SEVEN_SEGMENT_PINS_TOOLTIP: '7세그먼트 디스플레이의 각 세그먼트(A-G)와 소수점(DP)에 대한 핀을 구성합니다.',
});
