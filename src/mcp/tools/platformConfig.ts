/**
 * @license
 * Copyright 2025 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 *
 * 平台配置工具
 * 提供 get_platform_config, get_board_pins, get_generated_code 功能
 */

import { z } from 'zod';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import * as fs from 'fs';
import * as path from 'path';

// === 日誌工具 ===

function logToolCall(tool: string, params: Record<string, unknown>, result: { success: boolean; message?: string }): void {
	const timestamp = new Date().toISOString();
	const logEntry = {
		timestamp,
		tool,
		params,
		result,
	};
	console.error(`[MCP] ${JSON.stringify(logEntry)}`);
}

// === 板卡配置資料 ===

const BOARD_CONFIGS: Record<
	string,
	{
		name: string;
		platformio: { platform: string; board: string; framework: string };
		pins: {
			digital: Array<[string, string]>;
			analog: Array<[string, string]>;
			pwm: number[];
			interrupt: number[];
			i2c: { sda: number | string; scl: number | string };
			spi: { mosi: number; miso: number; sck: number; ss: number };
			touch?: number[];
		};
		capabilities: string[];
	}
> = {
	arduino_uno: {
		name: 'Arduino Uno',
		platformio: { platform: 'atmelavr', board: 'uno', framework: 'arduino' },
		pins: {
			digital: [
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
			analog: [
				['A0', 'A0'],
				['A1', 'A1'],
				['A2', 'A2'],
				['A3', 'A3'],
				['A4 (SDA)', 'A4'],
				['A5 (SCL)', 'A5'],
			],
			pwm: [3, 5, 6, 9, 10, 11],
			interrupt: [2, 3],
			i2c: { sda: 'A4', scl: 'A5' },
			spi: { mosi: 11, miso: 12, sck: 13, ss: 10 },
		},
		capabilities: [],
	},
	arduino_nano: {
		name: 'Arduino Nano',
		platformio: { platform: 'atmelavr', board: 'nanoatmega328new', framework: 'arduino' },
		pins: {
			digital: [
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
			analog: [
				['A0', 'A0'],
				['A1', 'A1'],
				['A2', 'A2'],
				['A3', 'A3'],
				['A4 (SDA)', 'A4'],
				['A5 (SCL)', 'A5'],
				['A6', 'A6'],
				['A7', 'A7'],
			],
			pwm: [3, 5, 6, 9, 10, 11],
			interrupt: [2, 3],
			i2c: { sda: 'A4', scl: 'A5' },
			spi: { mosi: 11, miso: 12, sck: 13, ss: 10 },
		},
		capabilities: [],
	},
	arduino_mega: {
		name: 'Arduino Mega 2560',
		platformio: { platform: 'atmelavr', board: 'megaatmega2560', framework: 'arduino' },
		pins: {
			digital: [
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
			],
			analog: [
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
			pwm: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 44, 45, 46],
			interrupt: [2, 3, 18, 19, 20, 21],
			i2c: { sda: 20, scl: 21 },
			spi: { mosi: 51, miso: 50, sck: 52, ss: 53 },
		},
		capabilities: [],
	},
	esp32: {
		name: 'ESP32',
		platformio: { platform: 'espressif32', board: 'esp32dev', framework: 'arduino' },
		pins: {
			digital: [
				['GPIO0 (PWM)', '0'],
				['GPIO2 (PWM)', '2'],
				['GPIO4 (PWM)', '4'],
				['GPIO5 (PWM)', '5'],
				['GPIO12 (PWM)', '12'],
				['GPIO13 (PWM)', '13'],
				['GPIO14 (PWM)', '14'],
				['GPIO15 (PWM)', '15'],
				['GPIO16 (PWM)', '16'],
				['GPIO17 (PWM)', '17'],
				['GPIO18 (PWM/SPI_CLK)', '18'],
				['GPIO19 (PWM/SPI_MISO)', '19'],
				['GPIO21 (PWM/SDA)', '21'],
				['GPIO22 (PWM/SCL)', '22'],
				['GPIO23 (PWM/SPI_MOSI)', '23'],
				['GPIO25 (PWM/DAC1)', '25'],
				['GPIO26 (PWM/DAC2)', '26'],
				['GPIO27 (PWM)', '27'],
				['GPIO32 (PWM/ADC)', '32'],
				['GPIO33 (PWM/ADC)', '33'],
				['GPIO34 (Input only/ADC)', '34'],
				['GPIO35 (Input only/ADC)', '35'],
				['GPIO36 (Input only/ADC/VP)', '36'],
				['GPIO39 (Input only/ADC/VN)', '39'],
			],
			analog: [
				['GPIO32 (ADC1_CH4)', '32'],
				['GPIO33 (ADC1_CH5)', '33'],
				['GPIO34 (ADC1_CH6)', '34'],
				['GPIO35 (ADC1_CH7)', '35'],
				['GPIO36 (ADC1_CH0/VP)', '36'],
				['GPIO39 (ADC1_CH3/VN)', '39'],
			],
			pwm: [0, 2, 4, 5, 12, 13, 14, 15, 16, 17, 18, 19, 21, 22, 23, 25, 26, 27, 32, 33],
			interrupt: [0, 2, 4, 5, 12, 13, 14, 15, 16, 17, 18, 19, 21, 22, 23, 25, 26, 27, 32, 33, 34, 35, 36, 39],
			i2c: { sda: 21, scl: 22 },
			spi: { mosi: 23, miso: 19, sck: 18, ss: 5 },
			touch: [0, 2, 4, 12, 13, 14, 15, 27, 32, 33],
		},
		capabilities: ['wifi', 'bluetooth', 'ble', 'touch_sensor', 'pwm_channels', 'dac', 'adc_12bit', 'mqtt'],
	},
	esp32_supermini: {
		name: 'ESP32 Super Mini',
		platformio: { platform: 'espressif32', board: 'lolin_c3_mini', framework: 'arduino' },
		pins: {
			digital: [
				['GPIO0', '0'],
				['GPIO1', '1'],
				['GPIO2', '2'],
				['GPIO3', '3'],
				['GPIO4', '4'],
				['GPIO5', '5'],
				['GPIO6', '6'],
				['GPIO7', '7'],
				['GPIO8 (SDA)', '8'],
				['GPIO9 (SCL)', '9'],
				['GPIO10', '10'],
				['GPIO20 (RX)', '20'],
				['GPIO21 (TX)', '21'],
			],
			analog: [
				['GPIO0', '0'],
				['GPIO1', '1'],
				['GPIO2', '2'],
				['GPIO3', '3'],
				['GPIO4', '4'],
			],
			pwm: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 20, 21],
			interrupt: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 20, 21],
			i2c: { sda: 8, scl: 9 },
			spi: { mosi: 6, miso: 5, sck: 4, ss: 7 },
		},
		capabilities: ['wifi', 'ble', 'mqtt'],
	},
};

