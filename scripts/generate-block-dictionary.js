/**
 * @license
 * Copyright 2025 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 *
 * 積木字典生成腳本
 * 用於生成 MCP Server 使用的靜態積木字典
 *
 * 執行方式: npm run generate:dictionary
 */

const fs = require('fs');
const path = require('path');

// 支援的板卡
const SUPPORTED_BOARDS = ['arduino_uno', 'arduino_nano', 'arduino_mega', 'esp32', 'esp32_supermini'];

// 分類定義
const CATEGORIES = [
	{ id: 'arduino', name: { 'zh-hant': 'Arduino', en: 'Arduino' }, colour: '#00979D' },
	{ id: 'motors', name: { 'zh-hant': '馬達', en: 'Motors' }, colour: '#D28230' },
	{ id: 'sensors', name: { 'zh-hant': '感測器', en: 'Sensors' }, colour: '#5CA65C' },
	{ id: 'vision', name: { 'zh-hant': '視覺感測', en: 'Vision' }, colour: '#7B68EE' },
	{ id: 'displays', name: { 'zh-hant': '顯示器', en: 'Displays' }, colour: '#FF6680' },
	{ id: 'communication', name: { 'zh-hant': '通訊', en: 'Communication' }, colour: '#4A90D9' },
	{ id: 'functions', name: { 'zh-hant': '函式', en: 'Functions' }, colour: '#9966FF' },
	{ id: 'logic', name: { 'zh-hant': '邏輯', en: 'Logic' }, colour: '#5B80A5' },
	{ id: 'loops', name: { 'zh-hant': '迴圈', en: 'Loops' }, colour: '#5BA55B' },
	{ id: 'math', name: { 'zh-hant': '數學', en: 'Math' }, colour: '#5B67A5' },
	{ id: 'text', name: { 'zh-hant': '文字', en: 'Text' }, colour: '#5BA58C' },
	{ id: 'lists', name: { 'zh-hant': '清單', en: 'Lists' }, colour: '#745BA5' },
	{ id: 'cyberbrick', name: { 'zh-hant': 'CyberBrick', en: 'CyberBrick' }, colour: '#00A0A0' },
	{ id: 'x11', name: { 'zh-hant': 'X11 擴展板', en: 'X11 Extension' }, colour: '#34B4B4' },
	{ id: 'x12', name: { 'zh-hant': 'X12 擴展板', en: 'X12 Extension' }, colour: '#34B434' },
	{ id: 'rc', name: { 'zh-hant': 'RC 遙控', en: 'RC Remote' }, colour: '#34D4D4' },
];

/**
 * 手動維護的積木定義
 * 由於積木定義使用動態 JS，這裡採用手動維護的方式確保準確性
 */
