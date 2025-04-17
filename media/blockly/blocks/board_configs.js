/**
 * @license
 * Copyright 2024 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

// 定義全局變數
window.BOARD_CONFIGS = {
	uno: {
		name: 'Arduino Uno',
		digitalPins: [
			['D0 (RX)', '0'],
			['D1 (TX)', '1'],
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
			['D13 (LED)', '13'],
		],
		analogPins: [
			['A0', 'A0'],
			['A1', 'A1'],
			['A2', 'A2'],
			['A3', 'A3'],
			['A4 (SDA)', 'A4'],
			['A5 (SCL)', 'A5'],
		],
		// 新增硬體中斷腳位
		interruptPins: [
			['D2 (INT0)', '2'],
			['D3 (INT1)', '3'],
		],
		analogOutputRange: {
			min: 0,
			max: 255, // 8位分辨率
			defaultValue: 0,
		},
		pullupPins: {
			0: true,
			1: true,
			2: true,
			3: true,
			4: true,
			5: true,
			6: true,
			7: true,
			8: true,
			9: true,
			10: true,
			11: true,
			12: true,
			13: true,
			A0: true,
			A1: true,
			A2: true,
			A3: true,
			A4: true,
			A5: true,
		},
		// 新增 platformio 設定
		platformConfig: `[env:uno]
platform = atmelavr
board = uno
framework = arduino`,
	},
	nano: {
		name: 'Arduino Nano',
		digitalPins: [
			['D0 (RX)', '0'],
			['D1 (TX)', '1'],
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
			['D13 (LED)', '13'],
		],
		analogPins: [
			['A0', 'A0'],
			['A1', 'A1'],
			['A2', 'A2'],
			['A3', 'A3'],
			['A4 (SDA)', 'A4'],
			['A5 (SCL)', 'A5'],
			['A6', 'A6'],
			['A7', 'A7'],
		],
		// 新增硬體中斷腳位
		interruptPins: [
			['D2 (INT0)', '2'],
			['D3 (INT1)', '3'],
		],
		analogOutputRange: {
			min: 0,
			max: 255, // 8位分辨率
			defaultValue: 0,
		},
		pullupPins: {
			0: true,
			1: true,
			2: true,
			3: true,
			4: true,
			5: true,
			6: true,
			7: true,
			8: true,
			9: true,
			10: true,
			11: true,
			12: true,
			13: true,
			A0: true,
			A1: true,
			A2: true,
			A3: true,
			A4: true,
			A5: true,
			A6: true,
			A7: true,
		},
		// 新增 platformio 設定
		platformConfig: `[env:nano]
platform = atmelavr
board = nanoatmega328
framework = arduino`,
	},
	mega: {
		name: 'Arduino Mega 2560',
		digitalPins: [
			['D0 (RX0)', '0'],
			['D1 (TX0)', '1'],
			['D2 (PWM)', '2'],
			['D3 (PWM)', '3'],
			['D4 (PWM)', '4'],
			['D5 (PWM)', '5'],
			['D6 (PWM)', '6'],
			['D7 (PWM)', '7'],
			['D8 (PWM)', '8'],
			['D9 (PWM)', '9'],
			['D10 (PWM)', '10'],
			['D11 (PWM)', '11'],
			['D12 (PWM)', '12'],
			['D13 (PWM)(LED)', '13'],
			['D14 (TX3)', '14'],
			['D15 (RX3)', '15'],
			['D16 (TX2)', '16'],
			['D17 (RX2)', '17'],
			['D18 (TX1)', '18'],
			['D19 (RX1)', '19'],
			['D20 (SDA)', '20'],
			['D21 (SCL)', '21'],
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
			['D36', '36'],
			['D37', '37'],
			['D38', '38'],
			['D39', '39'],
			['D40', '40'],
			['D41', '41'],
			['D42', '42'],
			['D43', '43'],
			['D44 (PWM)', '44'],
			['D45 (PWM)', '45'],
			['D46 (PWM)', '46'],
			['D47', '47'],
			['D48', '48'],
			['D49', '49'],
			['D50 (MISO)', '50'],
			['D51 (MOSI)', '51'],
			['D52 (SCK)', '52'],
			['D53 (SS)', '53'],
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
		// 新增硬體中斷腳位
		interruptPins: [
			['D2', '2'],
			['D3', '3'],
			['D18', '18'],
			['D19', '19'],
			['D20 (SDA)', '20'],
			['D21 (SCL)', '21'],
		],
		analogOutputRange: {
			min: 0,
			max: 255, // 8位分辨率
			defaultValue: 0,
		},
		pullupPins: {
			0: true,
			1: true,
			2: true,
			3: true,
			4: true,
			5: true,
			6: true,
			7: true,
			8: true,
			9: true,
			10: true,
			11: true,
			12: true,
			13: true,
			14: true,
			15: true,
			16: true,
			17: true,
			18: true,
			19: true,
			20: true,
			21: true,
			22: true,
			23: true,
			24: true,
			25: true,
			26: true,
			27: true,
			28: true,
			29: true,
			30: true,
			31: true,
			32: true,
			33: true,
			34: true,
			35: true,
			36: true,
			37: true,
			38: true,
			39: true,
			40: true,
			41: true,
			42: true,
			43: true,
			44: true,
			45: true,
			46: true,
			47: true,
			48: true,
			49: true,
			50: true,
			51: true,
			52: true,
			53: true,
			A0: true,
			A1: true,
			A2: true,
			A3: true,
			A4: true,
			A5: true,
			A6: true,
			A7: true,
			A8: true,
			A9: true,
			A10: true,
			A11: true,
			A12: true,
			A13: true,
			A14: true,
			A15: true,
		},
		// 新增 platformio 設定
		platformConfig: `[env:mega]
platform = atmelavr
board = megaatmega2560
framework = arduino`,
	},
	esp32: {
		name: 'ESP32',
		digitalPins: [
			['GPIO0', '0'],
			['GPIO1 (TX0)', '1'],
			['GPIO2', '2'],
			['GPIO3 (RX0)', '3'],
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
			['GPIO21 (SDA)', '21'],
			['GPIO22 (SCL)', '22'],
			['GPIO23', '23'],
			['GPIO25 (PWM)', '25'],
			['GPIO26 (PWM)', '26'],
			['GPIO27', '27'],
			['GPIO32', '32'],
			['GPIO33', '33'],
			['GPIO34', '34'],
			['GPIO35', '35'],
			['GPIO36', '36'],
			['GPIO39', '39'],
		],
		// ESP32 所有數位引腳都可作為中斷引腳
		interruptPins: [
			['GPIO0', '0'],
			['GPIO1 (TX0)', '1'],
			['GPIO2', '2'],
			['GPIO3 (RX0)', '3'],
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
			['GPIO21 (SDA)', '21'],
			['GPIO22 (SCL)', '22'],
			['GPIO23', '23'],
			['GPIO25 (PWM)', '25'],
			['GPIO26 (PWM)', '26'],
			['GPIO27', '27'],
			['GPIO32', '32'],
			['GPIO33', '33'],
			['GPIO34', '34'],
			['GPIO35', '35'],
			['GPIO36', '36'],
			['GPIO39', '39'],
		],
		analogPins: [
			['GPIO32 (ADC1_CH4)', '32'],
			['GPIO33 (ADC1_CH5)', '33'],
			['GPIO34 (ADC1_CH6)', '34'],
			['GPIO35 (ADC1_CH7)', '35'],
			['GPIO36 (ADC1_CH0)', '36'],
			['GPIO39 (ADC1_CH3)', '39'],
		],
		analogOutputRange: {
			min: 0,
			max: 4095, // ESP32 的 PWM（LEDC）預設為 12 位元解析度
			defaultValue: 0,
		},
		pwmChannels: {
			// 定義特定引腳對應的首選 LEDC 通道
			18: 0, // GPIO18 優先使用通道 0
			19: 1, // GPIO19 優先使用通道 1
			21: 2, // GPIO21 優先使用通道 2
			22: 3, // GPIO22 優先使用通道 3
			23: 4, // GPIO23 優先使用通道 4
			25: 5, // GPIO25 優先使用通道 5
			26: 6, // GPIO26 優先使用通道 6
			27: 7, // GPIO27 優先使用通道 7
			// 其他引腳將動態分配通道
		},
		pullupPins: {
			0: true,
			1: true,
			2: true,
			3: true,
			4: true,
			5: true,
			12: true,
			13: true,
			14: true,
			15: true,
			16: true,
			17: true,
			18: true,
			19: true,
			21: true,
			22: true,
			23: true,
			25: true,
			26: true,
			27: true,
			32: true,
			33: true,
			// GPIO34 至 GPIO39 無內建上拉電阻
		},
		// 新增 platformio 設定
		platformConfig: `[env:esp32]
platform = espressif32
board = esp32dev
framework = arduino`,
	},
	supermini: {
		name: 'Super Mini',
		digitalPins: [
			['D0 (RX)', '0'],
			['D1 (TX)', '1'],
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
			['D13 (LED)', '13'],
		],
		analogPins: [
			['A0', 'A0'],
			['A1', 'A1'],
			['A2', 'A2'],
			['A3', 'A3'],
			['A4 (SDA)', 'A4'],
			['A5 (SCL)', 'A5'],
		],
		// 假設與 Arduino Nano 相同的中斷能力
		interruptPins: [
			['D2', '2'],
			['D3', '3'],
		],
		analogOutputRange: {
			min: 0,
			max: 255, // 8位分辨率
			defaultValue: 0,
		},
		pullupPins: {
			0: true,
			1: true,
			2: true,
			3: true,
			4: true,
			5: true,
			6: true,
			7: true,
			8: true,
			9: true,
			10: true,
			11: true,
			12: true,
			13: true,
			A0: true,
			A1: true,
			A2: true,
			A3: true,
			A4: true,
			A5: true,
		},
		// 新增 platformio 設定
		platformConfig: `[env:lolin_c3_mini]
platform = espressif32
board = lolin_c3_mini
framework = arduino`,
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
		return [[window.languageManager.getMessage('BOARD_NONE'), '-1']];
	}
	const board = window.BOARD_CONFIGS[window.currentBoard];
	return board ? board.digitalPins : [];
};

// 獲取類比腳位選項的全局函數
window.getAnalogPinOptions = function () {
	if (window.currentBoard === 'none') {
		return [[window.languageManager.getMessage('BOARD_NONE'), '-1']];
	}
	const board = window.BOARD_CONFIGS[window.currentBoard];
	return board ? board.analogPins : [];
};

// 獲取中斷腳位選項的全局函數
window.getInterruptPinOptions = function () {
	if (window.currentBoard === 'none') {
		return [[window.languageManager.getMessage('BOARD_NONE'), '-1']];
	}
	const board = window.BOARD_CONFIGS[window.currentBoard];
	return board && board.interruptPins ? board.interruptPins : [];
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

window.getPullupPinOptions = function () {
	if (window.currentBoard === 'none') {
		return [[window.languageManager.getMessage('BOARD_NONE'), '-1']];
	}
	const board = window.BOARD_CONFIGS[window.currentBoard];
	if (!board || !board.pullupPins) {
		return [];
	}

	// 合併數位和類比腳位，並過濾出支援上拉的腳位
	const allPins = [...board.digitalPins, ...board.analogPins];
	return allPins.filter(pin => {
		const pinNumber = pin[1];
		return board.pullupPins[pinNumber];
	});
};

// 新增：獲取板子的 platformio.ini 配置
window.getBoardConfig = function (board) {
	if (board === 'none') {
		return ''; // 返回空字串
	}

	const boardConfig = window.BOARD_CONFIGS[board];
	return boardConfig ? boardConfig.platformConfig : '';
};