// === Schema 定義 ===

const BoardTypeSchema = z.enum(['arduino_uno', 'arduino_nano', 'arduino_mega', 'esp32', 'esp32_supermini']).describe('板卡類型');

// === 工具函數 ===

/**
 * 取得工作區路徑
 */
function getWorkspacePath(): string | null {
	// 從環境變數或預設路徑取得
	return process.env.WORKSPACE_PATH || process.cwd();
}

/**
 * 讀取 platformio.ini 配置
 */
function readPlatformioIni(
	workspacePath: string
): { board: string; libraries: Array<{ name: string; version: string }>; buildFlags: string[] } | null {
	const iniPath = path.join(workspacePath, 'platformio.ini');

	if (!fs.existsSync(iniPath)) {
		return null;
	}

	try {
		const content = fs.readFileSync(iniPath, 'utf8');
		const lines = content.split('\n');

		let board = 'arduino_uno';
		const libraries: Array<{ name: string; version: string }> = [];
		const buildFlags: string[] = [];

		for (const line of lines) {
			const trimmed = line.trim();

			if (trimmed.startsWith('board = ')) {
				const boardValue = trimmed.substring('board = '.length);
				// 映射 PlatformIO board 名稱到我們的板卡類型
				if (boardValue === 'uno') {
					board = 'arduino_uno';
				} else if (boardValue === 'nanoatmega328new') {
					board = 'arduino_nano';
				} else if (boardValue === 'megaatmega2560') {
					board = 'arduino_mega';
				} else if (boardValue === 'esp32dev') {
					board = 'esp32';
				} else if (boardValue === 'lolin_c3_mini') {
					board = 'esp32_supermini';
				}
			}

			if (trimmed.startsWith('lib_deps = ') || trimmed.startsWith('lib_deps=')) {
				const deps = trimmed.substring(trimmed.indexOf('=') + 1).trim();
				if (deps) {
					const depList = deps.split(',').map(d => d.trim());
					for (const dep of depList) {
						const [name, version] = dep.split('@');
						libraries.push({ name: name.trim(), version: version?.trim() || 'latest' });
					}
				}
			}

			if (trimmed.startsWith('build_flags = ') || trimmed.startsWith('build_flags=')) {
				const flags = trimmed.substring(trimmed.indexOf('=') + 1).trim();
				if (flags) {
					buildFlags.push(...flags.split(' ').filter(f => f));
				}
			}
		}

		return { board, libraries, buildFlags };
	} catch {
		return null;
	}
}

