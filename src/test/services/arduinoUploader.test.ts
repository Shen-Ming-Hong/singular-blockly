/**
 * @license
 * Copyright 2025 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import * as assert from 'assert';
import * as sinon from 'sinon';
import { ArduinoUploader, CommandExecutor, FileSystemInterface, StreamingCommandExecutor } from '../../services/arduinoUploader';
import { SettingsManager } from '../../services/settingsManager';
import { ArduinoUploadRequest, ArduinoUploadProgress } from '../../types/arduino';

/**
 * 測試套件: ArduinoUploader
 *
 * 涵蓋範圍:
 * 1. getPioPath() - 跨平台路徑測試
 * 2. checkPioInstalled() - PlatformIO CLI 檢查
 * 3. detectDevices() - 裝置偵測
 * 4. parseCompileError() - 編譯錯誤解析
 * 5. upload() - 完整上傳流程（編譯+上傳模式、僅編譯模式）
 * 6. 錯誤處理 - 異常情境
 */

suite('ArduinoUploader Tests', () => {
	let sandbox: sinon.SinonSandbox;
	let mockExecutor: CommandExecutor;
	let mockStreamingExecutor: StreamingCommandExecutor;
	let mockFileSystem: FileSystemInterface;
	let mockSettingsManager: sinon.SinonStubbedInstance<SettingsManager>;

	const testWorkspacePath = '/test/workspace';

	setup(() => {
		sandbox = sinon.createSandbox();

		// Mock CommandExecutor
		mockExecutor = {
			exec: sandbox.stub().resolves({ stdout: '', stderr: '' }),
		};

		// Mock StreamingCommandExecutor
		mockStreamingExecutor = {
			spawn: sandbox.stub().resolves({ code: 0, stdout: 'success', stderr: '' }),
		};

		// Mock FileSystem
		mockFileSystem = {
			existsSync: sandbox.stub().returns(true),
			writeFileSync: sandbox.stub(),
			mkdirSync: sandbox.stub(),
		};

		// Mock SettingsManager
		mockSettingsManager = sandbox.createStubInstance(SettingsManager);
		mockSettingsManager.syncPlatformIOSettings.resolves();
	});

	teardown(() => {
		sandbox.restore();
	});

	suite('getPioPath()', () => {
		test('Should return Windows path on Windows platform', () => {
			const originalPlatform = Object.getOwnPropertyDescriptor(process, 'platform');
			Object.defineProperty(process, 'platform', { value: 'win32' });

			const uploader = new ArduinoUploader(testWorkspacePath, mockExecutor, mockFileSystem, mockSettingsManager);
			const pioPath = uploader.getPioPath();

			assert.ok(pioPath.includes('.platformio'), 'Should include .platformio directory');
			assert.ok(pioPath.includes('Scripts'), 'Should include Scripts directory for Windows');
			assert.ok(pioPath.endsWith('pio.exe'), 'Should end with pio.exe');

			// Restore original platform
			if (originalPlatform) {
				Object.defineProperty(process, 'platform', originalPlatform);
			}
		});

		test('Should return Unix path on non-Windows platform', () => {
			const originalPlatform = Object.getOwnPropertyDescriptor(process, 'platform');
			Object.defineProperty(process, 'platform', { value: 'darwin' });

			const uploader = new ArduinoUploader(testWorkspacePath, mockExecutor, mockFileSystem, mockSettingsManager);
			const pioPath = uploader.getPioPath();

			assert.ok(pioPath.includes('.platformio'), 'Should include .platformio directory');
			assert.ok(pioPath.includes('bin'), 'Should include bin directory for Unix');
			assert.ok(pioPath.endsWith('pio'), 'Should end with pio');

			// Restore original platform
			if (originalPlatform) {
				Object.defineProperty(process, 'platform', originalPlatform);
			}
		});
	});

	suite('checkPioInstalled()', () => {
		test('Should return true when PlatformIO is installed', async () => {
			(mockFileSystem.existsSync as sinon.SinonStub).returns(true);
			(mockExecutor.exec as sinon.SinonStub).resolves({ stdout: 'PlatformIO Core, version 6.1.11', stderr: '' });

			const uploader = new ArduinoUploader(testWorkspacePath, mockExecutor, mockFileSystem, mockSettingsManager);
			const result = await uploader.checkPioInstalled();

			assert.strictEqual(result, true, 'Should return true');
		});

		test('Should return false when PlatformIO CLI path does not exist', async () => {
			(mockFileSystem.existsSync as sinon.SinonStub).returns(false);

			const uploader = new ArduinoUploader(testWorkspacePath, mockExecutor, mockFileSystem, mockSettingsManager);
			const result = await uploader.checkPioInstalled();

			assert.strictEqual(result, false, 'Should return false');
		});

		test('Should return false when PlatformIO version check fails', async () => {
			(mockFileSystem.existsSync as sinon.SinonStub).returns(true);
			(mockExecutor.exec as sinon.SinonStub).rejects(new Error('Command failed'));

			const uploader = new ArduinoUploader(testWorkspacePath, mockExecutor, mockFileSystem, mockSettingsManager);
			const result = await uploader.checkPioInstalled();

			assert.strictEqual(result, false, 'Should return false');
		});
	});

	suite('detectDevices()', () => {
		test('Should detect valid Arduino devices', async () => {
			const deviceList = [
				{ port: 'COM3', description: 'USB-SERIAL CH340 (COM3)', hwid: 'USB VID:PID=1A86:7523' },
				{ port: 'COM4', description: 'Silicon Labs CP210x (COM4)', hwid: 'USB VID:PID=10C4:EA60' },
			];
			(mockExecutor.exec as sinon.SinonStub).resolves({ stdout: JSON.stringify(deviceList), stderr: '' });

			const uploader = new ArduinoUploader(testWorkspacePath, mockExecutor, mockFileSystem, mockSettingsManager);
			const result = await uploader.detectDevices();

			assert.strictEqual(result.hasDevice, true, 'Should detect devices');
			assert.strictEqual(result.port, 'COM3', 'Should return first device port');
			assert.strictEqual(result.devices.length, 2, 'Should return all devices');
		});

		test('Should exclude Bluetooth devices', async () => {
			const deviceList = [
				{ port: 'COM3', description: 'Standard Serial over Bluetooth link (COM3)', hwid: 'BTHENUM' },
				{ port: 'COM4', description: 'USB-SERIAL CH340 (COM4)', hwid: 'USB VID:PID=1A86:7523' },
			];
			(mockExecutor.exec as sinon.SinonStub).resolves({ stdout: JSON.stringify(deviceList), stderr: '' });

			const uploader = new ArduinoUploader(testWorkspacePath, mockExecutor, mockFileSystem, mockSettingsManager);
			const result = await uploader.detectDevices();

			assert.strictEqual(result.hasDevice, true, 'Should detect devices');
			assert.strictEqual(result.devices.length, 1, 'Should exclude Bluetooth device');
			assert.strictEqual(result.devices[0].port, 'COM4', 'Should return non-Bluetooth device');
		});

		test('Should return empty when no devices found', async () => {
			(mockExecutor.exec as sinon.SinonStub).resolves({ stdout: '[]', stderr: '' });

			const uploader = new ArduinoUploader(testWorkspacePath, mockExecutor, mockFileSystem, mockSettingsManager);
			const result = await uploader.detectDevices();

			assert.strictEqual(result.hasDevice, false, 'Should not detect devices');
			assert.strictEqual(result.devices.length, 0, 'Should return empty array');
		});

		test('Should handle detection errors gracefully', async () => {
			(mockExecutor.exec as sinon.SinonStub).rejects(new Error('Detection failed'));

			const uploader = new ArduinoUploader(testWorkspacePath, mockExecutor, mockFileSystem, mockSettingsManager);
			const result = await uploader.detectDevices();

			assert.strictEqual(result.hasDevice, false, 'Should return false on error');
			assert.strictEqual(result.devices.length, 0, 'Should return empty array');
		});
	});

	suite('parseCompileError()', () => {
		test('Should parse GCC error format', () => {
			const stderr = 'src/main.cpp:10:5: error: undefined reference to ledPin';

			const uploader = new ArduinoUploader(testWorkspacePath, mockExecutor, mockFileSystem, mockSettingsManager);
			const result = uploader.parseCompileError(stderr);

			assert.ok(result.includes('undefined reference'), 'Should extract error message');
		});

		test('Should parse missing header error', () => {
			const stderr = 'fatal error: SomeLibrary.h: No such file or directory';

			const uploader = new ArduinoUploader(testWorkspacePath, mockExecutor, mockFileSystem, mockSettingsManager);
			const result = uploader.parseCompileError(stderr);

			assert.ok(result.includes('SomeLibrary.h'), 'Should extract missing header name');
		});

		test('Should handle empty stderr', () => {
			const uploader = new ArduinoUploader(testWorkspacePath, mockExecutor, mockFileSystem, mockSettingsManager);
			const result = uploader.parseCompileError('');

			assert.strictEqual(result, 'Unknown compilation error', 'Should return default message');
		});

		test('Should truncate long error messages', () => {
			const longError = 'error: ' + 'a'.repeat(500);

			const uploader = new ArduinoUploader(testWorkspacePath, mockExecutor, mockFileSystem, mockSettingsManager);
			const result = uploader.parseCompileError(longError);

			assert.ok(result.length <= 200, 'Should truncate to 200 characters');
		});
	});

	suite('upload() - Complete Flow', () => {
		test('Should complete upload flow with device (upload mode)', async () => {
			const request: ArduinoUploadRequest = {
				code: '#include <Arduino.h>\nvoid setup() {}\nvoid loop() {}',
				board: 'esp32',
				lib_deps: ['ESP32Servo@^3.0.6'],
			};

			const progressUpdates: ArduinoUploadProgress[] = [];
			const onProgress = (progress: ArduinoUploadProgress) => {
				progressUpdates.push(progress);
			};

			// Setup mocks
			(mockFileSystem.existsSync as sinon.SinonStub).returns(true);
			(mockExecutor.exec as sinon.SinonStub)
				.withArgs(sinon.match(/--version/))
				.resolves({ stdout: 'PlatformIO Core, version 6.1.11', stderr: '' });
			// Mock spawn for compile and upload (single command with --target upload)
			(mockStreamingExecutor.spawn as sinon.SinonStub).resolves({ code: 0, stdout: 'success', stderr: '' });

			const uploader = new ArduinoUploader(
				testWorkspacePath,
				mockExecutor,
				mockFileSystem,
				mockSettingsManager,
				mockStreamingExecutor
			);
			const result = await uploader.upload(request, onProgress);

			assert.strictEqual(result.success, true, 'Should succeed');
			assert.strictEqual(result.mode, 'upload', 'Should be upload mode');
			assert.strictEqual(result.port, 'auto', 'Should use auto port detection');
			assert.ok(
				progressUpdates.some(p => p.stage === 'completed'),
				'Should have completed stage'
			);
		});

		test('Should fail on upload error when no device connected', async () => {
			const request: ArduinoUploadRequest = {
				code: '#include <Arduino.h>\nvoid setup() {}\nvoid loop() {}',
				board: 'uno',
			};

			const progressUpdates: ArduinoUploadProgress[] = [];
			const onProgress = (progress: ArduinoUploadProgress) => {
				progressUpdates.push(progress);
			};

			// Setup mocks
			(mockFileSystem.existsSync as sinon.SinonStub).returns(true);
			(mockExecutor.exec as sinon.SinonStub)
				.withArgs(sinon.match(/--version/))
				.resolves({ stdout: 'PlatformIO Core, version 6.1.11', stderr: '' });
			// Mock spawn - compile succeeds but upload fails (no device)
			// stdout shows we reached upload phase, stderr has upload error
			(mockStreamingExecutor.spawn as sinon.SinonStub).resolves({
				code: 1,
				stdout: 'Compiling...\nLinking...\nBuilding .pio/build/uno/firmware.hex\nUploading .pio/build/uno/firmware.hex',
				stderr: 'could not open port COM3: No such file or directory',
			});

			const uploader = new ArduinoUploader(
				testWorkspacePath,
				mockExecutor,
				mockFileSystem,
				mockSettingsManager,
				mockStreamingExecutor
			);
			const result = await uploader.upload(request, onProgress);

			// 編譯成功但上傳失敗 = 硬體連接問題
			assert.strictEqual(result.success, false, 'Should fail');
			assert.strictEqual(result.error?.stage, 'uploading', 'Should fail at uploading stage (hardware issue)');
		});

		test('Should fail when PlatformIO is not installed', async () => {
			const request: ArduinoUploadRequest = {
				code: 'void setup() {}',
				board: 'uno',
			};

			// PlatformIO not installed
			(mockFileSystem.existsSync as sinon.SinonStub).returns(false);

			const uploader = new ArduinoUploader(
				testWorkspacePath,
				mockExecutor,
				mockFileSystem,
				mockSettingsManager,
				mockStreamingExecutor
			);
			const result = await uploader.upload(request);

			assert.strictEqual(result.success, false, 'Should fail');
			assert.strictEqual(result.error?.stage, 'checking_pio', 'Should fail at checking_pio stage');
		});

		test('Should fail on compilation error', async () => {
			const request: ArduinoUploadRequest = {
				code: 'invalid code',
				board: 'uno',
			};

			// Setup mocks
			(mockFileSystem.existsSync as sinon.SinonStub).returns(true);
			(mockExecutor.exec as sinon.SinonStub)
				.withArgs(sinon.match(/--version/))
				.resolves({ stdout: 'PlatformIO Core, version 6.1.11', stderr: '' });
			// No device list call needed - we use --target upload directly
			// Mock spawn for compile failure
			(mockStreamingExecutor.spawn as sinon.SinonStub).resolves({
				code: 1,
				stdout: '',
				stderr: 'error: expected declaration',
			});

			const uploader = new ArduinoUploader(
				testWorkspacePath,
				mockExecutor,
				mockFileSystem,
				mockSettingsManager,
				mockStreamingExecutor
			);
			const result = await uploader.upload(request);

			assert.strictEqual(result.success, false, 'Should fail');
			assert.strictEqual(result.error?.stage, 'compiling', 'Should fail at compiling stage');
		});

		test('Should fail on upload error', async () => {
			const request: ArduinoUploadRequest = {
				code: 'void setup() {}',
				board: 'esp32',
			};

			// Setup mocks
			(mockFileSystem.existsSync as sinon.SinonStub).returns(true);
			(mockExecutor.exec as sinon.SinonStub)
				.withArgs(sinon.match(/--version/))
				.resolves({ stdout: 'PlatformIO Core, version 6.1.11', stderr: '' });
			// No device list call needed - we use --target upload directly
			// Mock spawn - compile+upload in single call, fails during upload phase
			// Simulate output that shows compile success but upload failure
			(mockStreamingExecutor.spawn as sinon.SinonStub).resolves({
				code: 1,
				stdout: 'Compiling...\nLinking...\nBuilding .pio/build/esp32/firmware.bin\nUploading .pio/build/esp32/firmware.bin',
				stderr: 'could not open port COM3',
			});

			const uploader = new ArduinoUploader(
				testWorkspacePath,
				mockExecutor,
				mockFileSystem,
				mockSettingsManager,
				mockStreamingExecutor
			);
			const result = await uploader.upload(request);

			assert.strictEqual(result.success, false, 'Should fail');
			assert.strictEqual(result.error?.stage, 'uploading', 'Should fail at uploading stage');
		});
	});
});