const BLOCK_DEFINITIONS = [
	// === Arduino 基礎積木 ===
	{
		type: 'arduino_setup',
		category: 'arduino',
		names: { 'zh-hant': '設定', en: 'Setup' },
		descriptions: {
			'zh-hant': 'Arduino 程式的 setup() 函式，在程式開始時執行一次',
			en: 'Arduino setup() function, runs once at program start',
		},
		fields: [],
		inputs: [{ name: 'SETUP', type: 'statement', label: { 'zh-hant': '設定', en: 'Setup' } }],
		boards: SUPPORTED_BOARDS,
		tags: ['setup', 'arduino', '設定', '初始化'],
	},
	{
		type: 'arduino_loop',
		category: 'arduino',
		names: { 'zh-hant': '重複', en: 'Loop' },
		descriptions: {
			'zh-hant': 'Arduino 程式的 loop() 函式，會不斷重複執行',
			en: 'Arduino loop() function, runs repeatedly',
		},
		fields: [],
		inputs: [{ name: 'LOOP', type: 'statement', label: { 'zh-hant': '重複執行', en: 'Loop' } }],
		boards: SUPPORTED_BOARDS,
		tags: ['loop', 'arduino', '迴圈', '重複'],
	},
	{
		type: 'digital_write',
		category: 'arduino',
		names: { 'zh-hant': '數位寫入', en: 'Digital Write' },
		descriptions: {
			'zh-hant': '設定數位腳位的輸出為 HIGH (高電位) 或 LOW (低電位)',
			en: 'Set a digital pin to HIGH or LOW',
		},
		fields: [
			{
				name: 'PIN',
				type: 'dropdown',
				label: { 'zh-hant': '腳位', en: 'Pin' },
				options: 'dynamic:digitalPins',
			},
			{
				name: 'VALUE',
				type: 'dropdown',
				label: { 'zh-hant': '數值', en: 'Value' },
				options: [
					{ value: 'HIGH', label: { 'zh-hant': '高', en: 'HIGH' } },
					{ value: 'LOW', label: { 'zh-hant': '低', en: 'LOW' } },
				],
			},
		],
		inputs: [],
		boards: SUPPORTED_BOARDS,
		tags: ['digital', 'write', 'gpio', '數位', '寫入', '輸出'],
	},
	{
		type: 'digital_read',
		category: 'arduino',
		names: { 'zh-hant': '數位讀取', en: 'Digital Read' },
		descriptions: {
			'zh-hant': '讀取數位腳位的狀態，返回 HIGH 或 LOW',
			en: 'Read the state of a digital pin, returns HIGH or LOW',
		},
		fields: [
			{
				name: 'PIN',
				type: 'dropdown',
				label: { 'zh-hant': '腳位', en: 'Pin' },
				options: 'dynamic:digitalPins',
			},
		],
		inputs: [],
		output: { type: 'Boolean' },
		boards: SUPPORTED_BOARDS,
		tags: ['digital', 'read', 'gpio', '數位', '讀取', '輸入'],
	},
	{
		type: 'analog_write',
		category: 'arduino',
		names: { 'zh-hant': '類比寫入', en: 'Analog Write' },
		descriptions: {
			'zh-hant': '使用 PWM 設定類比輸出值 (0-255 或 ESP32 0-4095)',
			en: 'Set analog output value using PWM (0-255 or ESP32 0-4095)',
		},
		fields: [
			{
				name: 'PIN',
				type: 'dropdown',
				label: { 'zh-hant': '腳位', en: 'Pin' },
				options: 'dynamic:pwmPins',
			},
		],
		inputs: [{ name: 'VALUE', type: 'value', label: { 'zh-hant': '數值', en: 'Value' }, check: 'Number' }],
		boards: SUPPORTED_BOARDS,
		tags: ['analog', 'write', 'pwm', '類比', '寫入'],
	},
	{
		type: 'analog_read',
		category: 'arduino',
		names: { 'zh-hant': '類比讀取', en: 'Analog Read' },
		descriptions: {
			'zh-hant': '讀取類比腳位的值 (Arduino: 0-1023, ESP32: 0-4095)',
			en: 'Read analog pin value (Arduino: 0-1023, ESP32: 0-4095)',
		},
		fields: [
			{
				name: 'PIN',
				type: 'dropdown',
				label: { 'zh-hant': '腳位', en: 'Pin' },
				options: 'dynamic:analogPins',
			},
		],
		inputs: [],
		output: { type: 'Number' },
		boards: SUPPORTED_BOARDS,
		tags: ['analog', 'read', 'adc', '類比', '讀取'],
	},
	{
		type: 'delay_ms',
		category: 'arduino',
		names: { 'zh-hant': '延遲', en: 'Delay' },
		descriptions: {
			'zh-hant': '暫停程式執行指定的毫秒數',
			en: 'Pause program execution for specified milliseconds',
		},
		fields: [
			{
				name: 'MS',
				type: 'number',
				label: { 'zh-hant': '毫秒', en: 'Milliseconds' },
				default: 1000,
				min: 0,
			},
		],
		inputs: [],
		boards: SUPPORTED_BOARDS,
		tags: ['delay', 'wait', 'time', '延遲', '等待', '時間'],
	},
	{
		type: 'pin_mode',
		category: 'arduino',
		names: { 'zh-hant': '設定腳位模式', en: 'Pin Mode' },
		descriptions: {
			'zh-hant': '設定腳位為輸入或輸出模式',
			en: 'Set pin mode to INPUT or OUTPUT',
		},
		fields: [
			{
				name: 'PIN',
				type: 'dropdown',
				label: { 'zh-hant': '腳位', en: 'Pin' },
				options: 'dynamic:digitalPins',
			},
			{
				name: 'MODE',
				type: 'dropdown',
				label: { 'zh-hant': '模式', en: 'Mode' },
				options: [
					{ value: 'INPUT', label: { 'zh-hant': '輸入', en: 'INPUT' } },
					{ value: 'OUTPUT', label: { 'zh-hant': '輸出', en: 'OUTPUT' } },
					{ value: 'INPUT_PULLUP', label: { 'zh-hant': '輸入上拉', en: 'INPUT_PULLUP' } },
				],
			},
		],
		inputs: [],
		boards: SUPPORTED_BOARDS,
		tags: ['pin', 'mode', 'gpio', '腳位', '模式'],
	},

	// === 伺服馬達積木 ===
	{
		type: 'servo_setup',
		category: 'motors',
		names: { 'zh-hant': '設定伺服馬達', en: 'Setup Servo' },
		descriptions: {
			'zh-hant': '初始化伺服馬達並設定控制腳位',
			en: 'Initialize a servo motor and set control pin',
		},
		fields: [
			{
				name: 'VAR',
				type: 'text',
				label: { 'zh-hant': '名稱', en: 'Name' },
				default: 'myServo',
			},
			{
				name: 'PIN',
				type: 'dropdown',
				label: { 'zh-hant': '腳位', en: 'Pin' },
				options: 'dynamic:pwmPins',
			},
		],
		inputs: [],
		boards: SUPPORTED_BOARDS,
		tags: ['servo', 'motor', 'pwm', '伺服', '馬達', '舵機'],
		relatedBlocks: ['servo_move', 'servo_stop'],
	},
	{
		type: 'servo_move',
		category: 'motors',
		names: { 'zh-hant': '旋轉伺服馬達', en: 'Move Servo' },
		descriptions: {
			'zh-hant': '控制伺服馬達轉動到指定角度 (0-180 度)',
			en: 'Move servo motor to specified angle (0-180 degrees)',
		},
		fields: [
			{
				name: 'VAR',
				type: 'dropdown',
				label: { 'zh-hant': '馬達', en: 'Servo' },
				options: 'dynamic:servoVars',
			},
			{
				name: 'ANGLE',
				type: 'number',
				label: { 'zh-hant': '角度', en: 'Angle' },
				default: 90,
				min: 0,
				max: 180,
			},
		],
		inputs: [],
		boards: SUPPORTED_BOARDS,
		tags: ['servo', 'move', 'angle', '伺服', '轉動', '角度'],
		relatedBlocks: ['servo_setup', 'servo_stop'],
	},
	{
		type: 'servo_stop',
		category: 'motors',
		names: { 'zh-hant': '停止伺服馬達', en: 'Stop Servo' },
		descriptions: {
			'zh-hant': '停止伺服馬達的訊號輸出',
			en: 'Stop servo motor signal output',
		},
		fields: [
			{
				name: 'VAR',
				type: 'dropdown',
				label: { 'zh-hant': '馬達', en: 'Servo' },
				options: 'dynamic:servoVars',
			},
		],
		inputs: [],
		boards: SUPPORTED_BOARDS,
		tags: ['servo', 'stop', '伺服', '停止'],
		relatedBlocks: ['servo_setup', 'servo_move'],
	},

	// === 編碼馬達積木 ===
	{
		type: 'encoder_setup',
		category: 'motors',
		names: { 'zh-hant': '設定編碼馬達', en: 'Setup Encoder' },
		descriptions: {
			'zh-hant': '初始化編碼馬達並設定 A/B 腳位，可選擇使用硬體中斷提高精確度',
			en: 'Initialize encoder motor with A/B pins, optionally use hardware interrupt for accuracy',
		},
		fields: [
			{ name: 'VAR', type: 'text', label: { 'zh-hant': '名稱', en: 'Name' }, default: 'myEncoder' },
			{ name: 'USE_INTERRUPT', type: 'checkbox', label: { 'zh-hant': '使用硬體中斷', en: 'Use Interrupt' }, default: false },
			{ name: 'PIN_A', type: 'dropdown', label: { 'zh-hant': 'A腳位', en: 'Pin A' }, options: 'dynamic:digitalPins' },
			{ name: 'PIN_B', type: 'dropdown', label: { 'zh-hant': 'B腳位', en: 'Pin B' }, options: 'dynamic:digitalPins' },
		],
		inputs: [],
		boards: SUPPORTED_BOARDS,
		tags: ['encoder', 'motor', 'interrupt', '編碼', '馬達', '中斷'],
		relatedBlocks: ['encoder_read', 'encoder_reset', 'encoder_pid_setup'],
	},
	{
		type: 'encoder_read',
		category: 'motors',
		names: { 'zh-hant': '讀取編碼馬達', en: 'Read Encoder' },
		descriptions: {
			'zh-hant': '讀取編碼馬達的當前位置',
			en: 'Read current position of encoder motor',
		},
		fields: [{ name: 'VAR', type: 'dropdown', label: { 'zh-hant': '馬達', en: 'Encoder' }, options: 'dynamic:encoderVars' }],
		inputs: [],
		output: { type: 'Number' },
		boards: SUPPORTED_BOARDS,
		tags: ['encoder', 'read', 'position', '編碼', '讀取', '位置'],
		relatedBlocks: ['encoder_setup', 'encoder_reset'],
	},
	{
		type: 'encoder_reset',
		category: 'motors',
		names: { 'zh-hant': '重設編碼馬達', en: 'Reset Encoder' },
		descriptions: {
			'zh-hant': '將編碼馬達位置重設為零',
			en: 'Reset encoder position to zero',
		},
		fields: [{ name: 'VAR', type: 'dropdown', label: { 'zh-hant': '馬達', en: 'Encoder' }, options: 'dynamic:encoderVars' }],
		inputs: [],
		boards: SUPPORTED_BOARDS,
		tags: ['encoder', 'reset', 'zero', '編碼', '重設', '歸零'],
		relatedBlocks: ['encoder_setup', 'encoder_read'],
	},

	// === 超音波感測器積木 ===
	{
		type: 'ultrasonic_sensor',
		category: 'sensors',
		names: { 'zh-hant': '超音波感測器', en: 'Ultrasonic Sensor' },
		descriptions: {
			'zh-hant': '設定超音波感測器的 Trig 和 Echo 腳位，可選擇使用硬體中斷提高精確度',
			en: 'Setup ultrasonic sensor Trig and Echo pins, optionally use hardware interrupt',
		},
		fields: [
			{ name: 'TRIG_PIN', type: 'dropdown', label: { 'zh-hant': 'Trig 腳位', en: 'Trig Pin' }, options: 'dynamic:digitalPins' },
			{ name: 'ECHO_PIN', type: 'dropdown', label: { 'zh-hant': 'Echo 腳位', en: 'Echo Pin' }, options: 'dynamic:digitalPins' },
			{ name: 'USE_INTERRUPT', type: 'checkbox', label: { 'zh-hant': '使用硬體中斷', en: 'Use Interrupt' }, default: false },
		],
		inputs: [],
		boards: SUPPORTED_BOARDS,
		tags: ['ultrasonic', 'sensor', 'distance', 'sonar', '超音波', '感測器', '距離'],
		relatedBlocks: ['ultrasonic_read'],
	},
	{
		type: 'ultrasonic_read',
		category: 'sensors',
		names: { 'zh-hant': '讀取超音波距離', en: 'Read Ultrasonic' },
		descriptions: {
			'zh-hant': '讀取超音波感測器測量的距離，單位為公分',
			en: 'Read distance measured by ultrasonic sensor in centimeters',
		},
		fields: [],
		inputs: [],
		output: { type: 'Number' },
		boards: SUPPORTED_BOARDS,
		tags: ['ultrasonic', 'read', 'distance', 'cm', '超音波', '讀取', '距離'],
		relatedBlocks: ['ultrasonic_sensor'],
	},

	// === HUSKYLENS 積木 ===
	{
		type: 'huskylens_init_i2c',
		category: 'vision',
		names: { 'zh-hant': '初始化 HUSKYLENS (I2C)', en: 'Init HUSKYLENS (I2C)' },
		descriptions: {
			'zh-hant': '使用 I2C 初始化 HUSKYLENS 智慧鏡頭',
			en: 'Initialize HUSKYLENS using I2C connection',
		},
		fields: [],
		inputs: [],
		boards: SUPPORTED_BOARDS,
		tags: ['huskylens', 'i2c', 'vision', 'camera', '鏡頭', '視覺', 'AI'],
		experimental: true,
		relatedBlocks: ['huskylens_set_algorithm', 'huskylens_request'],
	},
	{
		type: 'huskylens_init_uart',
		category: 'vision',
		names: { 'zh-hant': '初始化 HUSKYLENS (UART)', en: 'Init HUSKYLENS (UART)' },
		descriptions: {
			'zh-hant': '使用 UART 初始化 HUSKYLENS 智慧鏡頭，設定 RX/TX 腳位',
			en: 'Initialize HUSKYLENS using UART, set RX/TX pins',
		},
		fields: [
			{ name: 'RX_PIN', type: 'dropdown', label: { 'zh-hant': 'RX 腳位', en: 'RX Pin' }, options: 'dynamic:digitalPins' },
			{ name: 'TX_PIN', type: 'dropdown', label: { 'zh-hant': 'TX 腳位', en: 'TX Pin' }, options: 'dynamic:digitalPins' },
		],
		inputs: [],
		boards: SUPPORTED_BOARDS,
		tags: ['huskylens', 'uart', 'serial', 'vision', 'camera', '鏡頭', '視覺'],
		relatedBlocks: ['huskylens_set_algorithm', 'huskylens_request'],
	},
	{
		type: 'huskylens_set_algorithm',
		category: 'vision',
		names: { 'zh-hant': '設定 HUSKYLENS 演算法', en: 'Set HUSKYLENS Algorithm' },
		descriptions: {
			'zh-hant': '設定 HUSKYLENS 使用的辨識演算法',
			en: 'Set the recognition algorithm for HUSKYLENS',
		},
		fields: [
			{
				name: 'ALGORITHM',
				type: 'dropdown',
				label: { 'zh-hant': '演算法', en: 'Algorithm' },
				options: [
					{ value: 'ALGORITHM_FACE_RECOGNITION', label: { 'zh-hant': '人臉辨識', en: 'Face Recognition' } },
					{ value: 'ALGORITHM_OBJECT_TRACKING', label: { 'zh-hant': '物體追蹤', en: 'Object Tracking' } },
					{ value: 'ALGORITHM_OBJECT_RECOGNITION', label: { 'zh-hant': '物體辨識', en: 'Object Recognition' } },
					{ value: 'ALGORITHM_LINE_TRACKING', label: { 'zh-hant': '線路追蹤', en: 'Line Tracking' } },
					{ value: 'ALGORITHM_COLOR_RECOGNITION', label: { 'zh-hant': '顏色辨識', en: 'Color Recognition' } },
					{ value: 'ALGORITHM_TAG_RECOGNITION', label: { 'zh-hant': '標籤辨識', en: 'Tag Recognition' } },
					{ value: 'ALGORITHM_OBJECT_CLASSIFICATION', label: { 'zh-hant': '物體分類', en: 'Object Classification' } },
				],
			},
		],
		inputs: [],
		boards: SUPPORTED_BOARDS,
		tags: ['huskylens', 'algorithm', 'face', 'object', 'line', 'color', 'tag', '演算法', '辨識'],
		experimental: true,
		relatedBlocks: ['huskylens_init_i2c', 'huskylens_init_uart', 'huskylens_request'],
	},
	{
		type: 'huskylens_request',
		category: 'vision',
		names: { 'zh-hant': '請求 HUSKYLENS 辨識結果', en: 'Request HUSKYLENS Data' },
		descriptions: {
			'zh-hant': '從 HUSKYLENS 請求最新的辨識結果',
			en: 'Request latest recognition data from HUSKYLENS',
		},
		fields: [],
		inputs: [],
		boards: SUPPORTED_BOARDS,
		tags: ['huskylens', 'request', 'data', '請求', '資料'],
		relatedBlocks: ['huskylens_count_blocks', 'huskylens_count_arrows'],
	},
	{
		type: 'huskylens_count_blocks',
		category: 'vision',
		names: { 'zh-hant': 'HUSKYLENS 方塊數量', en: 'HUSKYLENS Block Count' },
		descriptions: {
			'zh-hant': '取得 HUSKYLENS 偵測到的方塊數量',
			en: 'Get the number of blocks detected by HUSKYLENS',
		},
		fields: [],
		inputs: [],
		output: { type: 'Number' },
		boards: SUPPORTED_BOARDS,
		tags: ['huskylens', 'blocks', 'count', '方塊', '數量'],
		relatedBlocks: ['huskylens_request', 'huskylens_get_block_info'],
	},
	{
		type: 'huskylens_get_block_info',
		category: 'vision',
		names: { 'zh-hant': '取得 HUSKYLENS 方塊資訊', en: 'Get HUSKYLENS Block Info' },
		descriptions: {
			'zh-hant': '取得指定方塊的資訊（位置、大小或 ID）',
			en: 'Get info of specified block (position, size or ID)',
		},
		fields: [
			{ name: 'INDEX', type: 'number', label: { 'zh-hant': '索引', en: 'Index' }, default: 0, min: 0 },
			{
				name: 'INFO_TYPE',
				type: 'dropdown',
				label: { 'zh-hant': '資訊類型', en: 'Info Type' },
				options: [
					{ value: 'xCenter', label: { 'zh-hant': 'X 中心', en: 'X Center' } },
					{ value: 'yCenter', label: { 'zh-hant': 'Y 中心', en: 'Y Center' } },
					{ value: 'width', label: { 'zh-hant': '寬度', en: 'Width' } },
					{ value: 'height', label: { 'zh-hant': '高度', en: 'Height' } },
					{ value: 'ID', label: { 'zh-hant': 'ID', en: 'ID' } },
				],
			},
		],
		inputs: [],
		output: { type: 'Number' },
		boards: SUPPORTED_BOARDS,
		tags: ['huskylens', 'block', 'info', 'position', '方塊', '資訊', '位置'],
		relatedBlocks: ['huskylens_count_blocks'],
	},

	// === 七段顯示器積木 ===
	{
		type: 'seven_segment_pins',
		category: 'displays',
		names: { 'zh-hant': '設定七段顯示器腳位', en: 'Setup Seven Segment Pins' },
		descriptions: {
			'zh-hant': '配置七段顯示器的各段(A-G)及小數點(DP)的連接腳位',
			en: 'Configure pin connections for seven segment display (A-G and DP)',
		},
		fields: [
			{ name: 'PIN_A', type: 'dropdown', label: { 'zh-hant': 'A 腳位', en: 'Pin A' }, options: 'dynamic:digitalPins' },
			{ name: 'PIN_B', type: 'dropdown', label: { 'zh-hant': 'B 腳位', en: 'Pin B' }, options: 'dynamic:digitalPins' },
			{ name: 'PIN_C', type: 'dropdown', label: { 'zh-hant': 'C 腳位', en: 'Pin C' }, options: 'dynamic:digitalPins' },
			{ name: 'PIN_D', type: 'dropdown', label: { 'zh-hant': 'D 腳位', en: 'Pin D' }, options: 'dynamic:digitalPins' },
			{ name: 'PIN_E', type: 'dropdown', label: { 'zh-hant': 'E 腳位', en: 'Pin E' }, options: 'dynamic:digitalPins' },
			{ name: 'PIN_F', type: 'dropdown', label: { 'zh-hant': 'F 腳位', en: 'Pin F' }, options: 'dynamic:digitalPins' },
			{ name: 'PIN_G', type: 'dropdown', label: { 'zh-hant': 'G 腳位', en: 'Pin G' }, options: 'dynamic:digitalPins' },
			{ name: 'PIN_DP', type: 'dropdown', label: { 'zh-hant': 'DP 腳位', en: 'Pin DP' }, options: 'dynamic:digitalPins' },
			{
				name: 'TYPE',
				type: 'dropdown',
				label: { 'zh-hant': '類型', en: 'Type' },
				options: [
					{ value: 'COMMON_CATHODE', label: { 'zh-hant': '共陰極', en: 'Common Cathode' } },
					{ value: 'COMMON_ANODE', label: { 'zh-hant': '共陽極', en: 'Common Anode' } },
				],
			},
		],
		inputs: [],
		boards: SUPPORTED_BOARDS,
		tags: ['seven', 'segment', 'display', '七段', '顯示器', 'LED'],
		relatedBlocks: ['seven_segment_display'],
	},
	{
		type: 'seven_segment_display',
		category: 'displays',
		names: { 'zh-hant': '七段顯示器顯示', en: 'Seven Segment Display' },
		descriptions: {
			'zh-hant': '在七段顯示器上顯示數字(0-9)，可選擇是否顯示小數點',
			en: 'Display a number (0-9) on seven segment display, optionally show decimal point',
		},
		fields: [
			{ name: 'NUMBER', type: 'number', label: { 'zh-hant': '數字', en: 'Number' }, default: 0, min: 0, max: 9 },
			{ name: 'DECIMAL_POINT', type: 'checkbox', label: { 'zh-hant': '小數點', en: 'Decimal Point' }, default: false },
		],
		inputs: [],
		boards: SUPPORTED_BOARDS,
		tags: ['seven', 'segment', 'display', 'number', '七段', '顯示', '數字'],
		relatedBlocks: ['seven_segment_pins'],
	},

	// === ESP32 特定積木 ===
	{
		type: 'esp32_pwm_setup',
		category: 'arduino',
		names: { 'zh-hant': 'ESP32 PWM 設定', en: 'ESP32 PWM Setup' },
		descriptions: {
			'zh-hant': '設定 ESP32 的 PWM 頻率和解析度。高頻率適用於馬達驅動晶片（20-75KHz）',
			en: 'Configure ESP32 PWM frequency and resolution. High frequency for motor drivers (20-75KHz)',
		},
		fields: [
			{
				name: 'FREQUENCY',
				type: 'number',
				label: { 'zh-hant': '頻率 (Hz)', en: 'Frequency (Hz)' },
				default: 5000,
				min: 1,
				max: 80000,
			},
			{
				name: 'RESOLUTION',
				type: 'dropdown',
				label: { 'zh-hant': '解析度', en: 'Resolution' },
				options: [
					{ value: '8', label: { 'zh-hant': '8 bit (0-255)', en: '8 bit (0-255)' } },
					{ value: '10', label: { 'zh-hant': '10 bit (0-1023)', en: '10 bit (0-1023)' } },
					{ value: '12', label: { 'zh-hant': '12 bit (0-4095)', en: '12 bit (0-4095)' } },
				],
			},
		],
		inputs: [],
		boards: ['esp32', 'esp32_supermini'],
		tags: ['esp32', 'pwm', 'ledc', 'frequency', 'resolution', '頻率', '解析度'],
		notes: {
			'zh-hant': '注意：頻率 × 2^解析度 ≤ 80,000,000',
			en: 'Note: frequency × 2^resolution ≤ 80,000,000',
		},
	},

	// === Pixetto 智慧鏡頭積木 ===
	{
		type: 'pixetto_init',
		category: 'vision',
		names: { 'zh-hant': '初始化 Pixetto', en: 'Init Pixetto' },
		descriptions: {
			'zh-hant': '初始化 Pixetto 智慧鏡頭，設定 UART 通訊腳位',
			en: 'Initialize Pixetto smart camera, set UART pins',
		},
		fields: [
			{ name: 'RX_PIN', type: 'dropdown', label: { 'zh-hant': 'RX 腳位', en: 'RX Pin' }, options: 'dynamic:digitalPins' },
			{ name: 'TX_PIN', type: 'dropdown', label: { 'zh-hant': 'TX 腳位', en: 'TX Pin' }, options: 'dynamic:digitalPins' },
		],
		inputs: [],
		boards: SUPPORTED_BOARDS,
		tags: ['pixetto', 'init', 'uart', 'camera', '鏡頭', '視覺', '初始化'],
		relatedBlocks: ['pixetto_is_detected', 'pixetto_set_mode'],
	},
	{
		type: 'pixetto_is_detected',
		category: 'vision',
		names: { 'zh-hant': 'Pixetto 偵測到物體', en: 'Pixetto Is Detected' },
		descriptions: {
			'zh-hant': '檢測 Pixetto 是否偵測到任何物體',
			en: 'Check if Pixetto detected any object',
		},
		fields: [],
		inputs: [],
		output: { type: 'Boolean' },
		boards: SUPPORTED_BOARDS,
		tags: ['pixetto', 'detect', 'object', '偵測', '物體'],
		relatedBlocks: ['pixetto_init'],
	},
	{
		type: 'pixetto_get_type_id',
		category: 'vision',
		names: { 'zh-hant': 'Pixetto 取得偵測類型 ID', en: 'Pixetto Get Type ID' },
		descriptions: {
			'zh-hant': '取得 Pixetto 偵測到的物體類型 ID',
			en: 'Get type ID of object detected by Pixetto',
		},
		fields: [],
		inputs: [],
		output: { type: 'Number' },
		boards: SUPPORTED_BOARDS,
		tags: ['pixetto', 'type', 'id', '類型'],
	},
	{
		type: 'pixetto_get_func_id',
		category: 'vision',
		names: { 'zh-hant': 'Pixetto 取得功能 ID', en: 'Pixetto Get Function ID' },
		descriptions: {
			'zh-hant': '取得 Pixetto 目前使用的功能 ID',
			en: 'Get current function ID of Pixetto',
		},
		fields: [],
		inputs: [],
		output: { type: 'Number' },
		boards: SUPPORTED_BOARDS,
		tags: ['pixetto', 'function', 'id', '功能'],
		experimental: true,
	},
	{
		type: 'pixetto_color_detect',
		category: 'vision',
		names: { 'zh-hant': 'Pixetto 偵測顏色', en: 'Pixetto Detect Color' },
		descriptions: {
			'zh-hant': '檢測 Pixetto 是否偵測到指定顏色的物體',
			en: 'Check if Pixetto detected specified color',
		},
		fields: [
			{
				name: 'COLOR',
				type: 'dropdown',
				label: { 'zh-hant': '顏色', en: 'Color' },
				options: [
					{ value: 'RED', label: { 'zh-hant': '紅色', en: 'Red' } },
					{ value: 'BLUE', label: { 'zh-hant': '藍色', en: 'Blue' } },
					{ value: 'GREEN', label: { 'zh-hant': '綠色', en: 'Green' } },
					{ value: 'YELLOW', label: { 'zh-hant': '黃色', en: 'Yellow' } },
					{ value: 'ORANGE', label: { 'zh-hant': '橙色', en: 'Orange' } },
					{ value: 'PURPLE', label: { 'zh-hant': '紫色', en: 'Purple' } },
					{ value: 'BLACK', label: { 'zh-hant': '黑色', en: 'Black' } },
					{ value: 'WHITE', label: { 'zh-hant': '白色', en: 'White' } },
				],
			},
		],
		inputs: [],
		output: { type: 'Boolean' },
		boards: SUPPORTED_BOARDS,
		tags: ['pixetto', 'color', 'detect', '顏色', '偵測'],
		experimental: true,
	},
	{
		type: 'pixetto_shape_detect',
		category: 'vision',
		names: { 'zh-hant': 'Pixetto 偵測形狀', en: 'Pixetto Detect Shape' },
		descriptions: {
			'zh-hant': '檢測 Pixetto 是否偵測到指定形狀的物體',
			en: 'Check if Pixetto detected specified shape',
		},
		fields: [
			{
				name: 'SHAPE',
				type: 'dropdown',
				label: { 'zh-hant': '形狀', en: 'Shape' },
				options: [
					{ value: 'TRIANGLE', label: { 'zh-hant': '三角形', en: 'Triangle' } },
					{ value: 'RECTANGLE', label: { 'zh-hant': '四邊形', en: 'Rectangle' } },
					{ value: 'PENTAGON', label: { 'zh-hant': '五邊形', en: 'Pentagon' } },
					{ value: 'HEXAGON', label: { 'zh-hant': '六邊形', en: 'Hexagon' } },
					{ value: 'CIRCLE', label: { 'zh-hant': '圓形', en: 'Circle' } },
				],
			},
		],
		inputs: [],
		output: { type: 'Boolean' },
		boards: SUPPORTED_BOARDS,
		tags: ['pixetto', 'shape', 'detect', '形狀', '偵測'],
		experimental: true,
	},
	{
		type: 'pixetto_face_detect',
		category: 'vision',
		names: { 'zh-hant': 'Pixetto 偵測到人臉', en: 'Pixetto Face Detected' },
		descriptions: {
			'zh-hant': '檢測 Pixetto 是否偵測到人臉',
			en: 'Check if Pixetto detected a face',
		},
		fields: [],
		inputs: [],
		output: { type: 'Boolean' },
		boards: SUPPORTED_BOARDS,
		tags: ['pixetto', 'face', 'detect', '人臉', '偵測'],
		experimental: true,
	},
	{
		type: 'pixetto_apriltag_detect',
		category: 'vision',
		names: { 'zh-hant': 'Pixetto 偵測 AprilTag', en: 'Pixetto Detect AprilTag' },
		descriptions: {
			'zh-hant': '檢測 Pixetto 是否偵測到指定 ID 的 AprilTag',
			en: 'Check if Pixetto detected AprilTag with specified ID',
		},
		fields: [],
		inputs: [{ name: 'TAG_ID', type: 'value', label: { 'zh-hant': '標籤 ID', en: 'Tag ID' }, check: 'Number' }],
		output: { type: 'Boolean' },
		boards: SUPPORTED_BOARDS,
		tags: ['pixetto', 'apriltag', 'tag', 'detect', '標籤', '偵測'],
		experimental: true,
	},
	{
		type: 'pixetto_neural_network',
		category: 'vision',
		names: { 'zh-hant': 'Pixetto 神經網路辨識', en: 'Pixetto Neural Network' },
		descriptions: {
			'zh-hant': '檢測 Pixetto 神經網路是否辨識出指定類別的物體',
			en: 'Check if Pixetto neural network recognized specified class',
		},
		fields: [],
		inputs: [{ name: 'CLASS_ID', type: 'value', label: { 'zh-hant': '類別 ID', en: 'Class ID' }, check: 'Number' }],
		output: { type: 'Boolean' },
		boards: SUPPORTED_BOARDS,
		tags: ['pixetto', 'neural', 'network', 'ai', '神經網路', '辨識'],
		experimental: true,
	},
	{
		type: 'pixetto_handwritten_digit',
		category: 'vision',
		names: { 'zh-hant': 'Pixetto 辨識手寫數字', en: 'Pixetto Handwritten Digit' },
		descriptions: {
			'zh-hant': '檢測 Pixetto 是否辨識出指定的手寫數字',
			en: 'Check if Pixetto recognized specified handwritten digit',
		},
		fields: [],
		inputs: [{ name: 'DIGIT', type: 'value', label: { 'zh-hant': '數字', en: 'Digit' }, check: 'Number' }],
		output: { type: 'Boolean' },
		boards: SUPPORTED_BOARDS,
		tags: ['pixetto', 'handwritten', 'digit', '手寫', '數字', '辨識'],
		experimental: true,
	},
	{
		type: 'pixetto_get_position',
		category: 'vision',
		names: { 'zh-hant': 'Pixetto 獲取偵測物體座標', en: 'Pixetto Get Position' },
		descriptions: {
			'zh-hant': '獲取 Pixetto 偵測到的物體位置或尺寸資訊',
			en: 'Get position or size info of object detected by Pixetto',
		},
		fields: [
			{
				name: 'POSITION_TYPE',
				type: 'dropdown',
				label: { 'zh-hant': '座標', en: 'Coordinate' },
				options: [
					{ value: 'X', label: { 'zh-hant': 'X 座標', en: 'X Position' } },
					{ value: 'Y', label: { 'zh-hant': 'Y 座標', en: 'Y Position' } },
					{ value: 'WIDTH', label: { 'zh-hant': '寬度', en: 'Width' } },
					{ value: 'HEIGHT', label: { 'zh-hant': '高度', en: 'Height' } },
				],
			},
		],
		inputs: [],
		output: { type: 'Number' },
		boards: SUPPORTED_BOARDS,
		tags: ['pixetto', 'position', 'coordinate', '位置', '座標'],
	},
	{
		type: 'pixetto_road_detect',
		category: 'vision',
		names: { 'zh-hant': 'Pixetto 道路偵測', en: 'Pixetto Road Detection' },
		descriptions: {
			'zh-hant': '獲取 Pixetto 道路偵測的相關資訊',
			en: 'Get road detection info from Pixetto',
		},
		fields: [
			{
				name: 'ROAD_INFO',
				type: 'dropdown',
				label: { 'zh-hant': '資訊', en: 'Info' },
				options: [
					{ value: 'CENTER_X', label: { 'zh-hant': '中心點 X', en: 'Center X' } },
					{ value: 'CENTER_Y', label: { 'zh-hant': '中心點 Y', en: 'Center Y' } },
					{ value: 'LEFT_X', label: { 'zh-hant': '左邊界 X', en: 'Left X' } },
					{ value: 'RIGHT_X', label: { 'zh-hant': '右邊界 X', en: 'Right X' } },
				],
			},
		],
		inputs: [],
		output: { type: 'Number' },
		boards: SUPPORTED_BOARDS,
		tags: ['pixetto', 'road', 'detect', '道路', '偵測'],
		experimental: true,
	},
	{
		type: 'pixetto_set_mode',
		category: 'vision',
		names: { 'zh-hant': '設定 Pixetto 功能模式', en: 'Set Pixetto Mode' },
		descriptions: {
			'zh-hant': '設定 Pixetto 智慧鏡頭的功能模式',
			en: 'Set the function mode of Pixetto smart camera',
		},
		fields: [
			{
				name: 'MODE',
				type: 'dropdown',
				label: { 'zh-hant': '模式', en: 'Mode' },
				options: [
					{ value: 'COLOR_DETECTION', label: { 'zh-hant': '顏色偵測', en: 'Color Detection' } },
					{ value: 'SHAPE_DETECTION', label: { 'zh-hant': '形狀偵測', en: 'Shape Detection' } },
					{ value: 'FACE_DETECTION', label: { 'zh-hant': '人臉偵測', en: 'Face Detection' } },
					{ value: 'APRILTAG_DETECTION', label: { 'zh-hant': 'AprilTag 偵測', en: 'AprilTag Detection' } },
					{ value: 'NEURAL_NETWORK', label: { 'zh-hant': '神經網路', en: 'Neural Network' } },
					{ value: 'HANDWRITTEN_DIGIT', label: { 'zh-hant': '手寫數字', en: 'Handwritten Digit' } },
					{ value: 'ROAD_DETECTION', label: { 'zh-hant': '道路偵測', en: 'Road Detection' } },
					{ value: 'BALL_DETECTION', label: { 'zh-hant': '球體偵測', en: 'Ball Detection' } },
					{ value: 'TEMPLATE_MATCHING', label: { 'zh-hant': '模板比對', en: 'Template Matching' } },
				],
			},
		],
		inputs: [],
		boards: SUPPORTED_BOARDS,
		tags: ['pixetto', 'mode', 'set', '模式', '設定'],
		experimental: true,
		relatedBlocks: ['pixetto_init'],
	},

	// === Blockly 內建邏輯積木 ===
	{
		type: 'controls_if',
		category: 'logic',
		names: { 'zh-hant': '如果', en: 'If' },
		descriptions: {
			'zh-hant': '如果條件為真，則執行內部的程式碼',
			en: 'If condition is true, execute the statements inside',
		},
		fields: [],
		inputs: [
			{ name: 'IF0', type: 'value', label: { 'zh-hant': '如果', en: 'if' }, check: 'Boolean' },
			{ name: 'DO0', type: 'statement', label: { 'zh-hant': '執行', en: 'do' } },
		],
		boards: SUPPORTED_BOARDS,
		tags: ['if', 'condition', 'logic', '如果', '條件', '邏輯'],
	},
	{
		type: 'logic_compare',
		category: 'logic',
		names: { 'zh-hant': '比較', en: 'Compare' },
		descriptions: {
			'zh-hant': '比較兩個值的大小或相等性',
			en: 'Compare two values for equality or size',
		},
		fields: [
			{
				name: 'OP',
				type: 'dropdown',
				label: { 'zh-hant': '運算子', en: 'Operator' },
				options: [
					{ value: 'EQ', label: { 'zh-hant': '=', en: '=' } },
					{ value: 'NEQ', label: { 'zh-hant': '≠', en: '≠' } },
					{ value: 'LT', label: { 'zh-hant': '<', en: '<' } },
					{ value: 'LTE', label: { 'zh-hant': '≤', en: '≤' } },
					{ value: 'GT', label: { 'zh-hant': '>', en: '>' } },
					{ value: 'GTE', label: { 'zh-hant': '≥', en: '≥' } },
				],
			},
		],
		inputs: [
			{ name: 'A', type: 'value', label: { 'zh-hant': 'A', en: 'A' } },
			{ name: 'B', type: 'value', label: { 'zh-hant': 'B', en: 'B' } },
		],
		output: { type: 'Boolean' },
		boards: SUPPORTED_BOARDS,
		tags: ['compare', 'logic', 'equal', 'greater', 'less', '比較', '邏輯', '相等', '大於', '小於'],
	},
	{
		type: 'logic_operation',
		category: 'logic',
		names: { 'zh-hant': '邏輯運算', en: 'Logic Operation' },
		descriptions: {
			'zh-hant': '執行 AND 或 OR 邏輯運算',
			en: 'Perform AND or OR logic operation',
		},
		fields: [
			{
				name: 'OP',
				type: 'dropdown',
				label: { 'zh-hant': '運算子', en: 'Operator' },
				options: [
					{ value: 'AND', label: { 'zh-hant': '且', en: 'and' } },
					{ value: 'OR', label: { 'zh-hant': '或', en: 'or' } },
				],
			},
		],
		inputs: [
			{ name: 'A', type: 'value', label: { 'zh-hant': 'A', en: 'A' }, check: 'Boolean' },
			{ name: 'B', type: 'value', label: { 'zh-hant': 'B', en: 'B' }, check: 'Boolean' },
		],
		output: { type: 'Boolean' },
		boards: SUPPORTED_BOARDS,
		tags: ['logic', 'and', 'or', 'operation', '邏輯', '且', '或', '運算'],
	},
	{
		type: 'logic_negate',
		category: 'logic',
		names: { 'zh-hant': '非', en: 'Not' },
		descriptions: {
			'zh-hant': '將布林值反轉（真變假，假變真）',
			en: 'Invert a boolean value (true becomes false, false becomes true)',
		},
		fields: [],
		inputs: [{ name: 'BOOL', type: 'value', label: { 'zh-hant': '非', en: 'not' }, check: 'Boolean' }],
		output: { type: 'Boolean' },
		boards: SUPPORTED_BOARDS,
		tags: ['logic', 'not', 'negate', '邏輯', '非', '反轉'],
	},
	{
		type: 'logic_boolean',
		category: 'logic',
		names: { 'zh-hant': '布林值', en: 'Boolean' },
		descriptions: {
			'zh-hant': '布林常數：真或假',
			en: 'Boolean constant: true or false',
		},
		fields: [
			{
				name: 'BOOL',
				type: 'dropdown',
				label: { 'zh-hant': '值', en: 'Value' },
				options: [
					{ value: 'TRUE', label: { 'zh-hant': '真', en: 'true' } },
					{ value: 'FALSE', label: { 'zh-hant': '假', en: 'false' } },
				],
			},
		],
		inputs: [],
		output: { type: 'Boolean' },
		boards: SUPPORTED_BOARDS,
		tags: ['logic', 'boolean', 'true', 'false', '邏輯', '布林', '真', '假'],
	},
	{
		type: 'logic_null',
		category: 'logic',
		names: { 'zh-hant': '空值', en: 'Null' },
		descriptions: {
			'zh-hant': '空值常數',
			en: 'Null constant',
		},
		fields: [],
		inputs: [],
		output: { type: null },
		boards: SUPPORTED_BOARDS,
		tags: ['logic', 'null', 'empty', '邏輯', '空值', '空'],
	},
	{
		type: 'logic_ternary',
		category: 'logic',
		names: { 'zh-hant': '三元運算', en: 'Ternary' },
		descriptions: {
			'zh-hant': '根據條件回傳不同的值',
			en: 'Return different values based on condition',
		},
		fields: [],
		inputs: [
			{ name: 'IF', type: 'value', label: { 'zh-hant': '如果', en: 'if' }, check: 'Boolean' },
			{ name: 'THEN', type: 'value', label: { 'zh-hant': '則', en: 'then' } },
			{ name: 'ELSE', type: 'value', label: { 'zh-hant': '否則', en: 'else' } },
		],
		output: { type: null },
		boards: SUPPORTED_BOARDS,
		tags: ['logic', 'ternary', 'condition', '邏輯', '三元', '條件'],
	},

	// === Blockly 內建迴圈積木 ===
	{
		type: 'controls_repeat_ext',
		category: 'loops',
		names: { 'zh-hant': '重複次數', en: 'Repeat' },
		descriptions: {
			'zh-hant': '重複執行指定次數的程式碼',
			en: 'Repeat statements a specified number of times',
		},
		fields: [],
		inputs: [
			{ name: 'TIMES', type: 'value', label: { 'zh-hant': '次數', en: 'times' }, check: 'Number' },
			{ name: 'DO', type: 'statement', label: { 'zh-hant': '執行', en: 'do' } },
		],
		boards: SUPPORTED_BOARDS,
		tags: ['loop', 'repeat', 'times', '迴圈', '重複', '次數'],
	},
	{
		type: 'controls_whileUntil',
		category: 'loops',
		names: { 'zh-hant': '條件迴圈', en: 'While/Until' },
		descriptions: {
			'zh-hant': '當條件為真時重複執行，或重複執行直到條件為真',
			en: 'Repeat while condition is true, or until condition becomes true',
		},
		fields: [
			{
				name: 'MODE',
				type: 'dropdown',
				label: { 'zh-hant': '模式', en: 'Mode' },
				options: [
					{ value: 'WHILE', label: { 'zh-hant': '當...時', en: 'while' } },
					{ value: 'UNTIL', label: { 'zh-hant': '直到...', en: 'until' } },
				],
			},
		],
		inputs: [
			{ name: 'BOOL', type: 'value', label: { 'zh-hant': '條件', en: 'condition' }, check: 'Boolean' },
			{ name: 'DO', type: 'statement', label: { 'zh-hant': '執行', en: 'do' } },
		],
		boards: SUPPORTED_BOARDS,
		tags: ['loop', 'while', 'until', 'condition', '迴圈', '當', '直到', '條件'],
	},
	{
		type: 'controls_for',
		category: 'loops',
		names: { 'zh-hant': '計數迴圈', en: 'For' },
		descriptions: {
			'zh-hant': '使用變數從起始值到結束值計數，每次增加指定的步進值',
			en: 'Count from start to end with specified step',
		},
		fields: [{ name: 'VAR', type: 'variable', label: { 'zh-hant': '變數', en: 'Variable' } }],
		inputs: [
			{ name: 'FROM', type: 'value', label: { 'zh-hant': '從', en: 'from' }, check: 'Number' },
			{ name: 'TO', type: 'value', label: { 'zh-hant': '到', en: 'to' }, check: 'Number' },
			{ name: 'BY', type: 'value', label: { 'zh-hant': '間隔', en: 'by' }, check: 'Number' },
			{ name: 'DO', type: 'statement', label: { 'zh-hant': '執行', en: 'do' } },
		],
		boards: SUPPORTED_BOARDS,
		tags: ['loop', 'for', 'count', 'variable', '迴圈', '計數', '變數'],
	},
	{
		type: 'controls_forEach',
		category: 'loops',
		names: { 'zh-hant': '清單迴圈', en: 'For Each' },
		descriptions: {
			'zh-hant': '對清單中的每個項目執行程式碼',
			en: 'Execute statements for each item in a list',
		},
		fields: [{ name: 'VAR', type: 'variable', label: { 'zh-hant': '變數', en: 'Variable' } }],
		inputs: [
			{ name: 'LIST', type: 'value', label: { 'zh-hant': '清單', en: 'list' }, check: 'Array' },
			{ name: 'DO', type: 'statement', label: { 'zh-hant': '執行', en: 'do' } },
		],
		boards: SUPPORTED_BOARDS,
		tags: ['loop', 'foreach', 'list', 'array', '迴圈', '清單', '陣列'],
	},
	{
		type: 'controls_flow_statements',
		category: 'loops',
		names: { 'zh-hant': '流程控制', en: 'Flow Control' },
		descriptions: {
			'zh-hant': '中斷或繼續迴圈',
			en: 'Break or continue loop',
		},
		fields: [
			{
				name: 'FLOW',
				type: 'dropdown',
				label: { 'zh-hant': '動作', en: 'Action' },
				options: [
					{ value: 'BREAK', label: { 'zh-hant': '中斷', en: 'break' } },
					{ value: 'CONTINUE', label: { 'zh-hant': '繼續', en: 'continue' } },
				],
			},
		],
		inputs: [],
		boards: SUPPORTED_BOARDS,
		tags: ['loop', 'break', 'continue', 'flow', '迴圈', '中斷', '繼續'],
	},

	// === 自訂迴圈控制積木 ===
	{
		type: 'controls_duration',
		category: 'loops',
		names: { 'zh-hant': '限時重複', en: 'Duration Repeat' },
		descriptions: {
			'zh-hant': '在指定的時間內重複執行程式',
			en: 'Repeat statements for a specified duration',
		},
		fields: [],
		inputs: [
			{ name: 'DURATION', type: 'value', label: { 'zh-hant': '時間 (毫秒)', en: 'Duration (ms)' }, check: 'Number' },
			{ name: 'DO', type: 'statement', label: { 'zh-hant': '執行', en: 'Do' } },
		],
		boards: SUPPORTED_BOARDS,
		tags: ['loop', 'duration', 'time', 'repeat', '迴圈', '限時', '重複'],
	},
	{
		type: 'singular_flow_statements',
		category: 'loops',
		names: { 'zh-hant': '流程控制', en: 'Flow Control' },
		descriptions: {
			'zh-hant': '在迴圈中使用 break 或 continue 語句',
			en: 'Use break or continue statements in loops',
		},
		fields: [
			{
				name: 'FLOW',
				type: 'dropdown',
				label: { 'zh-hant': '流程', en: 'Flow' },
				options: [
					{ value: 'BREAK', label: { 'zh-hant': '跳出', en: 'break' } },
					{ value: 'CONTINUE', label: { 'zh-hant': '繼續', en: 'continue' } },
				],
			},
		],
		inputs: [],
		boards: SUPPORTED_BOARDS,
		tags: ['loop', 'break', 'continue', 'flow', '迴圈', '跳出', '繼續'],
	},

	// === 函式積木 ===
	{
		type: 'arduino_function',
		category: 'functions',
		names: { 'zh-hant': '定義函式', en: 'Define Function' },
		descriptions: {
			'zh-hant': '建立自定義函式，可包含參數',
			en: 'Create a custom function with parameters',
		},
		fields: [{ name: 'NAME', type: 'text', label: { 'zh-hant': '名稱', en: 'Name' }, default: 'myFunction' }],
		inputs: [{ name: 'STACK', type: 'statement', label: { 'zh-hant': '程式碼', en: 'Code' } }],
		boards: SUPPORTED_BOARDS,
		tags: ['function', 'define', 'procedure', '函式', '定義', '程序'],
		relatedBlocks: ['arduino_function_call', 'arduino_function_mutator', 'arduino_function_parameter'],
	},
	{
		type: 'arduino_function_call',
		category: 'functions',
		names: { 'zh-hant': '呼叫函式', en: 'Call Function' },
		descriptions: {
			'zh-hant': '呼叫一個自定義函式',
			en: 'Call a custom function',
		},
		fields: [{ name: 'NAME', type: 'label', label: { 'zh-hant': '函式名稱', en: 'Function Name' } }],
		inputs: [],
		boards: SUPPORTED_BOARDS,
		tags: ['function', 'call', 'procedure', '函式', '呼叫'],
		relatedBlocks: ['arduino_function'],
	},
	{
		type: 'arduino_function_mutator',
		category: 'functions',
		names: { 'zh-hant': '函式參數容器', en: 'Function Mutator Container' },
		descriptions: {
			'zh-hant': '函式積木的 mutator 容器，用於定義函式參數',
			en: 'Mutator container for function blocks, used to define function parameters',
		},
		fields: [],
		inputs: [{ name: 'STACK', type: 'statement', label: { 'zh-hant': '參數', en: 'Parameters' } }],
		boards: SUPPORTED_BOARDS,
		tags: ['function', 'mutator', 'parameter', '函式', '參數', '容器'],
		internal: true,
		relatedBlocks: ['arduino_function', 'arduino_function_parameter'],
	},
	{
		type: 'arduino_function_parameter',
		category: 'functions',
		names: { 'zh-hant': '函式參數', en: 'Function Parameter' },
		descriptions: {
			'zh-hant': '定義函式的參數，包含型別與名稱',
			en: 'Define function parameter with type and name',
		},
		fields: [
			{
				name: 'TYPE',
				type: 'dropdown',
				label: { 'zh-hant': '型別', en: 'Type' },
				options: [
					{ value: 'int', label: { 'zh-hant': '整數 (int)', en: 'int' } },
					{ value: 'float', label: { 'zh-hant': '浮點數 (float)', en: 'float' } },
					{ value: 'bool', label: { 'zh-hant': '布林值 (bool)', en: 'bool' } },
					{ value: 'String', label: { 'zh-hant': '字串 (String)', en: 'String' } },
				],
			},
			{ name: 'NAME', type: 'text', label: { 'zh-hant': '名稱', en: 'Name' }, default: 'x' },
		],
		inputs: [],
		boards: SUPPORTED_BOARDS,
		tags: ['function', 'parameter', 'argument', '函式', '參數', '引數'],
		internal: true,
		relatedBlocks: ['arduino_function', 'arduino_function_mutator'],
	},

	// === HUSKYLENS 額外積木 ===
	{
		type: 'huskylens_count_arrows',
		category: 'vision',
		names: { 'zh-hant': 'HUSKYLENS 箭頭數量', en: 'HUSKYLENS Arrow Count' },
		descriptions: {
			'zh-hant': '取得 HUSKYLENS 偵測到的箭頭數量',
			en: 'Get the number of arrows detected by HUSKYLENS',
		},
		fields: [],
		inputs: [],
		output: { type: 'Number' },
		boards: SUPPORTED_BOARDS,
		tags: ['huskylens', 'arrows', 'count', '箭頭', '數量'],
		experimental: true,
		relatedBlocks: ['huskylens_request', 'huskylens_get_arrow_info'],
	},
	{
		type: 'huskylens_get_arrow_info',
		category: 'vision',
		names: { 'zh-hant': '取得 HUSKYLENS 箭頭資訊', en: 'Get HUSKYLENS Arrow Info' },
		descriptions: {
			'zh-hant': '取得指定箭頭的資訊（位置或 ID）',
			en: 'Get info of specified arrow (position or ID)',
		},
		fields: [
			{ name: 'INDEX', type: 'number', label: { 'zh-hant': '索引', en: 'Index' }, default: 0, min: 0 },
			{
				name: 'INFO_TYPE',
				type: 'dropdown',
				label: { 'zh-hant': '資訊類型', en: 'Info Type' },
				options: [
					{ value: 'xOrigin', label: { 'zh-hant': '起點 X', en: 'Origin X' } },
					{ value: 'yOrigin', label: { 'zh-hant': '起點 Y', en: 'Origin Y' } },
					{ value: 'xTarget', label: { 'zh-hant': '終點 X', en: 'Target X' } },
					{ value: 'yTarget', label: { 'zh-hant': '終點 Y', en: 'Target Y' } },
					{ value: 'ID', label: { 'zh-hant': 'ID', en: 'ID' } },
				],
			},
		],
		inputs: [],
		output: { type: 'Number' },
		boards: SUPPORTED_BOARDS,
		tags: ['huskylens', 'arrow', 'info', 'position', '箭頭', '資訊', '位置'],
		experimental: true,
		relatedBlocks: ['huskylens_count_arrows'],
	},
	{
		type: 'huskylens_learn',
		category: 'vision',
		names: { 'zh-hant': 'HUSKYLENS 學習', en: 'HUSKYLENS Learn' },
		descriptions: {
			'zh-hant': '讓 HUSKYLENS 學習目前畫面中的物體',
			en: 'Let HUSKYLENS learn the object in current frame',
		},
		fields: [],
		inputs: [{ name: 'ID', type: 'value', label: { 'zh-hant': 'ID', en: 'ID' }, check: 'Number' }],
		boards: SUPPORTED_BOARDS,
		tags: ['huskylens', 'learn', 'train', '學習', '訓練'],
		experimental: true,
	},
	{
		type: 'huskylens_forget',
		category: 'vision',
		names: { 'zh-hant': 'HUSKYLENS 忘記', en: 'HUSKYLENS Forget' },
		descriptions: {
			'zh-hant': '讓 HUSKYLENS 忘記已學習的物體',
			en: 'Let HUSKYLENS forget learned objects',
		},
		fields: [],
		inputs: [],
		boards: SUPPORTED_BOARDS,
		tags: ['huskylens', 'forget', 'clear', '忘記', '清除'],
		experimental: true,
	},
	{
		type: 'huskylens_is_learned',
		category: 'vision',
		names: { 'zh-hant': 'HUSKYLENS 已學習', en: 'HUSKYLENS Is Learned' },
		descriptions: {
			'zh-hant': '檢查 HUSKYLENS 是否已學習指定 ID 的物體',
			en: 'Check if HUSKYLENS has learned object with specified ID',
		},
		fields: [],
		inputs: [{ name: 'ID', type: 'value', label: { 'zh-hant': 'ID', en: 'ID' }, check: 'Number' }],
		output: { type: 'Boolean' },
		boards: SUPPORTED_BOARDS,
		tags: ['huskylens', 'learned', 'check', '已學習', '檢查'],
		experimental: true,
	},

	// === Arduino 額外積木 ===
	{
		type: 'arduino_setup_loop',
		category: 'arduino',
		names: { 'zh-hant': 'Arduino 設定與迴圈', en: 'Arduino Setup and Loop' },
		descriptions: {
			'zh-hant': 'Arduino 程式的 setup() 和 loop() 結合的主結構',
			en: 'Combined Arduino setup() and loop() main structure',
		},
		fields: [],
		inputs: [
			{ name: 'SETUP', type: 'statement', label: { 'zh-hant': '設定', en: 'Setup' } },
			{ name: 'LOOP', type: 'statement', label: { 'zh-hant': '迴圈', en: 'Loop' } },
		],
		boards: SUPPORTED_BOARDS,
		tags: ['arduino', 'setup', 'loop', '設定', '迴圈'],
	},
	{
		type: 'arduino_digital_write',
		category: 'arduino',
		names: { 'zh-hant': 'Arduino 數位寫入', en: 'Arduino Digital Write' },
		descriptions: {
			'zh-hant': '設定數位腳位的輸出為 HIGH 或 LOW',
			en: 'Set a digital pin to HIGH or LOW',
		},
		fields: [{ name: 'PIN', type: 'dropdown', label: { 'zh-hant': '腳位', en: 'Pin' }, options: 'dynamic:digitalPins' }],
		inputs: [{ name: 'STATE', type: 'value', label: { 'zh-hant': '狀態', en: 'State' }, check: 'Boolean' }],
		boards: SUPPORTED_BOARDS,
		tags: ['digital', 'write', 'gpio', '數位', '寫入', '輸出'],
	},
	{
		type: 'arduino_digital_read',
		category: 'arduino',
		names: { 'zh-hant': 'Arduino 數位讀取', en: 'Arduino Digital Read' },
		descriptions: {
			'zh-hant': '讀取數位腳位的狀態',
			en: 'Read the state of a digital pin',
		},
		fields: [{ name: 'PIN', type: 'dropdown', label: { 'zh-hant': '腳位', en: 'Pin' }, options: 'dynamic:digitalPins' }],
		inputs: [],
		output: { type: 'Boolean' },
		boards: SUPPORTED_BOARDS,
		tags: ['digital', 'read', 'gpio', '數位', '讀取', '輸入'],
	},
	{
		type: 'arduino_analog_write',
		category: 'arduino',
		names: { 'zh-hant': 'Arduino 類比寫入 (PWM)', en: 'Arduino Analog Write (PWM)' },
		descriptions: {
			'zh-hant': '設定 PWM 腳位的輸出值 (0-255)',
			en: 'Set PWM output value (0-255) on a PWM capable pin',
		},
		fields: [{ name: 'PIN', type: 'dropdown', label: { 'zh-hant': '腳位', en: 'Pin' }, options: 'dynamic:pwmPins' }],
		inputs: [{ name: 'VALUE', type: 'value', label: { 'zh-hant': '數值', en: 'Value' }, check: 'Number' }],
		boards: SUPPORTED_BOARDS,
		tags: ['analog', 'write', 'pwm', '類比', '寫入', 'PWM'],
	},
	{
		type: 'arduino_analog_read',
		category: 'arduino',
		names: { 'zh-hant': 'Arduino 類比讀取', en: 'Arduino Analog Read' },
		descriptions: {
			'zh-hant': '讀取類比腳位的值 (0-1023)',
			en: 'Read analog pin value (0-1023)',
		},
		fields: [{ name: 'PIN', type: 'dropdown', label: { 'zh-hant': '腳位', en: 'Pin' }, options: 'dynamic:analogPins' }],
		inputs: [],
		output: { type: 'Number' },
		boards: SUPPORTED_BOARDS,
		tags: ['analog', 'read', '類比', '讀取', '輸入'],
	},
	{
		type: 'arduino_delay',
		category: 'arduino',
		names: { 'zh-hant': 'Arduino 延遲', en: 'Arduino Delay' },
		descriptions: {
			'zh-hant': '暫停程式執行指定的時間',
			en: 'Pause program execution for specified time',
		},
		fields: [],
		inputs: [{ name: 'DELAY_TIME', type: 'value', label: { 'zh-hant': '時間 (毫秒)', en: 'Time (ms)' }, check: 'Number' }],
		boards: SUPPORTED_BOARDS,
		tags: ['delay', 'wait', 'time', '延遲', '等待', '時間'],
	},
	{
		type: 'arduino_level',
		category: 'arduino',
		names: { 'zh-hant': '電位', en: 'Level' },
		descriptions: {
			'zh-hant': '電位常數：HIGH (高電位) 或 LOW (低電位)',
			en: 'Level constants: HIGH or LOW',
		},
		fields: [
			{
				name: 'LEVEL',
				type: 'dropdown',
				label: { 'zh-hant': '電位', en: 'Level' },
				options: [
					{ value: 'HIGH', label: { 'zh-hant': '高', en: 'HIGH' } },
					{ value: 'LOW', label: { 'zh-hant': '低', en: 'LOW' } },
				],
			},
		],
		inputs: [],
		output: { type: 'Boolean' },
		boards: SUPPORTED_BOARDS,
		tags: ['level', 'high', 'low', '電位', '高', '低'],
	},
	{
		type: 'arduino_pullup',
		category: 'arduino',
		names: { 'zh-hant': '上拉電阻', en: 'Pullup' },
		descriptions: {
			'zh-hant': '設定數位腳位啟用內部上拉電阻',
			en: 'Enable internal pullup resistor on a digital pin',
		},
		fields: [{ name: 'PIN', type: 'dropdown', label: { 'zh-hant': '腳位', en: 'Pin' }, options: 'dynamic:digitalPins' }],
		inputs: [],
		boards: SUPPORTED_BOARDS,
		tags: ['pullup', 'resistor', 'input', '上拉', '電阻', '輸入'],
	},
	{
		type: 'arduino_pin_mode',
		category: 'arduino',
		names: { 'zh-hant': '腳位模式設定', en: 'Pin Mode' },
		descriptions: {
			'zh-hant': '設定指定腳位的運作模式（輸入/輸出）',
			en: 'Set the mode of a digital pin (INPUT/OUTPUT)',
		},
		fields: [
			{ name: 'PIN', type: 'dropdown', label: { 'zh-hant': '腳位', en: 'Pin' }, options: 'dynamic:digitalPins' },
			{
				name: 'MODE',
				type: 'dropdown',
				label: { 'zh-hant': '模式', en: 'Mode' },
				options: [
					{ value: 'INPUT', label: { 'zh-hant': '輸入', en: 'INPUT' } },
					{ value: 'OUTPUT', label: { 'zh-hant': '輸出', en: 'OUTPUT' } },
				],
			},
		],
		inputs: [],
		boards: SUPPORTED_BOARDS,
		tags: ['pin', 'mode', 'input', 'output', 'gpio', '腳位', '模式', '輸入', '輸出'],
		relatedBlocks: ['digital_write', 'digital_read'],
	},
	{
		type: 'text_print',
		category: 'text',
		names: { 'zh-hant': '序列埠輸出', en: 'Serial Print' },
		descriptions: {
			'zh-hant': '透過序列埠輸出文字或數值',
			en: 'Print text or values to serial port',
		},
		fields: [],
		inputs: [{ name: 'TEXT', type: 'value', label: { 'zh-hant': '文字', en: 'Text' } }],
		boards: SUPPORTED_BOARDS,
		tags: ['print', 'serial', 'output', '輸出', '序列埠', '列印'],
	},

	// === Blockly 內建數學積木 ===
	{
		type: 'math_number',
		category: 'math',
		names: { 'zh-hant': '數字', en: 'Number' },
		descriptions: {
			'zh-hant': '數字常數',
			en: 'A number constant',
		},
		fields: [{ name: 'NUM', type: 'number', label: { 'zh-hant': '數字', en: 'Number' }, default: 0 }],
		inputs: [],
		output: { type: 'Number' },
		boards: SUPPORTED_BOARDS,
		tags: ['math', 'number', 'constant', '數學', '數字', '常數'],
	},
	{
		type: 'math_arithmetic',
		category: 'math',
		names: { 'zh-hant': '數學運算', en: 'Arithmetic' },
		descriptions: {
			'zh-hant': '基本數學運算（加、減、乘、除、乘方）',
			en: 'Basic math operations (add, subtract, multiply, divide, power)',
		},
		fields: [
			{
				name: 'OP',
				type: 'dropdown',
				label: { 'zh-hant': '運算子', en: 'Operator' },
				options: [
					{ value: 'ADD', label: { 'zh-hant': '+', en: '+' } },
					{ value: 'MINUS', label: { 'zh-hant': '-', en: '-' } },
					{ value: 'MULTIPLY', label: { 'zh-hant': '×', en: '×' } },
					{ value: 'DIVIDE', label: { 'zh-hant': '÷', en: '÷' } },
					{ value: 'POWER', label: { 'zh-hant': '^', en: '^' } },
				],
			},
		],
		inputs: [
			{ name: 'A', type: 'value', label: { 'zh-hant': 'A', en: 'A' }, check: 'Number' },
			{ name: 'B', type: 'value', label: { 'zh-hant': 'B', en: 'B' }, check: 'Number' },
		],
		output: { type: 'Number' },
		boards: SUPPORTED_BOARDS,
		tags: ['math', 'arithmetic', 'add', 'subtract', 'multiply', 'divide', '數學', '運算', '加', '減', '乘', '除'],
	},
	{
		type: 'math_single',
		category: 'math',
		names: { 'zh-hant': '數學函數', en: 'Math Function' },
		descriptions: {
			'zh-hant': '單元數學函數（平方根、絕對值、負數等）',
			en: 'Unary math functions (square root, absolute, negate, etc.)',
		},
		fields: [
			{
				name: 'OP',
				type: 'dropdown',
				label: { 'zh-hant': '函數', en: 'Function' },
				options: [
					{ value: 'ROOT', label: { 'zh-hant': '平方根', en: 'square root' } },
					{ value: 'ABS', label: { 'zh-hant': '絕對值', en: 'absolute' } },
					{ value: 'NEG', label: { 'zh-hant': '負數', en: 'negate' } },
					{ value: 'LN', label: { 'zh-hant': 'ln', en: 'ln' } },
					{ value: 'LOG10', label: { 'zh-hant': 'log10', en: 'log10' } },
					{ value: 'EXP', label: { 'zh-hant': 'e^', en: 'e^' } },
					{ value: 'POW10', label: { 'zh-hant': '10^', en: '10^' } },
				],
			},
		],
		inputs: [{ name: 'NUM', type: 'value', label: { 'zh-hant': '數字', en: 'number' }, check: 'Number' }],
		output: { type: 'Number' },
		boards: SUPPORTED_BOARDS,
		tags: ['math', 'function', 'sqrt', 'abs', '數學', '函數', '平方根', '絕對值'],
	},
	{
		type: 'math_trig',
		category: 'math',
		names: { 'zh-hant': '三角函數', en: 'Trigonometry' },
		descriptions: {
			'zh-hant': '三角函數（sin、cos、tan 及其反函數）',
			en: 'Trigonometric functions (sin, cos, tan and inverses)',
		},
		fields: [
			{
				name: 'OP',
				type: 'dropdown',
				label: { 'zh-hant': '函數', en: 'Function' },
				options: [
					{ value: 'SIN', label: { 'zh-hant': 'sin', en: 'sin' } },
					{ value: 'COS', label: { 'zh-hant': 'cos', en: 'cos' } },
					{ value: 'TAN', label: { 'zh-hant': 'tan', en: 'tan' } },
					{ value: 'ASIN', label: { 'zh-hant': 'asin', en: 'asin' } },
					{ value: 'ACOS', label: { 'zh-hant': 'acos', en: 'acos' } },
					{ value: 'ATAN', label: { 'zh-hant': 'atan', en: 'atan' } },
				],
			},
		],
		inputs: [{ name: 'NUM', type: 'value', label: { 'zh-hant': '角度', en: 'angle' }, check: 'Number' }],
		output: { type: 'Number' },
		boards: SUPPORTED_BOARDS,
		tags: ['math', 'trig', 'sin', 'cos', 'tan', '數學', '三角', '正弦', '餘弦'],
	},
	{
		type: 'math_constant',
		category: 'math',
		names: { 'zh-hant': '數學常數', en: 'Math Constant' },
		descriptions: {
			'zh-hant': '數學常數（π、e、φ 等）',
			en: 'Math constants (π, e, φ, etc.)',
		},
		fields: [
			{
				name: 'CONSTANT',
				type: 'dropdown',
				label: { 'zh-hant': '常數', en: 'Constant' },
				options: [
					{ value: 'PI', label: { 'zh-hant': 'π', en: 'π' } },
					{ value: 'E', label: { 'zh-hant': 'e', en: 'e' } },
					{ value: 'GOLDEN_RATIO', label: { 'zh-hant': 'φ', en: 'φ' } },
					{ value: 'SQRT2', label: { 'zh-hant': '√2', en: '√2' } },
					{ value: 'SQRT1_2', label: { 'zh-hant': '√½', en: '√½' } },
					{ value: 'INFINITY', label: { 'zh-hant': '∞', en: '∞' } },
				],
			},
		],
		inputs: [],
		output: { type: 'Number' },
		boards: SUPPORTED_BOARDS,
		tags: ['math', 'constant', 'pi', '數學', '常數', '圓周率'],
	},
	{
		type: 'math_number_property',
		category: 'math',
		names: { 'zh-hant': '數字屬性', en: 'Number Property' },
		descriptions: {
			'zh-hant': '檢查數字的屬性（偶數、奇數、質數等）',
			en: 'Check number property (even, odd, prime, etc.)',
		},
		fields: [
			{
				name: 'PROPERTY',
				type: 'dropdown',
				label: { 'zh-hant': '屬性', en: 'Property' },
				options: [
					{ value: 'EVEN', label: { 'zh-hant': '偶數', en: 'even' } },
					{ value: 'ODD', label: { 'zh-hant': '奇數', en: 'odd' } },
					{ value: 'PRIME', label: { 'zh-hant': '質數', en: 'prime' } },
					{ value: 'WHOLE', label: { 'zh-hant': '整數', en: 'whole' } },
					{ value: 'POSITIVE', label: { 'zh-hant': '正數', en: 'positive' } },
					{ value: 'NEGATIVE', label: { 'zh-hant': '負數', en: 'negative' } },
				],
			},
		],
		inputs: [{ name: 'NUMBER_TO_CHECK', type: 'value', label: { 'zh-hant': '數字', en: 'number' }, check: 'Number' }],
		output: { type: 'Boolean' },
		boards: SUPPORTED_BOARDS,
		tags: ['math', 'property', 'even', 'odd', 'prime', '數學', '屬性', '偶數', '奇數', '質數'],
	},
	{
		type: 'math_round',
		category: 'math',
		names: { 'zh-hant': '取整', en: 'Round' },
		descriptions: {
			'zh-hant': '取整數（四捨五入、無條件捨去、無條件進位）',
			en: 'Round number (round, floor, ceiling)',
		},
		fields: [
			{
				name: 'OP',
				type: 'dropdown',
				label: { 'zh-hant': '方式', en: 'Mode' },
				options: [
					{ value: 'ROUND', label: { 'zh-hant': '四捨五入', en: 'round' } },
					{ value: 'ROUNDUP', label: { 'zh-hant': '無條件進位', en: 'round up' } },
					{ value: 'ROUNDDOWN', label: { 'zh-hant': '無條件捨去', en: 'round down' } },
				],
			},
		],
		inputs: [{ name: 'NUM', type: 'value', label: { 'zh-hant': '數字', en: 'number' }, check: 'Number' }],
		output: { type: 'Number' },
		boards: SUPPORTED_BOARDS,
		tags: ['math', 'round', 'floor', 'ceiling', '數學', '取整', '四捨五入'],
	},
	{
		type: 'math_modulo',
		category: 'math',
		names: { 'zh-hant': '餘數', en: 'Modulo' },
		descriptions: {
			'zh-hant': '計算兩數相除的餘數',
			en: 'Calculate remainder of division',
		},
		fields: [],
		inputs: [
			{ name: 'DIVIDEND', type: 'value', label: { 'zh-hant': '被除數', en: 'dividend' }, check: 'Number' },
			{ name: 'DIVISOR', type: 'value', label: { 'zh-hant': '除數', en: 'divisor' }, check: 'Number' },
		],
		output: { type: 'Number' },
		boards: SUPPORTED_BOARDS,
		tags: ['math', 'modulo', 'remainder', '數學', '餘數', '取餘'],
	},
	{
		type: 'math_constrain',
		category: 'math',
		names: { 'zh-hant': '限制範圍', en: 'Constrain' },
		descriptions: {
			'zh-hant': '將數字限制在指定的最小值和最大值之間',
			en: 'Constrain a number to be between specified min and max values',
		},
		fields: [],
		inputs: [
			{ name: 'VALUE', type: 'value', label: { 'zh-hant': '數值', en: 'value' }, check: 'Number' },
			{ name: 'LOW', type: 'value', label: { 'zh-hant': '最小值', en: 'min' }, check: 'Number' },
			{ name: 'HIGH', type: 'value', label: { 'zh-hant': '最大值', en: 'max' }, check: 'Number' },
		],
		output: { type: 'Number' },
		boards: SUPPORTED_BOARDS,
		tags: ['math', 'constrain', 'limit', 'clamp', '數學', '限制', '範圍'],
	},
	{
		type: 'math_random_int',
		category: 'math',
		names: { 'zh-hant': '隨機整數', en: 'Random Integer' },
		descriptions: {
			'zh-hant': '產生指定範圍內的隨機整數',
			en: 'Generate a random integer within specified range',
		},
		fields: [],
		inputs: [
			{ name: 'FROM', type: 'value', label: { 'zh-hant': '從', en: 'from' }, check: 'Number' },
			{ name: 'TO', type: 'value', label: { 'zh-hant': '到', en: 'to' }, check: 'Number' },
		],
		output: { type: 'Number' },
		boards: SUPPORTED_BOARDS,
		tags: ['math', 'random', 'integer', '數學', '隨機', '整數'],
	},
	{
		type: 'math_random_float',
		category: 'math',
		names: { 'zh-hant': '隨機小數', en: 'Random Fraction' },
		descriptions: {
			'zh-hant': '產生 0 到 1 之間的隨機小數',
			en: 'Generate a random fraction between 0 and 1',
		},
		fields: [],
		inputs: [],
		output: { type: 'Number' },
		boards: SUPPORTED_BOARDS,
		tags: ['math', 'random', 'float', 'fraction', '數學', '隨機', '小數'],
	},
	{
		type: 'math_map',
		category: 'math',
		names: { 'zh-hant': '數值映射', en: 'Map' },
		descriptions: {
			'zh-hant': '將數值從一個範圍映射到另一個範圍',
			en: 'Map a value from one range to another',
		},
		fields: [],
		inputs: [
			{ name: 'VALUE', type: 'value', label: { 'zh-hant': '數值', en: 'Value' }, check: 'Number' },
			{ name: 'FROM_LOW', type: 'value', label: { 'zh-hant': '原範圍最小', en: 'From Low' }, check: 'Number' },
			{ name: 'FROM_HIGH', type: 'value', label: { 'zh-hant': '原範圍最大', en: 'From High' }, check: 'Number' },
			{ name: 'TO_LOW', type: 'value', label: { 'zh-hant': '目標範圍最小', en: 'To Low' }, check: 'Number' },
			{ name: 'TO_HIGH', type: 'value', label: { 'zh-hant': '目標範圍最大', en: 'To High' }, check: 'Number' },
		],
		output: { type: 'Number' },
		boards: SUPPORTED_BOARDS,
		tags: ['map', 'range', 'convert', '映射', '範圍', '轉換'],
	},

	// === 感測器額外積木 ===
	{
		type: 'ultrasonic_trigger',
		category: 'sensors',
		names: { 'zh-hant': '觸發超音波感測器', en: 'Trigger Ultrasonic Sensor' },
		descriptions: {
			'zh-hant': '觸發超音波感測器發送訊號並讀取距離',
			en: 'Trigger ultrasonic sensor to send signal and read distance',
		},
		fields: [],
		inputs: [],
		output: { type: 'Number' },
		boards: SUPPORTED_BOARDS,
		tags: ['ultrasonic', 'trigger', 'distance', '超音波', '觸發', '距離'],
		relatedBlocks: ['ultrasonic_sensor'],
	},

	// === 馬達額外積木 ===
	{
		type: 'encoder_pid_setup',
		category: 'motors',
		names: { 'zh-hant': '編碼器 PID 設定', en: 'Encoder PID Setup' },
		descriptions: {
			'zh-hant': '設定編碼器馬達的 PID 控制器參數',
			en: 'Setup PID controller parameters for encoder motor',
		},
		fields: [],
		inputs: [
			{ name: 'KP', type: 'value', label: { 'zh-hant': 'Kp', en: 'Kp' }, check: 'Number' },
			{ name: 'KI', type: 'value', label: { 'zh-hant': 'Ki', en: 'Ki' }, check: 'Number' },
			{ name: 'KD', type: 'value', label: { 'zh-hant': 'Kd', en: 'Kd' }, check: 'Number' },
		],
		boards: SUPPORTED_BOARDS,
		tags: ['encoder', 'pid', 'setup', '編碼器', 'PID', '設定'],
		relatedBlocks: ['encoder_setup', 'encoder_pid_compute'],
	},
	{
		type: 'encoder_pid_compute',
		category: 'motors',
		names: { 'zh-hant': '編碼器 PID 計算', en: 'Encoder PID Compute' },
		descriptions: {
			'zh-hant': '計算 PID 輸出以控制編碼器馬達',
			en: 'Compute PID output for encoder motor control',
		},
		fields: [],
		inputs: [{ name: 'SETPOINT', type: 'value', label: { 'zh-hant': '目標值', en: 'Setpoint' }, check: 'Number' }],
		output: { type: 'Number' },
		boards: SUPPORTED_BOARDS,
		tags: ['encoder', 'pid', 'compute', '編碼器', 'PID', '計算'],
		relatedBlocks: ['encoder_pid_setup'],
	},

	// === 門檻函式積木 ===
	{
		type: 'threshold_function_setup',
		category: 'arduino',
		names: { 'zh-hant': '門檻函式設定', en: 'Threshold Function Setup' },
		descriptions: {
			'zh-hant': '設定門檻函式的參數，用於將輸入映射到輸出',
			en: 'Setup threshold function parameters for mapping input to output',
		},
		fields: [],
		inputs: [
			{ name: 'THRESHOLD', type: 'value', label: { 'zh-hant': '門檻值', en: 'Threshold' }, check: 'Number' },
			{ name: 'LOW_OUTPUT', type: 'value', label: { 'zh-hant': '低於門檻輸出', en: 'Low Output' }, check: 'Number' },
			{ name: 'HIGH_OUTPUT', type: 'value', label: { 'zh-hant': '高於門檻輸出', en: 'High Output' }, check: 'Number' },
		],
		boards: SUPPORTED_BOARDS,
		tags: ['threshold', 'function', 'setup', '門檻', '函式', '設定'],
		relatedBlocks: ['threshold_function_read'],
	},
	{
		type: 'threshold_function_read',
		category: 'arduino',
		names: { 'zh-hant': '門檻函式讀取', en: 'Threshold Function Read' },
		descriptions: {
			'zh-hant': '根據門檻函式讀取輸出值',
			en: 'Read output value based on threshold function',
		},
		fields: [],
		inputs: [{ name: 'INPUT', type: 'value', label: { 'zh-hant': '輸入值', en: 'Input' }, check: 'Number' }],
		output: { type: 'Number' },
		boards: SUPPORTED_BOARDS,
		tags: ['threshold', 'function', 'read', '門檻', '函式', '讀取'],
		relatedBlocks: ['threshold_function_setup'],
	},

	// === ESP32 WiFi 積木 ===
	{
		type: 'esp32_wifi_connect',
		category: 'communication',
		names: { 'zh-hant': 'WiFi 連線', en: 'WiFi Connect' },
		descriptions: {
			'zh-hant': '連接到指定的 WiFi 網路',
			en: 'Connect to specified WiFi network',
		},
		fields: [
			{ name: 'SSID', type: 'text', label: { 'zh-hant': 'WiFi 名稱', en: 'SSID' }, default: '' },
			{ name: 'PASSWORD', type: 'text', label: { 'zh-hant': '密碼', en: 'Password' }, default: '' },
		],
		inputs: [],
		boards: ['esp32', 'esp32_supermini'],
		tags: ['wifi', 'connect', 'network', 'esp32', '無線', '連線', '網路'],
		relatedBlocks: ['esp32_wifi_disconnect', 'esp32_wifi_status'],
	},
	{
		type: 'esp32_wifi_disconnect',
		category: 'communication',
		names: { 'zh-hant': 'WiFi 斷線', en: 'WiFi Disconnect' },
		descriptions: {
			'zh-hant': '斷開 WiFi 連線',
			en: 'Disconnect from WiFi network',
		},
		fields: [],
		inputs: [],
		boards: ['esp32', 'esp32_supermini'],
		tags: ['wifi', 'disconnect', 'network', 'esp32', '無線', '斷線'],
		relatedBlocks: ['esp32_wifi_connect'],
	},
	{
		type: 'esp32_wifi_status',
		category: 'communication',
		names: { 'zh-hant': 'WiFi 已連線', en: 'WiFi Connected' },
		descriptions: {
			'zh-hant': '檢查 WiFi 是否已連線',
			en: 'Check if WiFi is connected',
		},
		fields: [],
		inputs: [],
		output: { type: 'Boolean' },
		boards: ['esp32', 'esp32_supermini'],
		tags: ['wifi', 'status', 'connected', 'esp32', '狀態', '連線'],
		relatedBlocks: ['esp32_wifi_connect'],
	},
	{
		type: 'esp32_wifi_get_ip',
		category: 'communication',
		names: { 'zh-hant': '取得 IP 位址', en: 'Get IP Address' },
		descriptions: {
			'zh-hant': '取得目前的 IP 位址',
			en: 'Get current IP address',
		},
		fields: [],
		inputs: [],
		output: { type: 'String' },
		boards: ['esp32', 'esp32_supermini'],
		tags: ['wifi', 'ip', 'address', 'esp32', '位址'],
		relatedBlocks: ['esp32_wifi_connect', 'esp32_wifi_status'],
	},
	{
		type: 'esp32_wifi_scan',
		category: 'communication',
		names: { 'zh-hant': '掃描 WiFi 網路', en: 'Scan WiFi Networks' },
		descriptions: {
			'zh-hant': '掃描附近的 WiFi 網路數量',
			en: 'Scan for nearby WiFi networks count',
		},
		fields: [],
		inputs: [],
		output: { type: 'Number' },
		boards: ['esp32', 'esp32_supermini'],
		tags: ['wifi', 'scan', 'network', 'esp32', '掃描', '網路'],
	},
	{
		type: 'esp32_wifi_get_ssid',
		category: 'communication',
		names: { 'zh-hant': '取得 WiFi 名稱', en: 'Get WiFi SSID' },
		descriptions: {
			'zh-hant': '取得掃描到的第 N 個 WiFi 網路名稱',
			en: 'Get SSID of Nth scanned WiFi network',
		},
		fields: [],
		inputs: [{ name: 'INDEX', type: 'value', label: { 'zh-hant': '索引', en: 'Index' }, check: 'Number' }],
		output: { type: 'String' },
		boards: ['esp32', 'esp32_supermini'],
		tags: ['wifi', 'ssid', 'name', 'esp32', '名稱'],
		relatedBlocks: ['esp32_wifi_scan'],
	},
	{
		type: 'esp32_wifi_get_rssi',
		category: 'communication',
		names: { 'zh-hant': '取得 WiFi 訊號強度', en: 'Get WiFi RSSI' },
		descriptions: {
			'zh-hant': '取得掃描到的第 N 個 WiFi 網路訊號強度',
			en: 'Get RSSI of Nth scanned WiFi network',
		},
		fields: [],
		inputs: [{ name: 'INDEX', type: 'value', label: { 'zh-hant': '索引', en: 'Index' }, check: 'Number' }],
		output: { type: 'Number' },
		boards: ['esp32', 'esp32_supermini'],
		tags: ['wifi', 'rssi', 'signal', 'esp32', '訊號', '強度'],
		relatedBlocks: ['esp32_wifi_scan'],
	},

	// === ESP32 MQTT 積木 ===
	{
		type: 'esp32_mqtt_setup',
		category: 'communication',
		names: { 'zh-hant': 'MQTT 設定', en: 'MQTT Setup' },
		descriptions: {
			'zh-hant': '設定 MQTT 伺服器和連接埠',
			en: 'Setup MQTT server and port',
		},
		fields: [
			{ name: 'SERVER', type: 'text', label: { 'zh-hant': '伺服器', en: 'Server' }, default: '' },
			{ name: 'PORT', type: 'number', label: { 'zh-hant': '連接埠', en: 'Port' }, default: 1883, min: 1, max: 65535 },
		],
		inputs: [],
		boards: ['esp32', 'esp32_supermini'],
		tags: ['mqtt', 'setup', 'server', 'esp32', '設定', '伺服器'],
		relatedBlocks: ['esp32_mqtt_connect', 'esp32_mqtt_publish', 'esp32_mqtt_subscribe'],
	},
	{
		type: 'esp32_mqtt_connect',
		category: 'communication',
		names: { 'zh-hant': 'MQTT 連線', en: 'MQTT Connect' },
		descriptions: {
			'zh-hant': '連接到 MQTT 伺服器',
			en: 'Connect to MQTT server',
		},
		fields: [{ name: 'CLIENT_ID', type: 'text', label: { 'zh-hant': '客戶端 ID', en: 'Client ID' }, default: 'esp32_client' }],
		inputs: [],
		boards: ['esp32', 'esp32_supermini'],
		tags: ['mqtt', 'connect', 'esp32', '連線'],
		relatedBlocks: ['esp32_mqtt_setup', 'esp32_mqtt_status'],
	},
	{
		type: 'esp32_mqtt_publish',
		category: 'communication',
		names: { 'zh-hant': 'MQTT 發布', en: 'MQTT Publish' },
		descriptions: {
			'zh-hant': '發布訊息到指定的主題',
			en: 'Publish message to specified topic',
		},
		fields: [{ name: 'TOPIC', type: 'text', label: { 'zh-hant': '主題', en: 'Topic' }, default: '' }],
		inputs: [{ name: 'MESSAGE', type: 'value', label: { 'zh-hant': '訊息', en: 'Message' }, check: 'String' }],
		boards: ['esp32', 'esp32_supermini'],
		tags: ['mqtt', 'publish', 'message', 'esp32', '發布', '訊息'],
		relatedBlocks: ['esp32_mqtt_connect', 'esp32_mqtt_subscribe'],
	},
	{
		type: 'esp32_mqtt_subscribe',
		category: 'communication',
		names: { 'zh-hant': 'MQTT 訂閱', en: 'MQTT Subscribe' },
		descriptions: {
			'zh-hant': '訂閱指定的主題',
			en: 'Subscribe to specified topic',
		},
		fields: [{ name: 'TOPIC', type: 'text', label: { 'zh-hant': '主題', en: 'Topic' }, default: '' }],
		inputs: [],
		boards: ['esp32', 'esp32_supermini'],
		tags: ['mqtt', 'subscribe', 'topic', 'esp32', '訂閱', '主題'],
		relatedBlocks: ['esp32_mqtt_connect', 'esp32_mqtt_get_message'],
	},
	{
		type: 'esp32_mqtt_loop',
		category: 'communication',
		names: { 'zh-hant': 'MQTT 處理', en: 'MQTT Loop' },
		descriptions: {
			'zh-hant': '處理 MQTT 訊息（需放在 loop 中）',
			en: 'Process MQTT messages (put in loop)',
		},
		fields: [],
		inputs: [],
		boards: ['esp32', 'esp32_supermini'],
		tags: ['mqtt', 'loop', 'process', 'esp32', '處理', '迴圈'],
		relatedBlocks: ['esp32_mqtt_connect'],
	},
	{
		type: 'esp32_mqtt_get_topic',
		category: 'communication',
		names: { 'zh-hant': '取得 MQTT 主題', en: 'Get MQTT Topic' },
		descriptions: {
			'zh-hant': '取得最後收到的 MQTT 主題',
			en: 'Get last received MQTT topic',
		},
		fields: [],
		inputs: [],
		output: { type: 'String' },
		boards: ['esp32', 'esp32_supermini'],
		tags: ['mqtt', 'topic', 'receive', 'esp32', '主題', '接收'],
		relatedBlocks: ['esp32_mqtt_subscribe', 'esp32_mqtt_get_message'],
	},
	{
		type: 'esp32_mqtt_get_message',
		category: 'communication',
		names: { 'zh-hant': '取得 MQTT 訊息', en: 'Get MQTT Message' },
		descriptions: {
			'zh-hant': '取得最後收到的 MQTT 訊息',
			en: 'Get last received MQTT message',
		},
		fields: [],
		inputs: [],
		output: { type: 'String' },
		boards: ['esp32', 'esp32_supermini'],
		tags: ['mqtt', 'message', 'receive', 'esp32', '訊息', '接收'],
		relatedBlocks: ['esp32_mqtt_subscribe', 'esp32_mqtt_get_topic'],
	},
	{
		type: 'esp32_mqtt_status',
		category: 'communication',
		names: { 'zh-hant': 'MQTT 已連線', en: 'MQTT Connected' },
		descriptions: {
			'zh-hant': '檢查 MQTT 是否已連線',
			en: 'Check if MQTT is connected',
		},
		fields: [],
		inputs: [],
		output: { type: 'Boolean' },
		boards: ['esp32', 'esp32_supermini'],
		tags: ['mqtt', 'status', 'connected', 'esp32', '狀態', '連線'],
		relatedBlocks: ['esp32_mqtt_connect'],
	},

	// === Blockly 內建文字積木 ===
	{
		type: 'text',
		category: 'text',
		names: { 'zh-hant': '文字', en: 'Text' },
		descriptions: {
			'zh-hant': '文字常數',
			en: 'A text constant',
		},
		fields: [{ name: 'TEXT', type: 'text', label: { 'zh-hant': '文字', en: 'Text' }, default: '' }],
		inputs: [],
		output: { type: 'String' },
		boards: SUPPORTED_BOARDS,
		tags: ['text', 'string', 'constant', '文字', '字串', '常數'],
	},
	{
		type: 'text_length',
		category: 'text',
		names: { 'zh-hant': '文字長度', en: 'Text Length' },
		descriptions: {
			'zh-hant': '取得文字的長度（字元數）',
			en: 'Get the length of text (number of characters)',
		},
		fields: [],
		inputs: [{ name: 'VALUE', type: 'value', label: { 'zh-hant': '文字', en: 'text' }, check: 'String' }],
		output: { type: 'Number' },
		boards: SUPPORTED_BOARDS,
		tags: ['text', 'length', 'count', '文字', '長度', '計數'],
	},
	{
		type: 'text_isEmpty',
		category: 'text',
		names: { 'zh-hant': '文字是否為空', en: 'Text Is Empty' },
		descriptions: {
			'zh-hant': '檢查文字是否為空',
			en: 'Check if text is empty',
		},
		fields: [],
		inputs: [{ name: 'VALUE', type: 'value', label: { 'zh-hant': '文字', en: 'text' }, check: 'String' }],
		output: { type: 'Boolean' },
		boards: SUPPORTED_BOARDS,
		tags: ['text', 'empty', 'check', '文字', '空', '檢查'],
	},
	{
		type: 'text_indexOf',
		category: 'text',
		names: { 'zh-hant': '尋找文字', en: 'Find Text' },
		descriptions: {
			'zh-hant': '在文字中尋找子字串的位置',
			en: 'Find the position of substring in text',
		},
		fields: [
			{
				name: 'END',
				type: 'dropdown',
				label: { 'zh-hant': '方向', en: 'Direction' },
				options: [
					{ value: 'FIRST', label: { 'zh-hant': '第一個', en: 'first' } },
					{ value: 'LAST', label: { 'zh-hant': '最後一個', en: 'last' } },
				],
			},
		],
		inputs: [
			{ name: 'VALUE', type: 'value', label: { 'zh-hant': '文字', en: 'text' }, check: 'String' },
			{ name: 'FIND', type: 'value', label: { 'zh-hant': '尋找', en: 'find' }, check: 'String' },
		],
		output: { type: 'Number' },
		boards: SUPPORTED_BOARDS,
		tags: ['text', 'find', 'index', 'search', '文字', '尋找', '索引', '搜尋'],
	},
	{
		type: 'text_charAt',
		category: 'text',
		names: { 'zh-hant': '取得字元', en: 'Get Character' },
		descriptions: {
			'zh-hant': '取得文字中指定位置的字元',
			en: 'Get character at specified position in text',
		},
		fields: [
			{
				name: 'WHERE',
				type: 'dropdown',
				label: { 'zh-hant': '位置', en: 'Position' },
				options: [
					{ value: 'FROM_START', label: { 'zh-hant': '第', en: '#' } },
					{ value: 'FROM_END', label: { 'zh-hant': '倒數第', en: '# from end' } },
					{ value: 'FIRST', label: { 'zh-hant': '第一個', en: 'first' } },
					{ value: 'LAST', label: { 'zh-hant': '最後一個', en: 'last' } },
					{ value: 'RANDOM', label: { 'zh-hant': '隨機', en: 'random' } },
				],
			},
		],
		inputs: [{ name: 'VALUE', type: 'value', label: { 'zh-hant': '文字', en: 'text' }, check: 'String' }],
		output: { type: 'String' },
		boards: SUPPORTED_BOARDS,
		tags: ['text', 'character', 'letter', '文字', '字元', '字母'],
	},
	{
		type: 'text_getSubstring',
		category: 'text',
		names: { 'zh-hant': '取得子字串', en: 'Get Substring' },
		descriptions: {
			'zh-hant': '取得文字的一部分',
			en: 'Get a portion of the text',
		},
		fields: [],
		inputs: [{ name: 'STRING', type: 'value', label: { 'zh-hant': '文字', en: 'text' }, check: 'String' }],
		output: { type: 'String' },
		boards: SUPPORTED_BOARDS,
		tags: ['text', 'substring', 'slice', '文字', '子字串', '切片'],
	},
	{
		type: 'text_changeCase',
		category: 'text',
		names: { 'zh-hant': '改變大小寫', en: 'Change Case' },
		descriptions: {
			'zh-hant': '將文字轉換為大寫、小寫或標題格式',
			en: 'Convert text to uppercase, lowercase, or title case',
		},
		fields: [
			{
				name: 'CASE',
				type: 'dropdown',
				label: { 'zh-hant': '格式', en: 'Case' },
				options: [
					{ value: 'UPPERCASE', label: { 'zh-hant': '大寫', en: 'UPPERCASE' } },
					{ value: 'LOWERCASE', label: { 'zh-hant': '小寫', en: 'lowercase' } },
					{ value: 'TITLECASE', label: { 'zh-hant': '標題格式', en: 'Title Case' } },
				],
			},
		],
		inputs: [{ name: 'TEXT', type: 'value', label: { 'zh-hant': '文字', en: 'text' }, check: 'String' }],
		output: { type: 'String' },
		boards: SUPPORTED_BOARDS,
		tags: ['text', 'case', 'uppercase', 'lowercase', '文字', '大小寫', '大寫', '小寫'],
	},
	{
		type: 'text_trim',
		category: 'text',
		names: { 'zh-hant': '移除空白', en: 'Trim' },
		descriptions: {
			'zh-hant': '移除文字兩端的空白字元',
			en: 'Remove whitespace from both ends of text',
		},
		fields: [
			{
				name: 'MODE',
				type: 'dropdown',
				label: { 'zh-hant': '位置', en: 'Mode' },
				options: [
					{ value: 'BOTH', label: { 'zh-hant': '兩端', en: 'both sides' } },
					{ value: 'LEFT', label: { 'zh-hant': '左端', en: 'left side' } },
					{ value: 'RIGHT', label: { 'zh-hant': '右端', en: 'right side' } },
				],
			},
		],
		inputs: [{ name: 'TEXT', type: 'value', label: { 'zh-hant': '文字', en: 'text' }, check: 'String' }],
		output: { type: 'String' },
		boards: SUPPORTED_BOARDS,
		tags: ['text', 'trim', 'whitespace', '文字', '移除', '空白'],
	},

	// === Blockly 內建清單積木 ===
	{
		type: 'lists_create_empty',
		category: 'lists',
		names: { 'zh-hant': '建立空清單', en: 'Create Empty List' },
		descriptions: {
			'zh-hant': '建立一個空的清單',
			en: 'Create an empty list',
		},
		fields: [],
		inputs: [],
		output: { type: 'Array' },
		boards: SUPPORTED_BOARDS,
		tags: ['list', 'array', 'empty', 'create', '清單', '陣列', '空', '建立'],
	},
	{
		type: 'lists_create_with',
		category: 'lists',
		names: { 'zh-hant': '建立清單', en: 'Create List' },
		descriptions: {
			'zh-hant': '使用指定的項目建立清單',
			en: 'Create a list with specified items',
		},
		fields: [],
		inputs: [],
		output: { type: 'Array' },
		boards: SUPPORTED_BOARDS,
		tags: ['list', 'array', 'create', '清單', '陣列', '建立'],
	},
	{
		type: 'lists_repeat',
		category: 'lists',
		names: { 'zh-hant': '重複項目清單', en: 'Repeat List' },
		descriptions: {
			'zh-hant': '建立一個包含重複項目的清單',
			en: 'Create a list with repeated items',
		},
		fields: [],
		inputs: [
			{ name: 'ITEM', type: 'value', label: { 'zh-hant': '項目', en: 'item' } },
			{ name: 'NUM', type: 'value', label: { 'zh-hant': '次數', en: 'times' }, check: 'Number' },
		],
		output: { type: 'Array' },
		boards: SUPPORTED_BOARDS,
		tags: ['list', 'array', 'repeat', '清單', '陣列', '重複'],
	},
	{
		type: 'lists_length',
		category: 'lists',
		names: { 'zh-hant': '清單長度', en: 'List Length' },
		descriptions: {
			'zh-hant': '取得清單中的項目數量',
			en: 'Get the number of items in a list',
		},
		fields: [],
		inputs: [{ name: 'VALUE', type: 'value', label: { 'zh-hant': '清單', en: 'list' }, check: 'Array' }],
		output: { type: 'Number' },
		boards: SUPPORTED_BOARDS,
		tags: ['list', 'array', 'length', 'count', '清單', '陣列', '長度', '計數'],
	},
	{
		type: 'lists_isEmpty',
		category: 'lists',
		names: { 'zh-hant': '清單是否為空', en: 'List Is Empty' },
		descriptions: {
			'zh-hant': '檢查清單是否為空',
			en: 'Check if a list is empty',
		},
		fields: [],
		inputs: [{ name: 'VALUE', type: 'value', label: { 'zh-hant': '清單', en: 'list' }, check: 'Array' }],
		output: { type: 'Boolean' },
		boards: SUPPORTED_BOARDS,
		tags: ['list', 'array', 'empty', 'check', '清單', '陣列', '空', '檢查'],
	},
	{
		type: 'lists_indexOf',
		category: 'lists',
		names: { 'zh-hant': '尋找項目', en: 'Find Item' },
		descriptions: {
			'zh-hant': '在清單中尋找項目的位置',
			en: 'Find the position of an item in a list',
		},
		fields: [
			{
				name: 'END',
				type: 'dropdown',
				label: { 'zh-hant': '方向', en: 'Direction' },
				options: [
					{ value: 'FIRST', label: { 'zh-hant': '第一個', en: 'first' } },
					{ value: 'LAST', label: { 'zh-hant': '最後一個', en: 'last' } },
				],
			},
		],
		inputs: [
			{ name: 'VALUE', type: 'value', label: { 'zh-hant': '清單', en: 'list' }, check: 'Array' },
			{ name: 'FIND', type: 'value', label: { 'zh-hant': '項目', en: 'item' } },
		],
		output: { type: 'Number' },
		boards: SUPPORTED_BOARDS,
		tags: ['list', 'array', 'find', 'index', '清單', '陣列', '尋找', '索引'],
	},
	{
		type: 'lists_getIndex',
		category: 'lists',
		names: { 'zh-hant': '取得項目', en: 'Get Item' },
		descriptions: {
			'zh-hant': '取得清單中指定位置的項目',
			en: 'Get an item at specified position in a list',
		},
		fields: [
			{
				name: 'MODE',
				type: 'dropdown',
				label: { 'zh-hant': '模式', en: 'Mode' },
				options: [
					{ value: 'GET', label: { 'zh-hant': '取得', en: 'get' } },
					{ value: 'GET_REMOVE', label: { 'zh-hant': '取得並移除', en: 'get and remove' } },
					{ value: 'REMOVE', label: { 'zh-hant': '移除', en: 'remove' } },
				],
			},
		],
		inputs: [{ name: 'VALUE', type: 'value', label: { 'zh-hant': '清單', en: 'list' }, check: 'Array' }],
		output: { type: null },
		boards: SUPPORTED_BOARDS,
		tags: ['list', 'array', 'get', 'item', '清單', '陣列', '取得', '項目'],
	},
	{
		type: 'lists_setIndex',
		category: 'lists',
		names: { 'zh-hant': '設定項目', en: 'Set Item' },
		descriptions: {
			'zh-hant': '設定清單中指定位置的項目',
			en: 'Set an item at specified position in a list',
		},
		fields: [
			{
				name: 'MODE',
				type: 'dropdown',
				label: { 'zh-hant': '模式', en: 'Mode' },
				options: [
					{ value: 'SET', label: { 'zh-hant': '設定', en: 'set' } },
					{ value: 'INSERT', label: { 'zh-hant': '插入', en: 'insert' } },
				],
			},
		],
		inputs: [
			{ name: 'LIST', type: 'value', label: { 'zh-hant': '清單', en: 'list' }, check: 'Array' },
			{ name: 'TO', type: 'value', label: { 'zh-hant': '為', en: 'to' } },
		],
		boards: SUPPORTED_BOARDS,
		tags: ['list', 'array', 'set', 'insert', '清單', '陣列', '設定', '插入'],
	},

	// === 文字轉換積木 ===
	{
		type: 'to_string',
		category: 'text',
		names: { 'zh-hant': '轉為字串', en: 'To String' },
		descriptions: {
			'zh-hant': '將數字或布林值轉換為字串',
			en: 'Convert number or boolean to string',
		},
		fields: [],
		inputs: [{ name: 'VALUE', type: 'value', label: { 'zh-hant': '值', en: 'Value' } }],
		output: { type: 'String' },
		boards: SUPPORTED_BOARDS,
		tags: ['string', 'convert', 'text', '字串', '轉換', '文字'],
		relatedBlocks: ['text', 'text_join'],
	},

	// === 文字連接積木 ===
	{
		type: 'text_join',
		category: 'text',
		names: { 'zh-hant': '建立文字', en: 'Create Text With' },
		descriptions: {
			'zh-hant': '將多個項目連接成一個字串',
			en: 'Join multiple items into a single string',
		},
		fields: [],
		inputs: [],
		output: { type: 'String' },
		boards: SUPPORTED_BOARDS,
		tags: ['text', 'join', 'concatenate', '文字', '連接', '串接'],
		notes: {
			'zh-hant': '使用齒輪圖示可以增加或減少連接項目的數量',
			en: 'Use the gear icon to add or remove items to join',
		},
		relatedBlocks: ['text', 'to_string'],
	},

	// === CyberBrick 核心積木 ===
	{
		type: 'cyberbrick_ticks_ms',
		category: 'cyberbrick',
		names: { 'zh-hant': '取得目前毫秒數', en: 'Get Current Milliseconds' },
		descriptions: {
			'zh-hant': '取得目前的毫秒計時值',
			en: 'Get current millisecond ticks',
		},
		fields: [],
		inputs: [],
		output: { type: 'Number' },
		boards: ['cyberbrick'],
		tags: ['time', 'ticks', 'ms', 'millisecond', '計時', '毫秒', 'cyberbrick'],
		relatedBlocks: ['cyberbrick_ticks_diff'],
	},
	{
		type: 'cyberbrick_ticks_diff',
		category: 'cyberbrick',
		names: { 'zh-hant': '計算時間差', en: 'Time Difference' },
		descriptions: {
			'zh-hant': '計算現在與開始之間的毫秒差',
			en: 'Calculate milliseconds between now and start',
		},
		fields: [],
		inputs: [
			{ name: 'NOW', type: 'value', label: { 'zh-hant': '現在', en: 'now' }, check: 'Number' },
			{ name: 'START', type: 'value', label: { 'zh-hant': '開始', en: 'start' }, check: 'Number' },
		],
		output: { type: 'Number' },
		boards: ['cyberbrick'],
		tags: ['time', 'ticks', 'diff', 'difference', '毫秒', '時間差', 'cyberbrick'],
		relatedBlocks: ['cyberbrick_ticks_ms'],
	},

	// === CyberBrick X11 擴展板積木 ===
	{
		type: 'x11_servo_180_angle',
		category: 'x11',
		names: { 'zh-hant': '180° 伺服馬達角度', en: '180° Servo Angle' },
		descriptions: {
			'zh-hant': '適用於 180° 伺服馬達 (PG001)，直接轉到指定角度 (0-180°)',
			en: 'For 180° servo (PG001), move directly to specified angle (0-180°)',
		},
		fields: [
			{
				name: 'PORT',
				type: 'dropdown',
				label: { 'zh-hant': '埠位', en: 'Port' },
				options: [
					{ value: '1', label: { 'zh-hant': 'S1', en: 'S1' } },
					{ value: '2', label: { 'zh-hant': 'S2', en: 'S2' } },
					{ value: '3', label: { 'zh-hant': 'S3', en: 'S3' } },
					{ value: '4', label: { 'zh-hant': 'S4', en: 'S4' } },
				],
			},
		],
		inputs: [{ name: 'ANGLE', type: 'value', label: { 'zh-hant': '角度', en: 'Angle' }, check: 'Number' }],
		boards: ['cyberbrick'],
		tags: ['x11', 'servo', '180', 'angle', '伺服', '馬達', '角度', 'cyberbrick'],
		relatedBlocks: ['x11_servo_360_speed', 'x11_servo_stop'],
	},
	{
		type: 'x11_servo_360_speed',
		category: 'x11',
		names: { 'zh-hant': '360° 伺服馬達速度', en: '360° Servo Speed' },
		descriptions: {
			'zh-hant': '適用於 360° 伺服馬達 (PG002)，正值順時針、負值逆時針、0 停止',
			en: 'For 360° servo (PG002), positive clockwise, negative counter-clockwise, 0 stop',
		},
		fields: [
			{
				name: 'PORT',
				type: 'dropdown',
				label: { 'zh-hant': '埠位', en: 'Port' },
				options: [
					{ value: '1', label: { 'zh-hant': 'S1', en: 'S1' } },
					{ value: '2', label: { 'zh-hant': 'S2', en: 'S2' } },
					{ value: '3', label: { 'zh-hant': 'S3', en: 'S3' } },
					{ value: '4', label: { 'zh-hant': 'S4', en: 'S4' } },
				],
			},
		],
		inputs: [{ name: 'SPEED', type: 'value', label: { 'zh-hant': '速度 %', en: 'Speed %' }, check: 'Number' }],
		boards: ['cyberbrick'],
		tags: ['x11', 'servo', '360', 'speed', '伺服', '馬達', '速度', 'cyberbrick'],
		relatedBlocks: ['x11_servo_stop'],
	},
	{
		type: 'x11_servo_stop',
		category: 'x11',
		names: { 'zh-hant': '停止伺服馬達', en: 'Stop Servo' },
		descriptions: {
			'zh-hant': '停止指定埠位的伺服馬達',
			en: 'Stop servo motor at specified port',
		},
		fields: [
			{
				name: 'PORT',
				type: 'dropdown',
				label: { 'zh-hant': '埠位', en: 'Port' },
				options: [
					{ value: '1', label: { 'zh-hant': 'S1', en: 'S1' } },
					{ value: '2', label: { 'zh-hant': 'S2', en: 'S2' } },
					{ value: '3', label: { 'zh-hant': 'S3', en: 'S3' } },
					{ value: '4', label: { 'zh-hant': 'S4', en: 'S4' } },
				],
			},
		],
		inputs: [],
		boards: ['cyberbrick'],
		tags: ['x11', 'servo', 'stop', '伺服', '馬達', '停止', 'cyberbrick'],
		relatedBlocks: ['x11_servo_180_angle', 'x11_servo_360_speed'],
	},
	{
		type: 'x11_motor_speed',
		category: 'x11',
		names: { 'zh-hant': '直流馬達速度', en: 'DC Motor Speed' },
		descriptions: {
			'zh-hant': '設定直流馬達速度，範圍 -2048 到 2048',
			en: 'Set DC motor speed, range -2048 to 2048',
		},
		fields: [
			{
				name: 'PORT',
				type: 'dropdown',
				label: { 'zh-hant': '埠位', en: 'Port' },
				options: [
					{ value: '1', label: { 'zh-hant': 'M1', en: 'M1' } },
					{ value: '2', label: { 'zh-hant': 'M2', en: 'M2' } },
				],
			},
		],
		inputs: [{ name: 'SPEED', type: 'value', label: { 'zh-hant': '速度', en: 'Speed' }, check: 'Number' }],
		boards: ['cyberbrick'],
		tags: ['x11', 'motor', 'dc', 'speed', '直流', '馬達', '速度', 'cyberbrick'],
		relatedBlocks: ['x11_motor_stop'],
	},
	{
		type: 'x11_motor_stop',
		category: 'x11',
		names: { 'zh-hant': '停止直流馬達', en: 'Stop DC Motor' },
		descriptions: {
			'zh-hant': '停止指定埠位的直流馬達',
			en: 'Stop DC motor at specified port',
		},
		fields: [
			{
				name: 'PORT',
				type: 'dropdown',
				label: { 'zh-hant': '埠位', en: 'Port' },
				options: [
					{ value: '1', label: { 'zh-hant': 'M1', en: 'M1' } },
					{ value: '2', label: { 'zh-hant': 'M2', en: 'M2' } },
				],
			},
		],
		inputs: [],
		boards: ['cyberbrick'],
		tags: ['x11', 'motor', 'dc', 'stop', '直流', '馬達', '停止', 'cyberbrick'],
		relatedBlocks: ['x11_motor_speed'],
	},
	{
		type: 'x11_led_set_color',
		category: 'x11',
		names: { 'zh-hant': 'LED 燈條設定顏色', en: 'LED Strip Set Color' },
		descriptions: {
			'zh-hant': '設定 WS2812 LED 燈條顏色，R/G/B 範圍 0-255',
			en: 'Set WS2812 LED strip color, R/G/B range 0-255',
		},
		fields: [
			{
				name: 'PORT',
				type: 'dropdown',
				label: { 'zh-hant': '埠位', en: 'Port' },
				options: [
					{ value: '21', label: { 'zh-hant': 'D1', en: 'D1' } },
					{ value: '20', label: { 'zh-hant': 'D2', en: 'D2' } },
				],
			},
			{
				name: 'INDEX',
				type: 'dropdown',
				label: { 'zh-hant': '索引', en: 'Index' },
				options: [
					{ value: '0', label: { 'zh-hant': '1', en: '1' } },
					{ value: '1', label: { 'zh-hant': '2', en: '2' } },
					{ value: '2', label: { 'zh-hant': '3', en: '3' } },
					{ value: '3', label: { 'zh-hant': '4', en: '4' } },
					{ value: 'all', label: { 'zh-hant': '全部', en: 'All' } },
				],
			},
		],
		inputs: [
			{ name: 'RED', type: 'value', label: { 'zh-hant': '紅', en: 'Red' }, check: 'Number' },
			{ name: 'GREEN', type: 'value', label: { 'zh-hant': '綠', en: 'Green' }, check: 'Number' },
			{ name: 'BLUE', type: 'value', label: { 'zh-hant': '藍', en: 'Blue' }, check: 'Number' },
		],
		boards: ['cyberbrick'],
		tags: ['x11', 'led', 'strip', 'neopixel', 'ws2812', 'rgb', 'color', 'LED', '燈條', '顏色', 'cyberbrick'],
		relatedBlocks: [],
	},

	// === CyberBrick X12 擴展板積木 ===
	{
		type: 'x12_get_joystick',
		category: 'x12',
		names: { 'zh-hant': '本地搖桿', en: 'Local Joystick' },
		descriptions: {
			'zh-hant': '讀取 X12 擴展板上本地搖桿的 ADC 值 (0-4095)',
			en: 'Read ADC value of local joystick on X12 extension board (0-4095)',
		},
		fields: [
			{
				name: 'AXIS',
				type: 'dropdown',
				label: { 'zh-hant': '軸向', en: 'Axis' },
				options: [
					{ value: 'L1', label: { 'zh-hant': '左X (L1)', en: 'Left X (L1)' } },
					{ value: 'L2', label: { 'zh-hant': '左Y (L2)', en: 'Left Y (L2)' } },
					{ value: 'L3', label: { 'zh-hant': '左Z (L3)', en: 'Left Z (L3)' } },
					{ value: 'R1', label: { 'zh-hant': '右X (R1)', en: 'Right X (R1)' } },
					{ value: 'R2', label: { 'zh-hant': '右Y (R2)', en: 'Right Y (R2)' } },
					{ value: 'R3', label: { 'zh-hant': '右Z (R3)', en: 'Right Z (R3)' } },
				],
			},
		],
		inputs: [],
		boards: ['cyberbrick'],
		tags: ['x12', 'joystick', 'adc', 'local', '搖桿', '擴展板', 'cyberbrick'],
		relatedBlocks: ['x12_get_joystick_mapped'],
	},
	{
		type: 'x12_get_joystick_mapped',
		category: 'x12',
		names: { 'zh-hant': '本地搖桿映射', en: 'Local Joystick Mapped' },
		descriptions: {
			'zh-hant': '讀取本地搖桿並映射到指定範圍',
			en: 'Read local joystick and map to specified range',
		},
		fields: [
			{
				name: 'AXIS',
				type: 'dropdown',
				label: { 'zh-hant': '軸向', en: 'Axis' },
				options: [
					{ value: 'L1', label: { 'zh-hant': '左X (L1)', en: 'Left X (L1)' } },
					{ value: 'L2', label: { 'zh-hant': '左Y (L2)', en: 'Left Y (L2)' } },
					{ value: 'L3', label: { 'zh-hant': '左Z (L3)', en: 'Left Z (L3)' } },
					{ value: 'R1', label: { 'zh-hant': '右X (R1)', en: 'Right X (R1)' } },
					{ value: 'R2', label: { 'zh-hant': '右Y (R2)', en: 'Right Y (R2)' } },
					{ value: 'R3', label: { 'zh-hant': '右Z (R3)', en: 'Right Z (R3)' } },
				],
			},
		],
		inputs: [
			{ name: 'MIN', type: 'value', label: { 'zh-hant': '最小值', en: 'Min' }, check: 'Number' },
			{ name: 'MAX', type: 'value', label: { 'zh-hant': '最大值', en: 'Max' }, check: 'Number' },
		],
		boards: ['cyberbrick'],
		tags: ['x12', 'joystick', 'map', 'range', 'local', '搖桿', '映射', '擴展板', 'cyberbrick'],
		relatedBlocks: ['x12_get_joystick'],
	},
	{
		type: 'x12_is_button_pressed',
		category: 'x12',
		names: { 'zh-hant': '本地按鈕按下?', en: 'Local Button Pressed?' },
		descriptions: {
			'zh-hant': '檢查 X12 擴展板上的本地按鈕是否被按下',
			en: 'Check if local button on X12 extension board is pressed',
		},
		fields: [
			{
				name: 'BUTTON',
				type: 'dropdown',
				label: { 'zh-hant': '按鈕', en: 'Button' },
				options: [
					{ value: 'K1', label: { 'zh-hant': 'K1', en: 'K1' } },
					{ value: 'K2', label: { 'zh-hant': 'K2', en: 'K2' } },
					{ value: 'K3', label: { 'zh-hant': 'K3', en: 'K3' } },
					{ value: 'K4', label: { 'zh-hant': 'K4', en: 'K4' } },
				],
			},
		],
		inputs: [],
		boards: ['cyberbrick'],
		tags: ['x12', 'button', 'pressed', 'local', '按鈕', '擴展板', 'cyberbrick'],
		relatedBlocks: ['x12_get_button'],
	},
	{
		type: 'x12_get_button',
		category: 'x12',
		names: { 'zh-hant': '本地按鈕狀態', en: 'Local Button State' },
		descriptions: {
			'zh-hant': '讀取本地按鈕狀態 (0=按下, 1=放開)',
			en: 'Read local button state (0=pressed, 1=released)',
		},
		fields: [
			{
				name: 'BUTTON',
				type: 'dropdown',
				label: { 'zh-hant': '按鈕', en: 'Button' },
				options: [
					{ value: 'K1', label: { 'zh-hant': 'K1', en: 'K1' } },
					{ value: 'K2', label: { 'zh-hant': 'K2', en: 'K2' } },
					{ value: 'K3', label: { 'zh-hant': 'K3', en: 'K3' } },
					{ value: 'K4', label: { 'zh-hant': 'K4', en: 'K4' } },
				],
			},
		],
		inputs: [],
		boards: ['cyberbrick'],
		tags: ['x12', 'button', 'state', 'local', '按鈕', '狀態', '擴展板', 'cyberbrick'],
		relatedBlocks: ['x12_is_button_pressed'],
	},

	// === CyberBrick RC 遙控積木 ===
	{
		type: 'rc_master_init',
		category: 'rc',
		names: { 'zh-hant': '初始化發射器', en: 'Initialize Transmitter' },
		descriptions: {
			'zh-hant': '初始化為發射器模式 (Master)，用於遙控器端',
			en: 'Initialize as transmitter mode (Master), used on remote controller side',
		},
		fields: [],
		inputs: [],
		boards: ['cyberbrick'],
		tags: ['rc', 'master', 'init', 'transmitter', '遙控', '發射', '初始化', 'cyberbrick'],
		relatedBlocks: ['rc_slave_init'],
	},
	{
		type: 'rc_slave_init',
		category: 'rc',
		names: { 'zh-hant': '初始化接收器', en: 'Initialize Receiver' },
		descriptions: {
			'zh-hant': '初始化為接收器模式 (Slave)，用於被控設備端',
			en: 'Initialize as receiver mode (Slave), used on controlled device side',
		},
		fields: [],
		inputs: [],
		boards: ['cyberbrick'],
		tags: ['rc', 'slave', 'init', 'receiver', '遙控', '接收', '初始化', 'cyberbrick'],
		relatedBlocks: ['rc_master_init'],
	},
	{
		type: 'rc_get_joystick',
		category: 'rc',
		names: { 'zh-hant': '遠端搖桿', en: 'Remote Joystick' },
		descriptions: {
			'zh-hant': '讀取遠端搖桿的 ADC 值 (0-4095)，2048 為中心',
			en: 'Read ADC value of remote joystick (0-4095), 2048 is center',
		},
		fields: [
			{
				name: 'AXIS',
				type: 'dropdown',
				label: { 'zh-hant': '軸向', en: 'Axis' },
				options: [
					{ value: 'L1', label: { 'zh-hant': '左X (L1)', en: 'Left X (L1)' } },
					{ value: 'L2', label: { 'zh-hant': '左Y (L2)', en: 'Left Y (L2)' } },
					{ value: 'L3', label: { 'zh-hant': '左Z (L3)', en: 'Left Z (L3)' } },
					{ value: 'R1', label: { 'zh-hant': '右X (R1)', en: 'Right X (R1)' } },
					{ value: 'R2', label: { 'zh-hant': '右Y (R2)', en: 'Right Y (R2)' } },
					{ value: 'R3', label: { 'zh-hant': '右Z (R3)', en: 'Right Z (R3)' } },
				],
			},
		],
		inputs: [],
		boards: ['cyberbrick'],
		tags: ['rc', 'joystick', 'remote', 'adc', '遙控', '搖桿', '遠端', 'cyberbrick'],
		relatedBlocks: ['rc_get_joystick_mapped'],
	},
	{
		type: 'rc_get_joystick_mapped',
		category: 'rc',
		names: { 'zh-hant': '遠端搖桿映射', en: 'Remote Joystick Mapped' },
		descriptions: {
			'zh-hant': '讀取遠端搖桿並映射到指定範圍',
			en: 'Read remote joystick and map to specified range',
		},
		fields: [
			{
				name: 'AXIS',
				type: 'dropdown',
				label: { 'zh-hant': '軸向', en: 'Axis' },
				options: [
					{ value: 'L1', label: { 'zh-hant': '左X (L1)', en: 'Left X (L1)' } },
					{ value: 'L2', label: { 'zh-hant': '左Y (L2)', en: 'Left Y (L2)' } },
					{ value: 'L3', label: { 'zh-hant': '左Z (L3)', en: 'Left Z (L3)' } },
					{ value: 'R1', label: { 'zh-hant': '右X (R1)', en: 'Right X (R1)' } },
					{ value: 'R2', label: { 'zh-hant': '右Y (R2)', en: 'Right Y (R2)' } },
					{ value: 'R3', label: { 'zh-hant': '右Z (R3)', en: 'Right Z (R3)' } },
				],
			},
		],
		inputs: [
			{ name: 'MIN', type: 'value', label: { 'zh-hant': '最小值', en: 'Min' }, check: 'Number' },
			{ name: 'MAX', type: 'value', label: { 'zh-hant': '最大值', en: 'Max' }, check: 'Number' },
		],
		boards: ['cyberbrick'],
		tags: ['rc', 'joystick', 'remote', 'map', 'range', '遙控', '搖桿', '映射', 'cyberbrick'],
		relatedBlocks: ['rc_get_joystick'],
	},
	{
		type: 'rc_is_button_pressed',
		category: 'rc',
		names: { 'zh-hant': '遠端按鈕按下?', en: 'Remote Button Pressed?' },
		descriptions: {
			'zh-hant': '檢查遠端按鈕是否被按下',
			en: 'Check if remote button is pressed',
		},
		fields: [
			{
				name: 'BUTTON',
				type: 'dropdown',
				label: { 'zh-hant': '按鈕', en: 'Button' },
				options: [
					{ value: 'K1', label: { 'zh-hant': 'K1', en: 'K1' } },
					{ value: 'K2', label: { 'zh-hant': 'K2', en: 'K2' } },
					{ value: 'K3', label: { 'zh-hant': 'K3', en: 'K3' } },
					{ value: 'K4', label: { 'zh-hant': 'K4', en: 'K4' } },
				],
			},
		],
		inputs: [],
		boards: ['cyberbrick'],
		tags: ['rc', 'button', 'pressed', 'remote', '遙控', '按鈕', 'cyberbrick'],
		relatedBlocks: ['rc_get_button'],
	},
	{
		type: 'rc_get_button',
		category: 'rc',
		names: { 'zh-hant': '遠端按鈕狀態', en: 'Remote Button State' },
		descriptions: {
			'zh-hant': '讀取遠端按鈕狀態 (0=按下, 1=放開)',
			en: 'Read remote button state (0=pressed, 1=released)',
		},
		fields: [
			{
				name: 'BUTTON',
				type: 'dropdown',
				label: { 'zh-hant': '按鈕', en: 'Button' },
				options: [
					{ value: 'K1', label: { 'zh-hant': 'K1', en: 'K1' } },
					{ value: 'K2', label: { 'zh-hant': 'K2', en: 'K2' } },
					{ value: 'K3', label: { 'zh-hant': 'K3', en: 'K3' } },
					{ value: 'K4', label: { 'zh-hant': 'K4', en: 'K4' } },
				],
			},
		],
		inputs: [],
		boards: ['cyberbrick'],
		tags: ['rc', 'button', 'state', 'remote', '遙控', '按鈕', '狀態', 'cyberbrick'],
		relatedBlocks: ['rc_is_button_pressed'],
	},
	{
		type: 'rc_is_connected',
		category: 'rc',
		names: { 'zh-hant': '已連線?', en: 'Connected?' },
		descriptions: {
			'zh-hant': '檢查是否已與發射器/接收器連線',
			en: 'Check if connected with transmitter/receiver',
		},
		fields: [],
		inputs: [],
		boards: ['cyberbrick'],
		tags: ['rc', 'connected', 'status', '遙控', '連線', '狀態', 'cyberbrick'],
		relatedBlocks: ['rc_get_rc_index'],
	},
	{
		type: 'rc_get_rc_index',
		category: 'rc',
		names: { 'zh-hant': '配對索引', en: 'Pairing Index' },
		descriptions: {
			'zh-hant': '取得配對索引 (0=未配對, 1=Slave 1, 2=Slave 2)',
			en: 'Get pairing index (0=not paired, 1=Slave 1, 2=Slave 2)',
		},
		fields: [],
		inputs: [],
		boards: ['cyberbrick'],
		tags: ['rc', 'index', 'pairing', 'status', '遙控', '配對', '索引', 'cyberbrick'],
		relatedBlocks: ['rc_is_connected'],
	},
];

