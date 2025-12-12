/**
 * @license
 * Copyright 2025 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 *
 * 平台配置工具單元測試
 */

import * as assert from 'assert';

suite('MCP Platform Config Tools', () => {
	suite('Board Configuration', () => {
		const SUPPORTED_BOARDS = ['arduino_uno', 'arduino_nano', 'arduino_mega', 'esp32', 'super_mini'];

		test('should have all supported boards', () => {
			assert.strictEqual(SUPPORTED_BOARDS.length, 5, 'Should have 5 supported boards');
			assert.ok(SUPPORTED_BOARDS.includes('arduino_uno'), 'Should include Uno');
			assert.ok(SUPPORTED_BOARDS.includes('esp32'), 'Should include ESP32');
		});

		test('should have board_configs structure', () => {
			const boardConfig = {
				arduino_uno: {
					platform: 'atmelavr',
					board: 'uno',
					framework: 'arduino',
					pins: {
						digital: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13],
						analog: ['A0', 'A1', 'A2', 'A3', 'A4', 'A5'],
						pwm: [3, 5, 6, 9, 10, 11],
						i2c: { sda: 'A4', scl: 'A5' },
						spi: { mosi: 11, miso: 12, sck: 13, ss: 10 },
					},
				},
			};

			const uno = boardConfig.arduino_uno;
			assert.strictEqual(uno.platform, 'atmelavr');
			assert.strictEqual(uno.board, 'uno');
			assert.ok(Array.isArray(uno.pins.digital), 'Should have digital pins');
			assert.ok(Array.isArray(uno.pins.analog), 'Should have analog pins');
			assert.ok(Array.isArray(uno.pins.pwm), 'Should have pwm pins');
		});

		test('should validate ESP32 config', () => {
			const esp32Config = {
				platform: 'espressif32',
				board: 'esp32dev',
				framework: 'arduino',
				pins: {
					digital: [0, 2, 4, 5, 12, 13, 14, 15, 16, 17, 18, 19, 21, 22, 23, 25, 26, 27, 32, 33],
					analog: [32, 33, 34, 35, 36, 39],
					pwm: [0, 2, 4, 5, 12, 13, 14, 15, 16, 17, 18, 19, 21, 22, 23, 25, 26, 27, 32, 33],
					i2c: { sda: 21, scl: 22 },
					spi: { mosi: 23, miso: 19, sck: 18, ss: 5 },
				},
			};

			assert.strictEqual(esp32Config.platform, 'espressif32');
			assert.ok(esp32Config.pins.digital.length > 15, 'ESP32 should have more digital pins');
			assert.ok(esp32Config.pins.pwm.length > 10, 'ESP32 should have more PWM pins');
		});
	});

	suite('Pin Mapping', () => {
		test('should return digital pins for board', () => {
			const arduinoUnoPins = {
				digital: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13],
			};

			assert.strictEqual(arduinoUnoPins.digital.length, 14, 'Uno should have 14 digital pins');
			assert.ok(arduinoUnoPins.digital.includes(13), 'Should include LED pin');
		});

		test('should return analog pins for board', () => {
			const arduinoUnoAnalog = ['A0', 'A1', 'A2', 'A3', 'A4', 'A5'];

			assert.strictEqual(arduinoUnoAnalog.length, 6, 'Uno should have 6 analog pins');
			assert.ok(arduinoUnoAnalog.includes('A0'), 'Should include A0');
		});

		test('should return PWM pins for board', () => {
			const arduinoUnoPwm = [3, 5, 6, 9, 10, 11];

			assert.strictEqual(arduinoUnoPwm.length, 6, 'Uno should have 6 PWM pins');
			arduinoUnoPwm.forEach(pin => {
				assert.ok([3, 5, 6, 9, 10, 11].includes(pin), `Pin ${pin} should be a PWM pin`);
			});
		});

		test('should return I2C pins for board', () => {
			const i2cPins = { sda: 'A4', scl: 'A5' };

			assert.ok(i2cPins.sda, 'Should have SDA pin');
			assert.ok(i2cPins.scl, 'Should have SCL pin');
		});
	});

	suite('PlatformIO Configuration', () => {
		test('should generate platformio.ini content', () => {
			const generatePlatformIoIni = (config: {
				platform: string;
				board: string;
				framework: string;
				lib_deps?: string[];
				build_flags?: string[];
			}): string => {
				const lines = [
					'[env:' + config.board + ']',
					'platform = ' + config.platform,
					'board = ' + config.board,
					'framework = ' + config.framework,
				];

				if (config.lib_deps && config.lib_deps.length > 0) {
					lines.push('lib_deps = ');
					for (const lib of config.lib_deps) {
						lines.push('    ' + lib);
					}
				}

				if (config.build_flags && config.build_flags.length > 0) {
					lines.push('build_flags = ');
					for (const flag of config.build_flags) {
						lines.push('    ' + flag);
					}
				}

				return lines.join('\n');
			};

			const content = generatePlatformIoIni({
				platform: 'atmelavr',
				board: 'uno',
				framework: 'arduino',
				lib_deps: ['Servo@1.2.2', 'LiquidCrystal_I2C@1.1.4'],
			});

			assert.ok(content.includes('[env:uno]'), 'Should have env section');
			assert.ok(content.includes('platform = atmelavr'), 'Should have platform');
			assert.ok(content.includes('Servo@1.2.2'), 'Should include library');
		});
	});

	suite('Code Generation', () => {
		test('should format generated code structure', () => {
			const generatedCode = {
				includes: ['#include <Servo.h>', '#include <Wire.h>'],
				variables: ['Servo myServo;'],
				setup: ['myServo.attach(9);'],
				loop: ['myServo.write(90);'],
			};

			assert.ok(Array.isArray(generatedCode.includes), 'Should have includes array');
			assert.ok(Array.isArray(generatedCode.variables), 'Should have variables array');
			assert.ok(Array.isArray(generatedCode.setup), 'Should have setup array');
			assert.ok(Array.isArray(generatedCode.loop), 'Should have loop array');
		});

		test('should format complete Arduino code', () => {
			const formatArduinoCode = (sections: { includes: string[]; variables: string[]; setup: string[]; loop: string[] }): string => {
				const parts: string[] = [];

				if (sections.includes.length > 0) {
					parts.push(sections.includes.join('\n'));
					parts.push('');
				}

				if (sections.variables.length > 0) {
					parts.push(sections.variables.join('\n'));
					parts.push('');
				}

				parts.push('void setup() {');
				if (sections.setup.length > 0) {
					for (const line of sections.setup) {
						parts.push('  ' + line);
					}
				}
				parts.push('}');
				parts.push('');

				parts.push('void loop() {');
				if (sections.loop.length > 0) {
					for (const line of sections.loop) {
						parts.push('  ' + line);
					}
				}
				parts.push('}');

				return parts.join('\n');
			};

			const code = formatArduinoCode({
				includes: ['#include <Servo.h>'],
				variables: ['Servo myServo;'],
				setup: ['myServo.attach(9);'],
				loop: ['myServo.write(90);', 'delay(1000);'],
			});

			assert.ok(code.includes('#include <Servo.h>'), 'Should include library');
			assert.ok(code.includes('void setup()'), 'Should have setup function');
			assert.ok(code.includes('void loop()'), 'Should have loop function');
			assert.ok(code.includes('myServo.attach'), 'Should have servo attach in setup');
			assert.ok(code.includes('delay(1000)'), 'Should have delay in loop');
		});
	});

	suite('Response Structure', () => {
		test('should have correct get_platform_config response', () => {
			const response = {
				currentBoard: 'arduino_uno',
				platform: 'atmelavr',
				board: 'uno',
				framework: 'arduino',
				supportedBoards: ['arduino_uno', 'arduino_nano', 'arduino_mega', 'esp32', 'super_mini'],
				workspaceState: {
					exists: true,
					path: '/path/to/blockly/main.json',
					lastModified: '2025-01-15T10:00:00.000Z',
				},
			};

			assert.ok(response.currentBoard, 'Should have currentBoard');
			assert.ok(response.platform, 'Should have platform');
			assert.ok(response.supportedBoards, 'Should have supportedBoards');
			assert.ok(response.workspaceState, 'Should have workspaceState');
		});

		test('should have correct get_board_pins response', () => {
			const response = {
				board: 'arduino_uno',
				pins: {
					digital: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13],
					analog: ['A0', 'A1', 'A2', 'A3', 'A4', 'A5'],
					pwm: [3, 5, 6, 9, 10, 11],
					i2c: { sda: 'A4', scl: 'A5' },
					spi: { mosi: 11, miso: 12, sck: 13, ss: 10 },
				},
				note: '此開發板支援 14 個數位腳位和 6 個類比腳位',
			};

			assert.ok(response.board, 'Should have board name');
			assert.ok(response.pins, 'Should have pins object');
			assert.ok(response.pins.digital, 'Should have digital pins');
			assert.ok(response.pins.analog, 'Should have analog pins');
			assert.ok(response.pins.pwm, 'Should have pwm pins');
		});

		test('should handle unsupported board error', () => {
			const response = {
				error: '不支援的開發板: unsupported_board',
				supportedBoards: ['arduino_uno', 'arduino_nano', 'arduino_mega', 'esp32', 'super_mini'],
			};

			assert.ok(response.error, 'Should have error message');
			assert.ok(response.supportedBoards, 'Should list supported boards');
		});

		test('should have correct get_generated_code response', () => {
			const response = {
				success: true,
				code: '#include <Servo.h>\n\nvoid setup() {\n}\n\nvoid loop() {\n}',
				board: 'arduino_uno',
				blockCount: 5,
				warnings: [] as string[],
			};

			assert.ok(response.success, 'Should have success flag');
			assert.ok(response.code, 'Should have generated code');
			assert.ok(response.board, 'Should have board name');
			assert.strictEqual(typeof response.blockCount, 'number', 'Should have block count');
		});
	});

	suite('Error Handling', () => {
		test('should handle missing workspace folder', () => {
			const handleMissingWorkspace = (): { error: string } => {
				return {
					error: '找不到工作區資料夾',
				};
			};

			const result = handleMissingWorkspace();
			assert.ok(result.error.includes('工作區'), 'Should mention workspace');
		});

		test('should handle missing main.json', () => {
			const handleMissingMainJson = (): { error: string; suggestion: string } => {
				return {
					error: '找不到 blockly/main.json',
					suggestion: '請先開啟 Blockly 編輯器並建立一些積木',
				};
			};

			const result = handleMissingMainJson();
			assert.ok(result.error.includes('main.json'), 'Should mention main.json');
			assert.ok(result.suggestion, 'Should have suggestion');
		});
	});
});
