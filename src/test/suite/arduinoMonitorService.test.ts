/**
 * @license
 * Copyright 2025 Singular Blockly Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import * as assert from 'assert';
import * as sinon from 'sinon';
import * as vscode from 'vscode';
import { ArduinoMonitorService } from '../../services/arduinoMonitorService';
import { isEsp32Board, ESP32_BOARDS } from '../../types/arduino';

suite('ArduinoMonitorService Test Suite', () => {
	let service: ArduinoMonitorService;
	let sandbox: sinon.SinonSandbox;
	let mockTerminal: any;

	setup(() => {
		sandbox = sinon.createSandbox();
		mockTerminal = {
			sendText: sandbox.stub(),
			show: sandbox.stub(),
			dispose: sandbox.stub(),
		};

		// Mock vscode.window.createTerminal
		sandbox.stub(vscode.window, 'createTerminal').returns(mockTerminal);

		service = new ArduinoMonitorService('e:\\test-workspace');
	});

	teardown(() => {
		service.dispose();
		sandbox.restore();
	});

	suite('isEsp32Board', () => {
		test('should return true for esp32 board', () => {
			assert.strictEqual(isEsp32Board('esp32'), true);
		});

		test('should return true for supermini board', () => {
			assert.strictEqual(isEsp32Board('supermini'), true);
		});

		test('should return false for uno board', () => {
			assert.strictEqual(isEsp32Board('uno'), false);
		});

		test('should return false for mega board', () => {
			assert.strictEqual(isEsp32Board('mega'), false);
		});

		test('should return false for nano board', () => {
			assert.strictEqual(isEsp32Board('nano'), false);
		});

		test('ESP32_BOARDS constant should contain expected boards', () => {
			assert.ok(ESP32_BOARDS.includes('esp32'));
			assert.ok(ESP32_BOARDS.includes('supermini'));
			assert.strictEqual(ESP32_BOARDS.length, 2);
		});
	});

	suite('start()', () => {
		test('should create terminal and start monitor', async () => {
			const result = await service.start('uno', 'e:\\test-workspace');

			assert.strictEqual(result.success, true);
			assert.strictEqual(result.port, 'auto');
			assert.ok(service.isRunning());
			assert.ok((vscode.window.createTerminal as sinon.SinonStub).calledOnce);
			assert.ok(mockTerminal.sendText.calledOnce);
			assert.ok(mockTerminal.show.calledOnce);
		});

		test('should include exception decoder for ESP32 boards', async () => {
			const result = await service.start('esp32', 'e:\\test-workspace');

			assert.strictEqual(result.success, true);

			// Check that the command includes exception decoder filter
			const sentCommand = mockTerminal.sendText.firstCall.args[0];
			assert.ok(sentCommand.includes('--filter'));
			assert.ok(sentCommand.includes('esp32_exception_decoder'));
		});

		test('should not include exception decoder for non-ESP32 boards', async () => {
			const result = await service.start('uno', 'e:\\test-workspace');

			assert.strictEqual(result.success, true);

			// Check that the command does not include exception decoder filter
			const sentCommand = mockTerminal.sendText.firstCall.args[0];
			assert.ok(!sentCommand.includes('esp32_exception_decoder'));
		});

		test('should return success if already running', async () => {
			await service.start('uno', 'e:\\test-workspace');
			const result = await service.start('uno', 'e:\\test-workspace');

			assert.strictEqual(result.success, true);
			// createTerminal should only be called once
			assert.ok((vscode.window.createTerminal as sinon.SinonStub).calledOnce);
		});
	});

	suite('stop()', () => {
		test('should stop the monitor and dispose terminal', async () => {
			await service.start('uno', 'e:\\test-workspace');
			await service.stop();

			assert.strictEqual(service.isRunning(), false);
			assert.strictEqual(service.getCurrentPort(), null);
			assert.ok(mockTerminal.dispose.calledOnce);
		});

		test('should be safe to call when not running', async () => {
			// Should not throw
			await service.stop();
			assert.strictEqual(service.isRunning(), false);
		});
	});

	suite('stopForUpload()', () => {
		test('should stop monitor and record previous state', async () => {
			await service.start('uno', 'e:\\test-workspace');
			await service.stopForUpload();

			assert.strictEqual(service.isRunning(), false);
			assert.ok(mockTerminal.dispose.calledOnce);
		});

		test('should be safe to call when not running', async () => {
			await service.stopForUpload();
			assert.strictEqual(service.isRunning(), false);
		});
	});

	suite('restartAfterUpload()', () => {
		test('should restart if was running before upload', async () => {
			await service.start('uno', 'e:\\test-workspace');
			await service.stopForUpload();
			await service.restartAfterUpload('uno', 'e:\\test-workspace');

			assert.strictEqual(service.isRunning(), true);
			// createTerminal should be called twice
			assert.strictEqual((vscode.window.createTerminal as sinon.SinonStub).callCount, 2);
		});

		test('should not restart if was not running before upload', async () => {
			await service.stopForUpload();
			await service.restartAfterUpload('uno', 'e:\\test-workspace');

			assert.strictEqual(service.isRunning(), false);
			assert.ok((vscode.window.createTerminal as sinon.SinonStub).notCalled);
		});
	});

	suite('isRunning()', () => {
		test('should return false initially', () => {
			assert.strictEqual(service.isRunning(), false);
		});

		test('should return true after start', async () => {
			await service.start('uno', 'e:\\test-workspace');
			assert.strictEqual(service.isRunning(), true);
		});

		test('should return false after stop', async () => {
			await service.start('uno', 'e:\\test-workspace');
			await service.stop();
			assert.strictEqual(service.isRunning(), false);
		});
	});

	suite('getCurrentPort()', () => {
		test('should return null initially', () => {
			assert.strictEqual(service.getCurrentPort(), null);
		});

		test('should return "auto" after start', async () => {
			await service.start('uno', 'e:\\test-workspace');
			assert.strictEqual(service.getCurrentPort(), 'auto');
		});

		test('should return null after stop', async () => {
			await service.start('uno', 'e:\\test-workspace');
			await service.stop();
			assert.strictEqual(service.getCurrentPort(), null);
		});
	});

	suite('onStopped() callback', () => {
		test('should trigger callback with upload_started reason on stopForUpload', async () => {
			let callbackReason: string | null = null;
			service.onStopped(reason => {
				callbackReason = reason;
			});

			await service.start('uno', 'e:\\test-workspace');
			await service.stopForUpload();

			assert.strictEqual(callbackReason, 'upload_started');
		});
	});

	suite('dispose()', () => {
		test('should stop monitor and clean up', async () => {
			await service.start('uno', 'e:\\test-workspace');
			service.dispose();

			assert.strictEqual(service.isRunning(), false);
			assert.ok(mockTerminal.dispose.calledOnce);
		});
	});
});