/**
 * 生成搜尋索引
 */
function generateSearchIndex(blocks) {
	const searchIndex = {};

	for (const block of blocks) {
		// 從所有標籤建立索引
		for (const tag of block.tags) {
			const normalizedTag = tag.toLowerCase();
			if (!searchIndex[normalizedTag]) {
				searchIndex[normalizedTag] = [];
			}
			if (!searchIndex[normalizedTag].includes(block.type)) {
				searchIndex[normalizedTag].push(block.type);
			}
		}

		// 從名稱建立索引
		for (const [_locale, name] of Object.entries(block.names)) {
			const words = name.toLowerCase().split(/\s+/);
			for (const word of words) {
				if (word.length > 1) {
					if (!searchIndex[word]) {
						searchIndex[word] = [];
					}
					if (!searchIndex[word].includes(block.type)) {
						searchIndex[word].push(block.type);
					}
				}
			}
		}
	}

	return searchIndex;
}

/**
 * 生成完整字典
 */
function generateDictionary() {
	const packageJson = require('../package.json');

	// 建立索引
	const byType = {};
	const byCategory = {};

	BLOCK_DEFINITIONS.forEach((block, index) => {
		byType[block.type] = index;

		if (!byCategory[block.category]) {
			byCategory[block.category] = [];
		}
		byCategory[block.category].push(index);
	});

	const dictionary = {
		version: packageJson.version,
		generatedAt: new Date().toISOString(),
		blocks: BLOCK_DEFINITIONS,
		categories: CATEGORIES,
		indices: {
			byType,
			byCategory,
			searchIndex: generateSearchIndex(BLOCK_DEFINITIONS),
		},
	};

	return dictionary;
}

// 主程式
function main() {
	console.log('Generating block dictionary...');

	const dictionary = generateDictionary();

	// 寫入檔案
	const outputPath = path.join(__dirname, '..', 'src', 'mcp', 'block-dictionary.json');
	fs.mkdirSync(path.dirname(outputPath), { recursive: true });
	fs.writeFileSync(outputPath, JSON.stringify(dictionary, null, 2), 'utf8');

	console.log(`Dictionary generated successfully!`);
	console.log(`  - Blocks: ${dictionary.blocks.length}`);
	console.log(`  - Categories: ${dictionary.categories.length}`);
	console.log(`  - Output: ${outputPath}`);
}

main();
