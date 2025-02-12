// 定義全局變數
window.BOARD_CONFIGS = {
	uno: {
		name: 'Arduino Uno',
		digitalPins: [
			['D2', '2'],
			['D3 (PWM)', '3'],
			['D4', '4'],
			['D5 (PWM)', '5'],
			['D6 (PWM)', '6'],
			['D7', '7'],
			['D8', '8'],
			['D9 (PWM)', '9'],
			['D10 (PWM)', '10'],
			['D11 (PWM)', '11'],
			['D12', '12'],
			['D13', '13'],
		],
		analogPins: [
			['A0', 'A0'],
			['A1', 'A1'],
			['A2', 'A2'],
			['A3', 'A3'],
			['A4', 'A4'],
			['A5', 'A5'],
		],
		analogOutputRange: {
			min: 0,
			max: 255, // 8位分辨率
			defaultValue: 0,
		},
	},
	nano: {
		name: 'Arduino Nano',
		digitalPins: [
			['D2', '2'],
			['D3 (PWM)', '3'],
			['D4', '4'],
			['D5 (PWM)', '5'],
			['D6 (PWM)', '6'],
			['D7', '7'],
			['D8', '8'],
			['D9 (PWM)', '9'],
			['D10 (PWM)', '10'],
			['D11 (PWM)', '11'],
			['D12', '12'],
			['D13', '13'],
		],
		analogPins: [
			['A0', 'A0'],
			['A1', 'A1'],
			['A2', 'A2'],
			['A3', 'A3'],
			['A4', 'A4'],
			['A5', 'A5'],
			['A6', 'A6'],
			['A7', 'A7'],
		],
		analogOutputRange: {
			min: 0,
			max: 255, // 8位分辨率
			defaultValue: 0,
		},
	},
	mega: {
		name: 'Arduino Mega',
		digitalPins: [
			['D2', '2'],
			['D3 (PWM)', '3'],
			['D4', '4'],
			['D5 (PWM)', '5'],
			['D6 (PWM)', '6'],
			['D7', '7'],
			['D8', '8'],
			['D9 (PWM)', '9'],
			['D10 (PWM)', '10'],
			['D11 (PWM)', '11'],
			['D12', '12'],
			['D13', '13'],
			['D22', '22'],
			['D23', '23'],
			['D24', '24'],
			['D25', '25'],
			['D26', '26'],
			['D27', '27'],
			['D28', '28'],
			['D29', '29'],
			['D30', '30'],
			['D31', '31'],
			['D32', '32'],
			['D33', '33'],
			['D34', '34'],
			['D35', '35'],
		],
		analogPins: [
			['A0', 'A0'],
			['A1', 'A1'],
			['A2', 'A2'],
			['A3', 'A3'],
			['A4', 'A4'],
			['A5', 'A5'],
			['A6', 'A6'],
			['A7', 'A7'],
			['A8', 'A8'],
			['A9', 'A9'],
			['A10', 'A10'],
			['A11', 'A11'],
			['A12', 'A12'],
			['A13', 'A13'],
			['A14', 'A14'],
			['A15', 'A15'],
		],
		analogOutputRange: {
			min: 0,
			max: 255, // 8位分辨率
			defaultValue: 0,
		},
	},
	esp32: {
		name: 'ESP32',
		digitalPins: [
			['GPIO2', '2'],
			['GPIO4', '4'],
			['GPIO5', '5'],
			['GPIO12', '12'],
			['GPIO13', '13'],
			['GPIO14', '14'],
			['GPIO15', '15'],
			['GPIO16', '16'],
			['GPIO17', '17'],
			['GPIO18 (PWM)', '18'],
			['GPIO19', '19'],
			['GPIO21', '21'],
			['GPIO22', '22'],
			['GPIO23', '23'],
			['GPIO25 (PWM)', '25'],
			['GPIO26 (PWM)', '26'],
			['GPIO27', '27'],
			['GPIO32', '32'],
			['GPIO33', '33'],
		],
		analogPins: [
			['GPIO36 (ADC1_CH0)', '36'],
			['GPIO39 (ADC1_CH3)', '39'],
			['GPIO34 (ADC1_CH6)', '34'],
			['GPIO35 (ADC1_CH7)', '35'],
			['GPIO32 (ADC1_CH4)', '32'],
			['GPIO33 (ADC1_CH5)', '33'],
		],
		analogOutputRange: {
			min: 0,
			max: 4095, // ESP32 LEDC 預設使用 12 位分辨率 (0-4095)
			defaultValue: 0,
		},
		pwmChannels: {
			// 定義特定腳位對應的首選 LEDC 通道
			18: 0, // GPIO18 優先使用通道 0
			19: 1, // GPIO19 優先使用通道 1
			21: 2, // GPIO21 優先使用通道 2
			22: 3, // GPIO22 優先使用通道 3
			23: 4, // GPIO23 優先使用通道 4
			25: 5, // GPIO25 優先使用通道 5
			26: 6, // GPIO26 優先使用通道 6
			27: 7, // GPIO27 優先使用通道 7
			// 其他腳位將動態分配通道
		},
	},
	supermini: {
		name: 'Super Mini',
		digitalPins: [
			['D2', '2'],
			['D3 (PWM)', '3'],
			['D4', '4'],
			['D5 (PWM)', '5'],
			['D6 (PWM)', '6'],
			['D7', '7'],
			['D8', '8'],
			['D9 (PWM)', '9'],
			['D10 (PWM)', '10'],
			['D11 (PWM)', '11'],
			['D12', '12'],
			['D13', '13'],
		],
		analogPins: [
			['A0', 'A0'],
			['A1', 'A1'],
			['A2', 'A2'],
			['A3', 'A3'],
		],
		analogOutputRange: {
			min: 0,
			max: 1023, // 10位分辨率
			defaultValue: 0,
		},
	},
};

// 預設值，設為全局變數
window.currentBoard = 'uno';

// 設定當前板子的全局函數
window.setCurrentBoard = function (boardType) {
	if (window.BOARD_CONFIGS[boardType] || boardType === 'none') {
		window.currentBoard = boardType;
	}
};

// 獲取當前選擇的板子類型的全局函數
window.getCurrentBoard = function () {
	return window.currentBoard;
};

// 獲取數位腳位選項的全局函數
window.getDigitalPinOptions = function () {
	if (window.currentBoard === 'none') {
		return [['無', '-1']];
	}
	const board = window.BOARD_CONFIGS[window.currentBoard];
	return board ? board.digitalPins : [];
};

// 獲取類比腳位選項的全局函數
window.getAnalogPinOptions = function () {
	if (window.currentBoard === 'none') {
		return [['無', '-1']];
	}
	const board = window.BOARD_CONFIGS[window.currentBoard];
	return board ? board.analogPins : [];
};

// 獲取類比輸出範圍的全局函數
window.getAnalogOutputRange = function () {
	if (window.currentBoard === 'none') {
		return { min: 0, max: 255, defaultValue: 0 };
	}
	const board = window.BOARD_CONFIGS[window.currentBoard];
	return board ? board.analogOutputRange : { min: 0, max: 255, defaultValue: 0 };
};

// 添加獲取 PWM 通道的輔助函數
window.getPWMChannel = function (pin) {
	const board = window.BOARD_CONFIGS[window.currentBoard];
	if (board && board.pwmChannels && board.pwmChannels.hasOwnProperty(pin)) {
		return board.pwmChannels[pin];
	}
	// 如果沒有預定義的通道，返回 null
	return null;
};