/**
 * 讀取生成的程式碼
 */
function readGeneratedCode(workspacePath: string): string | null {
	const mainCppPath = path.join(workspacePath, 'src', 'main.cpp');

	if (!fs.existsSync(mainCppPath)) {
		return null;
	}

	try {
		return fs.readFileSync(mainCppPath, 'utf8');
	} catch {
		return null;
	}
}

/**
 * 從程式碼中提取 include 和 libraries
 */
function extractCodeInfo(code: string): { includes: string[]; libraries: string[] } {
	const includes: string[] = [];
	const libraries: string[] = [];

	const includeRegex = /#include\s*[<"]([^>"]+)[>"]/g;
	let match;

	while ((match = includeRegex.exec(code)) !== null) {
		includes.push(match[1]);

		// 推斷函式庫名稱
		const header = match[1];
		if (header === 'Servo.h') {
			libraries.push('Servo');
		} else if (header === 'Wire.h') {
			libraries.push('Wire');
		} else if (header === 'SPI.h') {
			libraries.push('SPI');
		} else if (header === 'HUSKYLENS.h') {
			libraries.push('HUSKYLENS');
		} else if (header === 'SmartCamReader.h') {
			libraries.push('Pixetto');
		} else if (header === 'ESP32Servo.h') {
			libraries.push('ESP32Servo');
		}
	}

	return { includes, libraries: [...new Set(libraries)] };
}

// === 工具註冊 ===

/**
 * 註冊平台配置工具到 MCP Server
 */
export function registerPlatformConfigTools(server: McpServer): void {
	// === get_platform_config ===
	server.tool('get_platform_config', '取得目前的 PlatformIO 配置資訊。', {}, async () => {
		const workspacePath = getWorkspacePath();

		if (!workspacePath) {
			logToolCall('get_platform_config', {}, { success: false, message: 'No workspace path' });
			return {
				content: [
					{
						type: 'text' as const,
						text: '無法取得工作區路徑',
					},
				],
				isError: true,
			};
		}

		const config = readPlatformioIni(workspacePath);

		if (!config) {
			// 返回預設配置
			const defaultBoard = 'arduino_uno';
			const boardConfig = BOARD_CONFIGS[defaultBoard];

			logToolCall('get_platform_config', {}, { success: true, message: 'Using default config' });

			return {
				content: [
					{
						type: 'text' as const,
						text: JSON.stringify(
							{
								board: defaultBoard,
								platformio: boardConfig.platformio,
								libraries: [],
								buildFlags: [],
								warning: 'platformio.ini 不存在，使用預設配置',
							},
							null,
							2
						),
					},
				],
			};
		}

		const boardConfig = BOARD_CONFIGS[config.board] || BOARD_CONFIGS['arduino_uno'];

		logToolCall('get_platform_config', {}, { success: true, message: `Board: ${config.board}` });

		return {
			content: [
				{
					type: 'text' as const,
					text: JSON.stringify(
						{
							board: config.board,
							platformio: boardConfig.platformio,
							libraries: config.libraries,
							buildFlags: config.buildFlags,
						},
						null,
						2
					),
				},
			],
		};
	});

	// === get_board_pins ===
	server.tool(
		'get_board_pins',
		'取得指定板卡的腳位配置資訊。',
		{
			board: BoardTypeSchema.optional().describe('板卡類型，不指定則使用目前板卡'),
		},
		async ({ board }) => {
			// 取得板卡類型
			type BoardKey = keyof typeof BOARD_CONFIGS;
			let boardType: BoardKey = board as BoardKey;

			if (!boardType) {
				// 嘗試從 platformio.ini 讀取
				const workspacePath = getWorkspacePath();
				if (workspacePath) {
					const config = readPlatformioIni(workspacePath);
					boardType = (config?.board as BoardKey) || 'arduino_uno';
				} else {
					boardType = 'arduino_uno';
				}
			}

			const boardConfig = BOARD_CONFIGS[boardType];

			if (!boardConfig) {
				const supportedBoards = Object.keys(BOARD_CONFIGS).join(', ');

				logToolCall('get_board_pins', { board: boardType }, { success: false, message: 'Unsupported board' });

				return {
					content: [
						{
							type: 'text' as const,
							text: `不支援的板卡類型: ${boardType}\n\n支援的板卡: ${supportedBoards}`,
						},
					],
					isError: true,
				};
			}

			logToolCall('get_board_pins', { board: boardType }, { success: true });

			return {
				content: [
					{
						type: 'text' as const,
						text: JSON.stringify(
							{
								board: boardType,
								name: boardConfig.name,
								pins: {
									digital: boardConfig.pins.digital.map(([label, value]: [string, string]) => ({ label, value })),
									analog: boardConfig.pins.analog.map(([label, value]: [string, string]) => ({ label, value })),
									pwm: boardConfig.pins.pwm,
									interrupt: boardConfig.pins.interrupt,
									i2c: boardConfig.pins.i2c,
									spi: boardConfig.pins.spi,
									touch: boardConfig.pins.touch,
								},
								capabilities: boardConfig.capabilities,
							},
							null,
							2
						),
					},
				],
			};
		}
	);

	// === get_generated_code ===
	server.tool(
		'get_generated_code',
		'取得目前工作區生成的 Arduino 程式碼。【建議】在修改 main.json 並執行 refresh_editor 後，務必使用此工具檢查程式碼是否正確生成，包括 #include、變數宣告、setup() 和 loop() 內容。',
		{
			format: z.enum(['arduino', 'cpp']).default('arduino').optional().describe('程式碼格式'),
		},
		async ({ format }) => {
			const workspacePath = getWorkspacePath();

			if (!workspacePath) {
				logToolCall('get_generated_code', { format }, { success: false, message: 'No workspace path' });
				return {
					content: [
						{
							type: 'text' as const,
							text: '無法取得工作區路徑',
						},
					],
					isError: true,
				};
			}

			const code = readGeneratedCode(workspacePath);

			if (!code) {
				logToolCall('get_generated_code', { format }, { success: false, message: 'No generated code' });
				return {
					content: [
						{
							type: 'text' as const,
							text: '找不到生成的程式碼 (src/main.cpp)。請確保已使用 Blockly 編輯器生成程式碼。',
						},
					],
					isError: true,
				};
			}

			const { includes, libraries } = extractCodeInfo(code);

			// 取得板卡資訊
			const config = readPlatformioIni(workspacePath);
			const boardType = config?.board || 'arduino_uno';

			logToolCall('get_generated_code', { format }, { success: true, message: `Code size: ${code.length} chars` });

			return {
				content: [
					{
						type: 'text' as const,
						text: JSON.stringify(
							{
								code,
								language: format || 'arduino',
								board: boardType,
								includes,
								libraries,
							},
							null,
							2
						),
					},
				],
			};
		}
	);
}
